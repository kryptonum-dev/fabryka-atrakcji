# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Turborepo monorepo for a B2B corporate events platform (Fabryka Atrakcji). Two workspaces:

- `apps/astro` — Astro 5 SSR website deployed on Vercel with ISR
- `apps/sanity` — Sanity Studio (headless CMS)

Bilingual site: Polish (`/pl/...`) and English (`/en/...`) routes.

## Commands

```bash
# Root (Turborepo)
bun install              # Install dependencies (uses Bun 1.2.4)
npm run dev              # Start both Astro + Sanity dev servers
npm run build            # Build all apps
npm run lint             # ESLint across workspaces
npm run format           # Prettier (TS/TSX/MD)

# Sanity Studio
cd apps/sanity
npm run deploy           # Deploy to staging
npm run deploy:production # Deploy to production
```

## Code Style

- **Prettier**: no semicolons, single quotes, trailing commas (es5), 2-space indent, 120 char width
- **ESLint**: Astro recommended + no-unused-vars error; Sanity uses @sanity/eslint-config-studio
- **TypeScript**: strict mode in both workspaces

## Architecture Notes

- **Preact compat mode** — React/React-DOM are aliased to Preact. Interactive components are Preact islands.
- **Vite SSR noExternal** — `react-hook-form`, `react-international-phone`, `embla-carousel-react` must stay in noExternal config.
- **ISR caching** excludes `/api/**`, `/filtr*`, `/filter*` (these are dynamic/uncached).
- **Redirects** are managed in Sanity (fetched at build time via `redirects.ts`).
- **InquiryForm** has hardcoded variants (general, activity_listing, hotel_listing, activity_detail, hotel_detail) — not Sanity-driven.

## TypeScript Path Aliases (apps/astro)

`@/src/*`, `@/global/*`, `@/components/*`, `@/utils/*`, `@/assets/*`, `@/templates/*`, `@/emails/*`, `@/public/*`

## API Routes (apps/astro/src/pages/api/)

- `/api/contact` — Inquiry + FAQ submission → email + Google Sheets logging
- `/api/newsletter` — MailerLite subscription
- `/api/s3d` — Google Sheets logging (sendBeacon)
- `/api/analytics/meta` — Meta Conversions API
- `/api/embeddings` — Semantic search for activities/hotels

## Environment Variables

Required (defined in turbo.json globalEnv): `SANITY_API_TOKEN`, `SANITY_PROJECT_ID`, `RESEND_API_KEY`, `MAILERLITE_API_KEY`, `EMBEDDINGS_INDEX_BEARER_TOKEN`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_SHEET_ID`, `ISR_BYPASS_TOKEN`, `REVALIDATION_SECRET`

## Sanity

- Project ID: `fn3a7ltg`
- Document internationalization enabled (PL/EN)
- Schema located in `apps/sanity/schema/`
- Migrations in `apps/sanity/scripts/`
