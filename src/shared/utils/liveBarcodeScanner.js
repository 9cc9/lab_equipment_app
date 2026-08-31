import {
  BarcodeFormat,
  DecodeHintType,
} from '@zxing/library'
import { BrowserMultiFormatReader } from '@zxing/browser'

import { startLiveNumberOcr } from './assetCodeOcr'

const NATIVE_FORMATS = ['code_128', 'code_39', 'code_93', 'itf', 'ean_13']

const HD_CONSTRAINTS_CANDIDATES = [
  {
    audio: false,
    video: {
      facingMode: { ideal: 'environment' },
      width: { ideal: 1920, min: 1280 },
      height: { ideal: 1080, min: 720 },
      frameRate: { ideal: 30, min: 15 },
    },
  },
  {
    audio: false,
    video: {
      facingMode: { ideal: 'environment' },
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 24 },
    },
  },
  {
    audio: false,
    video: {
      facingMode: { ideal: 'environment' },
    },
  },
]

const openHdCameraStream = async () => {
  let lastError = null
  for (const constraints of HD_CONSTRAINTS_CANDIDATES) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      await enhanceCameraTrack(stream)
      return stream
    } catch (error) {
      lastError = error
    }
  }
  throw lastError || new Error('无法打开相机')
}

const enhanceCameraTrack = async (stream) => {
  const track = stream.getVideoTracks()[0]
  if (!track) return

  const caps = typeof track.getCapabilities === 'function' ? track.getCapabilities() : {}
  const advanced = []

  if (caps.focusMode?.includes('continuous')) {
    advanced.push({ focusMode: 'continuous' })
  }
  if (caps.exposureMode?.includes('continuous')) {
    advanced.push({ exposureMode: 'continuous' })
  }
  if (caps.whiteBalanceMode?.includes('continuous')) {
    advanced.push({ whiteBalanceMode: 'continuous' })
  }

  if (advanced.length > 0) {
    try {
      await track.applyConstraints({ advanced })
    } catch {
      // 部分机型不支持，忽略
    }
  }
}

const getStreamInfo = (stream) => {
  const track = stream?.getVideoTracks?.()?.[0]
  if (!track) return null
  const settings = track.getSettings?.() || {}
  return {
    width: settings.width,
    height: settings.height,
    frameRate: settings.frameRate,
    facingMode: settings.facingMode,
  }
}

const waitForVideoReady = (videoElement) => new Promise((resolve, reject) => {
  if (videoElement.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
    resolve()
    return
  }
  const onReady = () => {
    cleanup()
    resolve()
  }
  const onError = () => {
    cleanup()
    reject(new Error('视频流启动失败'))
  }
  const cleanup = () => {
    videoElement.removeEventListener('loadedmetadata', onReady)
    videoElement.removeEventListener('canplay', onReady)
    videoElement.removeEventListener('error', onError)
  }
  videoElement.addEventListener('loadedmetadata', onReady)
  videoElement.addEventListener('canplay', onReady)
  videoElement.addEventListener('error', onError)
})

const startNativeBarcodeDetector = (videoElement, onDetected, isRunning) => {
  if (typeof window.BarcodeDetector !== 'function') {
    return null
  }

  let detector
  try {
    detector = new window.BarcodeDetector({ formats: NATIVE_FORMATS })
  } catch {
    return null
  }

  let lastScanAt = 0
  const scanIntervalMs = 80
  let rafId = null

  const loop = async (timestamp) => {
    if (!isRunning()) return
    if (
      videoElement.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
      && timestamp - lastScanAt >= scanIntervalMs
    ) {
      lastScanAt = timestamp
      try {
        const codes = await detector.detect(videoElement)
        for (const code of codes) {
          const value = (code.rawValue || '').trim()
          if (value) {
            onDetected(value)
            return
          }
        }
      } catch {
        // 单帧失败继续
      }
    }
    rafId = requestAnimationFrame(loop)
  }

  rafId = requestAnimationFrame(loop)
  return () => {
    if (rafId) cancelAnimationFrame(rafId)
  }
}

const startZxingVideoDecoder = (videoElement, onDetected, isRunning) => {
  const hints = new Map()
  hints.set(DecodeHintType.POSSIBLE_FORMATS, [
    BarcodeFormat.CODE_128,
    BarcodeFormat.CODE_39,
    BarcodeFormat.CODE_93,
    BarcodeFormat.ITF,
    BarcodeFormat.EAN_13,
  ])
  hints.set(DecodeHintType.TRY_HARDER, true)

  const reader = new BrowserMultiFormatReader(hints, 100)

  return reader.decodeFromVideoElement(
    videoElement,
    (result) => {
      if (!isRunning() || !result) return
      const value = (result.getText() || '').trim()
      if (value) onDetected(value)
    }
  ).then((controls) => ({
    stop: () => {
      controls.stop()
      reader.reset()
    },
  }))
}

export const createLiveBarcodeScanner = () => {
  let stream = null
  let running = false
  let stopNativeLoop = null
  let stopLiveOcr = null
  let zxingHandle = null

  return {
    async start(videoElement, onDetected) {
      running = true
      stream = await openHdCameraStream()

      videoElement.setAttribute('playsinline', 'true')
      videoElement.setAttribute('webkit-playsinline', 'true')
      videoElement.muted = true
      videoElement.playsInline = true
      videoElement.srcObject = stream
      await videoElement.play()
      await waitForVideoReady(videoElement)

      const isRunning = () => running

      stopNativeLoop = startNativeBarcodeDetector(videoElement, onDetected, isRunning)
      zxingHandle = await startZxingVideoDecoder(videoElement, onDetected, isRunning)
      stopLiveOcr = startLiveNumberOcr(videoElement, onDetected, isRunning, 400)

      return getStreamInfo(stream)
    },

    async stop() {
      running = false
      if (stopNativeLoop) {
        stopNativeLoop()
        stopNativeLoop = null
      }
      if (stopLiveOcr) {
        stopLiveOcr()
        stopLiveOcr = null
      }
      if (zxingHandle) {
        try {
          zxingHandle.stop()
        } catch {
          // ignore
        }
        zxingHandle = null
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
        stream = null
      }
    },

    getStreamInfo() {
      return getStreamInfo(stream)
    },
  }
}
