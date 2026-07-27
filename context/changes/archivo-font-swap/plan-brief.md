# Archivo Font Swap — Plan Brief

> Full plan: `context/changes/archivo-font-swap/plan.md`
> Research: `context/changes/archivo-font-swap/research.md`

## What & Why

Replace the two unlicensed paid fonts on fabryka-atrakcji.com — PF Grand Gothik (display headings, subject of the Font Radar/Parachute enforcement email) and Neue Haas Unica (body, Monotype exposure) — with self-hosted static instances of Archivo (OFL, free). Both swapped at once so a second enforcement email never comes. The production deploy date becomes the "font removed as of" date in the reply to Font Radar.

## Starting Point

8 font binaries in `public/fonts/`, six `@font-face` blocks in one global stylesheet (including two Arial fallback faces with metric overrides tuned to the old fonts), 3 preloads, and 48 hardcoded `font-family` strings across 31 files — no font tokens exist. The loading setup (preload + `font-display: optional` + metric-matched fallbacks, fully self-hosted) is deliberately performance-tuned and gets reproduced, not redesigned.

## Desired End State

Site renders entirely in Archivo: `'Archivo'` 400/500/700 for body text, `'Archivo Expanded'` 900 for the uppercase display headings. Four CLI-optimized woff2 files (latin + PL subset) under new filenames; the 8 old binaries deleted from the working tree; every component resolves its font through two new CSS tokens. Zero references to the old fonts anywhere in `apps/astro`.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Font architecture | Static instances mirroring current cuts (no variable font) | Matches today's proven layout; smallest per-file payload | Oliwier |
| Optimization | CLI pipeline: `fonttools varLib.instancer` + `pyftsubset` → woff2 | Mirrors the aggressive subsetting the old files had | Oliwier |
| File formats | woff2-only, drop the woff1 tier | Universal support since ~2016; halves file surface | Plan |
| Family tokens | Introduce `--font-body` / `--font-heading` | Next swap becomes a 2-line edit instead of a 31-file sweep | Plan |
| Display weight | `font-weight: 760` → `900` everywhere (18 lines) | CSS says what the font actually is | Plan |
| Fallback metrics | Recompute Arial overrides for Archivo | Old values silently preserve old layout if only renamed | Research |
| Letter-spacing / line-height | Keep all values byte-identical | Oliwier reviews visually himself afterwards | Oliwier |
| Loading posture | Mirror exactly (3 preloads, `optional`/`swap` split) | No new performance variables during a visual-review window | Plan |
| Git history | **No rewrite for now** | Deferred to a separate future change; risk accepted | Oliwier |
| Font Radar reply | Minimal — "font removed", dated to deploy | Out of repo scope | Oliwier |

## Scope

**In scope:** 4 new optimized Archivo woff2 files · `@font-face` + fallback rewrite · font tokens · body/h1-h2 rules (weight 900, no `font-stretch`) · 3 preload updates · ~41-line component family sweep + 16-line weight remap · deleting 8 old binaries · grep-zero verification.

**Out of scope:** git-history rewrite (old blobs incl. the Adobe-EULA `gothic.ttf` stay reachable — accepted) · any letter-spacing/line-height/uppercase retune · new weights (600 keeps snapping to 700) · emails, OG images, Sanity Studio · CSP changes · Font Radar reply text.

## Architecture / Approach

Generate assets outside the repo (fonttools CLI: pin `wght`/`wdth` axes → subset latin+PL → woff2), then swap inside-out: global layer first (`global.scss` @font-face + tokens + body/heading rules, `Head.astro` preloads), then a grep-driven mechanical sweep of all component files, then deletion + verification. New filenames sidestep ISR/CDN cache staleness entirely.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Generate Archivo assets | 4 subset woff2 files under new names | Missing PL glyphs after subsetting (automated coverage check) |
| 2. Global layer swap | New @font-face set, tokens, rules, preloads | Fallback metric overrides copied instead of recomputed |
| 3. Sweep, cleanup, verify | Token sweep, 760→900, old files deleted, grep-zero | A stray hardcoded string missed — grep, not the list, is the source of truth |

**Prerequisites:** Python with `fonttools` + `brotli` available; Archivo variable TTF from Google Fonts. Working tree carries unrelated in-flight edits — commits stage font paths only.
**Estimated effort:** ~1 session, single deploy; pause at the end for Oliwier's visual review.

## Open Risks & Assumptions

- Archivo Expanded 900 at `wdth` 125 renders narrower than Gothik at its declared 150% — headings will look slightly less extended; accepted, caught in visual review.
- Kept letter-spacing/line-height values (tuned to old metrics) may need touch-ups — deliberately deferred to Oliwier's own visual pass.
- ISR-cached HTML references old preload paths for ≤1 h post-deploy — harmless console 404s, no broken text.

## Success Criteria (Summary)

- Production shows Archivo everywhere; no request for any old font file; PL diacritics intact.
- Repo grep for the old families/filenames returns zero; build + lint green.
- Old binaries gone from the working tree → Font Radar reply can truthfully say "removed as of [deploy date]".
