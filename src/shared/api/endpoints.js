export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/login.json',
    LOGOUT: '/logout.json',
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
    CHANGES: (equipmentId) => `/equipment/${encodeURIComponent(equipmentId)}/changes.json`,
    CHANGE_LOGS: '/equipment/change-logs.json',
  },
  ADMIN: {
    IMPORT: '/admin/import.json',
    EXPORT: '/admin/export.json',
  },
}
