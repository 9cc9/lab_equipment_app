import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, Card, Input, List, Select, Space, Spin, Tag, Typography, message } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { fetchRoomEquipment } from 'entities/equipment'
import { ROUTES, USAGE_STATUS_OPTIONS } from 'shared/constants/routes'

const { Title, Text } = Typography

const formatDateTime = (value) => {
  if (!value) return '-'
  return new Date(value).toLocaleString('zh-CN', { hour12: false })
}

const SORT_OPTIONS = [
  { label: '更新时间 ↓', value: 'desc' },
  { label: '更新时间 ↑', value: 'asc' },
]

const ALL_STATUS_VALUE = ''

const STATUS_FILTER_OPTIONS = [
  { label: '全量', value: ALL_STATUS_VALUE },
  ...USAGE_STATUS_OPTIONS.map((v) => ({ label: v, value: v })),
]

export const RoomEquipmentPage = () => {
  const { roomCode } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState('')
  const [usageStatus, setUsageStatus] = useState(ALL_STATUS_VALUE)
  const [sortOrder, setSortOrder] = useState('desc')
  const [equipment, setEquipment] = useState([])

  const loadData = async (overrides = {}) => {
    const filters = {
      keyword: overrides.keyword !== undefined ? overrides.keyword : keyword,
      usageStatus: (() => {
        const v = overrides.usageStatus !== undefined ? overrides.usageStatus : usageStatus
        return v || undefined
      })(),
      sortOrder: overrides.sortOrder !== undefined ? overrides.sortOrder : sortOrder,
    }
    setLoading(true)
    try {
      const data = await fetchRoomEquipment(roomCode, filters)
      setEquipment(Array.isArray(data) ? data : [])
    } catch (error) {
      message.error(error.message || '加载设备失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setKeyword('')
    setUsageStatus(ALL_STATUS_VALUE)
    setSortOrder('desc')
    loadData({ keyword: '', usageStatus: ALL_STATUS_VALUE, sortOrder: 'desc' })
  }, [roomCode])

  const handleSearch = () => loadData()

  const handleStatusChange = (value) => {
    setUsageStatus(value)
    loadData({ usageStatus: value })
  }

  const handleSortChange = (value) => {
    setSortOrder(value)
    loadData({ sortOrder: value })
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(ROUTES.HOME)}>返回</Button>
          <Title level={3} style={{ margin: 0 }}>{roomCode} 设备列表</Title>
        </Space>
      </div>

      <Card>
        <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }} size="middle">
          <Space.Compact style={{ width: '100%' }}>
            <Input
              placeholder="筛选编号/名称"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onPressEnter={handleSearch}
            />
            <Button type="primary" onClick={handleSearch}>筛选</Button>
          </Space.Compact>

          <Space wrap style={{ width: '100%' }}>
            <Select
              style={{ minWidth: 160 }}
              value={usageStatus}
              options={STATUS_FILTER_OPTIONS}
              onChange={handleStatusChange}
            />
            <Select
              style={{ minWidth: 140 }}
              value={sortOrder}
              options={SORT_OPTIONS}
              onChange={handleSortChange}
            />
          </Space>
        </Space>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 32 }}><Spin /></div>
        ) : (
          <List
            dataSource={equipment}
            locale={{ emptyText: '该房间暂无设备' }}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Button type="link" onClick={() => navigate(ROUTES.EQUIPMENT(item.assetCode))}>更新</Button>,
                ]}
              >
                <List.Item.Meta
                  title={`${item.assetCode} · ${item.name}`}
                  description={
                    <Space wrap>
                      <Tag>{item.usageStatus || '未知'}</Tag>
                      <Text type="secondary">{item.brand} {item.model}</Text>
                      <Text type="secondary">最近更新：{formatDateTime(item.updatedAt)}</Text>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  )
}
