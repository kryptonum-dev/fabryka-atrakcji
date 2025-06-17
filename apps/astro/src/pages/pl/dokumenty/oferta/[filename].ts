import sanityFetch from '@/src/utils/sanity.fetch'
import type { APIRoute } from 'astro'

export const GET: APIRoute = async ({ params, redirect }) => {
  const { filename } = params

  try {
    // Get all PDF files from Activities Collection
    const documents = await sanityFetch<
      Array<{
        url: string
        originalFilename: string
        _id: string
      }>
    >({
      query: `
        *[_type == "Activities_Collection" && defined(content)] {
          "pdfs": content[_type == "FileView"].file.asset->{
            url,
            originalFilename,
            "_id": _id
          }
        }[].pdfs[]
      `,
    })

    // Find the PDF with matching filename
    const document = documents?.find((doc) => doc?.originalFilename === filename)

    // If no document found or filename doesn't match, redirect to 404
    if (!document?.url) {
      return redirect('/404')
    }

    // Serve the PDF
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
      'Content-Disposition': 'inline',
    },
  })
}
