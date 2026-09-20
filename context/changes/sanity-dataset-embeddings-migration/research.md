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

# Research: Sanity dataset embeddings migration

> **Scope revision — 2026-09-20:** This document preserves historical research. The current [plan](plan.md) and [decisions](decisions.md) use existing name/title/description/main content only. Earlier recommendations for materialized reference labels, hidden fields, synchronization, backfills or isolated datasets are superseded. Reference-only relevance cases are exploratory, not launch requirements.

**Date:** 2026-09-20T07:07:15+02:00  
**Researcher:** Codex with three research subagents  
**Git commit:** `fc9ee20e1d61150db9a9f22126b4b86d0d2feb69`  
**Branch:** `main`  
**Repository:** `fabryka-atrakcji`

## Research Question

Open a new change to migrate the project's deprecated Sanity Embeddings Index integration to dataset embeddings, then research comprehensively with multiple agents and save focused supporting files. This request authorizes change initialization and research; implementation planning and migration execution are subsequent work.

## Summary

Migration is feasible, but is more than changing a URL. Two live named indexes supply semantic candidates to global activity and hotel listings. Their actual filters/projections are now exported in [legacy-indexes.json](legacy-indexes.json). The replacement dataset feature is **disabled** in production, verified by read-only GET.

Recommend a typed server search helper using explicit published queries and page-language filtering before the candidate limit. Initially preserve an internal compatibility shape for the existing listing GROQ, while distinguishing errors from empty results and removing the site's own-origin HTTP hop. Important old reference labels need stored fields if their search signal is retained; that entails content backfill and ongoing synchronization.

This package contains the primary report, nine supporting Markdown documents and four JSON artifacts, plus change.md. It records recommendations and unresolved decisions; no application implementation or cloud configuration changed.

## Detailed Findings

### Current runtime

Only CategoriesPage and HotelsPage actively call embeddings. The API returns top 50 IDs/scores before locale/facet filtering, followed by a second GROQ hydration query. Scores are used for sorting, not a numeric threshold. The helper's declared return shape is wrong, while consumers rely on the actual nested legacy value structure. See [runtime and contracts](runtime-and-contracts.md).

The published-ID inventory is 92 activities (51 PL, 41 EN) and 125 hotels (73 PL, 52 EN). Current candidate truncation can therefore exclude useful content before filtering. An API failure becomes null, which removes semantic filtering and displays broad results.

### Vendor migration

The replacement uses GROQ scoring and one dataset projection; it cannot expand referenced documents in embedding input. Do not compare new `_score` values to old scores. Use a separate pinned client/query boundary and verify supported behavior in an enabled dataset. The documented CLI prerequisites exceed the installed Studio/CLI version. See [API migration](sanity-api-migration.md) and [official migration guide](https://www.sanity.io/docs/content-lake/migrate-from-embeddings-index-api).

### Content and policy

Old projections dereference amenity/location/activity-type/category labels. Current category ownership has moved, a hotel capacity field is misspelled in the old projection, and historical activity location text still exists despite schema removal. Root doNotIndex differs from the nested SEO setting. See [projection and content](projection-and-content.md) for the mapping and [live evidence](live-evidence.md) for limitations.

### Delivery and deployment

The site's self HTTP hop overlaps a previously documented production origin defect. English filtered pagination has an existing route-suffix problem. Staging Studio shares production data; it is not a safe assumption for dataset experiments. Keep old indexes through a reversible cutover and observed success. See [operations](operations-and-rollout.md), [options](migration-options.md), and [validation](validation-matrix.md).

## Code References

- [apps/astro/src/pages/api/embeddings.ts:12](https://github.com/kryptonum-dev/fabryka-atrakcji/blob/fc9ee20e1d61150db9a9f22126b4b86d0d2feb69/apps/astro/src/pages/api/embeddings.ts#L12) — legacy provider endpoint and envelope.
- [apps/astro/src/utils/filters.ts:187](https://github.com/kryptonum-dev/fabryka-atrakcji/blob/fc9ee20e1d61150db9a9f22126b4b86d0d2feb69/apps/astro/src/utils/filters.ts#L187) — own-origin request, incorrect type and null fallback.
- [apps/astro/src/templates/activities/CategoriesPage.astro:63](https://github.com/kryptonum-dev/fabryka-atrakcji/blob/fc9ee20e1d61150db9a9f22126b4b86d0d2feb69/apps/astro/src/templates/activities/CategoriesPage.astro#L63) — active activity retrieval.
- [apps/astro/src/templates/hotels/HotelsPage.astro:44](https://github.com/kryptonum-dev/fabryka-atrakcji/blob/fc9ee20e1d61150db9a9f22126b4b86d0d2feb69/apps/astro/src/templates/hotels/HotelsPage.astro#L44) — active hotel retrieval.
- [apps/astro/src/components/activites/category/Listing.astro:340](https://github.com/kryptonum-dev/fabryka-atrakcji/blob/fc9ee20e1d61150db9a9f22126b4b86d0d2feb69/apps/astro/src/components/activites/category/Listing.astro#L340) — activity candidate membership.
- [apps/astro/src/components/hotels/Listing.astro:203](https://github.com/kryptonum-dev/fabryka-atrakcji/blob/fc9ee20e1d61150db9a9f22126b4b86d0d2feb69/apps/astro/src/components/hotels/Listing.astro#L203) — hotel membership and downstream facets.
- [apps/sanity/sanity.config.ts:12](https://github.com/kryptonum-dev/fabryka-atrakcji/blob/fc9ee20e1d61150db9a9f22126b4b86d0d2feb69/apps/sanity/sanity.config.ts#L12) — deprecated dashboard integration.
- [apps/sanity/schema/ui/seo.tsx:42](https://github.com/kryptonum-dev/fabryka-atrakcji/blob/fc9ee20e1d61150db9a9f22126b4b86d0d2feb69/apps/sanity/schema/ui/seo.tsx#L42) — actual nested editor noindex setting.

Full planning inventory: [file-impact-map.md](file-impact-map.md). Links use committed lines; current working tree includes unrelated changes described in README.

## Architecture Insights

Separate semantic candidate retrieval from presentation/facet calculations at first. Preserve self-excluding facet behavior and explicit sort choices. Treat candidate limit as a recall/product decision, errors as a distinct outcome, and embedding content as a maintained data contract. Avoid broad shared-client upgrades and broad Studio upgrades as incidental migration work.

Published-only search is the recommended initial preview contract; document that unpublished edits may not appear in semantic results. Event-space lexical search and category editorial ordering stay independent. A pure direct-query rewrite remains an option once the richer listing contract has acceptance coverage.

## Historical Context (from prior changes)

[filter-crawl-trap](../filter-crawl-trap/change.md) records own-origin failures; [filter-route-cache-bypass](../filter-route-cache-bypass/change.md) records English cache issues. These are historical observations, not newly reproduced deployment measurements. [Per-category management research](../../archive/per-category-activity-management/research.md) explains current category ownership. See [history and overlap](history-and-overlap.md).

## Related Research

The [package index](README.md) links all supporting artifacts. [evaluation-corpus.json](evaluation-corpus.json) supplies 24 proposed bilingual cases; expected document IDs remain explicitly unjudged, and no relevance results are claimed. [content-coverage.json](content-coverage.json) contains aggregate live evidence.

## Verification and Research Limits

Three independent agents completed runtime, content/operations/history, and official-documentation research. The main agent read the user-linked documentation, verified live configuration and aggregate content through the Sanity Content Operator workflow, then synthesized findings. Foundation lessons.md was absent. TaskCreate/TaskUpdate tools were unavailable; agent tasks supplied the research-area tracking.

No code tests were required for documentation-only output. Live requests were reads only. Read permissions do not prove write/query permissions; replacement quality, costs, quota, runtime compatibility, real traffic and outside callers require future verification. Supporting documents reference the five open questions below rather than creating hidden decisions.

## Open Questions

**Planning update:** User answers are recorded in [decisions.md](decisions.md). Reference-label preservation, SEO/internal-search separation, the unavailable state, and use of the current production dataset are now decided. The questions and recommendations below remain the original research record; follow decisions.md where they differ. Result selection and remaining planning choices are now settled in decisions.md and plan.md; follow those documents for implementation.

### 1. Which referenced content must remain searchable?

The old indexes embed hotel amenities and location names, activity types, and category text. The new projection cannot follow those references, and the old activity category links are no longer the authoritative membership list.

**Recommendation:** Preserve hotel amenity/location names and activity-type names through stored search fields with a backfill and ongoing synchronization; add category context only if the bilingual evaluation shows it is needed, using category-owned membership.

### 2. Should the SEO noindex setting hide content from internal search?

The old filters inspect root `doNotIndex`, while editors use `seo.doNotIndex`. The read-only check found three activity records with the nested setting across all document versions, so changing this rule could change what visitors can find.

**Recommendation:** Keep SEO exclusion separate from internal search visibility, preserve the legacy root predicate initially, and introduce a dedicated internal-search flag only if the business needs one.

### 3. What should visitors see when semantic search is unavailable?

Today an API failure becomes a normal listing with the search restriction removed. For example, a search for kayaking can display the entire catalogue when the provider fails.

**Recommendation:** Show a clear search-unavailable state with retry and browsing options; represent an empty successful search separately from an error.

### 4. How should we bound results and judge relevance?

The current search takes 50 candidates across both languages before applying page filters, and the new scores cannot be used as a universal relevance cutoff. A meaningless query can still rank real documents, while a restrictive facet can discard the whole candidate pool.

**Recommendation:** Filter collection, publication eligibility, and page language before a configurable candidate limit; keep facet counts tied to that candidate set initially, and choose the final limit and any no-match policy using the bilingual evaluation corpus rather than a numeric score threshold.

### 5. Where can we safely validate and launch the new search?

The staging Studio and production site both point at the production dataset, where embeddings are currently disabled. New semantic query permissions, relevance, latency, quota, and any callers outside this repository have not yet been verified.

**Recommendation:** Use an explicitly isolated dataset for the first enablement and evaluation, then validate production readiness and usage limits before cutover; keep the old indexes until deployed bilingual searches pass and an observation period shows no remaining legacy consumers.
