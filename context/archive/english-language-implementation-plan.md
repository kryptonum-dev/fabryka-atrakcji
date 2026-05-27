### English Language Implementation Plan (Sanity + Astro)

Last updated: 2025-09-30

---

### Objectives

- Add English (EN) language support for the website.
- Keep Hotels, Activities, Case Studies, and Blog collections PL-only for now.
- Preserve current architecture, minimize JS, and avoid large refactors.

---

### Scope

- In scope (EN):
  - `Index_Page` (homepage)
  - `Pages_Collection` (static pages like About, Contact, etc.)
  - `PrivacyPolicy_Page`
  - `TermsAndConditions_Page`
  - `NotFound_Page`
  - `global`, `navbar`, `footer` (site config)
  - `Cart_Page`, `Quote_Page` (site config → cart/quote)
- Out of scope (EN routes for now):
  - `Activities_*`, `Hotels_*`, `CaseStudy_*`, `Blog*` collections (routes remain PL-only).
  - We will seed limited EN dummy content for collections (up to 10 items for Hotels, Activities, Blog) and a few EN FAQ items, but we will not add EN routes for these collections yet.

---

### Assumptions & Constraints

- Sanity Studio already uses `@sanity/document-internationalization` and splits content by `language` field.
- Astro pages fetch content with `language == $language` and use file-based routing under `/pl/…`.
- We will add just enough EN routing for static pages and keep dynamic collections PL-only.
- EN navigation on Header/Footer must not link to non-existent dynamic EN pages.

---

### Current Architecture (summary)

- Sanity
  - Internationalization is enabled via `documentInternationalization` with languages from `apps/sanity/structure/languages.tsx`.
  - Slugs are generated via `defineSlugForDocument` with either `slugs` or `prefixes` per language.
  - `Pages_Collection` uses prefixes `{ pl: '/pl/', en: '/en/' }`.
- Astro
  - Pages reside under `apps/astro/src/pages/pl/*` for PL.
  - `getLangFromPath` and `getLocaleFromPath` exist in `apps/astro/src/global/languages.ts`.
  - `Head.astro` builds SEO meta and `link rel="alternate"` using data from Sanity (`translation.metadata`).
  - `Layout.astro` uses a hard-coded `LOCALE` for `<html lang>` (needs to be dynamic by path).

---

## Stage 1 — Sanity (enable EN and seed content)

#### 1.1 Enable EN in Studio languages

- File: `apps/sanity/structure/languages.tsx`
  - Add EN to `LANGUAGES` array:
    - `{ id: 'en', title: 'English (EN)', flag: /* flag component */ }`
  - This will automatically:
    - Register EN for `@sanity/document-internationalization` (via `sanity.config.ts`)
    - Enable EN in `sanity-plugin-media-i18n`
    - Split desk structure lists per language

Notes:

- The `getLanguagePreview` helper already supports `'pl' | 'en'`.

#### 1.2 Verify/align slugs for static EN pages

- Already correct (no schema change needed):

  - `Index_Page` via `createPageSchema` (defaults include `/pl` and `/en`).
  - `Pages_Collection` uses prefixes `{ pl: '/pl/', en: '/en/' }`.
  - `PrivacyPolicy_Page` → EN: `/en/privacy-policy`.
  - `TermsAndConditions_Page` → EN: `/en/terms-and-conditions`.

- Update 404 schema to include EN:
  - File: `apps/sanity/schema/singleTypes/NotFound_Page.ts`
  - Add EN slug to `slugs`: e.g. `{ pl: '/pl/404', en: '/en/404' }`.

#### 1.3 Create and publish EN documents

- Singletons (create EN variants):

  - `Index_Page (en)`
  - `Activities_Page (en)`
  - `Hotels_Page (en)`
  - `Blog_Page (en)`
  - `PrivacyPolicy_Page (en)`
  - `TermsAndConditions_Page (en)`
  - `NotFound_Page (en)`
  - `global (en)`
  - `navbar (en)`
  - `footer (en)`
  - `Cart_Page (en)`
  - `Quote_Page (en)`

- `Pages_Collection (en)` for static pages (e.g., About, Contact):
  - Create entries with EN slugs under `/en/...`.
  - Populate components/SEO minimally to start.

#### 1.3.1 Seed dummy EN content (limited)

- `Faq_Collection (en)`

  - Add 3–5 dummy FAQ items to support testing of FAQ-rendering components.

- Duplicate up to 10 items from PL into EN for collections (content only, no EN routes yet):
  - `Hotels_Collection (en)`: copy up to 10 hotels from PL; set `language = 'en'`; generate EN slugs under `/en/hotels/...`; copy minimal fields (name, images, price basics) sufficient for previews.
  - `Activities_Collection (en)`: copy up to 10 activities from PL; set `language = 'en'`; generate EN slugs under `/en/activities/...`.
  - `BlogPost_Collection (en)`: copy up to 10 blog posts from PL; set `language = 'en'`; generate EN slugs under `/en/blog/...`; optionally link categories if available in EN.
  - Link translations PL↔EN for each duplicated item when possible.

Important:

- Keep these EN collection items as drafts (do not publish) to avoid inclusion in the sitemap and public 404s until EN routes for collections are implemented.
- Optionally set `seo.doNotIndex = true` on any published dummy static pages used for testing.

Content linking for SEO alternates:

- In Studio, open a PL document → link to EN counterpart via the translations UI.
- Do the same on the EN doc linking back to PL, so `translation.metadata` contains both.

Media & SEO:

- `global (en)` should have an OG image (can reuse the same asset for both languages).

#### 1.4 QA (Studio)

- EN documents exist, are published, and `slug.current` paths start with `/en/`.
- Translation links between PL and EN are set (PL↔EN pairs).
- `navbar (en)`, `footer (en)`, `Cart_Page (en)`, `Quote_Page (en)` filled appropriately or intentionally minimal.

---

## Stage 2 — Astro (routes, locale, SEO)

#### 2.1 Add EN routes for pages

Create files under `apps/astro/src/pages/en/`:

- `index.astro`

  - Copy of `pl/index.astro` with: `const data = await fetchData('', 'en')`.
  - If `!data`, rewrite to `/en/404`.

- `[slug].astro`

  - Copy of `pl/[slug].astro` with: `const data = await fetchData(Astro.params.slug || '', 'en')`.
  - If `!data`, rewrite to `/en/404`.

- `privacy-policy.astro`

  - Copy of `pl/polityka-prywatnosci.astro` with: `fetchData('PrivacyPolicy', 'en')`.

- `terms-and-conditions.astro`

  - Copy of `pl/regulamin.astro` with: `fetchData('TermsAndConditions', 'en')`.

- `cart.astro`
  - Copy of `pl/koszyk.astro` but set language to `'en'` for both Cart and Quote flows.
  - Behavior mirrors PL: if `quoteId` query param refers to a valid EN quote, render `QuotePage`; otherwise render `CartPage`.

#### 2.2 Make `<html lang>` and OG locale dynamic

- `apps/astro/src/layouts/Layout.astro`

  - Compute `lang` from `Astro.url.pathname` using `getLocaleFromPath`.
  - Set `<html lang={lang}>`.

- `apps/astro/src/layouts/Head.astro`

  - Derive locale from path or accept `alternates` and current path.
  - Map to OG locales (e.g., `pl` → `pl_PL`, `en` → `en_GB` or `en_US`).
  - Set `<meta property="og:locale" content={mappedLocale} />`.

- `apps/astro/src/global/languages.ts`
  - Optionally add:
    - `export const langPrefixes = { pl: '/pl/', en: '/en/' }` to unify usage.
    - `export const ogLocales = { pl: 'pl_PL', en: 'en_GB' }`.

#### 2.3 404 behavior for EN

- `apps/astro/src/pages/404.astro`
  - Use `getLangFromPath(Astro.url.pathname)` to pick `lang`.
  - Call `fetchData(lang)` from `templates/NotFoundPage.astro`.
  - This ensures `/en/*` renders EN 404 content.

#### 2.4 Header/Footer behavior on EN

- `apps/astro/src/layouts/Header.astro`

  - Avoid linking to EN dynamic collections (activities/hotels/case-studies) until implemented.
  - Minimal options:
    - Conditional render: if `lang === 'en'`, hide or reduce those nav items (keep Contact/Cart).
    - Better: drive visibility by `navbar (en)` data; if highlighted lists are empty, don’t render those sections.

- `apps/astro/src/layouts/Footer.astro`
  - Ensure EN links only point to existing EN static routes (privacy-policy, terms-and-conditions, contact, cart, etc.).

#### 2.5 Sitemap & SEO alternates

- `apps/astro/src/pages/sitemap-index.xml.ts`

  - All published EN slugs are returned via GROQ and will be included automatically.
  - Dynamic pagination remains PL-only; leave as-is.

- `apps/astro/src/utils/metadata.fetch.ts`
  - Already builds `alternates` from `translation.metadata`.
  - With PL↔EN linked in Sanity, `<link rel="alternate" hreflang="…">` will render in `Head.astro`.

#### 2.6 Newsletter, forms, and UI strings

- `apps/astro/src/global/languages.ts` has EN translations for form labels, terms/privacy links, etc.
- Verify those links match the EN slugs created in Stage 1.

---

## Implementation Checklist (step-by-step)

1. Sanity: enable EN

- [ ] Add EN to `apps/sanity/structure/languages.tsx` `LANGUAGES`.
- [ ] Restart Studio if needed.

2. Sanity: schema slugs

- [ ] Add EN slug mapping to `NotFound_Page`.
- [ ] Confirm `Index_Page`, `Pages_Collection`, `PrivacyPolicy_Page`, `TermsAndConditions_Page` already have EN slugs.

3. Sanity: content

- [ ] Create and publish EN: `Index_Page`, `PrivacyPolicy_Page`, `TermsAndConditions_Page`, `NotFound_Page`.
- [ ] Create and publish EN: `Activities_Page`, `Hotels_Page`, `Blog_Page`.
- [ ] Create and publish EN: `global`, `navbar`, `footer`.
- [ ] Create and publish EN: `Cart_Page`, `Quote_Page`.
- [ ] Create EN `Pages_Collection` entries for desired static pages (About, Contact, etc.).
- [ ] Link translations PL↔EN for alternates.
- [ ] Seed dummy EN content: add 3–5 `Faq_Collection` items; duplicate up to 10 PL items each for `Hotels_Collection`, `Activities_Collection`, and `BlogPost_Collection` into EN; keep as drafts and/or set `seo.doNotIndex`.

4. Astro: routes

- [ ] Add `/en/` `index.astro`, `[slug].astro`, `privacy-policy.astro`, `terms-and-conditions.astro`.
- [ ] Add `/en/cart/` `cart.astro` (Cart + Quote flow in EN).
- [ ] Keep dynamic collection routes PL-only.

5. Astro: locale & header/footer

- [ ] Make `<html lang>` dynamic in `Layout.astro`.
- [ ] Map OG locale in `Head.astro`.
- [ ] Optionally expose `langPrefixes` and `ogLocales` in `global/languages.ts`.
- [ ] Header: hide/limit dynamic sections for EN or drive from `navbar (en)`.
- [ ] Footer: ensure EN links target existing EN pages only.

6. QA

- [ ] `/en/` renders EN homepage; metadata ok; alternates include PL.
- [ ] `/en/privacy-policy/` and `/en/terms-and-conditions/` render.
- [ ] `/en/[static]/` renders for EN `Pages_Collection` items.
- [ ] Missing EN route (e.g., `/en/not-existing/`) shows EN 404.
- [ ] `<html lang>` and `og:locale` reflect page language.
- [ ] Header/Footer on EN have no links to non-existent dynamic EN sections.
- [ ] Sitemap includes EN static slugs only; no broken EN dynamic paths.

---

## Code Edit Plan (minimal, targeted)

Sanity

- `apps/sanity/structure/languages.tsx`:

  - Add EN to `LANGUAGES`.

- `apps/sanity/schema/singleTypes/NotFound_Page.ts`:
  - Add `en: '/en/404'` to `slugs` config.

Astro

- Create EN routes under `apps/astro/src/pages/en/`:

  - `index.astro`, `[slug].astro`, `privacy-policy.astro`, `terms-and-conditions.astro`.

- `apps/astro/src/layouts/Layout.astro`:

  - Replace hard-coded `LOCALE` with `getLocaleFromPath(Astro.url.pathname)` for `<html lang>`.

- `apps/astro/src/layouts/Head.astro`:

  - Compute OG locale from path or props; set `<meta property="og:locale" …>` accordingly.

- `apps/astro/src/pages/404.astro`:

  - Use `getLangFromPath(Astro.url.pathname)` and pass it to `fetchData`.

- `apps/astro/src/global/languages.ts` (optional):
  - `langPrefixes = { pl: '/pl/', en: '/en/' }`.
  - `ogLocales = { pl: 'pl_PL', en: 'en_GB' }`.

Header/Footer adjustments

- `apps/astro/src/layouts/Header.astro`:

  - If `language === 'en'`, hide activities/hotels/case-studies menus or drive by `navbar (en)` emptiness.

- `apps/astro/src/layouts/Footer.astro`:
  - Ensure EN link map matches existing EN routes.

---

## Acceptance Criteria

- Navigation

  - EN homepage available at `/en/`.
  - EN static pages render and return status 200.
  - Visiting non-existent EN path shows EN 404.
  - `/en/cart/` renders Cart or Quote (depending on `quoteId`) with EN content.

- SEO

  - `<html lang>` is `pl` or `en` based on path.
  - `<meta property="og:locale">` is `pl_PL` on PL pages, `en_GB` (or `en_US`) on EN pages.
  - `Head` renders `<link rel="alternate" hreflang="pl" …>` and `hreflang="en" …` where translations exist.

- Content integrity

  - EN `global`, `navbar`, and `footer` content renders without broken links.
  - No EN links to non-existent dynamic sections.
  - Dummy EN content exists for testing: 3–5 FAQs; up to 10 Hotels/Activities/Blog posts duplicated from PL (kept as drafts, not in sitemap).

- Sitemap
  - Includes PL routes (existing behavior) and any EN static slugs present in Sanity.
  - No EN dynamic pagination URLs generated.

---

## Rollout Strategy

1. Prepare EN content in Studio (drafts) → link translations → publish.
2. Ship Astro code changes behind a quick toggle (optional: hide EN entry points until content is ready).
3. Deploy preview → QA checklist (above) → fix issues.
4. Go live → monitor 404s and search console for hreflang.

---

## Risks & Mitigations

- Risk: Header links point to non-existent EN dynamic pages.

  - Mitigation: Conditional rendering on EN or data-driven visibility using `navbar (en)`.

- Risk: Missing translation links reduce hreflang coverage.

  - Mitigation: Enforce PL↔EN linking in Studio checklist.

- Risk: Inconsistent OG locale or `<html lang>`.

  - Mitigation: Centralize locale derivation from `Astro.url.pathname` and map OG locale once.

- Risk: Published EN collection items without EN routes may appear in sitemap and generate 404s.
  - Mitigation: Keep dummy EN collection items as drafts (unpublished) until EN routes for collections are added; optionally adjust sitemap to exclude EN for those types if needed.

---

## Post-Launch Tasks (Optional)

- Expand EN to selected collections when ready (define EN slugs + routes).
- Add language switcher component once both locales are broadly covered.
- Track EN traffic separately in analytics (if needed).

---

### Done right, this enables EN for static pages with clean SEO (hreflang), minimal code changes, and no impact on PL collections.
