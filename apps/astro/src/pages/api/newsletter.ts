export const prerender = false

import { REGEX } from '@/src/global/constants'
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
    const res = await fetch(`https://api.mailerlite.com/api/v2/groups/${group_id}/subscribers`, {
      method: 'POST',
      headers: {
        'X-MailerLite-ApiKey': MAILERLITE_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        resubscribe: true,
      }),
    })
    if (res.status !== 200) {
      return new Response(JSON.stringify({ message: 'Something went wrong', success: false }), { status: 400 })
    }
    return new Response(JSON.stringify({ message: 'Successfully subscribed', success: true }), { status: 200 })
  } catch {
    return new Response(
      JSON.stringify({ message: 'An error occurred while subscribing to the group', success: false }),
      { status: 400 }
    )
  }
}
