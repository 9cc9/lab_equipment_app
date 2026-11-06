import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Select, Space, Table, Tag, message } from 'antd'
import { useBorrowActionModal } from 'components/borrow-application/useBorrowActionModal.jsx'
import { ROUTES } from 'shared/constants/routes'
import { BORROW_STATUS_LABEL } from 'shared/utils/borrowApplication'
import {
  approveBorrowApplication,
  fetchAdminBorrowApplications,
  rejectBorrowApplication,
  returnBorrowApplication,
} from 'entities/borrow'

export const AdminBorrowPanel = () => {
  const navigate = useNavigate()
  const { runWithRemark } = useBorrowActionModal()
  const [loading, setLoading] = useState(true)
  const [list, setList] = useState([])
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const load = async (p = page) => {
    setLoading(true)
    try {
      const data = await fetchAdminBorrowApplications({ page: p, pageSize: 20, status: status || undefined })
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
  }, [status])

  const wrapAction = async (runner, successText) => {
    try {
      await runner()
      message.success(successText)
      await load(page)
    } catch (e) {
      if (e.message === 'cancel' || e.message === 'validation') return
      message.error(e.message || '操作失败')
    }
  }

  const columns = [
    { title: '设备', dataIndex: 'assetCode', width: 120 },
    { title: '名称', dataIndex: 'equipmentName', ellipsis: true },
    {
      title: '类型',
      dataIndex: 'borrowType',
      width: 80,
      render: (v) => (v === 'EXTERNAL' ? '外借' : '室内'),
    },
    { title: '学号', dataIndex: 'studentNo', width: 120 },
    { title: '姓名', dataIndex: 'borrowerName', width: 90 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (v, r) => {
        if (v === 'RETURN_PENDING') return <Tag color="processing">结束待确认</Tag>
        if (r.overdue) return <Tag color="red">逾期</Tag>
        if (v === 'PENDING') return <Tag color="gold">借用待审批</Tag>
        if (v === 'APPROVED') return <Tag color="green">借用中</Tag>
        return <Tag>{BORROW_STATUS_LABEL[v] || v}</Tag>
      },
    },
    {
      title: '操作',
      width: 280,
      render: (_, record) => (
        <Space size="small" wrap>
          <Button
            size="small"
            onClick={() => navigate(`${ROUTES.BORROW_APPLICATION(record.id)}?from=admin`)}
          >
            详情
          </Button>
          {record.status === 'PENDING' && (
            <>
              <Button
                size="small"
                type="primary"
                onClick={() =>
                  wrapAction(
                    () =>
                      runWithRemark({
                        title: '审批意见（选填）',
                        required: false,
                        okText: '确认通过',
                        onSubmit: (remark) => approveBorrowApplication(record.id, remark),
                      }),
                    '已通过'
                  )
                }
              >
                通过
              </Button>
              <Button
                size="small"
                danger
                onClick={() =>
                  wrapAction(
                    () =>
                      runWithRemark({
                        title: '驳回原因',
                        required: true,
                        okText: '确认驳回',
                        danger: true,
                        onSubmit: (remark) => rejectBorrowApplication(record.id, remark),
                      }),
                    '已驳回'
                  )
                }
              >
                驳回
              </Button>
            </>
          )}
          {(record.status === 'APPROVED' || record.status === 'RETURN_PENDING') && (
            <Button
              size="small"
              type="primary"
              onClick={() =>
                wrapAction(
                  () =>
                    runWithRemark({
                      title: '借用结束',
                      required: false,
                      okText: '确认结束',
                      onSubmit: (remark) => returnBorrowApplication(record.id, remark),
                    }),
                  '借用已结束'
                )
              }
            >
              借用结束
            </Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <Select
          style={{ width: 160 }}
          value={status}
          onChange={setStatus}
          options={[
            { label: '全部', value: '' },
            { label: '借用待审批', value: 'PENDING' },
            { label: '结束待确认', value: 'RETURN_PENDING' },
            { label: '借用中', value: 'APPROVED' },
            { label: '已结束', value: 'RETURNED' },
            { label: '已驳回', value: 'REJECTED' },
          ]}
        />
      </Card>
      <Card>
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={list}
          pagination={{
            current: page,
            total,
            pageSize: 20,
            onChange: (p) => load(p),
          }}
          scroll={{ x: 900 }}
        />
      </Card>
    </>
  )
}
