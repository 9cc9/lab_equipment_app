import { getApiBaseUrl } from '../constants/config.js'
import { POST_LOGIN_REDIRECT_KEY } from '../constants/routes.js'

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
      throw new Error(errorData.message || '未登录或会话已过期')
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `请求失败: ${response.status}`)
    }

    const data = await response.json()
    if (data && data.success === false) {
      throw new Error(data.message || '请求失败')
    }
    return data.data !== undefined ? data.data : data
  }

  get(url, options) {
    return this.request(url, { ...options, method: 'GET' })
  }

  post(url, body, options) {
    return this.request(url, { ...options, method: 'POST', body })
  }
}

export const apiClient = new ApiClient()
