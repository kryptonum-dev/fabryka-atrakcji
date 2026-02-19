import type { APIRoute } from 'astro'
import { client } from '../../utils/sanity.fetch'
import { getDirectUrls, type SanityDocRef } from '../../utils/revalidation-map'

export const prerender = false

const REVALIDATION_SECRET = import.meta.env.REVALIDATION_SECRET || process.env.REVALIDATION_SECRET || ''
const ISR_BYPASS_TOKEN = import.meta.env.ISR_BYPASS_TOKEN || process.env.ISR_BYPASS_TOKEN || ''

// Singletons that affect the entire site — skip the reverse-reference lookup.
// Their direct URL list already covers all key pages.
const SKIP_REFERENCE_LOOKUP = new Set(['global', 'Index_Page', 'Activities_Page', 'Hotels_Page', 'Blog_Page', 'CaseStudy_Page'])

/**
 * Resolves the full set of frontend URLs that must be revalidated when the
 * given Sanity document changes.
 *
 * 1. Maps the changed document to its own URLs.
 * 2. Queries the Sanity CDN for all published documents that reference this
 *    document (GROQ reverse-reference lookup).
 * 3. Maps each referencing document to its own URLs.
 * 4. Returns the deduplicated union.
 */
async function resolveAffectedUrls(doc: SanityDocRef): Promise<string[]> {
  const directUrls = getDirectUrls(doc)

  if (SKIP_REFERENCE_LOOKUP.has(doc._type)) {
    return directUrls
  }

  // Query published documents that reference this _id.
  // Must use useCdn: false — the CDN caches reference-graph query results and may
  // not reflect the latest document relationships immediately after a mutation.
  const referencingDocs = await client.withConfig({ useCdn: false }).fetch<SanityDocRef[]>(
    `*[references($id) && !(_id in path("drafts.**"))]{_type, _id, slug, language}`,
    { id: doc._id }
  )

  const referenceUrls = referencingDocs.flatMap((ref) => getDirectUrls(ref))

  return [...new Set([...directUrls, ...referenceUrls])]
}

async function revalidateUrls(urls: string[]): Promise<void> {
  await Promise.allSettled(
    urls.map((url) =>
      fetch(url, {
        method: 'HEAD',
        headers: { 'x-prerender-revalidate': ISR_BYPASS_TOKEN },
      })
    )
  )
  console.log(`[revalidate] Invalidated ${urls.length} URL(s):`, urls)
}

export const POST: APIRoute = async ({ request }) => {
  const secret = request.headers.get('x-webhook-secret')

  if (!REVALIDATION_SECRET || secret !== REVALIDATION_SECRET) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (!ISR_BYPASS_TOKEN) {
    console.error('[revalidate] ISR_BYPASS_TOKEN env var is not set')
    return new Response(JSON.stringify({ error: 'ISR_BYPASS_TOKEN not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let doc: SanityDocRef

  try {
    doc = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (!doc._type || !doc._id) {
    return new Response(JSON.stringify({ error: 'Payload must include _type and _id' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const urls = await resolveAffectedUrls(doc)

    // Fire-and-forget — respond immediately so Sanity does not time out
    revalidateUrls(urls).catch((err) => console.error('[revalidate] HEAD request failed:', err))

    return new Response(JSON.stringify({ revalidating: urls.length, urls }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[revalidate] Failed to resolve URLs:', err)
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
