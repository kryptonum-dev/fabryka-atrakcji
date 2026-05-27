# Sanity Bandwidth Optimization Implementation Plan

## Overview

Reduce Sanity bandwidth from ~792 GB/month (~$200/month overage) to under 200 GB/month by eliminating Node-side image proxying. The root cause is that Astro's `<Image />` component and `getImage()` function fetch Sanity CDN images server-side to generate optimized variants — this proxy layer accounts for 153.7 GB/week out of 160.5 GB total image traffic. The fix: serve images directly from Sanity CDN with native transform parameters, bypassing Astro/Vercel image optimization entirely for remote Sanity assets.

## Current State Analysis

The project serves images through a double-proxy chain:

```
Sanity CDN → Node/Astro getImage() or <Image /> → Vercel /_image endpoint → Browser
```

Every page render, ISR revalidation, or cache miss triggers Node-side fetches of Sanity originals. The `node` user agent is responsible for **153.7 GB/week** while browser-direct traffic is only **0.24 GB/week**.

### Key Discoveries:

- `apps/astro/src/layouts/Head.astro:44-49` — `getImage()` processes the global OG image on **every page render**, causing 145,757 requests and 74.1 GB/week for a single asset
- `apps/astro/src/components/ui/image/index.astro` — 59 components feed Sanity CDN URLs into Astro `<Image />`, which proxies them through Vercel's image optimizer
- `apps/astro/src/utils/optimize-images.ts` — Additional `getImage()` usage for carousel/testimonial images (3 components)
- `apps/astro/src/utils/image-to-inline-svg.ts` — Fetches SVGs from Sanity to inline them; minor bandwidth impact but still Node-side fetching
- `apps/astro/astro.config.ts:11-18` — `remotePatterns` for `cdn.sanity.io` enables the proxy; can be removed after migration
- `apps/astro/src/utils/sanity.fetch.ts` — No request tags, making query bandwidth attribution impossible in logs
- 24 pages have `prerender = false` (filter/pagination), meaning every visitor request triggers fresh renders + image fetches
- The project does NOT use `@sanity/image-url` — URLs are constructed manually

## Desired End State

After this plan is complete:

1. **Zero Node-side image fetching from Sanity** — All content images served directly from Sanity CDN to browsers via native `<img>` tags with `srcset` built from Sanity transform URLs
2. **OG images use direct Sanity CDN URLs** — No `getImage()` processing, hardcoded dimensions
3. **Sanity bandwidth drops from ~792 GB/month to under 200 GB/month** — Monthly overage cost drops from ~$200 to under $30
4. **Request tags on all Sanity queries** — Next log export shows per-query bandwidth attribution
5. **Heavy SVG asset replaced** — The 42.2 GB/week SVG is optimized or replaced with a raster format

Verification: export a 7-day Sanity request log after deployment and compare total bandwidth, Node UA share, and top asset bandwidth against the baseline in `ai/sanity-bandwidth-log-research-analysis.md`.

## What We're NOT Doing

- Changing the Sanity schema or GROQ query structure (only adding `tag` param to fetch calls)
- Migrating to `@sanity/image-url` package (manual URL construction is simpler for this use case)
- Optimizing API/query bandwidth (only 12.7% of total, not the priority)
- Changing ISR/revalidation strategy
- Fixing the 401 response volume (148,053 requests but negligible bandwidth)
- Removing Astro Image entirely from the project (still used for local assets like favicon/icons)

## Implementation Approach

Switch from Astro-proxied image delivery to Sanity CDN-native delivery in 4 phases, ordered by bandwidth impact. Each phase is independently deployable and testable.

**Sanity CDN transform URL pattern used throughout:**
```
{baseUrl}?w={width}&auto=format&q=75&fit=max
```

Where `auto=format` enables content negotiation (Sanity serves WebP/AVIF based on browser Accept header) and `q=75` balances quality with file size.

## Critical Implementation Details

**Sanity CDN `auto=format` only works for raster images.** SVGs must be served without transform params (they're already vector). The Image component already detects SVGs via `asset.extension === 'svg'` — this check must be preserved in the rewrite.

**The `sizes` attribute is critical for correct srcset behavior.** Each component currently passes a `sizes` prop to the Image component. This must be preserved exactly — it tells the browser which srcset URL to pick. Without it, the browser defaults to `100vw` and always downloads the largest variant.

---

## Phase 1: Fix OG Image Handling

### Overview

Eliminate the #1 bandwidth culprit by removing Astro `getImage()` from Open Graph image processing. Use direct Sanity CDN URLs with hardcoded dimensions instead.

### Changes Required:

#### 1. Head.astro — Remove getImage() for OG image

**File**: `apps/astro/src/layouts/Head.astro`

**Intent**: Stop server-side processing of OG images. Replace the `getOgImage()` function (lines 43-55) with direct use of the Sanity CDN URL. The global GROQ query (lines 15-21) should return a URL with proper Sanity transform params (`?w=1200&h=630&fit=crop&auto=format&q=80`). The og:image meta tags should use this URL directly with hardcoded width=1200 and height=630.

**Contract**: The `getOgImage` async function and its `getImage()` call are removed. The `ogImage` variable becomes a simple object `{ url, width: 1200, height: 630 }` derived from the Sanity CDN URL (either page-specific `openGraphImage` or global `seo.openGraphImage`). The GROQ query for global SEO changes from `img.asset -> url + "?w=1200"` to `img.asset -> url + "?w=1200&h=630&fit=crop&auto=format&q=80"`. The `getImage` import from `astro:assets` is still needed for favicon/apple-touch-icon (lines 11-12) — do not remove it.

#### 2. metadata.fetch.ts — Update OG image URL params

**File**: `apps/astro/src/utils/metadata.fetch.ts`

**Intent**: Ensure per-page OG image URLs include the same Sanity transform params so they also bypass `getImage()` when passed to Head.astro.

**Contract**: The GROQ field `"openGraphImage": seo.img.asset -> url + "?w=1200"` changes to `"openGraphImage": seo.img.asset -> url + "?w=1200&h=630&fit=crop&auto=format&q=80"`.

### Success Criteria:

#### Automated Verification:

- TypeScript compiles: `npm run build` in `apps/astro`
- Linting passes: `npm run lint`
- No runtime errors on dev server: `npm run dev`, visit multiple pages

#### Manual Verification:

- Inspect production HTML: og:image meta tags point to `cdn.sanity.io` URLs (not `/_image` or Vercel endpoints)
- og:image URL loads correctly when pasted into a browser
- Test with Facebook Sharing Debugger or Twitter Card Validator that social previews render correctly
- Check Vercel function logs — no `getImage()` errors for OG images

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 2: Rewrite Image Component to Sanity CDN Native

### Overview

Replace Astro `<Image />` proxy with plain `<img>` elements using Sanity CDN srcset. This eliminates the bulk of Node-side image fetching (~153.7 GB/week). The 59 components using the Image component need zero changes — only the Image component internals change.

### Changes Required:

#### 1. Create Sanity image URL utility

**File**: `apps/astro/src/utils/sanity-image.ts` (new file)

**Intent**: Provide a helper to build Sanity CDN transform URLs and generate srcset strings from a base Sanity asset URL. Centralizes the URL construction logic so the Image component and any future consumers use consistent params.

**Contract**: Two exported functions:

- `sanityImageUrl(baseUrl: string, params: { w?: number, h?: number, q?: number, fit?: string }): string` — appends transform query params to a Sanity CDN URL. Always includes `auto=format` for content negotiation.
- `sanityImageSrcset(baseUrl: string, widths: number[], maxOriginalWidth: number, quality?: number): string` — generates a srcset string, filtering out widths larger than `maxOriginalWidth`. Each entry uses `auto=format` and the specified quality (default 75).

```ts
// Signature contract — other files depend on these exports
export function sanityImageUrl(baseUrl: string, params: { w?: number; h?: number; q?: number; fit?: string }): string
export function sanityImageSrcset(baseUrl: string, widths: number[], maxOriginalWidth: number, quality?: number): string
```

#### 2. Rewrite Image component

**File**: `apps/astro/src/components/ui/image/index.astro`

**Intent**: Replace Astro `<Image />` with a plain `<img>` element that uses Sanity CDN srcset for raster images and a plain `<img>` for SVGs. Keep all existing behavior: LQIP placeholder background, `sizes` prop passthrough, priority/eager loading, width capping at MAX_WIDTH (2560). The component's Props interface and `ImageDataProps` type remain unchanged so the 59 consuming components need zero modifications.

**Contract**:
- Remove `import { Image as AstroImage } from 'astro:assets'`
- Import `sanityImageUrl` and `sanityImageSrcset` from the new utility
- For raster images: render `<img>` with `src` set to `sanityImageUrl(asset.url, { w: width, q: 75 })` and `srcset` from `sanityImageSrcset()` using the existing widths array `[48, 64, 96, 128, 256, 384, 640, 750, 828, 1080, 1200, 1920, 2048, 2560]`
- For SVGs (`asset.extension === 'svg'`): render plain `<img src={asset.url}>` with no srcset/sizes/widths
- Preserve: `loading`, `fetchpriority`, `decoding="async"`, LQIP `style` + `onload` behavior, `sizes` prop, `alt` from `asset.altText`, width/height attributes, spread of remaining `...props`

#### 3. Update optimize-images utility

**File**: `apps/astro/src/utils/optimize-images.ts`

**Intent**: Replace `getImage()` usage with direct Sanity CDN URL construction. This function is used by 3 components (ActivitiesCarousel, HighlightedBlogPosts, TestimonialsPopup).

**Contract**: The function takes the same inputs `{ image, width, height }` and returns an object with a `src` property pointing to a Sanity CDN transform URL. The `widths` array and `sizes` property it currently returns must be preserved or replaced with equivalent Sanity CDN srcset output. Remove `getImage` import from `astro:assets`.

#### 4. Clean up Astro config

**File**: `apps/astro/astro.config.ts`

**Intent**: Remove the `remotePatterns` entry for `cdn.sanity.io` since Sanity images are no longer processed through Astro's image service.

**Contract**: The `image.remotePatterns` array that allows `cdn.sanity.io` is removed. If no other remote patterns exist, the entire `image` config block can be removed. Verify no other component still passes Sanity URLs to Astro Image before removing.

### Success Criteria:

#### Automated Verification:

- TypeScript compiles: `npm run build` in `apps/astro`
- Linting passes: `npm run lint`
- Build completes without image processing errors

#### Manual Verification:

- Visit 5+ pages of different types (homepage, hotel detail, activity detail, blog post, case study) and verify images render correctly
- Inspect HTML source: `<img>` tags have `srcset` pointing to `cdn.sanity.io` URLs with `?w=X&auto=format&q=75` params (NOT `/_image` Vercel endpoints)
- Check responsive behavior: resize browser window, verify different srcset variants load (visible in Network tab)
- Verify LQIP placeholders still appear while images load (throttle network in DevTools)
- Check SVG images render correctly (no broken images)
- Test a page with the ActivitiesCarousel, HighlightedBlogPosts, or TestimonialsPopup to verify optimize-images changes work

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 3: Add Request Tags to sanityFetch

### Overview

Add a `tag` parameter to the shared `sanityFetch` function and tag all layout/page queries. This enables per-query bandwidth attribution in future Sanity log exports.

### Changes Required:

#### 1. Update sanityFetch signature

**File**: `apps/astro/src/utils/sanity.fetch.ts`

**Intent**: Add an optional `tag` parameter that gets passed through to `client.fetch()` as the third argument's `tag` property. Also update `sanityFetchWithCdn` for consistency.

**Contract**: The function signature adds `tag?: string` to the params object. When `tag` is provided, it's passed as `client.fetch(query, params, { tag })`. When omitted, behavior is unchanged (no third argument or `undefined`).

#### 2. Tag layout queries

**Files**: All files that call `sanityFetch` for layout/global data:
- `apps/astro/src/layouts/Head.astro` — tag: `layout.head`
- `apps/astro/src/layouts/Header.astro` — tag: `layout.header`
- Look for footer, global inquiry widget, organization schema, and other layout-level queries

**Intent**: Tag the highest-traffic queries first — layout queries run on every page load and are the bulk of API CDN bandwidth.

**Contract**: Each `sanityFetch({ query, params })` call gains a `tag` field: `sanityFetch({ query, params, tag: 'layout.head' })`. Tag format: `layout.*` for layout queries, `page.*` for page-specific queries (e.g., `page.hotels-list`, `page.blog-post`).

#### 3. Tag page-level queries

**Files**: Page templates and data-fetching functions across:
- `apps/astro/src/templates/` — all page templates
- `apps/astro/src/pages/` — any inline sanityFetch calls
- `apps/astro/src/components/global/` — components that fetch their own data

**Intent**: Tag remaining sanityFetch calls so the next log export shows complete per-query attribution.

**Contract**: Same pattern as layout tags. Use descriptive, hierarchical tags: `page.hotel-detail`, `page.activities-list`, `component.inquiry-widget`, `component.newsletter`, etc.

### Success Criteria:

#### Automated Verification:

- TypeScript compiles: `npm run build`
- Linting passes: `npm run lint`
- Grep confirms no untagged sanityFetch calls remain: `grep -r "sanityFetch({" --include="*.astro" --include="*.ts" --include="*.tsx" apps/astro/src/ | grep -v "tag:"`

#### Manual Verification:

- Dev server starts without errors
- Pages load normally (tags don't affect functionality)
- Check Sanity request logs (if accessible) to confirm tags appear

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 4: Inspect & Optimize Heavy SVG Asset

### Overview

The SVG `100f2a6fdbbe50895d16306a6562dc7d5698e22a-1920x1080.svg` accounts for 42.2 GB/week. After Phase 2, this is no longer proxied through Node, but it's still served to browsers at full size. Inspecting and optimizing/replacing it further reduces bandwidth.

### Changes Required:

#### 1. Download and inspect the SVG

**Intent**: Determine if the SVG embeds base64 raster data (which would explain the extreme size for an SVG) or is a genuinely complex vector.

**Contract**: Download from `https://cdn.sanity.io/images/fn3a7ltg/production/100f2a6fdbbe50895d16306a6562dc7d5698e22a-1920x1080.svg`. Check file size and inspect for embedded `<image>` elements with `data:image/...` or `xlink:href` containing base64 data.

#### 2. Replace or optimize in Sanity Studio

**Intent**: If the SVG embeds raster data, re-export the source as WebP/AVIF and re-upload to the 4 activity category documents that reference it. If it's pure vector, optimize with SVGO and re-upload.

**Contract**: The 4 affected documents are:
- ActivitiesCategory_Collection: Conference Management Poland
- ActivitiesCategory_Collection: Team Building
- ActivitiesCategory_Collection: Konferencje i szkolenia
- ActivitiesCategory_Collection: Team Building Activities

Update the image field in each document with the optimized asset.

#### 3. Audit other large originals

**Intent**: Check the other large JPGs identified in the research (8192x5464, 7360x4912, etc.) and ensure they have proper Sanity transform params in their GROQ queries. After Phase 2, the Image component automatically applies transforms, but any direct `asset -> url` usage outside the Image component should also include params.

**Contract**: Search for any GROQ queries that use `asset -> url` without the `ImageDataQuery` helper and verify they either go through the Image component (which now adds transforms) or include manual transform params.

### Success Criteria:

#### Automated Verification:

- No code changes needed (this is content/asset work) — unless audit in step 3 reveals unprotected queries

#### Manual Verification:

- The SVG asset file size in Sanity is under 500 KB (or replaced with raster format)
- Activity category pages render correctly with the new asset
- Browser DevTools Network tab shows reasonable image transfer sizes for the affected pages

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Testing Strategy

### Unit Tests:

- The `sanityImageUrl` and `sanityImageSrcset` utility functions should be tested for correct URL construction, proper handling of edge cases (no width, width exceeding original, SVG URLs)
- If the project has no test runner set up, these are simple pure functions that can be manually verified

### Integration Tests:

- Build the full site (`npm run build`) and verify no image-related errors
- Check that generated HTML contains correct `srcset` attributes pointing to Sanity CDN

### Manual Testing Steps:

1. Visit homepage, inspect all images — correct srcset, loading, no broken images
2. Visit a hotel detail page — check gallery images, hero image
3. Visit an activity detail page — check all image types
4. Visit a blog post — check inline images, author image, OG tags
5. Visit a case study — check gallery, testimonial images
6. Test with slow network (DevTools throttling) — LQIP placeholders appear, images load progressively
7. Right-click an image → "Open image in new tab" — should open a `cdn.sanity.io` URL
8. Test social sharing: paste a page URL into Facebook Sharing Debugger — OG image renders
9. Check a filter/pagination page (prerender=false) — images still work on dynamic pages

## Performance Considerations

- **Sanity CDN `auto=format`** enables content negotiation — browsers that support WebP/AVIF get smaller files automatically. This may actually improve perceived performance for end users compared to the previous Astro-processed output.
- **LQIP placeholders** are preserved — the base64 `lqip` from Sanity metadata is still used as a CSS background while the full image loads.
- **No layout shift** — width/height attributes are still set from Sanity metadata dimensions, preventing CLS.
- **Lazy loading** is preserved — non-priority images still get `loading="lazy"`.
- **srcset widths** remain the same as the current Astro Image widths array — browsers pick the appropriate size based on viewport and DPR.

## Migration Notes

- This change is backwards-compatible: all 59 consuming components use the same `ImageDataProps` interface and don't need changes.
- The GROQ `ImageDataQuery` helper is unchanged — it still fetches `url`, `altText`, `extension`, `metadata.dimensions`, and `lqip`.
- After deployment, Vercel's image optimization cache will naturally age out the old proxied variants. No manual cache purge needed.
- The `sharp` dependency in `apps/astro/package.json` is still needed for local asset processing (favicon, apple-touch-icon in Head.astro). Do not remove it.

## Verification Plan

After deploying all phases:

1. **Day 0**: Deploy to production
2. **Day 1-7**: Collect Sanity request log data
3. **Day 8**: Export 7-day ndjson log from Sanity (same method as `ai/sanity-bandwidth-log-research-analysis.md`)
4. **Day 8**: Compare metrics:

| Metric | Baseline (pre-fix) | Target (post-fix) |
|---|---|---|
| Total bandwidth / 7 days | 184.8 GB | < 50 GB |
| Node UA bandwidth | 153.7 GB | < 5 GB |
| Top asset (global OG) | 74.1 GB | < 1 GB |
| Top SVG asset | 42.2 GB | < 1 GB |
| Monthly projection | ~792 GB | < 200 GB |
| Monthly overage cost | ~$200 | < $30 |

## References

- Research analysis: `ai/sanity-bandwidth-log-research-analysis.md`
- Sanity request log: `/Users/oliwiersellig/Desktop/fn3a7ltg-2026-05-14-2026-05-21.ndjson`
- Image component: `apps/astro/src/components/ui/image/index.astro`
- Image component re-export: `apps/astro/src/components/ui/image/index.ts`
- Head layout: `apps/astro/src/layouts/Head.astro`
- Metadata fetch: `apps/astro/src/utils/metadata.fetch.ts`
- Sanity fetch: `apps/astro/src/utils/sanity.fetch.ts`
- Optimize images: `apps/astro/src/utils/optimize-images.ts`
- Inline SVG utility: `apps/astro/src/utils/image-to-inline-svg.ts`
- Astro config: `apps/astro/astro.config.ts`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Fix OG Image Handling

#### Automated

- [x] 1.1 TypeScript compiles: `npm run build` in `apps/astro` — 76a0c28
- [x] 1.2 Linting passes: `npm run lint` — 76a0c28
- [x] 1.3 No runtime errors on dev server — 76a0c28

#### Manual

- [x] 1.4 og:image meta tags point to `cdn.sanity.io` URLs — 76a0c28
- [x] 1.5 Social preview renders correctly (Facebook Sharing Debugger / Twitter Card Validator) — 76a0c28

### Phase 2: Rewrite Image Component to Sanity CDN Native

#### Automated

- [x] 2.1 TypeScript compiles: `npm run build` — f08c8a5
- [x] 2.2 Linting passes: `npm run lint` — f08c8a5
- [x] 2.3 Build completes without image processing errors — f08c8a5

#### Manual

- [x] 2.4 Images render correctly on 5+ page types — f08c8a5
- [x] 2.5 HTML source shows `cdn.sanity.io` srcset URLs — f08c8a5
- [x] 2.6 Responsive srcset variants load correctly (Network tab) — f08c8a5
- [x] 2.7 LQIP placeholders appear on throttled network — f08c8a5
- [x] 2.8 SVG images render correctly — f08c8a5
- [x] 2.9 optimize-images components work (ActivitiesCarousel, HighlightedBlogPosts, TestimonialsPopup) — f08c8a5

### Phase 3: Add Request Tags to sanityFetch

#### Automated

- [x] 3.1 TypeScript compiles: `npm run build` — a71be97
- [x] 3.2 Linting passes: `npm run lint` — a71be97
- [x] 3.3 No untagged sanityFetch calls remain — a71be97

#### Manual

- [x] 3.4 Pages load normally with tags — a71be97

### Phase 4: Inspect & Optimize Heavy SVG Asset

#### Manual

- [x] 4.1 SVG inspected and size determined — cfaf129
- [x] 4.2 Asset replaced/optimized in Sanity Studio — cfaf129
- [x] 4.3 Activity category pages render correctly with new asset — cfaf129
