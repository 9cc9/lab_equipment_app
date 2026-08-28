export const COOKIE_NAMES = {
  SESSION_TOKEN: 'SESSION_TOKEN',
}

export const hasCookie = (name) => {
  return document.cookie.split(';').some((item) => item.trim().startsWith(`${name}=`))
}
