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

---

## 1. Current State Analysis

### Business Context

Fabryka Atrakcji is a B2B corporate event agency. They sell a **consultative service** — every event is custom-priced, finalized by Łukasz/Julia in a phone call. The website's job is to generate leads (contact form submissions), not to process transactions.

### Current Traffic from Meta Ads

100% of Meta Ad traffic lands on three pages:

| Landing Page | Traffic Share | Current Path |
|---|---|---|
| `/pl/integracje/` (activities listing) | 40% | Listing → Activity → Cart → Configurator → Quote |
| `/pl/kontakt/` (contact page) | 40% | Generic form with minimal context |
| `/pl/hotele/` (hotels listing) | 20% | Listing → Hotel → Cart → Configurator → Quote |

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

| Element | Current State | Reason for Removal |
|---|---|---|
| Cart page (`/pl/koszyk/`, `/en/cart/`) | 6-8 step flow: selection → cart → configurator → pricing → addons → form | Replaced by contact form with context |
| Price summary/calculator | Sums activities + hotels + addons into total | Price established in conversation |
| Addons with prices in user path | DJ (3,900 PLN), photographer (3,500 PLN), etc. displayed as add-on products | Łukasz proposes these as package in conversation |
| Second form on contact page | Two forms: general + topic-specific | One dynamic form |
| E-commerce language | "Koszyk", "Dodaj do koszyka", "Kompleksowa wycena" | Replaced: "Zapytanie", "Dodaj do zapytania", "Wyślij zapytanie" |
| `QuoteCartLayout.astro` | Dedicated layout for cart pages | No longer needed |
| Cart-specific API routes | `/api/cart/activity`, `/api/cart/hotel`, `/api/initialQuote` | Cart data fetching no longer needed |
| Quotes collection in Sanity | Stored submitted quotes as Sanity documents | Leads are tracked in Google Sheets — Sanity is not the right place for transactional data |
| `/api/quotes` endpoint | Created Sanity documents for submitted quotes | Removed — form submits via `/api/contact` (email), leads go to Google Sheets |
| Quotes-related Sanity schemas | `Quote_Page` singleton, quotes collection type | Deleted from schema entirely |

---

## 5. What We Keep

| Element | Reason |
|---|---|
| Prices on activity/hotel detail pages | Budget orientation — users want to know ballpark |
| Filters on listings | Work well, help exploration |
| FAQ sections | Good for SEO and trust building |
| Photo galleries and descriptions | Essential for decision making |
| URL structure and navigation categories | No URL changes, preserves SEO |
| Blog, case studies, landing pages | Unrelated to cart flow, keep as-is |
| `/api/contact` endpoint | Will be extended, not replaced |
| Google Sheets integration | Lead storage continues — this is the single source of truth for leads |
| Analytics tracking | Conversion events will be updated |

---

## 6. What We Add

### 6.1 Universal Contact Form Component

One reusable Preact form component that appears on every relevant page, adapting its fields and heading based on context.

**Core fields (always visible):**

| Field | Type | Required | Notes |
|---|---|---|---|
| Imię / Firma | text | Yes | Placeholder: "Jan Kowalski / Nazwa firmy" |
| Email | email | Yes | |
| Telefon | tel | No | Label: "Telefon (opcjonalnie — przyspiesza kontakt)" |
| Ile osób w zespole | select | Yes | Options: do 30 / 31-80 / 81-150 / 150+ |
| Preferowany termin | text | No | Placeholder: "np. wrzesień 2026, Q3, konkretna data" (NOT a date picker — users often don't have exact dates) |
| Dodatkowe informacje | textarea | No | Placeholder: "Opisz czego szukasz — budżet, styl, specjalne wymagania..." |

**Contextual fields (page-dependent):**

| Page Context | Additional Fields |
|---|---|
| Activity listing | Radio: Typ eventu (Wyjazd z noclegiem / Event w biurze / Gra terenowa / Nie wiem jeszcze) |
| Hotel listing | Radio: Preferowany region (Góry / Morze / Mazury / Centralna Polska / Brak preferencji) + Checkbox: "Szukasz scenariusza integracji?" |
| Activity detail page | Hidden field with activity ID/name, heading: "Zapytaj o [name]" |
| Hotel detail page | Hidden field with hotel ID/name, heading: "Zapytaj o [name]" + Checkbox: "Szukasz scenariusza integracji?" |
| Contact page (empty storage) | Radio: Typ eventu + heading: "Organizujesz event firmowy? Powiedz nam o swoim zespole — przygotujemy propozycję w 24h." |
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
  type: "integracja" | "hotel";
  id: string;       // slug
  name: string;     // display name
  image: string;    // thumbnail URL
  url: string;      // full page URL
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

const { formHeading, formParagraph } = pageData  // simple PortableText from singleton
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
  contextItem={{ type: "integracja", id: activity._id, name: activity.name }}
  index={sectionIndex}
/>
```

The `contextItem` prop tells the Preact form to include this activity/hotel as a hidden field in the submission — no localStorage involved on detail pages.

### Schema Changes to ContactForm

**Keep all existing fields** + add:

| New Field | Type | Default | Purpose |
|---|---|---|---|
| `showInquiries` | boolean | `true` | When `true`, displays saved inquiry items from localStorage. Set to `true` on contact page, `false` everywhere else. |
| `socialProof` | object (optional) | empty | When filled, renders social proof above/below the form |
| `socialProof.clientLogos` | array of images | — | Company logos displayed above the form |
| `socialProof.metrics` | array of strings | — | e.g., "10+ lat doświadczenia", "200+ eventów" |
| `socialProof.testimonials` | array of refs to `Testimonial_Collection` | — | Short quotes displayed above the form |
| `socialProof.trustElement` | PortableText | — | Trust text below the form (e.g., "Odpowiedź w 24h") |

**NOT in the Sanity schema:** `variant` — always set in code (`general` for page builder, specific values in templates).

Existing fields stay unchanged:
- `headingImage` — optional image beside heading
- `heading` — editor-controlled heading (PortableText)
- `paragraph` — editor-controlled paragraph (PortableText)
- `state` — success/error messages with social media links
- `sectionId` — anchor link support

### `showInquiries` Boolean — What It Controls

| Value | Behavior | Best For |
|---|---|---|
| `true` | Shows saved activities/hotels from localStorage above the form fields. Users can remove items. If no items saved, this section is simply hidden. | Contact page (via page builder) |
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

| Field | Type | Required | Notes |
|---|---|---|---|
| Imię / Firma | text input | Yes | New field |
| Email | email input | Yes | Existing, unchanged |
| Telefon | tel input | No | Existing, unchanged |
| Ile osób w zespole | select | Yes | New: do 30 / 31-80 / 81-150 / 150+ |
| Preferowany termin | text input | No | New: placeholder "np. wrzesień 2026, Q3" |
| Dodatkowe informacje | textarea | No | Replaces current "message" field |
| Legal checkbox | checkbox | Yes | Existing, unchanged |

**Contextual fields (controlled by `variant` prop — set in code, not Sanity):**

| Variant | Extra Fields | Set Where |
|---|---|---|
| `general` | Radio: Typ eventu (Wyjazd z noclegiem / Event w biurze / Gra terenowa / Nie wiem jeszcze) | Page builder (default) |
| `activity_listing` | Radio: Typ eventu | Hardcoded in listing template |
| `hotel_listing` | Radio: Preferowany region + Checkbox: "Szukasz scenariusza integracji?" | Hardcoded in listing template |
| `activity_detail` | Hidden: activity ID/name (from `contextItem` prop) | Hardcoded in detail template |
| `hotel_detail` | Hidden: hotel ID/name (from `contextItem` prop) + Checkbox: "Szukasz scenariusza integracji?" | Hardcoded in detail template |

**Inquiry items display (when `showInquiries` is true):** Shows saved items from localStorage above the form fields with thumbnail, name, and X to remove.

**Context item (when `contextItem` prop is passed):** Automatically attaches the current activity/hotel as hidden form data. Used on detail pages where the form is always about the specific item being viewed.

### Summary

| Context | Heading/Paragraph Source | Social Proof Source | Variant | `showInquiries` | `contextItem` |
|---|---|---|---|---|---|
| Contact page (page builder) | ContactForm Sanity fields | ContactForm `socialProof` field | `general` (implicit) | `true` (Sanity field) | — |
| Generic CMS page (page builder) | ContactForm Sanity fields | ContactForm `socialProof` field | `general` (implicit) | Configurable | — |
| Activity listing (hardcoded) | `Activities_Page.formHeading/formParagraph` | `global.inquiryFormDefaults.socialProof` | `activity_listing` (code) | `false` (code) | — |
| Hotel listing (hardcoded) | `Hotels_Page.formHeading/formParagraph` | `global.inquiryFormDefaults.socialProof` | `hotel_listing` (code) | `false` (code) | — |
| Activity detail (hardcoded) | Auto: "Zapytaj o [name]" | `global.inquiryFormDefaults.socialProof` | `activity_detail` (code) | `false` (code) | `{ type, id, name }` |
| Hotel detail (hardcoded) | Auto: "Zapytaj o [name]" | `global.inquiryFormDefaults.socialProof` | `hotel_detail` (code) | `false` (code) | `{ type, id, name }` |

---

## 9. Technical Implementation Map

### New Components to Create

| Component | Type | Location | Hydration | Purpose |
|---|---|---|---|---|
| `InquiryForm.tsx` | Preact | `components/global/ContactForm/` | `client:load` / `client:visible` | Replaces `Form.tsx` — extended form with new fields, variants, inquiry items |
| `InquiryWidget` | Preact | `components/global/InquiryWidget/` | `client:idle` | Sticky bottom-right widget for inquiry items |
| `EscapeHatch` | Astro | `components/global/EscapeHatch/` | Static | "Nie wiesz od czego zacząć?" block for listings |
| `InquiryItemCard` | Preact | `components/ui/InquiryItemCard/` | Internal | Used inside InquiryForm/InquiryWidget for displaying saved items |

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

| New Field | Type | Default | Purpose |
|---|---|---|---|
| `showInquiries` | boolean | `true` | Show/hide saved inquiry items from localStorage |
| `socialProof` | object (optional) | — | When filled, renders social proof above/below form |
| `socialProof.clientLogos` | array of images | — | Company logos |
| `socialProof.metrics` | array of strings | — | Metric strings |
| `socialProof.testimonials` | array of refs | — | Refs to `Testimonial_Collection` |
| `socialProof.trustElement` | PortableText | — | Trust text below form |

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

| Component | Change |
|---|---|
| `components/offer/Hero.astro` | Replace single CTA with dual CTA (primary: scroll to form, secondary: add to inquiry) |
| `components/ui/ActivityCard` (Preact) | Add "Dodaj do zapytania" button alongside existing card click behavior |
| `components/ui/HotelCard` (Astro) | Add "Dodaj do zapytania" button |
| `components/global/ContactForm/index.astro` | Evolve to render social proof (above/below form), accept `variant` (code prop), `showInquiries`, `socialProof`, `contextItem` props |
| `components/global/ContactForm/Form.tsx` | Replace with `InquiryForm.tsx` — extended form with team size, timeline, event type, contextual fields, inquiry items display |
| `components/ui/CartLink` (Astro) | Remove entirely — badge logic added to existing "Skontaktuj się" nav link in Header |
| `components/ui/Toast` (Astro) | Reuse for "Dodano do zapytania" feedback |

### Components to Create

| Component | Description |
|---|---|
| `InquiryForm.tsx` (replaces `Form.tsx`) | Extended Preact form with new fields + contextual variants + inquiry items from localStorage |
| `InquiryWidget` | Sticky bottom-right widget showing selected items (Preact, `client:idle`) |
| `EscapeHatch` | "Nie wiesz od czego zacząć?" block for listings (Astro) |
| `HowItWorks` | 3-step process section for contact page (Astro, page builder component) |
| `PopularItems` | Featured activities/hotels cards for contact page (Astro) |

No separate `InquiryFormSection` or `SocialProofFormWrapper` — social proof is rendered **inside** `ContactForm/index.astro` when `socialProof` data is present.

### Components to Delete

All deleted in Phase 11 cleanup. Git history preserves everything — no `unused/` folder.

| Component | Reason |
|---|---|
| `components/cart/*` | Entire cart directory — form, activity address form, quote request form |
| `components/offer/AddonsPopup.astro` | Addons no longer in user path |
| `components/offer/SubmitSidebar.astro` | Cart submission sidebar no longer needed |
| Leaflet map integration (cart transport) | Transport selection removed from user path |
| `components/ui/CartLink` | Replaced by badge on existing "Skontaktuj się" link |

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

5. **FAQ Section**
   - Moved below form
   - Focused on conversion objections: cost, timeline, what happens next, minimum group size

6. **Popular Items Section**
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

### Phase 0: Environment Setup

**Goal:** Safe working environment — feature branch, staging Studio that deploys schema changes without affecting the production Studio.

- [ ] **0.1** Create a new git branch `feature/conversion-redesign` from `main`
- [ ] **0.2** Create a staging Sanity Studio — add a new workspace in `sanity.config.ts` (or a separate config) pointing to the **same production dataset** but deployed to a separate Studio URL (e.g., `fabryka-atrakcji-staging.sanity.studio`). This lets us deploy evolved schemas and test them in the Studio without touching the production Studio deployment.
- [ ] **0.3** Verify both Studios work — production Studio unchanged at its current URL, staging Studio accessible at the new URL, both reading/writing the same dataset
- [ ] **0.4** Verify local Astro dev environment works — runs against the production dataset as usual

No staging dataset needed — both Studios share the same dataset. The staging Studio is where we deploy and test new schema fields. Once everything is verified, the production Studio gets updated on go-live.

---

### Phase 1: Sanity Schema Changes

**Goal:** All new schema fields in place before touching any frontend code. Schema deploys to staging only.

- [ ] **1.1** Evolve `apps/sanity/schema/components/ContactForm.ts` — add `showInquiries` (boolean, default `true`) and `socialProof` (optional object with `clientLogos`, `metrics`, `testimonials`, `trustElement` fields)
- [ ] **1.2** Create a reusable `socialProof` object type if shared across schemas, or define it inline in ContactForm — decide based on whether other page builder components will use the same social proof shape
- [ ] **1.3** Modify `apps/sanity/schema/singleTypes/global.ts` — add `inquiryFormDefaults` field group containing `paragraph` (PortableText), `state` (formState), and `socialProof` (same object type as ContactForm)
- [ ] **1.4** Modify `apps/sanity/schema/singleTypes/Activities_Page.ts` — add `formHeading` (Heading), `formParagraph` (PortableText), `overrideFormState` (boolean, default `false`), `formState` (formState, hidden when override is false), and escape hatch fields (`escapeHatchHeading`, `escapeHatchText`)
- [ ] **1.5** Modify `apps/sanity/schema/singleTypes/Hotels_Page.ts` — same new fields as Activities_Page
- [ ] **1.6** Modify `apps/sanity/schema/collectionTypes/Activities_Collection.ts` — add soft blocker message override field
- [ ] **1.7** Deploy schemas to the staging dataset (`npx sanity@latest schema deploy` or via Studio)
- [ ] **1.8** Populate the staging dataset with test content — fill in `global.inquiryFormDefaults` (social proof logos, metrics, testimonials, trust element, default paragraph, default state), fill listing singleton form headings/paragraphs, and fill the contact page's ContactForm instance with `socialProof` data and `showInquiries: true`

---

### Phase 2: ContactForm Component Evolution (Frontend Core)

**Goal:** The ContactForm Astro + Preact component can render social proof, accept `variant`/`contextItem`/`showInquiries` as code props, and display the new form fields. Still renders on the contact page via page builder — no new pages yet.

- [ ] **2.1** Update `ContactForm_Query` GROQ fragment in `ContactForm/index.astro` — add `showInquiries`, `socialProof { clientLogos[]{ asset-> }, metrics, testimonials[]->{ ... }, trustElement }` to the existing query
- [ ] **2.2** Update `ContactForm/index.astro` Astro component props interface — add `variant` (string, optional, default `"general"`), `contextItem` (optional object), and handle the new `socialProof` + `showInquiries` data from the query
- [ ] **2.3** Add social proof rendering to `ContactForm/index.astro` — above the form: client logos bar, metrics line, testimonial quotes (conditional on `socialProof` data being present). Below the form: `trustElement` PortableText block
- [ ] **2.4** Create `InquiryForm.tsx` in `components/global/ContactForm/` — new Preact form component replacing `Form.tsx`. Core fields: name/company, email, phone, team size (select), preferred timeline, additional info (textarea), legal checkbox
- [ ] **2.5** Add contextual fields logic to `InquiryForm.tsx` — based on `variant` prop: `general`/`activity_listing` show event type radio, `hotel_listing` shows region radio + integration checkbox, `activity_detail`/`hotel_detail` attach `contextItem` as hidden fields
- [ ] **2.6** Add inquiry items display to `InquiryForm.tsx` — when `showInquiries` is true, read from localStorage and render saved items above form fields (with thumbnail, name, remove button). When no items exist, hide the section
- [ ] **2.7** Create `InquiryForm.module.scss` — styles for the new form, social proof sections, inquiry items list
- [ ] **2.8** Update the import in `ContactForm/index.astro` — switch from `Form.tsx` to `InquiryForm.tsx`
- [ ] **2.9** Test on the contact page — verify the page builder ContactForm still works as before, now with social proof above/below and new form fields. `showInquiries: true` in Sanity, variant defaults to `general`

---

### Phase 3: API Route & Form Submission

**Goal:** The backend can receive and process the extended form data.

- [ ] **3.1** Update `src/pages/api/contact.ts` — extend the accepted payload: add `name`, `company`, `teamSize`, `preferredTimeline`, `eventType`, `region`, `needsIntegration`, `selectedItems[]` (array of `{ type, id, name }`), `contextItem` (single `{ type, id, name }`), `sourceUrl`, `utmParams`
- [ ] **3.2** Update the email template in the API route — format the new fields into a readable email for Łukasz. Include selected items with links, context item, team size, timeline, etc.
- [ ] **3.3** Update validation in the API route — new required fields (name, team size), keep existing validation for email + legal
- [ ] **3.4** Test form submission end-to-end — submit from the contact page, verify the email arrives with all fields correctly formatted

---

### Phase 4: Contact Page Redesign

**Goal:** The `/pl/kontakt/` page gets its new structure via the page builder.

- [ ] **4.1** Update the contact page content in Sanity (staging) — restructure the `components[]` array: remove the old two-form layout
- [ ] **4.2** Ensure the ContactForm instance on the contact page has `showInquiries: true`, `socialProof` filled, and `variant` defaults to `general` (code default)
- [ ] **4.3** Reorder/add page builder components: Hero section at top, then ContactForm (with social proof), then FAQ (moved below form)
- [ ] **4.4** Verify the contact page renders correctly — hero, social proof, form with inquiry items support, FAQ below

---

### Phase 5: Hardcoded Form on Listing Pages

**Goal:** Activity and hotel listing pages get a hardcoded ContactForm at the bottom.

- [ ] **5.1** Modify the GROQ query in the activities listing template — fetch `Activities_Page.formHeading`, `Activities_Page.formParagraph`, `Activities_Page.overrideFormState`, `Activities_Page.formState` alongside the existing page data. Also fetch `global.inquiryFormDefaults { paragraph, state, socialProof { ... } }`
- [ ] **5.2** Add the ContactForm component to the activities listing template — hardcoded position after cards, before FAQ. Pass `heading` from singleton, `paragraph` from singleton, `socialProof` from global, `state` from singleton (if `overrideFormState`) or global (if not), `variant="activity_listing"`, `showInquiries={false}`
- [ ] **5.3** Repeat for the hotels listing template — same pattern, data from `Hotels_Page` singleton, `variant="hotel_listing"`
- [ ] **5.4** Verify listing pages render the form correctly — heading from singleton, social proof from global, variant-specific fields (event type radio for activities, region radio for hotels)

---

### Phase 6: Hardcoded Form on Detail Pages

**Goal:** Every activity and hotel detail page has a hardcoded ContactForm with auto-attached context.

- [ ] **6.1** Modify the GROQ query in the activity detail template — fetch `global.inquiryFormDefaults { paragraph, state, socialProof { ... } }` alongside the existing activity data
- [ ] **6.2** Add the ContactForm component to the activity detail template — hardcoded position after content section, before FAQ. Pass `heading="Zapytaj o ${activity.name}"` (generated in template), `paragraph` from global, `socialProof` from global, `state` from global, `variant="activity_detail"`, `showInquiries={false}`, `contextItem={{ type: "integracja", id: activity._id, name: activity.name }}`
- [ ] **6.3** Repeat for the hotel detail template — same pattern, `variant="hotel_detail"`, `contextItem={{ type: "hotel", id: hotel._id, name: hotel.name }}`
- [ ] **6.4** Verify detail pages — form renders with auto-generated heading, context item is submitted as hidden data, social proof displays

---

### Phase 7: Inquiry Store & "Add to Inquiry" System

**Goal:** Users can browse, collect activities/hotels into localStorage, and see them on the contact page.

- [ ] **7.1** Create `src/utils/inquiry-store.ts` — nanostores + `@nanostores/persistent` for localStorage management. Functions: `addToInquiry(item)`, `removeFromInquiry(id)`, `clearInquiry()`, `getInquiryCount()`. Item shape: `{ type, id, name, image, url }`
- [ ] **7.2** Add "Dodaj do zapytania" button to `ActivityCard` (Preact) — secondary action alongside existing card click. On click: adds item to inquiry store, shows toast feedback
- [ ] **7.3** Add "Dodaj do zapytania" button to `HotelCard` (Astro) — same pattern, may need partial hydration or a small Preact island for the button
- [ ] **7.4** Modify `components/ui/Toast` — reuse existing toast for "Dodano do zapytania" feedback
- [ ] **7.5** Create `InquiryWidget` Preact component — sticky bottom-right widget that appears when localStorage has inquiry items. Shows count, item thumbnails, "Przejdź do formularza" CTA linking to `/pl/kontakt/`
- [ ] **7.6** Add `InquiryWidget` to `Layout.astro` — renders on all pages with `client:idle` hydration
- [ ] **7.7** Verify the full flow — add items from listing cards → widget appears → click through to contact page → items shown in the form (`showInquiries: true`) → submit → items included in email

---

### Phase 8: Navigation & Cart Cleanup

**Goal:** Remove cart from navigation, add badge to "Skontaktuj się", set up redirects.

- [ ] **8.1** Remove `CartLink` from `Header.astro` — delete the component reference
- [ ] **8.2** Add a badge (small count indicator) to the existing "Skontaktuj się" nav link — reads from inquiry store, shows count when > 0. Needs a small Preact island or client-side script
- [ ] **8.3** Modify Hero CTA on activity detail pages — replace "Wybierz do kompleksowej wyceny" with dual CTA: primary "Zapytaj o tę integrację" (scroll to form) + secondary "Dodaj do zapytania" (localStorage)
- [ ] **8.4** Modify Hero CTA on hotel detail pages — same dual CTA pattern
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
- [ ] **11.9** Delete unused Sanity schemas — `Cart_Page`, `Quote_Page`, quotes collection type, `addons` shared type. Remove from schema index and delete files.
- [ ] **11.10** Delete `QuoteCartLayout.astro` — no longer used
- [ ] **11.11** Delete unused utilities — `cart.ts` and any cart-related type definitions
- [ ] **11.12** Verify no broken imports — run `tsc --noEmit` and fix any TypeScript errors from deleted references

---

### Phase 12: Go Live

**Goal:** Merge to production.

- [ ] **12.1** Migrate Sanity content from staging to production — deploy the new schemas to the production dataset, copy over the social proof content, form defaults, listing form headings/paragraphs
- [ ] **12.2** Final review of the `feature/conversion-redesign` branch — code review, check for console.logs, ensure no staging-specific config leaked
- [ ] **12.3** Merge `feature/conversion-redesign` into `main`
- [ ] **12.4** Deploy to production
- [ ] **12.5** Verify production — spot-check all form paths, confirm emails, check redirects
- [ ] **12.6** Set up analytics tracking — GA4 events for form submissions by page, inquiry item additions, widget interactions. Baseline metrics for before/after comparison

---

## 14. Files Affected

### Pages (Templates) to Modify

| File | Change |
|---|---|
| `src/pages/pl/kontakt.astro` (or dynamic page) | Complete redesign |
| `src/templates/ActivitiesListingPage.astro` (or equivalent) | Add EscapeHatch + hardcoded ContactForm (data from singleton + global) |
| `src/templates/HotelsListingPage.astro` (or equivalent) | Add EscapeHatch + hardcoded ContactForm (data from singleton + global) |
| `src/templates/ActivityPage.astro` (or equivalent) | Add hardcoded ContactForm with `contextItem`, modify Hero CTA |
| `src/templates/HotelPage.astro` (or equivalent) | Add hardcoded ContactForm with `contextItem`, modify Hero CTA |
| `src/pages/pl/koszyk.astro` | Redirect to /kontakt/ |
| `src/pages/en/cart.astro` | Redirect to /contact/ |

### Layouts to Modify

| File | Change |
|---|---|
| `src/layouts/Layout.astro` | Add InquiryWidget, remove CartLink dependency |
| `src/layouts/Header.astro` | Remove CartLink, add badge logic to existing "Skontaktuj się" link |

### Components to Create

| File | Type | Notes |
|---|---|---|
| `src/components/global/ContactForm/InquiryForm.tsx` | Preact | Replaces `Form.tsx` — extended form with new fields, variants, inquiry items |
| `src/components/global/ContactForm/InquiryForm.module.scss` | Styles | Styles for the extended form |
| `src/components/global/InquiryWidget/InquiryWidget.tsx` | Preact | Sticky bottom-right widget |
| `src/components/global/InquiryWidget/InquiryWidget.module.scss` | Styles | |
| `src/components/global/EscapeHatch/EscapeHatch.astro` | Astro | "Nie wiesz od czego zacząć?" block |
| `src/components/global/HowItWorks/HowItWorks.astro` | Astro | 3-step process (page builder component for contact page) |
| `src/components/global/PopularItems/PopularItems.astro` | Astro | Featured activities/hotels (page builder component for contact page) |

No `InquiryFormSection` or `SocialProofFormWrapper` — everything is inside the evolved `ContactForm`.

### Utilities to Create/Modify

| File | Change |
|---|---|
| `src/utils/inquiry-store.ts` | New — localStorage management for inquiry items |
| `src/utils/cart.ts` | Delete (git history preserves it) |

### API Routes to Modify

| File | Change |
|---|---|
| `src/pages/api/contact.ts` | Extend to accept new fields |

### Sanity Schemas to Modify

| File | Change |
|---|---|
| `apps/sanity/schema/singleTypes/global.ts` | Add `inquiryFormDefaults` field group (paragraph, state, socialProof) |
| `apps/sanity/schema/singleTypes/Activities_Page.ts` | Add `formHeading`, `formParagraph`, `overrideFormState`, `formState`, escape hatch fields |
| `apps/sanity/schema/singleTypes/Hotels_Page.ts` | Add `formHeading`, `formParagraph`, `overrideFormState`, `formState`, escape hatch fields |
| `apps/sanity/schema/components/ContactForm.ts` | Add `showInquiries`, `socialProof` fields (evolve, don't replace) |
| `apps/sanity/schema/collectionTypes/Activities_Collection.ts` | Add form heading override |
| `apps/sanity/schema/collectionTypes/Hotels_Collection.ts` | Add form heading override |

---

## Appendix: Key Metrics to Track

After implementation, measure:

1. **Form submission rate** — % of visitors who submit any form (primary KPI)
2. **Form submission rate by page** — Which pages generate the most leads
3. **Inquiry items per submission** — Average number of activities/hotels attached
4. **Time to form** — How quickly users reach the form from landing
5. **Contact page conversion rate** — Before vs. after redesign
6. **Listing page bounce rate** — Before vs. after escape hatch addition
7. **Lead quality** — Does the new form provide enough context for Łukasz to prepare proposals efficiently

---

*Strategy created: February 13, 2026*
*Sources: PROJECT_OVERVIEW.md, Notion diagnosis (Feb 6, 2026), Notion specification (Feb 9, 2026), Meta Ads traffic analysis*
