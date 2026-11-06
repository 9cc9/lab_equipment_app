import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, Button, Card, Space, Table, Tag, message } from 'antd'
import { fetchDueWarningBorrowApplications } from 'entities/borrow'
import { ROUTES } from 'shared/constants/routes'
import { BORROW_STATUS_LABEL, formatBorrowType, formatDateTime } from 'shared/utils/borrowApplication'

const warningTag = (level) => {
  if (level === 'OVERDUE') {
    return <Tag color="error">已超时</Tag>
  }
  if (level === 'DUE_SOON') {
    return <Tag color="warning">快超时</Tag>
  }
  return <Tag>—</Tag>
}

export const OverdueWarningPanel = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [list, setList] = useState([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const load = async (p = page) => {
    setLoading(true)
    try {
      const data = await fetchDueWarningBorrowApplications({ page: p, pageSize: 20 })
      setList(Array.isArray(data?.list) ? data.list : [])
      setTotal(data?.total || 0)
      setPage(p)
    } catch (e) {
      message.error(e.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(1)
  }, [])

  const columns = [
    {
      title: '预警',
      dataIndex: 'dueWarningLevel',
      width: 96,
      render: (v) => warningTag(v),
    },
    { title: '设备', dataIndex: 'assetCode', width: 120 },
    { title: '名称', dataIndex: 'equipmentName', ellipsis: true },
    {
      title: '类型',
      dataIndex: 'borrowType',
      width: 88,
      render: (v) => formatBorrowType(v),
    },
    { title: '学号', dataIndex: 'studentNo', width: 120 },
    { title: '姓名', dataIndex: 'borrowerName', width: 90 },
    {
      title: '预计归还',
      dataIndex: 'expectedEndAt',
      width: 168,
      render: (v) => formatDateTime(v),
    },
    {
      title: '借用状态',
      dataIndex: 'status',
      width: 112,
      render: (v) => BORROW_STATUS_LABEL[v] || v,
    },
    {
      title: '操作',
      width: 80,
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          onClick={() => navigate(`${ROUTES.BORROW_APPLICATION(record.id)}?from=admin`)}
        >
          详情
        </Button>
      ),
    },
  ]

  return (
    <>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="提前 7 天预警"
        description={
          <Space split="·" wrap>
            <span><Tag color="warning">快超时</Tag>预计归还时间在 7 天内</span>
            <span><Tag color="error">已超时</Tag>已超过预计归还时间</span>
          </Space>
        }
      />
      <Card>
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={list}
          rowClassName={(record) =>
            record.dueWarningLevel === 'OVERDUE'
              ? 'borrow-row-overdue'
              : record.dueWarningLevel === 'DUE_SOON'
                ? 'borrow-row-due-soon'
                : ''
          }
          pagination={{
            current: page,
            total,
            pageSize: 20,
            onChange: (p) => load(p),
          }}
          scroll={{ x: 980 }}
          locale={{ emptyText: '暂无快超时或已超时的借用' }}
        />
      </Card>
    </>
  )
}
