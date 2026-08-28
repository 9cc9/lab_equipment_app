import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Button,
  Card,
  Descriptions,
  Form,
  Input,
  Select,
  Space,
  Spin,
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
import { ROUTES, USAGE_STATUS_OPTIONS } from 'shared/constants/routes'

const { Title } = Typography

export const EquipmentDetailPage = () => {
  const { assetCode } = useParams()
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [equipment, setEquipment] = useState(null)
  const [rooms, setRooms] = useState([])
  const [changes, setChanges] = useState([])

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

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!equipment) {
    return null
  }

  const statusOptions = [...USAGE_STATUS_OPTIONS]
  if (equipment.usageStatus && !statusOptions.includes(equipment.usageStatus)) {
    statusOptions.unshift(equipment.usageStatus)
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(ROUTES.SCAN)}>返回扫码</Button>
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
