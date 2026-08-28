import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  Button,
  Card,
  Checkbox,
  Form,
  Grid,
  Input,
  List,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { batchUpdateEquipmentStatus, fetchRoomEquipment, fetchRooms } from 'entities/equipment'
import { ROUTES, USAGE_STATUS_OPTIONS } from 'shared/constants/routes'
import { withReturnPath } from 'shared/utils/navigation'

const { Title, Text } = Typography
const { useBreakpoint } = Grid

const formatBrandModel = (record) => `${record.brand || ''} ${record.model || ''}`.trim() || '-'

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
  const location = useLocation()
  const screens = useBreakpoint()
  const isMobile = !screens.md
  const [batchForm] = Form.useForm()
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState('')
  const [usageStatus, setUsageStatus] = useState(ALL_STATUS_VALUE)
  const [sortOrder, setSortOrder] = useState('desc')
  const [equipment, setEquipment] = useState([])
  const [rooms, setRooms] = useState([])
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const [batchModalOpen, setBatchModalOpen] = useState(false)
  const [batchSubmitting, setBatchSubmitting] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

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
      setSelectedRowKeys([])
    } catch (error) {
      message.error(error.message || '加载设备失败')
    } finally {
      setLoading(false)
    }
  }

  const loadRooms = async () => {
    try {
      const data = await fetchRooms()
      setRooms(Array.isArray(data) ? data : [])
    } catch {
      setRooms([])
    }
  }

  useEffect(() => {
    setKeyword('')
    setUsageStatus(ALL_STATUS_VALUE)
    setSortOrder('desc')
    setSelectedRowKeys([])
    setPage(1)
    loadData({ keyword: '', usageStatus: ALL_STATUS_VALUE, sortOrder: 'desc' })
    loadRooms()
  }, [roomCode])

  const handleSearch = () => {
    setPage(1)
    loadData()
  }

  const handleStatusChange = (value) => {
    setUsageStatus(value)
    setPage(1)
    loadData({ usageStatus: value })
  }

  const handleSortChange = (value) => {
    setSortOrder(value)
    setPage(1)
    loadData({ sortOrder: value })
  }

  const handlePaginationChange = (nextPage, nextPageSize) => {
    setPage(nextPage)
    setPageSize(nextPageSize)
  }

  const toggleSelect = (assetCode) => {
    setSelectedRowKeys((prev) => (
      prev.includes(assetCode) ? prev.filter((key) => key !== assetCode) : [...prev, assetCode]
    ))
  }

  const goToEquipment = (assetCode) => {
    navigate(ROUTES.EQUIPMENT(assetCode), { state: withReturnPath(location) })
  }

  const paginationConfig = {
    current: page,
    pageSize,
    showSizeChanger: !isMobile,
    pageSizeOptions: [10, 20, 50, 100],
    showTotal: (total) => `共 ${total} 台`,
    onChange: handlePaginationChange,
    simple: isMobile,
  }

  const openBatchModal = () => {
    batchForm.setFieldsValue({
      usageStatus: '在用',
      roomCode,
      remark: '',
    })
    setBatchModalOpen(true)
  }

  const handleBatchSubmit = async (values) => {
    setBatchSubmitting(true)
    try {
      const result = await batchUpdateEquipmentStatus({
        assetCodes: selectedRowKeys,
        usageStatus: values.usageStatus,
        roomCode: values.roomCode,
        remark: values.remark,
        source: 'BATCH',
      })
      const successCount = result?.successCount ?? 0
      const failCount = result?.failCount ?? 0
      if (failCount > 0) {
        message.warning(`批量更新完成：成功 ${successCount} 台，失败 ${failCount} 台`)
      } else {
        message.success(`已成功更新 ${successCount} 台设备`)
      }
      setBatchModalOpen(false)
      setSelectedRowKeys([])
      await loadData()
    } catch (error) {
      message.error(error.message || '批量更新失败')
    } finally {
      setBatchSubmitting(false)
    }
  }

  const rowSelection = useMemo(
    () => ({
      selectedRowKeys,
      onChange: (keys) => setSelectedRowKeys(keys),
    }),
    [selectedRowKeys]
  )

  const roomOptions = useMemo(
    () => rooms.map((r) => ({
      label: `${r.roomCode}${r.roomName ? ` (${r.roomName})` : ''}`,
      value: r.roomCode,
    })),
    [rooms]
  )

  const columns = [
    {
      title: '编号 / 名称',
      dataIndex: 'assetCode',
      render: (_, record) => (
        <div>
          <div>{record.assetCode}</div>
          <Text type="secondary">{record.name}</Text>
        </div>
      ),
    },
    {
      title: '现状',
      dataIndex: 'usageStatus',
      width: 100,
      render: (v) => <Tag>{v || '未知'}</Tag>,
    },
    {
      title: '品牌型号',
      width: 140,
      render: (_, record) => formatBrandModel(record),
    },
    {
      title: '最近更新',
      dataIndex: 'updatedAt',
      width: 170,
      render: (v) => formatDateTime(v),
    },
    {
      title: '操作',
      width: 80,
      render: (_, record) => (
        <Button type="link" onClick={() => goToEquipment(record.assetCode)}>
          更新
        </Button>
      ),
    },
  ]

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

          <Space wrap={!isMobile} direction={isMobile ? 'vertical' : 'horizontal'} style={{ width: '100%' }}>
            <Select
              style={{ width: isMobile ? '100%' : undefined, minWidth: isMobile ? undefined : 160 }}
              value={usageStatus}
              options={STATUS_FILTER_OPTIONS}
              onChange={handleStatusChange}
            />
            <Select
              style={{ width: isMobile ? '100%' : undefined, minWidth: isMobile ? undefined : 140 }}
              value={sortOrder}
              options={SORT_OPTIONS}
              onChange={handleSortChange}
            />
            <Button
              type="primary"
              block={isMobile}
              disabled={selectedRowKeys.length === 0}
              onClick={openBatchModal}
            >
              批量更新{selectedRowKeys.length > 0 ? `（${selectedRowKeys.length}）` : ''}
            </Button>
          </Space>
        </Space>

        {isMobile ? (
          <List
            loading={loading}
            dataSource={equipment}
            rowKey="assetCode"
            locale={{ emptyText: '该房间暂无设备' }}
            pagination={paginationConfig}
            renderItem={(record) => {
              const selected = selectedRowKeys.includes(record.assetCode)
              return (
                <List.Item
                  className={`equipment-list-item${selected ? ' equipment-list-item-selected' : ''}`}
                  actions={[
                    <Button
                      key="update"
                      type="link"
                      size="small"
                      onClick={(event) => {
                        event.stopPropagation()
                        goToEquipment(record.assetCode)
                      }}
                    >
                      更新
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={(
                      <Checkbox
                        checked={selected}
                        onChange={() => toggleSelect(record.assetCode)}
                        onClick={(event) => event.stopPropagation()}
                      />
                    )}
                    title={(
                      <Space wrap size={[4, 4]}>
                        <Text strong>{record.assetCode}</Text>
                        <Tag>{record.usageStatus || '未知'}</Tag>
                      </Space>
                    )}
                    description={(
                      <Space direction="vertical" size={2} style={{ width: '100%' }}>
                        <Text>{record.name}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {formatBrandModel(record)}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          更新于 {formatDateTime(record.updatedAt)}
                        </Text>
                      </Space>
                    )}
                  />
                </List.Item>
              )
            }}
          />
        ) : (
          <Table
            rowKey="assetCode"
            loading={loading}
            columns={columns}
            dataSource={equipment}
            rowSelection={rowSelection}
            pagination={paginationConfig}
            locale={{ emptyText: '该房间暂无设备' }}
            scroll={{ x: 720 }}
          />
        )}
      </Card>

      <Modal
        title={`批量更新（已选 ${selectedRowKeys.length} 台）`}
        open={batchModalOpen}
        onCancel={() => setBatchModalOpen(false)}
        onOk={() => batchForm.submit()}
        confirmLoading={batchSubmitting}
        okText="确认更新"
        destroyOnClose
      >
        <Form form={batchForm} layout="vertical" onFinish={handleBatchSubmit}>
          <Form.Item
            name="usageStatus"
            label="现状"
            rules={[{ required: true, message: '请选择现状' }]}
          >
            <Select options={USAGE_STATUS_OPTIONS.map((v) => ({ label: v, value: v }))} />
          </Form.Item>
          <Form.Item
            name="roomCode"
            label="所在房间"
            rules={[{ required: true, message: '请选择房间' }]}
          >
            <Select showSearch placeholder="选择房间" options={roomOptions} />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} placeholder="可选，如批量盘点说明" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
