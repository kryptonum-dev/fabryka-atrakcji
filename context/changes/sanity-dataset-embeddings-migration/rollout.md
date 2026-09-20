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

Current source uses Dataset Embeddings exclusively. The user requested repository cleanup on 2026-09-20, superseding the original provider switch and 14-day code retention. Changing an environment variable cannot restore legacy search in current source.

Inspect readiness with `bun run search:embeddings status --check-ready`; wait with `status --wait --check-ready`. If content changes are not yet reflected, allow for Sanity's asynchronous indexing. Diagnose safe `[search]` status/timing logs and HTTP 401/403/429 categories. There is no custom synchronization service to repair.

For emergency recovery, the retained historical legacy deployment can still be promoted:

```sh
vercel promote https://fabryka-atrakcji-5idwb146b-kryptonum.vercel.app --scope kryptonum --yes
bun run search:smoke --base-url https://www.fabryka-atrakcji.com --check
```

That deployment uses its original configuration. A subsequent deployment of current source returns to Dataset Embeddings. The legacy baseline has a known relevance miss; rollback does not promise dataset ranking quality.

## Repository cleanup — 2026-09-20

Removed the legacy provider, index-name constants, provider selector, obsolete environment declarations, Studio dashboard and legacy CLI/UI packages. Evaluation now runs with `bun run search:evaluate --check` and supports `--base-url` for deployed checks. The `/api/embeddings` route remains as the Dataset Embeddings API.

Cleanup verification: nine focused tests pass (64 assertions); Astro type checking and both Astro and Studio production builds pass; a local API request returns 50 hotel candidates; Sanity readiness and its semantic-query probe pass.

Historical research and evaluation evidence remain for traceability. Remote indexes, cloud credentials and retained deployments were not deleted. Review outside consumers before retiring those resources.

## Execution notes

TaskCreate/TaskUpdate tools are unavailable in this session; the plan's Progress section is the authoritative tracker. Builds were permitted and completed; no build gate is deferred. Commits and deployment exports omit the pre-existing activity Listing change and unrelated context folders. Source-only deployment exports do not contain local credentials.

## Operational adaptations

- Readiness requires settings **and** an actual semantic query because settings briefly reported ready before indexing started.
- Protected staging was verified through Vercel CLI's authenticated bypass; protection remained enabled. The CLI created a project automation bypass token in its own credential storage. No token is in source or evidence files.
- Both production deployments used clean committed source exports so unrelated working changes were not published. The deployed runtime is `aec76a3`; the repository cleanup described above has not been deployed.
- The evaluation script also accepts `--base-url` for repeatable public-runtime checks. Use `bun run search:evaluate --base-url https://www.fabryka-atrakcji.com --check`.
- Local development now always uses Dataset Embeddings. A dataset-backed Astro server remains available at http://127.0.0.1:4321.
