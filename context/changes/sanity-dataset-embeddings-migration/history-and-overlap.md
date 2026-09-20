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

# History and overlapping work

## Relevant history

- Search backend and SearchBar introduced in [b3fad579](https://github.com/kryptonum-dev/fabryka-atrakcji/commit/b3fad579452123e0126c681dce23440c970c0104), dated 2025-04-19 in repository history. Hotels work followed in commit `7180ff8` on 2025-04-24.
- [Per-category activity management](../../archive/per-category-activity-management/research.md) documents category-owned activity arrays. Current schemas confirm it; obsolete activity.categories references must not regain authority through embedding migration.
- [Event-space implementation strategy](../../archive/event-spaces-implementation-strategy.md) deliberately excludes semantic search in its search section. Current code still uses lexical search there.

## Concurrent changes

[filter-crawl-trap](../filter-crawl-trap/change.md) is recorded as planned. Its August observations identify `Astro.url.origin` pointing to localhost on Vercel and breaking the self-call to `/api/embeddings`. Current routes still pass the origin, so removing the self HTTP hop is a useful migration boundary. Those historical production findings were not re-measured in this research.

[filter-route-cache-bypass](../filter-route-cache-bypass/change.md) records English filter cache behavior. Current config excludes both route spellings; verify deployed requests rather than assuming repository patterns establish deployed cache correctness. The migration should coordinate route acceptance with that change.

The working tree already contained an activity Listing script-import change and changes to soft-404 route planning, plus other untracked change folders. These were left untouched. GitHub links use the base commit; line coordinates for Listing are adjusted to the committed version.

## Scope recommendation

Include origin-independent server retrieval, bilingual pagination acceptance and explicit search error handling in migration planning. Coordinate canonical/crawl/ISR fixes with existing changes rather than duplicating unrelated SEO work. Keep event-space semantics and general UI/history cleanup out unless needed to pass the agreed search acceptance criteria.
