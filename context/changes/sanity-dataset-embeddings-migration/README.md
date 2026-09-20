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

# Migration research package

Start with [research.md](research.md) for the findings, then [decisions.md](decisions.md) for the user-confirmed answers that supersede earlier recommendations. The current scope embeds existing name/title/description/main content only, with no hidden fields or synchronization. Earlier reference-preservation proposals are superseded. Status is **planned**. Start implementation review with [plan-brief.md](plan-brief.md), then [plan.md](plan.md). Research snapshots below remain historical evidence.

| File | Purpose |
| --- | --- |
| [runtime-and-contracts.md](runtime-and-contracts.md) | Current calls, response shapes, ranking, facets, routes, failure behavior |
| [sanity-api-migration.md](sanity-api-migration.md) | Replacement API, versions, constraints, primary sources |
| [projection-and-content.md](projection-and-content.md) | Actual old projections, schema drift, proposed searchable content |
| [migration-options.md](migration-options.md) | Adapter and direct-query alternatives and recommended boundary |
| [operations-and-rollout.md](operations-and-rollout.md) | Dataset isolation, dependencies, credentials, cutover and rollback gates |
| [validation-matrix.md](validation-matrix.md) | Meaningful future checks and bilingual evaluation protocol |
| [history-and-overlap.md](history-and-overlap.md) | Prior changes and coordination risks |
| [file-impact-map.md](file-impact-map.md) | Files likely touched by a future implementation |
| [live-evidence.md](live-evidence.md) | Read-only observations, provenance, and limitations |
| [legacy-indexes.json](legacy-indexes.json) | Exact successful response body from the legacy index list |
| [dataset-embeddings-status.json](dataset-embeddings-status.json) | Exact successful response body for current dataset settings |
| [content-coverage.json](content-coverage.json) | Aggregate content coverage, no full content or credentials |
| [evaluation-corpus.json](evaluation-corpus.json) | 24 proposed PL/EN cases, not production analytics or scored results |

Repository source links point to the researched commit. A pre-existing change in the activity Listing file removes a script import, so working-tree lines after the imports are one lower than committed lines. Links in these documents use committed coordinates for that file. Untracked historical documents use relative links because they have no permalink at this commit.

Three research agents covered runtime, content/operations/history, and official Sanity documentation. The main agent verified live configuration and aggregate content reads and synthesized this package. No application code, dependency, cloud configuration, or content was changed.
