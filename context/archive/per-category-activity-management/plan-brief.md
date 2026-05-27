# Per-Category Activity Management — Plan Brief

> Full plan: `context/changes/per-category-activity-management/plan.md`
> Research: `context/changes/per-category-activity-management/research.md`

## What & Why

Add an `activities[]` array on `ActivitiesCategory_Collection` so editors can manage activity assignment, ordering, and optional name/description overrides from within the category editor. Currently, adding activities to a new category requires editing every activity individually (burning Sanity API limits), all categories show the same activity order (global `popularityIndex`), and all categories show identical activity descriptions (hurting SEO when the same content appears across Warsaw/Kraków/Poznań tabs).

## Starting Point

The activity→category relationship is stored only on the activity side (`Activities_Collection.categories[]`). Categories have no reverse reference — activity membership is resolved at query time via GROQ `references()`. A single global `popularityIndex` number (0-100) determines order everywhere. A single global `description` text field is shown identically on all category pages.

## Desired End State

Editors open a category in Sanity Studio and see a drag-to-reorder list of activities. They can add/remove activities, control display order per-category, and optionally override each activity's name and description for SEO differentiation. Category pages on the website reflect these per-category choices. The main listing page shows accurate counts based on the new array.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
|---|---|---|---|
| Relationship direction | Category owns activities (new `activities[]` array) | Enables bulk management from one document instead of editing N activities | Research |
| Legacy `categories[]` on Activities | Hidden + readOnly (not deleted) | Avoids breaking changes while removing it from editor workflow | Plan |
| Default sort on category pages | Array order (editor-defined) | Per-category ordering is the core feature request | Plan |
| Sort dropdown label | Rename "Popularity" → "Recommended" | Reflects that default order is now curated, not algorithmic | Plan |
| Uniqueness validation | Prevent duplicate activities in same category | Same activity twice makes no sense; prevents data bugs | Plan |
| Empty `activities[]` fallback | Show empty state (no fallback) | Forces clean single source of truth; migration handles pre-population | Plan |
| Category block count source | New array length (`count(activities)`) | Consistent with the new model; no mixed old/new logic | Plan |
| All-categories listing | Updated to use new model | Full migration to avoid inconsistency between pages | Plan |

## Scope

**In scope:**
- New `activities[]` field on `ActivitiesCategory_Collection` with per-entry overrides
- Hide `categories[]` on `Activities_Collection`
- Migration script to populate new arrays from existing data
- GROQ query rewrite for category pages, filter counts, category blocks, and all-categories listing
- Default sort behavior change (array order) and dropdown label update

**Out of scope:**
- Custom bulk-add UI in Sanity Studio (Sanity's default array UI is sufficient for now)
- Removing `categories[]` from schema entirely
- Changes to activity detail pages
- Automated two-way sync between old and new relationship fields

## Architecture / Approach

The new `activities[]` array on `ActivitiesCategory_Collection` is an array of inline objects (`activityEntry`) each containing: a reference to `Activities_Collection`, optional `nameOverride`, and optional `descriptionOverride`. Array position = display order. GROQ queries change from scanning all activities with `references(categoryId)` to dereferencing `category.activities[]` with `coalesce()` for override resolution. Filter count queries scope to the category's activities array instead of the full collection.

## Phases at a Glance

| Phase | What it delivers | Key risk |
|---|---|---|
| 1. Schema Change & Migration | New field in Studio + populated data from existing relationships | Migration must correctly map all existing references |
| 2. GROQ Query Rewrite | Category pages, filters, and counts use new model | Complex GROQ with array dereferencing and faceted counts |
| 3. Sort Behavior & Frontend Polish | Editor-defined order as default, renamed dropdown | Sort sentinel value must correctly preserve/override array order |
| 4. End-to-End Verification | Full cross-language, edge case, and SEO verification | No new code — testing only |

**Prerequisites:** Migration script must run on production Sanity dataset before deploying the GROQ query changes (Phase 1 before Phase 2 deployment).
**Estimated effort:** ~13-17h across 4 phases

## Open Risks & Assumptions

- Dual source of truth during transition: `categories[]` on activities may drift from `activities[]` on categories over time. Mitigated by hiding `categories[]` from editors.
- GROQ array dereferencing performance on categories with 50+ activities is untested at scale — Sanity CDN should handle this, but needs verification.
- Faceted filter count queries are the most complex part of the rewrite — each requires `activity->` dereferencing through multiple nested conditions.

## Success Criteria (Summary)

- Editor can manage a category's activities entirely from the category document: add, remove, reorder, override name/description
- Category page shows activities in the editor-defined order with correct overrides
- All filters, counts, and sort options work correctly on the new model
