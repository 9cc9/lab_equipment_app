import { Navigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Spin } from 'antd'
import { useAuthStore } from 'entities/auth'
import { hasCookie, COOKIE_NAMES } from 'shared/utils/cookie'
import { ROUTES } from 'shared/constants/routes'

const hasSession = (sessionToken) => {
  return hasCookie(COOKIE_NAMES.SESSION_TOKEN) || !!sessionToken
}

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, sessionToken, clearAuth } = useAuthStore()
  const location = useLocation()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (isAuthenticated && !hasSession(sessionToken)) {
      clearAuth()
    }
    setChecking(false)
  }, [isAuthenticated, sessionToken, clearAuth])

  if (checking) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
        <Spin />
      </div>
    )
  }

  if (!hasSession(sessionToken)) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />
  }

  return children
}
