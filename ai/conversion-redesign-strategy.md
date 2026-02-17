# Conversion Flow Redesign Strategy

## Overview

Complete restructuring of the Fabryka Atrakcji user journey to replace the e-commerce-style cart/configurator flow with a consultative, contact-first approach. The core philosophy shift: from "browse the catalog and configure your own quote" to "tell us what you need — we'll prepare a proposal."

This aligns with FA's brand promise: "Zrelaksuj się. My zajmiemy się resztą." — but the current site contradicts it by forcing users through a 6-8 step self-service configurator before they can contact anyone.

---

## Table of Contents

- [1. Current State Analysis](#1-current-state-analysis)
- [2. Diagnosed Problems](#2-diagnosed-problems)
- [3. Philosophy of Change](#3-philosophy-of-change)
- [4. What We Remove](#4-what-we-remove)
- [5. What We Keep](#5-what-we-keep)
- [6. What We Add](#6-what-we-add)
- [7. New User Journeys](#7-new-user-journeys)
- [8. Form Architecture — One Unified ContactForm Component](#8-form-architecture--one-unified-contactform-component)
- [9. Technical Implementation Map](#9-technical-implementation-map)
- [10. Sanity CMS Changes](#10-sanity-cms-changes)
- [11. Component Changes](#11-component-changes)
- [12. Page-by-Page Specifications](#12-page-by-page-specifications)
- [13. Step-by-Step Implementation Plan](#13-step-by-step-implementation-plan)
- [14. Files Affected](#14-files-affected)
- [Appendix A: Form Architecture & Separation](#appendix-a-form-architecture--separation)
- [Appendix B: Analytics Strategy](#appendix-b-analytics-strategy)
- [Appendix C: Key Metrics to Track](#appendix-c-key-metrics-to-track)

---

## 1. Current State Analysis

### Business Context

Fabryka Atrakcji is a B2B corporate event agency. They sell a **consultative service** — every event is custom-priced, finalized by Łukasz/Julia in a phone call. The website's job is to generate leads (contact form submissions), not to process transactions.

### Current Traffic from Meta Ads

100% of Meta Ad traffic lands on three pages:

| Landing Page                           | Traffic Share | Current Path                                     |
| -------------------------------------- | ------------- | ------------------------------------------------ |
| `/pl/integracje/` (activities listing) | 40%           | Listing → Activity → Cart → Configurator → Quote |
| `/pl/kontakt/` (contact page)          | 40%           | Generic form with minimal context                |
| `/pl/hotele/` (hotels listing)         | 20%           | Listing → Hotel → Cart → Configurator → Quote    |

### Current User Journey (6-8 Steps)

```
Ad click → Listing → Pick activity → (Pick hotel) → Pricing configurator → Addons (DJ, photo, transport) → Price summary → Contact form
```

Each step loses 20-50% of users. At 6 steps with optimistic 70% retention per step, only ~12% of users reach the form. With cold Meta traffic (exploratory mindset), the real number is significantly lower.

### Current Technical Architecture (Relevant Parts)

**Cart System:**

- State: Nanostores with `@nanostores/persistent` (LocalStorage)
- Items: Hotels and activities with independent configurations
- Per-item: Participants count, date ranges, selected addons
- Transport: Optional bus transport with distance-based pricing
- Extras: Additional services from `Cart_Page` CMS config
- Pricing: Base price + per-person + addons (fixed/per_unit/threshold/individual) + transport + gastronomy

**Cart-Related Pages:**

- `/pl/koszyk/` and `/en/cart/` — Cart/quote builder page
- `QuoteCartLayout.astro` — Dedicated layout for cart pages
- ISR excluded: `/pl/koszyk/`, `/en/cart/`

**Cart-Related Components:**

- `components/cart/` — Cart form, activity address form, quote request form
- `components/offer/` — AddonsPopup, Hero, SubmitSidebar
- `components/ui/CartLink` — Cart icon with animated badge counter

**Cart-Related Sanity Schemas:**

- `Cart_Page` — Singleton with transport options, addons list, cart states
- `Quote_Page` — Singleton for the quote request page
- `Quotes_Collection` — System-generated documents for submitted quotes
- `addons` shared type — Reusable addon system across activities and hotels

**Cart-Related API Routes:**

- `/api/quotes` (POST/GET) — Quote creation and retrieval
- `/api/initialQuote` (POST) — Initial quote generation
- `/api/cart/activity` (GET) — Fetch activity data for cart
- `/api/cart/hotel` (GET) — Fetch hotel data for cart

**Cart-Related Types:**

- `ExtendedHotelData` — Hotel with cart-specific data
- `ExtendedActivityData` — Activity with cart-specific data
- `AddonProps`, `AddonItem`, `ExtraItem` — Addon configuration types

**Contact Form:**

- Existing `ContactForm` component in `components/global/`
- `/api/contact` (POST) — Contact form submission (Resend email + Google Sheets)
- Current contact page has two separate forms and minimal context

**Existing Navigation:**

- `Header.astro` — Main navigation with CartLink component
- `navbar` Sanity singleton — Navigation configuration

---

## 2. Diagnosed Problems

### Problem 1: Too Many Steps to Contact (HIGHEST IMPACT)

The current path requires 6-8 steps. Meta Ad users are in "inspiration mode" — they scrolled a feed, saw a reel, clicked out of curiosity. They are not ready for a multi-step configurator.

**Impact:** Probably responsible for the largest % of lost conversions.

### Problem 2: No Simple Contact at Early Stage (VERY HIGH IMPACT)

The only path to contact is through the full cart flow OR navigating to `/kontakt/`. No activity page, listing page, or hotel page has a direct contact form. The CTA "Wybierz do kompleksowej wyceny" (Choose for comprehensive pricing) sends users into the cart, not to a conversation.

The buyer persona (stressed HR person tasked with organizing a team event) wants to say "I have 80 people, budget X, make me a proposal" — not build their own configuration.

### Problem 3: Price Without Context (HIGH IMPACT)

The price summary shows a raw number (e.g., 11,500 PLN netto) with no breakdown, no comparison, no social proof defending the value. Łukasz can defend pricing in conversation — the website cannot.

### Problem 4: E-commerce UX for a Non-E-commerce Service

Cart, "add to cart," pricing configurator — all suggest a purchase transaction. But the user is just sending an inquiry. This creates confusion: "Am I committing to buy?" or "Why do I need to go through all this if someone will call me anyway?"

### Problem 5: Contact Page Doesn't Sell (40% of Ad Traffic)

The `/kontakt/` page receives 40% of ad traffic and fails to convert:

- Generic headline: "Jesteśmy dla Ciebie, aby CI pomóc" — no value proposition
- Zero social proof above the fold
- No process explanation (what happens after submission)
- Form collects too little data (no team size, no timeline)
- Two separate forms on one page creating confusion
- FAQ is the only trust element — buried below the fold

### Problem 6: Listing Overwhelm (40% of Ad Traffic)

Activity listings show 30+ items across 8 categories. No "don't know where to start?" escape hatch. No quick path to contact for the overwhelmed user.

### Problem 7: No Social Proof at Decision Moments

The homepage has case studies, but the cart/pricing flow has zero social proof. At the moment of "should I send this form?" — no testimonials, no "200+ events organized," no "we respond in 24h."

---

## 3. Philosophy of Change

**Old model:** "Browse the catalog → configure your package → see the price → submit"
**New model:** "Tell us what you need → we prepare a tailored proposal"

This means:

- The **contact form** becomes the primary conversion mechanism, not the cart
- The form appears **on every page** with contextual adaptation
- Users can optionally "collect" activities/hotels into an inquiry (replacing the cart concept)
- Language shifts from transactional ("koszyk", "dodaj do koszyka") to consultative ("zapytanie", "dodaj do zapytania")
- Prices stay visible on detail pages as budget orientation, but the configurator/addons/summary is removed from the user path

---

## 4. What We Remove

| Element                                | Current State                                                               | Reason for Removal                                                                        |
| -------------------------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Cart page (`/pl/koszyk/`, `/en/cart/`) | 6-8 step flow: selection → cart → configurator → pricing → addons → form    | Replaced by contact form with context                                                     |
| Price summary/calculator               | Sums activities + hotels + addons into total                                | Price established in conversation                                                         |
| Addons with prices in user path        | DJ (3,900 PLN), photographer (3,500 PLN), etc. displayed as add-on products | Łukasz proposes these as package in conversation                                          |
| Second form on contact page            | Two forms: general + topic-specific                                         | One dynamic form                                                                          |
| E-commerce language                    | "Koszyk", "Dodaj do koszyka", "Kompleksowa wycena"                          | Replaced: "Zapytanie", "Dodaj do zapytania", "Wyślij zapytanie"                           |
| `QuoteCartLayout.astro`                | Dedicated layout for cart pages                                             | No longer needed                                                                          |
| Cart-specific API routes               | `/api/cart/activity`, `/api/cart/hotel`, `/api/initialQuote`                | Cart data fetching no longer needed                                                       |
| Quotes collection in Sanity            | Stored submitted quotes as Sanity documents                                 | Leads are tracked in Google Sheets — Sanity is not the right place for transactional data |
| `/api/quotes` endpoint                 | Created Sanity documents for submitted quotes                               | Removed — form submits via `/api/contact` (email), leads go to Google Sheets              |
| Quotes-related Sanity schemas          | `Quote_Page` singleton, quotes collection type                              | Deleted from schema entirely                                                              |

---

## 5. What We Keep

| Element                                 | Reason                                                                |
| --------------------------------------- | --------------------------------------------------------------------- |
| Prices on activity/hotel detail pages   | Budget orientation — users want to know ballpark                      |
| Filters on listings                     | Work well, help exploration                                           |
| FAQ sections                            | Good for SEO and trust building                                       |
| Photo galleries and descriptions        | Essential for decision making                                         |
| URL structure and navigation categories | No URL changes, preserves SEO                                         |
| Blog, case studies, landing pages       | Unrelated to cart flow, keep as-is                                    |
| `/api/contact` endpoint                 | Will be extended, not replaced                                        |
| Google Sheets integration               | Lead storage continues — this is the single source of truth for leads |
| Analytics tracking                      | Conversion events will be updated                                     |

---

## 6. What We Add

### 6.1 Universal Contact Form Component

One reusable Preact form component that appears on every relevant page, adapting its fields and heading based on context.

**Core fields (always visible):**

| Field                | Type     | Required | Notes                                                                                                         |
| -------------------- | -------- | -------- | ------------------------------------------------------------------------------------------------------------- |
| Imię / Firma         | text     | Yes      | Placeholder: "Jan Kowalski / Nazwa firmy"                                                                     |
| Email                | email    | Yes      |                                                                                                               |
| Telefon              | tel      | No       | Label: "Telefon (opcjonalnie — przyspiesza kontakt)"                                                          |
| Ile osób w zespole   | select   | Yes      | Options: do 30 / 31-80 / 81-150 / 150+                                                                        |
| Preferowany termin   | text     | No       | Placeholder: "np. wrzesień 2026, Q3, konkretna data" (NOT a date picker — users often don't have exact dates) |
| Dodatkowe informacje | textarea | No       | Placeholder: "Opisz czego szukasz — budżet, styl, specjalne wymagania..."                                     |

**Contextual fields (page-dependent):**

| Page Context                  | Additional Fields                                                                                                                       |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Activity listing              | Radio: Typ eventu (Wyjazd z noclegiem / Event w biurze / Gra terenowa / Nie wiem jeszcze)                                               |
| Hotel listing                 | Radio: Preferowany region (Góry / Morze / Mazury / Centralna Polska / Brak preferencji) + Checkbox: "Szukasz scenariusza integracji?"   |
| Activity detail page          | Hidden field with activity ID/name, heading: "Zapytaj o [name]"                                                                         |
| Hotel detail page             | Hidden field with hotel ID/name, heading: "Zapytaj o [name]" + Checkbox: "Szukasz scenariusza integracji?"                              |
| Contact page (empty storage)  | Radio: Typ eventu + heading: "Organizujesz event firmowy? Powiedz nam o swoim zespole — przygotujemy propozycję w 24h."                 |
| Contact page (has selections) | Shows "Twój wybór" section with selected items + core fields + heading: "Świetny wybór! Podaj nam szczegóły — przygotujemy propozycję." |

**Form submission sends:**

- Contact data (name, company, email, phone)
- Context (team size, timeline, event type/region)
- Selected activities and hotels (from localStorage if any)
- Source page URL
- Additional information (textarea)
- UTM parameters from ad (if available)

**CTA text:** "Wyślij zapytanie" (everywhere)
**Success message:** "Dziękujemy! Odezwiemy się w ciągu 24h z propozycją dopasowaną do Twojego zespołu."

### 6.2 LocalStorage "Inquiry" Mechanism (Replacing Cart)

When users click "Dodaj do zapytania" on an activity or hotel page/card, we store to localStorage:

```typescript
interface InquiryItem {
  type: 'integracja' | 'hotel'
  id: string // slug
  name: string // display name
  image: string // thumbnail URL
  url: string // full page URL
}
```

**Feedback after adding:**

1. Button changes to "Dodano ✓" (green, disabled 2s, then "Dodano — zmień")
2. Toast notification: "[Name] dodana do zapytania"
3. Sticky widget appears/updates in bottom-right corner

**Sticky widget (bottom-right corner):**

- Visible on ALL pages when localStorage has ≥1 item
- Compact box with badge showing count
- Expandable: list of items (thumbnail + name + X to remove)
- CTA: "Wyślij zapytanie" → navigates to `/kontakt/` (form in state B with pre-fill)
- Slide-in animation on first addition
- Mobile: smaller but visible, click to expand

**localStorage clearing:**

- After successful form submission
- After clicking "Wyczyść wybór" in widget
- Does NOT clear on browser close (feature — user can return)

### 6.3 Dual CTA on Activity/Hotel Detail Pages

Replace single "Wybierz do kompleksowej wyceny" with:

- **Primary CTA:** "Zapytaj o tę integrację/ten hotel" → smooth scroll to on-page form
- **Secondary CTA:** "Dodaj do zapytania" → saves to localStorage + feedback

### 6.4 "Escape Hatch" on Listings

On activity and hotel listings, below the hero and above the cards:

> **"Nie wiesz od czego zacząć?"**
> Powiedz nam o swoim zespole — dobierzemy najlepszą opcję. Zorganizowaliśmy ponad 200 eventów — wiemy co działa.
> [Wyślij zapytanie →]

Scrolls to the form at the bottom of the listing page.

### 6.5 Social Proof Placement — Unified "Form Wrapper" Pattern

Social proof is **not** scattered between listing cards. Instead, it wraps the contact form on **every page** where the form appears, creating a consistent trust-building context around the conversion point.

**Pattern (same everywhere):**

```
┌─────────────────────────────────────┐
│  SOCIAL PROOF (above form)          │
│  • Client company logos (5-8 icons) │
│  • Metrics line                     │
│  • 1-2 short testimonial quotes     │
├─────────────────────────────────────┤
│  INQUIRY FORM                       │
│  (contextual fields per page)       │
├─────────────────────────────────────┤
│  SOCIAL PROOF (below form)          │
│  • Additional testimonial or        │
│    trust element (e.g. "Odpowiedź   │
│    w 24h", Google rating, etc.)     │
└─────────────────────────────────────┘
```

This applies identically to:

- `/pl/kontakt/` — full version with logos, metrics, testimonials above + trust element below
- Activity listings — same wrapper around the form at the bottom of the page
- Hotel listings — same wrapper around the form at the bottom of the page
- Activity detail pages — same wrapper around the on-page form
- Hotel detail pages — same wrapper around the on-page form

**Social proof content:**

- **Client logos:** 5-8 company icons/logos of firms FA has worked with (requires assets from FA)
- **Metrics:** "10+ lat doświadczenia • 200+ zrealizowanych eventów • Zespoły od 10 do 2000 osób • Odpowiedź w 24h"
- **Testimonials:** 1-2 short quotes with name, company, and photo if available
- **Trust element below form:** Google review rating, response time guarantee, or additional testimonial

**Implementation:** Social proof rendering is built **directly into the `ContactForm/index.astro` component**. When the `socialProof` object has data (logos, metrics, testimonials, trustElement), the component renders it above and below the form automatically. No separate wrapper — one component handles everything. The social proof data comes from the ContactForm's Sanity fields (page builder) or from `global.inquiryFormDefaults.socialProof` (template-rendered).

### 6.6 Navigation Change

**Current nav:** `Logo | Integracje firmowe | Hotele dla firm | Realizacje | Skontaktuj się | Polski | Koszyk`

The nav already has "Skontaktuj się" linking to the contact page. Adding a separate "Twoje zapytanie" link would create redundancy — two elements pointing at the same destination.

**Solution: Enhance existing "Skontaktuj się", remove "Koszyk" entirely.**

- **"Koszyk" element:** Removed completely. No replacement in the nav bar.
- **"Skontaktuj się" link:** Stays as-is when localStorage is empty. When inquiry items exist, a small badge (count number) appears on/beside the "Skontaktuj się" link to indicate saved selections. Clicking it still goes to `/kontakt/`, which renders in state B (showing saved items).
- **Sticky widget (section 6.2):** Handles the detailed inquiry item management — the nav badge is just a subtle indicator, not a full UI element.

This keeps the navigation clean, avoids confusion between two contact-related elements, and lets the sticky widget do the heavy lifting for inquiry management.

---

## 7. New User Journeys

### Path A: Quick Contact (80% of traffic, 2-3 steps)

```
Ad → Landing (listing or /kontakt/) → Form → Submit → FA calls back in 24h
```

For: Users who want to delegate the problem immediately. Most Meta ad traffic.

### Path B: Browse & Collect (15% of traffic, 4-5 steps)

```
Ad → Listing → Browse cards → "Dodaj do zapytania" on favorites → Sticky widget → /kontakt/ with pre-fill → Submit
```

For: Users who want to explore options before reaching out.

### Path C: Direct Inquiry from Detail Page (5% of traffic, 2-3 steps)

```
Ad/Google → Activity/Hotel detail page → Read description → Scroll to form → Submit
```

For: Users who land on or navigate to a specific activity/hotel and are ready to ask.

---

## 8. Form Architecture — One Unified ContactForm Component

### Current ContactForm Architecture

The `ContactForm` is a **page builder component**. Editors place it in the `components` array of any `Pages_Collection` document. The contact page (`/pl/kontakt/`) is itself a `Pages_Collection` document, not a dedicated singleton.

```
Sanity Schema (ContactForm.ts)        Frontend (ContactForm/index.astro + Form.tsx)
┌──────────────────────────┐          ┌──────────────────────────────────┐
│ headingImage (image)     │          │ Astro wrapper:                   │
│ heading (PortableText)   │ ──GROQ──→│   Fetches global contact info    │
│ paragraph (PortableText) │          │   Renders heading + paragraph    │
│ state (formState)        │          │   Phone/email contact info       │
│   ├─ success (heading,   │          │                                  │
│   │   paragraph, social) │          │ Preact Form (client:load):       │
│   └─ error (heading,     │          │   Email (required)               │
│       paragraph)         │          │   Phone (optional)               │
│ sectionId (string)       │          │   Message (textarea, required)   │
└──────────────────────────┘          │   Legal checkbox                 │
                                      │   → POST /api/contact            │
Page Builder Pipeline:                │   → GA4 + Meta tracking          │
Components.ts → Components.astro      └──────────────────────────────────┘
  (schema)       (mapping + GROQ)
```

The form currently collects: **email, phone, message, legal checkbox** — far too little for the new inquiry model.

### Solution: One Component, Everything Inside

We **evolve the existing `ContactForm`** into a single self-contained component that handles everything: form fields, social proof, and inquiry items display. The same Astro + Preact component is used everywhere — the difference is **where the data comes from** and **which props are passed**.

**Key principle:** The `variant` is **never** a Sanity field. It's always set in code — `general` by default when the component renders via the page builder, and hardcoded per template for listings and detail pages.

```
┌─────────────────────────────────────────────────────────────┐
│  ContactForm (one component — evolved)                      │
│                                                             │
│  Sanity Schema fields (page builder component):             │
│  ├─ heading, paragraph, headingImage, state    (existing)   │
│  ├─ sectionId                                  (existing)   │
│  ├─ showInquiries (boolean)                    (NEW)        │
│  └─ socialProof (optional object)              (NEW)        │
│      ├─ clientLogos: image[]                                │
│      ├─ metrics: string[]                                   │
│      ├─ testimonials: reference[]                           │
│      └─ trustElement: PortableText                          │
│                                                             │
│  Astro Wrapper (index.astro) accepts props:                 │
│  ├─ All Sanity fields above (from query or passed directly) │
│  ├─ variant (string, from code — NOT from Sanity)           │
│  ├─ contextItem? (activity/hotel object for detail pages)   │
│  ├─ If socialProof data → renders logos, metrics,           │
│  │   testimonials ABOVE the form                            │
│  ├─ Renders Preact InquiryForm (core form fields)           │
│  ├─ If socialProof.trustElement → renders BELOW the form    │
│  └─ Renders contact info (phone, email) as today            │
│                                                             │
│  Preact Form (InquiryForm.tsx, replaces Form.tsx):          │
│  ├─ Core fields: name, email, phone, team size,             │
│  │   timeline, message, legal                               │
│  ├─ Contextual fields based on variant prop                 │
│  ├─ If showInquiries → shows inquiry items from localStorage│
│  ├─ If contextItem → attaches it as hidden form data        │
│  └─ Submits to /api/contact                                 │
└─────────────────────────────────────────────────────────────┘
```

### How It's Rendered in Each Context

**Context A: Page builder (contact page, generic CMS pages)**

Works exactly as today — `Components.astro` maps `_type: "ContactForm"` to the component. `ContactForm_Query` fetches all fields. Editor controls heading, paragraph, social proof, `showInquiries`. The `variant` is always `general` — set by the component itself, not configurable in Sanity.

```
Pages_Collection.components[] → Components_Query → ContactForm_Query → ContactForm/index.astro
                                                                        (variant="general" implicit)
```

No changes to the page builder pipeline.

**Context B: Listings (hardcoded in template)**

The form is **hardcoded** in the listing template. Heading and paragraph are simple portable text fields on the **listing page singleton** (e.g., `Activities_Page.formHeading`, `Activities_Page.formParagraph`). Social proof + state come from `global.inquiryFormDefaults`. The `variant` is hardcoded in the template.

```astro
---
// In ActivitiesListingPage.astro
import ContactForm from '@/components/global/ContactForm/index.astro'

// Page data already fetched (includes formHeading, formParagraph from Activities_Page singleton)
// Global data already fetched (includes inquiryFormDefaults with socialProof, state)

const { formHeading, formParagraph } = pageData // simple PortableText from singleton
const { socialProof, state } = globalData.inquiryFormDefaults
---

<!-- Hardcoded position: after cards, before FAQ -->
<ContactForm
  heading={formHeading}
  paragraph={formParagraph}
  socialProof={socialProof}
  state={state}
  variant="activity_listing"
  showInquiries={false}
  index={sectionIndex}
/>
```

The heading/paragraph are **per-listing-page fields** — editors can customize "Zapytaj o integrację" vs. "Zapytaj o hotel" in the respective singletons. Social proof and form state are shared via `global.inquiryFormDefaults`.

**Context C: Detail pages (hardcoded in template)**

Also hardcoded. The form heading can be auto-generated from the activity/hotel name. The current activity/hotel is passed as `contextItem` — the form auto-attaches it as hidden data in the submission.

```astro
---
// In ActivityPage.astro (single activity detail)
import ContactForm from '@/components/global/ContactForm/index.astro'

const { socialProof, state } = globalData.inquiryFormDefaults
const activity = pageData // current activity document
---

<ContactForm
  heading={`Zapytaj o ${activity.name}`}
  paragraph={globalData.inquiryFormDefaults.paragraph}
  socialProof={socialProof}
  state={state}
  variant="activity_detail"
  showInquiries={false}
  contextItem={{ type: 'integracja', id: activity._id, name: activity.name }}
  index={sectionIndex}
/>
```

The `contextItem` prop tells the Preact form to include this activity/hotel as a hidden field in the submission — no localStorage involved on detail pages.

### Schema Changes to ContactForm

**Keep all existing fields** + add:

| New Field                  | Type                                      | Default | Purpose                                                                                                              |
| -------------------------- | ----------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------- |
| `showInquiries`            | boolean                                   | `true`  | When `true`, displays saved inquiry items from localStorage. Set to `true` on contact page, `false` everywhere else. |
| `socialProof`              | object (optional)                         | empty   | When filled, renders social proof above/below the form                                                               |
| `socialProof.clientLogos`  | array of images                           | —       | Company logos displayed above the form                                                                               |
| `socialProof.metrics`      | array of strings                          | —       | e.g., "10+ lat doświadczenia", "200+ eventów"                                                                        |
| `socialProof.testimonials` | array of refs to `Testimonial_Collection` | —       | Short quotes displayed above the form                                                                                |
| `socialProof.trustElement` | PortableText                              | —       | Trust text below the form (e.g., "Odpowiedź w 24h")                                                                  |

**NOT in the Sanity schema:** `variant` — always set in code (`general` for page builder, specific values in templates).

Existing fields stay unchanged:

- `headingImage` — optional image beside heading
- `heading` — editor-controlled heading (PortableText)
- `paragraph` — editor-controlled paragraph (PortableText)
- `state` — success/error messages with social media links
- `sectionId` — anchor link support

### `showInquiries` Boolean — What It Controls

| Value   | Behavior                                                                                                                                                                                                      | Best For                           |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `true`  | Shows saved activities/hotels from localStorage above the form fields. Users can remove items. If no items saved, this section is simply hidden.                                                              | Contact page (via page builder)    |
| `false` | Inquiry items section never renders. Clean form only. On detail pages, the context comes from the `contextItem` prop (auto-attached hidden field). On listings, context comes from contextual variant fields. | Listings, detail pages (hardcoded) |

### `global` Singleton — Shared Form Config

For template-rendered forms, shared data (social proof, success/error states, default paragraph) comes from a new field group on the `global` singleton:

```
global.inquiryFormDefaults {
  paragraph: PortableText             // Default paragraph (fallback for templates)
  state: formState                    // Default success/error messages
  socialProof {                       // Social proof (shared across all forms)
    clientLogos: image[]
    metrics: string[]
    testimonials: reference[]         // Testimonial_Collection
    trustElement: PortableText
  }
}
```

This stores the **shared parts** — social proof and form state. Heading and paragraph for listings come from the listing singletons (`Activities_Page.formHeading`, `Hotels_Page.formHeading`). For detail pages, the heading is auto-generated from the activity/hotel name.

### Listing Page Singletons — Form Content Fields

Each listing singleton gets simple portable text fields for its hardcoded form:

**`Activities_Page` singleton — add:**

- `formHeading` (Heading) — e.g., "Zapytaj o integrację"
- `formParagraph` (PortableText) — e.g., "Opisz nam swój zespół, a przygotujemy propozycję."

**`Hotels_Page` singleton — add:**

- `formHeading` (Heading) — e.g., "Zapytaj o hotel"
- `formParagraph` (PortableText) — e.g., "Powiedz nam o swoim wydarzeniu, a znajdziemy idealny obiekt."

These are **regular Sanity fields**, not page builder components. Editors can customize them per listing page.

### Preact Form Component (InquiryForm.tsx, replaces Form.tsx)

Extended form with new fields:

**Core fields (always visible):**

| Field                | Type        | Required | Notes                                    |
| -------------------- | ----------- | -------- | ---------------------------------------- |
| Imię / Firma         | text input  | Yes      | New field                                |
| Email                | email input | Yes      | Existing, unchanged                      |
| Telefon              | tel input   | No       | Existing, unchanged                      |
| Ile osób w zespole   | select      | Yes      | New: do 30 / 31-80 / 81-150 / 150+       |
| Preferowany termin   | text input  | No       | New: placeholder "np. wrzesień 2026, Q3" |
| Dodatkowe informacje | textarea    | No       | Replaces current "message" field         |
| Legal checkbox       | checkbox    | Yes      | Existing, unchanged                      |

**Contextual fields (controlled by `variant` prop — set in code, not Sanity):**

| Variant            | Extra Fields                                                                                  | Set Where                     |
| ------------------ | --------------------------------------------------------------------------------------------- | ----------------------------- |
| `general`          | Radio: Typ eventu (Wyjazd z noclegiem / Event w biurze / Gra terenowa / Nie wiem jeszcze)     | Page builder (default)        |
| `activity_listing` | Radio: Typ eventu                                                                             | Hardcoded in listing template |
| `hotel_listing`    | Radio: Preferowany region + Checkbox: "Szukasz scenariusza integracji?"                       | Hardcoded in listing template |
| `activity_detail`  | Hidden: activity ID/name (from `contextItem` prop)                                            | Hardcoded in detail template  |
| `hotel_detail`     | Hidden: hotel ID/name (from `contextItem` prop) + Checkbox: "Szukasz scenariusza integracji?" | Hardcoded in detail template  |

**Inquiry items display (when `showInquiries` is true):** Shows saved items from localStorage above the form fields with thumbnail, name, and X to remove.

**Context item (when `contextItem` prop is passed):** Automatically attaches the current activity/hotel as hidden form data. Used on detail pages where the form is always about the specific item being viewed.

### Summary

| Context                         | Heading/Paragraph Source                    | Social Proof Source                      | Variant                   | `showInquiries`       | `contextItem`        |
| ------------------------------- | ------------------------------------------- | ---------------------------------------- | ------------------------- | --------------------- | -------------------- |
| Contact page (page builder)     | ContactForm Sanity fields                   | ContactForm `socialProof` field          | `general` (implicit)      | `true` (Sanity field) | —                    |
| Generic CMS page (page builder) | ContactForm Sanity fields                   | ContactForm `socialProof` field          | `general` (implicit)      | Configurable          | —                    |
| Activity listing (hardcoded)    | `Activities_Page.formHeading/formParagraph` | `global.inquiryFormDefaults.socialProof` | `activity_listing` (code) | `false` (code)        | —                    |
| Hotel listing (hardcoded)       | `Hotels_Page.formHeading/formParagraph`     | `global.inquiryFormDefaults.socialProof` | `hotel_listing` (code)    | `false` (code)        | —                    |
| Activity detail (hardcoded)     | Auto: "Zapytaj o [name]"                    | `global.inquiryFormDefaults.socialProof` | `activity_detail` (code)  | `false` (code)        | `{ type, id, name }` |
| Hotel detail (hardcoded)        | Auto: "Zapytaj o [name]"                    | `global.inquiryFormDefaults.socialProof` | `hotel_detail` (code)     | `false` (code)        | `{ type, id, name }` |

---

## 9. Technical Implementation Map

### New Components to Create

| Component         | Type   | Location                           | Hydration                        | Purpose                                                                      |
| ----------------- | ------ | ---------------------------------- | -------------------------------- | ---------------------------------------------------------------------------- |
| `InquiryForm.tsx` | Preact | `components/global/ContactForm/`   | `client:load` / `client:visible` | Replaces `Form.tsx` — extended form with new fields, variants, inquiry items |
| `InquiryWidget`   | Preact | `components/global/InquiryWidget/` | `client:idle`                    | Sticky bottom-right widget for inquiry items                                 |
| `EscapeHatch`     | Astro  | `components/global/EscapeHatch/`   | Static                           | "Nie wiesz od czego zacząć?" block for listings                              |
| `InquiryItemCard` | Preact | `components/ui/InquiryItemCard/`   | Internal                         | Used inside InquiryForm/InquiryWidget for displaying saved items             |

Note: Social proof rendering is handled **inside** the evolved `ContactForm/index.astro` — no separate wrapper component needed.

### State Management Changes

**Replace cart store with inquiry store:**

```typescript
// New: src/utils/inquiry-store.ts (replaces cart.ts usage)
import { persistentMap } from '@nanostores/persistent';

interface InquiryItem {
  type: "integracja" | "hotel";
  id: string;
  name: string;
  image: string;
  url: string;
}

// Store inquiry items in localStorage
export const $inquiryItems = persistentMap<Record<string, InquiryItem>>('fa-inquiry:', {});

export function addToInquiry(item: InquiryItem): void { ... }
export function removeFromInquiry(id: string): void { ... }
export function clearInquiry(): void { ... }
export function getInquiryCount(): number { ... }
```

### API Route Changes

**Modify `/api/contact`:**

- Accept extended fields: team size, timeline, event type, region, selected items from inquiry
- Include UTM parameters
- Include source page URL
- Email template updated with all context

**Delete entirely (git preserves history):**

- `/api/cart/activity`
- `/api/cart/hotel`
- `/api/initialQuote`
- `/api/quotes`

**Keep:**

- `/api/contact` — Extended with new fields

### Layout Changes

**`Layout.astro`:**

- Add `InquiryWidget` component (renders on all pages when localStorage has items)
- Remove `CartLink` dependency

**`Header.astro`:**

- Remove `CartLink` component entirely
- Add a small badge (count) on/beside the existing "Skontaktuj się" link when localStorage has inquiry items — this is a minor enhancement to the existing nav link, not a new component

**`QuoteCartLayout.astro`:**

- Will become unused — can be deprecated

---

## 10. Sanity CMS Changes

### ContactForm Page Builder Schema (evolve existing)

**`apps/sanity/schema/components/ContactForm.ts` — extend with new fields:**

Keep existing: `headingImage`, `heading`, `paragraph`, `state`, `sectionId`

Add:

| New Field                  | Type              | Default | Purpose                                            |
| -------------------------- | ----------------- | ------- | -------------------------------------------------- |
| `showInquiries`            | boolean           | `true`  | Show/hide saved inquiry items from localStorage    |
| `socialProof`              | object (optional) | —       | When filled, renders social proof above/below form |
| `socialProof.clientLogos`  | array of images   | —       | Company logos                                      |
| `socialProof.metrics`      | array of strings  | —       | Metric strings                                     |
| `socialProof.testimonials` | array of refs     | —       | Refs to `Testimonial_Collection`                   |
| `socialProof.trustElement` | PortableText      | —       | Trust text below form                              |

**NOT added to schema:** `variant` — this is a code-level prop, always `general` when rendered from the page builder, hardcoded per template otherwise.

The `ContactForm` name stays the same in Sanity to avoid data migration. The Astro component evolves to accept `variant` and `contextItem` as template props alongside the Sanity data.

### `global` Singleton (modify)

**Add `inquiryFormDefaults` field group** — stores shared form config used by all hardcoded (template-rendered) forms:

```
inquiryFormDefaults {
  paragraph: PortableText             // Default paragraph (fallback)
  state: formState                    // Shared success/error messages
  socialProof {                       // Shared social proof content
    clientLogos: image[]
    metrics: string[]
    testimonials: reference[]         // Testimonial_Collection
    trustElement: PortableText
  }
}
```

Note: No heading/variant/showInquiries here — headings come from listing singletons, variant and showInquiries are set in code.

### Listing Page Singletons (modify)

**`Activities_Page` (modify):**

- Add `formHeading` (Heading) — form heading for the activities listing page
- Add `formParagraph` (PortableText) — form paragraph for the activities listing page
- Add `overrideFormState` (boolean, default: `false`) — when `true`, use custom success/error messages instead of `global.inquiryFormDefaults.state`
- Add `formState` (formState) — custom success/error messages (hidden in Studio when `overrideFormState` is `false`)
- Add escape hatch heading + text

**`Hotels_Page` (modify):**

- Add `formHeading` (Heading) — form heading for the hotels listing page
- Add `formParagraph` (PortableText) — form paragraph for the hotels listing page
- Add `overrideFormState` (boolean, default: `false`) — same as above
- Add `formState` (formState) — custom success/error messages
- Add escape hatch heading + text

The override pattern: in the template, check `overrideFormState` — if true, pass the singleton's `formState` to ContactForm; if false, pass `global.inquiryFormDefaults.state`.

### Schema Fields to Add to Activity/Hotel Detail

**`Activities_Collection` (add to existing):**

- Soft blocker message override (optional text — for min participants messaging)

**`Hotels_Collection` (add to existing):**

- (No additional fields needed — heading is auto-generated from hotel name in the template)

Detail page form headings are auto-generated in templates: "Zapytaj o [activity.name]" / "Zapytaj o [hotel.name]". No Sanity fields needed for this.

### Schemas to Delete

All unused schemas are **deleted, not archived**. Git history preserves everything.

- `Cart_Page` singleton — transport options, addons list, cart states
- `Quote_Page` singleton — no longer a separate page
- `Quotes` collection (if exists) — leads are tracked in Google Sheets, not Sanity. The `/api/quotes` route that created Sanity documents is also removed.
- `addons` shared type — no longer in user-facing flow. If Łukasz needs addons reference, it lives in the Google Sheet or internal docs, not in the CMS schema.

---

## 11. Component Changes

### Components to Modify

| Component                                   | Change                                                                                                                              |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `components/offer/Hero.astro`               | Replace single CTA with dual CTA (primary: scroll to form, secondary: add to inquiry)                                               |
| `components/ui/ActivityCard` (Preact)       | Add "Dodaj do zapytania" button alongside existing card click behavior                                                              |
| `components/ui/HotelCard` (Astro)           | Add "Dodaj do zapytania" button                                                                                                     |
| `components/global/ContactForm/index.astro` | Evolve to render social proof (above/below form), accept `variant` (code prop), `showInquiries`, `socialProof`, `contextItem` props |
| `components/global/ContactForm/Form.tsx`    | Replace with `InquiryForm.tsx` — extended form with team size, timeline, event type, contextual fields, inquiry items display       |
| `components/ui/CartLink` (Astro)            | Remove entirely — badge logic added to existing "Skontaktuj się" nav link in Header                                                 |
| `components/ui/Toast` (Astro)               | Reuse for "Dodano do zapytania" feedback                                                                                            |

### Components to Create

| Component                               | Description                                                                                  |
| --------------------------------------- | -------------------------------------------------------------------------------------------- |
| `InquiryForm.tsx` (replaces `Form.tsx`) | Extended Preact form with new fields + contextual variants + inquiry items from localStorage |
| `InquiryWidget`                         | Sticky bottom-right widget showing selected items (Preact, `client:idle`)                    |
| `EscapeHatch`                           | "Nie wiesz od czego zacząć?" block for listings (Astro)                                      |
| `HowItWorks`                            | 3-step process section for contact page (Astro, page builder component)                      |
| `PopularItems`                          | Featured activities/hotels cards for contact page (Astro)                                    |

No separate `InquiryFormSection` or `SocialProofFormWrapper` — social proof is rendered **inside** `ContactForm/index.astro` when `socialProof` data is present.

### Components to Delete

All deleted in Phase 11 cleanup. Git history preserves everything — no `unused/` folder.

| Component                                | Reason                                                                  |
| ---------------------------------------- | ----------------------------------------------------------------------- |
| `components/cart/*`                      | Entire cart directory — form, activity address form, quote request form |
| `components/offer/AddonsPopup.astro`     | Addons no longer in user path                                           |
| `components/offer/SubmitSidebar.astro`   | Cart submission sidebar no longer needed                                |
| Leaflet map integration (cart transport) | Transport selection removed from user path                              |
| `components/ui/CartLink`                 | Replaced by badge on existing "Skontaktuj się" link                     |

---

## 12. Page-by-Page Specifications

### 12.1 Contact Page (`/pl/kontakt/`) — COMPLETE REDESIGN

**Architecture note:** This page is a `Pages_Collection` document using the page builder. The new sections (Hero, HowItWorks, SocialProof + Form, FAQ, PopularItems) are implemented as **page builder components** that editors arrange in the `components` array. This preserves CMS editability while enforcing the new structure.

**Current:** Generic heading, two forms, FAQ between them, no social proof.
**New structure (top to bottom, via page builder):**

1. **Hero Section**
   - Heading: "Organizujesz event firmowy? Powiedz nam o swoim zespole — przygotujemy propozycję w 24h."
   - Subheading: "Od wyjazdów integracyjnych po gale firmowe. Jeden koordynator, zero stresu."
   - Background: Real photo from FA event (not stock)

2. **"How It Works" — 3 Steps**
   - Step 1: "Wypełniasz formularz" — "Podaj nam podstawowe informacje o swoim zespole i wydarzeniu."
   - Step 2: "Oddzwaniamy w 24h" — "Nasz koordynator skontaktuje się z Tobą, żeby doprecyzować szczegóły."
   - Step 3: "Przygotowujemy propozycję" — "Otrzymasz kompletną ofertę: scenariusz, hotel, logistyka — wszystko dopasowane."

3. **ContactForm (page builder component, `showInquiries: true`, `socialProof` filled)**
   - Social proof above form: client logo bar (5-8 company icons), metrics, 1-2 testimonial quotes
   - Form — State A (empty localStorage): Core fields + event type radio
   - Form — State B (has selections): "Twój wybór" section showing saved items + core fields
   - One form only (not two)
   - Social proof below form: trust element (response time guarantee)

4. **FAQ Section**
   - Moved below form
   - Focused on conversion objections: cost, timeline, what happens next, minimum group size

5. **Popular Items Section**
   - "Popularne integracje" — 3-4 cards with "Dodaj do zapytania" CTA
   - "Polecane hotele" — 3-4 cards with "Dodaj do zapytania" CTA
   - For users who haven't browsed the catalog

### 12.2 Activity Listing Pages (`/pl/integracje/`, `/pl/integracje/kategoria/[category]`)

**Add (in order):**

1. **Escape Hatch** — below hero, above cards
2. **"Dodaj do zapytania" button** — on each ActivityCard
3. **ContactForm** (hardcoded in template) — bottom of page, above FAQ
   - Heading/paragraph: from `Activities_Page.formHeading` / `Activities_Page.formParagraph` (singleton fields)
   - Social proof + state: from `global.inquiryFormDefaults`
   - `variant="activity_listing"` (hardcoded in template)
   - `showInquiries={false}` (hardcoded)

### 12.3 Hotel Listing Pages (`/pl/hotele/`)

**Add (in order):**

1. **Escape Hatch** — "Nie wiesz jaki hotel wybrać?"
2. **"Dodaj do zapytania" button** — on each HotelCard
3. **ContactForm** (hardcoded in template) — bottom of page, above FAQ
   - Heading/paragraph: from `Hotels_Page.formHeading` / `Hotels_Page.formParagraph` (singleton fields)
   - Social proof + state: from `global.inquiryFormDefaults`
   - `variant="hotel_listing"` (hardcoded in template)
   - `showInquiries={false}` (hardcoded)

### 12.4 Activity Detail Pages (`/pl/integracje/[slug]`)

**Modify:**

1. **Hero CTA** — Replace "Wybierz do kompleksowej wyceny" with:
   - Primary: "Zapytaj o tę integrację" (scroll to form)
   - Secondary: "Dodaj do zapytania" (localStorage)
2. **Soft blocker** — Replace hard "minimum 40 osób" with:
   - "Ta integracja jest optymalna dla grup 40+ osób."
   - "Masz mniejszy zespół? Napisz do nas — dopasujemy scenariusz do Twojej grupy."
   - CTA to form + links to smaller-group activities
3. **Individual price message** — Replace "Cena dostępna w wycenie" with:
   - "Cena ustalana indywidualnie — zależy od terminu, liczby osób i zakresu."
   - CTA: "Zapytaj o wycenę" → scroll to form

**Add:**

1. **ContactForm** (hardcoded in template) — after content section, before FAQ
   - Heading: auto-generated "Zapytaj o [activity.name]" in template code
   - Paragraph + social proof + state: from `global.inquiryFormDefaults`
   - `variant="activity_detail"` (hardcoded)
   - `showInquiries={false}` (hardcoded)
   - `contextItem={{ type: "integracja", id: activity._id, name: activity.name }}` — auto-attached

### 12.5 Hotel Detail Pages (`/pl/hotele/[slug]`)

Same pattern as activity detail pages:

- **ContactForm** (hardcoded in template)
- Heading: auto-generated "Zapytaj o [hotel.name]"
- `variant="hotel_detail"` (hardcoded), `showInquiries={false}` (hardcoded)
- `contextItem={{ type: "hotel", id: hotel._id, name: hotel.name }}` — auto-attached
- Extra checkbox in `hotel_detail` variant: "Szukasz też scenariusza integracji?"
- Social proof + state from `global.inquiryFormDefaults`

### 12.6 Header (All Pages)

- Remove `CartLink` entirely
- "Skontaktuj się" link stays as-is, gains a small badge (item count) when localStorage has inquiry items
- No new nav component — badge is a minor enhancement to the existing link element

### 12.7 Cart Page (`/pl/koszyk/`, `/en/cart/`)

- Remove from navigation
- Set up redirect: `/pl/koszyk/` → `/pl/kontakt/`
- Set up redirect: `/en/cart/` → `/en/kontakt/` (or `/en/contact/`)
- Keep the URL redirect for any bookmarked/cached links

---

## 13. Step-by-Step Implementation Plan

### Phase 0: Environment Setup ✅ COMPLETED

**Goal:** Safe working environment — feature branch, staging Studio that deploys schema changes without affecting the production Studio.

- [x] **0.1** Create a new git branch `feature/conversion-redesign` from `main`
- [x] **0.2** Create a staging Sanity Studio — add a new workspace in `sanity.config.ts` (or a separate config) pointing to the **same production dataset** but deployed to a separate Studio URL (e.g., `fabryka-atrakcji-staging.sanity.studio`). This lets us deploy evolved schemas and test them in the Studio without touching the production Studio deployment.
- [x] **0.3** Verify both Studios work — production Studio unchanged at its current URL, staging Studio accessible at the new URL, both reading/writing the same dataset
- [x] **0.4** Verify local Astro dev environment works — runs against the production dataset as usual

No staging dataset needed — both Studios share the same dataset. The staging Studio is where we deploy and test new schema fields. Once everything is verified, the production Studio gets updated on go-live.

---

### Phase 1: Sanity Schema Changes ✅ COMPLETED

**Goal:** All new schema fields in place before touching any frontend code. Schema deploys to staging only.

- [x] **1.1** Evolve `apps/sanity/schema/components/ContactForm.ts` — added `showInquiries` (boolean, default `true`), `socialProof` (socialProof object type), `overrideFormState` (boolean), `responseBadge` (collapsible object with text + icon), `formVisualImage` (image for sidebar)
- [x] **1.2** Created reusable `socialProof` object type at `apps/sanity/schema/ui/socialProof.ts` — shared across ContactForm and global. Fields: `clientLogos` (image[], max 8), `metrics` (string[]), `testimonials` (reference[] to `Testimonial_Collection`, max 3, language-filtered)
- [x] **1.3** Modified `apps/sanity/schema/singleTypes/global.tsx` — added `inquiryFormDefaults` field group in "Formularze" group with: `paragraph` (PortableText), `state` (formState), `socialProof`, `formVisualImage` (default sidebar image), `responseBadge` (default badge text + icon). Also added `contactRecipients` (array of emails) and `analytics` config (GA4 ID, Google Ads ID, Meta Pixel ID, Meta Conversion API token)
- [x] **1.4** Modified `apps/sanity/schema/singleTypes/Activities_Page.ts` — added `formHeading`, `formParagraph`, `overrideFormState`, `formState`, escape hatch fields
- [x] **1.5** Modified `apps/sanity/schema/singleTypes/Hotels_Page.ts` — same new fields as Activities_Page
- [x] **1.6** Modified `apps/sanity/schema/collectionTypes/Activities_Collection.ts` — added soft blocker message override field
- [x] **1.7** Deployed schemas to the staging Studio
- [x] **1.8** Populated the staging dataset with test content

**Design evolution from original plan:**

- `trustElement` (PortableText below form) was replaced by the `responseBadge` concept — a floating "ODPOWIEDŹ W 24H" pill with configurable text and icon. More visually impactful.
- `formVisualImage` was added — a sidebar image not in the original plan, providing visual interest alongside the form.
- `responseBadge` was added as a configurable component-level and global-level field.

---

### Phase 2: ContactForm Component Evolution (Frontend Core) ✅ COMPLETED

**Goal:** The ContactForm Astro + Preact component can render social proof, accept `variant`/`contextItem`/`showInquiries` as code props, and display the new form fields. Still renders on the contact page via page builder — no new pages yet.

- [x] **2.1** Updated `ContactForm_Query` GROQ fragment — fetches `showInquiries`, `overrideFormState`, `formVisualImage`, `responseBadge { text, icon }`, `socialProof { clientLogos[]{ asset-> }, metrics, testimonials[]->{ name, position, company, review, image { profileImage { asset-> } } } }`. Global fallback query fetches `inquiryFormDefaults` with same shape.
- [x] **2.2** Updated `ContactForm/index.astro` props interface — accepts `variant` (InquiryVariant, default `'general'`), `contextItem` (ContextItem?), `showInquiries` (boolean), `socialProof`, `overrideFormState`, `formVisualImage`, `responseBadge`. Resolution chain: component-level data overrides global defaults.
- [x] **2.3** Added social proof rendering — metrics pills below heading, animated client logo marquee (below form, with `@keyframes` infinite scroll), floating `responseBadge` ("ODPOWIEDŹ W 24H") above form, sidebar with tilted image card + contact info overlay. Testimonials used as sidebar image fallback.
- [x] **2.4** Created `InquiryForm.tsx` — Preact form with `react-hook-form`. Core fields: name/company (required), email (required + regex), phone (optional, with country code selector), team size (radio: do 30 / 31-80 / 81-150 / 150+), preferred timeline (text), additional info (textarea), legal checkbox (required).
- [x] **2.5** Added contextual fields — `hotel_listing` shows region radio + integration checkbox, `hotel_detail` shows integration checkbox, `activity_detail`/`hotel_detail` attach `contextItem` as hidden fields. **Design decision:** Event type radio for `general`/`activity_listing` was intentionally removed — these variants show standard fields only (simpler form = higher conversion).
- [x] **2.6** Added inquiry items display — reads from `localStorage` key `fa-inquiry-items`, renders items with image/name/remove button, listens to `storage` + custom `inquiry-updated` events for cross-component sync, clears on successful submission.
- [x] **2.7** Created `InquiryForm.module.scss` — `.fieldPair` (2-col grid, collapses at 46.25rem), `.radioGroup`/`.radioOption` (pill-style radios), `.inquiryItems` (card-based item list), `.stateOverlay` (clips Loader/FormState).
- [x] **2.8** Switched import in `ContactForm/index.astro` from `Form.tsx` to `InquiryForm.tsx` with `client:load`.
- [x] **2.9** Verified on contact page — form renders with social proof, new fields, inquiry items support. Backend submission is in test mode (commented out) — this is Phase 3 scope.

**Design evolutions from original plan:**

- Team size uses radio buttons instead of a `<select>` dropdown — better UX for 4 options.
- Event type radio for `general`/`activity_listing` was intentionally removed — fewer fields = less friction.
- Testimonials render as sidebar image fallback rather than inline quotes — cleaner visual design.
- `trustElement` PortableText replaced by `responseBadge` floating pill — more attention-grabbing.
- Elaborate staggered entrance animations added (IntersectionObserver, 15% threshold, respects `prefers-reduced-motion`).
- Phone input enhanced with country code selector.
- Responsive breakpoints: `66.8125rem` (single column), `46.25rem` (faster marquee), `28.6875rem` (full-width, badge becomes inline).
- Contact info micro-interactions: phone ring animation on hover, email notification animation on hover.

---

### Phase 3: API Route, Form Submission & Analytics Activation ✅ COMPLETED

**Goal:** The backend can receive and process the extended form data. Analytics tracking is live on the InquiryForm. All three form paths work independently.

**Context — Three Independent Form Paths:**

The system has three forms that are already architecturally separated. They share the `/api/contact` endpoint but send different payloads. The analytics infrastructure (`track-event.ts`, Meta CAPI, consent gating) does NOT need changes — only the event firing in InquiryForm needs to be un-commented.

```
┌──────────────────────────────────────────────────────────────┐
│  INQUIRY FORM (95% of conversions — main CTA)                │
│  InquiryForm.tsx → POST /api/contact (extended payload)      │
│  Fields: name, email, phone, teamSize, timeline, info, legal │
│  + variant fields (region, integration checkbox)             │
│  + contextItem (detail pages)                                │
│  + selectedItems (inquiry basket from localStorage)          │
│  Tracking: GA4 lead + Meta Lead (form_name: inquiry_form)    │
│  Sheets: /api/s3d (formType: inquiry_form)                   │
│  Used on: contact page, listings, detail pages               │
├──────────────────────────────────────────────────────────────┤
│  FAQ FORM (5% of conversions — unchanged)                    │
│  FaqForm/Form.tsx → POST /api/contact (simple payload)       │
│  Fields: email, phone, message, legal                        │
│  Tracking: GA4 lead + Meta Lead (form_name: faq_form)        │
│  Sheets: /api/s3d (formType: faq_form)                       │
│  Used on: FAQ sections (popup via PopupWindow)               │
│  STATUS: Fully working, no changes needed.                   │
├──────────────────────────────────────────────────────────────┤
│  NEWSLETTER (engagement, not conversion — unchanged)         │
│  Newsletter/Form.tsx → POST /api/newsletter (MailerLite)     │
│  Fields: email, legal                                        │
│  Tracking: GA4 generate_lead + Meta Lead (newsletter_form)   │
│  No Sheets logging                                           │
│  Used on: footer, blog posts                                 │
│  STATUS: Fully working, no changes needed.                   │
└──────────────────────────────────────────────────────────────┘
```

**Phase 3 Tasks:**

- [x] **3.1** Updated `src/pages/api/contact.ts` — introduced `BaseProps`, `SimpleFormProps`, `InquiryFormProps` discriminated union. `isInquiryForm()` helper checks for `name` field. Both InquiryForm (extended) and FAQ Form (simple) payloads handled gracefully.
- [x] **3.2** Created branded email templates in `src/emails/contact-emails.ts` — two templates using Fabryka Atrakcji brand palette (#45051c, #db664e, #74535e, #f5f1ec). **Team notification** (`teamNotification()`): dark burgundy outer background, white card, coral gradient stripe, uppercase labels, all fields in a clean table (only filled fields shown), selected items with links, additional info block, metadata footer (UTM, source, lang). **Client confirmation** (`clientConfirmation()`): minimalistic, same branded layout, simple "We got your message / reply within 24h" — identical for both InquiryForm and FAQ submissions. Email preview route at `/api/email-preview` for iteration without sending real emails.
- [x] **3.3** Updated validation — `name` required only for inquiry form, `message` required only for FAQ form, `email` + `legal` always required. Both payloads pass cleanly.
- [x] **3.4** Activated backend submission in `InquiryForm.tsx` — `fetch('/api/contact', ...)` live with full payload (contextItem, selectedItems, sourceUrl, utm). Debug logging added for troubleshooting (to be removed before production).
- [x] **3.5** Activated analytics tracking in `InquiryForm.tsx` — `trackEvent()` fires GA4 `lead` + Meta `Lead` with `form_name: 'inquiry_form'`.
- [x] **3.6** Google Sheets logging — code implemented and column mapping updated, but `navigator.sendBeacon('/api/s3d')` is **temporarily commented out** due to `ERR_OSSL_UNSUPPORTED` with `GOOGLE_PRIVATE_KEY` in the local `.env`. The Sheets service (`google-sheets.ts`) correctly handles `formType: 'inquiry_form'` with all new fields. **Needs:** Fix private key format in `.env`, then un-comment the sendBeacon call.
- [x] **3.7** Updated `src/services/google-sheets.ts` — `LeadData` union includes `InquiryLeadData`. `buildRow()` maps: name+additionalInfo → Wiadomosc, teamSize → Liczba Osob (with labels), timeline → Data Eventu.
- [x] **3.8** Partial end-to-end testing — (a) email arrives with branded template ✅, (b) Sheets deferred pending .env fix, (c-d) analytics skipped in dev via localhost guards ✅, (e) FAQ Form unchanged ✅, (f) Newsletter unchanged ✅.

**Design evolutions from original plan:**

- Email templates extracted to dedicated `src/emails/contact-emails.ts` module (not inline in contact.ts).
- Branded HTML templates used instead of React Email (avoids Preact/React module resolution conflicts).
- Both emails (client + team) share a branded layout with dark burgundy background, coral accent stripe, clean footer.
- Email preview route (`/api/email-preview`) created for rapid design iteration.

**Dev environment improvements (done during Phase 3):**

- **Analytics dev guards added** — all analytics skip localhost/dev:
  - `track-event.ts`: hostname check → `console.debug('[Analytics] Skipped — dev environment')`
  - `/api/analytics/meta/index.ts`: `import.meta.env.DEV` guard → returns 200 no-op
  - `CookieConsent.client.tsx`: hostname checks in `ensureGtagScript()` and `ensureMetaPixel()` → scripts don't load on localhost
- **BotID dev guard** — `BotIdInit.astro` skips `initBotId()` on `import.meta.env.DEV`, server-side `checkBotId()` skipped in dev

**Temporary items to clean up before production (Phase 11):**

- `TEST_RECIPIENT` override in `contact.ts` (line 12-13) — remove and restore dynamic recipients
- BotID dev guards in `BotIdInit.astro` and `contact.ts` — remove `if (!import.meta.env.DEV)` wrappers
- Debug `console.log('[InquiryForm]')` statements in `InquiryForm.tsx` — remove
- `/api/email-preview.ts` route — delete
- Google Sheets `sendBeacon` in `InquiryForm.tsx` — un-comment after fixing `.env` GOOGLE_PRIVATE_KEY

---

### Phase 4: Contact Page Redesign ✅ COMPLETED

**Goal:** The `/pl/kontakt/` page gets its new structure via the page builder.

- [x] **4.1** Updated the contact page content in Sanity — restructured the `components[]` array, removed the old two-form layout
- [x] **4.2** ContactForm instance on the contact page has `showInquiries: true`, `socialProof` filled, `variant` defaults to `general` (code default)
- [x] **4.3** Reordered page builder components: Hero section at top, ContactForm (with social proof, response badge, visual image), FAQ below
- [x] **4.4** Contact page renders correctly — hero, social proof (metrics, logos, response badge), form with inquiry items support, FAQ below

**Note:** Contact page redesign was done directly by the team in Sanity Studio and frontend templates. The page builder structure, social proof content, and visual design were completed manually.

---

### Phase 5: Hardcoded Form on Listing Pages ✅ COMPLETED

**Goal:** Activity and hotel listing pages get a hardcoded ContactForm at the bottom.

- [x] **5.1** Modified the GROQ query in `CategoriesPage.astro` — fetches `formHeading`, `formParagraph`, `overrideFormState`, `formState` (with success/error PortableText + highlightedSocialMedia) from `Activities_Page` singleton. Added `FormProps` type and `ContactForm` + `FormStateTypes` imports.
- [x] **5.2** Added ContactForm to `CategoriesPage.astro` — positioned after `<Components>` (bottom of page, before footer). Renders when `formHeading` is populated in Sanity. Props: `heading` from singleton, `paragraph` from singleton (with `[]` fallback), `overrideFormState`/`state` from singleton, `variant="activity_listing"`, `showInquiries={false}`. SocialProof, formVisualImage, and responseBadge resolve to global defaults automatically inside the ContactForm component.
- [x] **5.3** Repeated for `HotelsPage.astro` — same pattern with `Hotels_Page` singleton data, `variant="hotel_listing"`. Extended GROQ query, added `FormProps` to type union, placed ContactForm after `<Components>`.
- [x] **5.4** Both listing pages pass TypeScript checks — no linter errors. Form is conditionally rendered (only when `formHeading` is populated in Sanity), so existing pages work unchanged until content is added.

**Design decisions:**

- ContactForm is placed **outside** both search/regular mode branches in activities, so it appears regardless of mode.
- The form is conditionally rendered with `{page.formHeading && ...}` — acts as a content gate. The form won't appear until the team populates `formHeading` in the Activities_Page / Hotels_Page singletons in Sanity Studio.
- `paragraph` uses `|| []` fallback since the field is optional in Sanity but required in ContactForm props. An empty array renders nothing.
- `index={10}` ensures the heading renders as `<h2>` (any index > 0 triggers h2).
- Global defaults (socialProof, formVisualImage, responseBadge, state fallback) are fetched internally by the ContactForm component — no need to duplicate that query in the template.

---

### Phase 6: Hardcoded Form on Detail Pages ✅ COMPLETED

**Goal:** Every activity and hotel detail page has a hardcoded ContactForm with auto-attached context.

- [x] **6.1** No GROQ query changes needed — ContactForm self-fetches global defaults (paragraph, socialProof, state, formVisualImage, responseBadge) internally via `sanityFetch`.
- [x] **6.2** Added ContactForm to `SingleActivityPage.astro` — placed after `<Components>`, before `<AddonsPopup>`. Auto-generated heading `"Zapytaj o ${page.name}"` constructed as PortableText block in template. Props: `variant="activity_detail"`, `showInquiries={false}`, `animate={false}`, `contextItem={{ type: 'integracja', id: page._id, name: page.name }}`.
- [x] **6.3** Repeated for `SingleHotelPage.astro` — same pattern with `variant="hotel_detail"`, `contextItem={{ type: 'hotel', id: page._id, name: page.name }}`.
- [x] **6.4** Both detail pages pass TypeScript checks — no linter errors. Form always renders (no conditional gate, unlike listing pages) with auto-generated heading and context item.

**Migration timing (critical):**

- Do **not** run the `migrate-contact-form-overrides` script yet.
- Keep existing page-builder `ContactForm` components in Sanity until the full hardcoded form rollout is fully finished and validated end-to-end.
- Run migration only at final go-live stage, then optionally remove page-builder `ContactForm` components in the same controlled release window.

---

### Phase 7: Inquiry Store & "Add to Inquiry" System ✅ COMPLETED

**Goal:** Users can browse, collect activities/hotels into localStorage, and see them on the contact page.

- [x] **7.1** Created `src/utils/inquiry-store.ts` — pure localStorage store (no external deps) with `addToInquiry()`, `removeFromInquiry()`, `clearInquiry()`, `isInInquiry()`, `getInquiryCount()`, `getInquiryItems()`. Item shape: `{ type, id, name, image, url }`. Fires `inquiry-updated` CustomEvent on every mutation.
- [x] **7.2** Modified Hero.astro CTAs on detail pages — primary CTA scrolls to `#contact-form` ("Zapytaj o wycenę"), secondary CTA adds current item to inquiry store ("Dodaj do zapytania"). Removed all cart logic (addToCart, isInCart, dispatchCartUpdate, dispatchAddonsPopup). Button disables visually after item is added.
- [x] **7.3** Modified SubmitSidebar.astro CTA — replaced cart "Wybierz do kompleksowej wyceny" with "Zapytaj o wycenę" that smooth-scrolls to `#contact-form`. Removed entire cart state management script (addToCart, isInCart, in-cart-content, not-in-cart-content). Kept pricing display and mobile fixed-bar behavior.
- [x] **7.4** Added `sectionId="contact-form"` to ContactForm on both `SingleActivityPage.astro` and `SingleHotelPage.astro` — enables scroll-to-form targeting.
- [x] **7.5** Created `InquiryWidget` Preact component — sticky bottom-right FAB with count badge, expandable panel showing inquiry items with thumbnails, remove buttons, and "Przejdź do formularza" CTA linking to `/pl/kontakt/`. Closes on outside click.
- [x] **7.6** Added `InquiryWidget` to `Layout.astro` — renders on all pages with `client:idle` hydration.
- [x] **7.7** Added analytics events — GA4 `add_to_inquiry` + Meta `AddToWishlist` fired in Hero.astro when item is added. GA4 `inquiry_widget_opened` fired when widget is expanded. Extended `Ga4EventName` and `MetaEventName` types in `track-event.ts`.
- [x] **7.8** Refactored `InquiryForm.tsx` to import from shared `inquiry-store.ts` — removed duplicate `getInquiryItems()`, `removeInquiryItem()`, `INQUIRY_STORAGE_KEY` definitions. Uses `removeFromInquiry()` and `clearInquiry()` from the store.

**Design decisions (revised from original plan):**

- **No card-level CTAs** — "Add to inquiry" is on detail pages only (Hero section secondary CTA), not on listing cards. This targets users with higher purchase intent who have already clicked through to read details.
- **No nanostores dependency** — used plain localStorage + CustomEvent pattern, consistent with existing `cart.ts` architecture. Keeps bundle lean.
- **SubmitSidebar simplified** — no longer manages cart state or addon popups. Now a pure scroll-to-form CTA alongside pricing info. Mobile fixed-bar behavior preserved.
- **Toast reused** — existing `dispatchToast()` from events.ts handles "Dodano do zapytania" feedback, no new toast infrastructure needed.

---

### Phase 8: Navigation & Cart Cleanup

**Goal:** Remove cart from navigation, add badge to "Skontaktuj się", set up redirects.

- [ ] **8.1** Remove `CartLink` from `Header.astro` — delete the component reference
- [ ] **8.2** Add a badge (small count indicator) to the existing "Skontaktuj się" nav link — reads from inquiry store, shows count when > 0. Needs a small Preact island or client-side script
- [x] **8.3** ~~Modify Hero CTA on activity detail pages~~ — done in Phase 7.2
- [x] **8.4** ~~Modify Hero CTA on hotel detail pages~~ — done in Phase 7.2
- [ ] **8.5** Set up redirects — `/pl/koszyk/` → `/pl/kontakt/`, `/en/cart/` → `/en/contact/` (in Astro routing or via `_redirects` file)
- [ ] **8.6** Verify navigation — cart link is gone, "Skontaktuj się" shows badge when items exist, old cart URLs redirect properly

---

### Phase 9: Escape Hatch & Listing Enhancements

**Goal:** Users who don't know what to pick get a clear path to the form.

- [ ] **9.1** Create `EscapeHatch` Astro component — "Nie wiesz od czego zacząć?" block with heading, short text, and CTA button scrolling to the form
- [ ] **9.2** Add EscapeHatch to the activities listing template — positioned below hero, above cards. Content from `Activities_Page` singleton (escape hatch heading + text)
- [ ] **9.3** Add EscapeHatch to the hotels listing template — same pattern, content from `Hotels_Page` singleton
- [ ] **9.4** Add soft blocker to activity detail pages — replace hard "minimum 40 osób" with encouraging message + CTA to form (content from `Activities_Collection` soft blocker field)
- [ ] **9.5** Update individual price messaging on activity detail pages — replace "Cena dostępna w wycenie" with "Cena ustalana indywidualnie" + "Zapytaj o wycenę" CTA scrolling to form

---

### Phase 10: Contact Page Polish

**Goal:** Final sections on the redesigned contact page.

- [ ] **10.1** Create `HowItWorks` page builder component (Sanity schema + Astro component) — 3-step process: "Wypełniasz formularz" → "Oddzwaniamy w 24h" → "Przygotowujemy propozycję"
- [ ] **10.2** Create `PopularItems` page builder component (Sanity schema + Astro component) — Featured activities/hotels with "Dodaj do zapytania" buttons, for users who reach the contact page without browsing the catalog
- [ ] **10.3** Add both components to the contact page in Sanity (staging) — HowItWorks above the form, PopularItems below FAQ
- [ ] **10.4** Verify the complete contact page flow — Hero → HowItWorks → Social Proof + Form → FAQ → PopularItems

---

### Phase 11: QA, Testing & Cleanup

**Goal:** Everything works, old code is cleaned up, ready for production.

- [ ] **11.1** Full end-to-end testing on staging — test every form submission path (contact page, activity listing, hotel listing, activity detail, hotel detail), verify emails arrive correctly
- [ ] **11.2** Test inquiry flow end-to-end — add items from listings → see widget → navigate to contact page → see items in form → submit → items in email
- [ ] **11.3** Test edge cases — empty localStorage, 10+ inquiry items, form validation errors, success/error states, state override on listings
- [ ] **11.4** Test i18n — verify PL and EN paths both work (forms, redirects, headings, social proof)
- [ ] **11.5** Accessibility audit — keyboard navigation through form fields, ARIA labels, focus management, 44px touch targets on all interactive elements
- [ ] **11.6** Performance check — Core Web Vitals on listing pages with the added form + social proof. Ensure no LCP regression
- [ ] **11.7** Delete unused cart components — `components/cart/*`, `AddonsPopup.astro`, `SubmitSidebar.astro`, `CartLink`. Git preserves everything.
- [ ] **11.8** Delete unused API routes — `/api/cart/activity`, `/api/cart/hotel`, `/api/initialQuote`, `/api/quotes`. All deleted, not archived.
- [ ] **11.9** Run `migrate-contact-form-overrides` in production release window — first `dry-run`, then `--apply` (and only then decide whether to run with `--remove-contact-form` after frontend verification)
- [ ] **11.9** Delete unused Sanity schemas — `Cart_Page`, `Quote_Page`, quotes collection type, `addons` shared type. Remove from schema index and delete files.
- [ ] **11.10** Delete `QuoteCartLayout.astro` — no longer used
- [ ] **11.11** Delete unused utilities — `cart.ts` and any cart-related type definitions
- [ ] **11.12** Delete legacy `ContactForm/Form.tsx` — replaced by `InquiryForm.tsx`. This removes the `contact_form` analytics event. Only `inquiry_form` and `faq_form` remain as lead events.
- [ ] **11.13** Remove cart page analytics scripts — deleting cart pages removes `view_cart`/`ViewCart` and `begin_checkout`/`InitiateCheckout` events automatically (they live in the page `<script>` tags)
- [ ] **11.14** Verify no broken imports — run `tsc --noEmit` and fix any TypeScript errors from deleted references
- [ ] **11.15** Remove Phase 3 temporary dev items:
  - Remove `TEST_RECIPIENT` override in `src/pages/api/contact.ts` (restore dynamic recipients from Sanity `global.contactRecipients`)
  - Remove BotID dev guards: `if (!import.meta.env.DEV)` wrappers in `BotIdInit.astro` and `contact.ts`
  - Remove debug `console.log('[InquiryForm]')` statements in `InquiryForm.tsx`
  - Delete `/api/email-preview.ts` route (dev-only preview tool)
  - Un-comment Google Sheets `navigator.sendBeacon('/api/s3d')` in `InquiryForm.tsx` (after fixing `.env` GOOGLE_PRIVATE_KEY format)

---

### Phase 12: Go Live

**Goal:** Merge to production.

- [ ] **12.1** Migrate Sanity content from staging to production — deploy the new schemas to the production dataset, copy over the social proof content, form defaults, listing form headings/paragraphs
- [ ] **12.2** Revert `deploy` script in `apps/sanity/package.json` — change `"deploy"` back from staging to production (`sanity deploy`), remove `deploy:production`. During development, `deploy` targets staging as a safety net; this must be reverted before merging.
- [ ] **12.3** Final review of the `feature/conversion-redesign` branch — code review, check for console.logs, ensure no staging-specific config leaked. **Critical email recipient cleanup:**
  - Remove `TEST_RECIPIENT` constant and `IS_DEV` guard in `src/pages/api/contact.ts` (lines 12–19) so `getContactRecipients()` always fetches from Sanity
  - Ensure `global.contactRecipients` is populated in Sanity with real team emails (e.g., `lukasz@fabryka-atrakcji.com`)
  - Verify the fallback email (`lukasz@fabryka-atrakcji.com`) is correct
      x- [ ] **12.4** Merge `feature/conversion-redesign` into `main`
- [ ] **12.5** Deploy to production (Astro + Sanity Studio)
- [ ] **12.6** Verify production — spot-check all form paths, confirm emails, check redirects
- [ ] **12.7** Verify analytics in production — confirm these events fire correctly: (a) `lead` with `form_name: inquiry_form` on InquiryForm submit, (b) `lead` with `form_name: faq_form` on FAQ Form submit, (c) `generate_lead` with `form_name: newsletter_form` on Newsletter submit, (d) `add_to_inquiry` on item add, (e) `PageView`/`page_view` on all pages, (f) `Contact`/`contact` on tel/mailto clicks, (g) `view_item_list`/`view_item` on listing/detail pages. Verify Meta CAPI deduplication works (check Events Manager for duplicate rate).
- [ ] **12.8** Configure GA4 conversions — mark `lead` and `generate_lead` as conversion events in GA4 admin. Set up custom dimensions for `form_name` to filter by form type in reports.
- [ ] **12.9** Baseline metrics — record pre-launch conversion rates by page for before/after comparison. Key metrics: form submission rate, submission by `form_name`, listing bounce rate.

---

## 14. Files Affected

### Pages (Templates) to Modify

| File                                                        | Change                                                                 |
| ----------------------------------------------------------- | ---------------------------------------------------------------------- |
| `src/pages/pl/kontakt.astro` (or dynamic page)              | Complete redesign                                                      |
| `src/templates/ActivitiesListingPage.astro` (or equivalent) | Add EscapeHatch + hardcoded ContactForm (data from singleton + global) |
| `src/templates/HotelsListingPage.astro` (or equivalent)     | Add EscapeHatch + hardcoded ContactForm (data from singleton + global) |
| `src/templates/ActivityPage.astro` (or equivalent)          | Add hardcoded ContactForm with `contextItem`, modify Hero CTA          |
| `src/templates/HotelPage.astro` (or equivalent)             | Add hardcoded ContactForm with `contextItem`, modify Hero CTA          |
| `src/pages/pl/koszyk.astro`                                 | Redirect to /kontakt/                                                  |
| `src/pages/en/cart.astro`                                   | Redirect to /contact/                                                  |

### Layouts to Modify

| File                       | Change                                                             |
| -------------------------- | ------------------------------------------------------------------ |
| `src/layouts/Layout.astro` | Add InquiryWidget, remove CartLink dependency                      |
| `src/layouts/Header.astro` | Remove CartLink, add badge logic to existing "Skontaktuj się" link |

### Components to Create

| File                                                            | Type   | Notes                                                                        |
| --------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------- |
| `src/components/global/ContactForm/InquiryForm.tsx`             | Preact | Replaces `Form.tsx` — extended form with new fields, variants, inquiry items |
| `src/components/global/ContactForm/InquiryForm.module.scss`     | Styles | Styles for the extended form                                                 |
| `src/components/global/InquiryWidget/InquiryWidget.tsx`         | Preact | Sticky bottom-right widget                                                   |
| `src/components/global/InquiryWidget/InquiryWidget.module.scss` | Styles |                                                                              |
| `src/components/global/EscapeHatch/EscapeHatch.astro`           | Astro  | "Nie wiesz od czego zacząć?" block                                           |
| `src/components/global/HowItWorks/HowItWorks.astro`             | Astro  | 3-step process (page builder component for contact page)                     |
| `src/components/global/PopularItems/PopularItems.astro`         | Astro  | Featured activities/hotels (page builder component for contact page)         |

No `InquiryFormSection` or `SocialProofFormWrapper` — everything is inside the evolved `ContactForm`.

### Utilities to Create/Modify

| File                         | Change                                          |
| ---------------------------- | ----------------------------------------------- |
| `src/utils/inquiry-store.ts` | New — localStorage management for inquiry items |
| `src/utils/cart.ts`          | Delete (git history preserves it)               |

### API Routes to Modify

| File                       | Change                      |
| -------------------------- | --------------------------- |
| `src/pages/api/contact.ts` | Extend to accept new fields |

### Files Created in Phase 3

| File                                 | Type        | Purpose                                                                              |
| ------------------------------------ | ----------- | ------------------------------------------------------------------------------------ |
| `src/emails/contact-emails.ts`       | TypeScript  | Branded HTML email templates — `clientConfirmation()` and `teamNotification()`       |
| `src/pages/api/email-preview.ts`     | API Route   | Dev-only preview of email templates (renders mock data as HTML, no email sent)        |

### Files Modified in Phase 3

| File                                                        | Change                                                                                                             |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `src/pages/api/contact.ts`                                  | Discriminated union types, `isInquiryForm()` helper, branded email templates, TEST_RECIPIENT override (temporary)  |
| `src/components/global/ContactForm/InquiryForm.tsx`         | Backend submission activated, analytics activated, debug logging added, Google Sheets sendBeacon commented out      |
| `src/utils/track-event.ts`                                  | Added localhost/127.0.0.1 guard — skips all analytics in dev                                                       |
| `src/pages/api/analytics/meta/index.ts`                     | Added `import.meta.env.DEV` guard — returns 200 no-op in dev                                                      |
| `src/components/cookie-consent/CookieConsent.client.tsx`    | Added localhost checks in `ensureGtagScript()` and `ensureMetaPixel()` — scripts don't load in dev                 |
| `src/components/global/BotIdInit.astro`                     | Added `import.meta.env.DEV` guard — BotID doesn't initialize in dev                                               |
| `tsconfig.json`                                             | Added `@/emails/*` path alias                                                                                      |

### Sanity Schemas to Modify

| File                                                          | Change                                                                                    |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `apps/sanity/schema/singleTypes/global.ts`                    | Add `inquiryFormDefaults` field group (paragraph, state, socialProof)                     |
| `apps/sanity/schema/singleTypes/Activities_Page.ts`           | Add `formHeading`, `formParagraph`, `overrideFormState`, `formState`, escape hatch fields |
| `apps/sanity/schema/singleTypes/Hotels_Page.ts`               | Add `formHeading`, `formParagraph`, `overrideFormState`, `formState`, escape hatch fields |
| `apps/sanity/schema/components/ContactForm.ts`                | Add `showInquiries`, `socialProof` fields (evolve, don't replace)                         |
| `apps/sanity/schema/collectionTypes/Activities_Collection.ts` | Add form heading override                                                                 |
| `apps/sanity/schema/collectionTypes/Hotels_Collection.ts`     | Add form heading override                                                                 |

---

## Appendix A: Form Architecture & Separation

### Three Independent Form Systems

The project has three distinct form systems. They are already architecturally separated — different components, different submission endpoints (or shared endpoint with different payloads), different analytics event names.

**1. InquiryForm (Main CTA — ~95% of expected conversions)**

| Aspect    | Detail                                                                                                                                                                                         |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Component | `components/global/ContactForm/InquiryForm.tsx` (Preact, `client:load`)                                                                                                                        |
| Wrapper   | `components/global/ContactForm/index.astro` (social proof, layout, animations)                                                                                                                 |
| Fields    | name, email, phone (country selector), teamSize (radio), timeline, additionalInfo, legal + variant fields (region, integration checkbox) + contextItem (hidden) + selectedItems (localStorage) |
| API       | `POST /api/contact` (extended payload)                                                                                                                                                         |
| Sheets    | `navigator.sendBeacon('/api/s3d')` with `formType: 'inquiry_form'`                                                                                                                             |
| Analytics | GA4 `lead` + Meta `Lead` with `form_name: 'inquiry_form'`                                                                                                                                      |
| Used on   | Contact page (page builder), listing pages (hardcoded), detail pages (hardcoded)                                                                                                               |
| Variants  | `general`, `activity_listing`, `hotel_listing`, `activity_detail`, `hotel_detail`                                                                                                              |

**2. FAQ Form (Secondary — ~5% of expected conversions)**

| Aspect    | Detail                                                          |
| --------- | --------------------------------------------------------------- |
| Component | `components/ui/FaqForm/Form.tsx` (Preact, `client:idle`)        |
| Wrapper   | `components/ui/FaqForm/index.astro` (popup via `PopupWindow`)   |
| Fields    | email, phone (country selector), message (textarea), legal      |
| API       | `POST /api/contact` (simple payload)                            |
| Sheets    | `navigator.sendBeacon('/api/s3d')` with `formType: 'faq_form'`  |
| Analytics | GA4 `lead` + Meta `Lead` with `form_name: 'faq_form'`           |
| Used on   | FAQ sections (`global/Faq.astro`, offer Faq PortableText block) |
| Status    | **Fully working, no changes needed**                            |

**3. Newsletter (Engagement, not lead conversion)**

| Aspect    | Detail                                                                               |
| --------- | ------------------------------------------------------------------------------------ |
| Component | `components/global/Newsletter/Form.tsx` + `blog/post/content-pt/newsletter/Form.tsx` |
| Fields    | email, legal                                                                         |
| API       | `POST /api/newsletter` (MailerLite subscription)                                     |
| Sheets    | None                                                                                 |
| Analytics | GA4 `generate_lead` + Meta `Lead` with `form_name: 'newsletter_form'`                |
| Used on   | Footer (global), blog posts (inline)                                                 |
| Status    | **Fully working, no changes needed**                                                 |

### Shared `/api/contact` Endpoint

Both InquiryForm and FAQ Form submit to `/api/contact`. The endpoint must handle both payload shapes:

```
InquiryForm payload (extended):
{
  name, email, phone, teamSize, timeline, additionalInfo, legal,
  region?, needsIntegration?, contextItem?, selectedItems[],
  sourceUrl, lang, utm
}

FAQ Form payload (simple):
{
  email, phone, message, legal, lang, utm
}
```

The API differentiates by checking for the presence of `name` or `teamSize` fields. All new fields are optional in validation, so the FAQ Form's simple payload passes without changes.

### Legacy Form (To Be Removed)

`ContactForm/Form.tsx` — the old simple contact form. Still exists in the codebase but is no longer imported by `ContactForm/index.astro` (replaced by `InquiryForm.tsx`). Will be deleted in Phase 11 cleanup. Tracked as `form_name: 'contact_form'`.

### Cart/Configurator Form (To Be Removed)

`cart/quoteForm/index.tsx` — the configurator quote form. Tracked as `form_name: 'configurator_form'`. Entire cart directory deleted in Phase 11.

---

## Appendix B: Analytics Strategy

### Current Analytics Infrastructure (DO NOT MODIFY)

The analytics system is production-tested and well-engineered. The core infrastructure stays unchanged throughout the redesign:

| Component                   | Path                                  | Purpose                                                                                                                                                                                  |
| --------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `track-event.ts`            | `src/utils/track-event.ts`            | Unified dispatch to GA4 + Meta Pixel + Meta CAPI. Handles consent gating, event queuing, readiness checks, retry logic, event deduplication (shared `eventId` between Pixel + CAPI).     |
| `analytics-user-storage.ts` | `src/utils/analytics-user-storage.ts` | Persistent user identity (email, phone) in localStorage. UTM capture/persistence with `capturedAt` timestamps. `getUtmString()` for API payloads, `getUtmForSheet()` for Sheets logging. |
| `CookieConsent.client.tsx`  | Cookie consent UI                     | GA4 Consent Mode (cookieless pings in denied state), Meta Pixel strict blocking (no script until consent). See `ai/analytics-implementation-guide.md` for critical implementation notes. |
| `/api/analytics/meta`       | Server-side CAPI                      | Fetches Pixel ID + token from Sanity `global.analytics`. SHA-256 hashes PII. Extracts `_fbp`/`_fbc` cookies. Deduplicates with client-side pixel via `event_id`.                         |
| `Analytics.astro`           | Layout component                      | Fires automatic `page_view`/`PageView` on every page. Fires `contact`/`Contact` on `mailto:`/`tel:` link clicks.                                                                         |

**Critical rules (from `ai/analytics-implementation-guide.md`):**

- Do NOT remove "Default Denied" initialization for GA4
- Do NOT call `fbq('init')` directly — use `fbq.callMethod.apply()`
- Do NOT merge GA4 and Meta queuing paths
- Always use `applyMetaPixelUserData` for Advanced Matching updates

### Analytics Events — Complete Map After Redesign

#### Form Events (by `form_name`)

| Form        | GA4 Event       | GA4 `form_name`   | Meta Event | Meta `contentName` | Google Sheets        | Status                |
| ----------- | --------------- | ----------------- | ---------- | ------------------ | -------------------- | --------------------- |
| InquiryForm | `lead`          | `inquiry_form`    | `Lead`     | `inquiry_form`     | Yes (`inquiry_form`) | **Enable in Phase 3** |
| FAQ Form    | `lead`          | `faq_form`        | `Lead`     | `faq_form`         | Yes (`faq_form`)     | Working ✅            |
| Newsletter  | `generate_lead` | `newsletter_form` | `Lead`     | `newsletter_form`  | No                   | Working ✅            |

#### Page-Level Events (automatic, from `Analytics.astro`)

| Trigger                        | GA4 Event   | Meta Event | Status     |
| ------------------------------ | ----------- | ---------- | ---------- |
| Every page load                | `page_view` | `PageView` | Working ✅ |
| Click `mailto:` or `tel:` link | `contact`   | `Contact`  | Working ✅ |

#### Listing & Detail Page Events (from template `<script>` tags)

| Page Type              | GA4 Event        | Meta Event     | Status     |
| ---------------------- | ---------------- | -------------- | ---------- |
| Hotels listing         | `view_item_list` | `ViewCategory` | Working ✅ |
| Activities listing     | `view_item_list` | `ViewCategory` | Working ✅ |
| Single hotel detail    | `view_item`      | `ViewContent`  | Working ✅ |
| Single activity detail | `view_item`      | `ViewContent`  | Working ✅ |

#### Events to Add (Phase 7-8, with inquiry system)

| Trigger                    | GA4 Event               | Meta Event      | When    |
| -------------------------- | ----------------------- | --------------- | ------- |
| "Dodaj do zapytania" click | `add_to_inquiry`        | `AddToWishlist` | Phase 7 |
| Inquiry widget expand      | `inquiry_widget_opened` | — (GA4 only)    | Phase 7 |

#### Events to Remove (Phase 11, with cart cleanup)

| Current Event     | GA4                          | Meta                         | Source                 | Reason                  |
| ----------------- | ---------------------------- | ---------------------------- | ---------------------- | ----------------------- |
| Cart view         | `view_cart`                  | `ViewCart`                   | Cart page script       | Cart page removed       |
| Checkout start    | `begin_checkout`             | `InitiateCheckout`           | Cart page script       | Cart flow removed       |
| Configurator lead | `lead` (`configurator_form`) | `Lead` (`configurator_form`) | `cart/quoteForm/`      | Quote form removed      |
| Old contact lead  | `lead` (`contact_form`)      | `Lead` (`contact_form`)      | `ContactForm/Form.tsx` | Replaced by InquiryForm |

### Analytics Implementation by Phase

| Phase        | Analytics Work                                                                                                                                                                             |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Phase 3**  | Un-comment `trackEvent()` and `sendBeacon('/api/s3d')` in `InquiryForm.tsx`. Update `/api/s3d` Sheets column mapping. No infrastructure changes.                                           |
| **Phase 7**  | Add `add_to_inquiry` event in `inquiry-store.ts` when item is added. Add `inquiry_widget_opened` event in `InquiryWidget.tsx`.                                                             |
| **Phase 11** | Delete cart page scripts (removes `view_cart`, `begin_checkout`). Delete `cart/quoteForm/` (removes `configurator_form`). Delete `ContactForm/Form.tsx` (removes `contact_form`).          |
| **Phase 12** | Verify all events fire correctly in production. Set up GA4 conversion events for `lead` (InquiryForm + FAQ) and `generate_lead` (Newsletter). Configure Meta custom conversions if needed. |

### Google Sheets Logging

Forms log to Google Sheets via `navigator.sendBeacon('/api/s3d')` (fire-and-forget). The `/api/s3d` route uses `googleapis` to append rows.

**Current Sheets columns:**

| Column           | `inquiry_form`              | `faq_form`     | `configurator_form` (removed in Phase 11) |
| ---------------- | --------------------------- | -------------- | ----------------------------------------- |
| STATUS           | (empty)                     | (empty)        | (empty)                                   |
| KOMENTARZ        | (empty)                     | (empty)        | (empty)                                   |
| Data             | auto-timestamp              | auto-timestamp | auto-timestamp                            |
| Typ Formularza   | `inquiry_form`              | `faq_form`     | `configurator_form`                       |
| Email            | email                       | email          | email                                     |
| Telefon          | phone                       | phone          | phone                                     |
| Wiadomosc        | additionalInfo              | message        | message                                   |
| Liczba Osob      | teamSize                    | —              | participants count                        |
| Data Eventu      | timeline                    | —              | date range                                |
| Wartosc (PLN)    | —                           | —              | calculated price                          |
| Szczegoly Oferty | selectedItems + contextItem | —              | cart items detail                         |
| UTM              | utm params                  | utm params     | utm params                                |

**Newsletter does NOT log to Sheets** — it only goes to MailerLite via `/api/newsletter`.

### UTM Parameter Flow

1. **Capture:** `track-event.ts` → `extractUtmFromUrl()` → saves to `localStorage` key `analytics-utm` with `capturedAt` timestamp
2. **Persist:** Stays in localStorage across pages. New URL UTMs overwrite stored values.
3. **Usage:**
   - Email templates: `getUtmString()` → query string format → included in `/api/contact` payload
   - Google Sheets: `getUtmForSheet()` → multiline text → sent via `/api/s3d`
   - Meta CAPI: `utm` field in CAPI payload → server extracts and forwards
   - GA4: Auto-captured from URL by GA4 (standard behavior, not explicitly passed)

### Sanity Analytics Configuration

The `global` Sanity document stores analytics IDs in the `analytics` object:

| Field                    | Format          | Used By                                                                       |
| ------------------------ | --------------- | ----------------------------------------------------------------------------- |
| `ga4Id`                  | `G-XXXXXXXXXX`  | `CookieConsent.client.tsx` (loads gtag.js)                                    |
| `googleAdsMeasurementId` | `AW-XXXXXXXXX`  | `CookieConsent.client.tsx` (Google Ads remarketing)                           |
| `metaPixelId`            | 15-digit number | `CookieConsent.client.tsx` (loads fbevents.js) + `/api/analytics/meta` (CAPI) |
| `metaConversionToken`    | Secret token    | `/api/analytics/meta` (server-side CAPI auth)                                 |

Also: `global.googleData` stores `rating` + `ratingCount` for potential future structured data / social proof.

---

## Appendix C: Key Metrics to Track

After implementation, measure:

1. **Form submission rate** — % of visitors who submit any form (primary KPI)
2. **Form submission rate by page** — Which pages generate the most leads
3. **Form submission by type** — `inquiry_form` vs `faq_form` vs `newsletter_form` breakdown
4. **Inquiry items per submission** — Average number of activities/hotels attached
5. **Time to form** — How quickly users reach the form from landing
6. **Contact page conversion rate** — Before vs. after redesign
7. **Listing page bounce rate** — Before vs. after escape hatch addition
8. **Lead quality** — Does the new form provide enough context for Łukasz to prepare proposals efficiently
9. **Add-to-inquiry rate** — % of detail/listing page visitors who add items (Phase 7+)
10. **Inquiry widget engagement** — How often widget is expanded, how often CTA is clicked (Phase 7+)

---

_Strategy created: February 13, 2026_
_Last updated: February 17, 2026 — Phase 0-6 marked complete, hardcoded ContactForm added to detail pages with auto-generated headings and contextItem_
_Sources: PROJECT_OVERVIEW.md, Notion diagnosis (Feb 6, 2026), Notion specification (Feb 9, 2026), Meta Ads traffic analysis_
