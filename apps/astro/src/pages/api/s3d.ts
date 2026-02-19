export const prerender = false

import { appendLeadToSheet, type LeadData } from '@/src/services/google-sheets'
import type { APIRoute } from 'astro'

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = (await request.json()) as LeadData

    if (!data.email || !data.formType) {
      return new Response(null, { status: 400 })
    }

    await appendLeadToSheet(data)
    return new Response(null, { status: 204 })
  } catch (error) {
    console.error('[S3D] Error:', error)
    return new Response(null, { status: 500 })
  }
}
