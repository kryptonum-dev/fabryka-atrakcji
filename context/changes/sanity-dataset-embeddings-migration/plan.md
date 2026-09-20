# Sanity dataset embeddings migration implementation plan

## Overview

Replace the deprecated activity/hotel indexes with dataset embeddings using existing document-local name, title, description and main content. Keep ordinary reference fields and display-time dereferences unchanged. Do not create hidden fields or a synchronization system.

Scope revised on 2026-09-20 at the user's request. This four-phase plan supersedes the earlier five-phase plan. Implementation has not started; all previous checks were pending. [Decisions](decisions.md) are authoritative over historical research recommendations.

## Current State Analysis

- `apps/astro/src/pages/api/embeddings.ts` calls two legacy indexes and returns `{data:[{score,value:{documentId,type}}]}`.
- `apps/astro/src/utils/filters.ts` calls the site's own API over HTTP. On failure it returns null, causing listings to lose the search restriction.
- `CategoriesPage.astro` and `HotelsPage.astro` are active consumers. Activity category-detail and event-space search are outside this migration.
- Listing GROQ uses candidate IDs for filtering and scores for relevance; facets, explicit sorting and hotel pagination are already implemented.
- Research observed enabled legacy indexes and disabled dataset embeddings on `fn3a7ltg/production`. These are historical observations, not launch readiness evidence.
- Preview fetches can include drafts. Semantic queries and their result hydration need an explicitly published client.
- English pagination and deployment rewrites have defects relevant to search. Coordinate changes with `filter-route-cache-bypass` and preserve unrelated working-tree edits.

## Desired End State

Visitors search activities and hotels in their page language through dataset embeddings. Existing cards, facets and explicit sorts remain usable. Provider failure shows a localized unavailable panel with retry/browse links. Deployment configuration can select the retained legacy provider for rollback.

### Key Discoveries

- Embedding projections cannot dereference other documents. The accepted response is to omit those reference-only signals, not copy their labels.
- Main content includes ordinary Portable Text and structured blocks containing local text. Flattening only top-level Portable Text would miss useful descriptions, inline amenity lists and location text.
- `seo.doNotIndex` controls SEO, not internal search eligibility. Preserve the existing root `doNotIndex != true` predicate.
- Removing reference labels changes relevance for queries whose terms occur only in referenced documents. This is an accepted scope tradeoff, not a parity requirement.

## What We're NOT Doing

- Hidden/derived schema fields, content backfills, label synchronization, new webhooks, cron jobs or repair services.
- Embedding top-level amenity/location/activity-type/category references or their labels, category overrides, root address/pricing/capacity/SEO fields, assets, or global promotional components.
- New datasets, Studio major upgrades, hybrid search, arbitrary score cutoffs, event-space semantic search or listing redesigns.
- Automatic provider fallback or deletion of legacy indexes, credentials and rollback code.

## Implementation Approach

A checked-in per-type GROQ projection selects existing local text. Sanity maintains its embeddings. Templates call a shared server helper directly, then reuse listing queries to hydrate the published candidates. The public API adapts that helper to the existing response envelope.

### Searchable content contract

Use only fields already stored on each activity/hotel:

| Source | Embedding input |
| --- | --- |
| `name`, `title`, `description` | Plain text; strip Portable Text structure where applicable |
| `content` text blocks | Span text in author order; no marks, keys or link targets |
| `Checklist`, `BlocksWithImage`, `RowsWithIcons` | Inline item text and descriptive headings; no images/icons |
| `Timeline`, `ImageWithHeadingAndText` | Inline headings, titles and descriptions; no duration/media metadata |
| Scoped `Faq` | Local question and answer text only; no global question references or contact boilerplate |
| Hotel `Amenities` content block | Existing inline group headings/list strings; distinct from root amenity references |
| Hotel `Location` content block | Existing travel/parking descriptions and attraction names; no generic transport upsell |
| Hotel `StayingRules` content block | Existing rule prose |

Exclude shared sales/process blocks such as `NextSteps`, testimonial references, file/image blocks, generic contact copy and the separate root `components` array. Unsupported blocks contribute no text. Use an explicit allowlist of known nested text paths, not serialized document JSON. No reference ID, `_key`, mark definition or asset metadata should become embedding text. Missing optional fields are harmless. Put name/title/description before longer content. The projection may return structured text arrays; no stored flattened field is needed.

### Runtime contract

- `SANITY_SEARCH_PROVIDER=legacy|dataset`, default `legacy` during preparation; invalid configuration fails visibly. No public provider override and no automatic fallback.
- Query: trimmed string, 1–500 characters; supported activity/hotel collection type and optional PL/EN language. Templates always supply language. Preserve omitted-language API compatibility for external callers by omitting only the locale predicate.
- Dataset queries filter type, language when present, valid slug and root `doNotIndex != true` before semantic scoring. Use published perspective, direct API, pinned date `2026-08-21`, descending score then `_id asc`, maximum 50 candidates. Verify the pinned date against the live service during rollout.
- Top 50 precedes existing facets. Counts describe this bounded pool; no exhaustive-match guarantee. Semantic-only scoring has no threshold, so nonsense input need not yield zero results.
- Return a discriminated success/unavailable state internally. Validate/deduplicate candidate IDs, supported types and finite scores. Never expose embedding vectors.
- Keep API success `{data:[{score,value:{documentId,type}}]}`; invalid input is 400 and provider failure 503, with safe errors and `Cache-Control: no-store`.
- Eight-second overall provider deadline, cancellation and disabled implicit SDK retries. Log provider, timing and error category without credentials or raw queries.
- Use a dedicated published search/hydration client with read-only credentials if required. Preserve existing client behavior for ordinary non-search pages.

## Critical Implementation Details

No editorial content is rewritten. Configuration enablement and vector generation are asynchronous. Keep legacy selected until readiness and relevance checks pass. Settings credentials are operational only; no settings write occurs in a website request.

Failure must not become `embeddingResults: null` and a broad catalogue masquerading as matches. Hide result totals, cards, pagination, ordinary empty-result content and result analytics on unavailable responses. A provider failure on hotel page 2 is not a 404.

## Phase 1: Define the local-text projection and contracts

### Overview

Specify which existing text Sanity embeds and establish the shared search types.

### Changes Required

**Files:** `apps/sanity/config/dataset-embeddings.projection.groq` (new); `apps/astro/src/server/search/contracts.ts` and focused tests (new); `apps/astro/src/env.d.ts`; `turbo.json`; root `package.json`.

**Design:** Server/configuration only.

**Intent:** Make the smaller content scope explicit and keep provider details out of templates.

**Contract:** Implement the searchable content and runtime contracts above. Cover both collection types with the projection; unsupported types contribute no searchable content. Add only the provider/read configuration actually needed, retaining existing legacy credentials. Do not add sync tokens, webhook secrets, cron configuration, schema fields or a Studio deployment dependency. Add `test:search` using the repository's Bun runtime, with deterministic fixtures for nested text and excluded references. Locally execute projection fixtures where supported; live projection acceptance remains Phase 4 evidence, not a string-snapshot claim.

### Success Criteria

#### Automated Verification

- Local projection/contract tests cover nested text, optional fields and reference/metadata exclusion: `bun run test:search`.
- Astro accepts the new modules and environment typing: `bun run --cwd apps/astro astro check`.

#### Manual Verification

- Review the projection against representative activity/hotel content and the allowlist; confirm no hidden field or reference expansion is required.

## Phase 2: Implement retrieval and evaluation tools

### Overview

Add dataset search while retaining the legacy provider as the preparation default and rollback option.

### Changes Required

**Files:** `apps/astro/src/server/search/catalog-search.ts`, `search-client.ts`, `legacy-provider.ts`, `dataset-provider.ts` and focused tests (new); `apps/astro/src/pages/api/embeddings.ts`; `apps/astro/src/global/constants.ts` if needed; `apps/sanity/scripts/dataset-embeddings.ts`, `evaluate-search.ts` (new); root `package.json`; `evaluation-corpus.json`.

**Design:** Server/API and command-line tooling.

**Intent:** Replace retrieval through one bounded interface and measure actual results before launch.

**Contract:** Implement the runtime contract. Keep the legacy endpoint/credential behavior available. Test malformed inputs, omitted/invalid language, empty success, duplicate/malformed results, timeout, abort, 401/403/429/5xx, provider selection and safe public errors.

Add `search:embeddings status` and `status --check-ready`; `enable` prints a dry-run settings request and `enable --apply` applies the checked-in projection through the HTTP settings API. Read/export current settings before changes; use bounded readiness polling and nonzero exits on errors/timeouts. No disable/delete operation or Studio upgrade is required.

Add `search:evaluate --provider legacy|dataset --check` with bounded sequential requests and saved IDs/ranks/timing/failure categories. Retain the 24-case corpus provenance, but classify cases against the new scope. Select expected IDs by independently reading published name/title/description/content, not by choosing whatever the provider returns. Require at least eight applicable positives across types/locales, including one real exact-name case per type/locale (four total). Each applicable positive must have an expected ID in its top five, with no draft/wrong-type/wrong-locale/ineligible candidate. Cases based solely on omitted reference labels are exploratory, not launch gates; absent concepts get explicit not-applicable reasons. Negative queries are observations, not mandatory zero-result assertions. Record legacy failures instead of treating legacy results as ground truth.

### Success Criteria

#### Automated Verification

- Provider/API tests pass for success, validation, timeout and failure isolation: `bun run test:search`.
- Settings inspection completes without writes: `bun run search:embeddings status`.
- Astro type checking passes: `bun run --cwd apps/astro astro check`.

#### Manual Verification

- Review expected corpus IDs against their own published text and identify reference-only cases explicitly.

## Phase 3: Connect listings and handle failure/navigation

### Overview

Use the new helper in the two active search flows and keep the visitor experience consistent.

### Changes Required

**Files:** `apps/astro/src/templates/activities/CategoriesPage.astro`; `apps/astro/src/templates/hotels/HotelsPage.astro`; `apps/astro/src/utils/filters.ts`; `apps/astro/src/components/activites/category/Listing.astro`; `apps/astro/src/components/hotels/Listing.astro`; `apps/astro/src/components/ui/SearchUnavailable.astro` (new), `Pagination.astro`, `SearchBar.astro`; `apps/astro/vercel.json`; focused integration/navigation tests; `apps/sanity/scripts/smoke-search-routes.ts` (new); root `package.json`.

**Design:** Keep current successful listing layouts. Build the undrawn unavailable panel from existing Button, spacing, typography and focus conventions, following kryptonum-styling during implementation. Provide localized PL/EN heading, explanation, retry and browse links; no modal or new visual design dependency.

**Intent:** Remove own-origin HTTP requests, preserve listing semantics, and make real search failures recoverable.

**Contract:** Templates call the helper with explicit locale. Hydrate semantic candidate cards/facets through the published client even in preview; non-search pages retain their existing behavior. Preserve own-filter facet exclusions, explicit sorts, score ordering with stable ties, hotel page size 16 and existing absolute price-bound behavior. Keep genuine empty success separate from unavailable; apply the failure behavior described above.

Retry preserves the current local path and query; browse returns to the regular collection and clears search/filter/page state. Normalize blank input into ordinary browsing and reset page when submitting a different query. Resolve duplicate submit handling and page-reset escaping. Generate localized `/filtr/` and `/filter/` paths, repair relevant English rewrites, and retain dynamic/uncached filter routes. Re-read overlapping changes before editing `vercel.json` or the activity Listing; do not overwrite other work.

Add read-only `search:smoke --base-url <url> --check` covering both locales/types, query variation, filters/sorts and hotel pagination. Exercise outage/zero-results/preview behavior with controlled local fixtures; never publish fault-injection content to production.

### Success Criteria

#### Automated Verification

- Listing-state and navigation tests pass, including empty/unavailable and page reset: `bun run test:search`.
- Astro production build and type checking pass: `bun run --cwd apps/astro build`.
- Changed Astro source files pass ESLint with explicit changed-file paths from the Astro workspace.

#### Manual Verification

- Inspect both languages on narrow/wide layouts; check cards, facets, explicit sort, page 2, whitespace search and browser navigation.
- Trigger a controlled local outage; verify safe copy, keyboard focus, retry/browse and absence of misleading counts/cards or failure-induced 404s.

## Phase 4: Enable, evaluate and switch production

### Overview

Enable dataset embeddings on the existing dataset, prove the narrower scope works, then move traffic.

### Changes Required

**Files/resources:** `fn3a7ltg/production` embeddings settings; Astro deployment environment; `evaluation-corpus.json`; generated evaluation evidence; `rollout.md` (new) and this package README.

**Design:** Deployment and operational evidence.

**Intent:** Complete a reversible migration with actual readiness and relevance measurements.

**Contract:** Deploy migration-capable code with `SANITY_SEARCH_PROVIDER=legacy`. Verify runtime read permissions, settings permissions and quota; snapshot current legacy/new settings without secrets. Apply `search:embeddings enable --apply` with the checked-in projection and await ready. No schema deploy, content mutation, backfill, webhook registration or cron provisioning is involved.

Run the completed evaluation with both providers. Test the new provider using deployed runtime credentials, not only an administrator token. Confirm expected-hit and eligibility checks. Record dataset-query p95 over at least three sequential runs of applicable positive queries; the launch budget is at most three seconds with no retrieval timeouts. This is a chosen performance target, not a vendor guarantee. If readiness, permissions, relevance or latency fail, keep legacy selected and correct the issue; do not silently change expected IDs or thresholds to pass.

Switch `SANITY_SEARCH_PROVIDER=dataset` and redeploy as required. Run production smoke checks and confirm provider identity in safe runtime diagnostics. Check varying queries are not incorrectly served from ISR. Record deployment ID, UTC cutover timestamp, projection/configuration evidence, evaluation output and rollback instructions in `rollout.md`.

Rollback selects `legacy` on the migration-capable deployment and redeploys; it does not disable dataset embeddings. Retain old indexes, their existing managed resources, legacy code and credentials at least 14 days after cutover. Record the earliest review date. Retirement after outside-consumer review is a later change; no automatic deletion or monitoring automation is created.

Document asynchronous indexing, settings inspection, query errors/429/latency diagnosis and the provider switch. There is no custom synchronization service to operate.

### Success Criteria

#### Automated Verification

- Production settings are ready and match the checked-in projection: `bun run search:embeddings status --check-ready`.
- Dataset evaluation passes eligibility, applicable expected-hit and latency checks: `bun run search:evaluate --provider dataset --check`.
- Deployed bilingual route checks pass: `bun run search:smoke --base-url https://www.fabryka-atrakcji.com --check`.
- Rollout evidence records deployment ID, dataset provider, UTC cutover time and an executable rollback procedure.

#### Manual Verification

- Review exact-name and conceptual searches supported by each document's own text in both languages.
- Confirm the production visitor flows, initial query error/quota/latency observations and retained rollback assets.

## Testing Strategy

Use focused behavioral tests for projection scope, input validation, provider failures, listing state and navigation. Mock external failures locally. Live semantic queries prove projection acceptance and ranking; static query snapshots do not. Keep baseline repository failures separate from introduced regressions. Do not add tests for documentation edits alone.

Evaluation explicitly accepts loss of reference-only signals. It must still prove retrieval from real local text. Keep source snapshots unchanged and save measured results separately with provenance.

## Performance Considerations

Bound each query to 50 candidates and an eight-second deadline; filter locale/type before scoring. Preserve current facet semantics over the bounded pool. Compact projection text reduces irrelevant input; removing custom synchronization also removes editorial-write amplification. Index freshness remains asynchronous.

## Migration Notes

Use the existing production dataset as requested. No dataset copy or editorial migration is necessary. Ordinary references continue serving cards and filters. Embedding projections omit reference expansions, while ordinary display GROQ can still dereference them. No requirement remains to preserve rankings driven only by omitted labels.

## Open Risks & Assumptions

- Relevance may change, especially when a location/amenity/type exists only in a referenced document.
- Custom content blocks require explicit text selection; future block types do not automatically join the projection.
- Sanity settings permissions, quota, published-query support and measured latency remain execution checks.
- Top-50 facets can yield no visible items even when other eligible documents exist outside the pool.
- Existing route/cache work may overlap the integration phase and must be reconciled before edits.

## References

- [Decisions](decisions.md), [research](research.md), [API findings](sanity-api-migration.md), [runtime contracts](runtime-and-contracts.md).
- [Projection research](projection-and-content.md), [live evidence](live-evidence.md), [evaluation corpus](evaluation-corpus.json).
- [Sanity dataset embeddings](https://www.sanity.io/docs/content-lake/dataset-embeddings) and [migration guide](https://www.sanity.io/docs/content-lake/migrate-from-embeddings-index-api).

## Progress

Implementation is in progress. This is the sole execution checklist; manual verification remains in each phase. The prior pending five-phase checklist is superseded by the approved simpler scope.

### Phase 1: Define the local-text projection and contracts

- [x] 1.1 Local projection/contract tests cover nested text, optional fields and reference/metadata exclusion: `bun run test:search`. — da87956
- [x] 1.2 Astro accepts the new modules and environment typing: `bun run --cwd apps/astro astro check`. — da87956

### Phase 2: Implement retrieval and evaluation tools

- [x] 2.1 Provider/API tests pass for success, validation, timeout and failure isolation: `bun run test:search`.
- [x] 2.2 Settings inspection completes without writes: `bun run search:embeddings status`.
- [x] 2.3 Astro type checking passes: `bun run --cwd apps/astro astro check`.

### Phase 3: Connect listings and handle failure/navigation

- [ ] 3.1 Listing-state and navigation tests pass, including empty/unavailable and page reset: `bun run test:search`.
- [ ] 3.2 Astro production build and type checking pass: `bun run --cwd apps/astro build`.
- [ ] 3.3 Changed Astro source files pass ESLint with explicit changed-file paths from the Astro workspace.

### Phase 4: Enable, evaluate and switch production

- [ ] 4.1 Production settings are ready and match the checked-in projection: `bun run search:embeddings status --check-ready`.
- [ ] 4.2 Dataset evaluation passes eligibility, applicable expected-hit and latency checks: `bun run search:evaluate --provider dataset --check`.
- [ ] 4.3 Deployed bilingual route checks pass: `bun run search:smoke --base-url https://www.fabryka-atrakcji.com --check`.
- [ ] 4.4 Rollout evidence records deployment ID, dataset provider, UTC cutover time and an executable rollback procedure.
