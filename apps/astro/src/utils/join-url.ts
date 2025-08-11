/**
 * Safely joins a base URL and a pathname without collapsing protocol slashes.
 * Trims trailing slashes from base and leading slashes from pathname.
 */
export const joinUrl = (base: string, pathname: string): string => {
  const normalizedBase = (base || '').replace(/\/+$/, '')
  const normalizedPath = (pathname || '').replace(/^\/+/, '')
  if (!normalizedBase) return normalizedPath
  return normalizedPath ? `${normalizedBase}/${normalizedPath}` : normalizedBase
}
