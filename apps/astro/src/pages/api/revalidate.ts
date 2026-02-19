import type { APIRoute } from 'astro'
import { waitUntil } from '@vercel/functions'
import { client } from '../../utils/sanity.fetch'
import { getDirectUrls, type SanityDocRef } from '../../utils/revalidation-map'

export const prerender = false

const REVALIDATION_SECRET = import.meta.env.REVALIDATION_SECRET || process.env.REVALIDATION_SECRET || ''
const ISR_BYPASS_TOKEN = import.meta.env.ISR_BYPASS_TOKEN || process.env.ISR_BYPASS_TOKEN || ''

const CDN_PROPAGATION_DELAY_MS = 10_000
const BATCH_SIZE = 5
const BATCH_GAP_MS = 200

const SKIP_REFERENCE_LOOKUP = new Set(['global', 'Index_Page', 'Activities_Page', 'Hotels_Page', 'Blog_Page', 'CaseStudy_Page'])

async function resolveAffectedUrls(doc: SanityDocRef): Promise<string[]> {
  const directUrls = getDirectUrls(doc)
  console.log(`[revalidate] Document: ${doc._type} ${doc._id} (slug: ${doc.slug?.current ?? 'none'}, lang: ${doc.language ?? '?'})`)
  console.log(`[revalidate] Direct URLs (${directUrls.length}):`, directUrls)

  if (SKIP_REFERENCE_LOOKUP.has(doc._type)) {
    console.log(`[revalidate] Skipping reference lookup for singleton type "${doc._type}"`)
    return directUrls
  }

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

async function revalidateBatch(urls: string[]): Promise<void> {
  const results = await Promise.allSettled(
    urls.map((url) =>
      fetch(url, {
        method: 'HEAD',
        headers: { 'x-prerender-revalidate': ISR_BYPASS_TOKEN },
      }).then((res) => ({
        url,
        status: res.status,
        cache: res.headers.get('x-vercel-cache') ?? 'unknown',
      }))
    )
  )

  for (const r of results) {
    if (r.status === 'fulfilled') {
      console.log(`[revalidate] HEAD ${r.value.status} [${r.value.cache}] ${r.value.url}`)
    } else {
      console.error(`[revalidate] FAILED ${r.reason}`)
    }
  }
}

/**
 * Processes all revalidation work in the background (via waitUntil).
 * 1. Waits for Sanity CDN to propagate the mutation.
 * 2. Sends HEAD requests in small batches to avoid overwhelming Vercel.
 */
async function processRevalidation(urls: string[]): Promise<void> {
  console.log(`[revalidate:bg] Waiting ${CDN_PROPAGATION_DELAY_MS}ms for Sanity CDN propagation...`)
  await new Promise((resolve) => setTimeout(resolve, CDN_PROPAGATION_DELAY_MS))

  console.log(`[revalidate:bg] Starting batched revalidation — ${urls.length} URLs in batches of ${BATCH_SIZE}`)

  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    const batch = urls.slice(i, i + BATCH_SIZE)
    const batchNum = Math.floor(i / BATCH_SIZE) + 1
    const totalBatches = Math.ceil(urls.length / BATCH_SIZE)
    console.log(`[revalidate:bg] Batch ${batchNum}/${totalBatches} (${batch.length} URLs)`)

    await revalidateBatch(batch)

    if (i + BATCH_SIZE < urls.length) {
      await new Promise((resolve) => setTimeout(resolve, BATCH_GAP_MS))
    }
  }

  console.log(`[revalidate:bg] Done — all ${urls.length} URLs processed`)
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

    waitUntil(processRevalidation(urls))

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
