# Filtering and Pagination Refactoring Plan

## 1. Introduction

### Background and Problem Statement

This document outlines a strategic refactoring of the filtering and pagination mechanisms for our hotel and activity listing pages. Currently, our site architecture faces a significant challenge related to performance, cost, and scalability.

The core of the problem lies in how we handle filtered views. Any time a user applies a filter (e.g., selecting a location for a hotel or searching for an activity), the page URL is appended with query parameters (e.g., `?location=mazowieckie`). While this is a common web pattern, in our Astro and Vercel setup, it forces the page to be rendered dynamically on the server for every unique combination of filters.

This dynamic rendering has two major negative consequences:

1.  **Bypassing ISR Caching:** Our most important and frequently visited listing pages (`/pl/hotele/`, `/pl/integracje/`, and their paginated versions) are intended to be served via Vercel's Incremental Static Regeneration (ISR). This provides near-instant load times and a great user experience. However, the moment a query parameter is added, Vercel's caching is bypassed, and we lose this performance benefit. Every filtered view becomes a "cache miss."
2.  **Excessive API Consumption:** Each dynamic render triggers a new set of API calls to our Sanity backend to fetch the filtered data. With many users applying various filters, this results in a high volume of API requests. This not only puts a heavy load on the CMS but also leads to significant increases in bandwidth consumption and operational costs, risking budget overruns.

### Proposed Solution and Rationale

To address these issues, we will implement a new URL structure that logically separates statically-generated, browsable content from dynamically-filtered views. The solution is to introduce a dedicated URL segment, `/filtr/`, which will act as an explicit signal that a page should be rendered dynamically.

**The core principle is:**

- **URLs without `/filtr/`** are considered static. They will be built at deploy time or regenerated via ISR. These are our primary landing pages that are fast, cacheable, and optimized for SEO.
- **URLs containing `/filtr/`** are considered dynamic. They will be excluded from ISR and rendered on-demand, allowing for the full flexibility of user-driven filtering.

This approach offers several key advantages:

- **Dramatic Cost Reduction:** By ensuring that the base listing pages (the vast majority of traffic) are served from Vercel's cache, we will drastically reduce the number of live requests hitting our Sanity backend.
- **Enhanced Performance & User Experience:** Visitors will experience significantly faster load times on the main listing pages, improving Core Web Vitals and overall site responsiveness.
- **Preserved Functionality:** We retain the powerful dynamic filtering capabilities that are essential for users, but we isolate them to a specific URL path, preventing them from impacting the performance of the core pages.
- **Strategic and Minimally Invasive:** This solution is surgically targeted at the problem. It avoids a large-scale, high-risk migration to a fully client-side rendered application by making intelligent, backend-focused changes that align with Astro's hybrid rendering model.

By implementing this plan, we aim to create a more robust, performant, and cost-effective platform without compromising on user features.

## 2. Proposed URL Structure

We will introduce a `filtr` path segment to denote a dynamically rendered, filtered page.

### Hotels (`/pl/hotele`)

| Use Case                 | Before                                      | After                                             | Rendering |
| ------------------------ | ------------------------------------------- | ------------------------------------------------- | --------- |
| **Base Listing**         | `/pl/hotele/`                               | `/pl/hotele/`                                     | ISR       |
| **Paginated Listing**    | `/pl/hotele/strona/2/`                      | `/pl/hotele/strona/2/`                            | ISR       |
| **Filtered Base**        | `/pl/hotele/?location=mazowieckie`          | `/pl/hotele/filtr/?location=mazowieckie`          | Dynamic   |
| **Filtered & Paginated** | `/pl/hotele/strona/2/?location=mazowieckie` | `/pl/hotele/strona/2/filtr/?location=mazowieckie` | Dynamic   |

### Activities (`/pl/integracje`)

| Use Case                          | Before                                                   | After                                                          | Rendering |
| --------------------------------- | -------------------------------------------------------- | -------------------------------------------------------------- | --------- |
| **Base Listing**                  | `/pl/integracje/`                                        | `/pl/integracje/`                                              | ISR       |
| **Paginated Base**                | `/pl/integracje/strona/2/`                               | `/pl/integracje/strona/2/`                                     | ISR       |
| **Filtered Base**                 | `/pl/integracje/?search=xyz`                             | `/pl/integracje/filtr/?search=xyz`                             | Dynamic   |
| **Filtered & Paginated Base**     | `/pl/integracje/strona/2/?search=xyz`                    | `/pl/integracje/strona/2/filtr/?search=xyz`                    | Dynamic   |
| **Category Listing**              | `/pl/integracje/kategoria/dla-grup/`                     | `/pl/integracje/kategoria/dla-grup/`                           | ISR       |
| **Paginated Category**            | `/pl/integracje/kategoria/dla-grup/strona/2/`            | `/pl/integracje/kategoria/dla-grup/strona/2/`                  | ISR       |
| **Filtered Category**             | `/pl/integracje/kategoria/dla-grup/?search=xyz`          | `/pl/integracje/kategoria/dla-grup/filtr/?search=xyz`          | Dynamic   |
| **Filtered & Paginated Category** | `/pl/integracje/kategoria/dla-grup/strona/2/?search=xyz` | `/pl/integracje/kategoria/dla-grup/strona/2/filtr/?search=xyz` | Dynamic   |

## 3. Implementation Steps

### Initial Scope: Hotels First

To validate this approach and minimize initial risk, we will implement this refactoring for the **Hotels section only** (`/pl/hotele`). Once we confirm that it works as expected and successfully reduces API load, we will proceed with the implementation for the Activities section.

### A. Astro Routing & Configuration

1.  **Adopt Dynamic Routes:**
    Instead of creating many `filtr.astro` files, we will use Astro's dynamic routing to handle all cases within a single page component for each section.

    - Rename `src/pages/pl/hotele/index.astro` -> `src/pages/pl/hotele/[[...slug]].astro`.
    - Rename `src/pages/pl/integracje/index.astro` -> `src/pages/pl/integracje/[[...slug]].astro`.
    - Rename `src/pages/pl/integracje/kategoria/[category].astro` -> `src/pages/pl/integracje/kategoria/[[...slug]].astro`
    - Inside these files, we will parse `Astro.params.slug` to determine the page type (base, paginated, filtered).

2.  **Update `astro.config.ts`:**
    Modify the `isr.exclude` array to target only URLs containing the `/filtr` segment, allowing base pages to be cached.

    ```javascript
    // Change from:
    exclude: [
      // ...
      /^\/pl\/hotele\/?$/,
      /^\/pl\/hotele\/strona/,
      /^\/pl\/integracje\/?$/,
      /^\/pl\/integracje\/kategoria/,
      /^\/pl\/integracje\/strona/,
    ],

    // Change to a single, simpler regex:
    exclude: [
      /^\/api\/.+/,
      /^\/pl\/koszyk/,
      /.*\/filtr.*/, // Exclude any URL containing "/filtr"
    ],
    ```

3.  **Update `vercel.json`:**
    Update the `rewrites` to ensure the new dynamic `filtr` paths are correctly rendered.
    ```json
    // Add new rules for 'filtr' paths
    "rewrites": [
        { "source": "/pl/hotele/filtr/", "destination": "/_render" },
        { "source": "/pl/hotele/strona/:page/filtr/", "destination": "/_render" },
        { "source": "/pl/integracje/filtr/", "destination": "/_render" },
        { "source": "/pl/integracje/strona/:page/filtr/", "destination": "/_render" },
        { "source": "/pl/integracje/kategoria/:category/filtr/", "destination": "/_render" },
        { "source": "/pl/integracje/kategoria/:category/strona/:page/filtr/", "destination": "/_render" },
        // ... keep existing non-filtered rewrites that are meant to be dynamic
    ]
    ```
    We must review existing rules to ensure they don't conflict. The goal is only ISR-exempted pages should be in `vercel.json`.

### B. Frontend Component Logic

1.  **Update Filter Forms:**

    - The forms used for filtering (in `Listing.astro` components) must be updated to submit to the new `/filtr/` URLs.
    - A small client-side script will be needed to dynamically change the form's `action` attribute based on the current page's path, appending `/filtr` before submitting.

2.  **Update `Pagination.astro` Component:**

    - Modify the `getPagePath` function within `src/components/ui/Pagination.astro`.
    - It needs to detect if the current page is a filtered view (i.e., if the URL contains `/filtr/`).
    - If it is, the generated pagination links must preserve the `/filtr/` segment to maintain the filtered state across pages. For example: `/pl/hotele/strona/2/filtr/`.

3.  **Update Pagination Links:**
    - The `getPaginationUrl()` helper function in the page templates must be made aware of the filtered state.
    - When on a filtered page (e.g., `/pl/hotele/filtr/`), pagination links must also include the `/filtr/` segment (e.g., `/pl/hotele/strona/2/filtr/`).

### C. Page Template Logic

1.  **Parse URL Slugs:**

    - The main logic in `[[...slug]].astro` files will need to parse the `slug` from `Astro.params` to understand the context:
      - Is it a paginated page? (`strona/X`)
      - Is it a filtered view? (`filtr` or `strona/X/filtr`)
      - What is the category? (for activities)
    - This logic will then pass the correct parameters to the `fetchData` function.

2.  **Update Breadcrumbs:**
    - The logic for generating breadcrumbs needs to be updated to ignore the `filtr` segment, so it doesn't appear as a part of the breadcrumb trail.

## 4. Validation & Testing

- **Verify Caching:** Use browser developer tools or Vercel's logs to confirm that base pages return `x-vercel-cache: HIT` and `/filtr/` pages return `x-vercel-cache: MISS`.
- **Functional Testing:** Thoroughly test all filtering and pagination scenarios across different browsers and devices.
- **Monitor Analytics:** Observe Sanity API usage from the dashboard after deployment to confirm a significant reduction in requests.
