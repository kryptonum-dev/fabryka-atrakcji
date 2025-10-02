export type OrderType = 'popularity' | 'newest' | 'priceDesc' | 'priceAsc' | 'searchMatching'

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
  // Hotel specific filters
  location: string | null
  amenities: string[] | null
  stars: number | null
  minRooms: number | null
  maxRooms: number | null
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

  // Parse hotel specific filters
  const location = searchParams.get('location')
  const amenities = searchParams.get('amenities') ? searchParams.get('amenities')!.split(',') : null

  // Validate stars (must be between 1 and 5)
  const rawStars = searchParams.get('stars') ? parseInt(searchParams.get('stars')!) : null
  const stars = rawStars && rawStars >= 1 && rawStars <= 5 ? rawStars : null

  // Validate rooms
  let minRooms: number | null = null
  let maxRooms: number | null = null

  const rawMinRooms = searchParams.get('minRooms') ? parseInt(searchParams.get('minRooms')!) : null
  const rawMaxRooms = searchParams.get('maxRooms') ? parseInt(searchParams.get('maxRooms')!) : null

  // Validate min rooms (must be at least 1)
  if (rawMinRooms && rawMinRooms >= 1) {
    minRooms = rawMinRooms
  }

  // Validate max rooms (must be at least 1 and greater than minRooms if it exists)
  if (rawMaxRooms && rawMaxRooms >= 1 && (!minRooms || rawMaxRooms >= minRooms)) {
    maxRooms = rawMaxRooms
  }

  // If maxRooms is invalid, also reset minRooms to maintain consistency
  if (!maxRooms) {
    minRooms = null
  }

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
    // Hotel specific filters
    location,
    amenities,
    stars,
    minRooms,
    maxRooms,
  }
}

export const getOrderClause = (
  order: OrderType | null,
  isSearchMode = false,
  type: 'activities' | 'hotels' = 'activities'
): string => {
  switch (order) {
    case 'newest':
      return 'coalesce(publishedDate, _createdAt) desc'
    case 'priceDesc':
      if (type === 'hotels') {
        // Push non-public pricing hotels to the end, then sort by price descending
        return 'pricing.pricingVisible desc, pricing.pricePerPerson desc'
      }
      return 'pricing.basePrice desc'
    case 'priceAsc':
      if (type === 'hotels') {
        // Push non-public pricing hotels to the end, then sort by price ascending
        return 'pricing.pricingVisible desc, pricing.pricePerPerson asc'
      }
      return 'pricing.basePrice asc'
    case 'popularity':
      return 'popularityIndex desc'
    case 'searchMatching':
      return isSearchMode ? '_score desc' : 'popularityIndex desc'
    default:
      // If no order specified, use score for search mode, popularity otherwise
      return isSearchMode ? '_score desc' : 'popularityIndex desc'
  }
}

export const fetchEmbeddings = async (
  searchQuery: string,
  type: 'activities' | 'hotels',
  url: string
): Promise<{ data: { documentId: string; score: number }[] } | null> => {
  try {
    const response = await fetch(`${url}/api/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ searchQuery, type }),
    })

    if (!response.ok) {
      console.error('Error fetching embeddings:', await response.text())
      return null
    }

    const { data } = await response.json()
    return data
  } catch (error) {
    console.error('Error in embeddings fetch:', error)
    return null
  }
}

export const getHotelFilters = (filters: FilterParams) => {
  const locationFilter = filters.location
    ? `&& references(*[_type == "Locations_Collection" && _id == "${filters.location}"]._id)`
    : ''

  const amenitiesFilter = filters.amenities?.length
    ? `&& count(amenities[_ref in [${filters.amenities.map((id: string) => `"${id}"`).join(',')}]]) == ${filters.amenities.length}`
    : ''

  const starsFilter = filters.stars ? `&& stars == ${filters.stars}` : ''

  const minRoomsFilter = filters.minRooms ? `&& numberOfRooms >= ${filters.minRooms}` : ''

  const maxRoomsFilter = filters.maxRooms ? `&& numberOfRooms <= ${filters.maxRooms}` : ''

  const priceFilter =
    filters.maxPrice || filters.minPrice
      ? `&& ((pricing.pricingType == "perPerson" && pricing.pricePerPerson >= ${filters.minPrice || 0} && pricing.pricePerPerson <= ${filters.maxPrice || 100000}) || (pricing.pricingType == "fixed" && pricing.additionalPersonPrice >= ${filters.minPrice || 0} && pricing.additionalPersonPrice <= ${filters.maxPrice || 100000}))`
      : ''

  return {
    locationFilter,
    amenitiesFilter,
    starsFilter,
    minRoomsFilter,
    maxRoomsFilter,
    priceFilter,
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

  // Check if we have any filters at all (including existing ones not being modified)
  const hasAnyFilters =
    newParams.has('minParticipants') ||
    newParams.has('maxParticipants') ||
    newParams.has('activityType') ||
    newParams.has('duration') ||
    newParams.has('order') ||
    newParams.has('minPrice') ||
    newParams.has('maxPrice') ||
    newParams.has('search') ||
    // Hotel specific filters
    newParams.has('location') ||
    newParams.has('amenities') ||
    newParams.has('stars') ||
    newParams.has('minRooms') ||
    newParams.has('maxRooms')

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
      } else if (params.currentPath.includes('/hotele/') || params.currentPath.includes('/hotels/')) {
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
