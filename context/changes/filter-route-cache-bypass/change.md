---
change_id: filter-route-cache-bypass
title: Filtering is silently broken in production on EN and event-space listing routes
status: new
created: 2026-08-03
updated: 2026-08-03
archived_at: null
---

> **Status note, 2026-11-02.** The bypass landed through the change `filters-upsell-hotels-spaces` (its Phase 1): two wildcard rewrites in `apps/astro/vercel.json` replaced the hand-kept list, and that change's `verify.sh` guards all filter routes. The `Pagination.astro` EN spelling issue listed below is gone as well, because `paginationPath` now handles both spellings. Do not start this change. Only `filter-crawl-trap` Phase 3 (robots.txt) stays open.

## Notes

Split out of [[filter-crawl-trap]] on 2026-08-03. That change is SEO-only; this one owns the user-facing functional regression found while investigating it.

**Symptom:** applying any filter, sort, or search on most listing routes returns unfiltered results. The route responds `200` from the ISR cache with a byte-identical body regardless of query string.

### Verified live on production (2026-08-03)

| Route | `x-vercel-cache` | Filtering |
| --- | --- | --- |
| `/pl/hotele/filtr/` | MISS | ✅ works — `?stars=5` (2 200 177 B) vs `?stars=3` (2 642 680 B) |
| `/pl/integracje/filtr/` | MISS | ✅ works |
| `/en/hotels/filter/` | **HIT** | ❌ `?stars=5` and `?stars=3` both 2 719 342 B |
| `/en/activities/filter/` | **HIT** | ❌ `?duration=2` and `?duration=6` both 817 232 B |
| `/pl/przestrzenie-eventowe/filtr/` | **HIT** | ❌ identical 439 606 B for no query, `?minCapacity=500`, `?order=priceAsc` |
| `/en/event-spaces/filter/` | **HIT** | ❌ identical 391 937 B |

So **all English filtering and all event-space filtering is non-functional for real users**, in both languages for event spaces.

### Leading hypothesis (not yet confirmed)

Two layers are trying to control this and they disagree:

1. `apps/astro/astro.config.ts:36-40` — the Vercel adapter's ISR `exclude` regexes (`/.*\/filtr.*/`, `/.*\/filter.*/`). These look correct but appear to have no effect.
2. `apps/astro/vercel.json` — a hand-maintained list of `/_render` rewrites. The routes that actually filter correctly are exactly the routes on this list.

If that holds, `vercel.json` is the de-facto mechanism and the adapter config is inert. The list is also visibly rotten:

- **Missing entirely:** `/pl/przestrzenie-eventowe/filtr/`, `/pl/przestrzenie-eventowe/strona/:page/filtr/`, `/en/event-spaces/filter/`, `/en/event-spaces/page/:page/filter/`, `/en/hotels/filter/`, `/en/activities/filter/`, `/en/activities/category/:category/filter/`
- **Wrong spelling:** `/en/hotels/page/:page/filtr/` uses the PL segment `filtr` on an EN route (should be `filter`)
- **Routes that do not exist:** `/en/integracje/page/:page/` and `/en/integracje/page/:page/filtr/` — the EN path is `/en/activities/...`

**Do not just add the missing routes.** Settle which layer is authoritative first, keep one mechanism, and delete the other — a hand-maintained route list is exactly how this broke, and it will rot again.

### Also in scope for this change

- `apps/astro/src/components/ui/Pagination.astro:37` — `isFiltered` tests `currentPath.includes('/filtr')` and never matches the EN `/filter` spelling, so pagination on EN filtered listings drops back to non-filter paths. Fails safe today (creates no crawl-trap URLs), but is wrong and belongs with the EN routing fix.
- Verify whether event-spaces search works once caching is fixed. Its search is a GROQ `name match $searchPattern` filter (`components/event-spaces/Listing.astro:95`, wired at `:111`), not embeddings — so it is a different mechanism from the `fetchEmbeddings` bug that [[filter-crawl-trap]] fixes, and was untestable while every response came from cache.

### Coordination

- [[filter-crawl-trap]] deliberately does **not** touch `vercel.json` or `astro.config.ts` to avoid colliding with this change.
- ⚠️ Sequencing: fixing the caching makes every filter route uncached, which *increases* Googlebot cost. Ideally land [[filter-crawl-trap]] phase 3 (robots.txt) first, or at least in the same window.
- `context/changes/filter-crawl-trap/verify.sh` (created by that change) is a useful starting point for this one's regression checks.
