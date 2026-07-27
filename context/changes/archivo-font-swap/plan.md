# Archivo Font Swap Implementation Plan

## Overview

Replace the two unlicensed font families — **PF Grand Gothik** (display headings) and **Neue Haas Unica** (body) — with self-hosted, CLI-optimized **static Archivo instances** (OFL), mirroring the current cut layout and performance posture. Introduce `--font-body` / `--font-heading` tokens so the next font change is a 2-line edit. Delete the old binaries from the working tree. No git-history rewrite, no design retune (Oliwier reviews visually himself).

Driver: Font Radar/Parachute enforcement on PF Grand Gothik + Monotype exposure on Neue Haas Unica (see `change.md`). The production deploy date of this change is the "font removed as of" date for the Font Radar reply.

## Current State Analysis

Fully mapped in `research.md`. The essentials:

- 8 binaries in `apps/astro/public/fonts/` (Gothik woff2+woff; Unica regular/medium/bold woff2+woff)
- All six `@font-face` blocks in `apps/astro/src/global/global.scss:1–59`, including two `local('Arial')` metric-override fallback faces tuned to the old fonts
- Gothik is a single cut declared `font-weight: 760` + `font-stretch: 150%` — Archivo's width axis maxes at 125%, so the width must be baked into a static Expanded instance instead
- 3 preloads in `apps/astro/src/layouts/Head.astro:78–80`; `font-display: optional` on preloaded faces, `swap` on the unpreloaded medium — a deliberate 2025-04 tuning, to be mirrored
- 48 hardcoded `font-family` strings across 31 files (no tokens exist); 18× `font-weight: 760`; weight 600 used twice with no cut (snaps to 700 — intentionally kept)
- Emails, OG images, Sanity Studio, PDFs: no font consumers — out of scope confirmed
- Working tree is dirty with unrelated in-flight changes (`soft-404-locale-routes`, modified `ComparisonTable.*`, `get-estimated-reading-time.ts`) — commits must touch only font-related files

## Desired End State

- Production serves only Archivo: `'Archivo'` (400/500/700) for body, `'Archivo Expanded'` (900, wdth 125) for h1/h2 display headings
- 4 new woff2 files (latin + PL subset) under **new filenames** in `public/fonts/`; the 8 old binaries deleted from the working tree
- `:root` defines `--font-body` and `--font-heading`; zero hardcoded family strings remain outside the two token definitions
- Fallback faces (`'Archivo Fallback'`, `'Archivo Expanded Fallback'`) carry freshly computed Arial metric overrides
- Repo-wide grep for `gothik|gothic|unica|haas` (case-insensitive, excluding `context/` and `.claude/`) returns zero hits
- Build + lint pass; site visually reviewed by Oliwier across breakpoints

### Key Discoveries (from research.md):

- `global.scss:1–59` — all @font-face; `:89–98` fluid size tokens (untouched); `:208` body stack; `:246–261` display rule (`760` at `:256`)
- `Head.astro:78–80` — preloads (file also under active SEO edits — merge adjacency)
- Filename spelling is `gothic`, CSS family is `Gothik` — greps must cover both
- ISR (1 h) caches HTML with old preload tags → new filenames sidestep CDN purging; expect ≤1 h of harmless preload-404 console noise after deploy
- `.claude/settings.local.json:22` holds a stale permission string referencing `pf-grand-gothic.woff2`

## What We're NOT Doing

- **No git-history rewrite** (decided: deferred; historical blobs incl. `gothic.ttf` stay reachable — revisit as a separate change)
- **No letter-spacing / line-height / uppercase retune** — all 166 letter-spacing values, `line-height: 0.9`, and text-transforms stay byte-identical; Oliwier reviews visually
- **No new weights** — 400/500/700 + display 900 only; the 2× `font-weight: 600` declarations stay (snap to 700, same as today)
- **No variable font, no Google Fonts `<link>`** — static self-hosted instances only (keeps deferred CSP work untouched)
- **No changes** to emails, OG images, Sanity Studio, size tokens (`--typography-*`), or the global h1/h2 selector breadth
- **No Font Radar reply drafting** — out of repo scope (reply = "font removed", dated to this deploy)

## Implementation Approach

Three phases: (1) produce the optimized font assets with fonttools CLI, (2) swap the global layer (`@font-face`, tokens, body/heading rules, preloads), (3) sweep components mechanically, delete old files, verify with grep-zero + build, hand to visual review. Phases 2–3 could land as one deploy; phase boundaries exist for review checkpoints, not deploy gates.

## Critical Implementation Details

- **`font-stretch` descriptors do not carry over.** The old blocks declare `150%`/`250%`; Archivo Expanded has its width baked into the static instance, and no element rule sets `font-stretch`. Omit the descriptor entirely from all new `@font-face` blocks and rules.
- **The fallback faces are the find/replace trap.** Renaming `'PF Grand Gothik Fallback'` → `'Archivo Expanded Fallback'` without recomputing `size-adjust`/`ascent-override`/`descent-override` silently preserves old layout metrics. The four override values per face must be derived from the actual Archivo instance metrics (read `hhea`/`OS/2`/`hmtx` via fonttools; `size-adjust` = Archivo avg. char advance ÷ Arial avg. char advance; `ascent-override` = ascent ÷ (upm × size-adjust), analogous for descent; `line-gap-override: 0%`).
- **Commit isolation:** the working tree carries unrelated in-flight edits. Stage only font-related paths; never `git add -A`.
- **Weight-600 exception:** `InquiryForm.module.scss:209` and `InquiryWidget.module.scss:246` keep `font-weight: 600` untouched — it resolves to the 700 cut, same as today. Do not "fix" them to 700.

## Phase 1: Generate Optimized Archivo Assets

### Overview

Produce four subset static woff2 instances from the official Archivo variable font using CLI tooling, under new filenames.

### Changes Required:

#### 1. Tooling (scratchpad, not committed)

**Intent**: Install `fonttools` + `brotli` (e.g. `pip install fonttools brotli` or a `uvx`/venv equivalent) and download the Archivo variable TTF (`Archivo[wdth,wght].ttf`) from Google Fonts / the google/fonts GitHub repo into the scratchpad. Nothing from this step lands in the repo except the final woff2 files.

**Contract**: Work happens in the session scratchpad dir; the repo only receives `apps/astro/public/fonts/archivo-*.woff2`.

#### 2. Instantiate four static cuts

**File**: (scratchpad intermediate files)

**Intent**: Pin the variable axes into the four cuts mirroring today's layout.

**Contract**: `fonttools varLib.instancer` with:
- `archivo-regular` → `wght=400 wdth=100`
- `archivo-medium` → `wght=500 wdth=100`
- `archivo-bold` → `wght=700 wdth=100`
- `archivo-expanded-black` → `wght=900 wdth=125`

#### 3. Subset + compress to woff2

**File**: `apps/astro/public/fonts/archivo-{regular,medium,bold,expanded-black}.woff2` (new)

**Intent**: Subset each instance to latin + Polish diacritics + typographic punctuation and emit woff2 in one `pyftsubset --flavor=woff2` pass — mirroring the aggressive subsetting the Unica files have today. woff2-only (decided: no woff1 tier).

**Contract**: Coverage must include at minimum: basic latin (U+0020–007E), PL diacritics `ĄĆĘŁŃÓŚŹŻąćęłńóśźż`, Latin-1 punctuation/symbols in actual use, and typographic chars `– — ‘ ’ ‚ “ ” „ … € ° ×`. Keep default layout features (`kern`, `liga`). Verify coverage post-subset (e.g. `ttx -t cmap` grep, or a fonttools one-liner) rather than trusting the flag list.

### Success Criteria:

#### Automated Verification:

- Four files exist: `apps/astro/public/fonts/archivo-{regular,medium,bold,expanded-black}.woff2`
- Each file ≤ 40 KB (sanity budget; Unica cuts are ~9 KB, Gothik 56 KB — Archivo subsets should land well under)
- Glyph-coverage check confirms all PL diacritics present in all four files

#### Manual Verification:

- (none — coverage and size are automated; rendering is reviewed in Phase 3)

---

## Phase 2: Global Layer Swap

### Overview

Rewrite the font foundation in `global.scss` and `Head.astro`: new `@font-face` set, recomputed fallback metrics, font tokens, updated body/heading rules and preloads.

### Changes Required:

#### 1. @font-face blocks

**File**: `apps/astro/src/global/global.scss` (lines 1–59)

**Intent**: Replace the six existing blocks with six new ones mirroring the current display-strategy pattern: `'Archivo'` 400 (`optional`), 700 (`optional`), 500 (`swap` — unpreloaded, as today), `'Archivo Fallback'` (Arial metric-match), `'Archivo Expanded'` 900 (`optional`), `'Archivo Expanded Fallback'` (Arial metric-match). No `font-stretch` descriptors anywhere; woff2-only `src` lists pointing at the new filenames.

**Contract**: The two fallback faces get freshly computed override values per Critical Implementation Details. Family names `'Archivo'` / `'Archivo Expanded'` are the contract every later phase depends on.

#### 2. Font tokens

**File**: `apps/astro/src/global/global.scss` (`:root`, adjacent to the `--typography-*` tokens at :89–98)

**Intent**: Add the two tokens that the whole sweep resolves to.

**Contract**:

```scss
--font-body: 'Archivo', 'Archivo Fallback', sans-serif;
--font-heading: 'Archivo Expanded', 'Archivo Expanded Fallback', sans-serif;
```

#### 3. Body + display heading rules

**File**: `apps/astro/src/global/global.scss` (`:208`, `:246–261`)

**Intent**: `body` uses `var(--font-body)`; the h1/h2 display rule uses `var(--font-heading)` with `font-weight: 900` (was 760). `line-height: 0.9`, `letter-spacing: -0.065em`, `text-transform: uppercase`, and the size token stay byte-identical.

**Contract**: Only the family string and the weight value change in these rules.

#### 4. Preloads

**File**: `apps/astro/src/layouts/Head.astro` (lines 78–80)

**Intent**: Point the three preloads at `archivo-regular.woff2`, `archivo-bold.woff2`, `archivo-expanded-black.woff2` (medium stays unpreloaded — mirrors current posture). Careful: this file has active SEO-change edits nearby; touch only the three preload lines.

**Contract**: Same `<link rel="preload" as="font" type="font/woff2" crossorigin>` shape, new `href`s.

### Success Criteria:

#### Automated Verification:

- `npm run build` passes
- `npm run lint` passes
- `grep -n "Gothik\|Unica\|Haas" apps/astro/src/global/global.scss apps/astro/src/layouts/Head.astro` returns zero hits
- `--font-body` and `--font-heading` defined exactly once in `global.scss`

#### Manual Verification:

- Local dev smoke check: h1/h2 render Archivo Expanded (wide, heavy, uppercase), body text renders Archivo — no fallback flash on reload

---

## Phase 3: Component Sweep, Cleanup & Verification

### Overview

Mechanically replace every remaining hardcoded family string with the tokens, remap the display weights, delete old binaries, and verify to grep-zero.

### Changes Required:

#### 1. Family-string sweep (~41 component/template lines)

**Files**: the 30 component/template files listed in `research.md` → Code References (Gothik stack ×17 component lines, Unica stack ×24)

**Intent**: Replace every `font-family: 'PF Grand Gothik', 'PF Grand Gothik Fallback', sans-serif` with `font-family: var(--font-heading)` and every `font-family: 'Neue Haas Unica', 'Neue Haas Unica Fallback', sans-serif` with `font-family: var(--font-body)`. **Grep is the source of truth**, not the research list — sweep until repo grep is clean.

**Contract**: Only the `font-family` value changes on each line; surrounding letter-spacing/line-height/transform declarations stay untouched. `TextBlocksGrid.astro:112` (`inherit`) and `emails/contact-emails.ts` (web-safe stack) are exempt.

#### 2. Display-weight remap (16 component lines)

**Files**: the `font-weight: 760` list in `research.md` (minus the two `global.scss` lines handled in Phase 2)

**Intent**: `font-weight: 760` → `font-weight: 900` everywhere it accompanies the display family. Leave the two `font-weight: 600` occurrences alone.

**Contract**: `grep -rn "font-weight: 760" apps/astro/src` must end at zero.

#### 3. Delete old font binaries

**Files**: `apps/astro/public/fonts/pf-grand-gothic.{woff2,woff}`, `neue-haas-unica-{regular,medium,bold}.{woff2,woff}`

**Intent**: `git rm` the 8 files. Also delete stale gitignored copies under `apps/astro/dist/` and `apps/astro/.vercel/` on disk so no local artifact contradicts the "removed" claim (they regenerate on build).

**Contract**: `apps/astro/public/fonts/` contains exactly the 4 `archivo-*.woff2` files afterwards.

#### 4. Stale reference cleanup

**File**: `.claude/settings.local.json:22`

**Intent**: Remove the stored permission entry referencing `pf-grand-gothic.woff2` (cosmetic path hygiene).

**Contract**: No functional impact; keep JSON valid.

### Success Criteria:

#### Automated Verification:

- `grep -rni "gothik\|gothic\|unica\|haas" apps/astro --include='*' | grep -v node_modules` returns zero hits (covers both CSS-family and filename spellings)
- `grep -rn "font-weight: 760" apps/astro/src` returns zero hits
- `apps/astro/public/fonts/` contains exactly 4 files, all `archivo-*.woff2`
- `npm run build` passes
- `npm run lint` passes

#### Manual Verification:

- Oliwier's visual review across breakpoints on a preview/production deploy — hotspot set: `CardSteps`, the three `Listing` pages (hotels / event-spaces / activities-category), `Newsletter`, `ContactForm`, `NotFoundHero` (404 numeral), `TestimonialsPopup`, hotel `Location`, blog post template
- PL diacritics spot-check in headings and body (e.g. "Atrakcji", "Wyjazdy", ą/ę/ł/ż glyphs)
- Post-deploy: after the ≤1 h ISR window, no font 404s in the browser console; fonts load from the new `/fonts/archivo-*` paths

**Implementation Note**: After Phase 3 automated checks pass, deploy and pause for Oliwier's visual sign-off. The production deploy date is the "removed as of" date for the Font Radar reply.

---

## Testing Strategy

### Unit Tests:

- None — the project has no test runner; verification is build + lint + grep-zero + coverage script.

### Manual Testing Steps:

1. Run local dev, open homepage + one hotel listing + one blog post: verify heading vs body font distinction, uppercase display headings render wide/heavy
2. Resize through the main breakpoints (899 px, ~500 px, ~435 px) on the hotspot components — layout shifts from new metrics are the thing to catch
3. Check 404 page (largest display numeral, `-0.08em` tracking)
4. Verify cookie banner (own CSS) and inquiry forms (weight 500/600/700 zones) look right
5. After deploy: DevTools Network tab shows only `archivo-*.woff2` requests; console free of font 404s (after ISR window)

## Performance Considerations

The plan reproduces the tuned posture 1:1: 3 preloads, `optional` on preloaded faces, `swap` on medium, metric-matched Arial fallbacks, woff2-only, aggressive subsetting. Total font payload should drop (Gothik alone was 56 KB; subset Archivo cuts should land ~10–25 KB each). New filenames avoid any CDN/ISR staleness for the binaries themselves.

## Migration Notes

- No data migration. Rollback = revert the commit(s); old binaries return via git.
- Old font blobs remain in git history by explicit decision — a future `git filter-repo` change can remove them (see research.md §6 for the constraints when that day comes).

## References

- Related research: `context/changes/archivo-font-swap/research.md` (full inventory + Decisions section)
- Change brief: `context/changes/archivo-font-swap/change.md` (Slack thread digest)
- Key files: `apps/astro/src/global/global.scss:1-59,89-98,208,246-261` · `apps/astro/src/layouts/Head.astro:78-80`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Generate Optimized Archivo Assets

#### Automated

- [x] 1.1 Four files exist: `apps/astro/public/fonts/archivo-{regular,medium,bold,expanded-black}.woff2`
- [x] 1.2 Each file ≤ 40 KB
- [x] 1.3 Glyph-coverage check confirms all PL diacritics in all four files

### Phase 2: Global Layer Swap

#### Automated

- [x] 2.1 `npm run build` passes
- [x] 2.2 `npm run lint` passes
- [x] 2.3 Zero `Gothik|Unica|Haas` hits in `global.scss` + `Head.astro`
- [x] 2.4 `--font-body` / `--font-heading` defined exactly once

#### Manual

- [x] 2.5 Local dev smoke check: display vs body font render correctly, no fallback flash

### Phase 3: Component Sweep, Cleanup & Verification

#### Automated

- [x] 3.1 Repo-wide grep zero for `gothik|gothic|unica|haas` in `apps/astro`
- [x] 3.2 Zero `font-weight: 760` hits in `apps/astro/src`
- [x] 3.3 `public/fonts/` contains exactly the 4 `archivo-*.woff2` files
- [x] 3.4 `npm run build` passes
- [x] 3.5 `npm run lint` passes

#### Manual

- [x] 3.6 Oliwier's visual review across breakpoints (hotspot set)
- [x] 3.7 PL diacritics spot-check in headings and body
- [ ] 3.8 Post-deploy: no font 404s after ISR window; only `archivo-*` font requests
