export function collectionPath(path: string): string {
  const base = path.replace(/\/(?:page|strona)\/\d+(?=\/|$)/, '').replace(/\/(?:filtr|filter)(?=\/|$)/, '')
  return base.replace(/\/+$/, '') + '/'
}

export function searchNavigation(path: string, currentParams: URLSearchParams, value: string): string {
  const base = collectionPath(path)
  const query = value.trim()
  if (!query) return base
  const params = new URLSearchParams(currentParams)
  params.set('search', query)
  params.delete('order')
  params.delete('page')
  return `${base}${path.startsWith('/en/') ? 'filter' : 'filtr'}/?${params}`
}

export function paginationPath(slugBase: string, page: number, path: string, params?: URLSearchParams): string {
  const english = path.startsWith('/en/')
  const filtered = /\/(?:filtr|filter)(?:\/|$)/.test(path)
  const base = collectionPath(slugBase).replace(/\/$/, '')
  const target = `${base}${page > 1 ? `/${english ? 'page' : 'strona'}/${page}` : ''}${filtered ? `/${english ? 'filter' : 'filtr'}` : ''}/`
  return `${target}${params?.size ? `?${params}` : ''}`
}
