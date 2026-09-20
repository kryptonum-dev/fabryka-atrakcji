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

# Read-only live evidence

## Provenance

Observed 2026-09-20, Europe/Warsaw. Repeated configuration exports saved at 05:07:26 UTC (07:07:26 local). Selected root `.env` because it supplies the same project/token convention used by Astro. Project ID verified as `fn3a7ltg`; dataset `production` supplied explicitly from both apps' constants. API date `2026-08-21` used for settings/content reads. The skill env check succeeded once missing dataset/API date were supplied from configuration/research.

## Requests and results

| Read | Result |
| --- | --- |
| GET `https://fn3a7ltg.api.sanity.io/vX/embeddings-index/production` | HTTP 200, two active indexes; exact response in legacy-indexes.json |
| GET `https://api.sanity.io/v2026-08-21/projects/fn3a7ltg/datasets/production/settings/embeddings` | HTTP 200, enabled false / disabled; exact response in dataset-embeddings-status.json |
| GROQ aggregate coverage of activity/hotel documents | 92 activities, 125 hotels; counts in content-coverage.json |
| GROQ counts of root/nested noindex flags | Root true: 0/0; nested true: 3 activities / 0 hotels, across versions |

Configuration exports contain names, projection/filter strings, provider counters and webhook identifiers, but no credentials. No content mutation, enablement, deletion, token creation, deployment, or legacy/new semantic search request occurred.

## Coverage methodology

Coverage query selected each collection while excluding IDs under `drafts.**` and `versions.**`, projected only locale, eligibility and boolean field-presence flags, then aggregated locally. Eligibility reproduced `defined(slug.current) && doNotIndex != true`; all records in that inventory passed. It did not dereference every target or evaluate text quality.

The separate noindex count query did not exclude drafts or versions. Therefore the three activity records must not be described as three distinct published activities. The test confirms field mismatch, not final production visibility impact.

Live root `location.customLocation` coverage corrects a schema-only inference: the field is absent from current activity schema but remains in 54 published-ID documents. Schema absence is not data absence.

## Not established by these reads

Successful management reads do not prove semantic query rights or settings-write authorization. An active old index does not prove healthy user-facing search or current ranking quality. `startDocumentCount` is not an authoritative current document count. Subscription quota, actual traffic, undiscovered external callers, new API relevance and deployed latency remain launch checks under research question 5.
