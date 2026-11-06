import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Alert, App, Button, Card, Form, Input, Radio, Result, Space, Spin, Typography } from 'antd'
import { AllowedBorrowTypeTag } from 'components/borrow-catalog'
import { fetchBorrowEquipmentDetail, submitBorrowApplication } from 'entities/borrow'
import { useAuthStore, isStudentUser } from 'entities/auth'
import { ROUTES } from 'shared/constants/routes'
import { defaultBorrowerFields, resolveBorrowTypeField } from 'shared/utils/borrowForm'

const { Title, Text } = Typography

const toIso = (local) => (local ? new Date(local).toISOString() : null)

export const BorrowApplyPage = () => {
  const { message } = App.useApp()
  const { assetCode } = useParams()
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const user = useAuthStore((s) => s.user)
  const student = isStudentUser(user)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [detail, setDetail] = useState(null)
  const [borrowTypeLocked, setBorrowTypeLocked] = useState(false)
  const [externalOptionDisabled, setExternalOptionDisabled] = useState(false)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    load()
  }, [assetCode])

  const load = async () => {
    setLoading(true)
    try {
      const data = await fetchBorrowEquipmentDetail(assetCode)
      setDetail(data)
      const { borrowType, borrowTypeLocked: locked, externalOptionDisabled: extDisabled } =
        resolveBorrowTypeField(data?.allowedBorrowTypes, data?.externalBorrowBlocked)
      setBorrowTypeLocked(locked)
      setExternalOptionDisabled(extDisabled)
      form.setFieldsValue({
        borrowType,
        ...defaultBorrowerFields(user, student),
      })
    } catch (e) {
      message.error(e.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }

  const onFinish = async (values) => {
    setSubmitError('')
    setSubmitting(true)
    try {
      await submitBorrowApplication({
        assetCode,
        borrowType: values.borrowType,
        expectedStartAt: toIso(values.expectedStartAt),
        expectedEndAt: toIso(values.expectedEndAt),
        borrowerName: values.borrowerName,
        studentNo: values.studentNo,
        borrowerPhone: values.borrowerPhone,
        purpose: values.purpose,
        destination: values.destination,
        remark: values.remark,
      })
      message.success('提交成功，等待管理员审批')
      navigate(ROUTES.BORROW_MINE)
    } catch (e) {
      const text = e?.message || '提交失败'
      setSubmitError(text)
      message.error(text)
    } finally {
      setSubmitting(false)
    }
  }

  if (user && !student) {
    return (
      <div className="page-container">
        <Result
          status="403"
          title="仅同学本人可提交借用申请"
          subTitle="学生助管与管理员请在「设备借用」中查看可借设备；同学请使用「同学借用」登录后申请。"
          extra={(
            <Button type="primary" onClick={() => navigate(`${ROUTES.STAFF_BORROW}?tab=catalog`)}>
              返回可借设备列表
            </Button>
          )}
        />
      </div>
    )
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 48 }}><Spin size="large" /></div>
  }

  const allowedIsAll = (detail?.allowedBorrowTypes || 'ALL') === 'ALL'

  return (
    <div className="page-container">
      <div className="page-header">
        <Space>
          <Button onClick={() => navigate(ROUTES.BORROW)}>返回目录</Button>
          <Title level={3} style={{ margin: 0 }}>借用申请</Title>
        </Space>
      </div>

      <Card title={`${detail?.assetCode} · ${detail?.name}`} style={{ marginBottom: 16 }}>
        <Space size={[4, 4]} wrap>
          <Text type="secondary">{detail?.roomCode || '-'}</Text>
          <AllowedBorrowTypeTag allowedBorrowTypes={detail?.allowedBorrowTypes} />
          {(detail?.inLabActiveCount || 0) > 0 && (
            <Text type="secondary">当前室内 {detail.inLabActiveCount} 人使用中</Text>
          )}
        </Space>
      </Card>

      <Card>
        {submitError ? (
          <Alert
            type="error"
            showIcon
            message={submitError}
            style={{ marginBottom: 16 }}
            closable
            onClose={() => setSubmitError('')}
          />
        ) : null}
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="borrowType" label="借用类型" rules={[{ required: true }]}>
            <Radio.Group disabled={borrowTypeLocked}>
              <Radio value="IN_LAB">室内使用（不带走）</Radio>
              <Radio value="EXTERNAL" disabled={externalOptionDisabled}>外借带走</Radio>
            </Radio.Group>
          </Form.Item>
          {!allowedIsAll && (
            <Text type="secondary" style={{ display: 'block', marginTop: -8, marginBottom: 16 }}>
              该设备仅支持上述类型，已自动选定
            </Text>
          )}
          {allowedIsAll && externalOptionDisabled && (
            <Text type="warning" style={{ display: 'block', marginTop: -8, marginBottom: 16 }}>
              该设备外借占用中，暂不可申请外借
            </Text>
          )}

          <Form.Item name="borrowerName" label="姓名" rules={[{ required: true }]}>
            <Input placeholder="借用人姓名" />
          </Form.Item>
          <Form.Item name="studentNo" label="学号" rules={[{ required: true }]}>
            <Input placeholder="借用人学号" />
          </Form.Item>
          <Form.Item name="borrowerPhone" label="手机号" rules={[{ required: true, message: '请填写手机号' }]}>
            <Input placeholder="借用人手机号" />
          </Form.Item>

          <Form.Item name="expectedStartAt" label="预计开始" rules={[{ required: true }]}>
            <Input type="datetime-local" />
          </Form.Item>
          <Form.Item name="expectedEndAt" label="预计归还" rules={[{ required: true }]}>
            <Input type="datetime-local" />
          </Form.Item>
          <Form.Item
            name="purpose"
            label="借用用途"
            rules={[
              { required: true, whitespace: true, message: '请填写借用用途' },
              { min: 4, message: '请写清楚借用原因（至少 4 个字）' },
              { max: 256, message: '借用用途不超过 256 字' },
            ]}
            extra="请说明具体实验、课程或任务，便于管理员审批"
          >
            <Input.TextArea rows={3} placeholder="例如：完成数字电路实验，需在 A346 使用示波器观测波形" showCount maxLength={256} />
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(p, c) => p.borrowType !== c.borrowType}>
            {({ getFieldValue }) =>
              getFieldValue('borrowType') === 'EXTERNAL' ? (
                <Form.Item name="destination" label="外带目的地" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
              ) : null
            }
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={submitting}>提交申请</Button>
        </Form>
      </Card>
    </div>
  )
}
