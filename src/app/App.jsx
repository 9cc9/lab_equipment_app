import { useEffect } from 'react'
import { App as AntdApp, ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { Router } from './router'
import { useAuthStore } from 'entities/auth'
import { hasCookie, COOKIE_NAMES } from 'shared/utils/cookie'

export const App = () => {
  const { isAuthenticated, clearAuth } = useAuthStore()

  useEffect(() => {
    if (isAuthenticated && !hasCookie(COOKIE_NAMES.SESSION_TOKEN)) {
      clearAuth()
    }
  }, [isAuthenticated, clearAuth])

  return (
    <ConfigProvider locale={zhCN}>
      <AntdApp>
        <Router />
      </AntdApp>
    </ConfigProvider>
  )
}
