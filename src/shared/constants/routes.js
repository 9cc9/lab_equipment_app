export const POST_LOGIN_REDIRECT_KEY = 'post_login_redirect'

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SCAN: '/scan',
  IMPORT: '/admin/import',
  ROOM: (code) => `/rooms/${encodeURIComponent(code)}`,
  EQUIPMENT: (code) => `/equipment/${encodeURIComponent(code)}`,
}

export const USAGE_STATUS_OPTIONS = ['在用', '维修中', '借出', '待报废', '已报废', '已损坏']
