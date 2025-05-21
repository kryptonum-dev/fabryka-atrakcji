/**
 * Extracts a cookie value from request headers
 * Used server-side in API routes to read cookies
 *
 * @param name - The name of the cookie to extract
 * @param headers - The headers object from the request
 * @returns The cookie value or null if not found
 */
export function getCookie(name: string, headers: Headers): string | null {
  const cookieHeader = headers.get('cookie')
  if (!cookieHeader) return null

  const cookies = cookieHeader.split(';')
  for (const cookie of cookies) {
    const parts = cookie.trim().split('=')
    if (parts.length >= 2) {
      const cookieName = parts[0].trim()
      if (cookieName === name) {
        // Combine all parts after the first '=' sign to handle values containing '='
        const cookieValue = parts.slice(1).join('=')
        return decodeURIComponent(cookieValue)
      }
    }
  }

  return null
}
