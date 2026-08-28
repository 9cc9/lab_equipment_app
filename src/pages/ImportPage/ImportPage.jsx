import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Space, Typography, Upload, message } from 'antd'
import { ArrowLeftOutlined, DownloadOutlined, UploadOutlined } from '@ant-design/icons'
import { exportEquipmentExcel, importEquipmentExcel } from 'entities/equipment'
import { ROUTES } from 'shared/constants/routes'

const { Title, Paragraph, Text } = Typography

export const ImportPage = () => {
  const navigate = useNavigate()
  const [uploading, setUploading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [result, setResult] = useState(null)

  const handleUpload = async (file) => {
    setUploading(true)
    setResult(null)
    try {
      const data = await importEquipmentExcel(file)
      setResult(data)
      message.success(`导入完成：成功 ${data.successCount} 条`)
    } catch (error) {
      message.error(error.message || '导入失败')
    } finally {
      setUploading(false)
    }
    return false
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      await exportEquipmentExcel()
      message.success('导出成功')
    } catch (error) {
      message.error(error.message || '导出失败')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(ROUTES.HOME)}>返回</Button>
          <Title level={3} style={{ margin: 0 }}>导入 / 导出设备数据</Title>
        </Space>
      </div>

      <Card title="导出数据" style={{ marginBottom: 16 }}>
        <Paragraph>
          按导入模板的「完整表」格式导出当前系统中的全部设备数据，包含扫码/批量更新后的现状与房间信息。
        </Paragraph>
        <Button icon={<DownloadOutlined />} loading={exporting} onClick={handleExport}>
          导出 Excel
        </Button>
      </Card>

      <Card title="导入数据">
        <Paragraph>
          请上传 Excel 文件（读取「完整表」Sheet），系统将按资产编号导入或更新设备，并自动解析房间信息。
        </Paragraph>
        <Upload beforeUpload={handleUpload} accept=".xls,.xlsx" showUploadList={false}>
          <Button icon={<UploadOutlined />} type="primary" loading={uploading}>
            选择 Excel 文件
          </Button>
        </Upload>

        {result && (
          <div style={{ marginTop: 24 }}>
            <Paragraph>
              <Text strong>总行数：</Text>{result.totalRows}<br />
              <Text strong>成功：</Text>{result.successCount}<br />
              <Text strong>失败：</Text>{result.failCount}<br />
              <Text strong>房间数：</Text>{result.roomCount}
            </Paragraph>
            {result.errors?.length > 0 && (
              <>
                <Text type="danger">部分错误：</Text>
                <ul>
                  {result.errors.map((err) => (
                    <li key={err}>{err}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}
