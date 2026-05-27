# Sanity Bandwidth Log Research Analysis

_Created: 2026-05-27_

## Executive Summary

This analysis is based on the Sanity request log export:

```txt
/Users/oliwiersellig/Desktop/fn3a7ltg-2026-05-14-2026-05-21.ndjson
```

The export covers roughly 7 days, from `2026-05-14T00:01:21Z` to `2026-05-21T00:01:53Z`, and contains **2,823,709 valid request log rows**.

The main conclusion is clear:

**Current Sanity bandwidth cost is driven primarily by asset CDN image traffic, not by direct API traffic.**

During this 7-day window, Sanity served approximately **184.8 GB** of outgoing response data:

| Source | Requests | Bandwidth | Share |
|---|---:|---:|---:|
| Asset CDN images (`cdn.sanity.io`) | 596,442 | **160.5 GB** | **86.9%** |
| API CDN queries (`apicdn.sanity.io`) | 1,791,709 | 23.4 GB | 12.7% |
| Direct API (`api.sanity.io`) | 435,558 | 0.9 GB | 0.5% |

At the observed pace:

```txt
184.8 GB / 7 days * 30 days = ~792 GB/month
```

Sanity Growth includes **100 GB/month** bandwidth. With overage at **$0.30/GB**, the estimated monthly overage is:

```txt
(792 GB - 100 GB) * $0.30 = ~$208/month
```

This aligns closely with the reported ~$200/month bandwidth charge.

---

## What Counts As Sanity Bandwidth

Sanity defines bandwidth as total outgoing traffic for:

1. Direct API responses from `api.sanity.io`
2. API CDN responses from `apicdn.sanity.io`
3. Asset CDN responses from `cdn.sanity.io`

For this project, the expensive category is overwhelmingly number 3: **asset CDN images**.

Important distinction:

- Using Sanity CDN improves speed and reduces backend API load.
- It does **not** make outgoing bytes free.
- Every image, SVG, PDF, API response, and query result sent from Sanity still contributes to the monthly bandwidth counter.

---

## Methodology

The log file was too large to open directly in Cursor because it is about 3.9 GB. It was analyzed as a stream instead of loading it into memory.

The aggregation focused on these fields:

| Field | Purpose |
|---|---|
| `body.responseSize` | Main bandwidth metric |
| `body.requestSize` | Incoming request payload size |
| `body.url` | URL or asset responsible for traffic |
| `body.method` | Request method |
| `body.status` | Response status |
| `body.userAgent` | Clue about browser, server, bot, or Sanity client origin |
| `attributes.sanity.domain` | Sanity domain category: `cdn`, `apicdn`, `api` |
| `attributes.sanity.endpoint` | Sanity endpoint: `images`, `query`, `listen`, etc. |
| `timestamp` | Daily/hourly usage timeline |

Key aggregation formulas:

```txt
Total bandwidth = sum(body.responseSize)
GB = bytes / 1024 / 1024 / 1024
Monthly estimate = observed_7_day_GB / 7 * 30
Estimated overage = max(0, monthly_estimate - 100GB) * $0.30
```

---

## High-Level Findings

### 1. Image CDN Is The Main Cost Driver

The `images` endpoint produced:

```txt
596,442 requests
160.5 GB outgoing data
86.9% of all observed bandwidth
```

This means optimization work should focus first on Sanity images and how the Astro app fetches/transforms them.

API query optimization still matters, but it is not the largest bandwidth problem in this export.

### 2. Direct API Usage Is Now Small

Direct API traffic was only:

```txt
435,558 requests
0.9 GB outgoing data
```

This suggests the previous production change to use CDN in `apps/astro/src/utils/sanity.fetch.ts` is working for bandwidth/API split:

```ts
useCdn: !isPreviewDeployment,
token: isPreviewDeployment ? SANITY_API_TOKEN : undefined,
```

The older issue from `ai/sanity-cost-optimization-plan.md`, where production sent all requests to `api.sanity.io`, appears mostly resolved.

### 3. The App/Server Is Pulling Most Image Bytes

The most important clue is the user agent distribution:

| User agent class | Requests | Bandwidth | Interpretation |
|---|---:|---:|---|
| `node` | 590,838 | **153.7 GB** | Server-side image fetching |
| `@sanity/client 7.15.0` | 1,791,861 | 23.3 GB | Sanity client query traffic |
| `Cloud-CDN-Google` | 4,779 | 6.8 GB | CDN/range/cache traffic |
| Browser-like traffic | 367,953 | 0.24 GB | Direct browser requests are small |

This means the largest image traffic is probably **not direct visitor browsers loading Sanity images**. It is likely the Astro/Vercel server or image optimization pipeline fetching Sanity assets.

Relevant code:

- `apps/astro/src/components/ui/image/index.astro`
- `apps/astro/src/layouts/Head.astro`
- `apps/astro/src/utils/metadata.fetch.ts`

The project passes Sanity asset URLs into Astro image tooling:

```ts
src: asset.url
```

and Open Graph images are processed through `getImage()`:

```ts
const asset = await getImage({
  src: openGraphImage || seo.openGraphImage,
  width: 1200,
  format: 'png',
  inferSize: true,
})
```

This can cause Node-side fetches of Sanity assets. When pages are rendered, rebuilt, revalidated, or image variants are generated, the server has to pull the original Sanity image bytes.

---

## Top Bandwidth Drivers

### Top Asset 1: Global SEO Image

```txt
https://cdn.sanity.io/images/fn3a7ltg/production/4ac1e330d7ba84275244c14f4778c9940be4cd04-1200x630.png?w=1200
```

Observed usage:

```txt
145,757 requests
74.1 GB bandwidth
~40.1% of total weekly bandwidth
```

Sanity references:

```txt
global document, language: pl
global document, language: en
field: seo.img
```

Why this matters:

- This is the default/global Open Graph image.
- It is used broadly across pages where a page-specific OG image is not provided.
- It is likely fetched repeatedly by Astro's `getImage()` in `apps/astro/src/layouts/Head.astro`.

Risk:

This single asset alone can explain a large part of the monthly overage.

### Top Asset 2: Activity Category SVG

```txt
https://cdn.sanity.io/images/fn3a7ltg/production/100f2a6fdbbe50895d16306a6562dc7d5698e22a-1920x1080.svg?w=1200
```

Observed usage:

```txt
28,855 requests
42.2 GB bandwidth
~22.8% of total weekly bandwidth
```

Sanity references:

```txt
ActivitiesCategory_Collection: Conference Management Poland
ActivitiesCategory_Collection: Team Building
ActivitiesCategory_Collection: Konferencje i szkolenia
ActivitiesCategory_Collection: Team Building Activities
```

Why this matters:

- The file is an SVG but has `1920x1080` dimensions.
- The URL includes `?w=1200`, but SVGs are not meaningfully resized like raster images.
- If the SVG is complex or embeds large content, it may remain very heavy.

Risk:

This asset is responsible for over 42 GB in one week. It should be inspected and likely replaced with optimized raster/WebP/AVIF output or a simplified SVG.

### Top Asset 3: Large Original JPG

```txt
https://cdn.sanity.io/images/fn3a7ltg/production/8ca056df86e12cbf7a11af30ef38cd306425c79f-8192x5464.jpg
```

Observed usage:

```txt
556 requests
2.95 GB bandwidth
```

Sanity references include:

```txt
BlogPost_Collection
CaseStudy_Collection
ActivitiesCategory_Collection
```

Why this matters:

- The original asset is extremely large: `8192x5464`.
- The logged URL does not include a width transform.
- Each request can transfer multiple megabytes.

Risk:

Even low request counts become expensive when original images are served without size/format transforms.

### Other Large Original Images

Several large JPGs are served directly without visible Sanity transform params:

```txt
5949ce83...-8192x5464.jpg       1.00 GB
4f88a45c...-7360x4912.jpg       0.83 GB
ae2152df...-4912x7360.jpg       0.70 GB
12c295f4...-8192x5464.jpg       0.65 GB
2c3d7e99...-5612x3741.jpg       0.58 GB
c0635e85...-3751x5626.jpg       0.57 GB
c575f75f...-4000x6000.jpg       0.56 GB
8f7de890...-5993x3995.jpg       0.55 GB
```

These are not individually as large as the top two, but together they add meaningful recurring bandwidth.

---

## File Type Breakdown

| Extension | Requests | Bandwidth | Notes |
|---|---:|---:|---|
| PNG | 148,152 | **77.0 GB** | Dominated by global OG image |
| SVG | 378,635 | **42.9 GB** | Dominated by heavy category SVG |
| JPG | 50,790 | **33.1 GB** | Many large originals |
| WebP | 18,837 | 7.6 GB | Better, but still sizeable |
| No extension | 2,227,212 | 24.3 GB | Mostly API/query URLs |

Takeaway:

- The most expensive format is PNG because of the global SEO image.
- The SVG cost is unusually high and should be investigated.
- JPG originals should be transformed before delivery.

---

## API Query Findings

Query traffic is not the primary cost driver, but it is still significant:

```txt
1,912,506 query requests
24.2 GB bandwidth
```

Most query bandwidth goes through `apicdn.sanity.io`, which is good.

Top query drivers:

| Query | Requests | Bandwidth | Notes |
|---|---:|---:|---|
| Unidentified APICDN query path | 182,302 | 18.1 GB | Likely POST/body query, not visible in URL |
| Global inquiry/form defaults query | 181,036 | 2.57 GB | Large global object with images and social proof |
| Navbar highlighted content query | 189,537 | 1.23 GB | Returns highlighted content and image metadata |
| Footer/contact query | 189,547 | 0.47 GB | Repeated global/footer request |
| Organization schema query | 189,544 | 0.25 GB | Repeated global metadata request |

### Why Some Queries Are Hard To Identify

Sanity logs can identify GET queries by URL because the query is in the query string. For POST queries, the body is not available in the request URL, so logs show only:

```txt
https://fn3a7ltg.apicdn.sanity.io/v2024-10-15/data/query/production?returnQuery=false&perspective=published
```

This is why future work should add Sanity request tags.

Recommended tagging pattern:

```ts
client.fetch(query, params, { tag: 'layout.head.global-og' })
client.fetch(query, params, { tag: 'layout.header' })
client.fetch(query, params, { tag: 'layout.footer' })
client.fetch(query, params, { tag: 'page.activities-list' })
```

Sanity request logs then include these tags, making future cost attribution much easier.

---

## Status Code Findings

| Status | Requests | Bandwidth | Notes |
|---|---:|---:|---|
| 200 | 2,512,205 | 178.0 GB | Normal successful responses |
| 206 | 4,695 | 6.8 GB | Partial content/range responses |
| 401 | 148,053 | 0.02 GB | Many unauthorized requests, low bandwidth |
| 204 | 143,605 | 0.01 GB | Usually CORS/options/no-content |
| 304 | 1,255 | ~0 GB | Cache revalidation |

The 401 count is high but not a bandwidth issue. It may be worth investigating separately for noise or misconfigured Studio/client calls, but it is not driving the $200/month charge.

---

## Timeline Findings

Daily bandwidth:

| Date | Requests | Bandwidth |
|---|---:|---:|
| 2026-05-14 | 386,491 | 27.4 GB |
| 2026-05-15 | 319,886 | 24.4 GB |
| 2026-05-16 | 274,875 | 18.2 GB |
| 2026-05-17 | 317,963 | 20.7 GB |
| 2026-05-18 | 248,667 | 17.3 GB |
| 2026-05-19 | 581,071 | **44.8 GB** |
| 2026-05-20 | 694,566 | 32.0 GB |
| 2026-05-21 | 190 | 0.02 GB |

`2026-05-21` only contains a partial minute and should not be interpreted as a full day.

The heaviest hour was:

```txt
2026-05-19T18:00
119,112 requests
10.36 GB
```

This spike suggests either:

1. A content update/revalidation/deploy caused many server-side image refetches
2. A crawler or automated process hit pages that forced image generation
3. A Vercel image cache was cold/invalidated
4. The app generated many image variants for popular pages

---

## Likely Root Cause Chain

Current likely flow:

```txt
Visitor or crawler requests page
  -> Astro/Vercel renders or revalidates page
  -> Astro Image / getImage receives Sanity image URL
  -> Node fetches Sanity original/transformed asset from cdn.sanity.io
  -> Sanity counts outgoing image bytes as bandwidth
  -> Repeated renders/cache misses multiply the same fetches
```

This is supported by:

- `node` user agent responsible for **153.7 GB**
- `cdn.sanity.io` responsible for **160.5 GB**
- Browser-like direct Sanity traffic only **0.24 GB**
- Top image is global SEO image used broadly across pages
- Open Graph image handling uses Astro `getImage()`
- Shared image component uses Astro `<Image />` with external Sanity URLs

---

## Recommended Fixes

### Priority 1: Stop Processing Open Graph Images Through Astro `getImage()`

File:

```txt
apps/astro/src/layouts/Head.astro
```

Current behavior:

```ts
const asset = await getImage({
  src: openGraphImage || seo.openGraphImage,
  width: 1200,
  format: 'png',
  inferSize: true,
})
```

Recommended behavior:

- Do not route the global OG image through Astro image optimization.
- Use a direct Sanity CDN URL with stable transform params.
- Prefer `auto=format` and `q` where applicable.

Example target:

```ts
const ogImage = openGraphImage || seo.openGraphImage
```

and ensure the Sanity URL already includes:

```txt
?w=1200&h=630&fit=crop&auto=format&q=75
```

Expected impact:

This could materially reduce repeated Node-side fetches of the top asset, which alone accounted for **74.1 GB/week**.

### Priority 2: Replace Or Optimize The Heavy SVG

Asset:

```txt
100f2a6fdbbe50895d16306a6562dc7d5698e22a-1920x1080.svg
```

Referenced by activity categories:

```txt
Conference Management Poland
Team Building
Konferencje i szkolenia
Team Building Activities
```

Recommended actions:

1. Download and inspect the SVG size.
2. Check if it embeds raster/base64 data.
3. If it is illustration-like, optimize with SVGO.
4. If it is photo-like, replace with WebP/AVIF/JPG.
5. Avoid requesting SVG with `?w=1200`, because SVG does not behave like raster image resizing.

Expected impact:

Potentially reduces **42.2 GB/week**.

### Priority 3: Ensure All Large JPGs Use Sanity Transform URLs

Large original JPGs should not be served as:

```txt
...-8192x5464.jpg
...-7360x4912.jpg
...-5612x3741.jpg
```

Recommended Sanity URL pattern:

```txt
?w=1200&auto=format&q=75&fit=max
```

For responsive images:

```txt
?w=640&auto=format&q=70
?w=1080&auto=format&q=75
?w=1600&auto=format&q=75
```

Expected impact:

Reduces large-original transfer size and protects against accidental multi-megabyte image delivery.

### Priority 4: Audit Astro Image Usage For External Sanity URLs

File:

```txt
apps/astro/src/components/ui/image/index.astro
```

Current pattern:

```ts
src: asset.url
```

The component then passes Sanity URLs to Astro `<Image />`.

Recommended investigation:

1. Confirm whether Vercel/Astro image service is caching remote image variants.
2. Confirm whether ISR revalidation or deploys cause image variants to be regenerated.
3. Compare output HTML image URLs:
   - If they point to Vercel/Astro image endpoints, the server is proxying Sanity images.
   - If they point directly to `cdn.sanity.io`, browser traffic should dominate instead of `node`.
4. Consider replacing generic Astro image optimization for Sanity assets with Sanity's native image CDN transforms.

Expected impact:

Should reduce repeated Node-side origin fetches from Sanity.

### Priority 5: Add Request Tags To Sanity Queries

File:

```txt
apps/astro/src/utils/sanity.fetch.ts
```

Current helper:

```ts
export default async function sanityFetch<QueryResponse>({
  query,
  params = {},
}: {
  query: string
  params?: QueryParams
}): Promise<QueryResponse> {
  return await client.fetch<QueryResponse>(query, params)
}
```

Recommended future shape:

```ts
export default async function sanityFetch<QueryResponse>({
  query,
  params = {},
  tag,
}: {
  query: string
  params?: QueryParams
  tag?: string
}): Promise<QueryResponse> {
  return await client.fetch<QueryResponse>(query, params, tag ? { tag } : undefined)
}
```

Then calls can use:

```ts
sanityFetch({ query, params, tag: 'layout.header' })
sanityFetch({ query, params, tag: 'layout.footer' })
sanityFetch({ query, params, tag: 'page.activities-list' })
```

Expected impact:

Not a direct cost reduction, but future logs will clearly show which query is responsible for which usage.

---

## Recommended Investigation Checklist

### Sanity Asset Checks

- [ ] Inspect `4ac1e330...-1200x630.png` file size.
- [ ] Inspect `100f2a6f...-1920x1080.svg` file size and contents.
- [ ] Confirm whether the SVG embeds base64 raster data.
- [ ] List the top 20 asset files by original byte size in Sanity.
- [ ] Identify all documents referencing the top 20 bandwidth assets.

### Astro/Vercel Checks

- [ ] Inspect production HTML for image URLs.
- [ ] Check if rendered images point to Vercel image endpoints or direct Sanity CDN URLs.
- [ ] Confirm whether ISR revalidation regenerates image variants.
- [ ] Check Vercel image optimization/cache behavior for remote Sanity assets.
- [ ] Check whether preview or production deploys are repeatedly warming pages/images.

### Sanity Query Checks

- [ ] Add request tags to layout, metadata, and page queries.
- [ ] Re-export request logs after 48 hours.
- [ ] Compare tagged query bandwidth before/after image fixes.

---

## Expected Impact By Fix

| Fix | Potential impact | Confidence |
|---|---:|---|
| Avoid Astro `getImage()` for global OG image | Up to 74 GB/week | High |
| Optimize/replace heavy activity category SVG | Up to 42 GB/week | High |
| Transform large original JPGs | 5-15 GB/week | Medium |
| Replace Astro proxying with Sanity native transforms | Broad reduction in Node-origin image traffic | Medium-high |
| Add query tags | Better observability | High |

If the top two image issues are solved, the weekly bandwidth could drop from:

```txt
184.8 GB/week
```

to roughly:

```txt
68.6 GB/week
```

That still projects to about:

```txt
68.6 / 7 * 30 = ~294 GB/month
```

which is an estimated overage of:

```txt
(294 - 100) * $0.30 = ~$58/month
```

This is a rough estimate, but it shows that fixing only the top two assets may reduce the Sanity bandwidth charge from about **$200/month** to around **$60/month**.

Further work on large JPGs and image delivery architecture could reduce it more.

---

## Final Recommendation

Do not start with broad Sanity API refactors. The logs show that API traffic is no longer the core issue.

Start with image delivery:

1. Change Open Graph image handling in `apps/astro/src/layouts/Head.astro`.
2. Replace or optimize `100f2a6f...-1920x1080.svg`.
3. Ensure content images use Sanity transform URLs rather than original asset URLs.
4. Add request tags for future log analysis.
5. Export another 7-day request log after deployment and compare the same metrics.

The biggest cost reduction should come from preventing repeated Node-side fetching of large Sanity assets.
