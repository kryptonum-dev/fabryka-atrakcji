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

# Runtime and contracts

## Active flow

SearchBar performs full-page GET navigation; its suggestions are local search history, not remote autocomplete. Global activity and hotel templates perform a server-side POST to their own `/api/embeddings`, then pass returned candidate IDs and scores into a separate GROQ page query. Only two callers actively request embeddings: [apps/astro/src/templates/activities/CategoriesPage.astro:63](https://github.com/kryptonum-dev/fabryka-atrakcji/blob/fc9ee20e1d61150db9a9f22126b4b86d0d2feb69/apps/astro/src/templates/activities/CategoriesPage.astro#L63) and [apps/astro/src/templates/hotels/HotelsPage.astro:44](https://github.com/kryptonum-dev/fabryka-atrakcji/blob/fc9ee20e1d61150db9a9f22126b4b86d0d2feb69/apps/astro/src/templates/hotels/HotelsPage.astro#L44).

```mermaid
flowchart LR
  A[Search form navigation] --> B[Astro filter route]
  B --> C[Template fetchData]
  C --> D[Own origin /api/embeddings]
  D --> E[Named legacy index]
  E --> F[Top 50 IDs and scores]
  F --> G[GROQ language and facet filters]
  G --> H[Cards, counts and pagination]
```

## Provider and application contract

[apps/astro/src/pages/api/embeddings.ts:12](https://github.com/kryptonum-dev/fabryka-atrakcji/blob/fc9ee20e1d61150db9a9f22126b4b86d0d2feb69/apps/astro/src/pages/api/embeddings.ts#L12) accepts `{searchQuery,type}`, mapping `activities` and `hotels` to collection types and named indexes. The request at line 50 uses `/vX/embeddings-index/query/production/<indexName>`, a legacy bearer token, `maxResults:50`, and `filter:{_type:[collectionType]}`. Sanity's guide documents `filter.type`, so this spelling is a legacy discrepancy; the exported index filters independently scope the document types. We did not query the legacy search endpoint to prove how it handles the extra key.

The local response is `{data:[{score,value:{documentId,type}}]}`. The helper unwraps `data`, but its TypeScript return annotation describes a different wrapped/flat shape: [apps/astro/src/utils/filters.ts:187](https://github.com/kryptonum-dev/fabryka-atrakcji/blob/fc9ee20e1d61150db9a9f22126b4b86d0d2feb69/apps/astro/src/utils/filters.ts#L187). Correcting that contract belongs in the migration boundary.

Input validation checks query truthiness rather than a trimmed bounded string. Malformed JSON and provider failures become 500. No explicit timeout, request cancellation, rate limiting, or upstream response validation exists in this route. These are observed implementation properties, not evidence of a production incident.

## Downstream constraints

- Global activity filtering and score lookup: [apps/astro/src/components/activites/category/Listing.astro:340](https://github.com/kryptonum-dev/fabryka-atrakcji/blob/fc9ee20e1d61150db9a9f22126b4b86d0d2feb69/apps/astro/src/components/activites/category/Listing.astro#L340), [apps/astro/src/components/activites/category/Listing.astro:428](https://github.com/kryptonum-dev/fabryka-atrakcji/blob/fc9ee20e1d61150db9a9f22126b4b86d0d2feb69/apps/astro/src/components/activites/category/Listing.astro#L428).
- Hotel filtering and score lookup: [apps/astro/src/components/hotels/Listing.astro:203](https://github.com/kryptonum-dev/fabryka-atrakcji/blob/fc9ee20e1d61150db9a9f22126b4b86d0d2feb69/apps/astro/src/components/hotels/Listing.astro#L203), [apps/astro/src/components/hotels/Listing.astro:337](https://github.com/kryptonum-dev/fabryka-atrakcji/blob/fc9ee20e1d61150db9a9f22126b4b86d0d2feb69/apps/astro/src/components/hotels/Listing.astro#L337).
- Default search order is `_score desc`; explicit price/newest/popularity overrides only ordering: [apps/astro/src/utils/filters.ts:152](https://github.com/kryptonum-dev/fabryka-atrakcji/blob/fc9ee20e1d61150db9a9f22126b4b86d0d2feb69/apps/astro/src/utils/filters.ts#L152).
- Facet counts use semantic membership but selectively omit their own selected facet. Hotel absolute price bounds intentionally use a broader pool. A replacement must not confuse these distinct scopes.
- The global top 50 is selected before language and facets. Current published inventories exceed 50 for both types; recall loss is possible without any provider failure.
- Hotels paginate by 16 after candidate filtering. Global activity search has no GROQ slice beyond provider candidates. Do not replace the candidate pool with one page of 16 and then derive counts from that page.

## Scope exclusions and latent consumers

Category-specific ActivitiesPage passes `embeddingResults:null` at [apps/astro/src/templates/activities/ActivitiesPage.astro:188](https://github.com/kryptonum-dev/fabryka-atrakcji/blob/fc9ee20e1d61150db9a9f22126b4b86d0d2feb69/apps/astro/src/templates/activities/ActivitiesPage.astro#L188). Its shared category query still contains the old score/ID expressions, so removing the shape requires inspecting dormant consumers too. EventSpacesPage uses lexical name matching, not semantic retrieval; leave its search behavior independent.

## Failures, publication, and routing

`null` disables the semantic ID predicate; `[]` matches nothing. Provider failures return `null`, so an outage looks like successful broad results. Use an explicit success/empty/error result in the future design.

The shared GROQ client uses published/CDN in production and drafts/authentication in preview: [apps/astro/src/utils/sanity.fetch.ts:12](https://github.com/kryptonum-dev/fabryka-atrakcji/blob/fc9ee20e1d61150db9a9f22126b4b86d0d2feb69/apps/astro/src/utils/sanity.fetch.ts#L12). Semantic candidates currently come from a separate provider path. A dedicated published search client avoids inheriting preview access unintentionally.

APIs and both filter route spellings are excluded from ISR: [apps/astro/astro.config.ts:31](https://github.com/kryptonum-dev/fabryka-atrakcji/blob/fc9ee20e1d61150db9a9f22126b4b86d0d2feb69/apps/astro/astro.config.ts#L31). Still verify deployed routing: prior changes document cache/origin issues. The own-origin request can be removed by a shared server helper rather than relying on a production hostname in previews.

English filtered hotel pagination is a pre-existing defect: [apps/astro/src/components/ui/Pagination.astro:37](https://github.com/kryptonum-dev/fabryka-atrakcji/blob/fc9ee20e1d61150db9a9f22126b4b86d0d2feb69/apps/astro/src/components/ui/Pagination.astro#L37) recognizes/appends `/filtr`, not English `/filter`. Empty `?search=` also differs between truthy fetching and parameter-presence rendering in CategoriesPage. Include both in end-to-end validation; neither is caused by the new provider.
