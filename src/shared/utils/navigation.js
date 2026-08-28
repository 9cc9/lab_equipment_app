/** 跳转时携带当前页路径，供详情页「返回」使用 */
export const withReturnPath = (location) => ({
  from: `${location.pathname}${location.search}`,
})

/** 返回上一页：优先 state.from，否则浏览器历史，最后回首页 */
export const navigateBack = (navigate, location, fallback = '/') => {
  const from = location.state?.from
  if (typeof from === 'string' && from.startsWith('/')) {
    navigate(from)
    return
  }
  if (window.history.length > 1) {
    navigate(-1)
    return
  }
  navigate(fallback)
}
