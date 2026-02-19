# Sanity Cost Optimization Plan

_Created: 2026-02-18_

## Problem Statement

Sanity overage bill is ~$400/month driven by two metrics:

| Resource | Jan 2026 Usage | Included (Growth) | Overage |
|---|---|---|---|
| API Requests (`api.sanity.io`) | **3.7M** | 250k | 1,480% |
| Bandwidth | **477 GB** | 100 GB | 377% |
| API CDN Requests (`apicdn.sanity.io`) | 465.5k | **1M** | 0% (47% used) |

### Root cause chain

1. Sanity webhook fires on every create/update/delete and triggers a **full Vercel redeploy**
2. Each redeploy invalidates the entire ISR cache (because `bypassToken` is `VERCEL_DEPLOYMENT_ID`, which changes per deploy)
3. As visitors hit pages after a deploy, each page re-renders via SSR and re-fetches **all data** from Sanity
4. The Sanity client uses `useCdn: false`, so every request goes to the uncached `api.sanity.io` endpoint (250k included) instead of `apicdn.sanity.io` (1M included)
5. No token gating: the API token is sent on every production request, which segments CDN cache per-token and prevents shared caching
6. With 10-50 deploys/day the cycle repeats constantly

### Current relevant configuration

**`apps/astro/astro.config.ts`** — ISR is already enabled, but the bypass token rotates per deploy:

```ts
output: 'server',
adapter: vercel({
  ...(!isPreviewDeployment
    ? {
        isr: {
          bypassToken: process.env.VERCEL_DEPLOYMENT_ID, // ← changes every deploy
          exclude: [/^\/api\/.+/, /.*\/filtr.*/, /.*\/filter.*/],
        },
      }
    : {}),
}),
```

**`apps/astro/src/utils/sanity.fetch.ts`** — CDN disabled, token always sent:

```ts
export const client = createClient({
  projectId: PROJECT_ID,
  dataset: DATASET,
  apiVersion: API_VERSION,
  useCdn: false,                                          // ← all requests hit uncached API
  perspective: isPreviewDeployment ? 'drafts' : 'published',
  token: SANITY_API_TOKEN,                                // ← sent in production too
})
```

---

## Strategy 1: Switch production Sanity client to CDN + drop token

**Effort**: ~15 minutes
**Projected impact**: Shifts ~3.7M requests from API bucket (250k included) to CDN bucket (1M included). Reduces bandwidth via CDN edge caching.

### Why this works

- `api.sanity.io` (uncached) counts against the **250k API Requests** quota — every call hits Sanity backend
- `apicdn.sanity.io` (cached) counts against the **1M API CDN Requests** quota — cached responses are served from edge, lower bandwidth
- The CDN invalidates its cache when content changes, so data freshness is maintained
- Removing the token in production prevents per-token cache segmentation, allowing all visitors to share the same CDN cache
- The `published` perspective does not require a token (public dataset)

### Implementation

**File: `apps/astro/src/utils/sanity.fetch.ts`**

Replace the client initialization:

```ts
import { createClient, type QueryParams } from '@sanity/client'
import { API_VERSION, DATASET } from '../global/constants'
import { isPreviewDeployment } from './is-preview-deployment'

const PROJECT_ID = import.meta.env.SANITY_PROJECT_ID || process?.env?.SANITY_PROJECT_ID || ''
const SANITY_API_TOKEN = import.meta.env.SANITY_API_TOKEN || process?.env?.SANITY_API_TOKEN || ''

if (isPreviewDeployment && !SANITY_API_TOKEN) {
  console.warn('\x1b[33m%s\x1b[0m', 'The `SANITY_API_TOKEN` environment variable is required.')
}

export const client = createClient({
  projectId: PROJECT_ID,
  dataset: DATASET,
  apiVersion: API_VERSION,
  useCdn: !isPreviewDeployment,
  perspective: isPreviewDeployment ? 'drafts' : 'published',
  token: isPreviewDeployment ? SANITY_API_TOKEN : undefined,
})
```

Key changes:

1. `useCdn: !isPreviewDeployment` — production uses CDN, preview uses direct API
2. `token: isPreviewDeployment ? SANITY_API_TOKEN : undefined` — token only sent in preview (needed for `drafts` perspective)

Remove the `createClientWithCdn` helper and `sanityFetchWithCdn` export if nothing uses them (or keep if used for specific edge cases). The default `sanityFetch` function stays unchanged — it just uses the updated client.

### Verification

After deploying:

1. Check Sanity manage dashboard next day — API Requests should drop, CDN Requests should rise
2. Confirm pages still load correct content (CDN serves `published` perspective without token)
3. Confirm preview deployments still show draft content

### Risks

- Brief stale data window: after a Sanity mutation, the CDN cache takes a few seconds to invalidate. Since the site already uses ISR (pages are cached on Vercel's side anyway), this window is negligible.
- If any query requires the `drafts` perspective in production, it will break. Audit for any `perspective: 'drafts'` usage outside of `sanity.fetch.ts`. Current codebase uses the shared client everywhere, which already sets `published` for production.

---

## Strategy 2: Replace deploy webhook with on-demand ISR invalidation

**Effort**: ~4-6 hours
**Projected impact**: Eliminates full redeployments on content changes. Only the changed document and every page that references it re-render. Reduces API/CDN requests by ~90-95% and bandwidth proportionally.

### Why this works

The current flow:

```
Sanity edit → webhook → Vercel deploy hook → full redeploy → all ISR cache wiped → all pages re-fetch from Sanity
```

The new flow:

```
Sanity edit → webhook → /api/revalidate → GROQ reference lookup → HEAD requests with bypass token to affected URLs → only those pages re-render on next visit
```

Astro + Vercel ISR already supports on-demand invalidation via the `x-prerender-revalidate` header. The infrastructure is in place — we just need to use it properly.

### The reference graph problem

A simple document-type-to-URL map is not enough. When an activity's image changes, it is stale not only on its own detail page and the activities listing — it may also be stale on the Homepage (featured activities), a Blog post that links to it, or any other page that holds a Sanity reference to that document.

We solve this with a **GROQ reverse-reference lookup**. Sanity's `references()` function lets us query which published documents reference a given `_id`. One cheap CDN query at revalidation time gives us the complete set of affected documents, so we can build the exact URL list without guessing.

```
changed doc _id
  ↓ GROQ: *[references($id)]{_type, slug, language}
  ↓ returns: [Homepage, BlogPost "10 najlepszych...", ...]
  ↓ map each to URLs
  ↓ union with changed doc's own URLs
  ↓ fire HEAD revalidation requests
```

This is a single-level lookup — it finds documents that directly reference the changed doc. This covers all real-world cases in this schema (Homepage directly references activities, blog posts directly reference activities, etc.). If two-level deep references ever become needed, the same lookup can be run recursively.

### Implementation

#### Step 2.1: Create a stable ISR bypass token

The current `bypassToken: process.env.VERCEL_DEPLOYMENT_ID` changes with every deploy, which means every deploy invalidates the entire ISR cache. Replace it with a stable secret.

1. Generate a random token (32+ characters):

```bash
openssl rand -hex 32
```

2. Add it as `ISR_BYPASS_TOKEN` in Vercel environment variables (Production + Preview)

3. Update `apps/astro/astro.config.ts`:

```ts
output: 'server',
adapter: vercel({
  ...(!isPreviewDeployment
    ? {
        isr: {
          bypassToken: process.env.ISR_BYPASS_TOKEN,
          exclude: [/^\/api\/.+/, /.*\/filtr.*/, /.*\/filter.*/],
        },
      }
    : {}),
}),
```

Now ISR cache persists across deploys and is only invalidated explicitly.

#### Step 2.2: Create the direct URL mapper

This utility maps a single Sanity document to the frontend URLs that directly render it. It is used both for the changed document itself and for each document returned by the reverse-reference lookup.

Create **`apps/astro/src/utils/revalidation-map.ts`**:

```ts
import { DOMAIN } from '../global/constants'

export type SanityDocRef = {
  _type: string
  _id: string
  slug?: { current?: string }
  language?: string
}

/**
 * Returns the frontend URLs that directly render the given Sanity document.
 * Used for both the changed document and any document that references it.
 */
export function getDirectUrls(doc: SanityDocRef): string[] {
  const base = DOMAIN.replace(/\/$/, '')
  const urls: string[] = []
  const slug = doc.slug?.current

  switch (doc._type) {
    case 'Activities_Collection':
      if (slug) {
        urls.push(`${base}/pl/integracje/${slug}`)
        urls.push(`${base}/en/activities/${slug}`)
      }
      urls.push(`${base}/pl/integracje`)
      urls.push(`${base}/en/activities`)
      break

    case 'Hotels_Collection':
      if (slug) {
        urls.push(`${base}/pl/hotele/${slug}`)
        urls.push(`${base}/en/hotels/${slug}`)
      }
      urls.push(`${base}/pl/hotele`)
      urls.push(`${base}/en/hotels`)
      break

    case 'BlogPost_Collection':
      if (slug) {
        urls.push(`${base}/pl/blog/${slug}`)
        urls.push(`${base}/en/blog/${slug}`)
      }
      urls.push(`${base}/pl/blog`)
      urls.push(`${base}/en/blog`)
      break

    case 'CaseStudy_Collection':
      if (slug) {
        urls.push(`${base}/pl/realizacje/${slug}`)
        urls.push(`${base}/en/case-studies/${slug}`)
      }
      urls.push(`${base}/pl/realizacje`)
      urls.push(`${base}/en/case-studies`)
      break

    case 'Page_Collection':
      if (slug) {
        urls.push(`${base}/pl/${slug}`)
        urls.push(`${base}/en/${slug}`)
      }
      break

    case 'Activities_Page':
      urls.push(`${base}/pl/integracje`)
      urls.push(`${base}/en/activities`)
      break

    case 'Hotels_Page':
      urls.push(`${base}/pl/hotele`)
      urls.push(`${base}/en/hotels`)
      break

    case 'Homepage':
      urls.push(`${base}/pl`)
      urls.push(`${base}/en`)
      break

    case 'global':
      // Referenced by everything — invalidate all key entry points
      urls.push(`${base}/pl`)
      urls.push(`${base}/en`)
      urls.push(`${base}/pl/integracje`)
      urls.push(`${base}/en/activities`)
      urls.push(`${base}/pl/hotele`)
      urls.push(`${base}/en/hotels`)
      urls.push(`${base}/pl/blog`)
      urls.push(`${base}/en/blog`)
      break

    default:
      urls.push(`${base}/pl`)
      urls.push(`${base}/en`)
      break
  }

  return urls
}
```

> When adding new frontend-visible document types to the schema, add a matching case here.

#### Step 2.3: Create the revalidation API endpoint

This endpoint receives the Sanity webhook, performs a GROQ reverse-reference lookup to find all documents that reference the changed document, then fires `x-prerender-revalidate` HEAD requests to all affected URLs.

Create **`apps/astro/src/pages/api/revalidate.ts`**:

```ts
import type { APIRoute } from 'astro'
import { client } from '../../utils/sanity.fetch'
import { getDirectUrls, type SanityDocRef } from '../../utils/revalidation-map'

export const prerender = false

const REVALIDATION_SECRET = import.meta.env.REVALIDATION_SECRET || process.env.REVALIDATION_SECRET || ''
const ISR_BYPASS_TOKEN = import.meta.env.ISR_BYPASS_TOKEN || process.env.ISR_BYPASS_TOKEN || ''

/**
 * Finds all published documents that directly reference the given document ID,
 * then returns the union of their URLs and the changed document's own URLs.
 *
 * Uses the Sanity CDN client (cheap, cached) since we only need the reference
 * graph — not draft content.
 */
async function resolveAffectedUrls(doc: SanityDocRef): Promise<string[]> {
  const directUrls = getDirectUrls(doc)

  // Singletons like `global` affect the whole site — skip the reference lookup,
  // the direct URL list already covers all key pages.
  const SKIP_REFERENCE_LOOKUP = ['global', 'Homepage', 'Activities_Page', 'Hotels_Page']
  if (SKIP_REFERENCE_LOOKUP.includes(doc._type)) {
    return directUrls
  }

  // Query: which published documents reference this document?
  const referencingDocs = await client.fetch<SanityDocRef[]>(
    `*[references($id) && !(_id in path("drafts.**"))]{_type, _id, slug, language}`,
    { id: doc._id }
  )

  const referenceUrls = referencingDocs.flatMap((ref) => getDirectUrls(ref))

  // Deduplicate
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
  console.log(`[revalidate] Invalidated ${urls.length} URLs:`, urls)
}

export const POST: APIRoute = async ({ request }) => {
  const secret = request.headers.get('x-webhook-secret')
  if (!REVALIDATION_SECRET || secret !== REVALIDATION_SECRET) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  if (!ISR_BYPASS_TOKEN) {
    return new Response(JSON.stringify({ error: 'ISR_BYPASS_TOKEN not configured' }), { status: 500 })
  }

  try {
    const doc: SanityDocRef = await request.json()
    const urls = await resolveAffectedUrls(doc)

    // Fire-and-forget — respond immediately, revalidation runs in background
    revalidateUrls(urls).catch((err) => console.error('[revalidate] Error sending HEAD requests:', err))

    return new Response(
      JSON.stringify({ revalidating: urls.length, urls }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('[revalidate] Error processing webhook:', err)
    return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400 })
  }
}
```

**How it works step by step:**

1. Sanity fires webhook → POST to `/api/revalidate` with `{_type, _id, slug, language}` in body
2. Endpoint authenticates via `x-webhook-secret` header
3. `getDirectUrls(doc)` builds URLs for the changed document's own pages
4. `client.fetch(*[references($id)]...)` queries Sanity CDN for all published documents that directly reference this `_id`
5. `getDirectUrls()` runs again for each referencing document to get their URLs
6. All URLs are deduplicated
7. HEAD requests with `x-prerender-revalidate: ISR_BYPASS_TOKEN` are sent to each URL
8. Vercel purges only those pages from the ISR cache; they re-render on the next visitor request

**Example**: Activity `warsztat-czekolady` updates its image →
- `getDirectUrls` produces: `/pl/integracje/warsztat-czekolady`, `/en/activities/warsztat-czekolady`, `/pl/integracje`, `/en/activities`
- Reference lookup returns: `Homepage` (featured activities block), `BlogPost` "10 najlepszych integracji"
- `getDirectUrls(Homepage)` adds: `/pl`, `/en`
- `getDirectUrls(BlogPost)` adds: `/pl/blog/10-najlepszych-integacji`, `/en/blog/10-best-...`, `/pl/blog`, `/en/blog`
- Total: 10 URLs invalidated, zero full deploys

#### Step 2.4: Update the Sanity webhook projection

The webhook projection must include `_id` (needed for the reference lookup), `_type`, `slug`, and `language`.

In Sanity manage → project → API → Webhooks → edit webhook → **Projection** field:

```groq
{_type, _id, slug, language}
```

#### Step 2.5: Add environment variables in Vercel

Add these to the Vercel project settings (Production + Preview):

| Variable | Value | Description |
|---|---|---|
| `ISR_BYPASS_TOKEN` | (output of `openssl rand -hex 32`) | Stable token for ISR cache invalidation |
| `REVALIDATION_SECRET` | (another random secret) | Authenticates incoming Sanity webhooks |

#### Step 2.6: Update the Sanity webhook target

In Sanity manage (`manage.sanity.io` → project → API → Webhooks):

1. **Edit the existing deploy webhook** (or create new + disable old):
   - **Name**: `ISR Revalidation`
   - **URL**: `https://www.fabryka-atrakcji.com/api/revalidate`
   - **Dataset**: `production`
   - **Trigger on**: Create, Update, Delete
   - **HTTP method**: POST
   - **HTTP Headers**: `x-webhook-secret: <your REVALIDATION_SECRET value>`
   - **Filter**: leave empty (all published document changes trigger revalidation; the endpoint handles draft filtering via the reference lookup)
   - **Projection**: `{_type, _id, slug, language}`

2. **Disable or delete** the old Vercel deploy hook webhook

3. Code deploys continue normally via Git push → Vercel build. Content changes no longer trigger deploys.

#### Step 2.7: Keep a manual full-revalidation option

For emergencies (e.g. a global style change that somehow misses pages), keep the Vercel deploy hook URL saved somewhere so a manual deploy can still be triggered. This is a break-glass option, not the normal path.

### Verification

1. Make a content change in Sanity Studio (e.g. update an activity's image)
2. Check Vercel function logs for `/api/revalidate` — should list the invalidated URLs including any referencing pages
3. Visit one of the invalidated pages — it should show updated content after a brief SSR render
4. Check that the Vercel deployment count stays flat
5. Monitor Sanity manage dashboard — API Requests should drop significantly within 24-48 hours

### Risks and limitations

- **Single-level reference lookup**: The GROQ query finds documents that directly reference the changed `_id`. If page A references page B which references the activity, only page B is found (not page A). In practice this does not apply to this schema — pages directly reference collection items.
- **Reference lookup uses CDN**: The `references()` query runs against the CDN client. There is a brief window (seconds) after a mutation where the CDN reference graph may not reflect the change yet. This is acceptable — the revalidated pages will re-render with the correct data since they fetch fresh content on the next request.
- **Deleted documents**: When a document is deleted, `_id` still exists in the webhook payload. The reference lookup will return no results (the document no longer exists), so only the direct URLs are invalidated. This is correct behaviour.
- **New documents**: When a document is created and referenced somewhere (e.g. a new activity added to the Homepage), the Homepage must be updated in Sanity Studio to reference the new document. That save fires its own webhook, which will invalidate the Homepage. No special handling needed.

---

## Projected Results

### Before optimization (January 2026)

| Metric | Value | Cost driver |
|---|---|---|
| Deploys/day | 10-50 | Webhook → full redeploy |
| API Requests/month | 3.7M | Each deploy re-fetches all content from uncached API |
| Bandwidth/month | 477 GB | Full document payloads on every fetch |
| CDN Requests/month | 465.5k | Barely used |
| Estimated overage | ~$400/month | |

### After both strategies

| Metric | Projected value | Why |
|---|---|---|
| Deploys/day | 0-2 (code changes only) | Webhook no longer triggers deploys |
| API Requests/month | ~0 | Production uses CDN, not direct API |
| CDN Requests/month | ~100-300k | Only changed pages re-fetch, rest served from ISR + CDN cache |
| Bandwidth/month | ~10-30 GB | CDN edge caching + fewer requests |
| Estimated overage | **~$0** | All metrics within included Growth quotas |

### Implementation order

| Step | Strategy | Time | Prerequisite |
|---|---|---|---|
| 1 | Strategy 1 — Switch to CDN + drop token | 15 min | **Already done** |
| 2 | Strategy 2.1 — Stable bypass token + `astro.config.ts` update | 15 min | None |
| 3 | Strategy 2.2 — `revalidation-map.ts` URL mapper | 1 hr | Know all document types |
| 4 | Strategy 2.3 — `api/revalidate.ts` endpoint | 1-2 hrs | Steps 2-3 |
| 5 | Strategy 2.5 — Env variables in Vercel | 5 min | Steps 2, 4 |
| 6 | Strategy 2.6 — Switch webhook target in Sanity | 15 min | Steps 4-5 deployed |
| 7 | Verify + monitor | Ongoing | All steps |

Steps 2-6 should be deployed together in one release.

---

## Future optimizations (out of scope for now)

- **Webhook filter**: Add a GROQ filter to the Sanity webhook to exclude draft saves and irrelevant document types. Low effort, reduces unnecessary endpoint invocations. The revalidation endpoint already skips drafts in its reference lookup query, so this is a noise-reduction improvement only.
- **GROQ query projections audit**: ~150 queries exist, ~70% resolve image assets via `->`. Tightening projections reduces bandwidth per request.
- **Request tags**: Add `requestTagPrefix: 'astro'` to the Sanity client for granular monitoring of which queries cost the most.
- **Astro Server Islands**: For pages with a mix of static and dynamic content, server islands (`server:defer`) could further reduce per-request Sanity fetches.
- **Extended Quota add-on** ($299/month): Only consider as a safety net if optimizations still don't bring usage within included quotas. Should not be needed after both strategies are in place.
