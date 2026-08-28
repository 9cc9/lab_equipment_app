import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, Card, Input, List, Space, Spin, Tag, Typography, message } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { fetchRoomEquipment } from 'entities/equipment'
import { ROUTES } from 'shared/constants/routes'

const { Title, Text } = Typography

export const RoomEquipmentPage = () => {
  const { roomCode } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState('')
  const [equipment, setEquipment] = useState([])

  const loadData = async (searchKeyword = keyword) => {
    setLoading(true)
    try {
      const data = await fetchRoomEquipment(roomCode, searchKeyword.trim())
      setEquipment(Array.isArray(data) ? data : [])
    } catch (error) {
      message.error(error.message || '加载设备失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData('')
  }, [roomCode])

  return (
    <div className="page-container">
      <div className="page-header">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(ROUTES.HOME)}>返回</Button>
          <Title level={3} style={{ margin: 0 }}>{roomCode} 设备列表</Title>
        </Space>
      </div>

      <Card>
        <Space.Compact style={{ width: '100%', marginBottom: 16 }}>
          <Input
            placeholder="筛选编号/名称"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={() => loadData(keyword)}
          />
          <Button type="primary" onClick={() => loadData(keyword)}>筛选</Button>
        </Space.Compact>

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
