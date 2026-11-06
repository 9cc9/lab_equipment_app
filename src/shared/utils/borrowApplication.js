export const BORROW_STATUS_LABEL = {
  PENDING: '借用待审批',
  APPROVED: '借用中',
  REJECTED: '已驳回',
  CANCELLED: '已撤销',
  RETURN_PENDING: '结束待确认',
  RETURNED: '已结束',
}

export const formatBorrowStatus = (status, overdue) => {
  if (status === 'APPROVED' && overdue) return '已逾期'
  return BORROW_STATUS_LABEL[status] || status
}

export const formatBorrowType = (type) => (type === 'EXTERNAL' ? '外借带走' : '室内使用')

export const DUE_WARNING_LABEL = {
  OVERDUE: '已超时',
  DUE_SOON: '快超时',
}

export const formatDateTime = (value) => {
  if (!value) return '-'
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? '-' : d.toLocaleString()
}
