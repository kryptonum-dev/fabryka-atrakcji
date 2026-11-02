# Hotel and Event Space Filters Rebuild Implementation Plan

## Overview

Rebuild the hotel and event space filters agreed with Łukasz (Fabryka Atrakcji) for a fixed 1200 PLN net: multi-select in every filter, distance filters, participant ranges, and new editor-managed taxonomies. The plan also fixes the production defects that would otherwise hide the work, and ships with complete data, so the client only reviews and corrects it in Sanity.

Every scope decision comes from `research.md`, section "Follow-up Research 2026-11-02". That section overrides the recommendations in the research doc's "Open Questions".

## Current State Analysis

- **Event space filters do not work in production.** `/pl/przestrzenie-eventowe/filtr/?minCapacity=500` returns cached HTML with 13 results. The same URL without the trailing slash returns the correct 1 result. Paginated event space filter routes return 404, even for page 1.
- **Multi-select never existed** outside AND-style amenities and features. Region, stars, rooms, location, area and capacity are radio inputs read as one value and compared with `==`.
- **Filter logic is duplicated per option.** Each hotel count is a separate `count(*[...])` carrying the whole filter (`hotels/Listing.astro:231-293`). The new filters would add at least 15 more.
- **Filter data does not exist yet.** No structured coordinates, no surroundings, no event type, character or facilities, and one capacity per event space.
- **EN data is partly broken.** 45 of 52 EN hotels reference PL amenities, EN spaces reference a PL location, and EN has no event space features.
- **Client copy is hardcoded.** Filter headings live in each component, hotel ranges live in code, and only event space ranges come from Sanity.
- **Two older plans are stale.** `filter-crawl-trap/plan.md` cites `fetchEmbeddings` and `Pagination.astro:37`, which no longer exist.

## Desired End State

- Every filter route works in PL and EN on production, including paginated filter routes.
- Hotels have 7 filters: region, standard, amenities, search, distance from a city, participants, surroundings.
- Event spaces have 8 filters: location, search, capacity per space type, distance from an address, space type, event type, character, facilities.
- Options inside a filter combine with OR, filters combine with AND, and amenities and facilities require all selected options.
- Editors manage options, cities, ranges, radii, option order and filter headings in Sanity, with a PL and EN document for every option.
- All objects have complete data. Uncertain values are listed in a handover note.
- Addresses never reach the URL, analytics, Google Sheets or logs. Only coordinates rounded to about 100 m reach the URL, and they are stripped before analytics, Sheets and logs.
- Filter URLs emit production canonicals, and no followed link leads into the filter URL space.

Verify with `context/changes/filters-upsell-hotels-spaces/verify.sh <base-url>`, `bun test tests/filters`, and the manual steps in each phase.

### Key Discoveries:

- `node_modules/@astrojs/vercel/dist/index.js:297-311`: the adapter turns ISR `exclude` regexes into routes built with `escapeRegex`, which produces patterns with no trailing slash. The app always builds `/filtr/`, so those excludes never match it.
- `apps/astro/src/utils/is-preview-deployment.ts:1`: Preview deployments have no ISR at all. **A Preview cannot reproduce the cache defect.**
- `apps/astro/vercel.json:15-82`: the `/_render` rewrites are the only working bypass.
- `apps/astro/src/utils/search-navigation.ts:18-23`: `paginationPath` now owns filtered pagination paths.
- `apps/sanity/utils/create-collection.ts`: `createCollection(..., { orderable: true })` already supports internationalized drag-and-drop ordering (`ActivitiesCategory_Collection` uses `orderRankField`).
- `apps/sanity/schema/collectionTypes/EventSpaces_Collection.ts:204-225`: the language-scoped reference filter is the pattern for every new reference field.
- `apps/sanity/scripts/migrate-contact-form-overrides.ts`: the migration convention, dry-run by default with `--apply`, run through `dotenv -- bun` from the repo root.
- `.env` lives at the repo root (`package.json:20-26` uses `dotenv --`). There is no `apps/astro/.env`.
- `tests/search/*.test.ts` runs with `bun test`, so pure filter logic can be unit tested.

## What We're NOT Doing

- SEO landing pages such as "Hotele nad morzem".
- `filter-crawl-trap` phase 3 (robots.txt). It stays gated on Search Console.
- Translating the 22 hotels and 8 spaces that have no EN version.
- Distance sorting or km on hotel cards, and more than one city or radius at a time.
- Search relevance threshold and the duplicated star SVG. Both are separate proposed tasks.
- Deleting amenity documents. The curated list replaces cleanup.
- Removing `areaM2`, `numberOfRooms` or `pricing`. They remain object data shown on or stored with the object.
- Changing `noindex, follow` on filter pages.
- A generic filter framework. Hotels and spaces keep separate `Listing.astro` files and share only small utilities.
- Google Places. It is the fallback only if the Geoapify gate fails.

## Implementation Approach

The order is: make filters reachable, add schema, migrate data, then replace the UI. New Sanity fields stay optional until the migration has run, and old fields are removed last, because Studio deploys to the one production dataset.

Filter logic moves into one tested TypeScript module. Each listing fetches a small projection of all its objects, computes matching ids and every option count in TypeScript, then asks GROQ for the sorted page with `_id in $matchingIds`. That gives one implementation of the rules and one extra query instead of dozens of `count()` calls. GROQ still computes distance with `geo::distance`, so km and sorting come from one place.

URL contract (values are comma-separated, unknown or invalid values are ignored, and old `minRooms`, `minPrice`, `minArea`, `features` parameters are ignored):

| Listing | Parameter | Meaning |
|---|---|---|
| Hotels | `location`, `surroundings` | slugs, OR |
| Hotels | `amenities` | slugs, AND |
| Hotels | `stars` | `0`–`5`, OR, where `0` is no official category |
| Hotels | `overnight`, `conference`, `banquet` | ranges such as `101-200` or `501-`, OR |
| Hotels | `city`, `radius` | one city slug and one radius in km, both required |
| Spaces | `location`, `eventType`, `character` | slugs, OR |
| Spaces | `spaceType` | type slugs and reserved `mixed`, OR |
| Spaces | `facilities` | slugs, AND |
| Spaces | `capacity_<typeSlug>` | ranges for that type, OR |
| Spaces | `lat`, `lng`, `radius` | point rounded to 3 decimals and radius in km |

A range matches when the object's maximum is at least the range's lower bound. The upper bound is display-only. This was confirmed by Oliwier.

## Critical Implementation Details

**Timing & lifecycle.** Phase 1 can only be proven on production because Preview has no ISR. Pushing `main` also deploys the 8 commits not yet on `origin/main`, so check them before the first deploy. Keep the existing uncommitted changes in `activites/category/Listing.astro` and `soft-404-locale-routes/plan.md` out of this work's commits.

**State sequencing.** `features` references are strong. Remove usage in this order: frontend, then the field values, then the schema, then the documents. Deleting documents first fails.

**Performance constraints.** Facet projections must stay small: ids, slugs and numbers only. A filter route must not get slower than today's 0.64–1.74 s on hotels. Measure in Phase 6.

**State sequencing.** Geopoints must exist on all objects before the distance filter ships, because a document with no point silently drops out of `geo::distance` results.

---

## Phase 1: Fix filter route caching

### Overview

Make one mechanism authoritative for all filter routes and retire the rotten list. Replaces `filter-route-cache-bypass`.

### Changes Required:

#### 1. Filter route rewrites

**File**: `apps/astro/vercel.json`

**Design**: none — routing configuration.

**Intent**: Replace all hand-listed filter rewrites with two wildcard rewrites so a new filter route can never be missed.

**Contract**: Add `{ "source": "/:path*/filtr/", "destination": "/_render" }` and the same for `/:path*/filter/`. Delete every entry ending in `/filtr/` or `/filter/`, and both `/en/integracje/page/:page/` variants. Keep the BotID rewrites, `/api/:path*`, and `/en/hotels/page/:page/`. Patterns must require the trailing slash so `/_astro/filter.<hash>.css` stays unmatched.

If the production probe shows the wildcard does not match, replace it with one explicit entry per route under `src/pages/**/filtr.astro` and `filter.astro`, then keep the verify checks as the guard.

#### 2. ISR exclusion comment

**File**: `apps/astro/astro.config.ts`

**Design**: none — configuration comment.

**Intent**: Record that the adapter's exclude only covers the no-trailing-slash form and that `vercel.json` handles the canonical `/filtr/` form, so nobody removes one thinking the other covers it. Fix the wrong `/filter` comment.

**Contract**: Regexes unchanged.

#### 3. Verification script

**File**: `context/changes/filters-upsell-hotels-spaces/verify.sh`

**Design**: none — tooling.

**Intent**: One re-runnable script, extended by later phases, that exits non-zero on any failed check.

**Contract**: Takes a base URL as `$1`, defaulting to production. Phase 1 asserts, on the 12 filter routes, that two different query strings give different bodies where results differ and `x-vercel-cache` is not `HIT`. It also asserts `/pl/przestrzenie-eventowe/strona/1/filtr/?order=newest` and `/en/event-spaces/page/1/filter/?order=newest` return 200, and that a static `/_astro/filter.*.css` found on a listing page returns 200. Keep traffic under 40 requests per run.

### Success Criteria:

#### Automated Verification:

- Build passes: `cd apps/astro && npm run build`
- `vercel.json` has no route-specific filter entries: `grep -cE 'filtr/"|filter/"' apps/astro/vercel.json` returns `2`
- Search navigation tests pass: `bun test tests/search`
- `verify.sh` passes against production after deploy

#### Manual Verification:

- A filtered event space listing shows narrowed results in PL and EN on production
- Filtered hotel and activity listings still work
- Check Vercel function usage a few days after deploy, because every filter URL is now uncached

---

## Phase 2: Filter SEO fixes

### Overview

Land the still-valid parts of `filter-crawl-trap` phases 1 and 2, updated to current code.

### Changes Required:

#### 1. Production canonicals

**Files**: all 32 occurrences of `Astro.url.origin` under `apps/astro/src/pages/`

**Design**: none — no visual output.

**Intent**: Stop emitting `https://localhost` canonicals on filter routes.

**Contract**: `canonicalUrl` uses `joinUrl(DOMAIN, '<same path>')`. `fetchData` calls pass `DOMAIN` instead of `Astro.url.origin`, with signatures unchanged. Preserve trailing slashes. `soft-404-locale-routes` must not be affected, so leave `Astro.rewrite` calls alone.

#### 2. Filter link signals

**Files**: `apps/astro/src/components/ui/Dropdown.astro`, `apps/astro/src/components/ui/Pagination.astro`

**Design**: none — attributes only.

**Intent**: Remove the crawl signal from links into the filter URL space without changing behaviour or unfiltered pagination.

**Contract**: `rel="nofollow"` on the Dropdown item anchor (`:154`) and clear anchor (`:114`). In Pagination, every page, previous and next anchor gets `rel="nofollow"` only when the current path is a filter route, using the same test as `paginationPath`. Blog and case study pagination stay followed.

#### 3. Cross-change bookkeeping

**Files**: `context/changes/filter-crawl-trap/plan.md`, `context/changes/filter-route-cache-bypass/change.md`

**Design**: none — documentation.

**Intent**: Prevent double work. Record that phases 1–2 and the bypass landed through this change, and that crawl-trap phase 3 stays open.

**Contract**: A short note at the top of each file, naming this change.

### Success Criteria:

#### Automated Verification:

- Build passes: `cd apps/astro && npm run build`
- No origin leak: `grep -rn "Astro.url.origin" apps/astro/src/pages/` returns nothing
- `verify.sh` confirms production-host canonicals on all filter routes
- `verify.sh` confirms zero followed filter links on `/pl/hotele/` and one activity category
- `verify.sh` confirms blog pagination has no `nofollow`

#### Manual Verification:

- Sort dropdown, clear control and filtered pagination still work on all three listing types

---

## Phase 3: Sanity schema, additive

### Overview

Add everything editors need, with all new fields optional. Nothing is removed or made required yet.

### Changes Required:

#### 1. Option collections

**Files**: new in `apps/sanity/schema/collectionTypes/`: `HotelSurroundings_Collection.ts`, `EventSpaceTypes_Collection.ts`, `EventTypes_Collection.ts`, `EventSpaceCharacters_Collection.ts`, `EventSpaceFacilities_Collection.ts`, `FilterCities_Collection.ts`

**Design**: none — Studio schema.

**Intent**: Let editors create and order filter options without a developer, in PL and EN.

**Contract**: Each mirrors `EventSpaceFeatures_Collection.ts` (`language`, `name`, `slug`) and adds `orderRankField`, like `ActivitiesCategory_Collection.ts`. `FilterCities_Collection` adds a `point` field of type `geopoint`. Field descriptions tell editors to create the EN version through the translation menu. `EventSpaceTypes_Collection` slug validation rejects the reserved value `mixed`.

#### 2. Studio registration

**Files**: `apps/sanity/structure/schema-types.ts`, `apps/sanity/structure/index.tsx`

**Design**: none — Studio structure.

**Intent**: Show the collections beside their parents.

**Contract**: Register all six. Use `createCollection(S, context, '<name>', { orderable: true })`. Surroundings and cities sit in the hotels group, the rest in the event spaces group, with cities reachable from both if the structure allows it.

#### 3. Object fields

**Files**: `apps/sanity/schema/collectionTypes/Hotels_Collection.ts`, `EventSpaces_Collection.ts`, `apps/sanity/schema/ui/StarRating.tsx`

**Design**: none — Studio schema.

**Intent**: Store the new filter data and allow "no official category".

**Contract**:
- Hotel: `point` (`geopoint`), `surroundings` (array of language-filtered references).
- Space: `point` (`geopoint`), `capacities` (array of `{ spaceType: reference, maxPeople: number }`, unique by type), `eventTypes`, `characters`, `facilities` (arrays of language-filtered references).
- `point` descriptions explain copying coordinates from Google Maps by right-click.
- `stars` validation becomes `min(0).max(5)`. `StarRating` gets an explicit "Bez oficjalnej kategoryzacji" control storing `0`. Check its fallback at `:37` uses `??`, otherwise a stored `0` displays as 3.
- Language filters reuse the `options.filter` pattern from `EventSpaces_Collection.ts:213-222`.

#### 4. Listing page configuration

**Files**: `apps/sanity/schema/singleTypes/Hotels_Page.ts`, `apps/sanity/schema/singleTypes/EventSpaces_Page.ts`

**Design**: none — Studio schema.

**Intent**: Move ranges, radii, order and copy out of code.

**Contract**: A `filters` group on both pages.
- `Hotels_Page`: `filterHeadings` (location, distance, overnight, conference, banquet, stars, amenities, surroundings), `participantRanges` (same shape as `capacityFilterOptions`), `distanceRadii` (number array), `curatedAmenities` (ordered language-filtered references to `Amenities_Collection`), `visibleAmenities` (number), `noCategoryLabel`.
- `EventSpaces_Page`: `filterHeadings` (location, distance, addressPlaceholder, spaceType, capacity prefix, eventType, character, facilities), `distanceRadii`, `mixedSpaceTypeLabel`. `capacityFilterOptions` stays. `areaFilterOptions` stays until Phase 9.

#### 5. Revalidation and sitemap

**Files**: `apps/astro/src/utils/revalidation-map.ts`, `apps/astro/src/pages/sitemap-index.xml.ts`

**Design**: none — infrastructure.

**Intent**: Editor changes reach pages right away, and option slugs never enter the sitemap.

**Contract**: Add all six types to `excludedTypes`. Revalidation: surroundings and cities revalidate hotel listings, the other four revalidate space listings, following the `EventSpaceFeatures_Collection` case.

### Success Criteria:

#### Automated Verification:

- Studio schema builds: `npm run build`
- Lint passes: `npm run lint`
- New types are excluded from the sitemap: `grep -c "_Collection'" apps/astro/src/pages/sitemap-index.xml.ts` increases by 6

#### Manual Verification:

- After Studio deploy, existing hotels and spaces open with no validation errors
- An editor can create a surroundings option with an EN version and drag it to reorder
- Reference fields only list documents in the document's language

---

## Phase 4: Data migration

### Overview

Fill every object, so the client reviews data rather than entering it. All scripts are idempotent, dry-run by default, and write to one shared production dataset.

### Changes Required:

#### 1. Generated working data

**Files**: new in `context/changes/filters-upsell-hotels-spaces/data/`: `coordinates.json`, `hotels.json`, `spaces.json`

**Design**: none — data.

**Intent**: Keep every judgement reviewable and in version control before it touches Sanity.

**Contract**:
- `coordinates.json`: one row per PL object and per EN object with no PL twin: `{ id, lat, lng, source, embedDeltaKm, note }`. Geocode the address through Photon, then GUGiK, at most 1 request per second. Review every row over 1 km from the embed point manually and record the decision.
- `hotels.json`: PL hotel id to surroundings slugs. Read each description, city and region. Do not use keyword matching, which research showed gives 57 hotels 2 or more values. At least 1 value per hotel, marked `working: true`.
- `spaces.json`: PL space id to event types, characters, facilities, and capacities, using the content text. First capacity is `maxPeople` under the type from `isIndoor`. The 8 mixed candidates get a second pair: use a figure from the object's text if there is one, otherwise 50% of the first capacity rounded to 10. Mark it `working: true`.

#### 2. Migration scripts

**Files**: new in `apps/sanity/scripts/filters-upsell/`: `seed-options.ts`, `apply-coordinates.ts`, `apply-object-data.ts`, `migrate-amenities.ts`, `migrate-locations.ts`, `seed-page-config.ts`

**Design**: none — tooling.

**Intent**: Apply all data repeatably.

**Contract**: Follow `migrate-contact-form-overrides.ts` for flags and client setup, and print a per-document summary on dry-run.
- `seed-options.ts`: 21 option documents (6 surroundings, 2 space types, 5 event types, 5 characters, 3 facilities) and 7 cities (Warszawa, Kraków, Wrocław, Poznań, Sopot labelled Trójmiasto, Katowice, Łódź), each with PL and EN documents, deterministic ids, `translation.metadata` documents and `orderRank`. That is 56 documents.
- `apply-coordinates.ts`: writes `point` to PL objects and their EN twins.
- `apply-object-data.ts`: writes hotel and space fields to PL, then maps references to EN twins for 51 hotel pairs and 5 space pairs.
- `migrate-amenities.ts`: repoints "Spa" to "SPA / Wellness" and "Dostęp do jeziora" to "Nad jeziorem / plaża", moves the 7 "Teren outdoor" hotels to "Basen", creates missing EN twins, renames the EN twin "Outdoor pool", repoints EN hotels to EN documents for the 9 curated amenities, and aligns the 7 EN hotel capacity mismatches to the PL value. Touches no other amenity. Output lists each changed hotel for the handover.
- `migrate-locations.ts`: creates "Warszawa i okolice" with an EN twin, moves all 18 spaces, merges the two "Warszawa i Mazowsze" hotel documents, and fixes 5 EN hotels pointing at PL locations.
- `seed-page-config.ts`: fills the new page fields. Hotel ranges `1-100, 101-200, 201-300, 301-500, 501-`, hotel radii `25, 50, 100, 150`, space radii `1, 3, 5, 10, 20, 30`, curated amenities in the client's order with 4 visible.

Export the dataset before the first `--apply`: `npx sanity dataset export production <scratchpad>/pre-filters.tar.gz` from `apps/sanity`.

### Success Criteria:

#### Automated Verification:

- All scripts report zero changes on a second dry-run after `--apply`
- All objects have points: `count(*[_type in ["Hotels_Collection","EventSpaces_Collection"] && !defined(point)]) == 0`
- All PL hotels have surroundings, and all spaces have at least one capacity
- No EN object references a PL option: GROQ check returns 0 for the new fields and curated amenities
- Build passes: `npm run build`

#### Manual Verification:

- Spot-check 5 hotels and 5 spaces in Studio in both languages
- Confirm every row over 1 km in `coordinates.json` has a recorded decision

---

## Phase 5: Shared filter logic and UI

### Overview

Build the tested logic and the generic multi-select control both listings use.

### Changes Required:

#### 1. Facet engine

**File**: new `apps/astro/src/utils/listing-facets.ts`

**Design**: none — pure logic.

**Intent**: One implementation of the matching and counting rules.

**Contract**:

```ts
type FacetGroup<T> = {
  key: string
  mode: 'any' | 'all'
  selected: string[]
  matches: (item: T, value: string) => boolean
  options: string[]
}
computeFacets<T extends { _id: string }>(items: T[], groups: FacetGroup<T>[]): {
  matchingIds: string[]
  counts: Record<string, Record<string, number>>
}
```

`any` option counts ignore the group's own selection. `all` option counts apply it, which matches today's amenities behaviour. Also export `rangeMatches(max, rangeValue)` and `parseRange`.

#### 2. URL parsing

**File**: new `apps/astro/src/utils/listing-params.ts`

**Design**: none — pure logic.

**Intent**: Parse the URL contract for hotels and spaces without touching `parseFilters`, which activities still need.

**Contract**: `parseHotelParams(searchParams)` and `parseSpaceParams(searchParams)` implement the table above. Reject malformed ranges, stars outside `0-5`, and points outside Poland (lat 49–55, lng 14–25). `city` and `radius` only count together, as do `lat`, `lng` and `radius`.

#### 3. Sort and filter URL helpers

**File**: `apps/astro/src/utils/filters.ts`

**Design**: none — logic.

**Intent**: Let sorting and clearing keep all new parameters.

**Contract**: `hasAnyFilters` becomes "any parameter remains" rather than a fixed list. `OrderType` gains `distance`, mapped to `distanceKm asc` for spaces. Remove `getHotelFilters`, which has no callers.

#### 4. SelectFilter

**File**: `apps/astro/src/components/ui/SelectFilter.astro`

**Design**: undrawn — extends the existing filter group styling, follow `kryptonum-styling`.

**Intent**: Make multi-select generic, and add "Pokaż więcej".

**Contract**: Replace the `amenities` check at `:34` with a rule for any multi filter with selected items, so a selected option can be cleared when there are no results. Add `visibleCount?: number` and `showMoreLabel`; selected options always stay visible, and the toggle is a real `button` with `aria-expanded`, following `TableOfContent.astro:105`. The script emits the same `filterChange` events and shows a selected-count summary for multi filters.

#### 5. Tests

**Files**: new `tests/filters/listing-facets.test.ts`, `tests/filters/listing-params.test.ts`, root `package.json`

**Design**: none — tests.

**Intent**: Lock the rules agreed with the client.

**Contract**: Add `test:filters`. Cover OR inside a filter, AND between filters, AND for `all` groups, counts ignoring their own group, a 500-person hotel matching `101-200`, open ranges, invalid values, and old parameters being ignored.

### Success Criteria:

#### Automated Verification:

- Filter tests pass: `bun test tests/filters`
- Search tests pass: `bun test tests/search`
- Build passes: `cd apps/astro && npm run build`

#### Manual Verification:

- Existing amenities filter still works with the updated SelectFilter

---

## Phase 6: Hotels listing

### Overview

Ship the 7 hotel filters.

### Changes Required:

#### 1. Data fetching

**File**: `apps/astro/src/templates/hotels/HotelsPage.astro`

**Design**: none — data flow.

**Intent**: Replace filter-in-GROQ with facets plus an id-based page query.

**Contract**: `fetchData` resolves the city point if `city` and `radius` are present, then fetches the facet projection through `fetchPage` (`_id, location slug, stars, amenity slugs, surroundings slugs, maxPeople, distanceKm`). It applies search candidates, runs `computeFacets`, then runs the page query with `$matchingIds`. Keep the 404 guard for out-of-range pages.

#### 2. Hotel listing

**File**: `apps/astro/src/components/hotels/Listing.astro`

**Design**: undrawn — reuses existing filter layout, follow `kryptonum-styling`.

**Intent**: Render the agreed filters and remove rooms and price.

**Contract**: `Listing_Query` keeps only option documents and the sorted slice over `_id in $matchingIds`. Option documents are ordered by `orderRank`, curated amenities by `curatedAmenities`. Headings, ranges and radii come from `Hotels_Page`. Remove `roomsRange`, `roomRangeCounts`, `priceRange`, `PriceRangeFilter`, `data-price-*`, and all related client code. The price sort stays. The stars filter adds `0` with `noCategoryLabel`, hidden at zero count until a hotel uses it. Client state treats every `data-multi` group generically and removes the hardcoding at `:1391,1427,1570`. `applyFilters` deletes the full parameter list before rebuilding the URL.

#### 3. Distance filter

**File**: new `apps/astro/src/components/hotels/DistanceFilter.astro`

**Design**: undrawn — matches filter group styling, follow `kryptonum-styling`.

**Intent**: Pick one city and one radius.

**Contract**: Options come from `FilterCities_Collection` and `distanceRadii`. Emits `filterChange` for `city` and `radius`. The radius stays disabled until a city is selected.

#### 4. Parser cleanup

**File**: `apps/astro/src/utils/filters.ts`

**Design**: none — logic.

**Intent**: Remove hotel fields from `parseFilters` now that hotels no longer use it. This also removes the `minRooms` bug at `:97-99`.

**Contract**: Activities behaviour unchanged.

### Success Criteria:

#### Automated Verification:

- Build passes: `cd apps/astro && npm run build`
- Filter tests pass: `bun test tests/filters`
- `verify.sh` on a Preview confirms `?location=a,b` returns at least the larger of each alone
- `verify.sh` confirms `?overnight=101-200` returns more results than `?overnight=501-`
- `verify.sh` confirms `?city=warszawa&radius=25` returns fewer than `?city=warszawa&radius=150`
- `verify.sh` confirms no rooms or price filter markup on `/pl/hotele/`
- `verify.sh` records hotel filter route response time, at or under the current 1.74 s

#### Manual Verification:

- Combine region, participants, standard and amenities, on desktop and in the mobile drawer
- "Pokaż więcej" reveals curated amenities, and a selected hidden amenity stays visible
- Pagination and sort keep all filters
- Same checks on `/en/hotels/`

---

## Phase 7: Event spaces listing

### Overview

Ship all event space filters except the address, and move display to the new data.

### Changes Required:

#### 1. Data fetching and listing

**Files**: `apps/astro/src/templates/event-spaces/EventSpacesPage.astro`, `apps/astro/src/components/event-spaces/Listing.astro`

**Design**: undrawn — reuses existing filter layout, follow `kryptonum-styling`.

**Intent**: Apply the hotels approach, and replace old filters with the agreed set.

**Contract**: Facet projection: `_id, location slug, eventTypes, characters, facilities, capacities[]{type slug, maxPeople}, distanceKm`, with the `name match` search applied in that query. Space type options are the documents plus `mixed` for objects with 2 or more capacities; an object with both also matches each single type. One `capacity_<slug>` SelectFilter per space type. Location renders only with 2 or more options that have data. Remove features, area, `areaFilterSource`, `capacityFilterSource` and the related client code. Client state generalizes as in Phase 6, including deleting every `capacity_*` parameter in `applyFilters`.

#### 2. Card and detail display

**Files**: `apps/astro/src/components/ui/EventSpaceCard.astro`, `apps/astro/src/components/offer/Hero.astro`, `apps/astro/src/templates/event-spaces/SingleEventSpacePage.astro`

**Design**: undrawn — keeps current card and pill layout.

**Intent**: Keep one source of truth for capacity and type, and fix sorting.

**Contract**: `EventSpaceCardQuery` returns `"maxPeople": coalesce(math::max(capacities[].maxPeople), maxPeople)`, plus `popularityIndex`, `publishedDate` and `_createdAt`, which fixes "Polecane" and "Od najnowszych". `SingleEventSpacePage` returns the same `maxPeople` and `"spaceTypes": capacities[].spaceType->name`. `Hero.astro:463` shows the type names and no longer branches on `isIndoor`, with `isIndoor` as the fallback when `capacities` is missing.

### Success Criteria:

#### Automated Verification:

- Build passes: `cd apps/astro && npm run build`
- Filter tests pass: `bun test tests/filters`
- `verify.sh` confirms `?spaceType=mixed` returns fewer results than no filter, and `?spaceType=<plener>` includes mixed objects
- `verify.sh` confirms `?facilities=a,b` returns no more than either alone
- `verify.sh` confirms no area or features filter markup on `/pl/przestrzenie-eventowe/`
- `verify.sh` confirms "Polecane" and "Od najnowszych" give different orders

#### Manual Verification:

- Each filter narrows results in PL and EN, with Location hidden while there is one option
- Offer page shows the type and capacity correctly for one single-type and one mixed space

---

## Phase 8: Distance from an address

### Overview

Add address search, radius, nearest-first sorting, km on cards, and all privacy handling. Requires `GEOAPIFY_API_KEY`.

### Changes Required:

#### 1. Provider gate

**File**: new `context/changes/filters-upsell-hotels-spaces/geoapify-check.ts`

**Design**: none — tooling.

**Intent**: Prove the provider on real Polish office addresses before building on it.

**Contract**: Run 20 real office addresses through the Geoapify autocomplete endpoint with `filter=countrycode:pl`. Pass means at least 18 addresses have the right result in the top 3, within 150 m of the expected point. On failure, stop and report before Phase 8 continues. Never print the key.

#### 2. Autocomplete endpoint

**Files**: new `apps/astro/src/pages/api/geocode.ts`, `turbo.json`, `apps/astro/src/env.d.ts`

**Design**: none — API.

**Intent**: Hide the key, limit abuse, and keep typed addresses out of access logs.

**Contract**: `prerender = false`, `POST` with JSON `{ text, lang }`, because a GET would put the address in logs. Calls `https://api.geoapify.com/v1/geocode/autocomplete` with `filter=countrycode:pl`, `limit=5`, `format=json`, and returns `[{ label, lat, lng }]`. Requires 3–100 characters and a same-origin request, applies a per-IP in-memory limit of 20 requests a minute, returns `Cache-Control: no-store`, and logs no address text. Add `GEOAPIFY_API_KEY` to `turbo.json` `globalEnv` and to `env.d.ts`.

#### 3. Address filter island

**Files**: new `apps/astro/src/components/event-spaces/AddressFilter.tsx`, plus its SCSS module, `apps/astro/src/components/event-spaces/Listing.astro`

**Design**: undrawn — matches filter group styling, follow `kryptonum-styling` and `wcag-audit` combobox expectations.

**Intent**: Address input with suggestions and radius selection.

**Contract**: Preact island using `client:visible`, with an ARIA combobox and keyboard navigation, 250 ms debounce, and abort of stale requests. Selecting a suggestion stores the label in `sessionStorage` under `fa:address-filter` and emits `filterChange` for rounded `lat`, `lng`, plus `radius`. Text with no selected suggestion cannot be applied and shows a hint. Shared links with coordinates but no stored label show "Wybrany punkt" or "Selected point". Endpoint errors show a message and leave other filters working. Show the "Powered by Geoapify" link and OpenStreetMap attribution in the suggestion list.

#### 4. Listing behaviour

**Files**: `apps/astro/src/templates/event-spaces/EventSpacesPage.astro`, `apps/astro/src/components/event-spaces/Listing.astro`, `apps/astro/src/components/ui/Dropdown.astro`, `apps/astro/src/components/ui/EventSpaceCard.astro`

**Design**: undrawn — km sits in the existing `.address` line.

**Intent**: Results within the radius, nearest first, with km visible.

**Contract**: Pass `$point` as `{ lat, lng }` into the projection and the page query, computing `"distanceKm": geo::distance(point, $point) / 1000`. With a point present, the default order is `distance` and the sort dropdown gains "Od najbliższej". The card accepts `distanceKm` and renders it through `Intl.NumberFormat` with one decimal, using the page language. An empty result inside the radius gets its own message suggesting a larger radius.

#### 5. Privacy

**Files**: new `apps/astro/src/utils/strip-location-params.ts`, `apps/astro/src/utils/track-event.ts`, `apps/astro/src/components/analytics/Analytics.astro`, `apps/astro/src/components/global/ContactForm/InquiryForm.tsx`, `apps/astro/src/pages/api/contact.ts`

**Design**: none — data handling.

**Intent**: Keep coordinates out of analytics, Sheets and logs.

**Contract**: `stripLocationParams(url)` removes `lat`, `lng` and `radius` from a URL or path. Apply at `track-event.ts:620`, the `page_path` and `page_location` values in `Analytics.astro`, both `sourceUrl` values in `InquiryForm.tsx`, and `sourceUrl` plus `referer` in the `[BOTLOG]` call in `contact.ts`, which also protects `s3d` through the same payload. Add unit tests.

#### 6. Privacy policy

**File**: new `apps/sanity/scripts/filters-upsell/update-privacy-policy.ts`

**Design**: none — content.

**Intent**: Disclose the address provider in PL and EN.

**Contract**: Read the current `PrivacyPolicy_Page` first. Add one paragraph in each language naming Geoapify, the purpose, and that typed addresses are sent to it. Dry-run by default, idempotent. Listed in the handover for client review.

### Success Criteria:

#### Automated Verification:

- `geoapify-check.ts` reports at least 18 of 20
- Build passes: `cd apps/astro && npm run build`
- Filter tests pass: `bun test tests/filters`
- `verify.sh` confirms `/api/geocode` rejects GET, too-short text and cross-origin requests
- `verify.sh` confirms results at `radius=1` are no more than at `radius=30`, sorted by km
- The bundle does not contain the key: `grep -r "$GEOAPIFY_API_KEY" apps/astro/dist apps/astro/.vercel/output/static` returns nothing

#### Manual Verification:

- Type an office address, pick a suggestion, and get nearest-first results with km on cards, on desktop and mobile
- In the browser Network tab, no analytics or Meta request contains `lat`, `lng` or the address
- Send a test inquiry from a distance-filtered page on a Preview and confirm the Sheets row has no coordinates
- Keyboard-only use of the address field works
- The empty radius message appears when searching from Kraków

---

## Phase 9: Remove old fields and tighten validation

### Overview

Clean up Sanity now that nothing reads the old data. This is the point of no easy return, so export first.

### Changes Required:

#### 1. Features removal

**Files**: new `apps/sanity/scripts/filters-upsell/remove-features.ts`, `apps/sanity/schema/collectionTypes/EventSpaces_Collection.ts`, `apps/sanity/structure/schema-types.ts`, `apps/sanity/structure/index.tsx`, `apps/astro/src/utils/revalidation-map.ts`, `apps/astro/src/pages/sitemap-index.xml.ts`

**Design**: none — Studio schema.

**Intent**: Remove features from the frontend, Studio and dataset, as Oliwier asked.

**Contract**: After the Phase 7 deploy, take a dataset export. Unset `features` on all 18 spaces. Remove the field and the `EventSpaceFeatures_Collection` schema file, registrations, the revalidation case and the sitemap exclusion comment and entry. Deploy Studio. Then delete the 9 documents and their `translation.metadata` documents. Keep the exclusion entry until the documents are deleted.

#### 2. Area filter removal

**File**: `apps/sanity/schema/singleTypes/EventSpaces_Page.ts`

**Design**: none — Studio schema.

**Intent**: Remove the area filter configuration. `areaM2` stays, because the card and offer page display it.

**Contract**: Remove `areaFilterOptions`, and unset it on both `EventSpaces_Page` documents.

#### 3. Hide replaced fields, require new ones

**Files**: `apps/sanity/schema/collectionTypes/EventSpaces_Collection.ts`, `apps/sanity/schema/collectionTypes/Hotels_Collection.ts`, option and page schemas

**Design**: none — Studio schema.

**Intent**: Stop editors maintaining two sources of truth, and stop new objects silently dropping out of filters.

**Contract**: Hide `maxPeople` and `isIndoor` on spaces and remove their required validation, following the repo convention for replaced fields. Require `point`, `surroundings` (min 1), `capacities` (min 1), and the seeded page fields. Keep the `isIndoor` fallback in `Hero.astro`.

### Success Criteria:

#### Automated Verification:

- Build passes: `npm run build`
- No code references remain: `grep -rn "EventSpaceFeatures_Collection\|areaFilterOptions" apps/astro/src apps/sanity/schema apps/sanity/structure` returns nothing
- Dataset is clean: `count(*[_type == "EventSpaceFeatures_Collection"]) == 0` and `count(*[_type == "EventSpaces_Collection" && defined(features)]) == 0`
- `verify.sh` passes against production

#### Manual Verification:

- Studio shows no features collection or area options
- Create a test hotel draft and confirm publishing is blocked with no point, then discard it
- Existing hotels and spaces publish with no validation errors

---

## Phase 10: Handover

### Overview

Prepare what Oliwier sends the client. Nothing is sent automatically.

### Changes Required:

#### 1. Client handover

**File**: new `context/changes/filters-upsell-hotels-spaces/handover.md`

**Design**: none — written in Polish.

**Intent**: Give Łukasz everything needed to review and take over, with no further work from us.

**Contract**: Sections in this order: working capacities for the 8 mixed objects, first because they affect public filter results; other working data (surroundings, event types, characters, facilities); data we changed (amenities moved, 7 "Teren outdoor" hotels, 7 aligned capacity pairs); how to add options with both language versions; how to add a city or object with coordinates; how to mark "Bez oficjalnej kategoryzacji", and that the option appears after the first hotel; the Geoapify link and privacy policy paragraph to review; Geoapify account ownership. Draft in Polish, run through `krypto-unslop` and `krypto-voice`.

#### 2. Final audits

**Files**: changed filter components

**Design**: none — review.

**Intent**: Catch accessibility and styling regressions before sign-off.

**Contract**: Run `/10x-verify filters-upsell-hotels-spaces`, covering WCAG and SCSS for the changed components.

### Success Criteria:

#### Automated Verification:

- `handover.md` exists and lists 8 mixed objects
- `verify.sh` passes against production
- All tests pass: `bun test tests/filters tests/search`

#### Manual Verification:

- Oliwier reviews `handover.md` and sends it to Łukasz
- Oliwier confirms the Geoapify account is owned by Fabryka Atrakcji

---

## Testing Strategy

### Unit Tests:

- `tests/filters/listing-facets.test.ts`: OR, AND, own-group counts, range rule
- `tests/filters/listing-params.test.ts`: every parameter, invalid input, old parameters, Poland bounds
- `tests/filters/strip-location-params.test.ts`: full URLs, paths, other parameters preserved

### Integration Tests:

- `verify.sh`: production and Preview checks, grown phase by phase

### Manual Testing Steps:

1. On `/pl/hotele/`, select two regions, one participant range and two amenities, then paginate and change sort.
2. On `/pl/przestrzenie-eventowe/`, type a real Warsaw office address, pick a suggestion, change the radius, and open a result.
3. Clear filters from a filtered page on mobile.
4. Open a filter URL with old parameters such as `?minRooms=150` and confirm it loads with no error.
5. Repeat steps 1–3 on the EN routes.

## Performance Considerations

Filter routes become uncached on EN and spaces, as intended, so crawl cost rises until `filter-crawl-trap` phase 3 ships; `nofollow` limits this in the meantime. Facet projections replace many `count()` calls, and the projection for at most 73 hotels stays small. Multi-select does not increase page size because listings still show 16 cards.

## Migration Notes

Write order: export, Phase 3 Studio deploy, Phase 4 `--apply`, frontend phases, then Phase 9. Scripts are idempotent, so a partial run can be repeated. New fields are additive until Phase 9, so rollback before that is a code revert. After Phase 9, restore from the dataset export.

## References

- Decisions and scope: `context/changes/filters-upsell-hotels-spaces/research.md`, section "Follow-up Research 2026-11-02"
- Slack agreement: https://kryptonumworkspace.slack.com/archives/C098Z6V0CJ2/p1791191046692849
- Superseded work: `context/changes/filter-route-cache-bypass/change.md`, `context/changes/filter-crawl-trap/plan.md` phases 1–2
- Geoapify autocomplete: https://apidocs.geoapify.com/docs/geocoding/address-autocomplete/
- Reference patterns: `apps/sanity/schema/collectionTypes/EventSpaceFeatures_Collection.ts`, `apps/sanity/schema/collectionTypes/ActivitiesCategory_Collection.ts`, `apps/sanity/scripts/migrate-contact-form-overrides.ts`, `apps/astro/src/components/global/TableOfContent.astro:105`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Fix filter route caching

- [x] 1.1 Build passes: `cd apps/astro && npm run build` — e0ea56f
- [x] 1.2 `vercel.json` has no route-specific filter entries — e0ea56f
- [x] 1.3 Search navigation tests pass: `bun test tests/search` — e0ea56f
- [x] 1.4 `verify.sh` passes against production after deploy — e0ea56f

### Phase 2: Filter SEO fixes

- [x] 2.1 Build passes: `cd apps/astro && npm run build` — 48d597a
- [x] 2.2 No origin leak under `apps/astro/src/pages/` — 48d597a
- [x] 2.3 `verify.sh` confirms production-host canonicals on all filter routes — 48d597a
- [x] 2.4 `verify.sh` confirms zero followed filter links on `/pl/hotele/` and one activity category — 48d597a
- [x] 2.5 `verify.sh` confirms blog pagination has no `nofollow` — 48d597a

### Phase 3: Sanity schema, additive

- [x] 3.1 Studio schema builds: `npm run build` — e70d942
- [x] 3.2 Lint passes: `npm run lint` — e70d942
- [x] 3.3 New types are excluded from the sitemap — e70d942

### Phase 4: Data migration

- [x] 4.1 All scripts report zero changes on a second dry-run after `--apply` — 75b1ab9
- [x] 4.2 All objects have points — 75b1ab9
- [x] 4.3 All PL hotels have surroundings, and all spaces have at least one capacity — 75b1ab9
- [x] 4.4 No EN object references a PL option — 75b1ab9
- [x] 4.5 Build passes: `npm run build` — 75b1ab9

### Phase 5: Shared filter logic and UI

- [x] 5.1 Filter tests pass: `bun test tests/filters` — 444dc38
- [x] 5.2 Search tests pass: `bun test tests/search` — 444dc38
- [x] 5.3 Build passes: `cd apps/astro && npm run build` — 444dc38

### Phase 6: Hotels listing

- [x] 6.1 Build passes: `cd apps/astro && npm run build` — 9ac60d9
- [x] 6.2 Filter tests pass: `bun test tests/filters` — 9ac60d9
- [x] 6.3 `verify.sh` confirms `?location=a,b` combines regions — 9ac60d9
- [x] 6.4 `verify.sh` confirms participant range behaviour — 9ac60d9
- [x] 6.5 `verify.sh` confirms city radius behaviour — 9ac60d9
- [x] 6.6 `verify.sh` confirms no rooms or price filter markup — 9ac60d9
- [x] 6.7 `verify.sh` records hotel filter route response time at or under 1.74 s — 9ac60d9

### Phase 7: Event spaces listing

- [x] 7.1 Build passes: `cd apps/astro && npm run build` — cd48c45
- [x] 7.2 Filter tests pass: `bun test tests/filters` — cd48c45
- [x] 7.3 `verify.sh` confirms `mixed` and single type behaviour — cd48c45
- [x] 7.4 `verify.sh` confirms facilities AND behaviour — cd48c45
- [x] 7.5 `verify.sh` confirms no area or features filter markup — cd48c45
- [x] 7.6 `verify.sh` confirms "Polecane" and "Od najnowszych" give different orders — cd48c45

### Phase 8: Distance from an address

- [x] 8.1 `geoapify-check.ts` reports at least 18 of 20 — 267925e
- [x] 8.2 Build passes: `cd apps/astro && npm run build` — 267925e
- [x] 8.3 Filter tests pass: `bun test tests/filters` — 267925e
- [x] 8.4 `verify.sh` confirms `/api/geocode` input and origin checks — 267925e
- [x] 8.5 `verify.sh` confirms radius and km sorting — 267925e
- [x] 8.6 The bundle does not contain the key — 267925e

### Phase 9: Remove old fields and tighten validation

> 9.2 and 9.3 stay open on purpose. The 9 feature documents stay in the dataset until Oliwier runs `apps/sanity/scripts/filters-upsell/cleanup-deletions.ts --apply`, so the sitemap entry and the document count cannot pass before that.

- [x] 9.1 Build passes: `npm run build`
- [ ] 9.2 No code references remain
- [ ] 9.3 Dataset is clean
- [ ] 9.4 `verify.sh` passes against production

### Phase 10: Handover

- [ ] 10.1 `handover.md` exists and lists 8 mixed objects
- [ ] 10.2 `verify.sh` passes against production
- [ ] 10.3 All tests pass: `bun test tests/filters tests/search`
