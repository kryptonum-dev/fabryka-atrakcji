---
date: 2026-05-27T12:00:00+02:00
researcher: Claude Code
git_commit: 9d70434282722ca02ea955a736331158f0bf6a12
branch: main
repository: fabryka-atrakcji
topic: "Replace pagination with show more/less on activity category listings"
tags: [research, codebase, activities, pagination, show-more, listing]
status: complete
last_updated: 2026-05-27
last_updated_by: Claude Code
---

# Research: Replace Pagination with Show More/Less on Activity Category Listings

**Date**: 2026-05-27  
**Researcher**: Claude Code  
**Git Commit**: 9d70434  
**Branch**: main  
**Repository**: fabryka-atrakcji

## Research Question

Replace traditional pagination (16 items/page, URL-based navigation) with a "Show More" / "Show Less" button on `/integracje/kategoria/[x]` activity listing pages. The behavior should be responsive to the current grid columns (2 actual rows initially, 4 rows per expansion). Applies to both static and filter (`/filtr`) routes, in both PL and EN.

## Summary

The current system uses server-side pagination with 16 items per page, split across static prerendered routes and SSR filter routes. Replacing this with client-side show more/less is feasible because:

1. **Data volume is small** — B2B corporate events platform, likely 20-60 activities per category (max ~80-100). Loading all at once is safe.
2. **Existing patterns** — The codebase already has a Preact-based show more/less in `TestimonialsPopup/Testimonials.tsx` with `visibleCount` state and `slice()`.
3. **Clean separation** — All 8 paginated route files (PL+EN, static+filter) use the same `ActivitiesPage.astro` template, so changes concentrate in 3 core files.
4. **SEO manageable** — Paginated URLs are indexed and in sitemap, but can be handled with redirect stubs and sitemap cleanup.

The recommended approach: fetch all items server-side (remove GROQ slice), render all cards in HTML with items beyond the initial rows hidden via CSS, and use a vanilla JS script (following the `data-expanded` pattern from `TableOfContent.astro`) to handle show/hide toggling responsively.

## Detailed Findings

### 1. Current Pagination Architecture

**Constants:**
- `ITEMS_PER_PAGE = 16` — defined in `apps/astro/src/templates/activities/ActivitiesPage.astro:21`

**Data fetching:**
- `fetchData()` in `ActivitiesPage.astro:38-202` computes `PAGINATION_BEFORE` and `PAGINATION_AFTER` and passes them to the Sanity GROQ query
- The GROQ query in `Listing_Query()` (`components/activites/category/Listing.astro:261-269`) slices results: `[$PAGINATION_BEFORE...$PAGINATION_AFTER]`
- `totalActivitiesByCategory` is fetched separately (line 216) for pagination math

**Route structure (per language):**

| Route | Type | File (PL) |
|-------|------|-----------|
| `/kategoria/[category]` | Static (ISR) | `pages/pl/integracje/kategoria/[category].astro` |
| `/kategoria/[category]/strona/[page]` | Static (ISR) | `pages/pl/integracje/kategoria/[category]/strona/[page].astro` |
| `/kategoria/[category]/filtr` | SSR | `pages/pl/integracje/kategoria/[category]/filtr.astro` |
| `/kategoria/[category]/strona/[page]/filtr` | SSR | `pages/pl/integracje/kategoria/[category]/strona/[page]/filtr.astro` |

English mirrors at `/en/activities/category/...` with `page`/`filter` instead of `strona`/`filtr`.

**Rendering:**
- `ActivitiesPage.astro` renders the `<Listing>` component with `currentPage` prop
- `Listing.astro` renders a `.list` grid with `ActivityCard` components and appends a `<Pagination>` component
- Grid CSS: 4 columns (desktop), 3 columns (≤63.9375rem), 2 columns (≤49.3125rem), 1 column (≤27.4375rem)

**SEO:**
- `rel="prev"` / `rel="next"` in `<head>` (`ActivitiesPage.astro:321-324`)
- Filter routes have `doNotIndex={true}` and canonical URLs to static pages
- Paginated pages ARE indexed and included in sitemap (`sitemap-index.xml.ts:158-164`, `175-180`)
- `staticPathsCategoryPage()` generates routes for pages 2+ (`ActivitiesPage.astro:222-244`)

### 2. Grid Responsiveness (Columns per Breakpoint)

From `components/activites/category/Listing.astro` CSS:

| Breakpoint | Columns | 2 rows = items | 4 rows = items |
|------------|---------|----------------|----------------|
| Default (desktop) | 4 | 8 | 16 |
| ≤63.9375rem | 3 | 6 | 12 |
| ≤49.3125rem | 2 | 4 | 8 |
| ≤27.4375rem | 1 | 2 | 4 |

### 3. Existing Show More/Less Patterns

**Pattern A: TableOfContent.astro (vanilla JS)**
- File: `components/ui/TableOfContent.astro`
- Uses `data-expanded="true|false"` attribute on wrapper
- CSS hides items 4+ when `[data-expanded='false']` on mobile
- Button toggles `wrapper.dataset.expanded` and updates text ("Pokaż więcej" / "Pokaż mniej")
- Simple, no framework dependency

**Pattern B: TestimonialsPopup/Testimonials.tsx (Preact island)**
- File: `components/ui/TestimonialsPopup/Testimonials.tsx:19-44`
- Uses `useState(10)` for `visibleCount`
- `showMore` increments by 10: `setVisibleCount(prev => Math.min(prev + 10, testimonials.length))`
- `showLess` resets to 10 and scrolls to top
- Renders `testimonials.slice(0, visibleCount)`
- Conditional "Show Less" button when `visibleCount > 10`

### 4. Data Volume Assessment

- No seed data or fixtures in the repo — category sizes aren't hardcoded
- `ITEMS_PER_PAGE = 16` and the Pagination component's `FEW_PAGES` case (`totalPages <= 5`) suggest categories rarely exceed 80 items
- B2B corporate events domain naturally limits catalog size
- ActivityCard payload is moderate (name, image, description, pricing, participants, slug)
- Images already lazy-loaded after index 8 (`Listing.astro:514`)
- **Verdict: loading all items at once is safe**

### 5. Filter System Integration

The filter system (`init-listing-filters.ts`) uses the mobile sidebar's "Apply" button to construct a URL and `window.location.href = finalUrl` for a full page navigation to the `/filtr` route. This means:

- Filters cause a full page reload → the show more/less state resets (expected behavior)
- The desktop dropdown filters (`Dropdown.astro`) also navigate to filter URLs via `<a href>` links
- The sorting dropdown also triggers navigation
- **No conflict** — show more/less is purely a client-side visibility concern within a single page load

## Code References

### Files that need modification:

1. `apps/astro/src/templates/activities/ActivitiesPage.astro` — Remove pagination math, fetch all items, remove `rel="prev/next"`, remove `staticPathsCategoryPage`
2. `apps/astro/src/components/activites/category/Listing.astro` — Replace `<Pagination>` with show more/less button, add client-side JS for responsive row toggling
3. `apps/astro/src/pages/sitemap-index.xml.ts:158-164, 175-180` — Remove paginated category page entries

### Files to delete or convert to redirects:

4. `apps/astro/src/pages/pl/integracje/kategoria/[category]/strona/[page].astro` — Convert to 301 redirect
5. `apps/astro/src/pages/pl/integracje/kategoria/[category]/strona/[page]/filtr.astro` — Convert to 301 redirect
6. `apps/astro/src/pages/en/activities/category/[category]/page/[page].astro` — Convert to 301 redirect
7. `apps/astro/src/pages/en/activities/category/[category]/page/[page]/filter.astro` — Convert to 301 redirect

### Files NOT affected:

- `apps/astro/src/templates/activities/CategoriesPage.astro` — Lists categories, not activities
- `apps/astro/src/components/activites/Listing.astro` — Category block listing (not activity cards)
- `apps/astro/src/components/ui/Pagination.astro` — Shared component, still used elsewhere (hotels, event spaces, blog, case studies)
- Hotels/event-spaces listing pages — Separate templates, keep their pagination
- Base `/integracje` and `/activities` routes — Use CategoriesPage template

## Architecture Insights

### Recommended approach: Vanilla JS with CSS-driven visibility

**Why not a Preact island?**
- The `Listing.astro` component is an Astro component, not a Preact one
- Converting to Preact would require converting `ActivityCard`, `Dropdown`, `Pagination`, and all filter machinery
- The listing already uses vanilla JS for filter sidebar toggling (`init-listing-filters.ts`)
- The `data-expanded` pattern from `TableOfContent.astro` is simpler and consistent with the codebase

**Implementation strategy:**

1. **Server side**: Remove the GROQ `[$PAGINATION_BEFORE...$PAGINATION_AFTER]` slice. Fetch ALL activities. Pass all items to the template.

2. **HTML**: Render ALL `ActivityCard` components in the `.list` grid. Add `data-index={index}` to each card. Add a show-more/show-less button section after the grid.

3. **CSS**: Initially hide cards beyond the first 2 rows using `nth-child` selectors or a `data-visible-count` attribute on the `.list` wrapper. The responsive breakpoints already define columns — the CSS can use `nth-child` thresholds per breakpoint.

4. **Client JS** (new script or extension of `init-listing-filters.ts`):
   - Read current grid columns via `getComputedStyle` or `ResizeObserver`
   - Track `visibleRows` state (starts at 2)
   - "Show More" adds 4 rows → updates a CSS custom property or data attribute
   - "Show Less" resets to 2 rows → scrolls back to listing top
   - On resize: recalculate columns and adjust visible items

5. **Key detail**: Use a CSS custom property `--visible-items` on `.list` and hide items with `> nth-child(var(--visible-items))`. Or simpler: set `data-visible-items="N"` on the list and use `article:nth-child(n+N+1) { display: none }` — but `nth-child` can't use variables. Best approach: set `style="--visible-items: N"` and in JS toggle `display: none` on items beyond the threshold.

**Simplest implementation:**
- JS sets `display: none` on ActivityCard wrappers beyond visible count
- Visible count = columns × visibleRows
- Show More: visibleRows += 4, recalculate
- Show Less: visibleRows = 2, recalculate, scroll to listing top
- ResizeObserver recalculates columns and adjusts visibility

### Pagination URL redirects

Keep the paginated route files but convert them to 301 redirects:

```astro
---
export const prerender = false
const category = Astro.params.category as string
return Astro.redirect(`/pl/integracje/kategoria/${category}/`, 301)
---
```

This handles any bookmarked or Google-indexed pagination URLs without 404s.

### Image loading optimization

Currently: `loading={index < 8 ? 'eager' : 'lazy'}` (Listing.astro:514).
With all items rendered: keep the same logic. Items beyond the initial visible rows are `display: none` but still have `loading="lazy"` — browsers won't fetch lazy images that are hidden. When items become visible (show more), lazy loading kicks in naturally.

### Sorting dropdown consideration

The sorting dropdown (`Dropdown isSortingDropdown`) currently triggers URL navigation. With all items loaded, sorting COULD be done client-side. However, this is out of scope — the sort still navigates to the `/filtr` route, which re-fetches from Sanity with the new order. This is fine.

## Open Questions

1. **Button design**: What should the "Show More" / "Show Less" buttons look like? Follow existing `Button` component theming (`theme="primary" shade="dark"`)? Or a simpler link-style button?

2. **Animation**: Should items appear with a transition/animation when revealed, or instant show/hide?

3. **Scroll behavior on "Show Less"**: Scroll to top of listing section, or to the first card, or no scroll?

4. **URL state**: Should the current expansion state be reflected in the URL (e.g., `#show=32`) for shareability, or is it purely ephemeral? (Recommend: ephemeral — no URL state needed.)

5. **Category page ISR**: Currently the static category page fetches 16 items and caches via ISR. After the change, it fetches ALL items. This slightly increases the ISR payload size but should be negligible for <100 items.
