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
  console.log(`[revalidate] Document: ${doc._type} ${doc._id} (slug: ${doc.slug?.current ?? 'none'}, lang: ${doc.language ?? '?'})`)
  console.log(`[revalidate] Direct URLs (${directUrls.length}):`, directUrls)

  if (SKIP_REFERENCE_LOOKUP.has(doc._type)) {
    console.log(`[revalidate] Skipping reference lookup for singleton type "${doc._type}"`)
    return directUrls
  }

  // Must use useCdn: false — the CDN caches reference-graph query results and may
  // not reflect the latest document relationships immediately after a mutation.
  const referencingDocs = await client.withConfig({ useCdn: false }).fetch<SanityDocRef[]>(
    `*[references($id) && !(_id in path("drafts.**"))]{_type, _id, slug, language}`,
    { id: doc._id }
  )

  console.log(`[revalidate] Reference lookup found ${referencingDocs.length} doc(s):`, referencingDocs.map((d) => `${d._type} ${d._id}`))

  const referenceUrls = referencingDocs.flatMap((ref) => getDirectUrls(ref))

  const allUrls = [...new Set([...directUrls, ...referenceUrls])]
  console.log(`[revalidate] Total unique URLs to invalidate: ${allUrls.length}`)
  return allUrls
}

async function revalidateUrls(urls: string[]): Promise<void> {
  const results = await Promise.allSettled(
    urls.map((url) =>
      fetch(url, {
        method: 'HEAD',
        headers: { 'x-prerender-revalidate': ISR_BYPASS_TOKEN },
      }).then((res) => ({ url, status: res.status }))
    )
  )

  for (const r of results) {
    if (r.status === 'fulfilled') {
      console.log(`[revalidate] HEAD ${r.value.status} ${r.value.url}`)
    } else {
      console.error(`[revalidate] FAILED ${r.reason}`)
    }
  }
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

    // Wait for Sanity CDN to propagate the mutation before purging ISR cache.
    // Without this delay the re-render triggered by the next visitor may still
    // fetch stale data from the CDN and re-cache the old page.
    const CDN_PROPAGATION_DELAY_MS = 5_000
    console.log(`[revalidate] Waiting ${CDN_PROPAGATION_DELAY_MS}ms for Sanity CDN propagation...`)
    await new Promise((resolve) => setTimeout(resolve, CDN_PROPAGATION_DELAY_MS))

    await revalidateUrls(urls)

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
