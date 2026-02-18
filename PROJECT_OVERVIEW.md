# Fabryka Atrakcji - Project Overview (Conversion-First)

_Last updated: 2026-02-18_

## 1) What This Project Is

Fabryka Atrakcji is a bilingual (PL/EN) B2B lead-generation platform for corporate events.  
The website is no longer modeled as e-commerce with a cart/quote configurator. It now operates as a consultative inquiry engine:

- Users describe their team and goals.
- The agency prepares a tailored proposal.
- Conversion target is form submission quality, not self-calculated price completion.

The repository is a Turborepo monorepo with:

- `apps/astro` - customer-facing website (Astro + Preact islands)
- `apps/sanity` - content and operational control plane (Sanity Studio)

## 2) Business Mission and Offer Logic

### Mission

"Zrelaksuj się. My zajmiemy się resztą." translated into product behavior: reduce user effort and accelerate first meaningful contact.

### Offer model

- Corporate team-building activities
- Corporate hotel/event venue recommendations
- End-to-end event planning with custom proposals
- Case studies and expert content (blog) as trust builders

### Revenue logic

Lead capture and qualification via inquiry forms, then human follow-up (sales/operations).  
The site qualifies leads with context fields (team size, timeline, preferences, selected items), so the first call starts from concrete information.

## 3) Strategic Shift (Implemented)

### Old model (removed)

- Multi-step cart journey (`listing -> detail -> cart -> configurator -> quote`)
- E-commerce wording ("cart", "add to cart", transactional framing)
- Quote API and quote documents in Sanity as primary lead path

### New model (active)

- Contact-first journey with form access on key pages
- Inquiry collection (`fa-inquiry-items` in localStorage) instead of cart
- Consultation wording ("zapytanie", "wyślij zapytanie")
- One unified conversion system around `ContactForm` + `InquiryForm`

## 4) Current Conversion Architecture

### Primary journeys

1. Quick contact: ad/listing/contact page -> form submit
2. Browse and collect: detail pages -> add to inquiry -> sticky widget -> contact page -> submit
3. Direct detail inquiry: detail page -> on-page form -> submit

### Core conversion components

- `ContactForm/index.astro` (server wrapper + social proof rendering + fallback logic)
- `ContactForm/InquiryForm.tsx` (interactive form, `react-hook-form`, submission, tracking)
- `InquiryWidget/InquiryWidget.tsx` (global sticky inquiry manager + CTA to contact page)
- `utils/inquiry-store.ts` (localStorage state + `inquiry-updated` event bus)

### Form variants

Code-driven variants (not Sanity-driven):

- `general`
- `activity_listing`
- `hotel_listing`
- `activity_detail`
- `hotel_detail`

Each variant controls extra fields/context; core fields stay consistent for qualification quality.

## 5) CMS Logic and Content Cascade (Sanity)

### Key schema change principle

Global defaults + context overrides, with explicit fallback chain.

### Global form defaults

`global.inquiryFormDefaults` contains shared defaults used across template-rendered forms:

- `heading`
- `paragraph`
- `state`
- `socialProof`
- `formVisualImage`
- `responseBadge`

### Listing/detail override logic

- Activities listing:
  - category override -> `Activities_Page.formHeading/formParagraph` -> global fallback
- Hotels listing:
  - `Hotels_Page.formHeading/formParagraph` -> global fallback
- Activity detail:
  - `Activities_Collection.formOverrides` -> `Activities_Page.detailFormDefaults` -> global fallback
- Hotel detail:
  - `Hotels_Collection.formOverrides` -> `Hotels_Page.detailFormDefaults` -> global fallback

### Removed from schema model

Cart/quote-specific schemas are no longer in the active schema set:

- `Cart_Page`
- `Quote_Page`
- `Quotes_Collection`
- shared `addons` type from old cart flow

## 6) Frontend Architecture Snapshot

### Stack

- Astro 5 (SSR/ISR on Vercel)
- Preact islands (`@astrojs/preact`, compat mode)
- TypeScript (strict)
- SCSS + CSS Modules

### Layout decisions

- `Layout.astro` now mounts `InquiryWidget` globally (`client:idle`)
- `Header.astro` no longer renders cart navigation
- `QuoteCartLayout.astro` removed

### Detail/listing CTA behavior

- Primary CTA: scroll to on-page contact form
- Secondary CTA (detail pages): add item to inquiry storage
- Listing pages include "escape hatch" guidance to push uncertain users into the form flow

## 7) API Surface (Current)

Active API routes in `apps/astro/src/pages/api`:

- `/api/contact` - unified endpoint for inquiry + FAQ payload shapes
- `/api/newsletter` - MailerLite subscription
- `/api/s3d` - Google Sheets logging pipeline
- `/api/analytics/meta` - Meta CAPI endpoint
- `/api/embeddings` - semantic search endpoint
- `/api/email-preview` - dev helper route for email template preview (temporary)

Removed API routes from legacy quote/cart flow:

- `/api/cart/activity`
- `/api/cart/hotel`
- `/api/initialQuote`
- `/api/quotes`

## 8) Email, Lead Handling, and Tracking

### Contact processing

`/api/contact` now supports:

- Inquiry payload (extended business context)
- FAQ payload (simple contact form)

### Email delivery

- Team notification and client confirmation templates in `src/emails/contact-emails.ts`
- Dynamic recipients from `global.contactRecipients`
- Preview deployments currently override recipients to a staging inbox (intentional temporary safety)

### Lead logging

- Inquiry submissions send `sendBeacon('/api/s3d')` from the client
- UTM context is persisted and forwarded (email + sheet pipeline)

### Analytics strategy

- GA4 + Meta Pixel + Meta CAPI infrastructure retained
- New inquiry events active (`add_to_inquiry`, inquiry lead path)
- Legacy cart events removed with cart page deletion

## 9) Routing and i18n

- Language model: Polish (`/pl/...`) and English (`/en/...`)
- Contact URLs:
  - PL: `/pl/kontakt/`
  - EN: `/en/contact/`
- Legacy cart URLs are handled via redirects configured in Sanity (`redirects` singleton), not active page routes.

## 10) Current Operational Status

### Completed in the conversion redesign

- Contact-first form architecture implemented
- Inquiry storage + widget implemented
- Hardcoded forms on listing and detail templates implemented
- Cart navigation and cart routes removed from active frontend
- Legacy cart/quote schemas and APIs removed from active system
- Contact page redesigned around form + trust context
- Escape-hatch UX and CMS-managed listing filter options implemented

### Remaining pre-production cleanup items

- Run `migrate-contact-form-overrides` production migration (`dry-run` then apply in release window)
- Remove temporary/dev-only artifacts:
  - preview recipient override behavior in `api/contact`
  - BotID DEV guard wrappers intended only for staging/dev verification
  - debug logging in `InquiryForm.tsx`
  - `api/email-preview.ts` route if no longer needed post-launch validation
- Switch Sanity deploy workflow back to production default after final release sign-off:
  - `apps/sanity/package.json` currently keeps `deploy` targeted to staging host

## 11) Monorepo Structure (High-Level)

```txt
fabryka-atrakcji/
├── apps/
│   ├── astro/         # Website (Astro, Preact islands, API routes)
│   └── sanity/        # Studio, schema, structure, migrations
├── ai/                # Internal strategy and implementation docs
├── .github/workflows/ # CI/CD workflows
├── turbo.json         # Turborepo pipeline
└── package.json       # Workspace root config
```

## 12) North-Star Metrics

Primary KPI set after redesign:

- Form submission rate (overall and by landing page)
- Submission quality (context completeness: team size, timeline, additional info)
- Inquiry-to-submit ratio (items added vs final submission)
- Contact page conversion rate vs baseline
- Listing bounce rate after escape hatch rollout
- Time-to-form from paid traffic landing

---

This overview reflects the implemented conversion-redesign architecture and should be treated as the current source of truth for product behavior, content logic, and go-live readiness.
