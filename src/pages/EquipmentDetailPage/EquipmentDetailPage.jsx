import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  Button,
  Card,
  Descriptions,
  Empty,
  Form,
  Input,
  Select,
  Space,
  Spin,
  Switch,
  Table,
  Typography,
  message,
} from 'antd'
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons'
import {
  fetchEquipmentByCode,
  fetchEquipmentChanges,
  fetchRooms,
  updateEquipmentStatus,
} from 'entities/equipment'
import { returnBorrowApplication, updateEquipmentBorrow } from 'entities/borrow'
import { isAdminUser, useAuthStore } from 'entities/auth'
import { ROUTES, USAGE_STATUS_OPTIONS } from 'shared/constants/routes'
import { navigateBack } from 'shared/utils/navigation'

const { Title, Text } = Typography

export const EquipmentDetailPage = () => {
  const { assetCode } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [equipment, setEquipment] = useState(null)
  const [rooms, setRooms] = useState([])
  const [changes, setChanges] = useState([])
  const [borrowSaving, setBorrowSaving] = useState(false)
  const [borrowForm] = Form.useForm()
  const isAdmin = isAdminUser(useAuthStore((s) => s.user))

  useEffect(() => {
    loadAll()
  }, [assetCode])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [equipmentData, roomData] = await Promise.all([
        fetchEquipmentByCode(assetCode),
        fetchRooms(),
      ])
      setEquipment(equipmentData)
      borrowForm.setFieldsValue({
        borrowable: equipmentData.borrowable === true,
        allowedBorrowTypes: equipmentData.allowedBorrowTypes || 'ALL',
      })
      setRooms(Array.isArray(roomData) ? roomData : [])
      form.setFieldsValue({
        usageStatus: equipmentData.usageStatus || '在用',
        roomCode: equipmentData.roomCode || undefined,
        remark: equipmentData.locationNote || '',
      })
      if (equipmentData.id) {
        const changeData = await fetchEquipmentChanges(equipmentData.id)
        setChanges(Array.isArray(changeData) ? changeData : [])
      }
    } catch (error) {
      setEquipment(null)
      message.error(error.message || '加载设备失败')
    } finally {
      setLoading(false)
    }
  }

  const onSave = async (values) => {
    setSaving(true)
    try {
      const updated = await updateEquipmentStatus(assetCode, {
        usageStatus: values.usageStatus,
        roomCode: values.roomCode,
        remark: values.remark,
        source: 'SCAN',
      })
      setEquipment(updated)
      message.success('更新成功')
      if (updated.id) {
        const changeData = await fetchEquipmentChanges(updated.id)
        setChanges(Array.isArray(changeData) ? changeData : [])
      }
    } catch (error) {
      message.error(error.message || '更新失败')
    } finally {
      setSaving(false)
    }
  }

  const handleBack = () => navigateBack(navigate, location, ROUTES.HOME)

  const onSaveBorrow = async (values) => {
    setBorrowSaving(true)
    try {
      const updated = await updateEquipmentBorrow(assetCode, {
        borrowable: values.borrowable,
        allowedBorrowTypes: values.allowedBorrowTypes,
      })
      setEquipment(updated)
      message.success('借用设置已保存')
    } catch (error) {
      message.error(error.message || '保存失败')
    } finally {
      setBorrowSaving(false)
    }
  }

  const handleReturnBorrow = async (borrowId) => {
    try {
      await returnBorrowApplication(borrowId, '')
      message.success('借用已结束')
      loadAll()
    } catch (error) {
      message.error(error.message || '归还失败')
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!equipment) {
    return (
      <div className="page-container">
        <div className="page-header">
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>返回</Button>
            <Title level={3} style={{ margin: 0 }}>设备详情</Title>
          </Space>
        </div>
        <Card>
          <Empty
            description={`未找到编号为「${assetCode}」的设备`}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text type="secondary">
                请确认条码或编号是否正确，或联系管理员确认设备是否已导入
              </Text>
              <Button type="primary" onClick={handleBack}>
                返回上一页
              </Button>
            </Space>
          </Empty>
        </Card>
      </div>
    )
  }

  const statusOptions = [...USAGE_STATUS_OPTIONS]
  if (equipment.usageStatus && !statusOptions.includes(equipment.usageStatus)) {
    statusOptions.unshift(equipment.usageStatus)
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>返回</Button>
          <Title level={3} style={{ margin: 0 }}>{equipment.assetCode}</Title>
        </Space>
      </div>

      <Card title="设备信息" style={{ marginBottom: 16 }}>
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="名称">{equipment.name}</Descriptions.Item>
          <Descriptions.Item label="品牌">{equipment.brand || '-'}</Descriptions.Item>
          <Descriptions.Item label="型号">{equipment.model || '-'}</Descriptions.Item>
          <Descriptions.Item label="出厂号">{equipment.serialNo || '-'}</Descriptions.Item>
          <Descriptions.Item label="现状">{equipment.usageStatus || '-'}</Descriptions.Item>
          <Descriptions.Item label="房间">{equipment.roomCode || equipment.locationRaw || '-'}</Descriptions.Item>
          <Descriptions.Item label="保管人">{equipment.custodian || '-'}</Descriptions.Item>
        </Descriptions>
      </Card>

      {(equipment.activeBorrows?.length > 0 || equipment.borrowable != null) && (
        <Card title="进行中借用人" style={{ marginBottom: 16 }}>
          {equipment.activeBorrows?.length > 0 ? (
            <Table
              rowKey="id"
              size="small"
              pagination={false}
              dataSource={equipment.activeBorrows}
              columns={[
                {
                  title: '类型',
                  dataIndex: 'borrowType',
                  width: 80,
                  render: (v) => (v === 'EXTERNAL' ? '外借' : '室内'),
                },
                { title: '姓名', dataIndex: 'borrowerName' },
                { title: '学号', dataIndex: 'studentNo' },
                { title: '手机', dataIndex: 'borrowerPhone' },
                {
                  title: '预计归还',
                  dataIndex: 'expectedEndAt',
                  render: (v) => (v ? new Date(v).toLocaleString() : '-'),
                },
                {
                  title: '状态',
                  render: (_, r) => {
                    if (r.status === 'RETURN_PENDING') return '结束待确认'
                    if (r.overdue) return '已逾期'
                    return '借用中'
                  },
                },
                {
                  title: '操作',
                  render: (_, r) => (
                    <Button type="link" size="small" onClick={() => handleReturnBorrow(r.id)}>
                      借用结束
                    </Button>
                  ),
                },
              ]}
            />
          ) : (
            <Text type="secondary">暂无进行中的借用</Text>
          )}
        </Card>
      )}

      {isAdmin && (
        <Card title="开放借用（仅管理员）" style={{ marginBottom: 16 }}>
          <Form form={borrowForm} layout="vertical" onFinish={onSaveBorrow}>
            <Form.Item name="borrowable" label="开放借用" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="allowedBorrowTypes" label="允许类型">
              <Select
                options={[
                  { label: '外借 + 室内', value: 'ALL' },
                  { label: '仅外借', value: 'EXTERNAL' },
                  { label: '仅室内', value: 'IN_LAB' },
                ]}
              />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={borrowSaving}>
              保存借用设置
            </Button>
          </Form>
        </Card>
      )}

      <Card title="更新状态与房间" style={{ marginBottom: 16 }}>
        <Form form={form} layout="vertical" onFinish={onSave}>
          <Form.Item name="usageStatus" label="现状" rules={[{ required: true, message: '请选择现状' }]}>
            <Select options={statusOptions.map((v) => ({ label: v, value: v }))} />
          </Form.Item>
          <Form.Item name="roomCode" label="所在房间" rules={[{ required: true, message: '请选择房间' }]}>
            <Select
              showSearch
              placeholder="选择房间"
              options={rooms.map((r) => ({ label: `${r.roomCode}${r.roomName ? ` (${r.roomName})` : ''}`, value: r.roomCode }))}
            />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} placeholder="可选，如搬迁原因" />
          </Form.Item>
          <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving} block>
            保存更新
          </Button>
        </Form>
      </Card>

      <Card title="变更记录">
        <Table
          rowKey="id"
          size="small"
          pagination={{ pageSize: 5 }}
          dataSource={changes}
          columns={[
            {
              title: '字段',
              dataIndex: 'fieldName',
              width: 100,
              render: (v) => ({ usageStatus: '现状', roomCode: '房间' }[v] || v),
            },
            {
              title: '原值',
              dataIndex: 'oldValue',
              render: (v) => v || '-',
            },
            { title: '新值', dataIndex: 'newValue' },
            {
              title: '备注',
              dataIndex: 'remark',
              ellipsis: true,
              render: (v) => v || '-',
            },
            { title: '操作人', dataIndex: 'operatorName', width: 100 },
            {
              title: '时间',
              dataIndex: 'createdAt',
              width: 180,
              render: (v) => (v ? new Date(v).toLocaleString() : '-'),
            },
          ]}
        />
      </Card>
    </div>
  )
}
