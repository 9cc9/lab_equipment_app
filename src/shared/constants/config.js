const DEFAULT_API_PORT = import.meta.env.VITE_API_PORT || '8085'

export const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL
  }
  if (import.meta.env.DEV) {
    // HTTPS 前端走 Vite 代理，避免 mixed content 拦截
    if (window.location.protocol === 'https:') {
      return window.location.origin
    }
    return `http://${window.location.hostname}:${DEFAULT_API_PORT}`
  }
  return window.location.origin
}
