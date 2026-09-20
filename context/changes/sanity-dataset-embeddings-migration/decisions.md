---
change_id: sanity-dataset-embeddings-migration
created: 2026-09-20
updated: 2026-09-20
status: planning_decisions
---

# Planning decisions

These decisions record the user's answers during planning. They supersede conflicting recommendations in the research package, especially the proposal to use an isolated test dataset. They do not record implementation progress or claim that any Sanity settings have changed.

## Confirmed user decisions

### 1. Embed existing local text only — revised

**Latest answer:** The user proposed limiting embeddings to name, description and content to avoid overcomplicating the migration, then asked to reshape the plan around that approach.

Use existing name, title, description and main content text. Include useful inline text within known content blocks, but omit reference expansions and reference-only labels. Keep ordinary reference fields for display/filter queries. No hidden fields, synchronization, backfill, webhook or daily repair is required.

This explicitly supersedes the earlier “As recommended” answer that accepted preserving reference labels through stored context. Relevance for terms present only in referenced documents may change; exact reference-signal parity is no longer a requirement.

### 2. Preserve current SEO and internal-search separation

**Answer:** “Yes let's preserve the behavior.”

An item's `seo.doNotIndex` setting must not exclude it from the website's internal semantic search. Preserve the existing root-level `doNotIndex != true` eligibility predicate together with collection and slug eligibility; do not silently replace it with `seo.doNotIndex != true`.

The current indexed search checks the root-level field, while editors use the nested SEO field. The research found no root-level true flags in the checked activities/hotels. This decision preserves existing internal discoverability and does not change Google indexing directives.

### 3. Show an explicit search-unavailable state

**Answer:** “As recommended.”

When semantic retrieval fails, show a clear unavailable message with retry and browse options. Keep provider failure distinct from a successful query with zero results. Do not silently display the broader catalogue as matching results, and do not add automatic keyword fallback as part of this decision.

### 4. Evaluate on the current dataset

**Answer:** “On the current database, there no issue here.”

Plan initial enablement and evaluation against the existing `production` dataset in Sanity project `fn3a7ltg`. Do not require an isolated test dataset or dataset copy. The website can continue using the existing indexes while the replacement is prepared and evaluated.

This chooses the environment for the future migration; the current request is documentation/planning, not an instruction to enable embeddings or mutate content now. Readiness checks and reversible application cutover remain implementation requirements. Legacy-index deletion timing is not settled by this answer.

## Planning defaults selected when asked to proceed

The user asked to plan now. The following choices are engineering decisions for this plan, not additional user answers:

- Exclude category context and per-category name/description overrides from this migration. Use document-local text only; activity-type labels held only in referenced documents are omitted.
- Retrieve up to 50 candidates per collection and page language, then retain the existing facet/count/sort structure. Do not promise exhaustive matches beyond that candidate pool.
- Use semantic scoring only, with no fixed score threshold, hybrid mode or classifier. Weak/nonsense input may still produce ranked results; a genuine empty set renders no-results.
- Keep both legacy indexes and rollback credentials/code at least 14 days after cutover; do not delete them automatically or make cleanup part of this change. Review outside consumers before a later retirement action.
- Use explicit published semantic queries and hydration in production and previews.
- Select text from known content blocks directly in the embedding projection; do not introduce stored extraction fields or custom maintenance jobs.
- Use the documented HTTP settings API instead of requiring a Studio major upgrade. Verify new-provider behavior on the pinned API date during rollout.

## Undrawn UI design ruling

The requested unavailable state has no supplied Figma design. Author one compact localized panel from the existing Button, typography, spacing and focus conventions; follow kryptonum-styling when implementing. Keep successful listing layouts intact. Include a heading, short explanation, retry current local URL and browse regular collection links, with no modal, animation or new imagery. This is explicit plan design authority, not a claim of designer approval.

## Planning readiness

All decisions needed for the implementation plan are now recorded. The user request to proceed supersedes the earlier plan to require another question round. Platform permissions, quota, readiness and performance are measurable execution checks with an explicit keep-legacy outcome on failure; they are not unanswered product questions.

See [plan.md](plan.md) and [plan-brief.md](plan-brief.md). Implementation has not started; execution state will be tracked only in plan.md's Progress section.
