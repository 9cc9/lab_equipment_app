import { apiClient } from 'shared/api/client'
import { getApiBaseUrl } from 'shared/constants/config'
import { POST_LOGIN_REDIRECT_KEY } from 'shared/constants/routes'
import { API_ENDPOINTS } from 'shared/api/endpoints'

export const fetchRooms = () => apiClient.get(API_ENDPOINTS.ROOM.LIST)

export const fetchRoomEquipment = (roomCode, { keyword, usageStatus, sortOrder } = {}) => {
  const params = new URLSearchParams()
  if (keyword) params.set('keyword', keyword)
  if (usageStatus) params.set('usageStatus', usageStatus)
  if (sortOrder) params.set('sortOrder', sortOrder)
  const qs = params.toString()
  const url = qs
    ? `${API_ENDPOINTS.ROOM.EQUIPMENT(roomCode)}?${qs}`
    : API_ENDPOINTS.ROOM.EQUIPMENT(roomCode)
  return apiClient.get(url)
}

export const fetchEquipmentByCode = (assetCode) =>
  apiClient.get(API_ENDPOINTS.EQUIPMENT.BY_CODE(assetCode))

export const searchEquipment = (keyword) =>
  apiClient.get(API_ENDPOINTS.EQUIPMENT.SEARCH(keyword))

export const updateEquipmentStatus = (assetCode, payload) =>
  apiClient.post(API_ENDPOINTS.EQUIPMENT.UPDATE_STATUS(assetCode), payload)

export const batchUpdateEquipmentStatus = (payload) =>
  apiClient.post(API_ENDPOINTS.EQUIPMENT.BATCH_UPDATE_STATUS, payload)

export const fetchEquipmentChanges = (equipmentId) =>
  apiClient.get(API_ENDPOINTS.EQUIPMENT.CHANGES(equipmentId))

export const fetchEquipmentChangeLogs = ({ page = 1, pageSize = 20, fieldName } = {}) => {
  const params = new URLSearchParams()
  params.set('page', String(page))
  params.set('pageSize', String(pageSize))
  if (fieldName) params.set('fieldName', fieldName)
  return apiClient.get(`${API_ENDPOINTS.EQUIPMENT.CHANGE_LOGS}?${params.toString()}`)
}

export const importEquipmentExcel = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return apiClient.post(API_ENDPOINTS.ADMIN.IMPORT, formData)
}

export const exportEquipmentExcel = async () => {
  const headers = {}
  try {
    const { useAuthStore } = await import('entities/auth')
    const sessionToken = useAuthStore.getState().sessionToken
    if (sessionToken) {
      headers['X-Session-Token'] = sessionToken
    }
  } catch {
    // ignore
  }

  const response = await fetch(`${getApiBaseUrl()}${API_ENDPOINTS.ADMIN.EXPORT}`, {
    method: 'GET',
    credentials: 'include',
    headers,
  })

  if (response.status === 401) {
    const errorData = await response.json().catch(() => ({}))
    const { useAuthStore } = await import('entities/auth')
    useAuthStore.getState().clearAuth()
    if (!window.location.pathname.includes('/login')) {
      const returnPath = window.location.pathname + window.location.search
      try {
        sessionStorage.setItem(POST_LOGIN_REDIRECT_KEY, returnPath)
      } catch {
        // ignore
      }
      window.location.href = '/login'
    }
    throw new Error(errorData.message || '未登录或会话已过期')
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || '导出失败')
  }

  const contentType = response.headers.get('Content-Type') || ''
  const blob = await response.blob()
  if (blob.size < 128 || contentType.includes('text/html') || contentType.includes('application/json')) {
    throw new Error('导出失败：服务器返回了无效文件，请确认后端已更新并重新登录后再试')
  }
  const disposition = response.headers.get('Content-Disposition')
  let filename = `设备数据_${new Date().toISOString().slice(0, 10)}.xlsx`
  if (disposition) {
    const match = disposition.match(/filename="?([^";]+)"?/)
    if (match?.[1]) {
      filename = match[1]
    }
  }

  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}
