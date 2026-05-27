# Replace Pagination with Show More/Less — Plan Brief

> Full plan: `context/changes/activities-show-more/plan.md`
> Research: `context/changes/activities-show-more/research.md`

## What & Why

Replace URL-based pagination (16 items per page across multiple routes) with a client-side "Show More" / "Show Less" button on activity category listing pages. Simplifies navigation, removes multi-page routes, and consolidates all category content under a single URL — better UX for B2B buyers browsing activities and marginally better SEO through URL consolidation.

## Starting Point

Activity categories use server-side pagination: `ITEMS_PER_PAGE = 16`, GROQ query slicing, 4 paginated route files per language (static + filter), `rel="prev"`/`rel="next"` head links, and sitemap entries for each paginated page. Grid is responsive: 4 → 3 → 2 → 1 columns across breakpoints.

## Desired End State

All activities load on a single page. Users see 2 rows initially and expand in 4-row increments via a "Show More" button. "Show Less" collapses back to 2 rows and smooth-scrolls to the listing top. Old paginated URLs 301-redirect to the base category page. The sitemap is cleaned up.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
|----------|--------|-------------------|--------|
| Visibility mechanism | `display: none` via JS | SEO cost is negligible — all content is in HTML, and Google still discovers all links | Research |
| JS approach | Vanilla JS with `data-expanded` pattern | Matches existing `TableOfContent.astro` pattern; avoids Preact island for pure visibility toggling | Research |
| Initial rows / expansion | 2 rows initial, +4 rows per click | Matches old 16-items-per-page density on desktop (2×4=8 initial, +4×4=16 per click) | Plan |
| Show Less behavior | Reset to initial 2 rows + smooth scroll | Simple mental model; matches `TestimonialsPopup` pattern | Plan |
| Column detection | `getComputedStyle` on grid element | Avoids duplicating CSS breakpoint values in JS — reads actual column count from the grid | Plan |
| Button style | `Button` component, `theme="secondary"` `shade="dark"` | Reuses design system; visually consistent with filter Apply button | Plan |
| SEO redirects | 301 from paginated URLs to base category | Standard, transfers link equity, Google processes within 2-4 weeks | Research |
| Filter script cleanup | Remove page-segment stripping logic | Dead code after paginated routes become redirects | Plan |

## Scope

**In scope:**
- Fetch all items server-side (remove GROQ slice)
- Show More/Less button with responsive row logic
- 301 redirects for all 4 paginated route files (PL+EN)
- Sitemap cleanup (remove paginated category entries + fix existing bug)
- Filter script page-path cleanup
- Accessibility (`aria-expanded`)

**Out of scope:**
- Other listing types (hotels, blog, case studies, event spaces)
- Client-side sorting or filtering
- URL state for expansion (`#show=N`)
- Animation on show/hide
- Removing `Pagination.astro` component

## Architecture / Approach

Server fetches all activities (remove GROQ slice) → Astro renders all cards into HTML → vanilla JS on the client hides cards beyond `columns × 2` rows via `display: none` → "Show More" reveals 4 more rows → ResizeObserver recalculates on viewport change. Old paginated routes become 301 redirect stubs.

## Phases at a Glance

| Phase | What it delivers | Key risk |
|-------|------------------|----------|
| 1. Data & Template Changes | All items fetched, pagination math removed | GROQ param removal must coordinate with query slice removal |
| 2. Show More/Less UI & Logic | Interactive button with responsive column detection | ResizeObserver + column calculation edge cases |
| 3. Redirects & Sitemap Cleanup | 301 redirects, clean sitemap | Must verify no other file imports `staticPathsCategoryPage` |
| 4. Filter Script Cleanup | Dead page-path code removed | Low risk — pure deletion |

**Prerequisites:** Bandwidth optimization Phases 1-2 must be completed first (Image component rewritten to Sanity CDN native). This produces lighter per-card HTML.

**Estimated effort:** ~2-3 hours across 4 phases in a single session.

## Open Risks & Assumptions

- Assumes max ~100 activities per category (B2B domain). If a category exceeds 200+, DOM node count and HTML payload should be re-evaluated.
- `getComputedStyle().gridTemplateColumns` must reliably return column track values across all supported browsers — verified in all modern browsers, but worth a quick check on Safari.

## Success Criteria (Summary)

- Category pages show all activities with working Show More/Less toggle across all breakpoints
- Old paginated URLs 301-redirect to base category (verifiable in browser and Search Console)
- Sitemap XML contains no paginated category entries
