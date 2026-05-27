# Replace Pagination with Show More/Less on Activity Category Listings

## Overview

Replace URL-based pagination (16 items per page across multiple routes) with a client-side "Show More" / "Show Less" button on activity category listing pages. All items are fetched server-side and rendered in HTML; items beyond the initial 2 rows are hidden via JS and revealed incrementally. Applies to both PL and EN routes, static (ISR) and filter (SSR) variants.

## Current State Analysis

Activity category pages (`/integracje/kategoria/[x]`) use server-side pagination with `ITEMS_PER_PAGE = 16`. The GROQ query slices results with `[$PAGINATION_BEFORE...$PAGINATION_AFTER]`. Paginated URLs (`/strona/2/`, `/strona/3/`) are separate Astro routes with their own `getStaticPaths`. Filter variants (`/filtr`) also support pagination.

### Key Discoveries:

- `ActivitiesPage.astro:21` — `ITEMS_PER_PAGE = 16` constant drives pagination math
- `ActivitiesPage.astro:44-45` — `PAGINATION_BEFORE` and `PAGINATION_AFTER` computed from page number
- `Listing_Query()` at `Listing.astro:261-269` — GROQ slice `[$PAGINATION_BEFORE...$PAGINATION_AFTER]` limits results
- `ActivitiesPage.astro:225-248` — `staticPathsCategoryPage()` generates routes for pages 2+
- `ActivitiesPage.astro:326-327` — `rel="prev"`/`rel="next"` links in `<head>`
- `Listing.astro:520-526` — `<Pagination>` component renders page navigation
- `Listing.astro:697-713` — Grid: 4 columns (desktop), 3 (≤63.9375rem), 2 (≤49.3125rem), 1 (≤27.4375rem)
- `TableOfContent.astro:398-408` — Existing vanilla JS `data-expanded` toggle pattern to follow
- `init-listing-filters.ts:441-443` — Apply button strips page segments from URL before redirecting
- `sitemap-index.xml.ts:162,179` — **Bug**: missing `/` between category slug and `strona`/`page` in sitemap entries
- Data volume is small (~20-80 activities per category, max ~100) — safe to load all at once
- Images use `loading="lazy"` after index 8 (`Listing.astro:513`) — hidden items with `display: none` won't be fetched by browsers
- **Prerequisite**: This plan assumes the bandwidth optimization (Phases 1-2) has already been implemented, meaning the Image component outputs plain `<img>` with Sanity CDN srcset instead of Astro `<Image />`. This produces lighter per-card HTML.

## Desired End State

After this plan is complete:

1. Activity category pages render ALL activities for the category in a single page
2. Initially 2 rows of items are visible (8 on desktop, 6/4/2 on smaller screens)
3. "Show More" reveals 4 additional rows per click; "Show Less" resets to 2 rows and smooth-scrolls to the listing top
4. The button, row logic, and column detection respond to viewport resizes via ResizeObserver
5. The "Show More" button has `aria-expanded` for screen readers
6. Old paginated URLs (`/strona/[page]/`, `/page/[page]/`) return 301 redirects to the base category page
7. Sitemap no longer includes paginated category URLs
8. Filter script no longer contains page-segment stripping logic

### Verification:

- Visit a category with 30+ items: initially see 2 rows, click "Show More" 2-3 times, click "Show Less" to reset
- Resize browser across all breakpoints — column count and visible items adjust correctly
- Navigate to an old paginated URL (e.g., `/pl/integracje/kategoria/team-building/strona/2/`) — get 301 redirected to base category
- Apply filters — page reloads to `/filtr` with show-more state reset (expected)
- Check sitemap XML — no `/strona/` or `/page/` entries for activities categories

## What We're NOT Doing

- Changing the filter system behavior (filters still navigate to `/filtr` route with full reload)
- Adding client-side sorting (sort still navigates to `/filtr` route)
- Reflecting expansion state in the URL (ephemeral — no `#show=32` params)
- Adding animation/transitions on reveal (instant show/hide)
- Touching pagination on hotels, event spaces, blog, or case studies (only activity categories)
- Removing the `Pagination.astro` component (still used by other listing pages)
- Client-side sorting when "Show More" is expanded

## Implementation Approach

Four phases ordered by dependency: data changes first (fetch all items), then UI (show/hide logic), then cleanup (redirects, sitemap, filter script). Each phase is independently deployable.

## Critical Implementation Details

**ResizeObserver column detection**: The grid columns are CSS-defined and change at 4 breakpoints. The JS must detect the actual column count at runtime — not by checking `window.innerWidth` against hardcoded breakpoints (which would duplicate CSS values and drift), but by measuring the grid with `getComputedStyle(listEl).gridTemplateColumns` and counting the resulting column tracks. This keeps JS and CSS in sync automatically.

---

## Phase 1: Data & Template Changes

### Overview

Remove the GROQ pagination slice so the query returns all activities. Remove pagination math, `rel="prev"`/`rel="next"`, and the `staticPathsCategoryPage` export from the template. The listing still renders with `<Pagination>` in this phase (it will show "1 of 1" or not render since all items fit on "page 1").

### Changes Required:

#### 1. Remove pagination slice from GROQ query

**File**: `apps/astro/src/components/activites/category/Listing.astro`

**Intent**: Remove the `[$PAGINATION_BEFORE...$PAGINATION_AFTER]` slice from the `listing` field in `Listing_Query()` so the query returns all matching activities.

**Contract**: The `listing` field in the GROQ query (line ~269) drops the slice. The `ITEMS_PER_PAGE` import from `ActivitiesPage.astro` is no longer needed in this file and should be removed. The `totalActivitiesByCategory` count query remains (used for the "Found X activities" counter).

#### 2. Remove pagination math from ActivitiesPage template

**File**: `apps/astro/src/templates/activities/ActivitiesPage.astro`

**Intent**: Stop computing `PAGINATION_BEFORE`/`PAGINATION_AFTER` and passing them as GROQ params. Remove `ITEMS_PER_PAGE` constant, `staticPathsCategoryPage` function, `rel="prev"`/`rel="next"` head links, and the "Page N" breadcrumb/title suffix for page > 1.

**Contract**:
- Remove `ITEMS_PER_PAGE` constant (line 21)
- In `fetchData()`: remove `PAGINATION_BEFORE` and `PAGINATION_AFTER` computation (lines 44-45) and their GROQ params (lines 187-188). Preserve the `tag: 'page.activities-list'` property at line 197. Pass `0` and a large number (e.g., `9999`) to keep the GROQ param slots if the query still references them, OR coordinate with Phase 1.1 to remove the slice entirely so these params aren't needed.
- Remove `staticPathsCategoryPage` function (lines 225-248) and its export (includes the `tag: 'page.activities-list.category-pages'` added by the bandwidth optimization — this is removed with the function)
- Remove the `totalPages` computation (line 253)
- Remove `rel="prev"`/`rel="next"` head links (lines 326-327)
- Remove the `currentPage > 1` breadcrumb segment (line 290) and "Page N" title suffix (line 274)
- The `currentPage` prop is no longer meaningful — hardcode to 1 or remove from the Props type. Since the Listing component and filter routes still reference it, simplest approach is to always pass `currentPage={1}`.
- Remove the `getPaginationUrl` function (lines 281-285)

#### 3. Update base category routes

**Files**:
- `apps/astro/src/pages/pl/integracje/kategoria/[category].astro`
- `apps/astro/src/pages/en/activities/category/[category].astro`

**Intent**: These files import `fetchData` — no changes needed to their logic since they already pass `page = 1`. However, remove the `console.log` debug statement from both files (line 9 in each).

**Contract**: Remove `console.log('Rendering category page:', ...)` from both files.

#### 4. Update filter routes to not pass page number

**Files**:
- `apps/astro/src/pages/pl/integracje/kategoria/[category]/filtr.astro`
- `apps/astro/src/pages/en/activities/category/[category]/filter.astro`

**Intent**: These already pass `page = 1`, so minimal change. The `getStaticPaths` import of `staticPathsCategory` remains correct. Verify that the `fetchData` call still works after `PAGINATION_BEFORE`/`PAGINATION_AFTER` removal.

**Contract**: Confirm these files compile and function correctly after the template changes. No code changes likely needed beyond verifying compatibility.

### Success Criteria:

#### Automated Verification:

- TypeScript compiles: `npm run build` in `apps/astro`
- Linting passes: `npm run lint`

#### Manual Verification:

- Category page loads and shows ALL activities (not just 16)
- The Pagination component either shows "1 of 1" or doesn't render (since `totalPages` will be 1)
- Filter routes still work — apply a filter, verify results load
- No `console.log` output from category routes

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 2: Show More/Less UI & Logic

### Overview

Replace the `<Pagination>` component in Listing.astro with a "Show More" / "Show Less" button and a vanilla JS `<script>` that manages visibility based on responsive column count. Uses the `data-expanded` pattern from `TableOfContent.astro`.

### Changes Required:

#### 1. Replace Pagination with Show More/Less button markup

**File**: `apps/astro/src/components/activites/category/Listing.astro`

**Intent**: Remove the `<Pagination>` component import and usage. In its place, add a button section after the `.list` grid that contains a single button for Show More / Show Less toggling. The button uses the existing `Button` component (Preact, `theme="secondary"` `shade="dark"`). The button stores both text labels as `data-` attributes for the JS to swap (matching the `TableOfContent.astro` pattern). Add `aria-expanded="false"` for accessibility.

**Contract**:
- Remove `Pagination` import (line 5) and `ITEMS_PER_PAGE` import (line 3)
- Remove `<Pagination ... />` block (lines 520-526)
- Add a wrapper `div` after the `.list` grid containing the `Button` component
- Button has: `data-show-more={t.showMore}`, `data-show-less={t.showLess}`, `aria-expanded="false"`, `class="show-more-toggle"`
- Add PL/EN translations to the `translations` object: `showMore: "Pokaż więcej"` / `"Show more"`, `showLess: "Pokaż mniej"` / `"Show less"`
- The button wrapper should only render when `listing.length` exceeds the initial visible count (but since we don't know columns at server time, render it always and let JS hide it if all items fit)
- Remove the `data-page-path` attribute from the `<section>` tag (line 452) — no longer needed
- Remove the `currentPage` and `ITEMS_PER_PAGE` references from Listing's Props or internal logic

#### 2. Add show-more/less vanilla JS script

**File**: `apps/astro/src/components/activites/category/Listing.astro` (inline `<script>` block, same pattern as `TableOfContent.astro`)

**Intent**: Add a `<script>` tag that handles: detecting grid columns via `getComputedStyle`, computing visible items (`columns × visibleRows`), toggling `display: none` on items beyond the threshold, swapping button text, updating `aria-expanded`, smooth-scrolling on collapse, and responding to viewport resizes via `ResizeObserver`.

**Contract**:
- Runs on `DOMContentLoaded` or via Astro's `<script>` (which runs after hydration)
- Selects the `.Listing` section, the `.list` grid, all `article[data-activity-card]` children, and the `.show-more-toggle` button
- `INITIAL_ROWS = 2`, `ROWS_PER_EXPANSION = 4`
- `visibleRows` state starts at `INITIAL_ROWS`
- `getColumns()`: reads `getComputedStyle(listEl).gridTemplateColumns`, splits by space, returns count
- `updateVisibility()`: computes `visibleCount = columns × visibleRows`, iterates all cards, sets `style.display = 'none'` on cards beyond `visibleCount` and `style.display = ''` on cards within it. If all cards are visible, hides the button entirely. If `visibleRows > INITIAL_ROWS`, shows "Show Less" text; otherwise shows "Show More" text. Updates `aria-expanded` accordingly.
- Button click handler: if currently showing "Show More", increment `visibleRows` by `ROWS_PER_EXPANSION` (capped at `Math.ceil(totalCards / columns)`). If currently showing "Show Less" (meaning `visibleRows > INITIAL_ROWS` and all cards are visible OR user clicks "Show Less"), reset `visibleRows` to `INITIAL_ROWS` and `scrollIntoView({ behavior: 'smooth', block: 'start' })` the listing section.
- **Button state logic**: The button shows "Show More" when there are hidden items. When the user clicks enough times that all items are visible, the button text switches to "Show Less". On "Show Less" click, collapse to initial rows and scroll up.
- `ResizeObserver` on the `.list` element: on resize, call `updateVisibility()` (columns may have changed). No debounce needed — ResizeObserver fires once per layout change, not continuously.
- If there are fewer total cards than `INITIAL_ROWS × columns`, hide the button entirely (all items fit without expansion)

#### 3. Add CSS for button placement

**File**: `apps/astro/src/components/activites/category/Listing.astro` (in the `<style>` block)

**Intent**: Style the show-more/less button wrapper to sit centered below the grid, with appropriate spacing. Remove any Pagination-specific styles if they exist.

**Contract**: Add styles for `.show-more-wrapper` — centered, margin-top matching the grid gap, `display: flex; justify-content: center`. The button itself inherits its styling from the `Button` component.

### Success Criteria:

#### Automated Verification:

- TypeScript compiles: `npm run build`
- Linting passes: `npm run lint`

#### Manual Verification:

- Category page shows 2 rows initially (8 items on desktop)
- "Show More" reveals 4 more rows (16 more items on desktop)
- Multiple "Show More" clicks accumulate (2 → 6 → 10 rows, etc.)
- When all items visible, button switches to "Show Less"
- "Show Less" collapses to 2 rows and smooth-scrolls to listing top
- Resize browser: column count changes, visible items adjust (e.g., 4→3 columns recalculates correctly)
- On mobile (1 column): initial 2 items, then +4 per click
- Button hidden when category has ≤ 8 items (fits in 2 rows on desktop)
- `aria-expanded` toggles correctly (inspect with browser DevTools)
- Filter page (`/filtr`) works — show-more state resets on page load (expected)

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 3: Redirects & Sitemap Cleanup

### Overview

Convert the 4 paginated route files to 301 redirects pointing to the base category URL. Remove paginated category entries from the sitemap. Fix the existing sitemap bug (missing `/` between category slug and page segment).

### Changes Required:

#### 1. Convert PL paginated route to 301 redirect

**File**: `apps/astro/src/pages/pl/integracje/kategoria/[category]/strona/[page].astro`

**Intent**: Replace the full page render with a 301 redirect to the base category URL. Keep the `getStaticPaths` so Astro generates the redirect for each known paginated URL.

**Contract**: The file becomes an SSR route (`prerender = false`) that reads the `category` param and returns `Astro.redirect(\`/pl/integracje/kategoria/${category}/\`, 301)`. Remove all imports of `ActivitiesListing`, `fetchData`, `staticPathsCategoryPage`. The `getStaticPaths` export is removed (SSR routes don't use it).

#### 2. Convert PL paginated filter route to 301 redirect

**File**: `apps/astro/src/pages/pl/integracje/kategoria/[category]/strona/[page]/filtr.astro`

**Intent**: Same as above — redirect to the base category's filter URL, preserving query params.

**Contract**: SSR route (`prerender = false` — already is). Reads `category` param, constructs redirect URL `/pl/integracje/kategoria/${category}/filtr/` and appends existing search params. Returns `Astro.redirect(url, 301)`.

#### 3. Convert EN paginated route to 301 redirect

**File**: `apps/astro/src/pages/en/activities/category/[category]/page/[page].astro`

**Intent**: Same pattern as PL — 301 redirect to `/en/activities/category/${category}/`.

**Contract**: SSR route, reads `category` param, returns 301 redirect to base category URL.

#### 4. Convert EN paginated filter route to 301 redirect

**File**: `apps/astro/src/pages/en/activities/category/[category]/page/[page]/filter.astro`

**Intent**: Same pattern — 301 redirect to `/en/activities/category/${category}/filter/` with query params preserved.

**Contract**: SSR route, reads `category` and search params, returns 301 redirect.

#### 5. Remove paginated entries from sitemap and fix bug

**File**: `apps/astro/src/pages/sitemap-index.xml.ts`

**Intent**: Remove the `activitiesStaticPathsCategoryPage` import and the two blocks (PL: lines 158-164, EN: lines 175-181) that add paginated category URLs to the sitemap. Also fix the existing bug where the category slug and page segment are concatenated without a `/` separator (lines 162, 179) — but since we're removing these blocks entirely, the bug is eliminated.

**Contract**:
- Remove `import { staticPathsCategoryPage as activitiesStaticPathsCategoryPage }` (or its equivalent in the import block)
- Remove the PL block (lines ~158-164) that calls `activitiesStaticPathsCategoryPage('pl')` and pushes paginated slugs
- Remove the EN block (lines ~175-181) that calls `activitiesStaticPathsCategoryPage('en')` and pushes paginated slugs
- The `staticPathsCategory` import and its usage (category base URLs) remain untouched

#### 6. Remove staticPathsCategoryPage from template exports

**File**: `apps/astro/src/templates/activities/ActivitiesPage.astro`

**Intent**: If not already done in Phase 1, ensure `staticPathsCategoryPage` is fully removed — the function definition and its export. This was the function that queried Sanity for category post counts to generate paginated routes.

**Contract**: The function `staticPathsCategoryPage` (lines 225-248) and any remaining references are removed. Verify no other file imports it (the sitemap and paginated routes were the only consumers — both handled in this phase).

### Success Criteria:

#### Automated Verification:

- TypeScript compiles: `npm run build`
- Linting passes: `npm run lint`
- No import errors — verify `staticPathsCategoryPage` is not referenced anywhere: `grep -r "staticPathsCategoryPage" apps/astro/src/`

#### Manual Verification:

- Visit `/pl/integracje/kategoria/team-building/strona/2/` — get 301 redirected to `/pl/integracje/kategoria/team-building/`
- Visit `/en/activities/category/team-building/page/2/` — get 301 redirected to base category
- Visit paginated filter URL with query params — redirected to base filter URL with params preserved
- Check sitemap XML output — no `/strona/` or `/page/` entries for activity categories
- Verify other sitemap entries (blog, hotels, case studies pagination) are unaffected

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 4: Filter Script Cleanup

### Overview

Remove the page-segment stripping logic from `init-listing-filters.ts` since paginated filter URLs no longer exist. Remove the `data-page-path` attribute from the Listing section.

### Changes Required:

#### 1. Remove page-path logic from filter script

**File**: `apps/astro/src/scripts/init-listing-filters.ts`

**Intent**: Remove the `pagePathSegment` variable and the block that strips `/strona/N/` or `/page/N/` from the URL before constructing the filter redirect. This is dead code now — filter pages always start from the base category URL.

**Contract**:
- Remove line ~431: `const pagePathSegment = listingSection?.getAttribute('data-page-path') || 'strona'`
- Remove lines ~441-443: the `if (basePath.includes(...pagePathSegment...))` block that regex-replaces page segments
- The `filterPathSegment` variable and its logic remain unchanged

#### 2. Remove data-page-path attribute from Listing

**File**: `apps/astro/src/components/activites/category/Listing.astro`

**Intent**: Remove the `data-page-path={t.pagePath}` attribute from the `<section>` element since it's no longer consumed.

**Contract**: Remove `data-page-path={t.pagePath}` from line 452. The `pagePath` key can also be removed from the `translations` object if no other code references it.

### Success Criteria:

#### Automated Verification:

- TypeScript compiles: `npm run build`
- Linting passes: `npm run lint`
- No references to `data-page-path` remain: `grep -r "data-page-path\|pagePathSegment\|pagePath" apps/astro/src/`

#### Manual Verification:

- Apply filters on a category page — redirects correctly to `/filtr?...` URL
- Apply filters from a desktop dropdown — same correct redirect
- Mobile filter sidebar → Apply — correct redirect

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Testing Strategy

### Integration Tests:

- Full build (`npm run build`) passes without errors after each phase
- All lint rules pass

### Manual Testing Steps:

1. Visit a category with many items (30+) — verify show more/less cycle
2. Visit a category with few items (≤8) — verify button is hidden
3. Resize browser through all 4 breakpoints — verify column/row recalculation
4. Apply filters → verify filter page works with all items loaded
5. Visit old paginated URLs → verify 301 redirects
6. Check sitemap XML → verify no paginated category entries
7. Test in both PL and EN
8. Test on mobile device — verify touch interaction, scroll behavior
9. Screen reader test — verify `aria-expanded` announces correctly

## Performance Considerations

- **HTML payload**: With ~60 items at ~3.5 KB each (post-bandwidth-optimization), the listing HTML grows by ~150 KB. Gzipped delta is ~5 KB — negligible for over-the-wire transfer.
- **SSR render time**: Additional ~10-15ms for filter routes (SSR) rendering 60 vs 16 cards. Dominated by the Sanity CDN fetch (~100-200ms).
- **DOM nodes**: ~900-1200 nodes for the listing grid (60 cards × ~15-20 nodes each) vs ~300 before. Total page DOM stays under 3000 (Lighthouse "excessive" threshold).
- **Image loading**: Items hidden via `display: none` with `loading="lazy"` are not fetched by browsers. When revealed by "Show More", lazy loading kicks in naturally.
- **ResizeObserver**: Fires once per layout change, not continuously — no debounce needed.
- **GROQ query**: Removing the slice adds minimal overhead — the query already runs 10+ full `count(*)` scans for filter facets. Returning 60 vs 16 card payloads is a rounding error.

## Migration Notes

- Old paginated URLs will continue to work via 301 redirects — no broken bookmarks or Google results.
- Google will process the 301s and de-index old URLs within 2-4 weeks. Temporary "Page with redirect" entries in Search Console are expected and informational.
- The `Pagination.astro` component is NOT deleted — it's still imported by 5 other listing components (blog, hotels, event spaces, case studies, main activities listing).
- The `ITEMS_PER_PAGE` constant is removed from `ActivitiesPage.astro`. Verify no other file imports it from there.

## References

- Research: `context/changes/activities-show-more/research.md`
- Bandwidth optimization plan: `context/changes/sanity-bandwidth-optimization/plan.md` (prerequisite: Phases 1-2)
- Existing show-more pattern: `apps/astro/src/components/ui/TableOfContent.astro:398-408`
- Grid breakpoints: `apps/astro/src/components/activites/category/Listing.astro:697-927`
- Filter script: `apps/astro/src/scripts/init-listing-filters.ts:420-518`
- Sitemap generator: `apps/astro/src/pages/sitemap-index.xml.ts`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Data & Template Changes

#### Automated

- [x] 1.1 TypeScript compiles: `npm run build` in `apps/astro`
- [x] 1.2 Linting passes: `npm run lint`

#### Manual

- [x] 1.3 Category page shows ALL activities (not just 16)
- [x] 1.4 Filter routes still work with filters applied
- [x] 1.5 No console.log output from category routes

### Phase 2: Show More/Less UI & Logic

#### Automated

- [ ] 2.1 TypeScript compiles: `npm run build`
- [ ] 2.2 Linting passes: `npm run lint`

#### Manual

- [ ] 2.3 2 rows visible initially, Show More reveals 4 more rows
- [ ] 2.4 Show Less collapses to 2 rows and smooth-scrolls to listing top
- [ ] 2.5 Resize across all breakpoints — items recalculate correctly
- [ ] 2.6 Button hidden when all items fit in initial rows
- [ ] 2.7 aria-expanded toggles correctly
- [ ] 2.8 Filter page show-more resets on load

### Phase 3: Redirects & Sitemap Cleanup

#### Automated

- [ ] 3.1 TypeScript compiles: `npm run build`
- [ ] 3.2 Linting passes: `npm run lint`
- [ ] 3.3 No references to `staticPathsCategoryPage` remain in codebase

#### Manual

- [ ] 3.4 Paginated URLs return 301 redirects to base category
- [ ] 3.5 Paginated filter URLs redirect with query params preserved
- [ ] 3.6 Sitemap XML has no paginated category entries
- [ ] 3.7 Other listing pagination (blog, hotels) unaffected

### Phase 4: Filter Script Cleanup

#### Automated

- [ ] 4.1 TypeScript compiles: `npm run build`
- [ ] 4.2 Linting passes: `npm run lint`
- [ ] 4.3 No references to `data-page-path` or `pagePathSegment` remain

#### Manual

- [ ] 4.4 Filter apply works correctly from desktop dropdowns
- [ ] 4.5 Filter apply works correctly from mobile sidebar
