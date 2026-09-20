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

# Validation matrix

> **Scope revision — 2026-09-20:** This document preserves historical research. The current [plan](plan.md) and [decisions](decisions.md) use existing name/title/description/main content only. Earlier recommendations for materialized reference labels, hidden fields, synchronization, backfills or isolated datasets are superseded. Reference-only relevance cases are exploratory, not launch requirements.

No tests or semantic comparisons were executed: this is a research package, and the replacement is disabled. Tests below are acceptance evidence for the future implementation.

| Area | Check | Passing evidence |
| --- | --- | --- |
| Contract | Valid old/new responses and malformed payloads | One checked candidate shape with IDs and finite scores |
| Input | Missing/empty/whitespace/non-string/oversized text, malformed JSON, invalid type/locale | Intentional 4xx without provider calls or leaked errors |
| Eligibility | Both collections, PL/EN, no slug, chosen visibility policy | Only eligible published documents returned |
| Isolation | Drafts and release versions, preview deployment | No unintentional draft content in public search |
| Empty vs error | Success-empty, timeout, auth error, 429, 5xx | Distinct no-results and unavailable behavior |
| Ranking | Semantic concepts, exact names, irrelevant text | Reviewed relevant top results; no absolute score assertions |
| Filters | All current facets; own-facet expansion | Cards, counts and available filter values agree |
| Candidate cutoff | Mixed locales, more than 50 candidates, restrictive facet | Documented cutoff and accepted recall tradeoff |
| Sorting | Relevance, price asc/desc, newest, popularity | Same membership with correct order |
| Pagination | >16 hotels, PL and EN, equal scores | Stable IDs, correct totals and filter paths, no duplicates |
| Navigation | Submit, history, clear, empty query, search from later page | Consistent modes and reset to first page |
| No-search | Regular listings and editorial categories | No semantic call, original ordering retained |
| Out of scope | Event-space lexical search | Remains independent and functional |
| Delivery | Deployed filter routes and ISR exclusions | Different inputs reach handler and return appropriate distinct results |
| Content updates | Own field and referenced-label edits | Search context eventually updates; no assumed immediate consistency |
| Operations | Ready/error states, disabled dataset, wrong credentials | No traffic switch before readiness; useful safe diagnostics |

## Relevance evaluation

[evaluation-corpus.json](evaluation-corpus.json) contains 24 proposed cases. They are synthetic research fixtures, not real usage logs or claims that a specific document is present. Before scoring the corpus, select actual expected documents by inspecting their content and have a reviewer mark acceptable top results. Include exact hotel/activity names sampled from the dataset as additional fixtures.

For each query, record provider, locale, type, candidate limit, eligible count, returned IDs, top-five relevance judgments, elapsed time and any errors. Compare rank and relevance, never the numerical old score against new `_score`. Run the direct-field baseline and materialized-reference candidate on amenity/type/location cases to determine whether the additional synchronization earns its cost.

Negative queries assess whether results are useful, not a fictional guarantee that semantic scoring returns zero. If the product requires hard no-match behavior, adopt a separate tested admission rule and show it does not reject valid conceptual searches. Do not invent a `_score > N` confidence rule.

## Local tooling

Astro build runs `astro check && astro build`; root has lint/build scripts. No dedicated search test suite or workspace test script was found. Add focused adapter/error and listing-behavior checks as part of implementation, then perform deployed PL/EN smoke tests. Browser checks require the browser skill when executed; this research did not run a browser.
