import sanityFetch from '@/src/utils/sanity.fetch'
import type { APIRoute } from 'astro'

export const GET: APIRoute = async ({ params, request, redirect }) => {
  const { filename } = params
  const url = new URL(request.url)
  const subscriberEmail = url.searchParams.get('id')

  try {
    // 1. Get PDF data and allowed groups from Sanity
    const document = await sanityFetch<{
      url: string
      originalFilename: string
      allowedGroups: string[]
    }>({
      query: `
        *[_type == "global" && language == "pl" && defined(newsletterPdf)]{
            "url": newsletterPdf.asset->url,
            "originalFilename": newsletterPdf.asset->originalFilename,
            "allowedGroups": newsletterPdfGroups
        }[0]
      `,
    })

    // 2. If no document found or filename doesn't match the original filename
    if (!document?.url || document.originalFilename !== filename) {
      return redirect('/404')
    }

    // 3. If groups are restricted but no subscriber email is provided, redirect to 404
    if (document.allowedGroups && document.allowedGroups.length > 0 && !subscriberEmail) {
      return redirect('/404')
    }

    // 4. If there are no group restrictions, serve the PDF to everyone
    if (!document.allowedGroups || document.allowedGroups.length === 0) {
      return servePdf(document.url)
    }

    // 5. Validate subscriber against allowed groups
    const isAuthorized = await validateSubscriberByEmail(
      subscriberEmail!,
      document.allowedGroups.map((group) => group.toString().slice(0, -1))
    )

    if (!isAuthorized) {
      return redirect('/404')
    }

    // 6. Serve PDF to authorized subscriber
    return servePdf(document.url)
  } catch (error) {
    console.error('Error fetching PDF:', error)
    return new Response('Error fetching PDF', { status: 500 })
  }
}

// Helper function to serve PDF
async function servePdf(url: string) {
  const response = await fetch(url)

  if (!response.ok) {
    return new Response('Error fetching PDF', { status: 500 })
  }

  return new Response(response.body, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
    },
  })
}

// Helper function to validate subscriber by email
async function validateSubscriberByEmail(email: string, allowedGroups: string[]): Promise<boolean> {
  try {
    const MAILERLITE_API_KEY = import.meta.env.MAILERLITE_API_KEY || process.env.MAILERLITE_API_KEY

    if (!MAILERLITE_API_KEY) {
      console.error('MailerLite API key is not configured')
      return false
    }

    // Get subscriber info by email
    const subscriberResponse = await fetch(
      `https://api.mailerlite.com/api/v2/subscribers/${encodeURIComponent(email)}`,
      {
        headers: {
          'X-MailerLite-ApiKey': MAILERLITE_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!subscriberResponse.ok) {
      console.log('Subscriber not found or API error')
      return false
    }

    const subscriber = await subscriberResponse.json()

    // Check if subscriber is active
    if (subscriber.type !== 'active') {
      console.log('Subscriber is not active')
      return false
    }

    // Get groups this subscriber belongs to
    const groupsResponse = await fetch(
      `https://api.mailerlite.com/api/v2/subscribers/${encodeURIComponent(email)}/groups`,
      {
        headers: {
          'X-MailerLite-ApiKey': MAILERLITE_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!groupsResponse.ok) {
      console.log('Failed to fetch subscriber groups')
      return false
    }

    const subscriberGroups = await groupsResponse.json()

    console.log(subscriberGroups)

    // Check if subscriber belongs to any of the allowed groups
    return subscriberGroups.some((group: any) => allowedGroups.includes(group.id.toString().slice(0, -1)))
  } catch (error) {
    console.error('Error validating subscriber:', error)
    return false
  }
}
