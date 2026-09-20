export const COLLECTIONS = { activities: 'Activities_Collection', hotels: 'Hotels_Collection' } as const
export type SearchType = keyof typeof COLLECTIONS
export type SearchLanguage = 'pl' | 'en'
export type SearchProvider = 'legacy' | 'dataset'
export type SearchInput = { searchQuery: string; type: SearchType; language?: SearchLanguage }
export type SearchCandidate = { score: number; value: { documentId: string; type: string } }
export type SearchResult = { status: 'success'; data: SearchCandidate[] } | { status: 'unavailable' }

export const SEARCH_LIMIT = 50
export const SEARCH_TIMEOUT_MS = 8000
export const SEARCH_API_VERSION = '2026-08-21'
export const SEARCH_DATASET = 'production'

export function parseSearchInput(value: unknown): SearchInput | null {
  if (!value || typeof value !== 'object') return null
  const { searchQuery, type, language } = value as Record<string, unknown>
  if (typeof searchQuery !== 'string' || !searchQuery.trim() || searchQuery.trim().length > 500) return null
  if (type !== 'activities' && type !== 'hotels') return null
  if (language !== undefined && language !== 'pl' && language !== 'en') return null
  return { searchQuery: searchQuery.trim(), type, ...(language ? { language } : {}) }
}

export function parseCandidates(value: unknown, type: SearchType): SearchCandidate[] {
  if (!Array.isArray(value)) throw new Error('Invalid search response')
  const seen = new Set<string>()
  const candidates: SearchCandidate[] = []
  for (const item of value) {
    if (
      typeof item?.score !== 'number' ||
      !Number.isFinite(item.score) ||
      typeof item?.value?.documentId !== 'string' ||
      !item.value.documentId ||
      item.value.documentId.startsWith('drafts.') ||
      item.value.documentId.startsWith('versions.') ||
      item.value.type !== COLLECTIONS[type]
    )
      throw new Error('Invalid search candidate')
    if (!seen.has(item.value.documentId)) {
      seen.add(item.value.documentId)
      candidates.push({ score: item.score, value: { documentId: item.value.documentId, type: item.value.type } })
    }
  }
  return candidates.slice(0, SEARCH_LIMIT)
}
