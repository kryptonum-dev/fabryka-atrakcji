---
date: 2026-07-21T11:55:05+02:00
researcher: OliwierSellig
git_commit: 386b0761fc71822cc37e7659cf6a2b0e69613f14
branch: main
repository: kryptonum-dev/fabryka-atrakcji
topic: "Soft 404 — locale-prefixed routes return HTTP 200 instead of 404"
tags: [research, codebase, routing, seo, astro, vercel-isr, i18n, 404]
status: complete
last_updated: 2026-07-21
last_updated_by: OliwierSellig
---

# Research: Soft 404 — locale-prefixed routes return HTTP 200 instead of 404

**Date**: 2026-07-21T11:55:05+02:00
**Researcher**: OliwierSellig
**Git Commit**: `386b0761fc71822cc37e7659cf6a2b0e69613f14`
**Branch**: `main`
**Repository**: `kryptonum-dev/fabryka-atrakcji`
**Source ticket**: `~/Desktop/bug-soft404-fa.md` (P1, reported 20.07.2026)

Permalink base: `https://github.com/kryptonum-dev/fabryka-atrakcji/blob/386b076/`

## Research Question

Why does every non-existent path under `/pl/*` and `/en/*` return HTTP 200 with the 404
page body (plus `robots: index, follow` and a canonical pointing at `/pl/404/`), while paths
without a locale prefix correctly return 404? How is the 404 page rendered, where do the meta
tags come from, and how does Vercel ISR interact with 404 status codes?

Scope agreed with Oliwier: ticket points 1–3 (HTTP status, meta robots, canonical). Point 4
(old valuable URLs → 301) stays in `seo-domkniecie-czerwca`.

## Summary

**Root cause, in one line:** all 58 locale route files signal "not found" with
`Astro.rewrite('/pl/404')` / `Astro.rewrite('/en/404')`, and Astro's `#executeRewrite`
**hard-resets the response status to 200** — while the compensating auto-404 in `renderPage`
only fires for the route named exactly `/404`, never `/pl/404` or `/en/404`.

The bug is a two-sided asymmetry, and both sides had to line up for it to be invisible for
~15 months:

| Path | Route matched | Status source | Result |
|---|---|---|---|
| `/nieistniejaca-xyz` | none → Vercel catch-all | `{"src":"^/.*$","dest":"_render","status":404}` | **404 ✅** |
| `/pl/404/` (direct) | `/pl/404` | `#getDefaultStatusCode` — `route.endsWith("/404")` matches | **404 ✅** |
| `/pl/blog/xyz` (missing) | `/pl/blog/[slug]` → rewrite → `/pl/404` | `#executeRewrite` clamps to 200; `renderPage` override needs `route === "/404"` **exactly**, so it doesn't fire | **200 ❌** |

Three findings materially change the shape of the fix versus what the ticket assumes:

1. **The ticket's suggested fix does not apply.** Astro 5.17.2 has **no `notFound()` helper**
   (that's Next.js App Router). Verified against the installed source.
2. **A 2-line fix covers all 58 call sites** — but it must go in the *page* files, not the
   shared template. Astro streams by default, and only page frontmatter is awaited before the
   status is read. Putting it in `NotFoundPage.astro` would be racy. (Verified from source;
   this corrects the sub-agent that proposed the template.)
3. **The real risk is not the fix, it's `isr.expiration`.** It is unset → `expiration: false`
   → **cache entries never expire**. Live proof: `/pl/404/` serving `x-vercel-cache: HIT` at
   `age: 626999` (~7.25 days). Today a wrongly-cached response is a harmless 200. After the
   fix it is a **404 that can outlive the article's publication indefinitely.**

Two adjacent problems surfaced that are not in the ticket but belong in the same pass
(see [Adjacent findings](#adjacent-findings-not-in-the-ticket)): the December 2025 crawler
blocklist is silently dead, and `/pl/dokumenty/*` uses a worse 302-to-error-page pattern.

## Detailed Findings

### A. Root cause — the exact source chain

Astro `5.17.2`, `@astrojs/vercel` `9.0.4` (`apps/astro/package.json:15,19`). No i18n
integration — locales are plain directory routing, no `i18n` block in `astro.config.ts`.

**Step 1 — the rewrite clamps the status.**
`node_modules/astro/dist/core/render-context.js:303`, inside `#executeRewrite`:

```js
this.pathname = pathname;
this.isRewriting = true;
this.status = 200;        // ← unconditional
```

This is not "the status is inherited from the original route" — it is explicitly set to 200.
Same statement again at `:184` for the middleware rewrite branch.

**Step 2 — `createResult` seeds `Astro.response` from that clamped value.**
`render-context.js:433`:

```js
const response = {
  status: actionResult?.error ? actionResult?.error.status : status,   // ← this.status, now 200
  ...
};
```

`status` is a plain, mutable property — which is what makes the fix in §C possible.

**Step 3 — `renderPage` reads it back, with an override that misses.**
`node_modules/astro/dist/runtime/server/render/page.js:51-72`:

```js
const init = result.response;
let status = init.status;
if (route?.route === "/404") {          // ← EXACT match, not endsWith
  status = 404;
} else if (route?.route === "/500") { ... }
if (status) return new Response(body, { ...init, headers, status, statusText });
```

The rewrite target is `/pl/404`, not `/404`, so the override never fires and the 200 ships.

**Step 4 — why a direct hit on `/pl/404/` is fine.** A *different* code path handles the
entry route — `node_modules/astro/dist/core/app/index.js:566`, `#getDefaultStatusCode`, uses
`route.endsWith("/404")`, which **does** match `/pl/404`. That runs at `app/index.js:369`,
*before* `#executeRewrite` overwrites it. Hence: direct = 404, rewritten-into = 200.

**Step 5 — why the salvage path doesn't rescue it.** `app/index.js:406-408` can re-render as a
404, but requires `response.body === null`. The rewrite produced a full HTML body, so nothing
fires.

#### Call-site inventory (exact, counted at HEAD)

```
58 call sites across 58 files — 29 × Astro.rewrite('/pl/404'), 29 × Astro.rewrite('/en/404')
```

Perfectly symmetric PL/EN. Representative — `apps/astro/src/pages/pl/[slug].astro:6-11`:

```astro
const slug = Astro.params.slug || ''
const pageResult = await fetchPage(slug, 'pl')

if (!pageResult) return Astro.rewrite('/pl/404')
```

**There is zero use of `Astro.response.status` anywhere in `apps/astro/src`.** That is the gap.

Coverage spans every route family in the ticket: detail pages (`[slug]`), categories
(`kategoria/[category]`), pagination (`strona/[page]`), filter routes, and every `index.astro`
and static page. Notably the listing/static pages rewrite too — so even
`/pl/blog/` would soft-404 if its Sanity doc vanished.

### B. Why non-locale paths behave correctly

Two independent layers, either of which suffices:

1. **Vercel routing layer (dominant).** `apps/astro/.vercel/output/config.json` terminates with
   `{"src": "^/.*$", "dest": "_render", "status": 404}`. The `status` field is applied by
   Vercel's router. Route inventory in that file: 1 `handle: filesystem`, 1 `_astro` cache
   rule, ~500 Sanity redirect routes, 556 ISR routes, 26 `_render` routes, then this catch-all.
2. **Astro layer.** Inside `_render`, no route matches, `#renderError` falls back to
   `src/pages/404.astro`, whose route *is* `/404` → both `#getDefaultStatusCode` and the
   `renderPage` override return 404.

The contrast is purely about **route matching**: `/pl/nieistniejaca-xyz` **does** match a real
ISR route pattern — `{"src": "^/pl/([^/]+?)/?$", "dest": "/_isr?x_astro_path=$0"}` — with no
`status` field, so Vercel forwards whatever the function returns. The function returns 200.

Critically, the generated patterns are **wildcards, not enumerated slugs**. Although most
dynamic routes declare `getStaticPaths` (e.g. `pl/integracje/[slug].astro:8`), `output: 'server'`
plus no `export const prerender = true` means they are on-demand, so `getStaticPaths` never
constrains the matchable path space. Any garbage slug reaches the function.

### C. The fix — and the streaming constraint

The ticket suggests `notFound()` from `next/navigation`. **That does not exist in Astro.**
Verified in the installed source: no `notFound` export anywhere in `node_modules/astro/dist`.

Two viable options.

#### Option A — set the status in the two locale 404 pages (recommended)

```astro
// apps/astro/src/pages/pl/404.astro  and  en/404.astro
Astro.response.status = 404
```

**Why it works.** `page.js:51-52` reads `init.status` *after* the body renders, and
`createResult` exposes `status` as a plain mutable property (`render-context.js:433`). The
target page's assignment therefore wins over the rewrite's clamp.

**Why it must be the page files, not `NotFoundPage.astro`.** Astro streams by default. On the
Node path Vercel uses, `renderToAsyncIterable`
(`node_modules/astro/dist/runtime/server/render/astro/render.js:137-149`) awaits
`callComponentAsTemplateResultOrResponse` — the **page factory** — at line 138, then
`bufferHeadContent` at 148, and only then returns the iterator. Nested body components render
**lazily during stream consumption**, i.e. after `page.js:52` has already read `init.status`.
`NotFoundPage.astro` is a nested component, so an assignment there is racy and would depend on
head-propagation incidentally forcing its frontmatter. The same structure holds for
`renderToReadableStream` (`render.js:43-55`) on non-Node runtimes.

**Blast radius:** 2 lines, 2 files, 58 call sites fixed. Idempotent on direct hits to
`/pl/404/` and `/en/404/` (already 404 today, verified live). Root `404.astro` needs nothing —
its route is `/404`, so `page.js:64` forces 404 regardless — though adding it costs nothing and
documents intent.

**It also preserves a deliberate convention.** The `if (!data) return Astro.rewrite('/pl/404')`
pattern was *specified*, not improvised — see
`context/archive/english-language-implementation-plan.md:147,152` and
`context/archive/filtering-refractor-plan.md:278-334,492-532`.

#### Option B — return a bodyless 404 Response

```astro
if (!data) return new Response(null, { status: 404 })
```

Routes through `app/index.js:406` (`REROUTABLE_STATUS_CODES`, body **must** be `null`) → renders
root `404.astro` with `override.status = 404`. This is the idiomatic Astro 5 form and *cannot*
return 200. Costs: 58 edits, abandons the documented convention, and depends on
`getLangFromPath(Astro.url.pathname)` (`src/pages/404.astro:5`) still seeing the *original*
pathname during error render — **unverified, see Open Questions**. If it doesn't, every EN
soft-404 would render Polish content.

**Recommendation: Option A.** Smaller, convention-preserving, no unverified dependency.

### D. Meta robots, canonical, hreflang

All head output is centralised in `apps/astro/src/layouts/Head.astro` (98 lines). The 404 route
reaches it via `NotFoundPage.astro:52` → `<Layout {...metadata}>` → `Layout.astro:25` →
`<Head {...props} />`. Both layers are pure pass-through — no defaulting, no injection.

**robots — `Head.astro:68`, the single source site-wide:**

```astro
{doNotIndex ? <meta name="robots" content="noindex, follow" /> : <meta name="robots" content="index, follow" />}
```

`doNotIndex` is `undefined` when absent → falsy → **default is `index, follow`**.

**Where `doNotIndex` comes from:** *not* the NotFoundPage GROQ (which selects no `seo` fields),
but a second call at `NotFoundPage.astro:41` — `metadataFetch(page.slug)` →
`apps/astro/src/utils/metadata.fetch.ts:20`, `"doNotIndex": seo.doNotIndex`.

**Live Sanity check** (read-only GROQ, `fn3a7ltg`/`production`):

| `_id` | lang | slug | `defined(seo)` | `seo.doNotIndex` |
|---|---|---|---|---|
| `NotFound_Page` | pl | `/pl/404/` | true | **null** |
| `d5a9b399-…f024dc` | en | `/en/404/` | true | **null** |

`seo` exists (title/description filled) but `doNotIndex` was never written. The schema
(`apps/sanity/schema/ui/seo.tsx:41-47`) has `initialValue: false`, so it is a real, tickable
field — nobody ticked it.

**canonical — `Head.astro:50,52,79`:**

```astro
const url = _url || joinUrl(DOMAIN, path ?? '')
const finalCanonicalUrl = canonicalUrl || url
...
<link rel="canonical" href={finalCanonicalUrl} />
```

Unconditional — always emitted, self-referential unless overridden. There is **no canonical
field in the Sanity `seo` schema**, so this can never be CMS-driven. The only `canonicalUrl`
overrides in the codebase are the 12 `/filtr`+`/filter` routes, each paired with
`doNotIndex={true}` — intentional, and audited as correct in
`context/changes/seo-domkniecie-czerwca/change.md:40`.

The `/pl/404/` canonical on soft-404 responses is therefore *not* a bug in the canonical logic —
it is the correct self-canonical **of the rewrite target**. The URL is wrong only because the
rewrite made the wrong page render under the wrong status.

**`X-Robots-Tag` does not exist** anywhere — no middleware file, and `vercel.json:56-68` sets
only the four security headers from `4dadb7f`. Robots control is meta-tag-only.

**Fix options for the meta signals:**

- *CMS-only:* tick "Nie indeksuj strony" on both `NotFound_Page` docs. Zero code, but
  editor-revertable and invisible in git.
- *Code:* `<Layout {...metadata} doNotIndex>` at `NotFoundPage.astro:52`. One line, survives CMS
  edits. **Preferred** — this is infrastructure, not editorial.
- *Canonical removal* requires a new opt-out prop guarding `Head.astro:79`, because that line is
  unconditional and every page on the site flows through it. Gate behind an opt-in prop
  (`noCanonical?: boolean`) rather than changing the expression — the blast radius of editing
  `Head.astro:52/79` directly is all 15 `<Layout {...metadata}>` templates plus the 12 filter
  routes that depend on `canonicalUrl` overriding `url`.

Note: with a real 404 status, the canonical becomes moot for crawlers — Google doesn't process
canonical on a 404. Ticket point 3 is therefore **cosmetic once point 1 lands**, and carries the
highest regression risk of the three. Worth doing, but last, and behind an opt-in prop.

Related, and arguably worth folding in: the soft-404 currently also emits full `hreflang`
alternates (`pl`/`en`/`x-default` → the 404 pages, `Head.astro:80-81`) and the complete
`ProfessionalService` Organization JSON-LD. Every phantom URL ships structured data claiming to
be the business.

### E. Vercel ISR — the real deployment risk

**Adapter config, `apps/astro/astro.config.ts:27-41`:**

```ts
output: 'server',
adapter: vercel({
  ...(!isPreviewDeployment ? {
    isr: {
      bypassToken: process.env.ISR_BYPASS_TOKEN,
      exclude: [/^\/api\/.+/, /.*\/filtr.*/, /.*\/filter.*/],
    },
  } : {}),
}),
```

**`expiration` is not set** → adapter default `expiration: isr.expiration ?? false`
(`node_modules/@astrojs/vercel/dist/index.js:501`). In Build Output API v3, `false` means
**never expires** — the entry lives as long as the deployment.

**Does Vercel ISR cache non-200 responses? Yes — 404 and 410 are explicitly cacheable.**
Proven twice on this deployment:

- `/pl/404/` → `HTTP/2 404`, `x-vercel-cache: HIT`, `age: 626999` (~7.25 days, still serving)
- `/pl/dokumenty/nieistniejacy-plik.pdf` → `302` from inside the ISR function, `MISS` then
  `HIT` at `age: 3`

**Are locale slug pages ISR-cached? Yes.** `isr.exclude` covers only `/api/**` and the 13
filter routes; everything else gets `dest: /_isr?x_astro_path=$0`. Verified:
`/pl/blog/tego-slug-na-pewno-nie-ma-12345/` was `MISS` then `HIT` at `age: 10`.

**⚠️ The headline risk (R1).** After the fix, a 404 returned by `/pl/blog/[slug]` is written to
a cache with no TTL. Someone shares a draft URL → a crawler or colleague hits it → the 404 is
pinned → the article is published an hour later → **it serves 404 until a redeploy**, unless
`/api/revalidate` clears that exact URL string. Today this is masked because the cached
response is a benign 200.

Gaps in the revalidation path (`apps/astro/src/pages/api/revalidate.ts`) that matter here:

- `getDirectUrls()` only ever names the doc's **current** slug. A renamed slug revalidates the
  new URL; the old URL's cached response is never touched.
- Cache key is the `x_astro_path` capture with `allowQuery: ["x_astro_path"]`, so `/pl/blog/x`
  and `/pl/blog/x/` are **separate entries**. `withBothSlashVariants()`
  (`src/utils/revalidation-map.ts:25-32`) compensates — but only for URLs `getDirectUrls()`
  produces.
- A cached 404 created by a crawler hitting a not-yet-published URL is **never invalidated by
  anything except a redeploy**, because no Sanity mutation ever names that URL.
- `processRevalidation` runs in `waitUntil` after a 10 s sleep; failures only reach
  `console.error` (`revalidate.ts:67`) after the webhook already returned 200.

**Mitigation, highest leverage:** set a finite `isr.expiration` (e.g. `3600`) so any wrongly
cached 404 self-heals within a bounded window. This is currently the only thing standing between
a mistake and a permanent 404, and it is a one-line config change.

**⚠️ R2 — previews will not reproduce this.** ISR is disabled when
`VERCEL_ENV === 'preview'` (`src/utils/is-preview-deployment.ts:1`). Status-code behaviour will
look clean on every preview and only misbehave in production. Verification must run against
production and must assert `x-vercel-cache` alongside the status.

**⚠️ R3 — sitemap/404 collision becomes visible.** `sitemap-index.xml.ts` excludes
`NotFound_Page` (`:13-14`) but does **not** filter on `seo.doNotIndex` or publish state. Any
sitemap URL that starts hard-404-ing turns into a "Submitted URL not found (404)" error in GSC,
where today it is an invisible soft 404. Worth cross-checking the sitemap's 478 URLs against
live status before shipping.

**Redirects, for completeness:** `apps/astro/redirects.ts` runs at **build time only** (top-level
`await` in a file imported by `astro.config.ts:4`), so Sanity redirect edits need a rebuild —
consistent with `seo-domkniecie-czerwca/change.md:31`. `isPermanent` → **301, not 308**
(`redirects.ts:24`).

### Adjacent findings (not in the ticket)

**1. The December 2025 crawler blocklist is dead.** Two competing sources exist:
`apps/astro/public/robots.txt` (the 55-line blocklist from `9fbb8ef`) and
`apps/astro/src/pages/robots.txt.ts` (a `prerender = true` route emitting 4 permissive lines).
**The route wins and overwrites the static file.** Live `robots.txt` is 83 bytes:

```
User-Agent: *
Allow: /

Sitemap: https://www.fabryka-atrakcji.com/sitemap-index.xml
```

`9fbb8ef`'s stated goal was cutting serverless cost from abusive crawlers (SERanking, PetalBot)
and keeping Googlebot/Ahrefs/Semrush out of `/*/filtr/`. **None of that has been in effect since
at least the May 2026 build.** The June audit checked only that robots.txt points at the
sitemap (`change.md:43`) and never noticed. This directly compounds the crawl-budget half of the
ticket.

**2. `/pl/dokumenty/*` uses a worse pattern.** Four sites return `redirect('/404')` —
`pl/dokumenty/[filename].ts:28,33,48` and `oferta/[filename].ts:33` — i.e. a **302 to the error
page**, which Google also treats as a soft 404. Confirmed live: `302 → /404`. Different from,
and worse than, the rewrite pattern used everywhere else.

## Code References

**The bug:**
- `apps/astro/src/pages/pl/[slug].astro:9` — representative of all 58 rewrite call sites
- `node_modules/astro/dist/core/render-context.js:303` — `this.status = 200` in `#executeRewrite`
- `node_modules/astro/dist/runtime/server/render/page.js:61-72` — status read + `/404`-exact override
- `node_modules/astro/dist/core/app/index.js:566` — `#getDefaultStatusCode`, `route.endsWith("/404")`
- `node_modules/astro/dist/runtime/server/render/astro/render.js:137-149` — Node streaming order

**The fix targets:**
- `apps/astro/src/pages/pl/404.astro`, `apps/astro/src/pages/en/404.astro` — add `Astro.response.status = 404`
- `apps/astro/src/templates/NotFoundPage.astro:52` — `<Layout {...metadata}>`, add `doNotIndex`
- `apps/astro/src/layouts/Head.astro:68` — the robots ternary
- `apps/astro/src/layouts/Head.astro:79` — unconditional canonical
- `apps/astro/astro.config.ts:31-37` — `isr` block, missing `expiration`

**Supporting:**
- `apps/astro/src/utils/metadata.fetch.ts:20` — `doNotIndex` GROQ projection
- `apps/astro/src/pages/api/revalidate.ts:25-47,138` — revalidation path
- `apps/astro/src/utils/revalidation-map.ts:25-32` — slash-variant handling
- `apps/astro/src/pages/robots.txt.ts:6` — the route that shadows `public/robots.txt`
- `apps/astro/src/pages/sitemap-index.xml.ts:13-14` — `excludedTypes`
- `apps/astro/src/pages/pl/dokumenty/[filename].ts:28,33,48` — 302-to-error-page
- `apps/sanity/schema/singleTypes/NotFound_Page.ts:77-82` — `seo` field on the 404 doc

## Architecture Insights

- **Two independent status mechanisms with different matching rules** is the structural trap:
  `endsWith("/404")` for entry routes vs `=== "/404"` for the render-time override. A localized
  404 route satisfies one and not the other. Any framework upgrade should re-verify both.
- **`Astro.rewrite()` is a routing primitive, not an error primitive.** It preserves the URL and
  resets the status by design — correct for A/B tests and locale fallbacks, wrong for
  not-found. The codebase adopted it as the not-found convention and it silently carried the
  wrong semantics across 58 sites.
- **Nothing in the stack tests status codes.** The June audit checked meta tags, canonicals,
  hreflang and headers — all *body* signals. The one signal Screaming Frog trusts most (the
  status line) was never asserted, which is exactly why point 3 of the ticket ("diagnostic
  blindness") bit hardest.
- **ISR with `expiration: false` turns any transient wrong answer into a permanent one.** The
  system is currently safe only because its wrong answer happens to be 200.
- **Prerendered routes shadow `public/`** — the robots.txt collision is a general hazard worth
  a lint rule, not a one-off.

## Historical Context (from prior changes)

- `context/archive/english-language-implementation-plan.md:147,152,184-189` — **the primary
  404/locale spec.** The `Astro.rewrite('/en/404')` pattern was specified here, as was the
  three-entry-point design (root `404.astro` sniffing language via `getLangFromPath`, plus
  `pl/404.astro` and `en/404.astro` as concrete rewrite targets). Acceptance criterion at
  `:262` reads *"Missing EN route shows EN 404"* — **"shows", never "returns 404"**. Status
  codes were never in scope. This is a genuine gap, not a regression.
- `context/archive/filtering-refractor-plan.md:278-334,492-532` — reinforced the same rewrite
  convention across filter routes.
- `context/changes/seo-domkniecie-czerwca/change.md:40` — canonical audited, **no action**:
  `canonicalUrl || url` is correct; only filter routes override, intentionally. Confirms the
  canonical logic itself is sound.
- `context/changes/seo-domkniecie-czerwca/change.md:41` — `noindex, nofollow` → `noindex, follow`
  was deliberate (equity flow). Any change to `Head.astro:68` must preserve `follow`.
- `context/archive/activities-show-more/research.md:174-186` — **old paginated URLs 301 → base
  listing, never 404.** A settled decision; the 404 fix must not regress those routes into 404s.
- `9fbb8ef` (2025-12-15) — crawl-budget robots.txt blocklist. Now inert (see Adjacent findings).
- `d1fa2a1`, `e30da48`, `c08351b` (June 2025) — `vercel.json` rewrites and the ISR `exclude`
  regexes are **scar tissue from a real production 404 outage**, tuned empirically. Load-bearing;
  don't "clean them up" opportunistically.
- `context/archive/landing-page-implementation-plan.md:639-651` — proposes a catch-all
  `[...slug].astro`. **Stale** — never built that way; the shipped design uses `fetch-page.ts`
  inside `[slug].astro`. The ticket's guess that a catch-all is responsible is understandable
  but incorrect.

## Related Research

- `context/changes/seo-domkniecie-czerwca/change.md` — June SEO punch-list; owns the 301 map
  (ticket point 4), currently blocked on Wiktoria's target decisions.
- `context/archive/english-language-implementation-plan.md` — locale routing design.

## Open Questions

1. **Does Option B preserve locale?** If we ever take the `new Response(null, {status: 404})`
   route, does `getLangFromPath(Astro.url.pathname)` in `src/pages/404.astro:5` see the original
   pathname during `#renderError`, or `/404`? If the latter, all EN 404s render Polish. Not
   needed for Option A.
2. **Does `exposeErrBody` strip the body on cached 404s?** The adapter never sets it
   (`@astrojs/vercel/dist/index.js:500-505`) and Vercel doesn't document which statuses count as
   "error". 404 is on the cacheable allowlist so the branded body *should* survive, but this
   deserves a canary check rather than an assumption — a 404 with a stripped body silently loses
   the 404 page.
3. **What `isr.expiration` value?** `3600` bounds the self-heal window at 1h. Trade-off against
   Sanity read cost is a judgement call — worth a number from actual traffic.
4. **Should `/pl/404/` and `/en/404/` stay directly reachable 200-canonical URLs at all?** They
   are out of the sitemap but crawlable. Once they return 404 consistently this is mostly moot.
5. **Sitemap × live status cross-check** — do any of the 478 sitemap URLs currently 404? Today
   that is invisible; after the fix it becomes a GSC error. Should run *before* shipping.
6. **Do the 8 paginated-route 301s still work?** They must not regress into 404s
   (`activities-show-more` decision). Needs a spot-check in the verification pass.
