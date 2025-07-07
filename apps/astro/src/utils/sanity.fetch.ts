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
  useCdn: false, // Default CDN disabled
  perspective: isPreviewDeployment ? 'drafts' : 'published',
  token: SANITY_API_TOKEN,
})

// Function to create client with conditional CDN
const createClientWithCdn = (useCdn: boolean) =>
  createClient({
    projectId: PROJECT_ID,
    dataset: DATASET,
    apiVersion: API_VERSION,
    useCdn,
    perspective: isPreviewDeployment ? 'drafts' : 'published',
    token: SANITY_API_TOKEN,
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

// New function with CDN control
export async function sanityFetchWithCdn<QueryResponse>({
  query,
  params = {},
  useCdn = true,
}: {
  query: string
  params?: QueryParams
  useCdn?: boolean
}): Promise<QueryResponse> {
  const clientInstance = createClientWithCdn(useCdn)
  return await clientInstance.fetch<QueryResponse>(query, params)
}
