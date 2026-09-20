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

# Operations and rollout research

> **Scope revision — 2026-09-20:** This document preserves historical research. The current [plan](plan.md) and [decisions](decisions.md) use existing name/title/description/main content only. Earlier recommendations for materialized reference labels, hidden fields, synchronization, backfills or isolated datasets are superseded. Reference-only relevance cases are exploratory, not launch requirements.

## Current environment

Project `fn3a7ltg`, dataset `production`. Both applications hardcode the dataset: [apps/astro/src/global/constants.ts:71](https://github.com/kryptonum-dev/fabryka-atrakcji/blob/fc9ee20e1d61150db9a9f22126b4b86d0d2feb69/apps/astro/src/global/constants.ts#L71), [apps/sanity/constants.ts:27](https://github.com/kryptonum-dev/fabryka-atrakcji/blob/fc9ee20e1d61150db9a9f22126b4b86d0d2feb69/apps/sanity/constants.ts#L27). Staging Studio changes only its host, and CI runs direct Studio deployment on both main/dev: [apps/sanity/package.json:11](https://github.com/kryptonum-dev/fabryka-atrakcji/blob/fc9ee20e1d61150db9a9f22126b4b86d0d2feb69/apps/sanity/package.json#L11), [.github/workflows/sanity-deploy.yml:4](https://github.com/kryptonum-dev/fabryka-atrakcji/blob/fc9ee20e1d61150db9a9f22126b4b86d0d2feb69/.github/workflows/sanity-deploy.yml#L4). A staging URL does not isolate dataset settings or content changes.

Live GETs succeeded with the existing root `.env` `SANITY_API_TOKEN`; this proves read access to those resources only. It does not establish enablement rights, semantic-query grants, deployed token configuration, or an appropriate least-privilege runtime role. Credential values were neither printed nor saved.

## Dependency surface

Studio uses Sanity/CLI 3.99.0; deprecated UI 2.0.1 and CLI 1.0.10 remain installed. Astro's manifest permits client ^7.14.1, Studio ^7.15.0, and lockfile resolves 7.15.0. Dashboard import/registration is development-only: [apps/sanity/sanity.config.ts:12](https://github.com/kryptonum-dev/fabryka-atrakcji/blob/fc9ee20e1d61150db9a9f22126b4b86d0d2feb69/apps/sanity/sanity.config.ts#L12) and line 32.

Use a compatible separately pinned CLI or documented settings API for enablement rather than making Studio major-upgrade work an accidental dependency. Confirm its Node/runtime requirements before installation. No package installation occurred during research.

## Proposed evidence gates

1. Keep the exported legacy configuration and check application/Studio/Agent Actions consumers and request logs. Repo search cannot prove no callers exist elsewhere.
2. Select an explicitly isolated dataset and token path. If choosing same-dataset parallel evaluation instead, record that it alters production settings and shares operational quota.
3. Finalize projection and, if needed, implement repeatable label backfill plus synchronization before initial embedding generation.
4. Enable test embeddings; wait for readiness; verify pinned API/date, published isolation, semantic query permissions and real content coverage.
5. Execute validation corpus and failure/route checks. Record old/new IDs, human relevance judgments and latency, not cross-model score comparisons.
6. Confirm organization semantic quota and proposed traffic volume, then enable the approved production projection. Keep serving the legacy provider while initial processing finishes.
7. Cut over through a reversible application switch or deploy; verify actual PL/EN routes and monitor provider error/timeout/429 rates, latency, result emptiness, and write/update lag.
8. Once observation and caller inventory support it, retire old indexes, remove deprecated dashboard/dependencies and unused runtime token declarations. Index deletion is irreversible; no deletion was performed or scheduled here.

## Rollback

Before legacy deletion, revert the application provider/deployment and retain both old index definitions. Do not disable dataset embeddings as a rollback shortcut; that destroys computed data and forces later rebuild work. After deleting old indexes, assume the old provider is no longer a reliable fallback. Keep an explicit unavailable/browse path independent of both providers.

## Cleanup map

Runtime token declarations: [apps/astro/src/env.d.ts:10](https://github.com/kryptonum-dev/fabryka-atrakcji/blob/fc9ee20e1d61150db9a9f22126b4b86d0d2feb69/apps/astro/src/env.d.ts#L10), [turbo.json:11](https://github.com/kryptonum-dev/fabryka-atrakcji/blob/fc9ee20e1d61150db9a9f22126b4b86d0d2feb69/turbo.json#L11). Index names: [apps/astro/src/global/constants.ts:87](https://github.com/kryptonum-dev/fabryka-atrakcji/blob/fc9ee20e1d61150db9a9f22126b4b86d0d2feb69/apps/astro/src/global/constants.ts#L87) and line 95. Deprecated packages: [apps/sanity/package.json:24](https://github.com/kryptonum-dev/fabryka-atrakcji/blob/fc9ee20e1d61150db9a9f22126b4b86d0d2feb69/apps/sanity/package.json#L24) and line 39. Remove obsolete credentials from deployment settings only after no deployed consumer needs them; local declaration cleanup does not remove remote secrets.

Documentation describes automatic cleanup of Sanity's own legacy webhook when its index is deleted. Custom webhook inventory remains a separate operational check. [Sanity migration guide](https://www.sanity.io/docs/content-lake/migrate-from-embeddings-index-api)
