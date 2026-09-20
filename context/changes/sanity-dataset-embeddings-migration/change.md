---
change_id: sanity-dataset-embeddings-migration
title: Migrate Sanity search to dataset embeddings
status: implemented
created: 2026-09-20
updated: 2026-09-20
implementation_base: fc9ee20e1d61150db9a9f22126b4b86d0d2feb69
archived_at: null
views: []
---

## Notes

Can you pelaseo open a [$10x-new](/Users/oliwiersellig/.codex/skills/10x-new/SKILL.md)  to mgirate the current embeding index logic to the new logic propose d by basnity?
Then already use the [$10x-research](/Users/oliwiersellig/.codex/skills/10x-research/SKILL.md)  afterwards, use mutliple research subagents to get the anyhting you need and output as many files as possible.

Current API: https://www.sanity.io/docs/content-lake/embeddings-index-api-overview
Replacement: https://www.sanity.io/docs/content-lake/dataset-embeddings

## Confirmed planning decisions

See [decisions.md](decisions.md) for the four user-confirmed choices. These take precedence over earlier research recommendations. Implementation and production verification are complete. See [rollout.md](rollout.md) for launch evidence and rollback. See [plan-brief.md](plan-brief.md) and [plan.md](plan.md).

## Scope revision — 2026-09-20

At the user’s request, the plan now has four phases and embeds only existing document-local name, title, description and main content. Hidden fields, reference-label synchronization, backfills and daily repair are removed. Other confirmed decisions remain in force.
