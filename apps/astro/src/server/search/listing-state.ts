import { catalogSearch } from './catalog-search'
import { parseSearchInput, type SearchCandidate, type SearchLanguage, type SearchType } from './contracts'

export async function listingSearch(
  searchQuery: string | null | undefined,
  type: SearchType,
  language: SearchLanguage,
  search = catalogSearch
): Promise<{ isSearch: boolean; unavailable: boolean; candidates: SearchCandidate[] | null }> {
  if (!searchQuery?.trim()) return { isSearch: false, unavailable: false, candidates: null }
  const input = parseSearchInput({ searchQuery, type, language })
  const result = input ? await search(input) : { status: 'unavailable' as const }
  return {
    isSearch: true,
    unavailable: result.status === 'unavailable',
    candidates: result.status === 'success' ? result.data : [],
  }
}
