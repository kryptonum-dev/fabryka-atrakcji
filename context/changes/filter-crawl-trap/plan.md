# Filter Crawl Trap — Implementation Plan

> **Status note, 2026-11-02.** Phases 1 and 2 landed through the change `filters-upsell-hotels-spaces` (its Phase 2), rewritten for current code. Do not run them again. Checks live in `context/changes/filters-upsell-hotels-spaces/verify.sh`, and this folder never got its own `verify.sh`. The loud-failure step in Phase 1 was dropped because `fetchEmbeddings` no longer exists. **Phase 3 (robots.txt) stays open** and is still gated on the Search Console check. The Progress boxes below were left as they were, so read this note instead of them for phases 1 and 2.

## Overview

Three related SEO defects share one page family — the `/filtr` and `/filter` listing routes:

1. `Astro.url.origin` resolves to `https://localhost` on Vercel, poisoning the `<link rel="canonical">` on all 12 filter routes and silently killing semantic search on the two routes that use it.
2. The filter and sort dropdowns emit crawlable `<a href>` links into an unbounded, combinatorial filter URL space.
3. `robots.txt` does not block that space, so Googlebot grinds through it — and every hit on the PL routes is an uncached serverless invocation.

This plan fixes the origin leak, removes the crawl signal from the filter links, and then blocks the remaining crawl surface in `robots.txt` behind a Search Console safety check.

## Current State Analysis

**The origin leak.** `Head.astro:57` computes `finalCanonicalUrl = canonicalUrl || url`, where `url` falls back to `joinUrl(DOMAIN, path)`. Ordinary pages therefore emit a correct canonical. The 12 filter routes override it with `Astro.url.origin + '/…'`, and on Vercel `Astro.url.origin` is `https://localhost`. Verified live:

```
GET /pl/hotele/filtr/?order=newest
<link rel="canonical" href="https://localhost/pl/hotele/">
```

The same value is threaded into `fetchData(lang, …, url, searchParams)` and reaches `fetchEmbeddings` (`utils/filters.ts:193`), which requests `${url}/api/embeddings`. On Vercel that request cannot resolve; the failure is swallowed by `catch → return null`, and the listing falls back to unfiltered results. Verified live:

```
/pl/integracje/filtr/?search=kajaki     -> 51 results
/pl/integracje/filtr/?search=zzzqqqxyz  -> 51 results   (identical)
/pl/hotele/filtr/?search=warszawa       -> 16 results
/pl/hotele/filtr/?search=zzzqqqxyz      -> 16 results   (identical)
```

Critically, **this bug is invisible in local dev** — `astro dev` gives `Astro.url.origin === 'http://localhost:4321'`, which both looks plausible and actually works for the embeddings fetch. It only manifests on a deployed Vercel build.

**The crawl trap.** Filter links are real server-rendered anchors, so Googlebot walks them. Measured on production:

| Page | Crawlable `/filtr/` links |
| --- | --- |
| `/pl/hotele/`, `/pl/przestrzenie-eventowe/` | 4 (`?order=…` only) |
| `/pl/integracje/kategoria/<cat>/` | 26 (activityType ×11, duration ×5, participants ×6, order ×4) |
| any `/filtr/` page | ~24 more, each stacking one additional param |

With 19 PL + 16 EN activity categories, plus `/strona/N/filtr/` pagination variants, the reachable set is combinatorial. The ~900 URLs raised on Slack are discovery-to-date, not a ceiling.

The anchors originate in exactly two shared components:

- `components/ui/Dropdown.astro` — the item anchors at `:154` (fed by `buildFilterUrl`, `utils/filters.ts:245`) and the "clear selection" anchor at `:113`.
- `components/ui/Pagination.astro` — `createPageLink` at `:64`, which emits `/filtr/` targets whenever `isFiltered` is true (`:37`).

Hotels and event-spaces listings mount only `<Dropdown isSortingDropdown />`; their real filters navigate via `window.location.href` in client script, so they contribute 4 anchors each rather than 26.

**The cost.** `astro.config.ts:36-40` excludes `/filtr` and `/filter` from ISR. On the PL routes that exclusion is effective — measured `x-vercel-cache: MISS`, `cache-control: must-revalidate`, response times of 1.1s / 1.8s / 2.2s / 3.8s. Every Googlebot request on those routes is a live function invocation with a Sanity round-trip.

**Out-of-band discovery.** On the EN routes and both event-space routes the same URLs return `x-vercel-cache: HIT` with byte-identical bodies regardless of query string, which means filtering is non-functional there for real users. That is a separate defect with a different root cause and is tracked in its own change (see References).

## Desired End State

- Every filter route emits a canonical on the production host, pointing at its own base listing.
- Semantic search actually narrows results on `/pl/integracje/filtr/` and `/pl/hotele/filtr/`.
- No page emits a followed link into the filter URL space.
- `robots.txt` blocks `/filtr` and `/filter` crawling without touching any real asset or content route.
- A re-runnable script asserts all of the above against a deployed URL.

### Key Discoveries

- `Head.astro:57` — `canonicalUrl || url`; only the override is broken, the fallback is correct.
- `utils/join-url.ts:5` — `joinUrl` trims trailing slashes from the base and leading slashes from the path, so `joinUrl(DOMAIN, '/pl/hotele/')` preserves the trailing slash. This is the existing idiom in `Head.astro:55`.
- `global/constants.ts:31` — `DOMAIN = 'https://www.fabryka-atrakcji.com/'` (with trailing slash).
- `utils/filters.ts:193` — `fetchEmbeddings` swallows every failure via `catch → return null`; the caller cannot distinguish "no matches" from "request failed".
- `templates/event-spaces/EventSpacesPage.astro:31` — takes `_url` (underscore-prefixed, unused); event-spaces search runs through a GROQ `name match` filter, not embeddings.
- `templates/activities/ActivitiesPage.astro:36` — the category template takes no `url` at all and never calls `fetchEmbeddings`, so category filter pages have no semantic search to fix.
- `/_astro/filter.<hash>.css` exists in the build output (emitted from `filter.astro` page names). Any robots.txt rule matching `filter` without a following `/` or `?` would block a stylesheet and break Google's rendering of the listings.
- `seo-domkniecie-czerwca/change.md:41` deliberately set `noindex, follow` on filter pages to stop suppressing link equity to money pages. That decision stands; this plan attacks the links instead of the meta tag.

## What We're NOT Doing

- **Not** changing the `noindex, follow` meta in `Head.astro:73`. Deliberate June decision, explicitly upheld.
- **Not** fixing the ISR/caching defect that makes EN and event-space filtering non-functional. Separate change (see References).
- **Not** touching `vercel.json` — its route list is the caching change's territory, and editing it here would collide.
- **Not** converting dropdown anchors to `<button>`. Considered and rejected: it would break filtering without JS and touch three listing components for a benefit `rel="nofollow"` plus robots.txt already delivers.
- **Not** removing filter routes, changing the URL scheme, or adding canonical/`noindex` logic beyond fixing the host.
- **Not** fixing `Pagination.astro:37`, which tests `currentPath.includes('/filtr')` and so never detects the EN `/filter` spelling. Pre-existing, and on EN it fails *safe* — pagination falls back to non-filter paths, creating no trap URLs. Noted for the caching change.
- **Not** introducing a test framework. Verification is a curl script run against a preview deploy.

## Implementation Approach

Three phases, ordered so that each is independently verifiable and the riskiest step comes last.

Phase 1 is a mechanical find-and-replace across 22 files with an outsized payoff — it repairs the canonical *and* revives semantic search from a single root cause. Phase 2 is a two-component change that removes the crawl signal at its source. Phase 3 adds the robots.txt block, and is deliberately last because it is the only step that is awkward to reverse: a blocked URL can never be recrawled to reveal its `noindex`, so any URL currently sitting in the index would freeze as "Indexed, though blocked by robots.txt". It is gated on a human reading Search Console.

## Critical Implementation Details

**Verification must happen on a deployed URL, not locally.** `Astro.url.origin` is `http://localhost:4321` under `astro dev` — plausible-looking and functionally working, so a local check will pass against the broken code and prove nothing. Every assertion in this plan targets a Vercel preview or production URL.

**Robots.txt pattern safety.** Google's matcher treats only `*` and `$` as special and matches against path plus query string, with the most specific rule winning. `Disallow: /*/filter` would match `/_astro/filter.<hash>.css` and block a stylesheet. The rules must require a `/` or `?` immediately after `filter`. The PL spelling has no such collision — no legitimate path or asset contains `filtr`.

---

## Phase 1: Fix the localhost origin leak

### Overview

Replace every `Astro.url.origin` in `src/pages/` with the `DOMAIN` constant. This repairs the canonical on 12 filter routes and, through the same value, restores the embeddings request on the two routes that perform semantic search.

### Changes Required:

#### 1. Filter route canonicals (12 files)

**Files**:
- `src/pages/pl/hotele/filtr.astro`
- `src/pages/pl/hotele/strona/[page]/filtr.astro`
- `src/pages/pl/integracje/filtr.astro`
- `src/pages/pl/integracje/kategoria/[category]/filtr.astro`
- `src/pages/pl/przestrzenie-eventowe/filtr.astro`
- `src/pages/pl/przestrzenie-eventowe/strona/[page]/filtr.astro`
- `src/pages/en/hotels/filter.astro`
- `src/pages/en/hotels/page/[page]/filter.astro`
- `src/pages/en/activities/filter.astro`
- `src/pages/en/activities/category/[category]/filter.astro`
- `src/pages/en/event-spaces/filter.astro`
- `src/pages/en/event-spaces/page/[page]/filter.astro`

**Intent**: Each file builds `canonicalUrl` as `Astro.url.origin + '<base path>'`, producing `https://localhost/...` in production. Build it from the production domain instead. The target path in each file is already correct — only the host changes.

**Contract**: Import `DOMAIN` from `@/global/constants` and `joinUrl` from `@/utils/join-url`; `canonicalUrl` becomes `joinUrl(DOMAIN, '<same path as today>')`. This mirrors `Head.astro:55`. Trailing slashes on the path must be preserved — `joinUrl` only trims leading slashes from the path argument, so existing path literals carry over verbatim.

#### 2. Origin threaded into `fetchData` (all 22 files)

**Files**: the 12 above, plus
- `src/pages/pl/hotele/index.astro`, `src/pages/pl/hotele/strona/[page].astro`
- `src/pages/pl/integracje/index.astro`
- `src/pages/pl/przestrzenie-eventowe/index.astro`, `src/pages/pl/przestrzenie-eventowe/strona/[page].astro`
- `src/pages/en/hotels/index.astro`, `src/pages/en/hotels/page/[page].astro`
- `src/pages/en/activities/index.astro`
- `src/pages/en/event-spaces/index.astro`, `src/pages/en/event-spaces/page/[page].astro`

**Intent**: Every one of these passes `Astro.url.origin` as the `url` argument to a template `fetchData`. That argument exists solely to build the absolute `${url}/api/embeddings` endpoint. Pass `DOMAIN` so the request targets a resolvable host. The ten non-filter pages never reach the embeddings call today (no `searchParams` argument), but they are fixed for consistency so no future search entry point reintroduces the bug.

**Contract**: `fetchData` signatures are unchanged — only the argument value changes. Call sites that consume it: `templates/activities/CategoriesPage.astro:63` and `templates/hotels/HotelsPage.astro:44`, both `fetchEmbeddings(searchQuery, <type>, url)`. `templates/event-spaces/EventSpacesPage.astro:31` names the parameter `_url` and ignores it; leave that signature alone.

After this change no `Astro.url.origin` remains anywhere under `src/pages/`, which is the grep assertion in the success criteria.

#### 3. Loud failure in the embeddings fetch

**File**: `src/utils/filters.ts`

**Intent**: `fetchEmbeddings` returns `null` both when the request fails and when there is genuinely nothing to return, so a total outage looked identical to an empty result set — which is why this went unnoticed. Make a transport-level failure distinguishable in logs.

**Contract**: `fetchEmbeddings` keeps its current signature and its `null` return on failure — callers are unchanged. Only the `catch` block at `:209` and the non-OK branch at `:202` gain enough context (requested URL, search type) to identify the failure in Vercel logs. Do not throw; a hard failure here would take down the whole listing render.

#### 4. Verification script

**File**: `context/changes/filter-crawl-trap/verify.sh`

**Intent**: One re-runnable script asserting the outcomes of all three phases against a deployed URL, so later phases reuse it rather than growing ad-hoc curl commands. It lives in the change folder, not the app.

**Contract**: Takes a base URL as `$1` (defaulting to production), exits non-zero on any failed assertion, and prints one line per check. Phase 1 assertions:
- every filter route emits a canonical whose host is `www.fabryka-atrakcji.com` and never `localhost`;
- `/pl/integracje/filtr/?search=<real term>` and `?search=<nonsense term>` return **different** response bodies;
- the same for `/pl/hotele/filtr/`.

Assertions for phases 2 and 3 are appended in those phases. Guard the search assertion against the caching defect: it must run only against the two PL routes that are genuinely dynamic (`x-vercel-cache: MISS`), because the EN and event-space routes serve cached bodies and would fail for an unrelated reason.

### Success Criteria:

#### Automated Verification:

- Type check and build pass: `cd apps/astro && npm run build`
- No origin leak remains: `grep -rn "Astro.url.origin" apps/astro/src/pages/` returns nothing
- `verify.sh` canonical assertions pass against a preview deploy
- `verify.sh` search-narrowing assertions pass against a preview deploy

#### Manual Verification:

- View source on a deployed `/pl/hotele/filtr/?order=newest` and confirm the canonical points at `https://www.fabryka-atrakcji.com/pl/hotele/`
- Search a real term on `/pl/integracje/filtr/` and confirm the results are relevant, not the full catalogue
- Confirm no Vercel function logs show embeddings errors after the fix

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that manual testing was successful before proceeding.

---

## Phase 2: Stop emitting crawlable filter links

### Overview

Strip the crawl signal from every anchor pointing into the filter URL space. Two components own all of them.

### Changes Required:

#### 1. Filter and sort dropdown anchors

**File**: `src/components/ui/Dropdown.astro`

**Intent**: The item anchors at `:154` and the clear-selection anchor at `:113` are the source of every `/filtr/` link on the site — 26 per activity category page, 4 per hotels/event-spaces listing. Mark them so they carry no crawl or equity signal, while leaving them working as ordinary links for users (including without JS).

**Contract**: Add `rel="nofollow"` to both anchors. Applies unconditionally: this component is only ever mounted inside listing filter bars, and its `href` values come from `buildFilterUrl`, which returns either a filter URL or the base listing URL. No props, no styling, and no client script behaviour change — the `selectedValue` click handler at `:423` reads `href` and is unaffected.

#### 2. Filtered pagination links

**File**: `src/components/ui/Pagination.astro`

**Intent**: `createPageLink` (`:64`) emits `/strona/N/filtr/` targets whenever the current page is a filtered view, multiplying the trap by the page count. Those links must not be followed either.

**Contract**: `createPageLink` and the inline current-page anchor at `:83` emit `rel="nofollow"` **only when `isFiltered` is true** — the same condition `getPagePath` already branches on at `:37`. Ordinary pagination on blog, case studies, and unfiltered listings must keep its links followable; those are indexable pages in the sitemap and nofollowing them would be a real SEO regression. Lift `isFiltered` out of `getPagePath` so both it and `createPageLink` can read it.

#### 3. Extend the verification script

**File**: `context/changes/filter-crawl-trap/verify.sh`

**Intent**: Assert the crawl signal is actually gone from the pages that emit the most links.

**Contract**: Add assertions that on `/pl/integracje/kategoria/<cat>/` and `/pl/hotele/`, every anchor whose `href` contains `/filtr` or `/filter` also carries `rel="nofollow"` — count followed filter links and require zero. Also assert that ordinary pagination on `/pl/blog/` still has **no** `nofollow`, guarding the regression described above.

### Success Criteria:

#### Automated Verification:

- Type check and build pass: `cd apps/astro && npm run build`
- `verify.sh` reports zero followed filter links on the category and hotels listings
- `verify.sh` confirms blog pagination links remain followable

#### Manual Verification:

- Filter and sort dropdowns still work on desktop for activities, hotels, and event spaces
- The clear-selection ("x") control still clears its filter
- Pagination on a filtered listing still navigates correctly
- Blog and case-study pagination is visually and behaviourally unchanged

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that manual testing was successful before proceeding.

---

## Phase 3: Block the filter space in robots.txt

### Overview

Add `Disallow` rules for the filter routes. Gated on a Search Console check, because this is the one step that is unpleasant to reverse.

### Changes Required:

#### 1. Search Console gate (human, before any code)

**Intent**: `robots.txt` blocks crawling, not indexing. A blocked URL can never be recrawled to reveal its `noindex`, so any filter URL currently sitting in the index would freeze as "Indexed, though blocked by robots.txt" — harder to clear than to avoid. Confirm the filter URLs are already excluded before blocking them.

**Contract**: In Search Console → Pages, confirm the `/filtr` and `/filter` URLs report as **Excluded by 'noindex' tag**. If a material number report as **Indexed**, do not proceed: leave `noindex, follow` to finish its job and revisit after the next crawl cycle. This is a gate, not a task — record the observed status in the plan progress notes either way.

#### 2. Robots.txt rules

**File**: `apps/astro/src/pages/robots.txt.ts`

**Intent**: Stop Googlebot crawling the filter URL space, cutting both crawl budget waste and uncached serverless invocations on the PL routes.

**Contract**: Extend the `User-Agent: *` block (`:17-19`, which currently holds `Allow: /` and `Disallow: /api/`). The `Sitemap` line stays last. Rules:

```
Disallow: /*/filtr
Disallow: /*/filter/
Disallow: /*/filter?
```

The split is deliberate and must not be "simplified" to `Disallow: /*filter`. Google matches against path plus query string, and `/_astro/filter.<hash>.css` exists in the build output — requiring a `/` or `?` after `filter` excludes it. `filtr` has no such collision, so one rule covers both `/pl/…/filtr/` and the trailing-slash-less `/pl/…/filtr?query` form produced by the redirect routes. Add a comment recording that reasoning, in the style of the existing header comment at `:6-8`.

Also add `Allow: /_astro/` as explicit insurance for the asset directory. Most-specific-match already protects it, but the guard makes the constraint self-documenting for the next person editing this file.

#### 3. Extend the verification script

**File**: `context/changes/filter-crawl-trap/verify.sh`

**Intent**: Assert the rules are live and, more importantly, that they do not over-match.

**Contract**: Fetch `/robots.txt` and assert the three `Disallow` rules are present, that `Sitemap:` still resolves, and — the assertion that matters — that the deployed `/_astro/filter.<hash>.css` path is **not** matched by any rule. Discover the real stylesheet path by scraping a listing page rather than hardcoding a hash.

### Success Criteria:

#### Automated Verification:

- Type check and build pass: `cd apps/astro && npm run build`
- `verify.sh` confirms all three `Disallow` rules are present in the deployed `/robots.txt`
- `verify.sh` confirms the `/_astro/filter.<hash>.css` asset is not blocked
- `verify.sh` confirms the `Sitemap:` directive still points at a `200` sitemap

#### Manual Verification:

- Search Console gate was checked and its result recorded before this phase shipped
- Search Console robots.txt tester reports a filter URL as blocked and the `/_astro/` stylesheet as allowed
- The site renders normally in Search Console's URL Inspection live test on a listing page (proves no stylesheet was blocked)
- After roughly two weeks, crawl stats show reduced requests to filter URLs

**Implementation Note**: This phase depends on the Search Console gate. Do not start it until that check is done and recorded.

---

## Testing Strategy

There is no test framework in this repository — `npm run build` is `astro check && astro build`, and no `.test.*` or `.spec.*` files exist. Verification is therefore type-check plus assertions against a deployed URL.

### Automated (`verify.sh`):

- Canonical host is the production domain on all 12 filter routes
- Real vs nonsense search terms return different bodies on the two dynamic PL filter routes
- Zero followed filter links on the highest-emitting listings
- Blog pagination links remain followable
- Robots.txt rules present, `/_astro/` stylesheet unblocked, sitemap reachable

### Manual:

1. Deploy a preview; run `verify.sh <preview-url>`
2. Exercise every dropdown (filter, sort, clear) on activities, hotels, and event spaces
3. Search a real term on `/pl/integracje/filtr/` and confirm results narrow
4. Paginate a filtered listing and an unfiltered blog listing
5. Run Search Console URL Inspection on a listing page after phase 3 and confirm it renders

### Edge cases to cover manually:

- Filter dropdown with no available options (`data-disabled='true'`) still renders correctly
- The clear-selection control returns to the unfiltered base URL
- A filter page reached directly (not via a link) still emits the correct canonical

## Performance Considerations

Phase 1 restores a network request that has been failing fast — the two search routes will get slower once `fetchEmbeddings` actually reaches `/api/embeddings`. Those routes are ISR-excluded and already measure 1.1s–3.8s, so watch that search requests do not push past the function timeout. Phase 3 reduces load: blocking the filter space removes uncached invocations that currently serve no indexable page.

## Migration Notes

No data migration. Phase 3 is the only step with a lag: robots.txt changes take effect on Google's next fetch of the file (typically within a day), and crawl-rate effects appear over one to two weeks. Rollback for any phase is a revert plus redeploy; phase 3's caveat is that reverting restores crawling but does not undo any index-state change that occurred while the block was live — which is exactly what the Search Console gate exists to prevent.

## References

- Change identity and the full production evidence: `context/changes/filter-crawl-trap/change.md`
- Related, deliberately out of scope — ISR/caching defect breaking EN and event-space filtering: `context/changes/filter-route-cache-bypass/change.md`
- Prior SEO work, including the `noindex, follow` decision upheld here: `context/changes/seo-domkniecie-czerwca/change.md:41`
- Canonical fallback logic: `apps/astro/src/layouts/Head.astro:55-57`
- Filter URL construction: `apps/astro/src/utils/filters.ts:245`
- Embeddings fetch: `apps/astro/src/utils/filters.ts:187-213`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Fix the localhost origin leak

#### Automated

- [ ] 1.1 Type check and build pass
- [ ] 1.2 No `Astro.url.origin` remains under `src/pages/`
- [ ] 1.3 `verify.sh` canonical assertions pass against a preview deploy
- [ ] 1.4 `verify.sh` search-narrowing assertions pass against a preview deploy

#### Manual

- [ ] 1.5 Deployed filter route emits a production-host canonical
- [ ] 1.6 Semantic search returns relevant results, not the full catalogue
- [ ] 1.7 No embeddings errors in Vercel function logs

### Phase 2: Stop emitting crawlable filter links

#### Automated

- [ ] 2.1 Type check and build pass
- [ ] 2.2 `verify.sh` reports zero followed filter links on category and hotels listings
- [ ] 2.3 `verify.sh` confirms blog pagination links remain followable

#### Manual

- [ ] 2.4 Filter and sort dropdowns still work across all three listing types
- [ ] 2.5 Clear-selection control still clears its filter
- [ ] 2.6 Filtered pagination still navigates correctly
- [ ] 2.7 Blog and case-study pagination unchanged

### Phase 3: Block the filter space in robots.txt

#### Automated

- [ ] 3.1 Type check and build pass
- [ ] 3.2 `verify.sh` confirms all three `Disallow` rules are live
- [ ] 3.3 `verify.sh` confirms the `/_astro/filter.<hash>.css` asset is not blocked
- [ ] 3.4 `verify.sh` confirms the `Sitemap:` directive still resolves

#### Manual

- [ ] 3.5 Search Console gate checked and result recorded before shipping
- [ ] 3.6 Robots.txt tester: filter URL blocked, `/_astro/` stylesheet allowed
- [ ] 3.7 URL Inspection live test renders a listing page correctly
- [ ] 3.8 Crawl stats show reduced filter-URL requests after ~2 weeks
