export const POST_LOGIN_REDIRECT_KEY = 'post_login_redirect'

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SCAN: '/scan',
  IMPORT: '/admin/import',
  CHANGES: '/changes',
  BORROW: '/borrow',
  BORROW_MINE: '/borrow/mine',
  BORROW_APPLICATION: (id) => `/borrow/applications/${encodeURIComponent(id)}`,
  BORROW_APPLY: (code) => `/borrow/${encodeURIComponent(code)}`,
  STAFF_BORROW: '/staff/borrow',
  /** @deprecated 使用 STAFF_BORROW */
  ADMIN_BORROW: '/staff/borrow',
  ROOM: (code) => `/rooms/${encodeURIComponent(code)}`,
  EQUIPMENT: (code) => `/equipment/${encodeURIComponent(code)}`,
}

export const USAGE_STATUS_OPTIONS = ['在用','在用无条码', '已遗失', '已损坏', '维修中', '借出', '待报废', '已报废']
