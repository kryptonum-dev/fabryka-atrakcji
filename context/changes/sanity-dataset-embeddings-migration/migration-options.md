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

# Migration options

> **Scope revision — 2026-09-20:** This document preserves historical research. The current [plan](plan.md) and [decisions](decisions.md) use existing name/title/description/main content only. Earlier recommendations for materialized reference labels, hidden fields, synchronization, backfills or isolated datasets are superseded. Reference-only relevance cases are exploratory, not launch requirements.

These are research recommendations for a future plan, not implementation commitments.

| Approach | Benefit | Tradeoff |
| --- | --- | --- |
| Replace only API provider, preserve envelope | Smallest change to listing GROQ | Retains self HTTP call, language-blind top 50 unless request contract changes |
| Shared server search helper plus compatibility envelope | Removes origin dependency; centralizes validation, locale and provider choice | Still has retrieval then page hydration; must define error result and bounded candidates |
| Score inside all listing GROQ builders | Can combine eligible content and retrieval directly | Larger rewrite of page projections, self-excluding facet counts, totals, custom sorts and pagination |

**Recommended starting boundary:** A typed server search helper used by the two active templates, a dedicated published/direct-API client, and an explicit result union. Keep `/api/embeddings` as a thin wrapper if external consumers or existing URLs need it. Preserve the old value/documentId shape inside the compatibility adapter initially; do not imply score-scale compatibility.

Suggested internal result concept:

```typescript
type SearchResult =
  | { status: 'ok'; candidates: SearchCandidate[] }
  | { status: 'unavailable'; reason: 'timeout' | 'provider' | 'configuration' }
```

An empty candidates array is a successful result. No query should skip semantic retrieval and run the regular listing. Do not use null to encode both states. Route errors should be useful but never expose tokens or provider internals.

Query sequencing to evaluate:

1. Validate bounded text, collection allowlist and language.
2. Apply collection, explicit published perspective, slug and selected visibility predicate.
3. Restrict document language before scoring and candidate limit.
4. Rank semantically with a stable tie-breaker; bound candidate retrieval.
5. Hydrate candidates and preserve existing selected-facet/own-facet count scopes.
6. Apply user-selected sort and page slicing consistently to the same membership set.

This still permits candidate truncation before facets. Moving every facet before retrieval would need a separate strategy for own-facet counts; do not advertise perfect facet recall with a fixed top-K adapter. Evaluate pool sizes against the actual 51 PL/41 EN activities and 73 PL/52 EN hotels. Inventory grows, so these counts are not permanent limits.

Example legacy-shape projection for an isolated experiment (not executed):

```groq
*[_type == $documentType && language == $language
  && defined(slug.current) && doNotIndex != true]
  | score(text::semanticSimilarity($searchText))
  | order(_score desc, _id asc)
  [0...$limit] {
    "score": _score,
    "value": {"documentId": _id, "type": _type}
  }
```

Use published perspective independently of this filter. Validate parameterized slicing and function behavior against the pinned API version in an enabled test dataset. The example intentionally preserves root visibility policy pending question 2.

A future direct-query rewrite can remove the legacy shape once counts, pagination, and explicit sorting are covered. Avoid maintaining two permanent search architectures without a cleanup criterion.
