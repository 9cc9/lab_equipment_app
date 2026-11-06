import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Button, Space, Tabs, Typography } from 'antd'
import { LogoutOutlined } from '@ant-design/icons'
import { isStaffUser, useAuthStore } from 'entities/auth'
import { ROUTES } from 'shared/constants/routes'

const { Title, Text } = Typography

const STAFF_MAIN_TAB = {
  EQUIPMENT: 'equipment',
  BORROW: 'borrow',
}

export const StaffLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()

  if (!isStaffUser(user)) {
    return <Outlet />
  }

  const mainTab = location.pathname.startsWith(ROUTES.STAFF_BORROW)
    ? STAFF_MAIN_TAB.BORROW
    : STAFF_MAIN_TAB.EQUIPMENT

  const onMainTabChange = (key) => {
    if (key === STAFF_MAIN_TAB.BORROW) {
      navigate(ROUTES.STAFF_BORROW)
      return
    }
    navigate(ROUTES.HOME)
  }

  const handleLogout = async () => {
    await logout()
    navigate(ROUTES.LOGIN)
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <Title level={3} style={{ margin: 0 }}>实验室设备管理</Title>
          <Text type="secondary">欢迎，{user?.name || user?.username}</Text>
        </div>
        <Space className="page-header-actions" wrap>
          <Button icon={<LogoutOutlined />} onClick={handleLogout}>
            退出
          </Button>
        </Space>
      </div>

      <Tabs
        activeKey={mainTab}
        onChange={onMainTabChange}
        items={[
          { key: STAFF_MAIN_TAB.EQUIPMENT, label: '设备管理' },
          { key: STAFF_MAIN_TAB.BORROW, label: '设备借用' },
        ]}
        style={{ marginBottom: 16 }}
      />

      <Outlet />
    </div>
  )
}
