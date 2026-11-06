import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button, Card, Form, Input, Tabs, Typography, message } from 'antd'
import { useAuthStore } from 'entities/auth'
import { POST_LOGIN_REDIRECT_KEY, ROUTES } from 'shared/constants/routes'

const { Title, Text } = Typography

const ASSISTANT_DEFAULT_PASSWORD = '123456'

export const LoginPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, studentLogin, loading } = useAuthStore()
  const [studentForm] = Form.useForm()
  const [adminForm] = Form.useForm()
  const [assistantForm] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState('assistant')

  const redirectAfterLogin = (user) => {
    if (user?.userType === 'STUDENT') {
      navigate(ROUTES.BORROW, { replace: true })
      return
    }
    let redirect = location.state?.from?.pathname
    try {
      redirect = redirect || sessionStorage.getItem(POST_LOGIN_REDIRECT_KEY)
      sessionStorage.removeItem(POST_LOGIN_REDIRECT_KEY)
    } catch {
      // ignore
    }
    navigate(redirect || ROUTES.HOME, { replace: true })
  }

  const handleAdminLogin = async (values) => {
    setSubmitting(true)
    try {
      const data = await login(values.account.trim(), values.password)
      message.success('登录成功')
      redirectAfterLogin(data.user)
    } catch (error) {
      message.error(error.message || '登录失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAssistantLogin = async (values) => {
    setSubmitting(true)
    try {
      const name = values.name.trim()
      const data = await login(name, ASSISTANT_DEFAULT_PASSWORD)
      message.success('登录成功')
      redirectAfterLogin(data.user)
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
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'assistant',
              label: '学生助管',
              children: (
                <>
                  <Text type="secondary">输入姓名即可登录，首次登录自动创建账号</Text>
                  <Form
                    form={assistantForm}
                    layout="vertical"
                    onFinish={handleAssistantLogin}
                    style={{ marginTop: 16 }}
                  >
                    <Form.Item
                      name="name"
                      label="姓名"
                      rules={[
                        { required: true, message: '请输入姓名' },
                        { whitespace: true, message: '请输入姓名' },
                      ]}
                    >
                      <Input placeholder="请输入学生姓名" autoComplete="name" />
                    </Form.Item>
                    <Form.Item label="密码">
                      <Input.Password value={ASSISTANT_DEFAULT_PASSWORD} disabled />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" block loading={loading || submitting}>
                      登录
                    </Button>
                  </Form>
                </>
              ),
            },
            {
              key: 'student',
              label: '同学借用',
              children: (
                <>
                  <Text type="secondary">学号 + 手机号登录，首次请填写姓名</Text>
                  <Form
                    form={studentForm}
                    layout="vertical"
                    onFinish={async (values) => {
                      setSubmitting(true)
                      try {
                        const data = await studentLogin(
                          values.studentNo.trim(),
                          values.phone.trim(),
                          values.name?.trim()
                        )
                        message.success('登录成功')
                        redirectAfterLogin(data.user)
                      } catch (error) {
                        message.error(error.message || '登录失败')
                      } finally {
                        setSubmitting(false)
                      }
                    }}
                    style={{ marginTop: 16 }}
                  >
                    <Form.Item name="studentNo" label="学号" rules={[{ required: true }]}>
                      <Input placeholder="学号" />
                    </Form.Item>
                    <Form.Item name="phone" label="手机号" rules={[{ required: true }]}>
                      <Input placeholder="11 位手机号" />
                    </Form.Item>
                    <Form.Item name="name" label="姓名">
                      <Input placeholder="首次登录必填" />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" block loading={loading || submitting}>
                      登录
                    </Button>
                  </Form>
                </>
              ),
            },
            {
              key: 'admin',
              label: '管理员',
              children: (
                <Form
                  form={adminForm}
                  layout="vertical"
                  onFinish={handleAdminLogin}
                  style={{ marginTop: 8 }}
                >
                    <Form.Item
                      name="account"
                      label="用户名"
                      rules={[{ required: true, message: '请输入用户名' }]}
                    >
                      <Input placeholder="请输入用户名" autoComplete="username" />
                    </Form.Item>
                    <Form.Item
                      name="password"
                      label="密码"
                      rules={[{ required: true, message: '请输入密码' }]}
                    >
                      <Input.Password placeholder="请输入密码" autoComplete="current-password" />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" block loading={loading || submitting}>
                      登录
                    </Button>
                  </Form>
              ),
            },
          ]}
        />
      </Card>
    </div>
  )
}
