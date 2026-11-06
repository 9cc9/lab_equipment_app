import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, List, Popconfirm, Space, Tag, Typography, message } from 'antd'
import { cancelBorrowApplication, fetchMyBorrowApplications } from 'entities/borrow'
import { ROUTES } from 'shared/constants/routes'
import { formatBorrowType, formatDateTime } from 'shared/utils/borrowApplication'

const { Title } = Typography

const statusTag = (status, overdue) => {
  if (status === 'PENDING') return <Tag color="gold">借用待审批</Tag>
  if (status === 'APPROVED') return <Tag color={overdue ? 'red' : 'green'}>{overdue ? '已逾期' : '借用中'}</Tag>
  if (status === 'RETURN_PENDING') return <Tag color="processing">结束待确认</Tag>
  if (status === 'REJECTED') return <Tag>已驳回</Tag>
  if (status === 'CANCELLED') return <Tag>已撤销</Tag>
  if (status === 'RETURNED') return <Tag>已归还</Tag>
  return <Tag>{status}</Tag>
}

export const BorrowMinePage = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [list, setList] = useState([])
  const [cancelingId, setCancelingId] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const data = await fetchMyBorrowApplications()
      setList(Array.isArray(data?.list) ? data.list : [])
    } catch (e) {
      message.error(e.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleCancel = async (id) => {
    setCancelingId(id)
    try {
      await cancelBorrowApplication(id)
      message.success('已撤销')
      await load()
    } catch (e) {
      message.error(e.message || '撤销失败')
    } finally {
      setCancelingId(null)
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <Space>
          <Button onClick={() => navigate(ROUTES.BORROW)}>返回目录</Button>
          <Title level={3} style={{ margin: 0 }}>我的申请</Title>
        </Space>
      </div>
      <Card>
        <List
          loading={loading}
          dataSource={list}
          locale={{ emptyText: '暂无申请' }}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Button
                  type="link"
                  key="detail"
                  onClick={() => navigate(ROUTES.BORROW_APPLICATION(item.id))}
                >
                  查看详情
                </Button>,
                ...(item.status === 'PENDING'
                  ? [
                      <Popconfirm
                        key="cancel"
                        title="确定撤销该申请吗？"
                        okText="撤销"
                        cancelText="取消"
                        okButtonProps={{ danger: true, loading: cancelingId === item.id }}
                        onConfirm={() => handleCancel(item.id)}
                      >
                        <Button type="link" danger loading={cancelingId === item.id}>
                          撤销
                        </Button>
                      </Popconfirm>,
                    ]
                  : []),
              ]}
            >
              <List.Item.Meta
                title={
                  <Space>
                    {item.assetCode} · {item.equipmentName}
                    {statusTag(item.status, item.overdue)}
                  </Space>
                }
                description={
                  <>
                    <div>
                      {formatBorrowType(item.borrowType)}
                      {' · '}
                      {formatDateTime(item.expectedStartAt)} — {formatDateTime(item.expectedEndAt)}
                    </div>
                    {(item.status === 'APPROVED' || item.status === 'REJECTED') && item.approveRemark && (
                      <div style={{ marginTop: 4, color: '#666' }}>
                        {item.status === 'REJECTED' ? '驳回原因' : '审批意见'}：{item.approveRemark}
                      </div>
                    )}
                  </>
                }
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  )
}
