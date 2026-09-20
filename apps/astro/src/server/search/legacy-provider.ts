import { COLLECTIONS, SEARCH_DATASET, SEARCH_LIMIT, parseCandidates, type SearchInput } from './contracts'
import { ELIGIBILITY } from './dataset-provider'
import { searchClient, searchConfig } from './search-client'

export async function legacySearch(input: SearchInput, signal: AbortSignal): Promise<unknown> {
  const { projectId, legacyToken } = searchConfig()
  if (!projectId || !legacyToken) throw new Error('Legacy configuration unavailable')
  const response = await fetch(
    `https://${projectId}.api.sanity.io/vX/embeddings-index/query/${SEARCH_DATASET}/${input.type}-index`,
    {
      method: 'POST',
      signal,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${legacyToken}` },
      body: JSON.stringify({
        query: input.searchQuery,
        maxResults: SEARCH_LIMIT,
        filter: { _type: [COLLECTIONS[input.type]] },
      }),
    }
  )
  if (!response.ok) throw new Error(`Legacy HTTP ${response.status}`)
  const candidates = parseCandidates(await response.json(), input.type)
  if (!candidates.length) return []
  // Legacy limits across languages; published eligibility is still enforced before returning candidates.
  const ids = await searchClient().fetch<string[]>(
    `*[_id in $ids && _type == $type && ${ELIGIBILITY} && ($language == null || language == $language)]._id`,
    {
      ids: candidates.map((item) => item.value.documentId),
      type: COLLECTIONS[input.type],
      language: input.language ?? null,
    },
    { signal, tag: 'search.legacy-eligibility' }
  )
  const eligible = new Set(ids)
  return candidates.filter((candidate) => eligible.has(candidate.value.documentId))
}
