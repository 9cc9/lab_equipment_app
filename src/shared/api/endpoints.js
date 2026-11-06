export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/login.json',
    STUDENT_LOGIN: '/student/login.json',
    LOGOUT: '/logout.json',
  },
  BORROW: {
    EQUIPMENT: '/borrow/equipment.json',
    EQUIPMENT_DETAIL: (assetCode) => `/borrow/equipment/${encodeURIComponent(assetCode)}.json`,
    APPLICATIONS: '/borrow/applications.json',
    MINE: '/borrow/applications/mine.json',
    APPLICATION: (id) => `/borrow/applications/${encodeURIComponent(id)}.json`,
    CANCEL: (id) => `/borrow/applications/${encodeURIComponent(id)}/cancel.json`,
    REQUEST_RETURN: (id) => `/borrow/applications/${encodeURIComponent(id)}/request-return.json`,
  },
  ADMIN_BORROW: {
    LIST: '/admin/borrow/applications.json',
    DUE_WARNINGS: '/admin/borrow/due-warnings.json',
    APPROVE: (id) => `/admin/borrow/applications/${encodeURIComponent(id)}/approve.json`,
    REJECT: (id) => `/admin/borrow/applications/${encodeURIComponent(id)}/reject.json`,
    RETURN: (id) => `/admin/borrow/applications/${encodeURIComponent(id)}/return.json`,
  },
  ROOM: {
    LIST: '/rooms.json',
    EQUIPMENT: (roomCode) => `/rooms/${encodeURIComponent(roomCode)}/equipment.json`,
  },
  EQUIPMENT: {
    BY_CODE: (assetCode) => `/equipment/by-code/${encodeURIComponent(assetCode)}.json`,
    SEARCH: (keyword) => `/equipment/search.json?keyword=${encodeURIComponent(keyword)}`,
    UPDATE_STATUS: (assetCode) => `/equipment/by-code/${encodeURIComponent(assetCode)}/update-status.json`,
    BATCH_UPDATE_STATUS: '/equipment/batch-update-status.json',
    DELETE: (assetCode) => `/equipment/by-code/${encodeURIComponent(assetCode)}/delete.json`,
    BATCH_DELETE: '/equipment/batch-delete.json',
    CHANGES: (equipmentId) => `/equipment/${encodeURIComponent(equipmentId)}/changes.json`,
    CHANGE_LOGS: '/equipment/change-logs.json',
    UPDATE_BORROW: (assetCode) => `/equipment/by-code/${encodeURIComponent(assetCode)}/update-borrow.json`,
    BATCH_UPDATE_BORROW: '/equipment/batch-update-borrow.json',
  },
  ADMIN: {
    IMPORT: '/admin/import.json',
    EXPORT: '/admin/export.json',
  },
}
