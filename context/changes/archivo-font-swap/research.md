---
date: 2026-07-27T12:32:36+02:00
researcher: Claude (for Oliwier Sellig)
git_commit: 1bb66b40d6498e41314e1754d357cbcb85058e1f
branch: main
repository: fabryka-atrakcji
topic: "Full font inventory & swap surface for replacing PF Grand Gothik + Neue Haas Unica with Archivo"
tags: [research, codebase, fonts, typography, global-scss, head-astro, git-history, licensing]
status: complete
last_updated: 2026-07-27
last_updated_by: Claude (for Oliwier Sellig)
last_updated_note: "All 6 open questions resolved by Oliwier — see Decisions section"
---

# Research: Font inventory & swap surface for the Archivo replacement

**Date**: 2026-07-27T12:32:36+02:00
**Researcher**: Claude (for Oliwier Sellig)
**Git Commit**: `1bb66b4` (pushed to origin/main)
**Branch**: main
**Repository**: kryptonum-dev/fabryka-atrakcji (GitHub, **public**)

## Research Question

Map everything needed to plan the swap of unlicensed fonts **PF Grand Gothik** (headings) and **Neue Haas Unica** (body) to **Archivo** (OFL): all font files (current + git history), @font-face declarations, loading strategy, the full typography usage surface across breakpoints, non-obvious consumers, and constraints for the git-history purge + CDN cache flush. (Brief: `change.md` in this folder — Font Radar/Parachute enforcement, Monotype exposure.)

## Summary

- **Exactly two paid families, no third font live.** 8 binaries in `apps/astro/public/fonts/` (PF Grand Gothik woff2+woff; Neue Haas Unica regular/medium/bold woff2+woff). All `@font-face` live in one file: `global.scss:1–59`.
- **⚠️ The git history is worse than the live site.** A **1.9 MB desktop variable PF Grand Gothik** (`gothic.ttf`) with an **Adobe Fonts EULA URL embedded in the binary** was committed and later deleted — it is downloadable today from the public repo at the old commit. There's also an extensionless woff2 (`previosu`) that any glob-based purge (`*.woff2`) would silently miss. Purge must be **by directory path**, and GitHub retains `refs/pull/*` (53 PRs) — a GitHub Support gc request is a mandatory step.
- **The swap surface is centralized-ish but token-less.** No `--font-*`/`$font-*` tokens exist; 48 hardcoded `font-family` strings across 31 files, plus `font-weight: 760` ×18 (a PF-only value) and `font-stretch: 150%/250%` that **exceed Archivo's width axis (max 125%)**. Two Arial metric-override fallback faces are tuned to the old fonts and must be recomputed or dropped.
- **The current loading setup is deliberate** (a documented tuning session from 2025-04-19: preloads + `font-display: optional` + metric-matched fallbacks, fully self-hosted, no Google Fonts link anywhere). Self-hosting Archivo preserves this architecture and avoids new CSP origins that the in-flight SEO change explicitly deferred.
- **Design-judgment work is the long tail:** 166 letter-spacing values (all negative, tuned to current metrics), `line-height: 0.9` on display headings, 13 `uppercase` display styles + 11 `text-transform: none` escape hatches. Fluid `clamp()` size tokens (`global.scss:89–98`) can stay as-is.

## Detailed Findings

### 1. Live font binaries (`apps/astro/public/fonts/`, all git-tracked)

| File | Size | Role |
|---|---|---|
| `pf-grand-gothic.woff2` / `.woff` | 56.4 KB / 68.3 KB | PF Grand Gothik, single cut declared `wght 760` + `stretch 150%` |
| `neue-haas-unica-regular.woff2` / `.woff` | 8.9 KB / 19.1 KB | Unica 400 |
| `neue-haas-unica-medium.woff2` / `.woff` | 8.9 KB / 19.3 KB | Unica 500 |
| `neue-haas-unica-bold.woff2` / `.woff` | 8.9 KB / 19.5 KB | Unica 700 |

The Unica woff2s (~9 KB) are aggressively subset; verify PL-diacritics coverage assumptions when sizing Archivo files. Stale copies in `apps/astro/dist/` and `apps/astro/.vercel/` are gitignored build output (delete on disk; confirm before telling Font Radar "removed"). Filename spelling is **"gothic"** while the CSS family is **"Gothik"** — find/replace must cover both.

### 2. @font-face — all in [`global.scss:1–59`](https://github.com/kryptonum-dev/fabryka-atrakcji/blob/1bb66b40d6498e41314e1754d357cbcb85058e1f/apps/astro/src/global/global.scss#L1-L59)

- L1–9 Unica 400 `font-display: optional` · L11–19 Unica 700 `optional` · L21–29 Unica 500 **`swap`** (inconsistent — it's the one face that isn't preloaded)
- L31–38 `'Neue Haas Unica Fallback'` = `local('Arial')` + `ascent-override: 108.97%; descent-override: 27.42%; size-adjust: 100.3%`
- L40–49 `'PF Grand Gothik'` — `font-weight: 760`, `font-display: optional`, **`font-stretch: 150%`**
- L51–59 `'PF Grand Gothik Fallback'` = `local('Arial')` + `ascent-override: 91.43%; descent-override: 25.8%; size-adjust: 130.14%; font-stretch: 250%`

**Trap for a naive find/replace:** the two synthetic fallback faces silently preserve old visual metrics if only the primary name is swapped. All six override percentages must be recomputed against Archivo (or the fallback faces dropped/regenerated, e.g. via Capsize/fontaine-style tooling). `font-stretch: 150%/250%` cannot be copied — Archivo's `wdth` axis is 62–125%.

### 3. Loading strategy — [`Head.astro:78–80`](https://github.com/kryptonum-dev/fabryka-atrakcji/blob/1bb66b40d6498e41314e1754d357cbcb85058e1f/apps/astro/src/layouts/Head.astro#L78-L80)

- Three `<link rel="preload" as="font">`: `pf-grand-gothic.woff2`, `neue-haas-unica-regular.woff2`, `neue-haas-unica-bold.woff2` (medium not preloaded → hence its `swap`). With one variable Archivo file this collapses to a single preload.
- Head is composed once in `Head.astro`, used by both layouts (`Layout.astro:25`, `LandingLayout.astro:23`); `global.scss` imported at `Layout.astro:2` / `LandingLayout.astro:2` — @font-face ships in the bundled stylesheet, not inline.
- **No Google Fonts / typekit / preconnect to any font CDN anywhere in the repo.** 100% self-hosted today.
- **CSP/caching:** `vercel.json` has security headers but **no `Cache-Control` for `/fonts/*`** and no `font-src` in the CSP. The in-flight `seo-domkniecie-czerwca` change (`change.md:50`) deliberately deferred a full CSP that would need to enumerate font origins → **self-hosting Archivo keeps that a non-issue**.
- **ISR (`expiration: 3600`)**: cached HTML keeps old preload tags up to 1 h post-deploy. Preload-404s are console noise, not broken text — but using **new filenames** (`archivo-*.woff2`) instead of overwriting old paths sidesteps CDN purging of the binaries entirely.

### 4. Typography system — hybrid: fluid size tokens, everything else hardcoded

- **No SCSS mixins/partials/variables at all** (zero `@use`/`@import`/`@mixin` in `.scss`; no `additionalData` injection). Every component carries self-contained scoped styles.
- **Size tokens** (the one centralized layer): `global.scss:89–98` — `--typography-body-{s,m,l,xl,2xl}`, `--typography-heading-{s,m,l,2xl}`, formula `clamp(min, calc(Xvw/0.48), max)`; referenced by ~84 files; token adoption for `font-size` is high (241 of 275 occurrences). **These can survive the swap unchanged** (sizes, not metrics).
- **Body** (`global.scss:201–219`): `--typography-body-l`, `line-height: 1.55`, `letter-spacing: -0.02em`, Unica stack at L208, `font-variant-numeric: lining-nums proportional-nums`.
- **Display headings** (`global.scss:246–261`, applies **only to h1/.h1/h2/.h2**): Gothik stack (L250), `line-height: 0.9` (L252), `letter-spacing: -0.065em` (L253), `text-transform: uppercase` (L255), `font-weight: 760` (L256). h3–h6 have no global typography — components style them ad hoc (de-facto h3 = `body-2xl` + 700 + body font).
- **font-family: 48 occurrences / 31 files, all hardcoded strings, zero tokens.** Gothik stack ×18 (hotspot: `CardSteps.astro` ×6); Unica stack ×25 (mostly re-asserting body font on h2-level elements to escape the global uppercase display style). Full lists in Code References below.
- **font-weight inventory:** 700 ×86 (dominant bold), **760 ×18** (PF-only — every one needs a deliberate new value, presumably 900), 400 ×9, 500 ×6, 600 ×2. → Archivo must provide **400/500/600/700 normal + 900 Expanded (`wdth` 125%)**; one variable file with `wght`+`wdth` covers all.
- **Metric-tuned values (the design-judgment pass):**
  - `letter-spacing`: 166 occurrences / 72 files, all hardcoded, all tuned to current fonts. Distribution: −0.01 ×71, −0.03 ×30, −0.02 ×21, −0.04 ×17, **−0.065 ×11** (display clones), −0.035 ×7, −0.055 ×6, −0.08 ×1 (404 numeral).
  - `line-height: 0.9` on display headings (global + ~9 component copies) — tuned to Gothik's compact caps; verify against Archivo Expanded 900.
  - `text-transform`: 13 `uppercase` display styles + 11 `none` escape hatches (these pair with the Unica re-declarations).
- **Breakpoints:** no system — hardcoded `rem` media queries per component (~40+ distinct values; most frequent 56.1875 rem ×25). Media queries rarely change font-size (fluid clamp does that), so "all breakpoints" from the brief mostly means **visual QA per breakpoint**, not per-breakpoint code edits.
- **Portable text**: renderer (`components/ui/portable-text/`) carries no styles; long-form typography lives in template `:global()` blocks (`SingleBlogPost.astro:202–212`, `SingleHotelPage.astro:~316`, `SingleActivityPage.astro:~379`, `SingleEventSpacePage.astro:~330`, `legal/index.astro:~88`) and `div.paragraph` rules (`global.scss:369–417`).

### 5. Non-obvious consumers — almost all clean

- **Emails** (`emails/contact-emails.ts:117,128`): own `'Helvetica Neue', Helvetica, Arial` stack — **no action needed**.
- **OG images**: no satori/@vercel/og/resvg/canvas — OG images are Sanity-hosted URLs (`Head.astro:49–53`). `sharp` only rasterizes `favicon.svg` (no text). **Nothing.**
- **Sanity Studio**: no custom fonts (bundled Inter; only inline `fontSize/fontWeight` numbers). **Nothing.**
- **PDF/doc generation, inline `fontFamily` in TSX, JS font loading (`document.fonts`, `FontFace`)**: **zero hits.**
- **Third-party embeds** (Meta Pixel, GTM, Google Maps iframe): none load the paid fonts. The **cookie banner is styled by our CSS** (`CookieConsent.scss:89`) — it's in the swap list.
- **Licensing traces**: no license file ever existed in/next to `public/fonts/` in any commit — consistent with "no license was ever purchased". The only asserted license is *inside* the historical `gothic.ttf` binary: an Adobe Fonts EULA URL (`https://fonts.adobe.com/eulas/...`), i.e. a desktop/sync font that was publicly redistributed.

### 6. Git history & purge constraints ⚠️

- Remote: `https://github.com/kryptonum-dev/fabryka-atrakcji.git` — **public**, 0 forks, **53 PRs**, no tags, **no git-lfs**, `.git` = 22 MB / 533 commits.
- Full historical blob scan (by magic bytes, not extension) — everything ever under `apps/astro/public/fonts/`:
  - the 8 live files + 4 older revisions (incl. a 307 KB pre-subset `pf-grand-gothic.woff`)
  - **`gothic.ttf`** — 1.9 MB desktop **variable** PF Grand Gothik, Adobe EULA in name table; added `5e19afa`, deleted `8dbcf22` — **the most incriminating artifact; downloadable today at the old commit**
  - **`previosu`** — extensionless WOFF2 (blob `5e833b4…`); added `13f5460`, deleted `0272b42` — **glob filters miss it**
  - `Poppins-Regular.{eot,ttf,woff,woff2}` (deleted), plus a stray `stopka-mailowa-lukasz-fabryka-atrakcji.jpg` once inside the fonts dir (a directory-wide purge also removes this — fine, it's long deleted)
- Fonts are in the **initial commit** (`7238435`) → effectively the whole history gets rewritten. Right shape: `git filter-repo --invert-paths --path apps/astro/public/fonts` over all refs.
- **GitHub retains `refs/pull/*/head`** — unreachable to force-push. After the rewrite, blobs stay downloadable via PR refs until **GitHub Support runs a gc** → the support ticket is a required plan step, not optional.
- 5 stale remote branches (`dev`, `event-spaces`, `fabryka-en`, `feature/conversion-redesign`, `trailing-slash`) are all strict ancestors of `main` — delete or force-push them as part of the rewrite.
- **Sequencing risk:** working tree is dirty (in-flight `soft-404-locale-routes` edits + 3 modified files); `seo-domkniecie-czerwca` also open. A history rewrite invalidates every collaborator clone — coordinate and land/stash in-flight work first.
- Cosmetic: `.claude/settings.local.json:22` holds a stored permission string referencing `pf-grand-gothic.woff2`.

### 7. Historical context — current setup is deliberate

One iterative font-loading tuning session (2025-04-19): `13f5460` (re-subset, preloads added; left the `previosu` artifact) → `617fc71` (@font-face back into `global.scss`) → `66071b4` (preloads removed) → `faebd79` (preloads re-added as regular+bold; `swap`→`optional` on preloaded faces) → `facad2c` (`font-stretch: 250%` on Gothik fallback). The Archivo setup should reproduce the same performance posture: preload + `optional` + metric-matched fallback, self-hosted.

## Code References

**Structural (6 locations):**
- `apps/astro/src/global/global.scss:1-59` — all six @font-face blocks
- `apps/astro/src/global/global.scss:89-98` — fluid size tokens (unchanged by swap)
- `apps/astro/src/global/global.scss:201-219` — body typography (stack at :208)
- `apps/astro/src/global/global.scss:246-261` — h1/h2 display style (stack :250, weight :256)
- `apps/astro/src/layouts/Head.astro:78-80` — font preloads (file also under active SEO edits)
- `apps/astro/public/fonts/` — 8 binaries to delete

**Gothik stack (17 component occurrences, prefix `apps/astro/src/`):** `components/global/CardSteps.astro:409,444,467,572,793,1018` · `components/hotels/Listing.astro:751` · `components/event-spaces/Listing.astro:582` · `components/activites/category/Listing.astro:968` · `components/activites/NoSearchResults.astro:128` · `components/ui/content-pt/hotel/Location.astro:404` · `components/ui/TestimonialsPopup/index.astro:79` · `components/global/NotFoundHero.astro:542` · `components/global/BlockColumn.astro:151` · `components/global/Newsletter/index.astro:259` · `components/global/ContactForm/index.astro:572`

**Unica stack (24 component occurrences):** `templates/hotels/SingleHotelPage.astro:316` · `templates/activities/SingleActivityPage.astro:379` · `templates/blog/SingleBlogPost.astro:211` · `templates/event-spaces/SingleEventSpacePage.astro:330` · `components/ui/content-pt/offer/Faq.astro:158` · `components/ui/ActivityCard/styles.module.scss:72` · `components/blog/Hero.astro:192` · `components/blog/post/content-pt/Cta.astro:346` · `components/activites/NoSearchResults.astro:88` · `components/ui/FaqForm/index.astro:165` · `components/legal/index.astro:88` · `components/global/LargeImageWithGridList.astro:341` · `components/global/ListImageProccessGrid.astro:486` · `components/global/Faq.astro:233` · `components/global/Newsletter/index.astro:318` · `components/caseStudy/ChallengeSolution.astro:98` · `components/global/ActivitiesCarousel/Carousel/carousel.module.scss:129` · `components/global/CardListWithCta.astro:110` · `components/global/StepsList.astro:444` · `components/global/ContactForm/index.astro:493` · `components/cookie-consent/CookieConsent.scss:89`

**`font-weight: 760` standalone (needs new value):** `global.scss:45,256` · `TestimonialsPopup/index.astro:74` · `content-pt/hotel/Location.astro:410` · `hotels/Listing.astro:757` · `activites/category/Listing.astro:974` · `activites/NoSearchResults.astro:134` · `event-spaces/Listing.astro:588` · `global/BlockColumn.astro:153` · `global/CardSteps.astro:414,445,468,571,792,1014` · `global/NotFoundHero.astro:544` · `global/Newsletter/index.astro:261`

**Display letter-spacing (retune candidates):** `-0.065em`: `global.scss:253`, `TestimonialsPopup/index.astro:77`, `hotel/Location.astro:407`, `hotels/Listing.astro:754`, `category/Listing.astro:971`, `event-spaces/Listing.astro:585`, `LargeImageWithGridList.astro:317,414`, `CardSteps.astro:348`, `NoSearchResults.astro:131`, `Newsletter/index.astro:250` · `-0.055em`: `CardSteps.astro:412,442,464,1016`, `Newsletter/index.astro:257`, `ContactForm/index.astro:575` · `-0.08em`: `NotFoundHero.astro:546`

**`text-transform: uppercase` (display):** `global.scss:255`, `TestimonialsPopup/index.astro:78`, `hotel/Location.astro:409`, `hotels/Listing.astro:756`, `event-spaces/Listing.astro:587`, `CardSteps.astro:410,446,469,1019`, `NoSearchResults.astro:133`, `NotFoundHero.astro:547`, `BlockColumn.astro:156`, `ContactForm/index.astro:576`, `category/Listing.astro:973`

**`text-transform: none` (escape hatches, pair with Unica re-declarations):** `ActivityCard/styles.module.scss:64,76`, `ChallengeSolution.astro:100`, `NoSearchResults.astro:90`, `legal/index.astro:92`, `blog/Hero.astro:196`, `blog/post/content-pt/Cta.astro:353`, `CookieConsent.scss:90`, `TextBlocksGrid.astro:113`

**Unaffected:** `emails/contact-emails.ts:117,128` (web-safe stack) · `TextBlocksGrid.astro:112` (`font-family: inherit`)

## Architecture Insights

1. **Token gap is the multiplier.** Because there are no `--font-heading`/`--font-body` custom properties, 48 family strings + 18 weight values are scattered. Introducing two font tokens (plus optionally `--font-weight-display`) in `:root` during the swap collapses ~55 future touchpoints into one place — strongly worth including in the plan.
2. **The performance posture is intentional** (preload + `optional` + Arial metric-match). The plan should reproduce it for Archivo: recomputed `size-adjust`/`ascent-override` values, one preloaded variable woff2 (subset to latin + latin-ext for PL), new filenames to dodge CDN cache.
3. **Weight/width mapping is not mechanical:** `760/150%` → `900/125%` maxes out Archivo's axes and will still render narrower than Grand Gothik at 150%; uppercase display + `line-height: 0.9` + `-0.065em` need a design eye (Sasha) on a staging build across the ~9 hotspot components.
4. **The Unica escape-hatch pattern** (24 re-declarations of body font + `text-transform: none` to undo the global h2 display style) survives the swap as-is if tokens are introduced — but it's also evidence the global h1/h2 selector is too broad; not this change's problem to fix.
5. **Two independent workstreams:** (a) code swap + deploy (removes fonts from production — unblocks the Font Radar reply), (b) git-history rewrite + GitHub Support gc + branch cleanup (removes public redistribution). They should be sequenced (a) → (b), and (b) must wait for in-flight changes to land.

## Historical Context (from prior changes)

- `context/changes/archivo-font-swap/change.md` — the brief (Slack thread digest, scope points 1–2 in-repo)
- `context/changes/seo-domkniecie-czerwca/change.md:50` — deferred CSP explicitly lists fonts as an origin class to enumerate → self-host Archivo to keep CSP work unchanged; `Head.astro` is under active edits in that change (merge adjacency)
- `context/changes/soft-404-locale-routes/` — in-flight (`implementing`, dirty working tree) — no typography overlap, but blocks the history rewrite until landed
- Git: `13f5460`→`617fc71`→`66071b4`→`faebd79`→`facad2c` (2025-04-19 font-loading tuning session); `329503d` (heading contrast a11y fix)
- `context/archive/` — no prior change ever touched fonts/typography

## Related Research

None — this is the first research artifact touching typography.

## Open Questions

1. **Archivo build & subsetting**: one variable woff2 (`wght` 100–900 + `wdth`) vs two static instances (Expanded 900 + normal 400/500/600/700)? Variable file is ~1 request but larger; static instances are smaller each but 5 files. Needs a size check with latin+latin-ext (PL) subsets.
2. **Metric-override fallback values** for Archivo (size-adjust/ascent/descent vs Arial) — compute with fontaine/Capsize tooling during implementation.
3. **Design sign-off loop**: which letter-spacing/line-height values get retuned vs kept — needs Sasha on a preview deployment; the 9 display-heading hotspots are the review set.
4. **`font-weight: 500/600` mapping**: Unica 500 renders from a dedicated cut today; with variable Archivo these become real interpolated weights — visual check on `LanguageSwitcher`, `InquiryForm`, `InquiryWidget`.
5. **History rewrite timing**: land `soft-404-locale-routes` + `seo-domkniecie-czerwca` first? Who force-pushes, who re-clones, when does the GitHub Support ticket go out (before or after the Font Radar reply)?
6. **Font Radar reply date dependency**: the reply says "font removed as of [date]" — that date is the production deploy of workstream (a), not the history rewrite; confirm the sequencing in the reply text.

## Decisions (2026-07-27, Oliwier) — all open questions resolved

1. **Static instances, mirroring the current layout** — no variable font. Archivo cuts matching today's setup: body 400 / 500 / 700 + one display cut (Archivo Expanded 900, replacing the Gothik 760/150% cut). woff2 (+ woff fallback matching current pattern), **optimized/subset via CLI tools** (e.g. `pyftsubset`/`fonttools` — latin + PL diacritics), same as the aggressive subsetting the Unica files have today.
2. **Fallback metric overrides: compute** — recompute the Arial `size-adjust`/`ascent-override`/`descent-override` values for the two synthetic fallback faces against Archivo (fontaine/Capsize-style tooling).
3. **Letter-spacing / line-height: keep all current values as-is.** No retune pass in this change — Oliwier reviews visually himself afterwards.
4. **Weights: exactly what's used now, nothing more.** No new weights introduced. Note: `font-weight: 600` (×2, InquiryForm/InquiryWidget) has no dedicated cut today and snaps to 700 — same behavior after the swap, leave as-is.
5. **No git history rewrite for now.** Scope = working-tree deletion + code swap + deploy only. The historical blobs (incl. `gothic.ttf` with the Adobe EULA) stay reachable in the public repo — accepted for now; can be revisited as a separate change later.
6. **Font Radar reply: minimal** — "font has been removed", nothing more. Out of repo scope; date = production deploy of the swap.

**Net scope for the plan:** swap fonts in code (global.scss @font-face + fallbacks, Head.astro preloads, 48 family strings, 18× `font-weight: 760`→900 + `font-stretch` remap), add optimized Archivo static files under new filenames, delete the 8 old binaries from the working tree, deploy. No history rewrite, no design retune, no email/OG/Sanity work.
