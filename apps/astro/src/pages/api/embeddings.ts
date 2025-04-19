import type { APIRoute } from 'astro'
import { ACTIVITIES_INDEX_NAME, DATASET } from '@/global/constants'

type EmbeddingResults = {
  score: number
  value: {
    documentId: string
    type: string
  }
}[]

export const POST: APIRoute = async ({ request }) => {
  try {
    const { searchQuery } = await request.json()

    if (!searchQuery) {
      return new Response(
        JSON.stringify({
          error: 'Search query is required',
        }),
        { status: 400 }
      )
    }

    const projectId = import.meta.env.SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID
    const bearerToken = import.meta.env.EMBEDDINGS_INDEX_BEARER_TOKEN || process.env.EMBEDDINGS_INDEX_BEARER_TOKEN

    if (!projectId || !bearerToken) {
      return new Response(
        JSON.stringify({
          error: 'Missing required environment variables',
        }),
        { status: 500 }
      )
    }

    const response = await fetch(
      `https://${projectId}.api.sanity.io/vX/embeddings-index/query/${DATASET}/${ACTIVITIES_INDEX_NAME}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${bearerToken}`,
        },
        body: JSON.stringify({
          query: searchQuery,
          filter: {
            _type: ['Activities_Collection'],
          },
        }),
      }
    )

    if (!response.ok) {
      throw new Error(`Embeddings API responded with status: ${response.status}`)
    }

    const data: EmbeddingResults = await response.json()

    return new Response(JSON.stringify({ data }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Internal server error during embeddings search',
      }),
      { status: 500 }
    )
  }
}
