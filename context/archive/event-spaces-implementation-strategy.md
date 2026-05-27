# Event Spaces Implementation Strategy

## Overview

This document defines the end-to-end implementation strategy for introducing a new website vertical for **Event Spaces** into the Fabryka Atrakcji platform.

The new vertical should represent **places for corporate events that are not hotels and are not activities themselves**. In practical terms, this includes spaces such as lofts, event venues, conference spaces, industrial venues, restaurants with private event areas, rooftops, and similar bookable spaces.

The primary business constraint is that this is a **budget-sensitive initiative**. The implementation must therefore:

- reuse as much of the existing `hotels` architecture as possible
- avoid creating a brand-new listing engine or a parallel custom interaction model
- preserve the overall UX patterns already proven on the site
- make the new vertical semantically correct without overengineering

The recommended strategy is to build Event Spaces as a **third content vertical**, parallel to `Hotels` and `Activities`, while using the existing `Hotels` architecture as the implementation base.

---

## Table of Contents

- [1. Business Goal](#1-business-goal)
- [2. Product Definition](#2-product-definition)
- [3. Naming and IA Recommendation](#3-naming-and-ia-recommendation)
- [4. Core Implementation Principle](#4-core-implementation-principle)
- [5. Current Architecture Summary](#5-current-architecture-summary)
- [6. Recommended Target Architecture](#6-recommended-target-architecture)
- [7. Scope Definition](#7-scope-definition)
- [8. Sanity CMS Strategy](#8-sanity-cms-strategy)
- [9. Astro Frontend Strategy](#9-astro-frontend-strategy)
- [10. Listing and Filtering Strategy](#10-listing-and-filtering-strategy)
- [11. Detail Page Strategy](#11-detail-page-strategy)
- [12. Inquiry and Conversion Flow](#12-inquiry-and-conversion-flow)
- [13. SEO and URL Strategy](#13-seo-and-url-strategy)
- [14. Search and Embeddings Strategy](#14-search-and-embeddings-strategy)
- [15. Analytics Strategy](#15-analytics-strategy)
- [16. Revalidation and Sitemap Updates](#16-revalidation-and-sitemap-updates)
- [17. Implementation Phases](#17-implementation-phases)
- [18. File-Level Implementation Map](#18-file-level-implementation-map)
- [19. Risks and Hidden Complexity](#19-risks-and-hidden-complexity)
- [20. Recommended MVP vs Phase 2](#20-recommended-mvp-vs-phase-2)
- [21. QA and Acceptance Checklist](#21-qa-and-acceptance-checklist)
- [22. Final Recommendation](#22-final-recommendation)

---

## 1. Business Goal

The client wants to expand the site with a new section that captures demand previously served by platforms like Venuu in Poland.

This new section should:

- target users looking for a **venue for a company event**
- cover places that are **not hotels**
- remain clearly separate from `activities`, because the offer is the **space**, not the entertainment program
- reuse the current site structure as much as possible to keep cost and implementation time under control

The goal is not to invent a new product model. The goal is to **extend the existing listing ecosystem** with a third vertical that matches user intent and market language.

---

## 2. Product Definition

For this project, **Event Spaces** means:

- event venues
- conference spaces
- industrial venues / lofts
- restaurants with private event areas
- rooftops / terraces with event rental
- private-use venues
- special venues without accommodation as the main product

This vertical does **not** represent:

- activities or team-building formats
- hotels marketed primarily through accommodation
- a full “event production service” as a separate catalog object

The object being listed is the **place**.

---

## 3. Naming and IA Recommendation

### Recommended User-Facing Label

For Polish user-facing navigation and page naming, the strongest recommendation is:

- **Przestrzenie eventowe**

Alternative acceptable SEO-supporting phrases:

- miejsca na eventy firmowe
- lokale eventowe
- sale konferencyjne
- obiekty eventowe

### Why this label

Polish market language is fragmented. There is no single perfect equivalent of the English word `venue`.

Research across venue operators and aggregators shows that:

- “przestrzeń eventowa” is strong as a brand/category label
- “lokal eventowy” appears often in commercial usage
- “sala konferencyjna” and “obiekt konferencyjny” are strong search-intent phrases
- “venue” is not a strong primary user-facing label in Polish

### Recommended IA

Top-level navigation label:

- `Przestrzenie eventowe`

Recommended URL structure:

- PL listing: `/pl/przestrzenie-eventowe/`
- EN listing: `/en/event-spaces/`

Recommended page-level H1 examples:

- `Przestrzenie eventowe na eventy firmowe`
- `Przestrzenie eventowe dla firm`
- `Miejsca na eventy firmowe w Polsce`

The navigation label should stay short. The H1 and metadata can carry the stronger SEO phrasing.

---

## 4. Core Implementation Principle

### Main Recommendation

Implement Event Spaces as a **new vertical cloned from Hotels**, not as:

- a variation of Activities
- an extension of Hotels inside the same collection
- a major generic multi-model listing refactor

### Why this is the correct tradeoff

#### Why not Activities

Activities are modeled around:

- categories
- activity types
- participants and duration
- the service/program itself

Event Spaces are fundamentally different. Users are selecting a place, not an activity product.

#### Why not merge into Hotels

Hotels are deeply hotel-specific in both schema and UI:

- stars
- rooms
- accommodation capacity
- per-person-per-night pricing language
- hotel-specific portable text blocks

Merging event spaces into the hotel collection would create semantic confusion in the CMS and the frontend.

#### Why not refactor everything into a generic engine first

That would be the cleanest long-term architecture, but it is not the best budget decision for this initiative.

The fastest, lowest-risk implementation path is:

- duplicate the hotels vertical
- rename and adjust where necessary
- only generalize code when the reuse is obvious and cheap

---

## 5. Current Architecture Summary

The current codebase already supports content verticals as separate stacks.

### Existing Hotels Vertical

Current implementation pattern:

- `Hotels_Page` singleton in Sanity for listing-level content and settings
- `Hotels_Collection` for detail documents
- Astro route wrappers for listing, filtered listing, paginated listing, and detail pages
- hotel-specific listing component
- hotel-specific detail template
- hotel-specific filters and embeddings integration

Relevant existing files include:

- `apps/sanity/schema/singleTypes/Hotels_Page.ts`
- `apps/sanity/schema/collectionTypes/Hotels_Collection.ts`
- `apps/astro/src/templates/hotels/HotelsPage.astro`
- `apps/astro/src/templates/hotels/SingleHotelPage.astro`
- `apps/astro/src/components/hotels/Listing.astro`
- `apps/astro/src/components/ui/HotelCard.astro`
- `apps/astro/src/utils/filters.ts`
- `apps/astro/src/pages/api/embeddings.ts`
- `apps/astro/src/utils/revalidation-map.ts`

### Existing Activities Vertical

Activities are more category-driven and less suitable as the base model.

The conclusion from the current architecture is clear:

- **Hotels provide the best structural template**
- **Activities should not be used as the main implementation baseline**

---

## 6. Recommended Target Architecture

The new vertical should mirror the hotel vertical structure:

### Sanity

- `EventSpaces_Page`
- `EventSpaces_Collection`

### Astro Templates

- `apps/astro/src/templates/event-spaces/EventSpacesPage.astro`
- `apps/astro/src/templates/event-spaces/SingleEventSpacePage.astro`

### Astro Routes

- `apps/astro/src/pages/pl/przestrzenie-eventowe/index.astro`
- `apps/astro/src/pages/pl/przestrzenie-eventowe/filtr.astro`
- `apps/astro/src/pages/pl/przestrzenie-eventowe/strona/[page].astro`
- `apps/astro/src/pages/pl/przestrzenie-eventowe/strona/[page]/filtr.astro`
- `apps/astro/src/pages/pl/przestrzenie-eventowe/[slug].astro`

- `apps/astro/src/pages/en/event-spaces/index.astro`
- `apps/astro/src/pages/en/event-spaces/filter.astro`
- `apps/astro/src/pages/en/event-spaces/page/[page].astro`
- `apps/astro/src/pages/en/event-spaces/page/[page]/filter.astro`
- `apps/astro/src/pages/en/event-spaces/[slug].astro`

### Components

- `apps/astro/src/components/event-spaces/Listing.astro`
- `apps/astro/src/components/ui/EventSpaceCard.astro`

This is the right balance between:

- architectural consistency
- limited implementation risk
- limited design work
- semantic correctness

---

## 7. Scope Definition

### In Scope for MVP

- a dedicated Event Spaces listing page
- dedicated Event Space detail pages
- a new Sanity collection and listing singleton
- route support in PL and EN
- reused listing/detail layout from Hotels
- updated card semantics
- updated listing filters appropriate for spaces
- updated inquiry support for a third item type
- updated revalidation and sitemap integration
- SEO-ready page structure

### Out of Scope for MVP

- a fully generic reusable “listing platform” abstraction for all verticals
- event-space categories with dedicated category landing pages
- advanced availability management
- venue-specific booking calendars
- a new complex pricing model with hourly/day/event permutations
- a fully custom event-space-only design system
- a redesigned universal search engine

### Optional but Deferrable

- embeddings search for Event Spaces
- venue subtype filtering
- advanced event layout fields
- structured “space configuration” matrices

---

## 8. Sanity CMS Strategy

## 8.1 New Document Types

Create:

- `EventSpaces_Page`
- `EventSpaces_Collection`

These should follow the same structural philosophy as the Hotels types.

### `EventSpaces_Page`

Purpose:

- listing page content
- top-level SEO
- listing hero copy
- checklist
- listing-level inquiry form configuration
- no-results content
- optional page-builder components

This should be a near-clone of `Hotels_Page`.

### `EventSpaces_Collection`

Purpose:

- individual event space records
- detail page content
- hero media
- structured venue fields
- detail page SEO
- detail-level inquiry overrides
- page-builder components

This should be a controlled clone of `Hotels_Collection`, but with hotel-specific fields replaced or removed.

## 8.2 Recommended Event Space Schema Fields

The Event Space schema should preserve the editorial ergonomics of Hotels while adapting the actual data model.

### Core Identity

- `language`
- `name`
- `slug`
- `title`
- `description`

### Media

- `mediaList`
- `imageList`

### Venue Metadata

- `location` reference
- `address`
- `googleMaps`
- `popularityIndex`

### Venue-Specific Structured Fields

- `venueType` or `spaceType`
- `areaM2`
- `numberOfSpaces` or `numberOfHalls` as an optional supporting field
- `maxPeople`
- `pricing`
- `amenities`

### Detail Content

- `content`
- `components`
- `formOverrides`
- `seo`

## 8.3 Field-Level Recommendations

### Replace `stars`

Remove hotel stars entirely from Event Spaces.

Do not try to reinterpret stars as quality tiers. That would create fake semantics.

### Replace `numberOfRooms`

Replace the hotel-first room metric with a venue-first size metric.

Primary replacement:

- `areaM2`

Label examples:

- `Area (m2)`
- `Usable area (m2)`
- `Event space area (m2)`

Why this is the better primary metric:

- buyers compare venues more naturally by size and capacity than by room count
- a single large hall may be more useful than several small rooms
- some venues are sold as one flexible event space, not as separate rooms
- `m2` works for lofts, restaurants, industrial venues, rooftops, and private-use spaces

Recommended supporting field:

- `numberOfSpaces`

Label examples:

- `Number of spaces`
- `Number of halls`
- `Number of event rooms`

Recommendation:

- use `areaM2` as the primary buyer-facing metric for cards and filters
- keep `numberOfSpaces` as optional supporting data for detail pages and selected venue types

### Replace `maxPeople.overnight`

Replace with a more venue-relevant structure:

```ts
maxPeople: {
  standing?: number
  seated?: number
  conference?: number
  banquet?: number
}
```

For MVP, if simplicity is preferred:

```ts
maxPeople: {
  main: number
}
```

The simplest practical version for the first release is:

- one required primary capacity field
- optional secondary format-specific capacities

### Pricing Recommendation

Do not model pricing exactly like hotels.

Recommended MVP pricing structure:

```ts
pricing: {
  pricingVisible: boolean
  displayMode: 'quoteOnly' | 'fromPrice'
  fromPrice?: number
  priceLabel?: string
}
```

Why:

- venue pricing is often not cleanly “per person / night”
- venue pricing is often per event, per day, per hour, or custom
- exposing the wrong pricing semantics damages trust

For the MVP, the safest strategy is:

- support “Price available on request”
- optionally support “From X PLN”

### Amenities

Keep a reference-based amenities model if possible, but review whether the current hotel amenities list is reusable.

There are two acceptable options:

#### Option A: Reuse `Amenities_Collection`

Best if the current amenities are generic enough.

#### Option B: Create `EventSpaceAmenities_Collection`

Best if hotel amenities are too accommodation-oriented.

MVP recommendation:

- audit current amenities
- reuse them only if they are neutral
- otherwise introduce a dedicated event-space amenities collection

### Venue Type

Add a subtype field to support future filtering and clearer content:

- loft
- conference space
- restaurant
- rooftop
- industrial venue
- private-use venue
- special venue

For MVP, this can exist in the CMS without being exposed in the frontend filters immediately.

## 8.4 Sanity Structure Integration

Update:

- `apps/sanity/structure/schema-types.ts`
- `apps/sanity/structure/index.tsx`
- `apps/sanity/structure/internal-linkable-types.ts`

This ensures:

- the new documents are registered
- they appear in Studio navigation
- they can be referenced by internal link pickers

## 8.5 Internationalization

Ensure both `EventSpaces_Page` and `EventSpaces_Collection` follow the same multilingual pattern as Hotels.

Slug prefixes should be:

- PL: `/pl/przestrzenie-eventowe/`
- EN: `/en/event-spaces/`

This must match:

- the Astro routes
- metadata fetching
- internal links
- sitemap generation
- revalidation rules

---

## 9. Astro Frontend Strategy

## 9.1 Route Structure

Create a route stack parallel to Hotels.

This is important because the current site clearly organizes verticals through dedicated routes and template ownership.

The Event Spaces routes should behave exactly like Hotels in terms of:

- listing page
- filtered listing page
- pagination
- detail page
- language handling

## 9.2 Template Strategy

Create:

- `EventSpacesPage.astro`
- `SingleEventSpacePage.astro`

These should begin as direct copies of the Hotels templates and then be adapted carefully.

### Reuse from HotelsPage

Reuse:

- pagination logic
- metadata logic
- breadcrumbs structure
- page-level inquiry form placement
- no-results component handling
- listing fetch structure

Adapt:

- query `_type`
- query field names
- route prefixes
- translations
- analytics labels
- filter payload

### Reuse from SingleHotelPage

Reuse:

- overall page composition
- breadcrumb pattern
- hero + content + sidebar layout
- contact form placement
- components rendering

Adapt:

- queried fields
- event-space-specific labels
- submit sidebar type
- analytics naming
- page context item type

## 9.3 Component Strategy

### Listing Component

Create:

- `components/event-spaces/Listing.astro`

This should begin as a clone of `components/hotels/Listing.astro`.

The reason to clone rather than over-generalize:

- current listing logic is deeply vertical-specific
- current labels are hardcoded
- current filters are tightly coupled to hotel schema

### Card Component

Create:

- `components/ui/EventSpaceCard.astro`

This should start from `HotelCard.astro` but remove hotel-specific semantics.

Recommended card fields:

- image
- name
- city / voivodeship
- capacity
- area in `m2`
- optional number of spaces
- price label or “Price available on request”
- CTA button

Do not keep:

- stars
- per person/night pricing copy
- accommodation capacity copy

---

## 10. Listing and Filtering Strategy

## 10.1 Guiding Principle

The listing must feel familiar to the current user and easy to implement, but it must not lie semantically.

### Keep the same mechanics

Keep:

- search bar
- sort dropdown
- sidebar / filter drawer pattern
- pagination structure
- no-results state
- listing card density and layout rhythm

For MVP, the search bar should remain intentionally simple:

- search by venue name only
- partial match on the `name` field
- no semantic search
- no embeddings-backed relevance layer

### Change the content logic

Replace hotel-only filters with venue-relevant filters.

## 10.2 Recommended MVP Filters

### Required for MVP

- location
- amenities
- area in `m2`
- max capacity

### Search Behavior for MVP

- name search only
- match against the venue `name`
- keep the implementation lightweight and deterministic
- do not introduce embeddings or fuzzy semantic intent matching in this phase

### Optional for MVP

- number of spaces
- venue type
- pricing presence / quote-only / from-price

### Remove from Hotels Filter Set

- stars
- number of rooms
- hotel-specific “budget per person/night” language

## 10.3 Filter Utility Strategy

Current `filters.ts` is shared but assumes only `activities` and `hotels`.

Recommended changes:

- extend the type system to support `eventSpaces`
- add event-space-specific filter parsing
- update path handling for filter URLs
- update sort helper typing where needed

### Important design decision

Do not force Event Spaces into `getHotelFilters`.

Instead:

- keep common shared helpers where convenient
- add a dedicated event-space filter builder

This is a better budget decision than trying to create a perfect abstract filter framework.

## 10.4 Sort Strategy

Recommended MVP sort options:

- popularity
- newest
- price ascending
- price descending

If pricing is mostly hidden in MVP, price sorting can remain technically supported but will have limited value.

If pricing is often quote-only, consider:

- keeping price sorts disabled for Event Spaces in MVP
- or only sorting on visible `fromPrice`

---

## 11. Detail Page Strategy

## 11.1 Page Composition

The Event Space detail page should follow the same macro-structure as the Hotel detail page:

1. breadcrumbs
2. hero with gallery/media
3. main content
4. sticky sidebar / CTA area
5. contextual contact form
6. optional page-builder blocks

This creates immediate implementation savings and consistent UX.

## 11.2 Hero and Main Content

The current hero layout can be reused almost directly.

Update only:

- labels
- meta descriptions
- structured data assumptions if any are hotel-oriented
- item type for inquiry / analytics

## 11.3 Sidebar Content

The current `SubmitSidebar` is hotel-oriented in data usage.

It can still be reused if adapted carefully.

Recommended Event Space sidebar content:

- headline CTA
- “from price” or quote-only indicator
- main capacity
- button to add to inquiry / send inquiry

If the current sidebar is too hotel-specific, create a clone:

- `SubmitSidebarEventSpace.astro`

This may actually be cheaper than trying to over-parameterize a hotel-first component.

## 11.4 Content Blocks

Portable text and page-builder components can mostly be reused.

However, review hotel-only content blocks such as:

- hotel amenities blocks
- staying rules
- hotel-specific location blocks if they contain hotel assumptions

For MVP:

- keep generic content blocks
- avoid exposing hotel-specific ones in the Event Space schema unless intentionally adapted

---

## 12. Inquiry and Conversion Flow

## 12.1 Existing Constraint

The current inquiry model already supports collecting items for contact, but the type system is hardcoded to:

- `integracja`
- `hotel`

Relevant current areas include:

- `apps/astro/src/utils/inquiry-store.ts`
- `apps/astro/src/components/offer/Hero.astro`
- detail page `contextItem`
- analytics event payloads

## 12.2 Required Change

Introduce a third inquiry item type:

- `eventSpace`

or

- `event_space`

Pick one convention and use it consistently across:

- client store
- component props
- analytics
- email payloads if relevant
- contact form context

### Recommendation

Use:

- frontend/internal item type: `eventSpace`
- human-facing label: `Event Space`

## 12.3 UX Recommendation

Do not create a separate inquiry flow for Event Spaces.

Reuse the same inquiry/contact system already used for Hotels and Activities.

This is important for:

- budget control
- conversion consistency
- lower QA scope

---

## 13. SEO and URL Strategy

## 13.1 URL Structure

Recommended:

- `/pl/przestrzenie-eventowe/`
- `/en/event-spaces/`

Avoid:

- mixing the new vertical under `/hotele/`
- using overly generic `/venues/` on PL
- creating category-first URLs in MVP

## 13.2 Metadata Strategy

The listing page should support:

- a clear commercial title
- commercial-intent description
- city-independent national positioning

Detail pages should focus on:

- venue name
- location
- corporate event intent

## 13.3 Internal Linking

Potential future internal links:

- from hotels pages: “Need a venue without accommodation?”
- from activities pages: “Looking for a place to host the event?”
- from blog and landing pages

This is useful, but not required for MVP.

## 13.4 Keyword Strategy

Primary cluster:

- przestrzenie eventowe
- miejsca na eventy firmowe
- lokale eventowe
- sale konferencyjne
- obiekty eventowe

Secondary cluster:

- [city] przestrzeń eventowa
- [city] sala konferencyjna
- miejsce na imprezę firmową
- loft eventowy
- wyjątkowe miejsce na event firmowy

The listing page and related content should support these variations in copy, not only in exact-match headings.

---

## 14. Search and Embeddings Strategy

## 14.1 Current Situation

The current `/api/embeddings` route only supports:

- `activities`
- `hotels`

It maps to:

- `ACTIVITIES_INDEX_NAME`
- `HOTELS_INDEX_NAME`

## 14.2 MVP Recommendation

For MVP, **skip embeddings entirely**.

The recommended search behavior is:

- search by venue name only
- partial match against the `name` field
- combine naturally with structured filters such as location, amenities, `m2`, and capacity

Why this is the right MVP decision:

- listings still work with structured filters
- name-based search is enough for the first release
- the user’s primary interaction will likely be browsing/filtering rather than natural-language search
- this avoids index setup, API changes, and extra maintenance cost
- this keeps the implementation predictable and budget-friendly

## 14.3 Final Recommendation

For MVP:

- **do not implement embeddings**
- **use a simple search by venue name only**

This is one of the cleanest places to save budget without damaging launch quality.

---

## 15. Analytics Strategy

## 15.1 Existing Situation

Hotels currently track events with hotel-specific semantics such as:

- `view_item`
- content type `hotel`
- list naming tied to hotels

## 15.2 Required Changes

Extend analytics to support Event Spaces:

- event space listing impressions
- event space detail views
- add-to-inquiry events
- contact form submissions originating from event space pages

## 15.3 Recommendation

Use the same analytics event pattern as Hotels, but update labels:

- list name: `Event Spaces Listing`
- content type: `event_space`
- item type: `eventSpace`

The exact naming should match the existing analytics taxonomy as closely as possible, while remaining semantically correct.

---

## 16. Revalidation and Sitemap Updates

## 16.1 Revalidation

Update:

- `apps/astro/src/utils/revalidation-map.ts`

Required additions:

- `EventSpaces_Collection`
- `EventSpaces_Page`

Ensure both listing URLs and detail page URLs are revalidated correctly.

## 16.2 Sitemap

Update the sitemap generation so that Event Spaces:

- listing pages appear
- paginated listing pages appear if applicable
- detail pages appear

If the Hotels static path generation is copied, Event Spaces should integrate naturally.

---

## 17. Implementation Phases

## Phase 1: Architecture Setup

Goal:

- establish the new vertical in the CMS and route structure

Tasks:

- create `EventSpaces_Page`
- create `EventSpaces_Collection`
- register schemas
- add Studio navigation entries
- add internal link support
- add route files in PL and EN
- create page and detail templates by cloning Hotels

Deliverable:

- Event Spaces vertical exists structurally but may still use placeholder or hotel-based semantics

## Phase 2: Frontend Adaptation

Goal:

- make the UI semantically correct for Event Spaces

Tasks:

- create `EventSpaceCard`
- create Event Spaces listing component
- remove hotel-only labels
- adapt translations
- adapt detail page fields
- adapt sidebar/inquiry buttons

Deliverable:

- fully navigable vertical with correct UX language and venue data presentation

## Phase 3: Inquiry and Analytics Integration

Goal:

- make Event Spaces participate fully in lead generation

Tasks:

- extend inquiry item types
- extend hero/inquiry buttons
- update contact context types
- update analytics labels and item types

Deliverable:

- Event Spaces can be added to inquiry and tracked properly

## Phase 4: Operational Readiness

Goal:

- make the vertical production-ready

Tasks:

- update sitemap
- update revalidation map
- verify metadata
- verify canonical handling
- verify PL/EN parity
- content-entry QA in Sanity

Deliverable:

- production-ready launch candidate

## Phase 5: Optional Enhancements

Goal:

- improve discoverability and taxonomy after launch

Possible tasks:

- add embeddings search
- add venue subtype filters
- add city landing pages
- add stronger editorial blocks linking spaces, hotels, and activities

---

## 18. File-Level Implementation Map

This section describes the likely files to create or modify.

## 18.1 New Sanity Files

- `apps/sanity/schema/singleTypes/EventSpaces_Page.ts`
- `apps/sanity/schema/collectionTypes/EventSpaces_Collection.ts`

Potentially also:

- `apps/sanity/schema/collectionTypes/EventSpaceAmenities_Collection.ts`

## 18.2 Sanity Files to Update

- `apps/sanity/structure/schema-types.ts`
- `apps/sanity/structure/index.tsx`
- `apps/sanity/structure/internal-linkable-types.ts`

Potentially:

- any i18n or schema grouping files if collection registration is centralized elsewhere

## 18.3 New Astro Route Files

- `apps/astro/src/pages/pl/przestrzenie-eventowe/index.astro`
- `apps/astro/src/pages/pl/przestrzenie-eventowe/filtr.astro`
- `apps/astro/src/pages/pl/przestrzenie-eventowe/strona/[page].astro`
- `apps/astro/src/pages/pl/przestrzenie-eventowe/strona/[page]/filtr.astro`
- `apps/astro/src/pages/pl/przestrzenie-eventowe/[slug].astro`

- `apps/astro/src/pages/en/event-spaces/index.astro`
- `apps/astro/src/pages/en/event-spaces/filter.astro`
- `apps/astro/src/pages/en/event-spaces/page/[page].astro`
- `apps/astro/src/pages/en/event-spaces/page/[page]/filter.astro`
- `apps/astro/src/pages/en/event-spaces/[slug].astro`

## 18.4 New Astro Templates

- `apps/astro/src/templates/event-spaces/EventSpacesPage.astro`
- `apps/astro/src/templates/event-spaces/SingleEventSpacePage.astro`

## 18.5 New Astro Components

- `apps/astro/src/components/event-spaces/Listing.astro`
- `apps/astro/src/components/ui/EventSpaceCard.astro`

Potentially:

- `apps/astro/src/components/offer/SubmitSidebarEventSpace.astro`

## 18.6 Existing Astro Files to Update

- `apps/astro/src/utils/filters.ts`
- `apps/astro/src/utils/inquiry-store.ts`
- `apps/astro/src/components/offer/Hero.astro`
- `apps/astro/src/pages/api/embeddings.ts` if embeddings are included
- `apps/astro/src/global/constants.ts` if embeddings are included
- `apps/astro/src/global/types.ts`
- `apps/astro/src/utils/revalidation-map.ts`
- `apps/astro/src/pages/sitemap-index.xml.ts`

Potentially:

- contact form context typing if it enforces vertical types
- analytics helpers if strongly typed

---

## 19. Risks and Hidden Complexity

## 19.1 Semantic Drift from Hotels

The biggest risk is copying Hotels too literally and launching Event Spaces that still talk like hotels.

Examples of bad drift:

- stars still visible
- “price per person/night”
- “max overnight guests”
- “check hotel” CTA copy

This would be technically fast but strategically weak.

## 19.2 Shared Utility Assumptions

Some shared utilities are not truly generic even if they are shared.

Examples:

- inquiry item types
- filter parsing
- path inference
- analytics labels

These need careful review rather than blind reuse.

## 19.3 Pricing Semantics

Venue pricing is structurally less standardized than hotel pricing.

Trying to force venue pricing into the hotel model may:

- confuse editors
- mislead users
- make sorting/filtering inconsistent

This is why quote-only or “from price” is the safest MVP path.

## 19.4 Amenities Reuse

If the current amenities collection is strongly hotel-oriented, reuse will cause bad CMS semantics.

This must be checked before implementation starts.

## 19.5 English Naming Consistency

The English vertical should remain clear and consistent:

- `event-spaces` is preferred
- avoid switching between `venues`, `spaces`, and `event venues` in technical architecture unless needed for copy

Pick one technical route slug and keep it stable.

---

## 20. Recommended MVP vs Phase 2

## MVP Recommendation

Build:

- new vertical
- reused hotels architecture
- venue-correct schema
- venue-correct cards and copy
- basic filters
- shared inquiry support
- SEO-ready listing and detail pages

Defer:

- embeddings
- venue subtype category pages
- rich pricing logic
- advanced subtype filtering

## Phase 2 Recommendation

After launch and validation, add:

- embeddings search for Event Spaces
- subtype filters
- city-level landing pages
- editorial recommendation blocks across Hotels / Activities / Event Spaces
- cross-sell logic between space + activity + hotel

---

## 21. QA and Acceptance Checklist

The feature should not be considered complete until all of the following are verified.

### CMS

- Event Spaces documents can be created in PL and EN
- slugs generate correctly with the right prefixes
- editors can fill all required fields without confusion
- no hotel-only labels remain in the Event Spaces Studio schema

### Listing

- PL and EN listing pages render correctly
- pagination works
- filter URLs work
- clearing filters returns to static listing URLs
- no hotel-specific copy remains
- no stars are rendered

### Detail Page

- hero gallery works
- capacity and pricing copy are correct
- sidebar CTA works
- contact form context is correct
- breadcrumbs are correct
- analytics fire correctly

### Inquiry

- Event Spaces can be added to inquiry
- mixed inquiry sets work with Activities and Hotels
- no type collisions occur

### SEO / Platform

- metadata resolves
- canonical URLs are correct
- sitemap contains Event Spaces
- revalidation works after content updates

### Content Quality

- cards read naturally for venue-type content
- content model supports real-world venue examples
- no core venue information is missing from the detail template

---

## 22. Final Recommendation

The right implementation strategy is:

- create Event Spaces as a **new vertical**
- build it as a **controlled clone of Hotels**
- adapt the schema and UI so the product is semantically a venue, not a hotel
- keep the launch intentionally lean
- avoid large-scale abstraction or new engines in this phase

This approach is the strongest combination of:

- low implementation cost
- low delivery risk
- semantic correctness
- strong editorial control
- future extensibility

If the vertical performs well, the next iteration can focus on:

- embeddings
- richer taxonomy
- deeper cross-linking with Hotels and Activities
- city and subtype SEO expansion

For the first release, however, the winning strategy is clear:

**duplicate the Hotels vertical, adapt it into Event Spaces carefully, and launch a clean, honest, conversion-ready venue section without overengineering.**
