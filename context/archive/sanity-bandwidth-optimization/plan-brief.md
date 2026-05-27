# Sanity Bandwidth Optimization — Plan Brief

> Full plan: `context/changes/sanity-bandwidth-optimization/plan.md`
> Research: `ai/sanity-bandwidth-log-research-analysis.md`

## What & Why

Sanity bandwidth costs ~$200/month in overage charges (~792 GB/month against a 100 GB included allowance). The project isn't large — the cost is driven by Astro/Vercel's image optimization pipeline fetching original Sanity assets server-side on every render. 86.9% of bandwidth comes from asset CDN images, and 153.7 GB/week of that is from the `node` user agent (server-side fetching), not browsers.

## Starting Point

The Astro app passes raw Sanity CDN URLs into Astro's `<Image />` component and `getImage()` function. This creates a proxy chain: Sanity CDN → Node/Astro → Vercel `/_image` → Browser. Every page render, ISR revalidation, or image variant generation triggers a fresh server-side fetch from Sanity. A single global OG image accounts for 74.1 GB/week due to repeated `getImage()` calls across all pages.

## Desired End State

All content images served directly from Sanity CDN to browsers via native `<img>` tags with Sanity transform URLs in `srcset`. Zero Node-side image fetching. Monthly Sanity bandwidth under 200 GB, overage cost under $30. Request tags on all queries for future monitoring.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
|---|---|---|---|
| Image delivery method | Sanity CDN native srcset | Eliminates the 153.7 GB/week Node-side proxy — the root cause of bandwidth cost. | Plan |
| OG image handling | Direct Sanity CDN URL | Removes the #1 single asset cost (74.1 GB/week) with zero server-side processing. | Research |
| Heavy SVG handling | Inspect & replace in Sanity | The asset itself is too large (42.2 GB/week); fixing the proxy won't help if browsers still download it. | Plan |
| Request tags | Include in this change | Enables measuring the fix impact in the next log export. | Plan |
| Verification method | 7-day log export post-deploy | Same methodology as baseline analysis for direct comparison. | Plan |

## Scope

**In scope:**
- Rewrite Image component to use Sanity CDN native transforms (no Astro proxy)
- Fix OG image to use direct Sanity CDN URLs
- Add `tag` parameter to `sanityFetch` and tag all queries
- Inspect and replace the heavy SVG asset
- Remove `remotePatterns` config for Sanity from Astro config

**Out of scope:**
- Sanity schema or GROQ query structure changes
- Migrating to `@sanity/image-url` package
- API/query bandwidth optimization
- ISR/revalidation strategy changes
- Fixing 401 response volume

## Architecture / Approach

Replace the double-proxy chain (Sanity CDN → Node → Vercel → Browser) with direct delivery (Sanity CDN → Browser). A new `sanity-image.ts` utility builds transform URLs and srcset strings. The Image component switches from Astro `<Image />` to plain `<img>` with Sanity CDN srcset. The 59 consuming components need zero changes — same Props interface, same data shape.

## Phases at a Glance

| Phase | What it delivers | Key risk |
|---|---|---|
| 1. Fix OG Image Handling | Eliminates 74.1 GB/week from global OG image | Social preview format change (PNG → auto) |
| 2. Rewrite Image Component | Eliminates ~153.7 GB/week of Node-side proxying | Regression across 59 components |
| 3. Add Request Tags | Per-query bandwidth attribution in logs | Touches many files (mechanical but broad) |
| 4. Optimize Heavy SVG | Reduces 42.2 GB/week SVG to reasonable size | Manual Sanity Studio content change |

**Prerequisites:** Access to Sanity Studio for Phase 4. Dev environment running for testing.
**Estimated effort:** ~2-3 sessions across 4 phases. Phase 2 is the largest (new utility + component rewrite + 3 consumer updates).

## Open Risks & Assumptions

- Sanity CDN `auto=format` is assumed to correctly negotiate WebP/AVIF with all major browsers — this is well-documented Sanity behavior but should be verified in testing
- The heavy SVG is assumed to embed raster data (given 42 GB/week from 28K requests) — if it's a genuinely complex vector, SVGO optimization may yield less savings
- Some browser/CDN caching behavior may differ from the proxy setup — monitor for any increase in browser-direct Sanity bandwidth in the post-deploy log

## Success Criteria (Summary)

- Monthly Sanity bandwidth drops from ~792 GB to under 200 GB (verified via 7-day log export)
- Monthly overage cost drops from ~$200 to under $30
- All images render correctly across all page types with no visual regression
