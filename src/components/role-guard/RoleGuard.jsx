import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore, isStudentUser } from 'entities/auth'
import { ROUTES } from 'shared/constants/routes'

const STAFF_ONLY_PREFIXES = ['/', '/rooms', '/scan', '/equipment', '/changes', '/admin/import', '/staff/borrow']

const isBorrowApplyPath = (path) => {
  if (!path.startsWith('/borrow/')) {
    return false
  }
  if (path.startsWith('/borrow/applications/')) {
    return false
  }
  return path !== '/borrow/mine'
}

export const RoleGuard = ({ children }) => {
  const user = useAuthStore((state) => state.user)
  const location = useLocation()
  const path = location.pathname

  if (user && !isStudentUser(user)) {
    if (path === ROUTES.BORROW_MINE || isBorrowApplyPath(path)) {
      return <Navigate to={`${ROUTES.STAFF_BORROW}?tab=catalog`} replace />
    }
  }

  if (isStudentUser(user)) {
    const blocked = STAFF_ONLY_PREFIXES.some((prefix) =>
      prefix === '/' ? path === '/' : path.startsWith(prefix)
    )
    if (blocked) {
      return <Navigate to={ROUTES.BORROW} replace />
    }
  }

  return children
}
