export type OrderType = 'popularity' | 'newest' | 'priceDesc' | 'priceAsc' | 'searchMatching' | 'distance'

export interface FilterParams {
  minParticipants: number | null
  maxParticipants: number | null
  minPrice: number | null
  maxPrice: number | null
  activityType: string | null
  duration: number | null
  embeddingIds: string[] | null
  embeddingScores: Record<string, number> | null
  order: OrderType | null
}

export const parseFilters = (searchParams: URLSearchParams): FilterParams => {
  let minParticipants: number | undefined
  let maxParticipants: number | undefined

  const rawMinParticipants = searchParams.get('minParticipants')
    ? parseInt(searchParams.get('minParticipants')!)
    : undefined
  const rawMaxParticipants = searchParams.get('maxParticipants')
    ? parseInt(searchParams.get('maxParticipants')!)
    : undefined

  // Handle min participants
  if (typeof rawMinParticipants === 'number' && !isNaN(rawMinParticipants) && rawMinParticipants > 0) {
    minParticipants = rawMinParticipants
  }

  // Handle max participants
  if (typeof rawMaxParticipants === 'number' && !isNaN(rawMaxParticipants) && rawMaxParticipants > 0) {
    // Only set max if it's greater than min (when min exists)
    if (!minParticipants || rawMaxParticipants > minParticipants) {
      maxParticipants = rawMaxParticipants
    }
  }

  let minPrice: number | undefined
  let maxPrice: number | undefined

  const rawMinPrice = searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice')!) : undefined
  const rawMaxPrice = searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!) : undefined

  if (
    typeof rawMinPrice === 'number' &&
    typeof rawMaxPrice === 'number' &&
    !isNaN(rawMinPrice) &&
    !isNaN(rawMaxPrice) &&
    rawMinPrice > 0 &&
    rawMaxPrice >= rawMinPrice
  ) {
    minPrice = rawMinPrice
    maxPrice = rawMaxPrice
  }

  const activityType = searchParams.get('activityType') ? searchParams.get('activityType') : null
  const duration = searchParams.get('duration') ? parseInt(searchParams.get('duration')!) : null
  const order = searchParams.get('order') as OrderType | null

  return {
    minParticipants: minParticipants || null,
    maxParticipants: maxParticipants || null,
    minPrice: minPrice || null,
    maxPrice: maxPrice || null,
    activityType,
    duration,
    embeddingIds: null, // This will be set by the embeddings fetch if needed
    embeddingScores: null, // This will be set by the embeddings fetch if needed
    order,
  }
}

export const getOrderClause = (
  order: OrderType | null,
  isSearchMode = false,
  type: 'activities' | 'hotels' | 'eventSpaces' = 'activities',
  preserveArrayOrder = false
): string => {
  if (order === 'distance' && type === 'eventSpaces') return 'distanceKm asc'

  switch (order) {
    case 'newest':
      return 'coalesce(publishedDate, _createdAt) desc'
    case 'priceDesc':
      if (type === 'hotels') {
        return 'pricing.pricingVisible desc, pricing.pricePerPerson desc'
      }
      if (type === 'eventSpaces') {
        return 'pricing.pricingVisible desc, pricing.fromPrice desc'
      }
      return 'pricing.basePrice desc'
    case 'priceAsc':
      if (type === 'hotels') {
        return 'pricing.pricingVisible desc, pricing.pricePerPerson asc'
      }
      if (type === 'eventSpaces') {
        return 'pricing.pricingVisible desc, pricing.fromPrice asc'
      }
      return 'pricing.basePrice asc'
    case 'popularity':
      return preserveArrayOrder ? '' : 'popularityIndex desc'
    case 'searchMatching':
      return isSearchMode && type !== 'eventSpaces' ? '_score desc, _id asc' : preserveArrayOrder ? '' : 'popularityIndex desc'
    default:
      if (isSearchMode && type !== 'eventSpaces') return '_score desc, _id asc'
      return preserveArrayOrder ? '' : 'popularityIndex desc'
  }
}

export const buildFilterUrl = (params: {
  minParticipants?: number
  maxParticipants?: number
  activityType?: string
  duration?: number
  order?: OrderType
  searchParams: URLSearchParams
  currentPath: string
}) => {
  // Detect language from path and set appropriate path segments
  const isEnglish = params.currentPath.startsWith('/en/')
  const filterPath = isEnglish ? 'filter' : 'filtr'
  const pagePath = isEnglish ? 'page' : 'strona'
  const categoryPath = isEnglish ? 'category' : 'kategoria'

  const newParams = new URLSearchParams(params.searchParams)

  // Only remove the parameters we're explicitly setting
  if ('minParticipants' in params || 'maxParticipants' in params) {
    newParams.delete('minParticipants')
    newParams.delete('maxParticipants')
  }
  if ('activityType' in params) {
    newParams.delete('activityType')
  }
  if ('duration' in params) {
    newParams.delete('duration')
  }
  if ('order' in params) {
    newParams.delete('order')
  }

  // Set new parameters if they exist
  if (params.minParticipants) {
    newParams.set('minParticipants', params.minParticipants.toString())
  }
  if (params.maxParticipants) {
    newParams.set('maxParticipants', params.maxParticipants.toString())
  }
  if (params.activityType) {
    newParams.set('activityType', params.activityType)
  }
  if (typeof params.duration === 'number') {
    newParams.set('duration', params.duration.toString())
  }
  if (params.order) {
    newParams.set('order', params.order.toString())
  }

  const queryString = newParams.toString()

  // Any parameter that remains keeps the filter route, so new filters need no change here
  const hasAnyFilters = queryString !== ''

  // If we're on a filter page but have no filters, redirect to static page
  if (params.currentPath.includes(`/${filterPath}`) && !hasAnyFilters) {
    let staticPath = params.currentPath

    // Remove filter segment to get back to static page
    staticPath = staticPath.replace(`/${filterPath}/`, '/').replace(`/${filterPath}`, '/')

    // Remove page path to go back to first page
    if (staticPath.includes(`/${pagePath}/`)) {
      staticPath = staticPath.replace(new RegExp(`\/${pagePath}\/\\d+\/?`), '/')
    }

    // Ensure proper trailing slash
    if (!staticPath.endsWith('/')) {
      staticPath += '/'
    }

    return staticPath
  }

  // Enhanced handling for filter URL structure (hotels and activities categories)
  if (params.currentPath.includes(`/${filterPath}`)) {
    // Already on a filtered page, but reset to page 1 when filters change
    let filteredPath = params.currentPath

    // Remove page path to always go back to first page when filters change
    if (filteredPath.includes(`/${pagePath}/`)) {
      filteredPath = filteredPath.replace(new RegExp(`\/${pagePath}\/\\d+\/?`), '/')
    }

    // Ensure proper trailing slash before filter path
    if (filteredPath.endsWith(`/${filterPath}`)) {
      filteredPath = filteredPath.replace(`/${filterPath}`, `/${filterPath}/`)
    }

    return `${filteredPath}${queryString ? `?${queryString}` : ''}`
  } else {
    // On static page, but filter/sort changes should redirect to filter path
    if (hasAnyFilters) {
      // Any filter or sort change should redirect to the filter version
      let basePath = params.currentPath

      // Remove page path to go back to first page when applying filters
      if (basePath.includes(`/${pagePath}/`)) {
        basePath = basePath.replace(new RegExp(`\/${pagePath}\/\\d+\/?`), '/')
      }

      // Ensure proper trailing slash and add filter path
      if (!basePath.endsWith('/')) {
        basePath += '/'
      }
      const finalFilterPath = basePath + filterPath + '/'

      return `${finalFilterPath}${queryString ? `?${queryString}` : ''}`
    } else {
      // No filters specified, use enhanced path slicing for categories
      const pathSegments = params.currentPath.split('/')
      let targetSegments

      if (params.currentPath.includes(`/${categoryPath}/`)) {
        // For category pages: /pl/integracje/kategoria/dla-grup/ or /en/activities/category/team-building/
        // Keep segments up to category name (index 4)
        targetSegments = pathSegments.slice(0, 5)
      } else if (
        params.currentPath.includes('/hotele/') ||
        params.currentPath.includes('/hotels/') ||
        params.currentPath.includes('/przestrzenie-eventowe/') ||
        params.currentPath.includes('/event-spaces/')
      ) {
        // For hotel pages: /pl/hotele/ or /en/hotels/
        targetSegments = pathSegments.slice(0, 3)
      } else {
        // For base activities pages: /pl/integracje/ or /en/activities/
        targetSegments = pathSegments.slice(0, 3)
      }

      return `${targetSegments.join('/')}/${queryString ? `?${queryString}` : ''}`
    }
  }
}
