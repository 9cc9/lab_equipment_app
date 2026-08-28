import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button, Card, Form, Input, Typography, message } from 'antd'
import { useAuthStore } from 'entities/auth'
import { POST_LOGIN_REDIRECT_KEY, ROUTES } from 'shared/constants/routes'

const { Title, Text } = Typography

export const LoginPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, loading } = useAuthStore()
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)

  const onFinish = async (values) => {
    setSubmitting(true)
    try {
      await login(values.account, values.password)
      message.success('登录成功')
      let redirect = location.state?.from?.pathname
      try {
        redirect = redirect || sessionStorage.getItem(POST_LOGIN_REDIRECT_KEY)
        sessionStorage.removeItem(POST_LOGIN_REDIRECT_KEY)
      } catch {
        // ignore
      }
      navigate(redirect || ROUTES.HOME, { replace: true })
    } catch (error) {
      message.error(error.message || '登录失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page-container" style={{ maxWidth: 420, marginTop: 80 }}>
      <Card>
        <Title level={3}>实验室设备管理</Title>
        <Text type="secondary">默认账号：admin / admin123</Text>
        <Form form={form} layout="vertical" onFinish={onFinish} style={{ marginTop: 24 }}>
          <Form.Item name="account" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input placeholder="admin" autoComplete="username" />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password placeholder="admin123" autoComplete="current-password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading || submitting}>
            登录
          </Button>
        </Form>
      </Card>
    </div>
  )
}
