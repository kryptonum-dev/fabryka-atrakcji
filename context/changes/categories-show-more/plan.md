# Replace Pagination with Show More/Less on Activity Categories Listing

## Overview

Replace URL-based pagination (8 items per page across multiple routes) with a client-side "Show More" / "Show Less" button on the activity categories listing page (`/pl/integracje/`, `/en/activities/`). All categories are fetched server-side and rendered in HTML; items beyond the initial 2 rows are hidden via height-based peek with gradient overlay and revealed incrementally. This mirrors the approach already implemented for activity listings (`activities-show-more`). Also cleans up dead pagination code in CategoriesPage search mode and removes the orphaned `data-page-path` attribute.

## Current State Analysis

The categories listing page uses server-side pagination with `ITEMS_PER_PAGE = 8`. The GROQ query in `Listing_Query` slices results with `[$PAGINATION_BEFORE...$PAGINATION_AFTER]`. Paginated URLs (`/strona/2/`, `/page/2/`) are separate Astro routes with their own `getStaticPaths`. Filter variants (`/filtr`, `/filter`) are SSR routes used only for search mode — when searching, the page switches to `ActivitiesListing` which already has show-more.

### Key Discoveries:

- `CategoriesPage.astro:26` — `ITEMS_PER_PAGE = 8` constant drives pagination math
- `CategoriesPage.astro:84-85` — `PAGINATION_BEFORE` and `PAGINATION_AFTER` computed from page number
- `Listing.astro:51` (activites/) — GROQ slice `[$PAGINATION_BEFORE...$PAGINATION_AFTER]` limits results
- `CategoriesPage.astro:169-181` — `staticPaths()` generates routes for pages 2+
- `CategoriesPage.astro:230-231` — `rel="prev"`/`rel="next"` links in `<head>`
- `Listing.astro:81-87` (activites/) — `<Pagination>` component renders page navigation
- `Listing.astro:114-145` (activites/) — Grid: 4 columns, 3 (≤68.0625rem), 2 (≤52.4375rem), 1 (≤27.4375rem)
- `Listing.astro:59` (activites/) — `data-page-path` is dead code (filter script no longer reads it)
- `CategoriesPage.astro:13` — `ACTIVITIES_PER_PAGE = 16` is dead (search mode's `GlobalListing_Query` doesn't use pagination slice)
- `CategoriesPage.astro:124` — Search mode uses `GlobalListing_Query` which returns all activities (no slice)
- Data volume is small (~15-30 categories) — safe to load all at once
- Existing show-more pattern in `category/Listing.astro:1162-1289` — height-based peek + gradient overlay to reuse

## Desired End State

After this plan is complete:

1. Activity categories listing pages render ALL categories for the language in a single page
2. Initially 2 rows of items are visible (8 on desktop, 6/4/2 on smaller screens)
3. "Show More" reveals 4 additional rows per click; "Show Less" resets to 2 rows and smooth-scrolls to the listing top
4. The button, row logic, and column detection respond to viewport resizes via ResizeObserver
5. Height-based peek with gradient overlay shows a hint of the next row (matching activities listing pattern)
6. The "Show More" button has `aria-expanded` for screen readers
7. Old paginated URLs (`/strona/[page]/`, `/page/[page]/`) return 301 redirects to the base categories page
8. Sitemap no longer includes paginated categories listing URLs
9. Dead `data-page-path` attribute removed from categories Listing component
10. Dead search pagination code cleaned up from CategoriesPage template

### Verification:

- Visit `/pl/integracje/` with 10+ categories: initially see 2 rows, click "Show More", click "Show Less" to reset
- Resize browser across all breakpoints — column count and visible items adjust correctly
- Navigate to `/pl/integracje/strona/2/` — get 301 redirected to `/pl/integracje/`
- Search on the categories page — search mode works as before (uses ActivitiesListing with its own show-more)
- Check sitemap XML — no `/strona/` or `/page/` entries for categories listing

## What We're NOT Doing

- Changing search mode behavior (search still navigates to `/filtr` route and renders ActivitiesListing)
- Touching pagination on hotels, event spaces, blog, or case studies
- Removing the `Pagination.astro` component (still used by other listings)
- Adding client-side sorting or filtering for categories
- Reflecting expansion state in the URL (ephemeral)

## Implementation Approach

Three phases ordered by dependency: data changes first (fetch all items + cleanup), then UI (show/hide logic), then redirects and sitemap cleanup. Each phase is independently deployable. The show-more JS/CSS pattern is ported directly from `category/Listing.astro`.

---

## Phase 1: Data & Template Changes

### Overview

Remove the GROQ pagination slice so the query returns all categories. Remove pagination math, `rel="prev"`/`rel="next"`, the `staticPaths` export, and dead search pagination code from the CategoriesPage template. The listing still renders with `<Pagination>` in this phase (it will show "1 of 1" or not render since all items fit on "page 1").

### Changes Required:

#### 1. Remove pagination slice from GROQ query

**File**: `apps/astro/src/components/activites/Listing.astro`

**Intent**: Remove the `[$PAGINATION_BEFORE...$PAGINATION_AFTER]` slice from the `listing` field in `Listing_Query` so the query returns all matching categories. Remove the `ITEMS_PER_PAGE` import since it's no longer needed.

**Contract**: The `Listing_Query` export (line 43) drops the slice from line 51. The `totalItems` count query remains (used for the "Found X categories" semantic, though it could be derived from listing.length). Remove `import { ITEMS_PER_PAGE } from '@/src/templates/activities/CategoriesPage.astro'` (line 3).

#### 2. Remove pagination math from CategoriesPage template

**File**: `apps/astro/src/templates/activities/CategoriesPage.astro`

**Intent**: Stop computing `PAGINATION_BEFORE`/`PAGINATION_AFTER`, remove `ITEMS_PER_PAGE` and `ACTIVITIES_PER_PAGE` constants, remove `staticPaths()` function, remove `rel="prev"`/`rel="next"` head links, and remove the "Page N" breadcrumb/title suffix. Also clean up the dead search pagination math.

**Contract**:
- Remove `ITEMS_PER_PAGE` export (line 26) and `ACTIVITIES_PER_PAGE` constant (line 13)
- In `fetchData()`: remove `PAGINATION_BEFORE` and `PAGINATION_AFTER` computation (lines 84-85) and their GROQ params (lines 150-151). The remaining params (`language`, `minParticipants`, etc.) stay unchanged.
- Remove `staticPaths()` function (lines 169-181) and its export
- Remove `totalPages` computation (lines 223-225)
- Remove `rel="prev"`/`rel="next"` head links (lines 230-231)
- Remove `getPaginationUrl` function (lines 200-202)
- Remove the `currentPage > 1` breadcrumb segment (line 206) and "Page N" title suffix (line 192)
- The `currentPage` prop is no longer meaningful — simplify to always be 1 or remove from the Props type. Since the Listing component and filter routes still reference it, simplest approach is to always pass `currentPage={1}`.
- The `searchQuery` conditional in GROQ query selection (line 124) remains — search mode still uses `GlobalListing_Query`

#### 3. Update base category routes

**Files**:
- `apps/astro/src/pages/pl/integracje/index.astro`
- `apps/astro/src/pages/en/activities/index.astro`

**Intent**: These files call `fetchData` with `page = 1` — no logic changes needed. Just verify they compile after the template changes.

**Contract**: Confirm these files compile after the `ITEMS_PER_PAGE` and `staticPaths` removal.

#### 4. Update filter routes

**Files**:
- `apps/astro/src/pages/pl/integracje/filtr.astro`
- `apps/astro/src/pages/en/activities/filter.astro`

**Intent**: These already pass `page = 1` and `searchParams`. Verify they compile after the pagination removal. The `fetchData` call still works since search mode uses `GlobalListing_Query` which never used the pagination slice.

**Contract**: Confirm these files compile and function correctly.

### Success Criteria:

#### Automated Verification:

- TypeScript compiles: `npm run build` in `apps/astro`
- Linting passes: `npm run lint`

#### Manual Verification:

- Categories page loads and shows ALL categories (not just 8)
- The Pagination component either shows "1 of 1" or doesn't render
- Search mode still works — type a search query, verify activities results load
- Filter routes work — navigate to `/pl/integracje/filtr?search=test`, verify it loads

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 2: Show More/Less UI & Logic

### Overview

Replace the `<Pagination>` component in `Listing.astro` (activites/) with a "Show More" / "Show Less" button and a vanilla JS `<script>` that manages visibility using the height-based peek + gradient overlay pattern from `category/Listing.astro`. Uses ResizeObserver for responsive column detection.

### Changes Required:

#### 1. Replace Pagination with Show More/Less button markup

**File**: `apps/astro/src/components/activites/Listing.astro`

**Intent**: Remove the `<Pagination>` component import and usage. Add a `.list-container` wrapper around the `.list` grid (to control height/overflow). After the container, add a show-more button section with the `Button` component (`theme="secondary"` `shade="dark"`). Add PL/EN translations for button labels.

**Contract**:
- Remove `Pagination` import (line 5) and `ITEMS_PER_PAGE` import (line 3)
- Remove `<Pagination ... />` block (lines 81-87)
- Wrap the `.list` div (line 66) in a `.list-container` div with a `data-peek` attribute when `listing.length > 8`
- Add a `.show-more-wrapper` div after `.list-container` containing the `Button` component
- Button has: `data-show-more={t.showMore}`, `data-show-less={t.showLess}`, `aria-expanded="false"`, `className="show-more-toggle"`
- Add to translations: `showMore: "Pokaż więcej"` / `"Show more"`, `showLess: "Pokaż mniej"` / `"Show less"`
- Remove `currentPage` from Props type — no longer needed
- Remove `totalItems` from Props type — no longer needed for pagination (the listing array has the full count)

#### 2. Add show-more/less vanilla JS script

**File**: `apps/astro/src/components/activites/Listing.astro` (inline `<script>` block)

**Intent**: Port the show-more JS from `category/Listing.astro:1162-1289`. The script handles: detecting grid columns via `getComputedStyle`, computing visible rows, toggling container max-height with peek, swapping button text, updating `aria-expanded`, smooth-scrolling on collapse, and responding to viewport resizes via `ResizeObserver`.

**Contract**:
- Port the exact pattern from `category/Listing.astro:1162-1289` with these selectors adapted:
  - Section: `.Listing` (same class name, different component)
  - Container: `.list-container`
  - List: `.list`
  - Cards: `.CategoryBlock` elements (not `article[data-activity-card]`)
  - Wrapper: `.show-more-wrapper`
  - Button: `.show-more-toggle`
- Constants: `INITIAL_ROWS = 2`, `INITIAL_ROWS_SINGLE_COL = 4`, `ROWS_PER_EXPANSION = 4`, `PEEK_HEIGHT = 120`
- Same height-based visibility logic: `getHeightForRows()`, peek amount, gradient overlay via `data-peek` attribute
- Same ResizeObserver pattern with transition suppression during resize
- Same `data-js-ready` initialization pattern

#### 3. Add CSS for list-container and show-more button

**File**: `apps/astro/src/components/activites/Listing.astro` (in the `<style>` block)

**Intent**: Port the `.list-container` and `.show-more-wrapper` styles from `category/Listing.astro:859-923`. This includes the overflow/max-height transition, the gradient overlay pseudo-element, and the peek state styling.

**Contract**:
- Add `.list-container` styles: `position: relative; overflow: hidden; transition: max-height 600ms var(--easing)`
- Add `.is-peek-initial:not([data-js-ready])` fallback with appropriate max-height for SSR
- Add `::after` pseudo-element for gradient overlay: `linear-gradient(to bottom, transparent, var(--neutral-100, #faf5f3))`
- Add `[data-peek='true']::after { opacity: 1 }` to show gradient when peeking
- Add `.show-more-wrapper` styles: centered, with negative margin-top when `data-peek='true'`
- Remove the `:global(.Pagination)` margin-top style (line 120-122) since Pagination is removed

### Success Criteria:

#### Automated Verification:

- TypeScript compiles: `npm run build`
- Linting passes: `npm run lint`

#### Manual Verification:

- Categories page shows 2 rows initially (8 items on desktop)
- Gradient overlay visible at the bottom, hinting at more content
- "Show More" reveals 4 more rows with smooth height transition
- When all items visible, button switches to "Show Less"
- "Show Less" collapses to 2 rows and smooth-scrolls to listing top
- Resize browser: column count changes, visible items adjust (e.g., 4→3 columns recalculates correctly)
- On mobile (1 column): initial 4 items visible (INITIAL_ROWS_SINGLE_COL), then +4 per click
- Button hidden when all categories fit in initial rows
- `aria-expanded` toggles correctly
- Search mode still works (navigates to `/filtr`, ActivitiesListing renders independently)

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 3: Redirects, Sitemap & Dead Code Cleanup

### Overview

Convert the 4 paginated route files to 301 redirects pointing to the base categories URL. Remove paginated categories entries from the sitemap. Remove the dead `data-page-path` attribute and `pagePath` translations from the Listing component.

### Changes Required:

#### 1. Convert PL paginated route to 301 redirect

**File**: `apps/astro/src/pages/pl/integracje/strona/[page].astro`

**Intent**: Replace the full page render with a 301 redirect to the base categories URL.

**Contract**: The file becomes an SSR route (`prerender = false`) that returns `Astro.redirect('/pl/integracje/', 301)`. Remove all imports of `ActivitiesListing`, `fetchData`, `staticPaths`.

#### 2. Convert PL paginated filter route to 301 redirect

**File**: `apps/astro/src/pages/pl/integracje/strona/[page]/filtr.astro`

**Intent**: Redirect to the base categories filter URL, preserving query params.

**Contract**: SSR route (`prerender = false` — already is). Constructs redirect URL `/pl/integracje/filtr` and appends existing search params. Returns `Astro.redirect(url, 301)`.

#### 3. Convert EN paginated route to 301 redirect

**File**: `apps/astro/src/pages/en/activities/page/[page].astro`

**Intent**: Same pattern as PL — 301 redirect to `/en/activities/`.

**Contract**: SSR route, returns 301 redirect to base categories URL.

#### 4. Convert EN paginated filter route to 301 redirect

**File**: `apps/astro/src/pages/en/activities/page/[page]/filter.astro`

**Intent**: Same pattern — 301 redirect to `/en/activities/filter/` with query params preserved.

**Contract**: SSR route, constructs redirect URL with search params, returns 301 redirect.

#### 5. Remove paginated entries from sitemap

**File**: `apps/astro/src/pages/sitemap-index.xml.ts`

**Intent**: Remove the `activitiesStaticPaths` import and the two blocks (PL: lines 149-150, EN: lines 158-159) that add paginated categories listing URLs to the sitemap.

**Contract**:
- Remove `const { staticPaths: activitiesStaticPaths } = await import(...)` (line 45)
- Remove the PL block (lines 149-150) that pushes `/pl/integracje/strona/${params.page}/`
- Remove the EN block (lines 158-159) that pushes `/en/activities/page/${params.page}/`
- The `activitiesStaticPathsCategory` import and its usage (individual category URLs) remain untouched

#### 6. Remove dead data-page-path and pagePath from Listing

**File**: `apps/astro/src/components/activites/Listing.astro`

**Intent**: Remove the `data-page-path={t.pagePath}` attribute from the `<section>` element and the `pagePath` entries from the translations object.

**Contract**: Remove `data-page-path={t.pagePath}` from line 59. Remove `pagePath: 'strona'` (line 24) and `pagePath: 'page'` (line 33) from translations.

### Success Criteria:

#### Automated Verification:

- TypeScript compiles: `npm run build`
- Linting passes: `npm run lint`
- No import errors: `grep -r "activitiesStaticPaths\b" apps/astro/src/` returns only category-related imports (not the removed pages one)

#### Manual Verification:

- Visit `/pl/integracje/strona/2/` — get 301 redirected to `/pl/integracje/`
- Visit `/en/activities/page/2/` — get 301 redirected to `/en/activities/`
- Visit paginated filter URL with query params — redirected to base filter URL with params preserved
- Check sitemap XML output — no `/strona/` or `/page/` entries for categories listing (categories entries like `/pl/integracje/kategoria/team-building` still present)
- Verify other sitemap entries (blog, hotels, case studies, individual activity categories) are unaffected

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding.

---

## Testing Strategy

### Integration Tests:

- Full build (`npm run build`) passes without errors after each phase
- All lint rules pass

### Manual Testing Steps:

1. Visit categories page with many categories (10+) — verify show more/less cycle
2. Visit categories page with few categories (≤8) — verify button is hidden
3. Resize browser through all 4 breakpoints — verify column/row recalculation
4. Use search bar → verify search mode works (activities listing with its own show-more)
5. Visit old paginated URLs → verify 301 redirects
6. Check sitemap XML → verify no paginated categories entries
7. Test in both PL and EN
8. Test on mobile device — verify touch interaction, scroll behavior
9. Screen reader test — verify `aria-expanded` announces correctly

## Performance Considerations

- **HTML payload**: With ~20-30 categories at ~1-2 KB each (small cards with circular images), the listing HTML grows by ~30-40 KB vs 8 items. Gzipped delta is ~2-3 KB — negligible.
- **DOM nodes**: ~300-600 nodes for the listing grid (30 cards × ~10-20 nodes each). Total page DOM stays well under Lighthouse thresholds.
- **Image loading**: Categories listing uses `loading="eager"` for all images (line 73) — with only ~20-30 items, this is acceptable. If categories grow significantly, consider switching to `loading="lazy"` after the initial visible rows.
- **GROQ query**: Removing the slice adds minimal overhead — returning 30 vs 8 category documents is negligible.

## Migration Notes

- Old paginated URLs will continue to work via 301 redirects — no broken bookmarks or Google results.
- The `Pagination.astro` component is NOT deleted — it's still used by hotels, event spaces, blog, and case studies.
- The `ITEMS_PER_PAGE` export from `CategoriesPage.astro` is removed — verify no other file imports it (only `Listing.astro` does, and that import is also removed in Phase 1).

## References

- Archived activities-show-more plan: `context/archive/activities-show-more/plan.md`
- Existing show-more pattern: `apps/astro/src/components/activites/category/Listing.astro:1162-1289` (JS), `:859-923` (CSS)
- Categories listing component: `apps/astro/src/components/activites/Listing.astro`
- CategoriesPage template: `apps/astro/src/templates/activities/CategoriesPage.astro`
- Grid breakpoints: `apps/astro/src/components/activites/Listing.astro:114-145`
- Sitemap generator: `apps/astro/src/pages/sitemap-index.xml.ts`
- CategoryBlock component: `apps/astro/src/components/ui/CategoryBlock.astro`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Data & Template Changes

#### Automated

- [x] 1.1 TypeScript compiles: `npm run build` in `apps/astro` — e3b49bf
- [x] 1.2 Linting passes: `npm run lint` — e3b49bf

#### Manual

- [x] 1.3 Categories page shows ALL categories (not just 8) — e3b49bf
- [x] 1.4 Search mode still works — activities results load on search — e3b49bf
- [x] 1.5 Filter routes still function correctly — e3b49bf

### Phase 2: Show More/Less UI & Logic

#### Automated

- [x] 2.1 TypeScript compiles: `npm run build` — af685fa
- [x] 2.2 Linting passes: `npm run lint` — af685fa

#### Manual

- [x] 2.3 2 rows visible initially with gradient peek, Show More reveals 4 more rows — af685fa
- [x] 2.4 Show Less collapses to 2 rows and smooth-scrolls to listing top — af685fa
- [x] 2.5 Resize across all breakpoints — items recalculate correctly — af685fa
- [x] 2.6 Button hidden when all items fit in initial rows — af685fa
- [x] 2.7 aria-expanded toggles correctly — af685fa
- [x] 2.8 Search mode unaffected — navigates to /filtr independently — af685fa

### Phase 3: Redirects, Sitemap & Dead Code Cleanup

#### Automated

- [x] 3.1 TypeScript compiles: `npm run build` — f56d5f2
- [x] 3.2 Linting passes: `npm run lint` — f56d5f2
- [x] 3.3 No stale references to `activitiesStaticPaths` (pages import) remain — f56d5f2

#### Manual

- [x] 3.4 Paginated URLs return 301 redirects to base categories page — f56d5f2
- [x] 3.5 Paginated filter URLs redirect with query params preserved — f56d5f2
- [x] 3.6 Sitemap XML has no paginated categories listing entries — f56d5f2
- [x] 3.7 Other listing pagination (blog, hotels, individual categories) unaffected — f56d5f2
