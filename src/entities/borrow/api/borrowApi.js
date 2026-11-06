import { apiClient } from 'shared/api/client'
import { API_ENDPOINTS } from 'shared/api/endpoints'

export const fetchBorrowableEquipment = (params = {}) => {
  const q = new URLSearchParams()
  if (params.keyword) q.set('keyword', params.keyword)
  if (params.roomCode) q.set('roomCode', params.roomCode)
  if (params.borrowType) q.set('borrowType', params.borrowType)
  const query = q.toString()
  return apiClient.get(`${API_ENDPOINTS.BORROW.EQUIPMENT}${query ? `?${query}` : ''}`)
}

export const fetchBorrowEquipmentDetail = (assetCode) =>
  apiClient.get(API_ENDPOINTS.BORROW.EQUIPMENT_DETAIL(assetCode))

export const submitBorrowApplication = (payload) =>
  apiClient.post(API_ENDPOINTS.BORROW.APPLICATIONS, payload)

export const fetchMyBorrowApplications = (page = 1, pageSize = 20) =>
  apiClient.get(`${API_ENDPOINTS.BORROW.MINE}?page=${page}&pageSize=${pageSize}`)

export const fetchBorrowApplication = (id) =>
  apiClient.get(API_ENDPOINTS.BORROW.APPLICATION(id))

export const cancelBorrowApplication = (id) =>
  apiClient.post(API_ENDPOINTS.BORROW.CANCEL(id))

export const requestReturnBorrowApplication = (id, remark) =>
  apiClient.post(API_ENDPOINTS.BORROW.REQUEST_RETURN(id), { remark })

export const fetchDueWarningBorrowApplications = (params = {}) => {
  const q = new URLSearchParams()
  q.set('page', String(params.page || 1))
  q.set('pageSize', String(params.pageSize || 20))
  return apiClient.get(`${API_ENDPOINTS.ADMIN_BORROW.DUE_WARNINGS}?${q.toString()}`)
}

export const fetchAdminBorrowApplications = (params = {}) => {
  const q = new URLSearchParams()
  q.set('page', String(params.page || 1))
  q.set('pageSize', String(params.pageSize || 20))
  if (params.status) q.set('status', params.status)
  if (params.borrowType) q.set('borrowType', params.borrowType)
  if (params.assetCode) q.set('assetCode', params.assetCode)
  if (params.studentNo) q.set('studentNo', params.studentNo)
  if (params.overdueOnly) q.set('overdueOnly', 'true')
  return apiClient.get(`${API_ENDPOINTS.ADMIN_BORROW.LIST}?${q.toString()}`)
}

export const approveBorrowApplication = (id, remark) =>
  apiClient.post(API_ENDPOINTS.ADMIN_BORROW.APPROVE(id), { remark })

export const rejectBorrowApplication = (id, remark) =>
  apiClient.post(API_ENDPOINTS.ADMIN_BORROW.REJECT(id), { remark })

export const returnBorrowApplication = (id, remark) =>
  apiClient.post(API_ENDPOINTS.ADMIN_BORROW.RETURN(id), { remark })

export const updateEquipmentBorrow = (assetCode, payload) =>
  apiClient.post(API_ENDPOINTS.EQUIPMENT.UPDATE_BORROW(assetCode), payload)
