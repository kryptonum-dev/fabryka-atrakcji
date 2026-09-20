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

# File impact map

> **Scope revision — 2026-09-20:** This document preserves historical research. The current [plan](plan.md) and [decisions](decisions.md) use existing name/title/description/main content only. Earlier recommendations for materialized reference labels, hidden fields, synchronization, backfills or isolated datasets are superseded. Reference-only relevance cases are exploratory, not launch requirements.

This is a planning inventory, not a promise that every file must change.

| File | Role / likely migration action |
| --- | --- |
| [apps/astro/src/pages/api/embeddings.ts:12](https://github.com/kryptonum-dev/fabryka-atrakcji/blob/fc9ee20e1d61150db9a9f22126b4b86d0d2feb69/apps/astro/src/pages/api/embeddings.ts#L12) | Replace provider or become thin wrapper around typed helper |
| [apps/astro/src/utils/filters.ts:187](https://github.com/kryptonum-dev/fabryka-atrakcji/blob/fc9ee20e1d61150db9a9f22126b4b86d0d2feb69/apps/astro/src/utils/filters.ts#L187) | Correct result typing; remove self HTTP dependency and null/error ambiguity |
| [apps/astro/src/templates/activities/CategoriesPage.astro:51](https://github.com/kryptonum-dev/fabryka-atrakcji/blob/fc9ee20e1d61150db9a9f22126b4b86d0d2feb69/apps/astro/src/templates/activities/CategoriesPage.astro#L51) | Pass locale; consume explicit success/error state |
| [apps/astro/src/templates/hotels/HotelsPage.astro:31](https://github.com/kryptonum-dev/fabryka-atrakcji/blob/fc9ee20e1d61150db9a9f22126b4b86d0d2feb69/apps/astro/src/templates/hotels/HotelsPage.astro#L31) | Same, preserving candidate scope and pagination |
| [apps/astro/src/components/activites/category/Listing.astro:176](https://github.com/kryptonum-dev/fabryka-atrakcji/blob/fc9ee20e1d61150db9a9f22126b4b86d0d2feb69/apps/astro/src/components/activites/category/Listing.astro#L176) | Active/global and dormant/category ID/score consumers; facets |
| [apps/astro/src/components/hotels/Listing.astro:203](https://github.com/kryptonum-dev/fabryka-atrakcji/blob/fc9ee20e1d61150db9a9f22126b4b86d0d2feb69/apps/astro/src/components/hotels/Listing.astro#L203) | ID/score consumers, self-excluding facets and totals |
| [apps/astro/src/utils/sanity.fetch.ts:12](https://github.com/kryptonum-dev/fabryka-atrakcji/blob/fc9ee20e1d61150db9a9f22126b4b86d0d2feb69/apps/astro/src/utils/sanity.fetch.ts#L12) | Reference for client configuration; prefer dedicated search client |
| [apps/astro/src/global/constants.ts:71](https://github.com/kryptonum-dev/fabryka-atrakcji/blob/fc9ee20e1d61150db9a9f22126b4b86d0d2feb69/apps/astro/src/global/constants.ts#L71) | Dataset/API date/index constants cleanup |
| [apps/astro/src/env.d.ts:10](https://github.com/kryptonum-dev/fabryka-atrakcji/blob/fc9ee20e1d61150db9a9f22126b4b86d0d2feb69/apps/astro/src/env.d.ts#L10) and [turbo.json:11](https://github.com/kryptonum-dev/fabryka-atrakcji/blob/fc9ee20e1d61150db9a9f22126b4b86d0d2feb69/turbo.json#L11) | Server credentials/build environment contract |
| [apps/astro/src/components/ui/Pagination.astro:37](https://github.com/kryptonum-dev/fabryka-atrakcji/blob/fc9ee20e1d61150db9a9f22126b4b86d0d2feb69/apps/astro/src/components/ui/Pagination.astro#L37) | Existing EN filter-path defect if needed for bilingual acceptance |
| [apps/astro/src/components/ui/SearchBar.astro:58](https://github.com/kryptonum-dev/fabryka-atrakcji/blob/fc9ee20e1d61150db9a9f22126b4b86d0d2feb69/apps/astro/src/components/ui/SearchBar.astro#L58) | Empty/clear query and pagination-reset verification |
| [apps/sanity/sanity.config.ts:12](https://github.com/kryptonum-dev/fabryka-atrakcji/blob/fc9ee20e1d61150db9a9f22126b4b86d0d2feb69/apps/sanity/sanity.config.ts#L12) | Deprecated development dashboard cleanup |
| [apps/sanity/package.json:24](https://github.com/kryptonum-dev/fabryka-atrakcji/blob/fc9ee20e1d61150db9a9f22126b4b86d0d2feb69/apps/sanity/package.json#L24) and bun.lock | Remove deprecated tooling when unused |
| [apps/sanity/schema/collectionTypes/Activities_Collection.ts:195](https://github.com/kryptonum-dev/fabryka-atrakcji/blob/fc9ee20e1d61150db9a9f22126b4b86d0d2feb69/apps/sanity/schema/collectionTypes/Activities_Collection.ts#L195) | Stored labels only if projection decision requires them |
| [apps/sanity/schema/collectionTypes/Hotels_Collection.ts:176](https://github.com/kryptonum-dev/fabryka-atrakcji/blob/fc9ee20e1d61150db9a9f22126b4b86d0d2feb69/apps/sanity/schema/collectionTypes/Hotels_Collection.ts#L176) | Stored amenity/location labels if adopted |
| apps/sanity/scripts/ and chosen synchronization mechanism | Idempotent backfill and continued reference updates if adopted |

Do not globally upgrade the shared API date simply to enable one search function. Do not modify event-space search or revive hidden activity-owned category management incidentally.
