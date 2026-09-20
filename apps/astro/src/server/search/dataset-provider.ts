import { COLLECTIONS, type SearchInput } from './contracts'
import { searchClient } from './search-client'

export const ELIGIBILITY = `!(_id in path("drafts.**")) && !(_id in path("versions.**")) && defined(slug.current) && slug.current != "" && doNotIndex != true`
export const DATASET_QUERY = `*[_type == $collectionType && ${ELIGIBILITY} && ($language == null || language == $language)]
  | score(text::semanticSimilarity($searchText))
  | order(_score desc, _id asc)[0...50]
  {"score": _score, "value": {"documentId": _id, "type": _type}}`

export async function datasetSearch(input: SearchInput, signal: AbortSignal): Promise<unknown> {
  return searchClient().fetch<unknown>(
    DATASET_QUERY,
    {
      collectionType: COLLECTIONS[input.type],
      language: input.language ?? null,
      searchText: input.searchQuery,
    },
    { signal, tag: 'search.dataset' }
  )
}
