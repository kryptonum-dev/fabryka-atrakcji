# Hotel and Event Space Filters Rebuild — Plan Brief

> Full plan: `context/changes/filters-upsell-hotels-spaces/plan.md`
> Research: `context/changes/filters-upsell-hotels-spaces/research.md`

## What & Why

We rebuild the hotel and event space filters agreed with Łukasz for a fixed price, with multi-select as his top priority. Event space filters do not work in production today, so the rebuild starts by repairing the routes.

## Starting Point

Only amenities and event space features allow several selections. Event space filter routes serve cached results, the data for most new filters does not exist, and filter copy and hotel ranges are hardcoded.

## Desired End State

Hotels have 7 filters and event spaces have 8, in PL and EN. Editors manage options, cities, ranges, radii and headings in Sanity. The client receives a finished feature with complete data, and only reviews the working values we list for them.

## Key Decisions Made

| Decision | Choice | Why | Source |
| --- | --- | --- | --- |
| Price | Full scope within the agreed price | Nothing is cut | Research |
| Delivery | Hand over complete, with working data marked | The client corrects in Sanity, with no further work from us | Research |
| Editing | Everything possible lives in Sanity | Fewer developer requests | Research |
| Languages | Separate PL and EN documents | Matches the current convention | Research |
| Space type and capacity | Pairs of type and capacity on each space | One source of truth, and new types work automatically | Research |
| Participant ranges | Match when the maximum reaches the lower bound | A big venue still fits a smaller group | Research |
| Removed filters | Price, rooms, area, features | Not on the client's list | Research |
| Address provider | Geoapify on Fabryka's account, after a 20-address test | Free, EU-hosted | Research |
| Route fix | Two wildcard rewrites in `vercel.json` | A hand-kept list is what broke | Plan |
| Filter logic | One tested TypeScript module, with GROQ for sorted pages | One set of rules, and far fewer queries | Plan |
| Autocomplete endpoint | POST | A GET would put addresses in logs | Plan |

## Scope

**In scope:**
- Filter route repair and `filter-crawl-trap` phases 1–2
- All agreed hotel and event space filters, in PL and EN
- New Studio collections, fields and page settings
- Complete data migration, including EN fixes that touch the filters
- Address autocomplete with privacy handling
- Removal of features and the area filter from the frontend and Sanity
- Client handover note

**Out of scope:**
- SEO landing pages
- `filter-crawl-trap` phase 3 (robots.txt)
- Translating objects with no EN version
- Km or distance sorting on hotels
- Search threshold and star SVG cleanup

## Architecture / Approach

Each listing fetches a small projection of all objects, computes matches and counts in `listing-facets.ts`, then requests the sorted page with `_id in $matchingIds`. Sanity holds options and settings. New fields stay optional until data is migrated, and old fields go last.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Filter route caching | Working filters on every route | Provable on production only |
| 2. Filter SEO fixes | Correct canonicals, no followed filter links | Wide but mechanical file changes |
| 3. Sanity schema | New collections, fields and settings | Studio deploys to the shared dataset |
| 4. Data migration | Every object filled in PL and EN | Quality of working data |
| 5. Shared logic and UI | Tested rules, generic multi-select | SelectFilter is used by both listings |
| 6. Hotels listing | 7 hotel filters | Facet data flow in `fetchData` |
| 7. Event spaces listing | Filters without the address | Display moves to new data |
| 8. Distance from address | Autocomplete, km, sorting, privacy | Geoapify quality on Polish addresses |
| 9. Remove old fields | Clean Studio, required fields | Deletions are hard to undo |
| 10. Handover | Client note and final audits | None |

**Prerequisites:** `GEOAPIFY_API_KEY` in the repo-root `.env` and in Vercel before Phase 8. Review the 8 unpushed `main` commits before the first deploy.
**Estimated effort:** about 6–8 focused sessions across 10 phases.

## Open Risks & Assumptions

- Working capacities for up to 8 mixed spaces affect public filter results until Łukasz corrects them.
- The wildcard rewrite is proven only by a production probe. An explicit route list is the fallback.
- Uncached EN and event space filter routes raise function usage until robots.txt rules ship.
- If Geoapify fails the 20-address test, Phase 8 stops, and Google Places needs a billing account.

## Success Criteria (Summary)

- A visitor can combine several options in every filter, in both languages, on production.
- A visitor can enter an office address and see the nearest spaces with distance on each card.
- Editors can change options and settings in Sanity with no developer, and every object has data on handover.
