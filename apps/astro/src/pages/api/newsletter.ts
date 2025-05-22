export const prerender = false

import { REGEX } from '@/src/global/constants'
import { generateUUID } from '@/src/utils/uuid'
import type { APIRoute } from 'astro'

const MAILERLITE_API_KEY = import.meta.env.MAILERLITE_API_KEY || process.env.MAILERLITE_API_KEY

type Props = {
  email: string
  legal: boolean
  group_id: string
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const { email, legal, group_id } = (await request.json()) as Props

    if (!REGEX.email.test(email) || !group_id || !legal) {
      return new Response(JSON.stringify({ message: 'Missing required fields', success: false }), { status: 400 })
    }

    if (!MAILERLITE_API_KEY) {
      return new Response(JSON.stringify({ message: 'API key is not configured', success: false }), { status: 500 })
    }

    // First check if subscriber already exists and has a newsletter_id
    const existingSubscriber = await checkExistingSubscriber(email)

    // Generate a new newsletter_id only if the subscriber doesn't already have one
    const newsletter_id = existingSubscriber?.newsletter_id || generateUUID()

    // Add the subscriber to the group with the newsletter_id custom field
    const res = await fetch(`https://api.mailerlite.com/api/v2/groups/${group_id}/subscribers`, {
      method: 'POST',
      headers: {
        'X-MailerLite-ApiKey': MAILERLITE_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        resubscribe: true,
        fields: {
          newsletter_id: newsletter_id,
        },
      }),
    })

    if (res.status !== 200) {
      return new Response(JSON.stringify({ message: 'Something went wrong', success: false }), { status: 400 })
    }

    const data = await res.json()

    return new Response(
      JSON.stringify({
        message: 'Successfully subscribed',
        success: true,
        newsletter_id: newsletter_id, // Return the ID in the response
      }),
      { status: 200 }
    )
  } catch (error) {
    console.error('Newsletter subscription error:', error)
    return new Response(
      JSON.stringify({ message: 'An error occurred while subscribing to the group', success: false }),
      { status: 400 }
    )
  }
}

/**
 * Check if subscriber already exists and if they have a newsletter_id
 */
async function checkExistingSubscriber(email: string): Promise<{ newsletter_id?: string } | null> {
  try {
    if (!MAILERLITE_API_KEY) return null

    const response = await fetch(`https://api.mailerlite.com/api/v2/subscribers/${encodeURIComponent(email)}`, {
      method: 'GET',
      headers: {
        'X-MailerLite-ApiKey': MAILERLITE_API_KEY,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) return null

    const subscriber = await response.json()
    return {
      newsletter_id: subscriber.fields?.newsletter_id,
    }
  } catch (error) {
    console.error('Error checking existing subscriber:', error)
    return null
  }
}
