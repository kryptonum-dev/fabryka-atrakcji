export function setCookie(name: string, value: string, ttlInDays?: number) {
  if (typeof document === 'undefined') return

  let expires = ''
  if (typeof ttlInDays === 'number') {
    const date = new Date()
    date.setTime(date.getTime() + ttlInDays * 24 * 60 * 60 * 1000)
    expires = `; expires=${date.toUTCString()}`
  }

  document.cookie = `${name}=${encodeURIComponent(value)}${expires}; path=/; SameSite=Lax;`
}


