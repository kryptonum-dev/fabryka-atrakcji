# Replace Pagination with Show More/Less on Categories Listing — Plan Brief

> Full plan: `context/changes/categories-show-more/plan.md`

## What & Why

Replace URL-based pagination (8 items per page across multiple routes) with a client-side "Show More" / "Show Less" button on the activity categories listing pages (`/pl/integracje/`, `/en/activities/`). This mirrors the approach already implemented for activity listings (`activities-show-more`), bringing visual and behavioral consistency across both listing types. Also cleans up dead pagination code in the search-mode path and removes the orphaned `data-page-path` attribute.

## Starting Point

Categories listing uses `ITEMS_PER_PAGE = 8`, GROQ query slicing, paginated route files (4 per language variant), `rel="prev"`/`rel="next"` head links, and sitemap entries for each paginated page. Grid is responsive: 4 → 3 → 2 → 1 columns. Search mode switches to `ActivitiesListing` which already has show-more. The show-more pattern (height-based peek + gradient overlay) is already proven in `category/Listing.astro`.

## Desired End State

All categories load on a single page. Users see 2 rows initially and expand in 4-row increments via a "Show More" button with gradient peek hinting at more content. "Show Less" collapses back to 2 rows and smooth-scrolls to the listing top. Old paginated URLs 301-redirect to the base categories page. The sitemap is cleaned up. Dead code (`data-page-path`, search pagination math) is removed.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) |
|----------|--------|-------------------|
| Reveal mechanism | Height-based peek + gradient overlay | Visual consistency with the activities listing show-more pattern |
| Initial rows / expansion | 2 rows initial, +4 rows per click | Matches activities listing pattern; 2×4=8 initial on desktop matches old ITEMS_PER_PAGE |
| Paginated filter routes | Redirect all (regular + filter) | Clean URL structure, no orphaned routes |
| Dead search pagination | Clean up | ACTIVITIES_PER_PAGE and PAGINATION params are dead code — GlobalListing_Query doesn't use them |
| data-page-path | Remove | Dead attribute — filter script no longer reads it |

## Scope

**In scope:**
- Fetch all categories server-side (remove GROQ slice)
- Show More/Less button with responsive row logic and gradient peek
- 301 redirects for all 4 paginated route files (PL+EN, regular+filter)
- Sitemap cleanup (remove paginated categories entries)
- Dead code cleanup (data-page-path, search pagination math)
- Accessibility (`aria-expanded`)

**Out of scope:**
- Search mode behavior (already has show-more via ActivitiesListing)
- Other listing types (hotels, blog, case studies, event spaces)
- Removing `Pagination.astro` component (still used elsewhere)
- Client-side sorting or filtering for categories
- URL state for expansion

## Architecture / Approach

Server fetches all categories (remove GROQ slice) → Astro renders all CategoryBlock cards into HTML → vanilla JS on the client constrains the `.list-container` max-height to show 2 rows with a gradient peek → "Show More" increases max-height by 4 rows → ResizeObserver recalculates on viewport change. Old paginated routes become 301 redirect stubs. Pattern is a direct port from `category/Listing.astro`.

## Phases at a Glance

| Phase | What it delivers | Key risk |
|-------|------------------|----------|
| 1. Data & Template Changes | All categories fetched, pagination math removed | GROQ param removal must coordinate with query slice removal |
| 2. Show More/Less UI & Logic | Interactive button with gradient peek and responsive column detection | Porting the JS/CSS pattern to a different grid with different breakpoints |
| 3. Redirects, Sitemap & Dead Code | 301 redirects, clean sitemap, dead code removed | Must verify no other file imports `staticPaths` or `ITEMS_PER_PAGE` from CategoriesPage |

**Prerequisites:** None — the categories listing is independent of other active changes.

**Estimated effort:** ~1.5-2 hours across 3 phases in a single session.

## Open Risks & Assumptions

- Assumes max ~30-40 categories per language. If categories grow past 100, the HTML payload and image eager-loading strategy should be re-evaluated.
- The gradient overlay background color (`var(--neutral-100, #faf5f3)`) must match the page background — verify visually.

## Success Criteria (Summary)

- Categories pages show all categories with working Show More/Less toggle across all breakpoints
- Old paginated URLs 301-redirect to base categories page (verifiable in browser)
- Sitemap XML contains no paginated categories listing entries
