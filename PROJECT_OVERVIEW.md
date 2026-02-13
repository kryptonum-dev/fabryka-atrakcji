# Fabryka Atrakcji - Project Overview

## Table of Contents

- [1. About the Project](#1-about-the-project)
- [2. Business Overview](#2-business-overview)
- [3. Architecture & Tech Stack](#3-architecture--tech-stack)
- [4. Monorepo Structure](#4-monorepo-structure)
- [5. Frontend (Astro)](#5-frontend-astro)
  - [5.1 Configuration](#51-configuration)
  - [5.2 Pages & Routing](#52-pages--routing)
  - [5.3 Layouts](#53-layouts)
  - [5.4 Components](#54-components)
  - [5.5 Styling (SCSS)](#55-styling-scss)
  - [5.6 Utilities](#56-utilities)
  - [5.7 TypeScript Types](#57-typescript-types)
- [6. Backend (Sanity CMS)](#6-backend-sanity-cms)
  - [6.1 Configuration](#61-configuration)
  - [6.2 Schema Overview](#62-schema-overview)
  - [6.3 Singleton Documents](#63-singleton-documents)
  - [6.4 Collection Documents](#64-collection-documents)
  - [6.5 Shared Object Types](#65-shared-object-types)
  - [6.6 Content Relationships](#66-content-relationships)
  - [6.7 Studio Customization](#67-studio-customization)
- [7. API Routes](#7-api-routes)
- [8. Internationalization (i18n)](#8-internationalization-i18n)
- [9. User Journey & Site Flow](#9-user-journey--site-flow)
- [10. Third-Party Integrations](#10-third-party-integrations)
- [11. Cart & Quote System](#11-cart--quote-system)
- [12. SEO & Performance](#12-seo--performance)
- [13. Deployment & CI/CD](#13-deployment--cicd)
- [14. Environment Variables](#14-environment-variables)
- [15. Key Features Summary](#15-key-features-summary)

---

## 1. About the Project

**Fabryka Atrakcji** ("Factory of Attractions") is a bilingual (Polish/English) B2B website for a corporate event agency. The platform enables corporate clients to browse team-building activities, hotels, and event services, and then generate custom pricing quotes through an interactive cart system.

The project is a **Turborepo monorepo** containing two applications:

- **`apps/astro`** - The frontend website built with Astro.js (SSR/ISR on Vercel)
- **`apps/sanity`** - The content management system built with Sanity Studio

---

## 2. Business Overview

### What the Business Offers

- **Corporate team-building activities** (workshops, integrations, events)
- **Hotel accommodations** for corporate groups (with gastronomy, conference rooms)
- **End-to-end event planning** with custom pricing, addons, and transport logistics
- **Case studies / portfolio** of past corporate events
- **Blog** with industry insights and team-building tips

### Target Audience

B2B corporate clients planning:

- Team-building events and integrations
- Corporate retreats and conferences
- Multi-day corporate stays (hotel + activities)

### Revenue Model

Lead generation through a quote request system. Clients build custom packages (activities + hotels + addons + transport) and submit quote requests with contact details.

---

## 3. Architecture & Tech Stack

### Core Technologies

| Layer           | Technology                                  |
| --------------- | ------------------------------------------- |
| Frontend        | **Astro.js 5.3** (SSR mode)                |
| UI Islands      | **Preact** (via `@astrojs/preact`, compat)  |
| Styling         | **SCSS** (scoped + CSS Modules for Preact)  |
| CMS             | **Sanity.io v3** (headless CMS)             |
| Language        | **TypeScript** (strict mode)                |
| Monorepo        | **Turborepo v2.4**                          |
| Package Manager | **Bun v1.2**                                |
| Hosting         | **Vercel** (ISR + SSR)                      |
| Forms           | **React Hook Form**                         |
| State           | **Nanostores** (`@nanostores/persistent`)   |
| Carousel        | **Embla Carousel** (React bindings)         |
| Maps            | **Leaflet** + **Google Maps Embed**         |
| PostCSS         | **Autoprefixer** + **cssnano**              |

### Key Architectural Decisions

- **Astro Islands Architecture**: Static-first with Preact hydration islands for interactive components
- **SSR with ISR**: Server-side rendering with Incremental Static Regeneration on Vercel
- **Preact over React**: React is aliased to `@preact/compat` to reduce bundle size
- **SCSS over CSS-in-JS**: Scoped styles in `.astro` files, CSS Modules for `.tsx` components
- **No external animation library**: All animations are custom CSS (keyframes, transitions)
- **Sanity as single source of truth**: All content, including navigation and global settings, managed in Sanity

---

## 4. Monorepo Structure

```
fabryka-atrakcji/
├── apps/
│   ├── astro/                    # Frontend website
│   │   ├── public/               # Static assets (robots.txt, fonts, icons)
│   │   ├── src/
│   │   │   ├── assets/           # Static assets (images, etc.)
│   │   │   ├── components/       # 50+ component library
│   │   │   │   ├── blog/         # Blog-specific components
│   │   │   │   ├── cart/         # Cart & quote form components
│   │   │   │   ├── caseStudy/    # Case study components
│   │   │   │   ├── cookie-consent/ # GDPR cookie consent
│   │   │   │   ├── global/       # Page-builder / reusable sections
│   │   │   │   ├── offer/        # Activity & hotel offer components
│   │   │   │   └── ui/           # UI primitives (buttons, inputs, cards, etc.)
│   │   │   ├── global/           # Global config, types, styles
│   │   │   │   ├── constants.ts  # App constants (theme, locale, Sanity config)
│   │   │   │   ├── global.scss   # Global styles, CSS variables, fonts
│   │   │   │   └── types.ts      # TypeScript interfaces
│   │   │   ├── layouts/          # Page layouts (main, landing, cart)
│   │   │   ├── pages/            # File-based routing (PL + EN)
│   │   │   │   ├── api/          # API endpoints
│   │   │   │   ├── pl/           # Polish pages
│   │   │   │   └── en/           # English pages
│   │   │   ├── templates/        # Page templates (data fetching layer)
│   │   │   └── utils/            # Utility functions (30+)
│   │   ├── astro.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── sanity/                   # Sanity CMS Studio
│       ├── schema/               # Content schemas
│       │   ├── collectionTypes/  # Collection document schemas
│       │   ├── singleTypes/      # Singleton document schemas
│       │   ├── Components/       # Page builder component schemas
│       │   └── ui/               # Shared schema types (seo, cta, etc.)
│       ├── structure/            # Desk structure configuration
│       ├── components/           # Custom Studio components
│       ├── constants.ts          # Sanity project constants
│       ├── sanity.config.ts
│       ├── sanity.cli.ts
│       └── package.json
│
├── ai/                           # AI-related documentation/plans
├── .cursor/                      # Cursor IDE rules
│   └── rules/
├── .github/
│   └── workflows/                # CI/CD (Sanity Studio deployment)
├── .env                          # Environment variables (gitignored)
├── turbo.json                    # Turborepo configuration
├── package.json                  # Root workspace config
├── bun.lock                      # Bun lockfile
└── .prettierrc.json              # Code formatting
```

---

## 5. Frontend (Astro)

### 5.1 Configuration

**Astro Config** (`apps/astro/astro.config.ts`):

- **Output**: `server` (SSR)
- **Adapter**: `@astrojs/vercel` with ISR
- **ISR exclusions**: `/api/*`, `/pl/koszyk/`, `/en/cart/`, any URL with `/filtr` or `/filter`
- **Image optimization**: Remote patterns for `cdn.sanity.io`
- **Prefetch**: Enabled for all links
- **Integration**: `@astrojs/preact` (compat mode)

**Path Aliases**:

- `@/src/*`, `@/global/*`, `@/components/*`, `@/utils/*`, `@/assets/*`, `@/templates/*`, `@/public/*`

### 5.2 Pages & Routing

The site has **60+ page routes** across two languages with identical structures.

#### Polish Routes (`/pl/`)

| Route                                                        | Purpose                                  |
| ------------------------------------------------------------ | ---------------------------------------- |
| `/pl/`                                                       | Homepage                                 |
| `/pl/[slug]`                                                 | Dynamic pages (Pages_Collection)         |
| `/pl/404`                                                    | 404 error page                           |
| `/pl/koszyk`                                                 | Shopping cart / quote builder             |
| `/pl/strona-podziekowania`                                   | Thank you page (post form submission)    |
| `/pl/regulamin`                                              | Terms and conditions                     |
| `/pl/polityka-prywatnosci`                                   | Privacy policy                           |
| **Blog**                                                     |                                          |
| `/pl/blog/`                                                  | Blog listing (page 1)                    |
| `/pl/blog/[slug]`                                            | Individual blog post                     |
| `/pl/blog/strona/[page]`                                     | Paginated blog listing                   |
| `/pl/blog/kategoria/[category]`                              | Blog category page                       |
| `/pl/blog/kategoria/[category]/strona/[page]`                | Paginated category listing               |
| **Activities (Integracje)**                                  |                                          |
| `/pl/integracje/`                                            | Activities listing (page 1)              |
| `/pl/integracje/[slug]`                                      | Individual activity page                 |
| `/pl/integracje/strona/[page]`                               | Paginated activities listing             |
| `/pl/integracje/kategoria/[category]`                        | Activity category page                   |
| `/pl/integracje/kategoria/[category]/strona/[page]`          | Paginated category listing               |
| `/pl/integracje/filtr`                                       | Filtered activities (search params)      |
| `/pl/integracje/kategoria/[category]/filtr`                  | Filtered category page                   |
| `/pl/integracje/strona/[page]/filtr`                         | Filtered paginated listing               |
| `/pl/integracje/kategoria/[category]/strona/[page]/filtr`    | Filtered paginated category listing      |
| **Hotels (Hotele)**                                          |                                          |
| `/pl/hotele/`                                                | Hotels listing (page 1)                  |
| `/pl/hotele/[slug]`                                          | Individual hotel page                    |
| `/pl/hotele/strona/[page]`                                   | Paginated hotels listing                 |
| `/pl/hotele/filtr`                                           | Filtered hotels page                     |
| `/pl/hotele/strona/[page]/filtr`                             | Filtered paginated hotels listing        |
| **Case Studies (Realizacje)**                                |                                          |
| `/pl/realizacje/`                                            | Case studies listing (page 1)            |
| `/pl/realizacje/[slug]`                                      | Individual case study page               |
| `/pl/realizacje/strona/[page]`                               | Paginated case studies listing           |
| `/pl/realizacje/kategoria/[category]`                        | Case study category page                 |
| `/pl/realizacje/kategoria/[category]/strona/[page]`          | Paginated category listing               |
| **Documents**                                                |                                          |
| `/pl/dokumenty/[filename]`                                   | PDF document serving (subscriber-gated)  |
| `/pl/dokumenty/oferta/[filename]`                            | Offer document serving                   |

#### English Routes (`/en/`)

Mirror structure of Polish routes with English slugs:

- `/en/activities/` (instead of `/pl/integracje/`)
- `/en/hotels/` (instead of `/pl/hotele/`)
- `/en/case-studies/` (instead of `/pl/realizacje/`)
- `/en/cart` (instead of `/pl/koszyk`)
- `/en/thank-you-page`, `/en/terms-and-conditions`, `/en/privacy-policy`

### 5.3 Layouts

| Layout                  | Usage                                              |
| ----------------------- | -------------------------------------------------- |
| `Layout.astro`          | Main layout (Header, Footer, Analytics, Cookies)   |
| `LandingLayout.astro`   | Landing pages (custom header, minimal footer)      |
| `QuoteCartLayout.astro` | Cart/quote pages (back link, container styling)     |
| `Header.astro`          | Main navigation with dropdowns                     |
| `LandingHeader.astro`   | Landing page header (custom nav links + CTA)       |
| `Footer.astro`          | Full site footer                                   |
| `Head.astro`            | SEO meta tags, structured data, hreflang           |
| `Breadcrumbs.astro`     | Breadcrumb navigation                              |

### 5.4 Components

The project has a **50+ component library** organized by domain.

#### UI Primitives (`components/ui/`)

| Component               | Type        | Description                                    |
| ------------------------ | ----------- | ---------------------------------------------- |
| `Accordion`              | Astro       | Expandable accordion with CSS animations        |
| `ActivityCard`           | Preact      | Activity card with pricing and CTA              |
| `AnimatedHeading`        | Astro       | Word-by-word fade-in heading                    |
| `ArrowButton`            | Preact      | Carousel navigation arrows                      |
| `BlogCard`               | Preact+Astro| Blog post card                                  |
| `BlogPostCard`           | Preact      | Blog post card variant                           |
| `Button`                 | Preact      | Button component with themes                     |
| `CartLink`               | Astro       | Cart icon with animated badge counter            |
| `CaseStudyCard`          | Astro       | Case study card                                  |
| `CategoryBlock`          | Astro       | Category display block                           |
| `CategoryTab`            | Astro       | Category tab navigation                          |
| `Checkbox`               | Preact      | Custom checkbox                                  |
| `DatePicker`             | Astro       | Date range picker with calendar popup            |
| `Dropdown`               | Astro       | Dropdown menu                                    |
| `Error`                  | Preact      | Error display component                          |
| `FaqForm`                | Preact+Astro| FAQ submission form                              |
| `FormState`              | Preact      | Form success/error state display                 |
| `HotelCard`              | Astro       | Hotel card display                               |
| `Image`                  | Astro       | Optimized responsive image wrapper               |
| `Input` / `Textarea`     | Preact      | Form inputs with validation                      |
| `LanguageSwitcher`       | Astro       | PL/EN language toggle                            |
| `Loader`                 | Preact      | Loading spinner                                  |
| `Pagination`             | Astro       | Page navigation controls                         |
| `PopupWindow`            | Astro       | Modal/popup container                            |
| `PortableText`           | Astro       | Sanity PortableText renderer                     |
| `PriceRangeDropdown`     | Astro       | Price filter dropdown                            |
| `PriceRangeFilter`       | Astro       | Price range slider filter                        |
| `RatingBox`              | Preact      | Star rating display                              |
| `RemoveConfirmation`     | Astro       | Confirmation dialog                              |
| `SearchBar`              | Astro       | Search input                                     |
| `SelectFilter`           | Astro       | Multi-select filter component                    |
| `Switch`                 | Preact      | Toggle switch                                    |
| `TableOfContent`         | Astro       | Auto-generated table of contents                 |
| `TestimonialsPopup`      | Preact+Astro| Testimonials modal                               |
| `Toast`                  | Astro       | Toast notification                               |

#### Content PortableText Components (`components/ui/content-pt/`)

Custom renderers for Sanity PortableText blocks:

- **Shared**: Block, BulletList, Checklist, Image, Normal, NumberedList
- **Offer-specific**: BlocksWithImage, Faq, FileView, ImageWithHeadingAndText, NextSteps, RowsWithIcons, Testimonials, Timeline
- **Hotel-specific**: Amenities, Location (Google Maps), StayingRules

#### Global/Page Builder Components (`components/global/`)

These are reusable page sections managed through Sanity's component array:

| Component                          | Description                                   |
| ---------------------------------- | --------------------------------------------- |
| `ActivitiesCarousel`               | Activities slider (Embla Carousel)             |
| `AsymmetricalPhotoGalleryGrid`     | Photo gallery grid layout                     |
| `BackgroundImageWithCenteredHeading`| Hero section variant                          |
| `BlockColumn`                      | Column layout block                           |
| `CardListWithCta`                  | Card grid with call-to-action                 |
| `CardSteps`                        | Animated step cards                           |
| `CaseStudyList`                    | Case study listing section                    |
| `ContactForm`                      | Contact form section                          |
| `Faq`                              | FAQ accordion section                         |
| `FeaturedHotelsList`               | Featured hotels display                       |
| `FloatingPointsList`               | Floating points list                          |
| `GradientBackgroundCta`            | CTA with gradient background                  |
| `HighlightedBlogPosts`             | Blog posts carousel                           |
| `ImagesMarqueeSection`             | Horizontal image marquee                      |
| `LargeImageWithGridList`           | Large image with grid layout                  |
| `ListImageProccessGrid`            | Process grid with images                      |
| `Newsletter`                       | Newsletter signup section                     |
| `StepsList`                        | Steps list section                            |
| `Testimonials`                     | Testimonials section                          |
| `TextBlocksGrid`                   | Text blocks grid layout                       |

#### Feature-Specific Components

- **Blog**: `Hero.astro`, `Quote.astro`, `Image.astro`, newsletter form
- **Cart**: Cart form, activity address form, quote request form
- **Case Study**: `ChallengeSolution.astro`, `Hero.astro`, `Testimonial.astro`
- **Cookie Consent**: Full GDPR-compliant consent management (`CookieConsent.astro` + `CookieConsent.client.tsx`)
- **Offer**: `AddonsPopup.astro`, `Hero.astro`, `SubmitSidebar.astro`

#### Hydration Strategy

| Directive       | Used For                                                            |
| --------------- | ------------------------------------------------------------------- |
| `client:load`   | Contact forms, carousels, cookie consent, quote page                |
| `client:idle`   | FAQ forms, newsletter forms, testimonials popup, cart address forms  |
| `client:visible`| Lazy-loaded viewport-dependent components                           |

### 5.5 Styling (SCSS)

#### Global CSS Variables

```scss
// Colors
--primary-200 through --primary-800
--neutral-100 through --neutral-500
--visited, --error, --success

// Typography (clamp-based responsive)
--body-s through --body-2xl
--heading-s through --heading-2xl

// Layout
--corner-radius-xs, -s, -m, -l
--easing: cubic-bezier(0.19, 1, 0.22, 1)
--page-margin: clamp(...)
```

#### Fonts

- **Neue Haas Unica** (400, 500, 700) - Body text
- **PF Grand Gothik** (760 weight, 150% stretch) - Headings (uppercase, line-height: 0.9)
- Font-display: `optional` / `swap`
- WOFF2 + WOFF formats with size-adjusted fallbacks

#### Styling Patterns

- Scoped `<style lang="scss">` in `.astro` components
- CSS Modules (`.module.scss`) for Preact components
- kebab-case class names
- `rem` units for everything except image sizes
- `max-width` media queries in `rem`
- `::before` / `::after` preferred over decorative divs
- `prefers-reduced-motion` respected in animations

### 5.6 Utilities

30+ utility functions in `src/utils/`:

| Utility                    | Purpose                                         |
| -------------------------- | ----------------------------------------------- |
| `sanity.fetch.ts`          | Sanity client setup and data fetching            |
| `optimize-images.ts`       | Image optimization (WebP, responsive srcsets)    |
| `cart.ts`                  | Cart rendering utilities                         |
| `track-event.ts`           | Analytics event tracking with consent            |
| `analytics-user-storage.ts`| Analytics user data persistence                  |
| `format-currency.ts`       | Currency formatting (PLN)                        |
| `format-date.ts`           | Date formatting                                  |
| `translate-date.ts`        | Date translation (PL/EN)                         |
| `filters.ts`               | Filter utilities for listing pages               |
| `fetch-page.ts`            | Page data fetching                               |
| `metadata.fetch.ts`        | SEO metadata fetching                            |
| `get-cookie.ts`            | Cookie reading                                   |
| `set-cookie.ts`            | Cookie writing                                   |
| `hash.ts`                  | SHA-256 hashing                                  |
| `slugify.ts`               | URL slug generation                              |
| `to-html.ts`               | PortableText to HTML conversion (server)         |
| `to-html-client.ts`        | PortableText to HTML conversion (client)         |
| `to-plain-text.ts`         | PortableText to plain text                       |
| `html-to-string.ts`        | HTML to text conversion                          |
| `image-to-inline-svg.ts`   | SVG inline conversion                            |
| `is-preview-deployment.ts` | Preview environment detection                    |
| `join-url.ts`              | URL joining                                      |
| `uuid.ts`                  | UUID generation                                  |
| `name-parser.ts`           | Name parsing                                     |
| `events.ts`                | Custom event dispatchers                         |
| `toast.ts`                 | Toast notification triggers                      |
| `get-estimated-reading-time.ts` | Blog reading time calculation               |
| `get-open-hours.ts`        | Business hours formatting                        |
| `get-participants-text.ts` | Participants count formatting                    |
| `get-relative-date.ts`     | Relative date formatting                         |

### 5.7 TypeScript Types

Key interfaces in `src/global/types.ts`:

- `FormStateTypes` - Form success/error states
- `BaseHotelProps` - Hotel data structure
- `BaseActivityProps` - Activity data structure
- `AddonProps` - Addon configuration
- `AddonItem` - Individual addon item
- `ExtraItem` - Extra item structure
- `Alert` - Alert/notification structure
- `ExtendedHotelData` - Hotel with cart-specific data
- `ExtendedActivityData` - Activity with cart-specific data

Auto-generated types from Sanity schemas via `sanity-typegen` output to `apps/astro/sanity.types.ts`.

---

## 6. Backend (Sanity CMS)

### 6.1 Configuration

| Setting        | Value                        |
| -------------- | ---------------------------- |
| Project ID     | `fn3a7ltg`                   |
| Dataset        | `production`                 |
| API Version    | `2024-03-05` (Studio), `2024-10-15` (Astro) |
| Studio Host    | `fabryka-atrakcji`           |
| CDN            | Disabled                     |

**Plugins**:

- `structureTool` - Custom desk structure
- `media` (sanity-plugin-media-i18n) - Media management with i18n
- `visionTool` - GROQ query tester
- `documentInternationalization` - PL/EN support
- `embeddingsIndexDashboard` - Semantic search (dev only)
- `assist` - AI translation assistance
- `orderable-document-list` - Drag-and-drop ordering

### 6.2 Schema Overview

The CMS manages **15 singleton types** and **17 collection types**.

### 6.3 Singleton Documents

| Type                      | Purpose                                      |
| ------------------------- | -------------------------------------------- |
| `Index_Page`              | Homepage content                             |
| `Activities_Page`         | Activities listing page                      |
| `Blog_Page`               | Blog listing page                            |
| `CaseStudy_Page`          | Case studies listing page                    |
| `Hotels_Page`             | Hotels listing page                          |
| `Cart_Page`               | Shopping cart page (transport, addons config) |
| `Quote_Page`              | Quote request page                           |
| `ThankYouPage`            | Thank you page after submission              |
| `NotFound_Page`           | 404 error page                               |
| `TermsAndConditions_Page` | Legal terms                                  |
| `PrivacyPolicy_Page`      | Privacy policy                               |
| `global`                  | Global settings (contact, analytics, SEO, org schema) |
| `navbar`                  | Navigation configuration                     |
| `footer`                  | Footer configuration                         |
| `redirects`               | URL redirects management                     |

**`global` document details**:

- Contact info (email, phone, open hours)
- Newsletter PDF and MailerLite group IDs
- Analytics IDs (GA4, Google Ads, Meta Pixel, Meta Conversion API)
- Google review data (rating, count)
- Social share image
- Organization schema (name, description, address, VAT, REGON, founder, etc.)
- Contact form recipients

**`Cart_Page` document details**:

- Transport options (base price, max km, price/km, max people/bus)
- Addons list with images and pricing
- Cart states (empty, error)

### 6.4 Collection Documents

#### Activities (`Activities_Collection`)

The core offering. Fields organized in groups: general, details, pricing, addons, alerts, content, seo.

- **General**: name, slug, title (Heading), description (min 75 chars), media list (images + YouTube)
- **Categorization**: categories (refs), activity types (refs), languages (pl/en/de)
- **Participants**: min/max count
- **Duration**: full day or specific hours
- **Location**: nationwide flag, address (street/postal/city/voivodeship), Google Maps link, indoor/outdoor
- **Pricing**: base price (netto PLN), max participants, additional person price
- **Addons**: configurable addon system with multiple pricing models (fixed, per_unit, threshold, individual)
- **Alerts**: cart/quote alert messages
- **Content**: PortableText with custom components
- **Components**: page builder sections
- **Popularity index**: 0-100 score for sorting

#### Hotels (`Hotels_Collection`)

Groups: general, details, pricing, addons, gastronomy, alerts, content, seo.

- **General**: name, slug, title, description, media list
- **Details**: amenities (refs), location (ref), stars (1-5), rooms count, max people (overnight/conference/banquet)
- **Address**: street, postal code, city, voivodeship, Google Maps link + embed
- **Pricing**: visible flag, fixed group price or per-person price (netto PLN)
- **Addons**: same configurable system as activities
- **Gastronomy**: lunch levels, supper levels, open bar, coffee break, grill (each with pricing)
- **Alerts**: alert messages
- **Content**: PortableText with hotel-specific components (amenities, location map, staying rules)

#### Blog (`BlogPost_Collection`)

- name, slug, title, description, category (ref), author (ref), image, content (PortableText), components, seo

#### Case Studies (`CaseStudy_Collection`)

- name, slug, title, category (ref), primary/secondary images, duration (days), localization (city)
- services (1-5 strings), gallery (5-9 media items), challenge/solution/results (PortableText)
- testimonial (name, position, company, logo, photo, content)

#### Quotes (`Quotes_Collection`)

Read-only, system-generated documents for submitted quotes:

- quoteId, createdAt, language, participantCount
- selectedDates (array of start/end date ranges)
- items (array of quoteItem objects with hotels, activities, transport, extras, pricing)

#### Supporting Collections

| Type                            | Purpose                              |
| ------------------------------- | ------------------------------------ |
| `ActivitiesCategory_Collection` | Activity categories (orderable)      |
| `ActivitiesType_Collection`     | Activity types (indoor/outdoor)      |
| `Locations_Collection`          | Hotel locations (for filtering)      |
| `Amenities_Collection`          | Hotel amenities (for filtering)      |
| `BlogCategory_Collection`       | Blog categories                      |
| `Author_Collection`             | Blog authors (with bio)              |
| `CaseStudyCategory_Collection`  | Case study categories                |
| `Pages_Collection`              | Generic CMS pages                    |
| `LandingPage_Collection`        | Landing pages (custom nav + CTA)     |
| `Faq_Collection`                | FAQ items (question + answer)        |
| `Testimonial_Collection`        | Customer testimonials                |
| `SocialMedia_Collection`        | Social media links                   |

### 6.5 Shared Object Types

| Type           | Description                                              |
| -------------- | -------------------------------------------------------- |
| `seo`          | Title (max 70), description (110-160), image, doNotIndex |
| `PortableText` | Rich text editor (H2, H3, lists, bold, emphasis, links)  |
| `Heading`      | PortableText variant for headings                         |
| `cta`          | Call-to-action (text + link reference)                    |
| `components`   | Page builder array (20 component types)                   |
| `addons`       | Reusable addon system (pricing models, layouts, images)   |
| `alerts`       | Reusable alert configuration                              |

### 6.6 Content Relationships

```
Activities_Collection ──→ ActivitiesCategory_Collection (many-to-many)
Activities_Collection ──→ ActivitiesType_Collection (many-to-many)

Hotels_Collection ──→ Locations_Collection (many-to-one)
Hotels_Collection ──→ Amenities_Collection (many-to-many)

BlogPost_Collection ──→ BlogCategory_Collection (many-to-one)
BlogPost_Collection ──→ Author_Collection (many-to-one)

CaseStudy_Collection ──→ CaseStudyCategory_Collection (many-to-one)

navbar ──→ ActivitiesCategory_Collection (highlighted, 2-4)
navbar ──→ CaseStudy_Collection (highlighted, 2-4)

footer ──→ ActivitiesCategory_Collection (highlighted, 3-8)
footer ──→ Internal linkable types (other links, 2-6)
footer ──→ SocialMedia_Collection (social links)
```

**Internal Linkable Types** (used in links/references throughout):

- Pages_Collection, LandingPage_Collection
- Activities_Collection, Hotels_Collection, CaseStudy_Collection
- BlogPost_Collection, ActivitiesCategory_Collection
- CaseStudyCategory_Collection, BlogCategory_Collection

### 6.7 Studio Customization

**Desk Structure** (organized sections):

1. Index Page
2. Pages & Landing Pages
3. Integracje (Activities) - categories, types, activities
4. Hotele (Hotels) - locations, amenities, hotels
5. Realizacje (Case Studies) - categories, case studies
6. Wyceny (Quotes) - read-only quote documents
7. Blog - categories, authors, posts
8. Testimonials & FAQ
9. Konfiguracja strony (Site Config) - global, navbar, footer, redirects, social media, legal pages

**Custom Studio Components**:

- `StarRating` - Hotel star rating input
- `PricingSummaryView` - Quote pricing breakdown view
- `CustomInput` - Enhanced PortableText input
- `Preview` - Document preview

**Document Actions**:

- Singletons: publish, discardChanges, restore only
- Quotes: delete, restore only (read-only)
- Social media: no create option (managed through Studio structure)

---

## 7. API Routes

| Endpoint                     | Method   | Purpose                                          |
| ---------------------------- | -------- | ------------------------------------------------ |
| `/api/contact`               | POST     | Contact form submission (Resend email + Google Sheets) |
| `/api/newsletter`            | POST     | Newsletter subscription (MailerLite)             |
| `/api/quotes`                | POST/GET | Quote creation and retrieval                     |
| `/api/initialQuote`          | POST     | Initial quote generation                         |
| `/api/cart/activity`         | GET      | Fetch activity data for cart                     |
| `/api/cart/hotel`            | GET      | Fetch hotel data for cart                        |
| `/api/embeddings`            | GET/POST | Semantic search via Sanity embeddings            |
| `/api/analytics/meta`        | POST     | Meta Pixel / Conversion API events               |
| `/api/s3d`                   | GET      | 3D model serving                                 |

---

## 8. Internationalization (i18n)

- **Languages**: Polish (`pl`) and English (`en`)
- **URL structure**: Language prefix in all routes (`/pl/...`, `/en/...`)
- **Content**: All Sanity documents support i18n via `@sanity/document-internationalization`
- **Language field**: Auto-managed, hidden in Studio
- **Slug prefixes**: Auto-generated with language prefix
- **Frontend**: Language detected from URL path, language switcher in header
- **hreflang tags**: Alternate language links in `<head>`

---

## 9. User Journey & Site Flow

### Primary Journey (Quote Request)

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  Homepage    │────→│  Browse      │────→│  View Details   │
│  (Landing)   │     │  Activities/ │     │  Activity/Hotel  │
│              │     │  Hotels      │     │  Page            │
└─────────────┘     └──────────────┘     └────────┬────────┘
                                                   │
                                         ┌─────────▼────────┐
                                         │  Add to Cart     │
                                         │  (Configure:     │
                                         │   participants,  │
                                         │   dates, addons) │
                                         └─────────┬────────┘
                                                   │
                                         ┌─────────▼────────┐
                                         │  Cart Page       │
                                         │  (Review items,  │
                                         │   transport,     │
                                         │   extras)        │
                                         └─────────┬────────┘
                                                   │
                                         ┌─────────▼────────┐
                                         │  Quote Form      │
                                         │  (Contact info,  │
                                         │   dates, notes)  │
                                         └─────────┬────────┘
                                                   │
                                         ┌─────────▼────────┐
                                         │  Thank You Page  │
                                         │  (Confirmation)  │
                                         └──────────────────┘
```

### Secondary Journeys

- **Blog Journey**: Homepage → Blog → Article → Category → Newsletter Signup
- **Case Study Journey**: Homepage → Case Studies → Individual Case Study → Contact
- **Contact Journey**: Any Page → Contact Form → Thank You
- **Landing Page Journey**: Ad/External Link → Landing Page → CTA → Activity/Hotel/Contact
- **Document Access**: Blog/Newsletter → Subscriber Validation → PDF Download

### Filtering & Search

- Activities: Filter by category, type, location, price range, participants, indoor/outdoor
- Hotels: Filter by location, amenities, price range, stars
- Blog: Filter by category
- Case Studies: Filter by category
- Semantic search powered by Sanity embeddings (activities and hotels)

---

## 10. Third-Party Integrations

### Analytics

| Service           | Purpose                                    |
| ----------------- | ------------------------------------------ |
| Google Analytics 4| Page views, events, conversions            |
| Google Ads        | Conversion tracking                        |
| Meta Pixel        | Facebook/Instagram conversion tracking     |
| Meta Conversion API| Server-side conversion tracking            |

### Email Services

| Service    | Purpose                                        |
| ---------- | ---------------------------------------------- |
| Resend     | Transactional emails (contact form, quotes)    |
| MailerLite | Newsletter subscriptions, group management     |

### Maps

| Service          | Purpose                              |
| ---------------- | ------------------------------------ |
| Google Maps      | Embedded maps, directions            |
| Leaflet          | Interactive map selection (cart)     |
| OpenStreetMap    | Geocoding via Nominatim API          |

### Other

| Service            | Purpose                                |
| ------------------ | -------------------------------------- |
| Sanity.io          | Headless CMS                           |
| Sanity Embeddings  | Semantic search (activities, hotels)   |
| Google Sheets API  | Lead storage (forms, quotes)           |
| BotID              | Bot detection on forms                 |
| Vercel             | Hosting, ISR, serverless functions     |

---

## 11. Cart & Quote System

The cart is a core business feature enabling clients to build custom event packages.

### Cart Architecture

- **State management**: Nanostores with `@nanostores/persistent` (LocalStorage)
- **Items**: Hotels and activities with independent configurations
- **Per-item configuration**: Participants count, date ranges, selected addons
- **Transport**: Optional bus transport with distance-based pricing
- **Extras**: Additional services (from Cart_Page CMS config)

### Pricing Model

- **Activities**: Base price + additional person price (netto PLN)
- **Hotels**: Fixed group price OR per-person price (netto PLN)
- **Addons**: Multiple pricing models:
  - `fixed` - Flat fee
  - `per_unit` - Price per person
  - `threshold` - Tiered pricing
  - `individual` - Custom quote
- **Transport**: Base price + per-km rate, max people per bus
- **Gastronomy** (hotels): Lunch/supper levels, open bar, coffee break, grill

### Quote Submission Flow

1. Client builds cart (activities + hotels + addons)
2. Fills quote form (contact details, dates, notes)
3. API creates `Quotes_Collection` document in Sanity
4. Confirmation emails sent via Resend
5. Lead data stored in Google Sheets
6. Quote recipients (configurable in CMS) receive notification
7. Client redirected to Thank You page

---

## 12. SEO & Performance

### SEO

- **Sitemap**: Dynamic generation via `sitemap-index.xml.ts`
- **Robots.txt**: Blocks abusive crawlers, disallows filter pages
- **Meta tags**: Title (max 70), description (110-160), social share image per page
- **Structured data**: Organization schema (JSON-LD)
- **hreflang**: Language alternates for PL/EN
- **Canonical URLs**: Auto-generated
- **doNotIndex**: Per-page toggle in CMS

### Performance

- **ISR**: Incremental Static Regeneration on Vercel (except API, cart, filter pages)
- **Image optimization**: WebP conversion, responsive srcsets (48-2560px widths), LQIP placeholders
- **Prefetching**: Enabled for all links
- **Preact**: Smaller runtime than React (~3KB vs ~40KB)
- **Islands architecture**: Minimal client-side JS, hydration only where needed
- **CSS optimization**: PostCSS with cssnano, autoprefixer
- **Font optimization**: `font-display: optional/swap`, size-adjusted fallbacks
- **Lazy loading**: Images (except priority), viewport-based hydration
- **No animation library**: All CSS-based animations (lighter than JS libraries)

---

## 13. Deployment & CI/CD

### Vercel (Frontend)

- **SSR + ISR**: Server-side rendering with incremental static regeneration
- **Bypass token**: `VERCEL_DEPLOYMENT_ID` for ISR cache invalidation
- **Bot protection**: Rewrites in `vercel.json` for bot detection
- **Filter pages**: Rewritten to `/_render` endpoint
- **Preview**: `dev` branch deployed to preview URL

### GitHub Actions (Sanity Studio)

- **Trigger**: Push to `main` or `dev` branches (paths: `apps/sanity/**`)
- **Steps**: Checkout → Node.js 20 → Bun → `bun install && bun run sanity deploy`
- **Secrets**: `SANITY_DEPLOY_STUDIO_TOKEN`, `SANITY_STUDIO_PREVIEW_DOMAIN`

### Environments

| Environment | URL                                                            |
| ----------- | -------------------------------------------------------------- |
| Production  | `https://www.fabryka-atrakcji.com/`                            |
| Preview     | `https://fabryka-atrakcji-git-dev-kryptonum.vercel.app`        |
| Studio      | `https://fabryka-atrakcji.sanity.studio`                       |

---

## 14. Environment Variables

| Variable                          | Purpose                                    |
| --------------------------------- | ------------------------------------------ |
| `SANITY_PROJECT_ID`               | Sanity project identifier                  |
| `SANITY_API_TOKEN`                | Sanity API read token                      |
| `SANITY_STUDIO_PREVIEW_DOMAIN`    | Preview deployment URL                     |
| `RESEND_API_KEY`                  | Resend email service API key               |
| `MAILERLITE_API_KEY`              | MailerLite newsletter API key              |
| `EMBEDDINGS_INDEX_BEARER_TOKEN`   | Sanity embeddings search token             |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL`    | Google Sheets service account              |
| `GOOGLE_PRIVATE_KEY`              | Google Sheets private key                  |
| `GOOGLE_SHEET_ID`                 | Target Google Sheet ID                     |
| `GOOGLE_SHEET_NAME`              | Sheet name (optional, defaults to Sheet1)   |
| `VERCEL_DEPLOYMENT_ID`            | Vercel ISR bypass token                    |

---

## 15. Key Features Summary

| Feature                    | Implementation                                |
| -------------------------- | --------------------------------------------- |
| **50+ component library**  | Astro + Preact islands                        |
| **Bilingual (PL/EN)**      | Sanity i18n + URL-based routing               |
| **Interactive cart/quotes** | Nanostores + Preact + API routes             |
| **Server-side filtering**  | SSR filter pages with Sanity GROQ queries     |
| **Semantic search**        | Sanity embeddings API                         |
| **Page builder**           | 20 reusable CMS-managed sections              |
| **Blog with pagination**   | Categories, authors, reading time             |
| **Case study portfolio**   | Gallery, testimonials, challenge/solution      |
| **GDPR cookie consent**    | Custom implementation with consent mode API   |
| **Analytics**              | GA4, Google Ads, Meta Pixel, Meta CAPI        |
| **Lead capture**           | Contact form, quote form → email + sheets     |
| **PDF document serving**   | Subscriber-gated file access                  |
| **Bot protection**         | BotID on forms, Vercel bot rewrites           |
| **Image optimization**     | WebP, responsive srcsets, LQIP, lazy loading  |
| **ISR + SSR**              | Vercel incremental static regeneration        |
| **Custom pricing engine**  | Activities, hotels, addons, transport, gastronomy |
| **Maps integration**       | Leaflet + Google Maps for locations           |
| **Accessibility**          | WCAG2, ARIA labels, keyboard navigation       |
| **Type safety**            | TypeScript strict + Sanity typegen            |

---

*Generated: February 13, 2026*
