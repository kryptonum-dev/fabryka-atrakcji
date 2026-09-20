# Dataset embeddings rollout

Implementation began at `fc9ee20e1d61150db9a9f22126b4b86d0d2feb69`. Scope is document-local name/title/description/main content only. No editorial mutations, derived fields, custom webhooks, cron jobs or dataset copies were performed.

## Deployment and settings evidence

- Migration-capable legacy production deployment: `dpl_5jmg7zYLWujQvChMvZFGFn9Scmqf`, from code through `41edae0`.
- Settings were enabled on `fn3a7ltg/production` with the checked-in projection. Original configuration is in `settings-before-enable.json`.
- Sanity initially returned ready immediately after PUT, then changed to updating while queries reported `embeddingNotEnabledError`. Readiness tooling now also probes a real semantic query. Initial evaluation and local smoke failures are retained as startup evidence.
- A separate production-target deployment is staged with `--skip-domain`, using the dataset provider and production environment. All readiness, evaluation and route checks passed before promotion.

## Successful cutover

- Deployment: `dpl_DcdXpCVjyj924KGmA5wu61nzVV6d`, code through `aec76a3`.
- Deployment URL: https://fabryka-atrakcji-aln1a1sb1-kryptonum.vercel.app
- Public URL: https://www.fabryka-atrakcji.com
- Promotion completed at approximately **2026-09-20T05:54:44+00:00** (CLI completion timestamp).
- Production project configuration now persists `SANITY_SEARCH_PROVIDER=dataset`; both build and runtime settings of the promoted deployment select dataset. Runtime provider evidence is saved separately.
- Dataset evaluation: 48 calls, all expected-hit/eligibility checks passed, query p95 **103ms**.
- Staged production API: 24 positive calls, all passed, request p95 **645ms** (curl timing excludes CLI startup); five rendered route checks passed before promotion.
- Public production API: 48 calls, all passed, request p95 **536ms**. All 13 public route checks passed, including varying search phrases, facets, explicit sorts and both locales' hotel page 2. The filter routes reported cache MISS/BYPASS rather than serving a fixed cached search result.
- Brave against public production confirmed new-query page reset, blank-query browsing, English filter pagination and Polish activity results without page errors. Local mobile rendering and both unavailable flows were also checked.
- Published queries work anonymously on this public dataset: runtime needs no new content-write or management token. Evaluation returned no quota errors. Full subscription/billing quotas were not independently audited.

## Validation completed before cutover

- Nine focused Bun tests pass (65 assertions): projection, input/candidate validation, provider selection and failures, API compatibility, listing-state separation and bilingual navigation.
- Astro production build/type checks pass locally. Existing duplicate redirect, old Browserslist and unused/deprecated symbol hints are baseline warnings; no new type errors.
- Changed Astro components pass the existing ESLint configuration. That configuration does not lint standalone TypeScript; Astro type checking covers the runtime modules instead.
- Isolated Brave desktop/mobile checks: normal PL activity/EN hotel results, new-query page reset, blank search clearing and English next-page link.
- Controlled local provider failure: hotel page 2 returns 200 with unavailable panel, no cards or pagination, retry retains path/query, browse clears search/page. PL activity failure also hides cards. Both produce no page errors.
- Storage-blocking test still navigates on submit. Other existing consent/storage scripts report storage errors under this artificial restriction; those unrelated scripts are outside this migration.
- Legacy corpus: 48 calls, query p95 582ms. The expected English painting-with-wine conceptual hit misses top five in all three runs; see `evaluation-legacy.json`.

## Recovery procedure

Select `SANITY_SEARCH_PROVIDER=legacy` in production and redeploy the migration-capable code. A build-time value may be inlined, so changing an environment value without deployment is insufficient. Keep the legacy bearer token and both named indexes. Do not disable dataset embeddings as a rollback step.

Inspect readiness with `bun run search:embeddings status --check-ready`; wait with `status --wait --check-ready`. If content changes are not yet reflected, allow for Sanity's asynchronous indexing. Diagnose safe `[search]` provider/status/timing logs and HTTP 401/403/429 categories. There is no custom synchronization service to repair.

### Concrete rollback

The retained legacy deployment already contains the migration's direct server helper and unavailable UI. For immediate recovery, persist the legacy setting and promote that deployment:

```sh
printf %s legacy | vercel env update SANITY_SEARCH_PROVIDER production --scope kryptonum --yes
vercel promote https://fabryka-atrakcji-5idwb146b-kryptonum.vercel.app --scope kryptonum --yes
bun run search:smoke --base-url https://www.fabryka-atrakcji.com --check
```

This promotes a verified migration-capable legacy build without waiting for a rebuild. Future deployments pick up the persisted setting. Alternatively redeploy the current migration code after changing the environment. Do not disable embeddings or delete indexes. The legacy baseline has a known relevance miss; rollback does not promise dataset ranking quality.

## Retention

Keep legacy indexes, their existing managed resources, code and credentials until at least **2026-10-04**, 14 days after successful cutover. Review outside consumers before any later retirement. Nothing is scheduled for automatic deletion.

## Execution notes

TaskCreate/TaskUpdate tools are unavailable in this session; the plan's Progress section is the authoritative tracker. Builds were permitted and completed; no build gate is deferred. Commits and deployment exports omit the pre-existing activity Listing change and unrelated context folders. Source-only deployment exports do not contain local credentials.

## Operational adaptations

- Readiness requires settings **and** an actual semantic query because settings briefly reported ready before indexing started.
- Protected staging was verified through Vercel CLI's authenticated bypass; protection remained enabled. The CLI created a project automation bypass token in its own credential storage. No token is in source or evidence files.
- Both production deployments used clean committed source exports so unrelated working changes were not published. The final runtime is `aec76a3`; later changes are evaluation tooling and evidence only.
- The evaluation script also accepts `--base-url` for repeatable public-runtime checks. Use `bun run search:evaluate --provider dataset --base-url https://www.fabryka-atrakcji.com --check`.
- Local `.env` selects the dataset provider for subsequent development. A dataset-backed Astro server remains available at http://127.0.0.1:4321.
