import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Input, Modal, Select, Space, Table, Tag, Typography, message } from 'antd'
import {
  approveBorrowApplication,
  fetchAdminBorrowApplications,
  rejectBorrowApplication,
  returnBorrowApplication,
} from 'entities/borrow'
import { ROUTES } from 'shared/constants/routes'

const { Title } = Typography

export const AdminBorrowPage = () => {
  const navigate = useNavigate()
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

  const promptRemark = (title, required) =>
    new Promise((resolve) => {
      let value = ''
      Modal.confirm({
        title,
        content: (
          <Input.TextArea
            rows={3}
            placeholder={required ? '必填' : '可选'}
            onChange={(e) => { value = e.target.value }}
          />
        ),
        onOk: () => {
          if (required && !value.trim()) {
            message.warning('请填写原因')
            return Promise.reject()
          }
          resolve(value.trim())
        },
      })
    })

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
      render: (v, r) => (
        <Tag color={r.overdue ? 'red' : v === 'PENDING' ? 'gold' : 'default'}>
          {r.overdue ? '逾期' : v}
        </Tag>
      ),
    },
    {
      title: '操作',
      width: 220,
      render: (_, record) => (
        <Space size="small" wrap>
          {record.status === 'PENDING' && (
            <>
              <Button size="small" type="primary" onClick={async () => {
                const remark = await promptRemark('通过意见', false)
                await approveBorrowApplication(record.id, remark)
                message.success('已通过')
                load(page)
              }}>通过</Button>
              <Button size="small" danger onClick={async () => {
                const remark = await promptRemark('驳回原因', true)
                await rejectBorrowApplication(record.id, remark)
                message.success('已驳回')
                load(page)
              }}>驳回</Button>
            </>
          )}
          {record.status === 'APPROVED' && (
            <Button size="small" onClick={async () => {
              const remark = await promptRemark('归还备注', false)
              await returnBorrowApplication(record.id, remark)
              message.success('已确认归还')
              load(page)
            }}>确认归还</Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div className="page-container">
      <div className="page-header">
        <Space>
          <Button onClick={() => navigate(ROUTES.HOME)}>返回首页</Button>
          <Title level={3} style={{ margin: 0 }}>借用审批</Title>
        </Space>
      </div>
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
    </div>
  )
}
