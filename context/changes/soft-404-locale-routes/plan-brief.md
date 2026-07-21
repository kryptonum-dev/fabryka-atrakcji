# Soft 404 — Locale Routes — Plan Brief

> Full plan: `context/changes/soft-404-locale-routes/plan.md`
> Research: `context/changes/soft-404-locale-routes/research.md`

## What & Why

Every non-existent path under `/pl/*` and `/en/*` returns HTTP 200 with the 404 page body and
`robots: index, follow`. Google reads that as "this page exists and is fine", so phantom URLs burn
crawl budget and can be indexed as duplicates. Worse for us operationally: Screaming Frog sees them
as healthy 200s, so **broken internal links never appear in audit reports** — which is how Poznań
and Katowice slipped through the city-article check.

## Starting Point

58 route files (29 PL / 29 EN) signal not-found with `Astro.rewrite('/pl/404')`. Astro's
`#executeRewrite` clamps the response status to 200, and the compensating auto-404 in `renderPage`
only fires for the route named exactly `/404` — never `/pl/404`. `Astro.response.status` appears
nowhere in the codebase. Paths without a locale prefix behave correctly only because they match no
route at all and hit Vercel's platform-level catch-all.

## Desired End State

A nonsense URL under `/pl/` or `/en/` returns a real 404 with the branded page body, marked
`noindex, follow` and carrying no canonical. Screaming Frog and GSC start telling the truth about
broken links. A 404 accidentally cached for a not-yet-published article self-heals within an hour
instead of persisting until the next deploy.

## Key Decisions Made

| Decision | Choice | Why | Source |
|---|---|---|---|
| Fix mechanism | `Astro.response.status = 404` in the two locale 404 pages | 2 lines covers all 58 call sites and preserves the documented rewrite convention | Research |
| Where the assignment lives | Page files, **not** `NotFoundPage.astro` | Astro streams; only page frontmatter is awaited before the status is read | Research |
| ISR risk | `isr.expiration = 3600` | Currently unset → entries never expire; without a TTL a cached 404 can outlive a publish | Plan |
| Canonical removal | Opt-in `noCanonical` prop | `Head.astro` canonical is unconditional and every page flows through it; opt-in keeps blast radius at zero | Plan |
| noindex signal | Hardcoded in the template | Infrastructure, not editorial — belongs in git, not a CMS checkbox anyone can untick | Plan |
| Rollout | Single deploy, consolidated verification | Previews have no ISR, so only production can prove it; a fresh deploy resets the cache, so the TTL is in force immediately | Plan |
| robots.txt scope | Abusive-bot blocks only, no `/*/filtr/` rules | The December blocklist conflicts with June's `noindex, follow` — a disallowed page can't be crawled, so Google never reads either directive | Plan |

## Scope

**In scope:** HTTP 404 on locale routes · `noindex` on the 404 page · canonical removal ·
`isr.expiration` · `/pl/dokumenty/*` 302→404 · robots.txt collision + abusive-bot blocks

**Out of scope:** the 301 map for old valuable URLs (stays in `seo-domkniecie-czerwca`, blocked on
Wiktoria) · converting the 58 rewrite call sites · removing `hreflang` from the 404 ·
hardening `/api/revalidate` · adding a test runner

## Architecture / Approach

Two one-line assignments in `pl/404.astro` and `en/404.astro` fix the status for all 58 rewrite
sites at once, because the target page's `Astro.response.status` is read after the body renders and
therefore wins over the rewrite's clamp. Everything else is a small, independent edit: one config
key, one template spread, one opt-in prop in `Head.astro`, one endpoint pattern, one robots file.

## Phases at a Glance

| Phase | What it delivers | Key risk |
|---|---|---|
| 1. Status + ISR bound | Real 404s on locale routes; TTL on the cache; dokumenty 302→404 | Assignment in the wrong file fails silently under streaming |
| 2. Indexation signals | `noindex` + no canonical on the 404 | `Head.astro` is site-wide and has uncommitted changes from another workflow |
| 3. robots.txt | Single source of truth; abusive bots blocked | Over-restoring would undo June's `noindex, follow` work |
| 4. Verification | Consolidated production proof + re-crawl | Previews can't reproduce; only prod tells the truth |

**Prerequisites:** reconcile the uncommitted `Head.astro` changes from the parallel workflow;
run the sitemap × live-status cross-check before deploying.
**Estimated effort:** ~1 session for phases 1–3, plus a monitoring tail across several days.

## Open Risks & Assumptions

- **Sitemap collision.** Any sitemap URL that is currently a soft 404 becomes a hard GSC error on
  deploy. The cross-check is a pre-deploy gate (step 4.0), not an afterthought.
- **`exposeErrBody`.** The Vercel adapter never sets it, and Vercel doesn't document which statuses
  count as "error". 404 is on the cacheable allowlist so the branded body should survive, but step
  4.6 checks the cached variant explicitly rather than assuming.
- **Sanity read cost.** An hourly TTL means more revalidation than "never expire". Watch bandwidth
  for a day; raising the TTL is fine, returning it to `false` is not.
- **`Head.astro` merge collision** with the parallel JSON-LD/i18n workflow.

## Success Criteria (Summary)

- A nonsense URL under `/pl/` or `/en/` returns 404 — and still returns 404 once `x-vercel-cache` says `HIT`
- The 404 response says `noindex, follow` and carries no canonical; money pages and `/filtr` routes are untouched
- A re-crawl surfaces genuinely broken internal links that were previously invisible as 200s
