import { createClient, type QueryParams } from '@sanity/client'
import { API_VERSION, DATASET } from '../global/constants'
import { isPreviewDeployment } from './is-preview-deployment'

const PROJECT_ID = import.meta.env.SANITY_PROJECT_ID || process?.env?.SANITY_PROJECT_ID || ''
const SANITY_API_TOKEN = import.meta.env.SANITY_API_TOKEN || process?.env?.SANITY_API_TOKEN || ''

if (isPreviewDeployment && !SANITY_API_TOKEN) {
  console.warn('\x1b[33m%s\x1b[0m', 'The `SANITY_API_TOKEN` environment variable is required.')
}

export const client = createClient({
  projectId: PROJECT_ID,
  dataset: DATASET,
  apiVersion: API_VERSION,
  useCdn: !isPreviewDeployment,
  perspective: isPreviewDeployment ? 'drafts' : 'published',
  token: isPreviewDeployment ? SANITY_API_TOKEN : undefined,
})

export default async function sanityFetch<QueryResponse>({
  query,
  params = {},
}: {
  query: string
  params?: QueryParams
}): Promise<QueryResponse> {
  return await client.fetch<QueryResponse>(query, params)
}

// Kept for backwards compatibility — now delegates to the shared client which already uses CDN in production
export async function sanityFetchWithCdn<QueryResponse>({
  query,
  params = {},
}: {
  query: string
  params?: QueryParams
  useCdn?: boolean
}): Promise<QueryResponse> {
  return await client.fetch<QueryResponse>(query, params)
}
