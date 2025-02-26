import { createClient, type QueryParams } from '@sanity/client'
import { API_VERSION, DATASET, PROJECT_ID, SANITY_API_TOKEN } from '../global/constants'
import { isPreviewDeployment } from './is-preview-deployment'

if (isPreviewDeployment && !SANITY_API_TOKEN) {
  console.warn('\x1b[33m%s\x1b[0m', 'The `SANITY_API_TOKEN` environment variable is required.')
}

export const client = createClient({
  projectId: PROJECT_ID,
  dataset: DATASET,
  apiVersion: API_VERSION,
  useCdn: false,
  perspective: isPreviewDeployment ? 'drafts' : 'published',
  ...(isPreviewDeployment && { token: SANITY_API_TOKEN }),
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
