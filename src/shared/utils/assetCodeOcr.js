/** 资产编号：S + 7 位数字，如 S2402084 */
const STRICT_ASSET_CODE = /^S[1-9][0-9]{6}$/
const FIVE_PREFIX_CODE = /^5[1-9][0-9]{6}$/
/** 词级置信度兜底阈值（Tesseract 词级分数常偏低，优先看字符级） */
const MIN_WORD_CONFIDENCE = 40
/** 8 位编号每个字符的最低置信度 */
const MIN_SYMBOL_CONFIDENCE = 70
/** 8 位编号字符平均置信度 */
const MIN_SYMBOL_AVG_CONFIDENCE = 80
/** 实时 OCR 连续相同结果次数，降低单帧误识 */
const LIVE_VOTE_REQUIRED = 3

let sharedWorkerPromise = null
let ocrBusy = false

const loadImage = (file) => new Promise((resolve, reject) => {
  const url = URL.createObjectURL(file)
  const img = new Image()
  img.onload = () => {
    URL.revokeObjectURL(url)
    resolve(img)
  }
  img.onerror = () => {
    URL.revokeObjectURL(url)
    reject(new Error('图片加载失败'))
  }
  img.src = url
})

/** 实时视频：用户将编号对准画面中的框（与 UI 蓝框一致） */
export const LIVE_NUMBER_GUIDE_REGION = {
  leftRatio: 0.18,
  topRatio: 0.5,
  widthRatio: 0.64,
  heightRatio: 0.14,
}

/** 拍照整图：编号在标签下方 */
export const NUMBER_STRIP_REGION = {
  leftRatio: 0.1,
  topRatio: 0.68,
  widthRatio: 0.8,
  heightRatio: 0.2,
}

/** 实时视频：条码对准框（仅 UI，解码仍扫全画面） */
export const BARCODE_GUIDE_REGION = {
  leftRatio: 0.1,
  topRatio: 0.38,
  widthRatio: 0.8,
  heightRatio: 0.24,
}

const cropRegion = (img, region = NUMBER_STRIP_REGION) => {
  const canvas = document.createElement('canvas')
  const sourceX = Math.floor(img.width * region.leftRatio)
  const sourceY = Math.floor(img.height * region.topRatio)
  const sourceWidth = Math.floor(img.width * region.widthRatio)
  const sourceHeight = Math.floor(img.height * region.heightRatio)
  canvas.width = sourceWidth
  canvas.height = sourceHeight
  const ctx = canvas.getContext('2d')
  ctx.drawImage(
    img,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    canvas.width,
    canvas.height
  )
  return canvas
}

const cropVideoRegion = (videoElement, region = LIVE_NUMBER_GUIDE_REGION, scale = 3) => {
  const vw = videoElement.videoWidth
  const vh = videoElement.videoHeight
  if (!vw || !vh) return null

  const sourceX = Math.floor(vw * region.leftRatio)
  const sourceY = Math.floor(vh * region.topRatio)
  const sourceWidth = Math.floor(vw * region.widthRatio)
  const sourceHeight = Math.floor(vh * region.heightRatio)

  const canvas = document.createElement('canvas')
  canvas.width = sourceWidth * scale
  canvas.height = sourceHeight * scale
  const ctx = canvas.getContext('2d')
  ctx.drawImage(
    videoElement,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    canvas.width,
    canvas.height
  )
  return enhanceCanvasForOcr(canvas)
}

const enhanceCanvasForOcr = (sourceCanvas) => {
  const canvas = document.createElement('canvas')
  canvas.width = sourceCanvas.width
  canvas.height = sourceCanvas.height
  const ctx = canvas.getContext('2d')
  ctx.drawImage(sourceCanvas, 0, 0)

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const { data } = imageData
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
    const enhanced = Math.min(255, Math.max(0, (gray - 85) * 1.75))
    data[i] = enhanced
    data[i + 1] = enhanced
    data[i + 2] = enhanced
  }
  ctx.putImageData(imageData, 0, 0)
  return canvas
}

const normalizeToken = (text) => (
  (text || '')
    .replace(/\s/g, '')
    .replace(/[oO~©]/g, '0')
    .replace(/[lI|]/g, '1')
    .replace(/[^S0-9]/gi, '')
    .toUpperCase()
)

export const parseAssetCodeToken = (text) => {
  const normalized = normalizeToken(text)
  if (!normalized) return null
  if (STRICT_ASSET_CODE.test(normalized)) return normalized
  if (FIVE_PREFIX_CODE.test(normalized)) return `S${normalized.slice(1)}`
  const embedded = normalized.match(/5([1-9][0-9]{6})/)
  if (embedded) return `S${embedded[1]}`
  return null
}

const collectCandidates = (data) => {
  const candidates = []
  const push = (token, confidence = 0, source = 'line') => {
    const normalized = normalizeToken(token)
    const code = parseAssetCodeToken(token)
    if (!code) return
    const isExact = normalized.length === 8
      && (STRICT_ASSET_CODE.test(normalized) || FIVE_PREFIX_CODE.test(normalized))
    candidates.push({ code, confidence: confidence || 0, source, isExact })
  }

  for (const word of data.words || []) {
    push(word.text, word.confidence, 'word')
  }
  if (!candidates.some((item) => item.isExact && item.source === 'word')) {
    push(data.text, data.confidence, 'line')
  }
  return candidates
}

const extractCodeFromSymbols = (symbols) => {
  const tokens = (symbols || [])
    .map((symbol) => ({
      text: normalizeToken(symbol.text),
      confidence: symbol.confidence || 0,
    }))
    .filter((symbol) => symbol.text.length === 1)

  let best = null
  for (let index = 0; index <= tokens.length - 8; index += 1) {
    const slice = tokens.slice(index, index + 8)
    const raw = slice.map((symbol) => symbol.text).join('')
    const code = parseAssetCodeToken(raw)
    if (!code) continue

    const confidences = slice.map((symbol) => symbol.confidence)
    const minConfidence = Math.min(...confidences)
    const avgConfidence = confidences.reduce((sum, value) => sum + value, 0) / confidences.length
    if (minConfidence < MIN_SYMBOL_CONFIDENCE || avgConfidence < MIN_SYMBOL_AVG_CONFIDENCE) {
      continue
    }

    const candidate = { code, avgConfidence, minConfidence }
    if (!best || candidate.avgConfidence > best.avgConfidence) {
      best = candidate
    }
  }
  return best?.code || null
}

const pickBestCandidate = (data) => {
  const fromSymbols = extractCodeFromSymbols(data.symbols)
  if (fromSymbols) return fromSymbols

  const candidates = collectCandidates(data)
  if (!candidates.length) return null

  const exactWords = candidates.filter((item) => item.isExact && item.source === 'word')
  if (exactWords.length) {
    exactWords.sort((a, b) => b.confidence - a.confidence)
    const bestWord = exactWords[0]
    if (bestWord.confidence >= MIN_WORD_CONFIDENCE) return bestWord.code
  }

  candidates.sort((a, b) => b.confidence - a.confidence)
  const best = candidates[0]
  if (best.isExact && best.source === 'word' && best.confidence >= MIN_WORD_CONFIDENCE) {
    return best.code
  }
  return null
}

const getSharedWorker = async () => {
  if (!sharedWorkerPromise) {
    sharedWorkerPromise = (async () => {
      const { createWorker } = await import('tesseract.js')
      return createWorker('eng')
    })()
  }
  return sharedWorkerPromise
}

const withOcrWorker = async (task) => {
  if (ocrBusy) return null
  ocrBusy = true
  try {
    const worker = await getSharedWorker()
    return await task(worker)
  } finally {
    ocrBusy = false
  }
}

export const recognizeAssetCodeFromCanvas = async (canvas) => withOcrWorker(async (worker) => {
  const enhanced = enhanceCanvasForOcr(canvas)
  await worker.setParameters({ tessedit_pageseg_mode: '8' })
  const { data } = await worker.recognize(enhanced)
  return pickBestCandidate(data)
})

export const preloadOcrWorker = () => {
  getSharedWorker().catch(() => {
    sharedWorkerPromise = null
  })
}

export const extractAssetCodeFromImage = async (file) => {
  const img = await loadImage(file)
  const cropped = cropRegion(img)
  const scaled = document.createElement('canvas')
  scaled.width = cropped.width * 4
  scaled.height = cropped.height * 4
  scaled.getContext('2d').drawImage(cropped, 0, 0, scaled.width, scaled.height)

  const primary = await recognizeAssetCodeFromCanvas(scaled)
  if (primary) return primary

  const scaledAlt = document.createElement('canvas')
  scaledAlt.width = cropped.width * 5
  scaledAlt.height = cropped.height * 5
  scaledAlt.getContext('2d').drawImage(cropped, 0, 0, scaledAlt.width, scaledAlt.height)
  return recognizeAssetCodeFromCanvas(scaledAlt)
}

/**
 * 实时视频流：持续识别编号条文字（同一条 video 流，非拍照）
 * 适用于条码印刷差、无法解码的标签
 */
export const startLiveNumberOcr = (videoElement, onDetected, isRunning, intervalMs = 400) => {
  let timerId = null
  let voteStreak = { code: null, count: 0 }

  const tick = async () => {
    if (!isRunning()) return
    const canvas = cropVideoRegion(videoElement)
    if (canvas) {
      const code = await recognizeAssetCodeFromCanvas(canvas)
      if (code && isRunning()) {
        if (voteStreak.code === code) {
          voteStreak.count += 1
        } else {
          voteStreak = { code, count: 1 }
        }
        if (voteStreak.count >= LIVE_VOTE_REQUIRED) {
          onDetected(code)
          return
        }
      } else {
        voteStreak = { code: null, count: 0 }
      }
    }
    timerId = window.setTimeout(tick, intervalMs)
  }

  timerId = window.setTimeout(tick, intervalMs)

  return () => {
    if (timerId) {
      clearTimeout(timerId)
      timerId = null
    }
  }
}

export const releaseOcrWorker = async () => {
  if (!sharedWorkerPromise) return
  try {
    const worker = await sharedWorkerPromise
    await worker.terminate()
  } catch {
    // ignore
  }
  sharedWorkerPromise = null
  ocrBusy = false
}
