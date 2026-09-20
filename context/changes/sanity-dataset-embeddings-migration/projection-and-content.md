---
date: 2026-09-20T07:07:15+02:00
researcher: Codex with three research subagents
git_commit: fc9ee20e1d61150db9a9f22126b4b86d0d2feb69
branch: main
repository: fabryka-atrakcji
topic: "Migration from Sanity Embeddings Index API to Dataset Embeddings"
tags: [research, sanity, embeddings, semantic-search]
status: complete
last_updated: 2026-09-20
last_updated_by: Codex
---

# Projection and content design

> **Scope revision — 2026-09-20:** This document preserves historical research. The current [plan](plan.md) and [decisions](decisions.md) use existing name/title/description/main content only. Earlier recommendations for materialized reference labels, hidden fields, synchronization, backfills or isolated datasets are superseded. Reference-only relevance cases are exploratory, not launch requirements.

## Verified old configuration

[legacy-indexes.json](legacy-indexes.json) records both live configurations. Both require their collection type, `defined(slug.current)`, and root `doNotIndex != true`. They contain no locale restriction. Both were active with zero reported failed documents; initial indexing counters are historical and must not be read as current inventory totals.

| Area | Legacy embedding input | Current evidence and implication |
| --- | --- | --- |
| Activity identity | name, title, description | Available on all 92 published-ID records sampled through aggregate coverage |
| Activity categories | `categories[]->` names, heading, descriptions | Legacy activity-owned references remain populated, but current ownership is category.activities[] |
| Activity type | `activityType[]->name` | Important candidate for materialized labels |
| Activity location | `location.customLocation` | No longer in schema, still present in 54 published-ID documents; omission would lose historical text |
| Hotel references | `amenities[]->name`, `location->name` | All 125 published-ID hotels have these refs; new projections cannot expand them |
| Hotel capacity | `maxPeople.banquete` | Current schema field is `banquet`; correct spelling deliberately |
| Visibility | root `doNotIndex` | Editor field is nested `seo.doNotIndex`; do not silently equate SEO and internal discovery |

Evidence: [apps/sanity/schema/collectionTypes/Activities_Collection.ts:168](https://github.com/kryptonum-dev/fabryka-atrakcji/blob/fc9ee20e1d61150db9a9f22126b4b86d0d2feb69/apps/sanity/schema/collectionTypes/Activities_Collection.ts#L168), [apps/sanity/schema/collectionTypes/ActivitiesCategory_Collection.ts:99](https://github.com/kryptonum-dev/fabryka-atrakcji/blob/fc9ee20e1d61150db9a9f22126b4b86d0d2feb69/apps/sanity/schema/collectionTypes/ActivitiesCategory_Collection.ts#L99), [apps/sanity/schema/collectionTypes/Hotels_Collection.ts:263](https://github.com/kryptonum-dev/fabryka-atrakcji/blob/fc9ee20e1d61150db9a9f22126b4b86d0d2feb69/apps/sanity/schema/collectionTypes/Hotels_Collection.ts#L263), [apps/sanity/schema/ui/seo.tsx:42](https://github.com/kryptonum-dev/fabryka-atrakcji/blob/fc9ee20e1d61150db9a9f22126b4b86d0d2feb69/apps/sanity/schema/ui/seo.tsx#L42).

## Recommended representation to evaluate

This is a proposed content contract, not deployed schema or a ready-to-enable configuration:

| Type | Existing direct content | Proposed stored semantic context |
| --- | --- | --- |
| Activities_Collection | name, heading/title, description, spoken languages, location address, retained useful customLocation text | Activity-type names; optional category names after evaluation |
| Hotels_Collection | name, heading/title, description, address city/region, relevant capacity/room/star facts | Amenity names and location name |

Use descriptive field names; keep locale eligibility in the query. `language` is document locale, while `languages[]` describes languages available for an activity. A visitor browsing EN pages can still choose an activity delivered in Polish; those are different concepts.

Title uses Portable Text heading blocks ([apps/sanity/schema/ui/PortableText/Heading.tsx:5](https://github.com/kryptonum-dev/fabryka-atrakcji/blob/fc9ee20e1d61150db9a9f22126b4b86d0d2feb69/apps/sanity/schema/ui/PortableText/Heading.tsx#L5)). Evaluate projecting useful text without editor formatting noise. Avoid `components` wholesale: it contains shared forms and marketing content that can overwhelm item identity. Numeric price/room facts remain strict facets; do not promise semantic matching enforces numeric bounds.

## Reference synchronization requirements

If planning adopts stored labels, add real schema fields, populate existing documents, and keep them synchronized when the referenced name, reference list, or document language changes. A one-time migration is insufficient. Decide how publish/unpublish/delete and translation updates invalidate stored context. Prefer idempotent updates that do not cause recursive recomputation loops.

For category context, reverse membership must use current category.activities[].activity. Decide how a globally searched activity represents different per-category names/descriptions before embedding overrides; embedding every override without evaluation can create noise. Initial recommendation is base activity identity plus activity types, with category context conditional on observed need.

The alternative baseline omits referenced labels entirely and needs no content mutation. It is simpler but loses signals the old index already supplied; use it as an evaluation control, not an assumed equivalent replacement.

## Candidate projection rules

Use one type-conditional projection for the two supported collections. Exclude unrelated types by keeping fields inside conditions. Do not add missing reference aliases such as `amenityNames` before they exist as stored fields. Before enabling, validate the proposed projection over actual content and record text length/coverage; coverage of a reference does not prove its target exists or has the right locale.

## Policy dependencies

Open questions 1 and 2 in [research.md](research.md) govern reference context and noindex semantics. The coverage results do not establish category freshness, semantic quality, or expected rankings.
