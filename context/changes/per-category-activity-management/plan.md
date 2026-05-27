# Per-Category Activity Management Implementation Plan

## Overview

Add an `activities[]` array to `ActivitiesCategory_Collection` so editors can manage which activities belong to a category, control their display order (via drag-to-reorder), and optionally override names/descriptions per-category for SEO differentiation. Migrate existing relationships, rewrite all GROQ queries to use the new model as the single source of truth, and hide the legacy `categories[]` field on activities.

## Current State Analysis

The activity→category relationship is stored on the activity side only (`Activities_Collection.categories[]` — array of references). Categories have zero knowledge of their activities — resolved at query time via GROQ `references()`. Activities have a single global `popularityIndex` (0-100) and a single global `description` text field. Adding a new category requires editing every individual activity to add the reference — tedious and burns through Sanity API limits.

### Key Discoveries:

- `Activities_Collection.categories[]` (line 168-193) is the only place the relationship is stored
- `Activities_Collection.popularityIndex` (line 427-435) is a single global number — same rank in every category
- `Activities_Collection.description` (line 88-93) is a single global text — identical across all category listings
- `ActivitiesCategory_Collection` already supports per-category customization for page components and form overrides — but NOT for individual activity appearance
- `CategoryBlockQuery` uses `count(*[_type == "Activities_Collection" && references(^._id)])` for activity count — needs updating
- `@sanity/orderable-document-list` v1.3.5 is installed but only used for category tab ordering, not activity ordering
- Sanity arrays natively support drag-to-reorder — no additional plugin needed for activity ordering within a category
- All category page routes (regular + filter variants) share `ActivitiesPage.astro` template and always pass a category parameter
- Existing migration scripts in `apps/sanity/scripts/` follow a dry-run/apply pattern that we can reuse

## Desired End State

After this plan is complete:

1. Editors open a category document in Sanity Studio and see an `activities[]` array where they can add/remove activities, drag to reorder, and optionally fill in name/description overrides
2. Category pages on the website display activities in the order defined by the category's array, with overridden names/descriptions where provided
3. The main `/integracje/` (or `/activities/`) listing page shows correct activity counts per category based on the new array length
4. All filters (participants, price, duration, activity type) work correctly within the scoped activity set
5. The old `categories[]` field on `Activities_Collection` is hidden from editors — the category document is the single management surface

**Verification**: Open a category in Sanity Studio, reorder activities, add an override description, publish, and verify the category page reflects the new order and overridden text.

## What We're NOT Doing

- Custom Sanity input component for bulk-adding activities (Sanity's default array UI is sufficient for now — adding a "select all unassigned" bulk UI is a future improvement)
- Removing `categories[]` from `Activities_Collection` schema entirely (kept hidden for backward compatibility and potential future use)
- Changing activity detail pages — only category listing pages are affected
- Changing the sort options available to visitors (we rename the default from "Popularity" to "Recommended" but keep all existing sort options)
- Automated two-way sync between `categories[]` on activities and `activities[]` on categories

## Implementation Approach

Add an `activities[]` array field to `ActivitiesCategory_Collection`. Each entry is an inline object with: activity reference, optional `nameOverride`, optional `descriptionOverride`. Array position = display order. Run a one-time migration script to populate the new arrays from existing `categories[]` references. Then rewrite all GROQ queries — category page listings, filter counts, category blocks — to read from the new array instead of scanning the Activities collection.

## Phase 1: Schema Change & Migration

### Overview

Add the `activities[]` field to the category schema, hide the legacy `categories[]` field on activities, and write + run a migration script to populate the new arrays from existing data.

### Changes Required:

#### 1. Add `activities[]` field to category schema

**File**: `apps/sanity/schema/collectionTypes/ActivitiesCategory_Collection.ts`

**Intent**: Add a new `activities` array field after the `image` field (line 75). Each array entry is an inline object with an activity reference, optional `nameOverride` string, and optional `descriptionOverride` text. Include uniqueness validation to prevent the same activity from appearing twice.

**Contract**: New field `activities` of type `array` containing objects of type `activityEntry`. Each entry has:

- `activity`: reference to `Activities_Collection`, required, language-filtered, `disableNew: true`
- `nameOverride`: optional string
- `descriptionOverride`: optional text (3 rows)
- Preview: shows override name or original activity name, subtitle shows "Oryginał: {name}" when overridden
- Validation: custom rule preventing duplicate activity references (compare `_ref` values across array items)

#### 2. Hide legacy `categories[]` on activities

**File**: `apps/sanity/schema/collectionTypes/Activities_Collection.ts`

**Intent**: Make the `categories` field hidden and readOnly so editors can no longer modify it, while keeping it in the schema for backward compatibility. Add a description explaining that category assignment is now managed from the category side.

**Contract**: Add `hidden: true` and `readOnly: true` to the `categories` field definition (line 167-193). Remove the `validation: Rule.required().min(1)` since hidden fields shouldn't block publishing.

#### 3. Write migration script

**File**: `apps/sanity/scripts/populate-category-activities.ts` (NEW)

**Intent**: One-time CLI script that reads all existing `Activities_Collection` documents, groups them by their category references, and populates each `ActivitiesCategory_Collection` document's new `activities[]` array with those references ordered by `popularityIndex desc`. Follows the established dry-run/apply pattern from existing migration scripts.

**Contract**: 

- CLI flags: `--apply` to execute (default is dry-run), `--force` to overwrite existing arrays
- For each category: query `*[_type == "Activities_Collection" && references($categoryId)] | order(popularityIndex desc)`, build `activities[]` entries with `_type: 'activityEntry'`, unique `_key`, and `activity._ref`
- Skip categories that already have a non-empty `activities[]` (unless `--force`)
- Log summary: categories processed, activities assigned, skipped

### Success Criteria:

#### Automated Verification:

- Schema changes compile: `cd apps/sanity && npm run build`
- TypeScript passes: `npm run lint` from root
- Migration script runs in dry-run mode without errors: `npx tsx apps/sanity/scripts/populate-category-activities.ts`

#### Manual Verification:

- Open a category document in Sanity Studio — the `activities[]` field is visible and functional (can add/remove/reorder entries)
- Open an activity document in Sanity Studio — the `categories[]` field is no longer visible
- Run migration with `--apply` — verify each category's `activities[]` array is populated with the correct activities in popularityIndex order
- Spot-check 2-3 categories: count matches the number of activities that previously referenced them

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 2: GROQ Query Rewrite

### Overview

Rewrite all GROQ queries to use the category's `activities[]` array as the source of truth instead of scanning `Activities_Collection` with `references()`. This includes the category page listing, filter count queries, category block counts, and the all-categories listing page.

### Changes Required:

#### 1. Rewrite category listing query

**File**: `apps/astro/src/components/activites/category/Listing.astro`

**Intent**: Replace the `Listing_Query` function. Instead of scanning all `Activities_Collection` documents and filtering by category reference, the new query dereferences the category's `activities[]` array. The function signature changes to accept the query context — it will now produce GROQ fragments that are meant to be embedded inside the `selectedCategory` subquery in `ActivitiesPage.astro`.

**Contract**: The `Listing_Query` function returns GROQ projections for these fields (all scoped to the category's `activities[]`):

- `"totalActivitiesByCategory"`: count of activities matching all current filters, using `count(activities[...filter conditions on activity->...])` 
- `"listing"`: dereferenced array with `coalesce(nameOverride, activity->.name)` and `coalesce(descriptionOverride, activity->.description)` for override resolution. Remaining fields (previewImage, slug, participantsCount, pricing, popularityIndex, _createdAt, publishedDate) dereferenced from `activity->`. Post-filtered by participants, price, activityType, duration, embeddings. When `orderClause` is `'popularityIndex desc'` (the default), omit the `| order()` clause to preserve array position order; for other sorts, apply `| order(orderClause)`.
- `"participantRangeCounts"`: faceted counts per participant group, each counting `activities[]` entries matching all filters except participants
- `"activityTypes"`: activity type list with counts, scoped to activities in this category
- `"durationCounts"`: full-day and hourly counts, scoped to this category's activities
- `"priceRange"`: min/max `additionalPersonPrice` from this category's activities

Key GROQ pattern for filter counts — every filter condition must dereference through `activity->`:

```groq
count(activities[
  defined(activity->._id)
  && (!defined($minPrice) || activity->.pricing.additionalPersonPrice >= $minPrice)
  && ...
])
```

For the `activityTypes` subquery: query `ActivitiesType_Collection` documents and for each, count how many of this category's activities have that type — use `count(^.^.activities[... && $typeSlug in activity->.activityType[]->slug.current])`.

#### 2. Restructure fetchData to nest listing inside selectedCategory

**File**: `apps/astro/src/templates/activities/ActivitiesPage.astro`

**Intent**: Move the `Listing_Query` GROQ fragment from the top level of the `Activities_Page` query into the `selectedCategory` subquery. This way listing data, filter counts, and activity types are fetched as part of the category document — matching the new data model where the category owns its activities.

**Contract**: The `selectedCategory` subquery (currently line 143-173) expands to include all `Listing_Query` projections. The template then reads listing data from `page.selectedCategory.listing`, `page.selectedCategory.totalActivitiesByCategory`, etc. instead of `page.listing`, `page.totalActivitiesByCategory`. Update all prop references in the template accordingly.

The `fetchData` return type and the component's `Props` type must be updated to reflect the new nesting. The `Listing` component receives props from `page.selectedCategory.`*.

#### 3. Update CategoryBlock count query

**File**: `apps/astro/src/components/ui/CategoryBlock.astro`

**Intent**: Change `referenceCount` from scanning Activities with `references()` to counting the category's own `activities[]` array length.

**Contract**: Replace `"referenceCount": count(*[_type == "Activities_Collection" && references(^._id)])` with `"referenceCount": count(activities)`.

#### 4. Update all-categories listing query

**File**: `apps/astro/src/components/activites/Listing.astro`

**Intent**: Update the categories index query (line 43-54) to filter out categories with empty `activities[]` arrays (instead of using `references()` to check for activities), and use the new count source.

**Contract**: Replace the filter condition `count(*[_type == 'Activities_Collection' && references(^._id)]) > 0` with `count(activities) > 0` in both the `totalItems` count and the `listing` query. The `CategoryBlockQuery` (already updated in step 3) handles the per-category count.

### Success Criteria:

#### Automated Verification:

- TypeScript compilation passes: `npm run lint` from root
- Astro build succeeds: `cd apps/astro && npm run build`

#### Manual Verification:

- Category page (`/pl/integracje/kategoria/team-building/`) shows activities in the order defined by the category's `activities[]` array
- All filters (participants, price, duration, activity type) produce correct counts and correctly filter the list
- Filter page (`/pl/integracje/kategoria/team-building/filtr?activityType=...`) works correctly
- Main listing page (`/pl/integracje/`) shows correct activity count per category (matching the `activities[]` array length)
- Categories with empty `activities[]` arrays do not appear on the main listing page
- Override names/descriptions appear correctly when set on a category's activity entry
- Same activity with different overrides shows different text on different category pages
- Search/embeddings sort still functions correctly on category pages

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 3: Sort Behavior & Frontend Polish

### Overview

Update the default sort behavior on category pages to use array order (instead of `popularityIndex desc`), rename the sort dropdown label, and ensure `ActivityCardQuery` properly passes through overridden fields.

### Changes Required:

#### 1. Update sort dropdown label

**File**: `apps/astro/src/components/activites/category/Listing.astro`

**Intent**: Rename the default sort option from "Popularity" / "Popularność" to "Recommended" / "Polecane" in the translations object and sort dropdown to reflect that the default order is now editor-curated, not algorithmically ranked.

**Contract**: Update the `translations` object — the popularity/default sort label changes from `Popularność` / `Popularity` to `Polecane` / `Recommended`. The `Dropdown` component receives the updated label. The underlying order type `'popularity'` can remain unchanged in code — only the user-facing label changes.

#### 2. Update getOrderClause for category context

**File**: `apps/astro/src/utils/filters.ts`

**Intent**: When on a category page with default sort, `getOrderClause` should return a sentinel value (e.g., empty string or `null`) that `Listing_Query` interprets as "preserve array order" (no `| order()` clause). Other sort options (newest, priceAsc, priceDesc, searchMatching) continue to return their existing GROQ order clauses.

**Contract**: `getOrderClause('popularity')` returns `''` (empty string) when called in category context. The `Listing_Query` function checks: if orderClause is empty, omit the `| order()` pipe; otherwise apply it. The `type` parameter of `getOrderClause` (currently `'activities' | 'hotels' | 'eventSpaces'`) can be used to distinguish context, or a new boolean parameter `preserveArrayOrder` is added.

#### 3. Verify ActivityCard renders overrides transparently

**File**: `apps/astro/src/components/ui/ActivityCard/index.tsx`

**Intent**: Confirm that no changes are needed to `ActivityCard` itself because overrides are resolved at the GROQ level via `coalesce()`. The component receives `name` and `description` as before — it never knows whether these are original or overridden values.

**Contract**: No code changes. Verification only: the `ActivityCardProps` type (`name: string`, `description?: string`) already matches what the GROQ `coalesce()` produces. The `ActivityCardQuery` export is still used for dereferencing activity fields within the new array projection.

### Success Criteria:

#### Automated Verification:

- TypeScript compilation passes: `npm run lint` from root
- Astro build succeeds: `cd apps/astro && npm run build`

#### Manual Verification:

- Category page default sort shows activities in the array order (editor-defined), not by popularityIndex
- Sort dropdown shows "Polecane" (PL) / "Recommended" (EN) as the default option
- Selecting "Najnowsze" / "Newest" re-sorts activities by date
- Selecting "Cena" / "Price" sorts re-sort by price
- After changing sort and returning to default, array order is restored
- Activity cards display overridden name/description when set

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 4: End-to-End Verification

### Overview

Comprehensive testing across both languages, all routes, edge cases, and SEO verification.

### Changes Required:

No code changes. This phase is verification-only.

#### 1. Cross-language verification

**Intent**: Verify both PL and EN category pages work correctly with the new model.

#### 2. Edge case testing

**Intent**: Test empty categories, single-activity categories, categories with all overrides, and categories with no overrides.

#### 3. SEO spot-check

**Intent**: Verify that the same activity shows different descriptions on different category pages (when overrides are set), confirming the SEO differentiation goal.

### Success Criteria:

#### Automated Verification:

- Full build succeeds: `npm run build` from root
- Lint passes: `npm run lint` from root

#### Manual Verification:

- PL category page works: `/pl/integracje/kategoria/team-building/`
- EN category page works: `/en/activities/category/team-building/`
- Filter route works: `/pl/integracje/kategoria/team-building/filtr?activityType=...`
- Main listing PL works: `/pl/integracje/`
- Main listing EN works: `/en/activities/`
- Empty category (no activities in array) does not appear in the main listing
- Category with one activity shows correctly
- Activity with overridden name on category A shows different name than on category B
- Activity with overridden description on category A shows different description than on category B
- Activity detail page (individual `/integracje/[slug]`) is unaffected — shows original name/description
- Sanity Studio: editor can add an activity to a category, reorder it, set overrides, publish, and see changes on the website

---

## Testing Strategy

### Unit Tests:

- Migration script dry-run produces correct output for a known set of test data
- `Listing_Query` GROQ output is syntactically valid (can be parsed by Sanity client)

### Integration Tests:

- Category page with filters returns correct activity counts
- Category page with overrides shows overridden values
- Main listing page correctly counts activities per category
- Empty categories are excluded from the main listing

### Manual Testing Steps:

1. Open Sanity Studio, navigate to a category, verify `activities[]` field is present and populated after migration
2. Reorder activities in the array, publish, verify the category page reflects the new order
3. Add a `nameOverride` and `descriptionOverride` to an activity entry, publish, verify the category page shows the overrides
4. Apply filters on the category page — verify counts and results are correct
5. Check the main `/integracje/` page — verify activity counts per category match the array lengths
6. Verify both PL and EN pages work identically
7. Verify the sort dropdown shows "Polecane"/"Recommended" and functions correctly

## Performance Considerations

- **GROQ dereferencing**: The new query pattern dereferences through `activity->` for each array entry. For categories with many activities (e.g., 50+), this is comparable to the current collection scan. Sanity CDN caches these effectively.
- **Category document size**: Adding an `activities[]` array of references + optional strings adds minimal bytes per category document. Even with 100 activities, the document remains well under Sanity's 16MB limit.
- **Filter count queries**: The faceted count queries (6-8 subqueries) now operate on the array instead of the collection. This should be similar or faster since the working set is pre-filtered to the category's activities.

## Migration Notes

- Run migration script on staging first: `npx tsx apps/sanity/scripts/populate-category-activities.ts`
- Verify staging data, then run with `--apply` on production
- The migration is additive — it populates a new field without modifying existing data
- If needed, `--force` flag overwrites existing `activities[]` arrays (useful for re-running after corrections)
- After migration and GROQ rewrite deployment, the `categories[]` field on activities becomes vestigial but harmless

## References

- Related research: `context/changes/per-category-activity-management/research.md`
- Category schema: `apps/sanity/schema/collectionTypes/ActivitiesCategory_Collection.ts`
- Activity schema: `apps/sanity/schema/collectionTypes/Activities_Collection.ts`
- Category listing query: `apps/astro/src/components/activites/category/Listing.astro:148-273`
- Category page template: `apps/astro/src/templates/activities/ActivitiesPage.astro:82-191`
- CategoryBlock query: `apps/astro/src/components/ui/CategoryBlock.astro:4-14`
- Categories listing query: `apps/astro/src/components/activites/Listing.astro:43-54`
- Activity card component: `apps/astro/src/components/ui/ActivityCard/index.tsx:5-22`
- Sort utilities: `apps/astro/src/utils/filters.ts:152-186`
- Existing migration scripts: `apps/sanity/scripts/migrate-contact-form-overrides.ts`, `apps/sanity/scripts/create-event-space-variants.ts`
- Bandwidth research: `context/changes/sanity-bandwidth-optimization/research.md`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append  `— <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Schema Change & Migration

#### Automated

- 1.1 Schema changes compile: `cd apps/sanity && npm run build` — 720cb6c
- 1.2 TypeScript passes: `npm run lint` from root — 720cb6c
- 1.3 Migration script runs in dry-run mode without errors — 720cb6c

#### Manual

- 1.4 Category document in Studio shows functional `activities[]` field — 720cb6c
- 1.5 Activity document in Studio hides `categories[]` field — 720cb6c
- 1.6 Migration populates correct activities in popularityIndex order — 720cb6c
- 1.7 Spot-check 2-3 categories for correct activity counts — 720cb6c

### Phase 2: GROQ Query Rewrite

#### Automated

- 2.1 TypeScript compilation passes: `npm run lint` — 8ce0423
- 2.2 Astro build succeeds: `cd apps/astro && npm run build` — 8ce0423

#### Manual

- 2.3 Category page shows activities in array order — 8ce0423
- 2.4 All filters produce correct counts and results — 8ce0423
- 2.5 Filter route works correctly — 8ce0423
- 2.6 Main listing page shows correct per-category counts — 8ce0423
- 2.7 Empty categories excluded from main listing — 8ce0423
- 2.8 Override names/descriptions render correctly — 8ce0423
- 2.9 Search/embeddings sort still functions — 8ce0423

### Phase 3: Sort Behavior & Frontend Polish

#### Automated

- [x] 3.1 TypeScript compilation passes: `npm run lint`
- [x] 3.2 Astro build succeeds: `cd apps/astro && npm run build`

#### Manual

- [x] 3.3 Default sort uses array order, not popularityIndex
- [x] 3.4 Sort dropdown shows "Polecane" / "Recommended"
- [x] 3.5 All sort options function correctly
- [x] 3.6 Activity cards display overridden values

### Phase 4: End-to-End Verification

#### Automated

- 4.1 Full build succeeds: `npm run build`
- 4.2 Lint passes: `npm run lint`

#### Manual

- 4.3 PL category page works
- 4.4 EN category page works
- 4.5 Filter routes work for both languages
- 4.6 Main listing works for both languages
- 4.7 Empty category exclusion works
- 4.8 Different overrides show on different category pages (SEO verification)
- 4.9 Activity detail pages unaffected
- 4.10 Full editor workflow: add, reorder, override, publish, verify on site

