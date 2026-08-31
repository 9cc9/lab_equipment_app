/** 资产编号：S + 7 位数字，如 S2402084 */
const STRICT_ASSET_CODE = /^S[1-9][0-9]{6}$/
const FIVE_PREFIX_CODE = /^5[1-9][0-9]{6}$/
const MIN_OCR_CONFIDENCE = 15

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
  const push = (token, confidence = 0) => {
    const code = parseAssetCodeToken(token)
    if (code) candidates.push({ code, confidence: confidence || 0 })
  }
  push(data.text, data.confidence)
  for (const word of data.words || []) push(word.text, word.confidence)
  return candidates
}

const pickBestCandidate = (candidates) => {
  if (!candidates.length) return null
  candidates.sort((a, b) => b.confidence - a.confidence)
  return candidates[0].confidence >= MIN_OCR_CONFIDENCE ? candidates[0].code : null
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
  return pickBestCandidate(collectCandidates(data))
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
  return recognizeAssetCodeFromCanvas(scaled)
}

/**
 * 实时视频流：持续识别编号条文字（同一条 video 流，非拍照）
 * 适用于条码印刷差、无法解码的标签
 */
export const startLiveNumberOcr = (videoElement, onDetected, isRunning, intervalMs = 400) => {
  let timerId = null

  const tick = async () => {
    if (!isRunning()) return
    const canvas = cropVideoRegion(videoElement)
    if (canvas) {
      const code = await recognizeAssetCodeFromCanvas(canvas)
      if (code && isRunning()) {
        onDetected(code)
        return
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
