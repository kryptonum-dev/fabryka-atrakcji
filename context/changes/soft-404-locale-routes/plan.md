# Soft 404 — Locale Routes Implementation Plan

## Overview

Non-existent paths under `/pl/*` and `/en/*` currently return HTTP 200 with the 404 page body,
`robots: index, follow`, and a canonical pointing at `/pl/404/`. This plan makes them return a
real 404, stops the 404 page inviting indexation, and bounds the ISR cache so that returning
404s cannot strand a published article behind a permanently-cached error.

Two adjacent defects found during research ship in the same pass: a dead `robots.txt` blocklist
and a 302-to-error-page pattern in `/pl/dokumenty/*`.

## Current State Analysis

All 58 locale route files (29 PL / 29 EN, perfectly symmetric) signal not-found with
`Astro.rewrite('/pl/404')` / `Astro.rewrite('/en/404')`. Astro's `#executeRewrite` sets
`this.status = 200` unconditionally (`node_modules/astro/dist/core/render-context.js:303`), and
the compensating auto-404 in `renderPage` fires only when `route === "/404"` **exactly**
(`node_modules/astro/dist/runtime/server/render/page.js:64`) — never `/pl/404` or `/en/404`.

`Astro.response.status` appears nowhere in `apps/astro/src`. That is the entire gap.

Paths without a locale prefix behave correctly for a reason unrelated to application code: they
match no route and fall through to Vercel's terminal catch-all
`{"src":"^/.*$","dest":"_render","status":404}`, where the status is forced at the platform layer.

The rewrite convention itself was deliberate — specified in
`context/archive/english-language-implementation-plan.md:147,152`. Its acceptance criterion reads
*"Missing EN route **shows** EN 404"*. Status codes were never in scope. This is a gap in the
original spec, not a regression.

## Desired End State

- Any non-existent path under `/pl/*` or `/en/*` returns **HTTP 404** with the branded 404 body.
- `/pl/404/` and `/en/404/` continue returning 404 (unchanged behaviour, now explicit).
- The 404 response carries `robots: noindex, follow` and **no** `<link rel="canonical">`.
- A wrongly cached 404 self-heals within one hour rather than persisting until redeploy.
- `/pl/dokumenty/*` returns 404 rather than 302-to-error-page.
- `robots.txt` has a single source of truth and blocks the two abusive crawlers.

Verified by the curl suite in Phase 4 run against production.

### Key Discoveries

- **The fix must live in the page files, not the shared template.** Astro streams by default. On
  the Node path Vercel runs, `renderToAsyncIterable`
  (`node_modules/astro/dist/runtime/server/render/astro/render.js:137-149`) awaits the **page
  factory** at `:138`, then `bufferHeadContent` at `:148`, and only then returns the iterator.
  Nested body components render lazily *after* `page.js:52` has read `init.status`.
  `NotFoundPage.astro` is a nested component — an assignment there is racy.
- **`Astro.response.status` survives the rewrite.** `page.js:51-52` reads `init.status` after the
  body renders, and `createResult` exposes `status` as a plain mutable property
  (`render-context.js:433`). The target page's assignment wins over the rewrite's clamp.
- **Astro 5.17.2 has no `notFound()` helper.** The ticket's suggested fix is Next.js App Router.
- **`isr.expiration` is unset** → adapter default `false`
  (`node_modules/@astrojs/vercel/dist/index.js:501`) → entries never expire. Live proof:
  `/pl/404/` serving `x-vercel-cache: HIT` at `age: 626999` (~7.25 days).
- **Each deployment gets a fresh ISR cache**, which is what makes a single-deploy rollout safe:
  the TTL is in force from the first request against the new 404s.
- **`Head.astro:80` canonical is unconditional** and every page renders through it. The 12
  `/filtr`+`/filter` routes depend on `canonicalUrl` overriding `url` — must not be disturbed.
- **Previews cannot reproduce any of this.** ISR is disabled when `VERCEL_ENV === 'preview'`
  (`apps/astro/src/utils/is-preview-deployment.ts:1`).
- **robots.txt collision**: `src/pages/robots.txt.ts` is `prerender = true` and overwrites
  `public/robots.txt` in the build output. The December blocklist has been inert since ~May 2026.

## What We're NOT Doing

- **Not** converting the 58 `Astro.rewrite()` call sites to `new Response(null, {status: 404})`.
  The 2-line fix achieves the same result and preserves a documented convention.
- **Not** touching the 301 map for old valuable URLs (ticket point 4) — that stays in
  `seo-domkniecie-czerwca`, blocked on Wiktoria's target decisions.
- **Not** restoring the `/*/filtr/` rules from `9fbb8ef`. They conflict with June's
  `noindex, follow` strategy (`8e70f12`): a robots-disallowed page can't be crawled, so Google
  never reads the `noindex` or the `follow`. Decision recorded 21.07: keep June's strategy.
- **Not** removing the `hreflang` block from the 404 page. It is meaningless there, but touching
  `Head.astro:81-82` days after `8e70f12` added `x-default` risks confusing that intent for
  cosmetic gain on a page that will return 404 anyway.
- **Not** hardening the `/api/revalidate` verification path. Real, but a separate concern; the
  ISR TTL bounds the damage it could cause.
- **Not** adding automated tests. The repo has no test runner, and introducing one is out of scope
  for a P1 SEO fix.

## Implementation Approach

Four phases, **one deploy**. Phases 1–3 are pre-deploy code changes verified locally with
`astro check` and a production build; Phase 4 is the consolidated production verification that
can only run post-deploy because previews have no ISR.

Phase 1 pairs the status change with the ISR TTL deliberately: the TTL is the mitigation that
makes returning 404s safe, and shipping them together means the new cache starts bounded.

## Critical Implementation Details

**Timing & lifecycle.** The `Astro.response.status = 404` assignment must be in the *page*
frontmatter (`pl/404.astro`, `en/404.astro`) — see Key Discoveries. Putting it in
`NotFoundPage.astro` will appear to work in dev and fail unpredictably under streaming.

**Ordering.** A new deployment resets the ISR cache, so a single deploy carrying both the status
change and `isr.expiration` has no window in which an unbounded 404 can be pinned. Do not ship
the status change in a deploy that lacks the TTL.

**Debug & observability.** Every production assertion in Phase 4 must check `x-vercel-cache`
alongside the status code. A `MISS` and a `HIT` can disagree, and only the `HIT` reflects what
crawlers will see on repeat visits.

**Working-tree collision.** `apps/astro/src/layouts/Head.astro` has uncommitted modifications from
an unrelated workflow (JSON-LD/i18n work). Phase 2 edits the same file. Reconcile before editing;
line numbers in this plan were read from the current working tree, not from `386b076`.

---

## Phase 1: Real 404 status + ISR bound

### Overview

Make locale-prefixed not-found responses carry HTTP 404, and bound the ISR cache so a wrongly
cached 404 self-heals.

### Changes Required:

#### 1. Locale 404 pages

**File**: `apps/astro/src/pages/pl/404.astro`, `apps/astro/src/pages/en/404.astro`

**Intent**: Set the response status explicitly so that the ~58 routes rewriting into these pages
return 404 instead of the rewrite's clamped 200. Idempotent for direct hits, which already
return 404 via a different code path.

**Contract**: Add `Astro.response.status = 404` to the frontmatter of each page, before the
component renders. Must be in these page files — not `NotFoundPage.astro` (streaming order,
see Critical Implementation Details).

#### 2. Root 404 page

**File**: `apps/astro/src/pages/404.astro`

**Intent**: Add the same assignment for consistency and to document intent. Functionally
redundant — this route is `/404`, so `page.js:64` forces 404 regardless — but it makes the
invariant uniform across all three entry points.

**Contract**: Same as above.

#### 3. ISR expiration

**File**: `apps/astro/astro.config.ts`

**Intent**: Bound the lifetime of every ISR entry so that a 404 cached for a not-yet-published
URL cannot outlive the publish. Currently unset, which the adapter resolves to "never expires".

**Contract**: Add `expiration: 3600` to the `isr` object alongside the existing `bypassToken` and
`exclude` keys (`astro.config.ts:31-37`). Leave `exclude` untouched.

#### 4. Document download routes

**File**: `apps/astro/src/pages/pl/dokumenty/[filename].ts` (lines 28, 33, 48),
`apps/astro/src/pages/pl/dokumenty/oferta/[filename].ts` (line 33)

**Intent**: Replace the four `redirect('/404')` calls, which produce a 302 to the error page —
a soft-404 pattern Google treats as badly as the 200 case — with a real 404.

**Contract**: `return new Response(null, { status: 404 })`. The `null` body is required: it is
what lets `app/index.js:406` re-render the branded 404 page with a 404 status. If Astro does not
render the branded body for endpoint routes, a bare 404 is still a correct outcome and strictly
better than the current 302 — either result satisfies this phase. Drop the now-unused `redirect`
param from the `APIRoute` destructuring in both files.

### Success Criteria:

#### Automated Verification:

- Type checking passes: `cd apps/astro && npx astro check`
- Production build succeeds: `cd apps/astro && npm run build`
- Linting passes: `npm run lint`
- No remaining `redirect('/404')` in `apps/astro/src`: `grep -rn "redirect('/404')" apps/astro/src` returns nothing
- `Astro.response.status = 404` present in all three 404 pages

#### Manual Verification:

- Local dev server returns 404 for a nonsense locale path (`/pl/blog/xyz123`) — note ISR is absent locally, so this validates the status logic only
- Branded 404 content still renders (not a blank error page)
- `/pl/404/` and `/en/404/` still render correctly when hit directly

**Implementation Note**: Do not deploy Phase 1 alone. It ships together with Phases 2 and 3 in a
single deploy — see Implementation Approach.

---

## Phase 2: 404 indexation signals

### Overview

Stop the 404 page declaring itself indexable and canonicalising every phantom URL to `/pl/404/`.

### Changes Required:

#### 1. Hardcode noindex on the 404 template

**File**: `apps/astro/src/templates/NotFoundPage.astro` (line 52)

**Intent**: Force `noindex, follow` on every 404 response regardless of CMS state. Live Sanity
check confirms `seo.doNotIndex` is `null` on both `NotFound_Page` docs — the field exists and was
never ticked. This is infrastructure, not editorial, so it belongs in git rather than the CMS.

**Contract**: Pass `doNotIndex` on the `<Layout {...metadata}>` spread. `Head.astro:69` already
consumes it and emits `noindex, follow` — `follow` is deliberate per `8e70f12` and must be
preserved.

#### 2. Opt-in canonical suppression

**File**: `apps/astro/src/layouts/Head.astro`

**Intent**: Allow a page to suppress its canonical link. A 404 should not canonicalise to
anything. Implemented as opt-in so that the default behaviour — and the 12 `/filtr` routes that
depend on `canonicalUrl` overriding `url` — are provably unaffected.

**Contract**: Add `noCanonical?: boolean` to `HeadProps` (currently `Head.astro:25-32`), destructure
it alongside the existing props, and guard the `<link rel="canonical">` emission at
`Head.astro:80`. Do not alter the `canonicalUrl || url` expression at `:53`. Reconcile with the
uncommitted changes already present in this file.

#### 3. Apply canonical suppression to the 404

**File**: `apps/astro/src/templates/NotFoundPage.astro` (line 52)

**Intent**: Use the new prop on the only page that should have no canonical.

**Contract**: Pass `noCanonical` on the same `<Layout>` spread as `doNotIndex`.

### Success Criteria:

#### Automated Verification:

- Type checking passes: `cd apps/astro && npx astro check`
- Production build succeeds: `cd apps/astro && npm run build`
- Linting passes: `npm run lint`

#### Manual Verification:

- Local render of `/pl/404/` shows `<meta name="robots" content="noindex, follow">` and no `<link rel="canonical">`
- Local render of a money page (e.g. `/pl/`) still shows `index, follow` and its self-canonical
- Local render of a `/filtr` route still shows `noindex, follow` and its canonical pointing at the base listing

---

## Phase 3: robots.txt single source of truth

### Overview

Eliminate the silent shadowing between `public/robots.txt` and the prerendered route, and restore
only the abusive-crawler blocks.

### Changes Required:

#### 1. Consolidate onto the route

**File**: `apps/astro/src/pages/robots.txt.ts`, `apps/astro/public/robots.txt`

**Intent**: Today the prerendered route silently overwrites the static file, so the December
blocklist has been inert since ~May 2026 without anyone noticing. Keep the route as the single
source (it already interpolates `DOMAIN`) and delete the static file so the shadowing cannot recur.

**Contract**: Extend the `content` array in `robots.txt.ts:6` to include full `Disallow: /` groups
for `SERankingBacklinksBot` and `PetalBot`, plus `Disallow: /api/` on the `User-Agent: *` group,
keeping the existing `Allow: /` and `Sitemap:` line. Delete `apps/astro/public/robots.txt`.

**Explicitly excluded**: every `/*/filtr/` and `/*/filter/` rule, and the `AhrefsBot`,
`SemrushBot`, `MJ12bot`, `Googlebot` and `Bingbot` groups. Decision recorded 21.07 — those rules
conflict with June's `noindex, follow` strategy and would strand indexed filter URLs.

### Success Criteria:

#### Automated Verification:

- Production build succeeds: `cd apps/astro && npm run build`
- Built output contains the blocklist: `grep -c "SERankingBacklinksBot" apps/astro/dist/client/robots.txt` returns 1
- Built output contains no filter rules: `grep -c "filtr" apps/astro/dist/client/robots.txt` returns 0
- `apps/astro/public/robots.txt` no longer exists

#### Manual Verification:

- Built `robots.txt` still points at `/sitemap-index.xml`
- No other file in `public/` collides with a route name

---

## Phase 4: Production verification & re-crawl

### Overview

Single consolidated verification pass after the one deploy. This is the only phase that can prove
the fix, because previews have no ISR.

### Changes Required:

No code changes. Verification and monitoring only.

**Pre-deploy gate**: cross-check every URL in `/sitemap-index.xml` against its live status. Any
URL that is currently a soft 404 will become a hard "Submitted URL not found (404)" error in
Search Console the moment this ships. Resolve or de-list those before deploying.

### Success Criteria:

#### Automated Verification:

- Every ticket row returns 404: run the curl suite over the 9 URLs from `bug-soft404-fa.md`, plus `/pl/hotele/nieistniejacy-xyz/` and `/en/activities/nieistniejaca-xyz/`
- Control paths unchanged: `/nieistniejaca-strona-xyz123` still 404, `/pl/404/` and `/en/404/` still 404
- Money pages unaffected: `/pl/`, `/en/`, `/pl/blog/`, and one live article each in PL and EN return 200
- 404 response carries `noindex`: `curl -s <soft404-url> | grep -c 'content="noindex, follow"'` returns 1
- 404 response has no canonical: `curl -s <soft404-url> | grep -c 'rel="canonical"'` returns 0
- Cached 404s stay 404: re-request each URL until `x-vercel-cache: HIT` and confirm the status is still 404 and the branded body is intact
- Paginated 301s did not regress: page-2 URLs across all listing families still return 301, not 404
- `robots.txt` live content matches the built file
- `/pl/dokumenty/nieistniejacy.pdf` returns 404, not 302

#### Manual Verification:

- Branded 404 page renders correctly in a browser (not a blank or bare error page) for both PL and EN
- Re-crawl with Screaming Frog now surfaces genuinely broken internal links that were previously invisible as 200s
- Publish-after-404 check: request a not-yet-published URL to cache a 404, publish that document in Sanity, confirm the page serves 200 within the hour
- GSC monitoring over the following days: "Nie znaleziono (404)" rises, "Miękki błąd 404" falls, no unexpected drop in indexed money pages

---

## Testing Strategy

The repo has no test runner, so verification is build-time checks plus production probes.

### Build-time:

- `npx astro check` — type safety across the new `noCanonical` prop and the modified endpoint routes
- `npm run build` — catches the `ForbiddenRewrite` class of error and any prerender conflicts
- `npm run lint` — the unused `redirect` param in the dokumenty routes would otherwise slip through

### Manual Testing Steps:

1. Local dev: request `/pl/blog/xyz123` and confirm 404 status with branded body
2. Local dev: confirm a money page and a `/filtr` route are unchanged in robots + canonical
3. Post-deploy: run the full curl suite from Phase 4 against production
4. Post-deploy: repeat each probe until `x-vercel-cache: HIT` to confirm the cached variant
5. Post-deploy: exercise the publish-after-404 path end to end

## Performance Considerations

`isr.expiration = 3600` means every ISR entry revalidates at most hourly instead of living for the
deployment's lifetime. This increases Sanity reads. Given
`context/archive/sanity-bandwidth-optimization/` exists as prior art on exactly this cost, watch
Sanity bandwidth for the first day after deploy. If it spikes, raising the TTL is a one-line
change — but do not return it to `false`, which is what created the risk.

## Migration Notes

No data migration. The ISR cache resets on deploy, so all pre-existing cached soft-404 200s are
discarded automatically — no manual purge needed.

The 404 pages themselves (`/pl/404/`, `/en/404/`) are currently cached at ~7 days age; the deploy
resets these too.

## References

- Research: `context/changes/soft-404-locale-routes/research.md`
- Source ticket: `~/Desktop/bug-soft404-fa.md`
- Rewrite convention origin: `context/archive/english-language-implementation-plan.md:147,152`
- June SEO decisions (canonical audit, `noindex, follow`): `context/changes/seo-domkniecie-czerwca/change.md:40-41`
- Paginated 301 decision: `context/archive/activities-show-more/research.md:174-186`
- Sanity cost prior art: `context/archive/sanity-bandwidth-optimization/`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Real 404 status + ISR bound

#### Automated

- [x] 1.1 Type checking passes (`astro check`)
- [x] 1.2 Production build succeeds
- [x] 1.3 Linting passes
- [x] 1.4 No remaining `redirect('/404')` in `apps/astro/src`
- [x] 1.5 `Astro.response.status = 404` present in all three 404 pages

#### Manual

- [x] 1.6 Local dev returns 404 for a nonsense locale path
- [x] 1.7 Branded 404 content still renders
- [x] 1.8 `/pl/404/` and `/en/404/` still render when hit directly

### Phase 2: 404 indexation signals

#### Automated

- [x] 2.1 Type checking passes (`astro check`)
- [x] 2.2 Production build succeeds
- [x] 2.3 Linting passes

#### Manual

- [x] 2.4 404 renders `noindex, follow` and no canonical
- [x] 2.5 Money page unchanged (`index, follow` + self-canonical)
- [x] 2.6 `/filtr` route unchanged (`noindex, follow` + base-listing canonical)

### Phase 3: robots.txt single source of truth

#### Automated

- [x] 3.1 Production build succeeds
- [x] 3.2 Built `robots.txt` contains `SERankingBacklinksBot`
- [x] 3.3 Built `robots.txt` contains no `filtr` rules
- [x] 3.4 `apps/astro/public/robots.txt` deleted

#### Manual

- [x] 3.5 Built `robots.txt` still points at `/sitemap-index.xml`
- [x] 3.6 No other `public/` file collides with a route name

### Phase 4: Production verification & re-crawl

#### Automated

- [x] 4.0 Pre-deploy gate: sitemap URLs cross-checked against live status
- [ ] 4.1 All ticket rows return 404
- [ ] 4.2 Control paths unchanged
- [ ] 4.3 Money pages return 200
- [ ] 4.4 404 response carries `noindex`
- [ ] 4.5 404 response has no canonical
- [ ] 4.6 Cached 404s (`x-vercel-cache: HIT`) still 404 with intact body
- [ ] 4.7 Paginated 301s did not regress
- [ ] 4.8 Live `robots.txt` matches built file
- [ ] 4.9 `/pl/dokumenty/nieistniejacy.pdf` returns 404

#### Manual

- [ ] 4.10 Branded 404 renders in browser, PL and EN
- [ ] 4.11 Re-crawl surfaces genuinely broken internal links
- [ ] 4.12 Publish-after-404 recovers within the hour
- [ ] 4.13 GSC monitoring: hard 404s rise, soft 404s fall, money pages stable
