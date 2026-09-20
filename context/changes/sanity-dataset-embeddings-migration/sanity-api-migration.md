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

# Sanity API migration findings

> **Scope revision — 2026-09-20:** This document preserves historical research. The current [plan](plan.md) and [decisions](decisions.md) use existing name/title/description/main content only. Earlier recommendations for materialized reference labels, hidden fields, synchronization, backfills or isolated datasets are superseded. Reference-only relevance cases are exploratory, not launch requirements.

## Confirmed replacement contract

Named indexes become one configuration per dataset. Use type-conditional embedding projections and GROQ eligibility filters; query with `score(text::semanticSimilarity($searchText))`. Responses are documents with `_score`, so an adapter can preserve the old ID envelope temporarily. The new scores are relative ranks within one query, not reusable cutoff values. The current application has no numeric cutoff to remove. [Official migration guide](https://www.sanity.io/docs/content-lake/migrate-from-embeddings-index-api)

Embedding projections cannot expand references. This is a concrete constraint for both live project indexes, not a hypothetical limitation. Keep display-time dereferences in normal GROQ; materialize important reference labels only for embedding input. Use a compact per-type representation rather than whole page-builder documents. [Dataset embeddings](https://www.sanity.io/docs/content-lake/dataset-embeddings)

## Versions and query boundary

The migration guide specifies `sanity >=5.18.0` / `@sanity/cli >=6.2.0` for the CLI path. Its client example pins `2026-08-21`; it does not establish that as the minimum semantic API date, nor establish a minimum client package version. The repo's Studio/CLI 3.99.0 cannot be assumed to offer these commands. A separate compatible CLI or the settings HTTP API avoids forcing an unrelated Studio major upgrade. [Migration guide](https://www.sanity.io/docs/content-lake/migrate-from-embeddings-index-api)

Keep a static API date and verify it through a real semantic query after enablement. Use an isolated search client with explicit published perspective and direct API access as the initial design. The shared client's older date and preview behavior need not change. API defaults changed with `2025-02-19`; explicit perspective prevents accidental draft/version exposure. [Perspectives](https://www.sanity.io/docs/content-lake/perspectives)

## Settings and readiness

The settings resource is `/projects/:projectId/datasets/:name/settings/embeddings`: GET reads status; PUT configures embeddings. Enablement is asynchronous and readiness must precede traffic. During this research the live GET returned `disabled`, an observed state in addition to enabled lifecycle states documented by Sanity. Updates are asynchronous; immediate read-after-edit semantic parity is not a valid test. Disabling is destructive to computed vectors and is not legacy cleanup. [Dataset embeddings](https://www.sanity.io/docs/content-lake/dataset-embeddings)

For future execution, CLI offers `datasets embeddings enable`, `status`, and `disable`, with explicit project selection and `--wait` support. Commands were not executed in this research. [CLI reference](https://www.sanity.io/docs/cli-reference/cli-datasets)

## Ranking and no-match behavior

`text::semanticSimilarity()` is valid inside `score()`. Scoring does not itself remove all irrelevant documents. Filter eligibility, score candidates, then limit results; do not infer confidence from `_score` or compare it across queries. Stable pagination needs deliberate tie-breaking. [GROQ functions](https://www.sanity.io/docs/specifications/groq-functions), [Search guide](https://www.sanity.io/docs/content-lake/search-content-with-groq)

Start with semantic search; use exact-name cases to evaluate any hybrid additions. Keyword and semantic expressions can admit documents independently, so hybrid scoring is not automatically a no-match detector. [Search guide](https://www.sanity.io/docs/content-lake/search-content-with-groq)

## Evidence limits

No exact sunset deadline was verified. No new semantic query, ranking comparison, query quota, or permission grant was tested because the live dataset is disabled. Documentation completion is not migration readiness. Old-index retention, unknown callers, and eventual cleanup are covered in operations; runtime/content recommendations in this package are engineering inferences, not vendor guarantees.
