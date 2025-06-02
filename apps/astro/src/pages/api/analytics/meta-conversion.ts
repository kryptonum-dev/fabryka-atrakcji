export const prerender = false

import { getCookie } from '@/src/utils/get-cookie'
import { hash } from '@/src/utils/hash'
import { getFirstName } from '@/src/utils/name-parser'
import { isPreviewDeployment } from '@/src/utils/is-preview-deployment'
import sanityFetch from '@/src/utils/sanity.fetch'
import type { APIRoute } from 'astro'

export type Props = {
  event_name: string
  content_name: string
  url: string
  event_id: string
  event_time: number
  name?: string
  email?: string
  phone?: string
  params?: Record<string, any>
}

const { meta_pixel_id, meta_conversion_token } = await sanityFetch<{
  meta_pixel_id: string
  meta_conversion_token: string
}>({
  query: `*[_type == "global"][0].analytics {
    meta_pixel_id,
    meta_conversion_token
  }`,
})

export const POST: APIRoute = async ({ request }) => {
  // Early return for non-production environments
  if (isPreviewDeployment) {
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Meta Conversion API disabled in non-production environment',
      }),
      { status: 200 } // Return 200 to avoid client-side errors
    )
  }

  if (!meta_pixel_id || !meta_conversion_token) {
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Meta Pixel ID or/and conversion token not configured',
      }),
      { status: 400 }
    )
  }

  const { event_name, content_name, url, event_id, event_time, name, email, phone, params } =
    (await request.json()) as Props

  const cookie_consent = JSON.parse(getCookie('cookie-consent', request.headers) || '{}')
  if (cookie_consent.conversion_api !== 'granted') {
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Conversion API tracking not permitted by user',
      }),
      { status: 403 }
    )
  }

  try {
    const client_ip_address = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || ''
    const client_user_agent = request.headers.get('user-agent') || ''
    const referer = request.headers.get('referer') || ''

    const fbc = getCookie('_fbc', request.headers)
    const fbp = getCookie('_fbp', request.headers)

    const advanced_matching_consent = cookie_consent.advanced_matching || 'denied'

    type UserDataKey = 'client_ip_address' | 'client_user_agent' | 'em' | 'fn' | 'ph' | 'fbc' | 'fbp'
    const user_data: Partial<Record<UserDataKey, string>> = {
      client_ip_address: client_ip_address || '',
      client_user_agent: client_user_agent || '',
    }

    if (advanced_matching_consent === 'granted') {
      if (email) user_data.em = await hash(email)
      if (name) user_data.fn = await hash(getFirstName(name))
      if (phone) user_data.ph = await hash(phone)
      if (fbc) user_data.fbc = fbc
      if (fbp) user_data.fbp = fbp
    }

    const payload = {
      data: [
        {
          event_name,
          content_name,
          event_source_url: url,
          event_id,
          event_time,
          action_source: 'website',
          referrer_url: referer,
          user_data,
          custom_data: {
            advanced_matching_consent,
            ...(params && { custom_event_params: params }),
          },
        },
      ],
    }

    const response = await fetch(
      `https://graph.facebook.com/v21.0/${meta_pixel_id}/events?access_token=${meta_conversion_token}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    )

    const responseData = await response.json()

    if (!response.ok) {
      console.error('[Meta Conversion API] Error response:', JSON.stringify(responseData, null, 2))
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Meta API error occurred',
        }),
        { status: response.status }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Event sent to Meta',
      }),
      { status: 200 }
    )
  } catch (error) {
    console.error('[Meta Conversion API] Server error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Server error processing conversion event',
      }),
      { status: 500 }
    )
  }
}
