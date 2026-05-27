---
date: 2026-05-27T12:00:00+02:00
researcher: Claude Code
git_commit: 0ae0374a010c485158fefdc8249f029afec04c2e
branch: main
repository: fabryka-atrakcji
topic: "Per-category activity management: ordering, overrides, and bulk assignment"
tags: [research, sanity-schema, activities, categories, ordering, seo]
status: complete
last_updated: 2026-05-27
last_updated_by: Claude Code
---

# Research: Per-Category Activity Management

**Date**: 2026-05-27T12:00:00+02:00
**Researcher**: Claude Code
**Git Commit**: 0ae0374a010c485158fefdc8249f029afec04c2e
**Branch**: main
**Repository**: fabryka-atrakcji

## Research Question

The client wants to:
1. Add/remove activities from within a category editing view (instead of editing each activity individually)
2. Control activity ordering per-category (currently global `popularityIndex` means same order everywhere)
3. Override activity names/descriptions per-category (for SEO — same content across Warsaw/Kraków/Poznań hurts rankings)
4. Reduce Sanity API call overhead when managing a new category

## Summary

The current architecture stores the activity→category relationship on the **activity side** (`Activities_Collection.categories[]`). Categories have no knowledge of which activities belong to them — this is resolved at query time via GROQ `references()`. Activities have a single global `popularityIndex` (0-100) and a single global `description` field. There is no mechanism for per-category ordering or per-category content overrides.

The solution is to add an `activities[]` array on `ActivitiesCategory_Collection` that holds per-category entries with: activity reference, display order (via array position), and optional name/description overrides.

## Detailed Findings

### 1. Current Document Types

**`Activities_Collection`** (`apps/sanity/schema/collectionTypes/Activities_Collection.ts`)
- Main activity document (577 lines)
- `categories` (line 168-193): array of references to `ActivitiesCategory_Collection` — the **only** place the activity↔category relationship is stored
- `popularityIndex` (line 427-435): number 0-100, default 20. Single global value — no per-category variant
- `description` (line 88-93): single text field, min 75 chars. Shown on all category listings identically
- `name` (line 65-70): single string — activity name for referencing/sharing

**`ActivitiesCategory_Collection`** (`apps/sanity/schema/collectionTypes/ActivitiesCategory_Collection.ts`)
- Category document (149 lines)
- `orderRankField` (line 3, 17): from `@sanity/orderable-document-list` — controls tab ordering only, NOT activity ordering within tab
- Has `heading`, `description.long`, `description.short`, `image`, `components`, `formOverrides`, `seo`
- **No field referencing activities** — zero reverse relationship

**`ActivitiesType_Collection`** (`apps/sanity/schema/collectionTypes/ActivitiesType_Collection.ts`)
- Simple taxonomy (name + slug) for filtering. Not relevant to this change.

**`Activities_Page`** (`apps/sanity/schema/singleTypes/Activities_Page.ts`)
- Singleton listing page. Contains `activitiesCarousel` (hand-picked featured activities) and `noResults.highlightedCategories`.

### 2. Current GROQ Queries

**Category listing query** (`apps/astro/src/components/activites/category/Listing.astro`, line 148-273):
```groq
"listing": *[_type == 'Activities_Collection'
  && language == $language
  && select(defined($category) => categories[] -> slug.current match $category + "$", true)
  && ...filters...
] {
  ...ActivityCardQuery
} | order(popularityIndex desc)
```

Key observation: activities are fetched by scanning ALL `Activities_Collection` documents and filtering by category slug match. Order is always `popularityIndex desc` (default) or user-selected sort option.

**Categories index query** (`apps/astro/src/components/activites/Listing.astro`, line 43-54):
```groq
*[_type == 'ActivitiesCategory_Collection'
  && language == $language
  && count(*[_type == 'Activities_Collection' && references(^._id)]) > 0
] | order(orderRank asc)
```

**Category page template** (`apps/astro/src/templates/activities/ActivitiesPage.astro`, line 82-191):
- Fetches `Activities_Page` singleton + `selectedCategory` by slug
- Inline-queries `Listing_Query(orderClause)` for all matching activities
- Category data includes: `name`, `slug`, `heading`, `description.long`, `overwriteActivityPageComponents`, `components`, `formOverrides`

### 3. Ordering Mechanism

- **Category tab ordering**: `orderRank` via `@sanity/orderable-document-list` — drag-to-reorder in Studio
- **Activity ordering within category**: `popularityIndex desc` (global) or user-selected sort (popularity/newest/price)
- **No per-category activity ordering exists**

### 4. Studio Desk Structure

(`apps/sanity/structure/index.tsx`, line 15-28):
- "Integracje" section groups: Activities_Page singleton, Activities_Collection (by language), ActivitiesCategory_Collection (orderable, by language), ActivitiesType_Collection

### 5. Relationship Architecture (Current)

```
Activities_Collection
  └─ categories[] ──reference──> ActivitiesCategory_Collection
  └─ popularityIndex (GLOBAL, 0-100)
  └─ description (GLOBAL text)

ActivitiesCategory_Collection
  └─ orderRank (tab ordering only)
  └─ (NO reverse references to activities)
```

Query direction: category pages scan ALL activities filtering by `references(categoryId)`.

## Code References

- `apps/sanity/schema/collectionTypes/Activities_Collection.ts:168-193` — categories[] array of references
- `apps/sanity/schema/collectionTypes/Activities_Collection.ts:427-435` — popularityIndex field
- `apps/sanity/schema/collectionTypes/Activities_Collection.ts:88-93` — description field
- `apps/sanity/schema/collectionTypes/ActivitiesCategory_Collection.ts:1-149` — full category schema
- `apps/sanity/schema/collectionTypes/ActivitiesCategory_Collection.ts:17` — orderRankField
- `apps/astro/src/components/activites/category/Listing.astro:148-273` — Listing_Query with category filter
- `apps/astro/src/components/activites/category/Listing.astro:191-192` — category slug matching
- `apps/astro/src/components/activites/Listing.astro:43-54` — categories index query
- `apps/astro/src/templates/activities/ActivitiesPage.astro:82-191` — fetchData for category pages
- `apps/astro/src/templates/activities/ActivitiesPage.astro:143-173` — selectedCategory GROQ subquery
- `apps/sanity/structure/index.tsx:15-28` — desk structure

## Architecture Insights

1. **One-directional relationship**: Activity→Category only. No reverse. This is why adding a new category requires editing every activity.
2. **Global ordering**: `popularityIndex` is a single number on each activity. Same rank in Team Building, Wyjazdy, Konferencje.
3. **Global descriptions**: One `description` per activity. Google sees identical text for the same activity across all category tabs.
4. **Category already supports per-category customization** — but only for page-level things (components, form overrides, heading). NOT for individual activity appearance.
5. **`@sanity/orderable-document-list` v1.3.5** is already installed — can potentially be leveraged for drag-to-reorder within the new activities array (but array position is simpler).

## Implementation Plan

### Approach: Add `activities[]` array on `ActivitiesCategory_Collection`

Add an array of inline objects on the category document. Each object references an activity and optionally overrides its name/description. Array order = display order.

```
ActivitiesCategory_Collection
  └─ activities[] (NEW)
       └─ activity: reference → Activities_Collection
       └─ nameOverride: string (optional)
       └─ descriptionOverride: text (optional)
```

### Why This Approach

| Alternative | Why not |
|---|---|
| Keep activity-side only, add per-category rank fields | Doesn't solve bulk management; explodes field count as categories grow |
| Junction/bridge documents | Over-engineered; Sanity arrays handle this natively |
| Move to category-side only, remove activity.categories[] | Too disruptive; breaks existing filters, validation, and Studio UX |

The chosen approach is **additive** — existing `categories[]` on activities can remain as a secondary/computed source, while the category document becomes the primary management surface.

### Step-by-Step Plan

#### Phase 1: Schema Change (Sanity)

**File: `apps/sanity/schema/collectionTypes/ActivitiesCategory_Collection.ts`**

Add a new field `activities` after the `image` field (line 75):

```typescript
defineField({
  name: 'activities',
  type: 'array',
  title: 'Integracje w tej kategorii',
  description: 'Lista integracji przypisanych do tej kategorii. Kolejność na liście = kolejność wyświetlania na stronie. Opcjonalnie możesz nadpisać nazwę i opis dla lepszego SEO.',
  of: [
    {
      type: 'object',
      name: 'activityEntry',
      fields: [
        defineField({
          name: 'activity',
          type: 'reference',
          to: [{ type: 'Activities_Collection' }],
          title: 'Integracja',
          validation: (Rule) => Rule.required(),
          options: {
            disableNew: true,
            filter: ({ document }) => {
              const language = (document as { language?: string })?.language
              return {
                filter: 'language == $lang',
                params: { lang: language },
              }
            },
          },
        }),
        defineField({
          name: 'nameOverride',
          type: 'string',
          title: 'Nadpisana nazwa (opcjonalnie)',
          description: 'Jeśli uzupełnione, ta nazwa będzie wyświetlana zamiast oryginalnej nazwy integracji w tej kategorii.',
        }),
        defineField({
          name: 'descriptionOverride',
          type: 'text',
          title: 'Nadpisany opis (opcjonalnie)',
          description: 'Jeśli uzupełnione, ten opis będzie wyświetlany zamiast oryginalnego opisu integracji w tej kategorii.',
          rows: 3,
        }),
      ],
      preview: {
        select: {
          activityName: 'activity.name',
          nameOverride: 'nameOverride',
          image: 'activity.imageList.0',
        },
        prepare: ({ activityName, nameOverride, image }) => ({
          title: nameOverride || activityName || 'Wybierz integrację',
          subtitle: nameOverride ? `Oryginał: ${activityName}` : undefined,
          media: image,
        }),
      },
    },
  ],
})
```

**Key design decisions:**
- Array position = display order (no separate rank field needed — Sanity arrays are drag-to-reorder natively)
- `nameOverride` and `descriptionOverride` are optional — if empty, the original activity values are used
- Language filtering ensures only same-language activities can be selected
- Preview shows the override name (or original) + subtitle showing what was overridden

#### Phase 2: Data Migration Script

**New file: `apps/sanity/scripts/populate-category-activities.ts`**

For each `ActivitiesCategory_Collection` document:
1. Query all `Activities_Collection` documents that reference this category
2. Sort by `popularityIndex desc` (current default order)
3. Populate the new `activities[]` array with references in that order
4. No overrides initially — just establish the baseline

```typescript
// Pseudo-code
for each category:
  activities = query('*[_type == "Activities_Collection" && references($categoryId)] | order(popularityIndex desc)', { categoryId: category._id })
  patch(category._id, {
    set: {
      activities: activities.map(a => ({
        _type: 'activityEntry',
        _key: generateKey(),
        activity: { _type: 'reference', _ref: a._id },
      }))
    }
  })
```

#### Phase 3: GROQ Query Update (Astro)

**File: `apps/astro/src/components/activites/category/Listing.astro`**

The `Listing_Query` function needs to change from scanning all activities to reading the category's `activities[]` array. Two scenarios:

**A. Category page (with `$category` defined):**
Replace the current filter-scan approach with a category-centric fetch:

```groq
// NEW: Fetch from category's activities array
"listing": *[_type == 'ActivitiesCategory_Collection' && slug.current == $categorySlug][0].activities[] {
  "activity": activity-> {
    ${ActivityCardQuery}
  },
  nameOverride,
  descriptionOverride,
  // Apply filters on dereferenced activity
} [
  // Post-filter: participants, price, duration, activityType
  defined(activity) 
  && ...filter conditions on activity...
]
```

The key GROQ pattern: dereference the array, apply overrides via `coalesce(nameOverride, activity.name)`, maintain array order (which becomes display order).

**Detailed GROQ rewrite:**

```groq
// For category pages: read from category.activities[] with overrides
"listing": *[_type == 'ActivitiesCategory_Collection' && slug.current == $categorySlug][0].activities[] {
  "_id": activity->._id,
  "name": coalesce(nameOverride, activity->.name),
  "description": coalesce(descriptionOverride, activity->.description),
  "previewImage": activity->.previewImage,  // or however ActivityCardQuery resolves it
  "slug": activity->.slug.current,
  "participantsCount": activity->.participantsCount,
  "pricing": activity->.pricing,
  "popularityIndex": activity->.popularityIndex,
  "_createdAt": activity->._createdAt,
  "publishedDate": activity->.publishedDate,
  "_score": $embeddingResults[value.documentId == activity->._id][0].score
} [
  defined(_id)
  && (!defined($minParticipants) || participantsCount.max >= $minParticipants)
  && (!defined($maxParticipants) || participantsCount.min <= $maxParticipants)
  && (!defined($minPrice) || pricing.additionalPersonPrice >= $minPrice)
  && (!defined($maxPrice) || pricing.additionalPersonPrice <= $maxPrice)
  && (!defined($activityType) || $activityType in activity->.activityType[]->slug.current)
  && (!defined($duration) || ($duration == 24 && activity->.duration.isFullDay == true) || ($duration < 24 && activity->.duration.hours == $duration))
  && (!defined($embeddingResults) || activity->._id in $embeddingResults[].value.documentId)
]
```

When the user selects a different sort order (price, newest), apply `| order(...)` on top.
When default (popularity), **preserve array order** (no `order()` clause — array position IS the order).

**B. All-activities page (no `$category`):**
Keep existing behavior — scan all activities with `popularityIndex desc`.

**File: `apps/astro/src/templates/activities/ActivitiesPage.astro`**

Update the `selectedCategory` subquery (line 143-173) to also fetch the `activities[]` array:

```groq
"selectedCategory": *[_type == "ActivitiesCategory_Collection" && slug.current == $categorySlug][0] {
  name,
  "slug": slug.current,
  ...existing fields...,
  "activities": activities[] {
    "activity": activity-> {
      ${ActivityCardQuery}
    },
    nameOverride,
    descriptionOverride,
  }
}
```

#### Phase 4: Frontend Component Update

**File: `apps/astro/src/components/ui/ActivityCard/index.tsx`**

The `ActivityCardProps` type needs to accept optional overrides:
- `nameOverride?: string`
- `descriptionOverride?: string`

The component renders `nameOverride || name` and `descriptionOverride || description`.

Alternatively, resolve this in the GROQ query itself (using `coalesce()`) so the frontend doesn't need changes — this is the cleaner approach.

#### Phase 5: Filter Count Queries

The `Listing_Query` also computes filter counts (`participantRangeCounts`, `activityTypes`, `durationCounts`, `priceRange`). These currently scan all activities matching the category. They should be updated to count only activities that are in the category's `activities[]` array:

```groq
// Instead of:
count(*[_type == 'Activities_Collection' && ...references(category)... && ...filters...])

// Use:
count(*[_type == 'ActivitiesCategory_Collection' && slug.current == $categorySlug][0].activities[].activity-> [
  ...filter conditions...
])
```

This is the most complex part of the GROQ rewrite and needs careful testing.

#### Phase 6: Keep `categories[]` on Activities in Sync (Optional)

Two options:
1. **Keep `categories[]` on `Activities_Collection` as-is** — used for the "all activities" page and as a secondary reference. Editors must still ensure consistency.
2. **Make `categories[]` computed/hidden** — derive from which categories include this activity in their `activities[]` array. More complex but eliminates dual-maintenance.

**Recommendation:** Start with option 1. The `categories[]` field on activities can remain as a "secondary index" — useful for the all-activities page filters. Add a note in the Studio UI that category assignment is now managed from the category side.

### Risk Assessment

| Risk | Mitigation |
|---|---|
| Dual source of truth (activity.categories[] vs category.activities[]) | Migration script ensures initial sync; document both in Studio descriptions |
| Complex GROQ rewrite | Test thoroughly with current filters; write GROQ unit tests |
| Empty `activities[]` on category (before migration) | Fallback: if `activities[]` is empty, use current scan-all approach |
| Performance: dereferencing array of refs vs scanning collection | Should be comparable or faster — Sanity CDN handles this well |
| Sanity bandwidth: larger category documents | Minimal — array of refs + optional strings is small |

### Estimated Effort

| Phase | Effort |
|---|---|
| Schema change | ~1h |
| Migration script | ~2h |
| GROQ query rewrite | ~4-6h (most complex part) |
| Frontend adjustments | ~1h |
| Filter count queries | ~2-3h |
| Testing & QA | ~3-4h |
| **Total** | **~13-17h** |

## Open Questions

1. **Should `categories[]` on `Activities_Collection` remain editable or become read-only?** If kept editable, there's a sync risk. If hidden, the "all activities" page filters need an alternative data source.
2. **Should we validate uniqueness of activity references within a category's `activities[]`?** (Probably yes — same activity appearing twice in one category makes no sense.)
3. **Should the migration script run as a one-time Sanity CLI script or as a Studio action?** CLI script is simpler for initial migration.
4. **Do we need to update the sitemap generation?** Probably not — category pages and activity pages already exist.
5. **Should we add a "bulk add" UI in the category editor?** Sanity's default array UI allows adding one reference at a time. For bulk operations, a custom input component could list all unassigned activities with checkboxes. This would be a nice UX improvement but adds scope.
