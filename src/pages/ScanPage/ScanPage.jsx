import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Alert, Button, Card, Input, Space, Typography, Upload } from 'antd'
import { ArrowLeftOutlined, CameraOutlined, ScanOutlined } from '@ant-design/icons'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { fetchEquipmentByCode } from 'entities/equipment'
import { ROUTES } from 'shared/constants/routes'
import { extractAssetCodeFromImage, preloadOcrWorker, releaseOcrWorker } from 'shared/utils/assetCodeOcr'
import {
  BARCODE_GUIDE_REGION,
  LIVE_NUMBER_GUIDE_REGION,
  toGuideBoxStyle,
  toGuideTextTop,
} from 'shared/utils/scanGuideRegions'
import { withReturnPath } from 'shared/utils/navigation'

const { Title, Text } = Typography
const PHOTO_SCANNER_ID = 'equipment-photo-scanner'

const BARCODE_FORMATS = [
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.CODE_93,
  Html5QrcodeSupportedFormats.ITF,
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.QR_CODE,
]

const decodeBarcodeFromPhoto = async (file) => {
  const scanner = new Html5Qrcode(PHOTO_SCANNER_ID, {
    formatsToSupport: BARCODE_FORMATS,
    useBarCodeDetectorIfSupported: true,
  })
  try {
    return await scanner.scanFile(file, true)
  } finally {
    scanner.clear()
  }
}

const canUseLiveCamera = () => {
  return window.isSecureContext && !!navigator.mediaDevices?.getUserMedia
}

/** 持续扫码超过该时间仍未识别条码时，提示改用 S 编号对准蓝框 */
const BARCODE_FALLBACK_HINT_MS = 3000

export const ScanPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const videoRef = useRef(null)
  const liveScannerRef = useRef(null)
  const processingRef = useRef(false)
  const [manualCode, setManualCode] = useState('')
  const [status, setStatus] = useState('idle') // idle | starting | scanning | error
  const [statusHint, setStatusHint] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [showNumberGuide, setShowNumberGuide] = useState(false)
  const liveCameraAvailable = canUseLiveCamera()

  const stopScanner = useCallback(async () => {
    const liveScanner = liveScannerRef.current
    if (liveScanner) {
      try {
        await liveScanner.stop()
      } catch {
        // ignore cleanup errors
      }
      liveScannerRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [])

  const navigateToCode = useCallback(async (code) => {
    const assetCode = (code || '').trim()
    if (!assetCode || processingRef.current) return
    processingRef.current = true
    setErrorMsg('')
    try {
      await fetchEquipmentByCode(assetCode)
      await stopScanner()
      navigate(ROUTES.EQUIPMENT(assetCode), { state: withReturnPath(location) })
    } catch {
      setErrorMsg(`未找到编号为「${assetCode}」的设备，请确认条码是否正确，或联系管理员导入数据`)
      setStatus('idle')
      processingRef.current = false
    }
  }, [navigate, location, stopScanner])

  const startLiveScan = async () => {
    if (!liveCameraAvailable) {
      setErrorMsg('当前环境无法使用实时相机（手机 HTTP 访问需 HTTPS，或请用「拍照识别」）')
      setStatus('error')
      return
    }

    setStatus('starting')
    setStatusHint('')
    setErrorMsg('')
    setShowNumberGuide(false)

    try {
      await stopScanner()
      processingRef.current = false
      const { createLiveBarcodeScanner } = await import('shared/utils/liveBarcodeScanner')
      const liveScanner = createLiveBarcodeScanner()
      liveScannerRef.current = liveScanner
      await liveScanner.start(videoRef.current, (decodedText) => {
        navigateToCode(decodedText)
      })
      const info = liveScanner.getStreamInfo()
      if (info?.width && info?.height) {
        setStatusHint(`高清视频流 ${info.width}×${info.height}${info.frameRate ? ` @${Math.round(info.frameRate)}fps` : ''}，请先对准条形码`)
      }
      setStatus('scanning')
    } catch (error) {
      const msg = error?.message || String(error)
      setErrorMsg(
        msg.includes('NotAllowed')
          ? '相机权限被拒绝，请在浏览器设置中允许访问相机'
          : `无法启动相机：${msg}`
      )
      setStatus('error')
      await stopScanner()
    }
  }

  const scanFromPhoto = async (file) => {
    if (!file) return false
    setStatus('starting')
    setStatusHint('')
    setErrorMsg('')
    setShowNumberGuide(false)
    try {
      await stopScanner()
      processingRef.current = false

      try {
        const barcode = await decodeBarcodeFromPhoto(file)
        await navigateToCode(barcode)
        return false
      } catch {
        setStatusHint('条码未识别，正在识别下方编号文字…')
        const code = await extractAssetCodeFromImage(file)
        if (code) {
          setManualCode(code)
          await navigateToCode(code)
          return false
        }
      }

      setErrorMsg('未能识别条形码或下方编号，请拍清条码下方「S 开头 7 位数字」，或手动输入')
      setStatus('idle')
    } catch {
      setErrorMsg('识别失败，请重试或手动输入编号')
      setStatus('idle')
    } finally {
      setStatusHint('')
    }
    return false
  }

  useEffect(() => {
    preloadOcrWorker()
    return () => {
      stopScanner()
      releaseOcrWorker()
    }
  }, [stopScanner])

  useEffect(() => {
    if (status !== 'scanning') {
      setShowNumberGuide(false)
      return undefined
    }

    const timerId = window.setTimeout(() => {
      if (!processingRef.current) {
        setShowNumberGuide(true)
      }
    }, BARCODE_FALLBACK_HINT_MS)

    return () => clearTimeout(timerId)
  }, [status])

  return (
    <div className="page-container">
      <div className="page-header">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(ROUTES.HOME)}>返回</Button>
          <Title level={3} style={{ margin: 0 }}>扫码更新设备</Title>
        </Space>
      </div>

      <Card>
        <Text type="secondary">扫描设备条形码（资产编号 S 开头），或手动输入编号</Text>

        {!liveCameraAvailable && (
          <Alert
            style={{ marginTop: 12 }}
            type="warning"
            showIcon
            message="实时扫码需要 HTTPS"
            description="手机通过 http://局域网IP 访问时，浏览器不允许打开相机。请使用下方「拍照识别」，或改用 https 访问前端。"
          />
        )}

        {errorMsg && (
          <Alert style={{ marginTop: 12 }} type="error" showIcon message={errorMsg} closable onClose={() => setErrorMsg('')} />
        )}

        {statusHint && (
          <Alert style={{ marginTop: 12 }} type="info" showIcon message={statusHint} />
        )}

        {status === 'scanning' && showNumberGuide && (
          <Alert
            style={{ marginTop: 12 }}
            type="warning"
            showIcon
            message="条码未识别"
            description="印刷模糊的标签请把 S 编号（如 S2402084）移入画面蓝框，保持稳定 1–2 秒"
          />
        )}

        <div
          className="scan-live-wrap"
          style={{
            marginTop: 16,
            display: status === 'starting' || status === 'scanning' ? 'block' : 'none',
          }}
        >
          <div className="scan-video-stage">
            <video
              ref={videoRef}
              className="scan-live-video"
              playsInline
              muted
              autoPlay
            />
            {status === 'scanning' && !showNumberGuide && (
              <>
                <div
                  className="scan-guide scan-guide--barcode"
                  style={toGuideBoxStyle(BARCODE_GUIDE_REGION)}
                  aria-hidden
                />
                <Text
                  className="scan-guide-text"
                  style={{ top: toGuideTextTop(BARCODE_GUIDE_REGION) }}
                >
                  将条形码横置对准框内
                </Text>
              </>
            )}
            {status === 'scanning' && showNumberGuide && (
              <>
                <div className="scan-fallback-hint" role="status">
                  条码扫不出？请将 S 编号对准框内
                </div>
                <div
                  className="scan-guide scan-guide--highlight"
                  style={toGuideBoxStyle(LIVE_NUMBER_GUIDE_REGION)}
                  aria-hidden
                />
                <Text
                  className="scan-guide-text"
                  style={{ top: toGuideTextTop(LIVE_NUMBER_GUIDE_REGION) }}
                >
                  将 S 编号对准框内
                </Text>
              </>
            )}
          </div>
        </div>
        <div id={PHOTO_SCANNER_ID} style={{ display: 'none' }} aria-hidden />

        <Space direction="vertical" style={{ width: '100%', marginTop: 16 }} size="middle">
          {status !== 'scanning' && (
            <Button
              type="primary"
              block
              size="large"
              icon={<ScanOutlined />}
              loading={status === 'starting'}
              onClick={startLiveScan}
            >
              开启实时扫码
            </Button>
          )}

          {status === 'scanning' && (
            <Button
              block
              onClick={async () => {
                setShowNumberGuide(false)
                await stopScanner()
                setStatus('idle')
              }}
            >
              关闭相机
            </Button>
          )}

          <Upload
            accept="image/*"
            capture="environment"
            showUploadList={false}
            beforeUpload={scanFromPhoto}
          >
            <Button block size="large" icon={<CameraOutlined />} loading={status === 'starting'}>
              拍照识别（条码/编号）
            </Button>
          </Upload>
          <Text type="secondary" style={{ fontSize: 12 }}>
            校资标签条码印刷较糊时，实时/拍照会自动识别下方 S 编号；首次 OCR 需加载引擎约 2–3 秒
          </Text>
        </Space>

        <Space.Compact style={{ width: '100%', marginTop: 16 }}>
          <Input
            placeholder="手动输入资产编号，如 S2509288"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            onPressEnter={() => navigateToCode(manualCode)}
          />
          <Button type="primary" onClick={() => navigateToCode(manualCode)}>查询</Button>
        </Space.Compact>
      </Card>
    </div>
  )
}
