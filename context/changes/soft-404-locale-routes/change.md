---
change_id: soft-404-locale-routes
title: Fix soft 404 — locale-prefixed routes return 200 instead of 404
status: implementing
created: 2026-07-21
updated: 2026-07-21
archived_at: null
---

## Notes

P1 bug reported 20.07.2026, verified live on production (re-verified 21.07.2026).
Source brief: `~/Desktop/bug-soft404-fa.md`.

**Symptom:** every non-existent path under `/pl/*` and `/en/*` returns **HTTP 200** with the
404 page body, plus `<meta name="robots" content="index, follow">` and a canonical pointing at
`/pl/404/` (which itself returns a real 404). Paths without a locale prefix correctly return 404.

**Root cause (confirmed):** all ~60 locale route files handle "not found" with
`Astro.rewrite('/pl/404')` / `Astro.rewrite('/en/404')`. Astro's `#executeRewrite` hard-resets
the response status to 200, and none of the three 404 pages sets `Astro.response.status`.

**Scope agreed with Oliwier (21.07):** points 1–3 of the ticket — HTTP 404 status on locale
routes, `meta robots` → `noindex`, remove canonical from the 404 page. Point 4 (old valuable
URLs → 301) stays in `seo-domkniecie-czerwca`, blocked on Wiktoria's target decisions.

**Scope addition (21.07, agreed with Oliwier):** the Phase 4 pre-deploy gate found 7 sitemap URLs
that currently serve the 404 body at HTTP 200 and would become hard "Submitted URL not found"
errors in GSC the moment this ships. Resolved in the same ship rather than deferred:

- `EventSpaceFeatures_Collection`, `Cart_Page`, `Quote_Page`, `ThankYouPage` added to
  `excludedTypes` in `sitemap-index.xml.ts` — their slugs are filter tokens or belong to orphaned
  documents whose schemas were deleted but whose documents were not.
- `staticPathsCategoryPage` in `BlogPage.astro` / `CaseStudyPage.astro` counted posts with a bare
  `references(^._id)`, which also catches posts that merely *link* to a category and posts in the
  other language. For `/pl/blog/kategoria/imprezy-firmowe/` that meant 107 vs 87 posts → 7
  advertised pages vs 6 real ones. Now counted the same way the page renders.

Net sitemap effect: 492 → 481 URLs, 16 removed (all verified 404 or soft-404), 0 real pages lost.
The orphaned `Cart_Page` / `Quote_Page` / `ThankYouPage` documents still sit in the Content Lake
and could be deleted separately — excluding the types was the non-destructive option.

## Progress

- [x] Research — `research.md`
- [ ] Plan
- [ ] Implement
- [ ] Verify live (curl status + robots meta) and re-crawl
