import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button, Card, Col, Input, List, Row, Space, Spin, Tag, Typography, message } from 'antd'
import { BarcodeOutlined, DownloadOutlined, HistoryOutlined, ImportOutlined } from '@ant-design/icons'
import { exportEquipmentExcel, fetchRooms, searchEquipment } from 'entities/equipment'
import { ROUTES } from 'shared/constants/routes'
import { withReturnPath } from 'shared/utils/navigation'

const { Title, Text } = Typography

export const HomePage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState('')
  const [searching, setSearching] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [searchResults, setSearchResults] = useState([])

  useEffect(() => {
    loadRooms()
  }, [])

  const loadRooms = async () => {
    setLoading(true)
    try {
      const data = await fetchRooms()
      setRooms(Array.isArray(data) ? data : [])
    } catch (error) {
      message.error(error.message || '加载房间失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!keyword.trim()) {
      setSearchResults([])
      return
    }
    setSearching(true)
    try {
      const data = await searchEquipment(keyword.trim())
      setSearchResults(Array.isArray(data) ? data : [])
    } catch (error) {
      message.error(error.message || '搜索失败')
    } finally {
      setSearching(false)
    }
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
    <div>
      <div className="page-header" style={{ marginBottom: 16 }}>
        <Space className="page-header-actions" wrap>
          <Button icon={<BarcodeOutlined />} type="primary" onClick={() => navigate(ROUTES.SCAN)}>
            扫码更新
          </Button>
          <Button icon={<ImportOutlined />} onClick={() => navigate(ROUTES.IMPORT)}>
            导入数据
          </Button>
          <Button icon={<DownloadOutlined />} loading={exporting} onClick={handleExport}>
            导出数据
          </Button>
        </Space>
      </div>

      <Card title="搜索设备" style={{ marginBottom: 16 }}>
        <Space.Compact style={{ width: '100%' }}>
          <Input
            placeholder="输入编号或名称"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={handleSearch}
          />
          <Button type="primary" loading={searching} onClick={handleSearch}>搜索</Button>
        </Space.Compact>
        {searchResults.length > 0 && (
          <List
            style={{ marginTop: 16 }}
            dataSource={searchResults}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Button
                    type="link"
                    onClick={() => navigate(ROUTES.EQUIPMENT(item.assetCode), { state: withReturnPath(location) })}
                  >
                    详情
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  title={`${item.assetCode} · ${item.name}`}
                  description={`${item.roomCode || '-'} · ${item.usageStatus || '-'}`}
                />
              </List.Item>
            )}
          />
        )}
      </Card>

      <Card title="变更设备" style={{ marginBottom: 16 }}>
        <Space direction="vertical">
          <Text type="secondary">
            查看所有房间或现状发生变更的设备记录，按变更时间倒序排列
          </Text>
          <Button icon={<HistoryOutlined />} onClick={() => navigate(ROUTES.CHANGES)}>
            变更设备列表
          </Button>
        </Space>
      </Card>

      <Card title="按房间浏览">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 32 }}><Spin /></div>
        ) : (
          <Row gutter={[12, 12]}>
            {rooms.map((room) => (
              <Col xs={12} sm={8} md={6} key={room.id}>
                <Card hoverable onClick={() => navigate(ROUTES.ROOM(room.roomCode))}>
                  <Title level={5} style={{ margin: 0 }}>{room.roomCode}</Title>
                  <Text type="secondary">{room.roomName}</Text>
                  <div style={{ marginTop: 8 }}>
                    <Space size={[4, 4]} wrap>
                      <Tag color="blue">{room.equipmentCount || 0} 台设备</Tag>
                      <Tag
                        style={{
                          color: '#cf1322',
                          background: '#fff1f0',
                          borderColor: '#ffccc7',
                        }}
                      >
                        已遗失 {room.lostEquipmentCount || 0}
                      </Tag>
                    </Space>
                  </div>
                </Card>
              </Col>
            ))}
            {rooms.length === 0 && <Text type="secondary">暂无房间数据，请先导入 Excel</Text>}
          </Row>
        )}
      </Card>
    </div>
  )
}
