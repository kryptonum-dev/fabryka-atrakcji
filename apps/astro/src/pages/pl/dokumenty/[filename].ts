import sanityFetch from '@/src/utils/sanity.fetch'
import type { APIRoute } from 'astro'

export const GET: APIRoute = async ({ params, redirect }) => {
  const { filename } = params

  try {
    const document = await sanityFetch<{ url: string; originalFilename: string }>({
      query: `
        *[_type == "global" && language == "pl" && defined(newsletterPdf)]{
            "url": newsletterPdf.asset->url,
            "originalFilename": newsletterPdf.asset->originalFilename
        }[0]
      `,
    })

    // If no document found or filename doesn't match the original filename
    if (!document?.url || document.originalFilename !== filename) {
      return redirect('/404')
    }

    const response = await fetch(document.url)

    if (!response.ok) {
      return new Response('Error fetching PDF', { status: 500 })
    }

    return new Response(response.body, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
      },
    })
  } catch (error) {
    console.error('Error fetching PDF:', error)
    return new Response('Error fetching PDF', { status: 500 })
  }
}
