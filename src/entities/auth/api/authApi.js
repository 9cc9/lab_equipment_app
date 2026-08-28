import { apiClient } from 'shared/api/client'
import { API_ENDPOINTS } from 'shared/api/endpoints'

export const login = (account, password) =>
  apiClient.post(API_ENDPOINTS.AUTH.LOGIN, { account, password })

export const logout = () => apiClient.post(API_ENDPOINTS.AUTH.LOGOUT)
