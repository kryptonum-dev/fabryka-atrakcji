# Sanity dataset embeddings migration — Plan brief

> [Full plan](plan.md) · [Decisions](decisions.md) · [Historical research](research.md)

## What & Why

Move activity and hotel search from deprecated named indexes to dataset embeddings.
Keep the migration small by embedding text already stored on each document.

## Starting Point

Two legacy indexes currently provide candidate IDs used by existing listings.
Dataset embeddings were disabled when researched; implementation and production cutover are complete.
Failed retrieval currently removes the search restriction and can show broad results.

## Desired End State

Search uses each item's name, title, description and main content in the page language.
Existing cards, facets, explicit sorting and hotel pagination continue to work.
Failures show localized retry/browse actions.

## Key Decisions

| Decision | Choice | Source |
| --- | --- | --- |
| Embedding input | Existing local text only; omit reference-only labels | Latest user scope revision |
| Hidden fields and sync | None | Latest user scope revision |
| SEO noindex | Preserve separation from internal search | User |
| Failure behavior | Explicit unavailable state, retry/browse | User |
| Dataset | Existing fn3a7ltg/production | User |
| Candidate pool | Semantic top 50 per type/language, no fixed cutoff | Plan default |
| Rollback | Provider switch; retain legacy assets at least 14 days | Plan default |

## Scope

- Select local text, including useful inline text from known content blocks.
- Add dataset retrieval behind one shared server helper and compatibility API.
- Integrate active listings, failure UI and bilingual search navigation.
- Enable, evaluate and switch the existing production dataset.

No hidden schema fields, backfills, new webhooks, cron jobs or repair services.
No reference dereferencing in embeddings, dataset copy or Studio major upgrade.
No hybrid relevance system, listing redesign or legacy-index deletion.

## Approach

A checked-in projection tells Sanity which existing text to embed.
Sanity maintains those embeddings as content changes.
Templates call the server helper, then hydrate published results through existing listing queries.
Ordinary reference fields remain available for display and filtering.

## Phases at a Glance

| Phase | What it does |
| --- | --- |
| 1. Projection and contracts | Choose existing text fields and define the shared request/result rules |
| 2. Retrieval | Add dataset queries, retain legacy rollback and build small evaluation commands |
| 3. Listings | Connect search, show errors clearly and fix relevant bilingual navigation |
| 4. Production | Enable embeddings, check real results, switch traffic and record rollback |

## Effort and Prerequisites

Approximately 3–4 focused implementation sessions plus indexing/deployment time.
Requires dataset settings access and working runtime query permissions/quota.
No content write credentials or custom synchronization infrastructure are needed.

## Risks and Success Criteria

Queries based solely on referenced amenity/location/type labels may become weaker.
Inline amenity/location prose already in main content can still contribute naturally.
Evaluation expectations must come from the document's own text, not omitted references.
The bounded candidate pool and semantic-only ranking remain deliberate limitations.
Launch requires readiness, applicable relevance/eligibility checks, latency checks and working PL/EN routes.
Completed checks are recorded in the full plan's single Progress section; rollout.md contains launch evidence.
