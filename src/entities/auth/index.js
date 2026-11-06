export { useAuthStore } from './store/authStore'
export { login, studentLogin, logout } from './api/authApi'

export const isAdminUser = (user) =>
  Boolean(user) && (user.userType === 'ADMIN' || user.username === 'admin')

export const isStudentUser = (user) => Boolean(user) && user.userType === 'STUDENT'

export const isStaffUser = (user) =>
  Boolean(user) && (user.userType === 'ADMIN' || user.userType === 'ASSISTANT' || isAdminUser(user))
