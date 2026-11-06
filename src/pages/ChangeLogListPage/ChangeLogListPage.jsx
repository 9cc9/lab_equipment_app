import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button, Card, Select, Space, Table, Typography, message } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { fetchEquipmentChangeLogs } from 'entities/equipment'
import { ROUTES } from 'shared/constants/routes'
import { withReturnPath } from 'shared/utils/navigation'

const { Title } = Typography

const FIELD_LABELS = {
  usageStatus: '现状',
  roomCode: '房间',
  status: '状态',
}

const SOURCE_LABELS = {
  SCAN: '扫码',
  BATCH: '批量',
  DELETE: '删除',
  BATCH_DELETE: '批量删除',
}

const STATUS_VALUE_LABELS = {
  ENABLED: '启用',
  DELETED: '已删除',
}

const formatChangeValue = (value, fieldName) => {
  if (!value) return '-'
  if (fieldName === 'status') {
    return STATUS_VALUE_LABELS[value] || value
  }
  return value
}

const formatDateTime = (value) => {
  if (!value) return '-'
  return new Date(value).toLocaleString('zh-CN', { hour12: false })
}

const FIELD_FILTER_OPTIONS = [
  { label: '全部', value: '' },
  { label: '现状', value: 'usageStatus' },
  { label: '房间', value: 'roomCode' },
  { label: '状态', value: 'status' },
]

export const ChangeLogListPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(true)
  const [records, setRecords] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [fieldName, setFieldName] = useState('')

  const loadData = useCallback(async (nextPage, nextPageSize, nextFieldName) => {
    setLoading(true)
    try {
      const data = await fetchEquipmentChangeLogs({
        page: nextPage,
        pageSize: nextPageSize,
        fieldName: nextFieldName || undefined,
      })
      setRecords(Array.isArray(data?.list) ? data.list : [])
      setTotal(typeof data?.total === 'number' ? data.total : 0)
    } catch (error) {
      message.error(error.message || '加载变更记录失败')
      setRecords([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData(page, pageSize, fieldName)
  }, [page, pageSize, fieldName, loadData])

  const handleFieldFilterChange = (value) => {
    setFieldName(value)
    setPage(1)
  }

  const columns = [
    {
      title: '资产编号',
      dataIndex: 'assetCode',
      width: 120,
      fixed: 'left',
      render: (value) => (
        <Button
          type="link"
          size="small"
          style={{ padding: 0 }}
          onClick={() => navigate(ROUTES.EQUIPMENT(value), { state: withReturnPath(location) })}
        >
          {value}
        </Button>
      ),
    },
    {
      title: '变更项',
      dataIndex: 'fieldName',
      width: 80,
      render: (value) => FIELD_LABELS[value] || value,
    },
    {
      title: '原值',
      dataIndex: 'oldValue',
      width: 100,
      render: (value, record) => formatChangeValue(value, record.fieldName),
    },
    {
      title: '新值',
      dataIndex: 'newValue',
      width: 100,
      render: (value, record) => formatChangeValue(value, record.fieldName),
    },
    {
      title: '备注',
      dataIndex: 'remark',
      ellipsis: true,
      render: (value) => value || '-',
    },
    {
      title: '操作人',
      dataIndex: 'operatorName',
      width: 100,
      render: (value) => value || '-',
    },
    {
      title: '来源',
      dataIndex: 'source',
      width: 80,
      render: (value) => SOURCE_LABELS[value] || value || '-',
    },
    {
      title: '变更时间',
      dataIndex: 'createdAt',
      width: 170,
      render: formatDateTime,
    },
  ]

  return (
    <div className="page-container">
      <div className="page-header">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(ROUTES.HOME)}>返回</Button>
          <Title level={3} style={{ margin: 0 }}>变更设备列表</Title>
        </Space>
      </div>

      <Card>
        <Space style={{ marginBottom: 16 }} wrap>
          <span>变更项</span>
          <Select
            style={{ width: 140 }}
            value={fieldName}
            options={FIELD_FILTER_OPTIONS}
            onChange={handleFieldFilterChange}
          />
        </Space>
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={records}
          scroll={{ x: 960 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50, 100],
            showTotal: (count) => `共 ${count} 条变更记录`,
            onChange: (nextPage, nextPageSize) => {
              setPage(nextPage)
              setPageSize(nextPageSize)
            },
          }}
        />
      </Card>
    </div>
  )
}
