import { getApiBaseUrl } from '../constants/config.js'
import { POST_LOGIN_REDIRECT_KEY } from '../constants/routes.js'

const API_SUCCESS_CODE = 'SUCCESS'

/** @param {unknown} payload */
export function extractApiErrorMessage(payload, fallback = '请求失败') {
  if (!payload || typeof payload !== 'object') {
    return fallback
  }
  const record = /** @type {Record<string, unknown>} */ (payload)
  const msg = record.message ?? record.msg ?? record.errorMessage
  return typeof msg === 'string' && msg.trim() ? msg.trim() : fallback
}

/** @param {unknown} payload */
function isApiBusinessFailure(payload) {
  if (!payload || typeof payload !== 'object') {
    return false
  }
  const record = /** @type {Record<string, unknown>} */ (payload)
  if (record.success === false) {
    return true
  }
  if (record.success === true) {
    return false
  }
  const code = record.resultCode
  return typeof code === 'string' && code.length > 0 && code !== API_SUCCESS_CODE
}

/** @param {unknown} payload */
function unwrapApiPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return payload
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'data')) {
    return /** @type {{ data: unknown }} */ (payload).data
  }
  return payload
}

class ApiClient {
  async request(url, options = {}) {
    const { method = 'GET', body, headers = {} } = options

    const config = {
      method,
      headers: {
        ...headers,
      },
      credentials: 'include',
    }

    const isFormData = body instanceof FormData
    if (!isFormData) {
      config.headers['Content-Type'] = 'application/json'
    }
    if (body) {
      config.body = isFormData ? body : JSON.stringify(body)
    }

    // HTTPS 开发模式下 Cookie 可能不稳定，用 Header 兜底（后端已支持 X-Session-Token）
    try {
      const { useAuthStore } = await import('entities/auth')
      const sessionToken = useAuthStore.getState().sessionToken
      if (sessionToken && !config.headers['X-Session-Token']) {
        config.headers['X-Session-Token'] = sessionToken
      }
    } catch {
      // ignore
    }

    const baseURL = getApiBaseUrl()
    const response = await fetch(`${baseURL}${url}`, config)

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
      throw new Error(extractApiErrorMessage(errorData, '未登录或会话已过期'))
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(extractApiErrorMessage(errorData, `请求失败: ${response.status}`))
    }

    const data = await response.json().catch(() => ({}))
    if (isApiBusinessFailure(data)) {
      throw new Error(extractApiErrorMessage(data))
    }
    return unwrapApiPayload(data)
  }

  get(url, options) {
    return this.request(url, { ...options, method: 'GET' })
  }

  post(url, body, options) {
    return this.request(url, { ...options, method: 'POST', body })
  }
}

export const apiClient = new ApiClient()
