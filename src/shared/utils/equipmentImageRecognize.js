import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'

const PHOTO_SCANNER_ID = 'equipment-photo-scanner'

const BARCODE_FORMATS = [
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.CODE_93,
  Html5QrcodeSupportedFormats.ITF,
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.QR_CODE,
]

let barcodeScanner = null

const getBarcodeScanner = () => {
  if (!barcodeScanner) {
    barcodeScanner = new Html5Qrcode(PHOTO_SCANNER_ID, {
      formatsToSupport: BARCODE_FORMATS,
      useBarCodeDetectorIfSupported: true,
    })
  }
  return barcodeScanner
}

export const decodeBarcodeFromFile = async (file) => {
  const scanner = getBarcodeScanner()
  return scanner.scanFile(file, false)
}

/**
 * 统一识别：先条码，再 OCR 编号
 * @returns {{ code: string, method: 'barcode'|'ocr' } | null}
 */
export const recognizeFromFile = async (file, { onOcrStart } = {}) => {
  try {
    const code = await decodeBarcodeFromFile(file)
    if (code?.trim()) {
      return { code: code.trim(), method: 'barcode' }
    }
  } catch {
    // 条码失败，继续 OCR
  }

  onOcrStart?.()
  const { extractAssetCodeFromImage } = await import('shared/utils/assetCodeOcr')
  const code = await extractAssetCodeFromImage(file)
  if (code) {
    return { code, method: 'ocr' }
  }
  return null
}

export const canUseLiveCamera = () => (
  window.isSecureContext && !!navigator.mediaDevices?.getUserMedia
)

export const startCamera = async (videoElement) => {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      facingMode: { ideal: 'environment' },
      width: { min: 640, ideal: 1920, max: 4096 },
      height: { min: 480, ideal: 1080, max: 2160 },
    },
  })
  videoElement.srcObject = stream
  await videoElement.play()
  return stream
}

export const stopCamera = (videoElement, stream) => {
  stream?.getTracks().forEach((track) => track.stop())
  if (videoElement) {
    videoElement.srcObject = null
  }
}

export const captureVideoFrame = (videoElement) => new Promise((resolve, reject) => {
  if (!videoElement?.videoWidth) {
    reject(new Error('相机未就绪'))
    return
  }
  const canvas = document.createElement('canvas')
  canvas.width = videoElement.videoWidth
  canvas.height = videoElement.videoHeight
  const ctx = canvas.getContext('2d')
  ctx.drawImage(videoElement, 0, 0)
  canvas.toBlob(
    (blob) => {
      if (!blob) {
        reject(new Error('截帧失败'))
        return
      }
      resolve(new File([blob], 'frame.jpg', { type: 'image/jpeg' }))
    },
    'image/jpeg',
    0.92
  )
})
