import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Alert, Button, Card, Input, Space, Typography, Upload } from 'antd'
import { ArrowLeftOutlined, CameraOutlined, ScanOutlined } from '@ant-design/icons'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { fetchEquipmentByCode } from 'entities/equipment'
import { ROUTES } from 'shared/constants/routes'
import { withReturnPath } from 'shared/utils/navigation'

const { Title, Text } = Typography
const SCANNER_ID = 'equipment-barcode-scanner'

const BARCODE_FORMATS = [
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.CODE_93,
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.QR_CODE,
]

const canUseLiveCamera = () => {
  return window.isSecureContext && !!navigator.mediaDevices?.getUserMedia
}

export const ScanPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const scannerRef = useRef(null)
  const processingRef = useRef(false)
  const [manualCode, setManualCode] = useState('')
  const [status, setStatus] = useState('idle') // idle | starting | scanning | error
  const [errorMsg, setErrorMsg] = useState('')
  const liveCameraAvailable = canUseLiveCamera()

  const stopScanner = useCallback(async () => {
    const scanner = scannerRef.current
    if (!scanner) return
    try {
      if (scanner.isScanning) {
        await scanner.stop()
      }
      scanner.clear()
    } catch {
      // ignore cleanup errors
    }
    scannerRef.current = null
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
    setErrorMsg('')

    try {
      await stopScanner()
      const scanner = new Html5Qrcode(SCANNER_ID, {
        formatsToSupport: BARCODE_FORMATS,
        useBarCodeDetectorIfSupported: true,
      })
      scannerRef.current = scanner

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          aspectRatio: 1.777778,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const width = Math.min(viewfinderWidth * 0.9, 340)
            const height = Math.min(viewfinderHeight * 0.4, 160)
            return { width, height }
          },
        },
        (decodedText) => {
          navigateToCode(decodedText)
        },
        () => {}
      )
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
    setErrorMsg('')
    try {
      await stopScanner()
      const scanner = new Html5Qrcode(SCANNER_ID, {
        formatsToSupport: BARCODE_FORMATS,
        useBarCodeDetectorIfSupported: true,
      })
      const result = await scanner.scanFile(file, false)
      scanner.clear()
      await navigateToCode(result)
    } catch {
      setErrorMsg('未能从照片中识别条形码，请对准条码重拍，或改用手动输入编号')
      setStatus('idle')
    }
    return false
  }

  useEffect(() => {
    return () => {
      stopScanner()
    }
  }, [stopScanner])

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

        <div
          id={SCANNER_ID}
          className="scan-box"
          style={{ marginTop: 16, minHeight: status === 'scanning' ? 280 : 0 }}
        />

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
            <Button block onClick={stopScanner}>关闭相机</Button>
          )}

          <Upload
            accept="image/*"
            capture="environment"
            showUploadList={false}
            beforeUpload={scanFromPhoto}
          >
            <Button block size="large" icon={<CameraOutlined />}>
              拍照识别条码
            </Button>
          </Upload>
          <Text type="secondary" style={{ fontSize: 12 }}>
            「拍照识别」在 HTTP 下也可用，适合手机局域网访问
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
