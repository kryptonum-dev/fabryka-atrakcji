import { createClient, type QueryParams } from '@sanity/client'
import { SEARCH_API_VERSION, SEARCH_DATASET, SEARCH_TIMEOUT_MS } from './contracts'

function searchConfig() {
  return {
    projectId: import.meta.env?.SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID || '',
    readToken: import.meta.env?.SANITY_SEARCH_READ_TOKEN || process.env.SANITY_SEARCH_READ_TOKEN,
  }
}

export function searchClient() {
  const { projectId, readToken } = searchConfig()
  return createClient({
    projectId,
    dataset: SEARCH_DATASET,
    apiVersion: SEARCH_API_VERSION,
    perspective: 'published',
    useCdn: false,
    token: readToken,
    maxRetries: 0,
    timeout: SEARCH_TIMEOUT_MS,
  })
}

export async function publishedSearchFetch<T>({
  query,
  params = {},
  tag,
}: {
  query: string
  params?: QueryParams
  tag?: string
}): Promise<T> {
  return searchClient().fetch<T>(query, params, { tag, signal: AbortSignal.timeout(SEARCH_TIMEOUT_MS) })
}
