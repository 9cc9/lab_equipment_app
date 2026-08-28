import { apiClient } from 'shared/api/client'
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

export const fetchEquipmentChanges = (equipmentId) =>
  apiClient.get(API_ENDPOINTS.EQUIPMENT.CHANGES(equipmentId))

export const importEquipmentExcel = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return apiClient.post(API_ENDPOINTS.ADMIN.IMPORT, formData)
}
