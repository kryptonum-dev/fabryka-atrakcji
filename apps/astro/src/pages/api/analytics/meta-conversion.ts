export const prerender = false

import type { APIRoute } from 'astro'
import sanityFetch from '@/src/utils/sanity.fetch'
import { hash } from '@/src/utils/hash'
import { getCookie } from '@/src/utils/get-cookie'
import { getFirstName } from '@/src/utils/name-parser'

export type MetaConversionProps = {
  event_name: string
  content_name: string
  url: string
  event_id: string
  event_time: number
  custom_parameters?: Record<string, any>
  name?: string
  email?: string
  phone?: string
}

// Fetch Meta configuration from Sanity
const getMetaConfig = async () => {
  return await sanityFetch<{
    meta_pixel_id: string
    meta_conversion_token: string
  }>({
    query: `*[_type == "global"][0].analytics {
      meta_pixel_id,
      meta_conversion_token
    }`,
  })
}

/**
 * Sends tracking data to Meta Conversion API
 *
 * @param request - The original request object
 * @param data - The tracking data to send
 * @returns The result from Meta's API
 */
export async function sendMetaConversion(request: Request, data: MetaConversionProps) {
  // Get Meta configuration
  const { meta_pixel_id, meta_conversion_token } = await getMetaConfig()

  if (!meta_pixel_id || !meta_conversion_token) {
    throw new Error('Meta Pixel ID or conversion token not configured')
  }

  // Check consent
  const cookie_consent = JSON.parse(getCookie('cookie-consent', request.headers) || '{}')
  if (cookie_consent.conversion_api !== 'granted') {
    throw new Error('Conversion API tracking not permitted by user')
  }

  // Gather user data
  const client_ip_address = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || ''
  const client_user_agent = request.headers.get('user-agent') || ''
  const referer = request.headers.get('referer') || ''

  // Get FB cookies if available
  const fbc = getCookie('_fbc', request.headers)
  const fbp = getCookie('_fbp', request.headers)

  // Check advanced matching consent
  const advanced_matching_consent = cookie_consent.advanced_matching === 'granted'

  // Build user data object
  const user_data: Record<string, string> = {
    client_ip_address,
    client_user_agent,
  }

  // Add user data if advanced matching is granted
  if (advanced_matching_consent) {
    if (data.email) user_data.em = await hash(data.email)
    if (data.name) user_data.fn = await hash(getFirstName(data.name))
    if (data.phone) user_data.ph = await hash(data.phone)
    if (fbc) user_data.fbc = fbc
    if (fbp) user_data.fbp = fbp
  }

  // Build payload
  const payload = {
    data: [
      {
        event_name: data.event_name,
        event_source_url: data.url,
        event_id: data.event_id,
        event_time: data.event_time,
        action_source: 'website',
        user_data,
        referer_url: referer,
        custom_data: {
          content_name: data.content_name,
          ...data.custom_parameters,
          advanced_matching_consent,
        },
      },
    ],
  }

  // Send to Meta Conversion API
  const response = await fetch(
    `https://graph.facebook.com/v21.0/${meta_pixel_id}/events?access_token=${meta_conversion_token}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  )

  if (!response.ok) {
    const responseData = await response.json()
    console.error('[Meta Conversion API] Error response:', JSON.stringify(responseData, null, 2))
    throw new Error(`Meta API error: ${response.status}`)
  }

  return await response.json()
}

/**
 * Direct API endpoint for Meta conversion API calls
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const data = (await request.json()) as MetaConversionProps

    // await sendMetaConversion(request, data)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Event sent to Meta',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('[Meta Conversion API] Error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        message: error instanceof Error ? error.message : 'Server error processing conversion event',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
