import type { OrderType } from '@/src/templates/activities/ActivitiesPage.astro'

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

export const getOrderClause = (order: OrderType | null, isSearchMode = false): string => {
  switch (order) {
    case 'newest':
      return 'coalesce(publishedDate, _createdAt) desc'
    case 'priceDesc':
      return 'pricing.basePrice desc'
    case 'priceAsc':
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
  searchQuery: string
): Promise<{ data: { documentId: string; score: number }[] } | null> => {
  try {
    const response = await fetch(`http://localhost:4321/api/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ searchQuery }),
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
