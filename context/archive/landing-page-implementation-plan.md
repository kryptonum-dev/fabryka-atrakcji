# Landing Page Collection Implementation Plan

## Overview
Create a dedicated landing page collection in Sanity with custom header/footer layouts in Astro, separate from the main site structure. Landing pages will be accessible directly at `/{lang}/` paths (e.g., `/pl/`, `/en/`) and will feature simplified navigation and focused conversion elements.

ó## ✅ Completed Tasks

### Phase 1: Sanity Setup (Backend) - COMPLETED

#### 1. LandingPage_Collection Schema ✅
- ✅ Created `apps/sanity/schema/collectionTypes/LandingPage_Collection.ts`
- ✅ Defined fields: language, slug, navigationLinks, cta, components, seo
- ✅ Added field validations (navigationLinks: min 1, max 6)
- ✅ Configured preview display with Rocket icon
- ✅ All labels translated to Polish ("Strony lądowania")
- ✅ Added to `apps/sanity/structure/schema-types.ts`

#### 2. Structure Navigation ✅
- ✅ Added LandingPage_Collection to `apps/sanity/structure/index.tsx`
- ✅ Positioned below Pages_Collection in navigation menu

#### 3. Internal Link Types ✅
- ✅ Added LandingPage_Collection to `apps/sanity/structure/internal-linkable-types.ts`
- ✅ Enabled cross-linking from other content types

#### 4. CTA Component Enhancement ✅
- ✅ Extended `apps/sanity/schema/ui/cta.tsx` to support anchor links
- ✅ Added third link type: "Kotwica" (anchor) for same-page navigation
- ✅ Updated validation to require "#" prefix in anchor field
- ✅ Updated preview to show anchor icon (⚓️)
- ✅ Updated frontend `apps/astro/src/components/ui/Button/index.ts` GROQ query
- ✅ Updated TypeScript types in `apps/astro/src/components/ui/Button/Button.tsx`

### Phase 2: New Page Builder Components - COMPLETED

#### 5. ImagesMarqueeSection Component ✅
- ✅ Created `apps/sanity/schema/components/ImagesMarqueeSection.ts`
- ✅ Heading field (required)
- ✅ Array of images (min 5, max 12)
- ✅ Section ID support
- ✅ Added to `apps/sanity/schema/Components.ts`

#### 6. BlockColumn Component ✅
- ✅ Created `apps/sanity/schema/components/BlockColumn.ts`
- ✅ Heading field (required)
- ✅ Array of blocks (min 2), each with:
  - Image (required)
  - Text field (type: text, 2 rows)
- ✅ Section ID support
- ✅ Added to `apps/sanity/schema/Components.ts`

#### 7. Newsletter Component Enhancement ✅
- ✅ Updated `apps/sanity/schema/components/Newsletter.ts`
- ✅ Added boolean field: "Zwykłe CTA zamiast newslettera"
- ✅ Conditional logic:
  - When `true`: Shows CTA field, hides `ctaText` and `formPopup`
  - When `false`: Shows `ctaText` and `formPopup`, hides CTA
- ✅ Conditional validation for required fields

#### 8. Astro Components for Page Builder ✅
- ✅ Created `apps/astro/src/components/global/BlockColumn.astro`
- ✅ Created `apps/astro/src/components/global/ImagesMarqueeSection.astro`
- ✅ Added both components to `apps/astro/src/components/Components.astro`
- ✅ Components follow the structure from cursor rules (empty queries ready for implementation)

#### 9. Unified Page Fetching System ✅
- ✅ Created `apps/astro/src/utils/fetch-page.ts` utility
- ✅ Single API call checks both LandingPage_Collection and Pages_Collection
- ✅ Returns page type indicator ('landing' or 'regular')
- ✅ Optimized performance (1 API call instead of 2)
- ✅ Index pages preserved to use original DefaultPage.fetchData

#### 10. Landing Header Implementation ✅
- ✅ Complete LandingHeader component with full functionality
- ✅ Logo extracted from Header.astro
- ✅ Navigation links with colored backgrounds (matching Header.astro style)
- ✅ CTA button with light shade for primary theme
- ✅ Centered navigation links using CSS Grid
- ✅ Mobile menu with hamburger button
- ✅ Close button positioned over mobile nav (z-index: 300)
- ✅ Mobile menu closes when navigation links are clicked
- ✅ Min width of 3.25rem for all nav links
- ✅ Language switcher removed (as per requirements)
- ✅ Responsive design with mobile menu slide-in animation

---

## Remaining Tasks

## Architecture

### Sanity CMS Structure

#### 1. LandingPage_Collection Document Type
**Location:** `apps/sanity/schema/collectionTypes/LandingPage_Collection.ts`

**Fields:**
- `language` (string) - Read-only, hidden - manages i18n
- `slug` (slug) - Landing page URL path
  - Prefix structure:
    - PL: `/pl/`
    - EN: `/en/`
  - Example slugs: `/pl/promo/`, `/en/special-offer/`
- `navigationLinks` (array of objects) - Header navigation items
  - `name` (string) - Link display text
  - `href` (string) - Link URL (internal or external)
  - Validation: minimum 1, maximum 6 links
- `cta` (object reference) - Main call-to-action button using existing `cta` type
- `components` (array) - Page builder using existing `components` type
- `seo` (object) - SEO metadata using existing `seo` type

**Groups:**
- `content` - Contains navigationLinks, cta, and components
- `seo` - Contains SEO fields

**Preview:**
- Title: Document name/title or slug
- Subtitle: Full slug path
- Icon: Custom landing page icon (e.g., Rocket or Target)

#### 2. Schema Registration
**File:** `apps/sanity/structure/schema-types.ts`

Add to imports:
```typescript
import LandingPage_Collection from '../schema/collectionTypes/LandingPage_Collection'
```

Add to `collectionTypes` array:
```typescript
const collectionTypes = [
  // ... existing types
  LandingPage_Collection,
]
```

#### 3. Structure Navigation
**File:** `apps/sanity/structure/index.tsx`

Add landing page collection after `Pages_Collection` (line 13):
```typescript
createSingleton({ S, name: 'Index_Page' }),
createCollection(S, context, 'Pages_Collection'),
createCollection(S, context, 'LandingPage_Collection'),
S.divider(),
```

#### 4. Internal Linkable Types
**File:** `apps/sanity/structure/internal-linkable-types.ts`

Add to array:
```typescript
export const InternalLinkableTypes: { type: string }[] = [
  // ... existing types
  { type: 'LandingPage_Collection' },
]
```

### Astro Frontend Structure

#### 1. LandingHeader Component
**Location:** `apps/astro/src/layouts/LandingHeader.astro`

**Features:**
- Minimal navigation with provided links
- Logo linking to home page
- CTA button in header
- Language switcher (reuse from main Header)
- Mobile-responsive with hamburger menu
- No dropdown menus (unlike main Header)

**Props:**
```typescript
type Props = {
  navigationLinks: Array<{ name: string; href: string }>
  cta: ButtonDataProps
  alternates?: Array<{ lang: Language; url: string }>
}
```

**Design Considerations:**
- Simpler than main header - no expandable categories
- Sticky positioning
- Same brand styling (gradient border, colors)
- Minimal animations for better performance
- Focus on conversion with prominent CTA

**Structure:**
```
- Skip link (accessibility)
- Header container
  - Logo
  - Navigation (desktop)
    - Links list
    - CTA button
    - Language switcher
  - Mobile menu button
  - Mobile navigation (slide-in)
    - Links list
    - CTA button
    - Language switcher
```

#### 2. LandingFooter Component
**Location:** `apps/astro/src/layouts/LandingFooter.astro`

**Features:**
- Minimal footer design
- Essential links only
- Legal links (privacy policy, terms)
- Copyright notice
- Social media icons (optional)
- No newsletter signup
- No extensive navigation

**Props:**
```typescript
type Props = {
  // Uses global data from Sanity
}
```

**Design Considerations:**
- Simplified version of main footer
- Single row layout
- Focus on legal compliance
- Maintains brand consistency
- Reduced visual weight

**Structure:**
```
- Footer container
  - Logo (optional)
  - Quick links (3-4 items max)
  - Social media icons
  - Bottom bar
    - Created by credits
    - Legal links
    - Copyright
```

#### 3. LandingLayout Component
**Location:** `apps/astro/src/layouts/LandingLayout.astro`

**Purpose:** Wrapper layout specifically for landing pages

**Props:**
```typescript
type Props = HeadProps & {
  navigationLinks: Array<{ name: string; href: string }>
  cta: ButtonDataProps
}
```

**Structure:**
```astro
---
import '@/global/global.scss'
import Head, { type HeadProps } from './Head.astro'
import OrganizationSchema from '../Schema/OrganizationSchema.astro'
import LandingFooter from './LandingFooter.astro'
import LandingHeader from './LandingHeader.astro'
import Toast from '../components/ui/Toast.astro'
import CookieConsent from './CookieConsent.astro'
import { getLangFromPath } from '../global/languages'

type Props = HeadProps & {
  navigationLinks: Array<{ name: string; href: string }>
  cta: ButtonDataProps
}

const { navigationLinks, cta, ...headProps } = Astro.props
const lang = getLangFromPath(Astro.url.pathname)
---

<!doctype html>
<html lang={lang}>
  <head>
    <Head {...headProps} />
    <OrganizationSchema />
    <slot name="head" />
  </head>
  <body>
    <CookieConsent />
    <LandingHeader 
      navigationLinks={navigationLinks} 
      cta={cta}
      alternates={headProps.alternates} 
    />
    <main id="main">
      <slot />
    </main>
    <LandingFooter />
    <Toast />
  </body>
</html>
```

#### 4. LandingPage Template
**Location:** `apps/astro/src/templates/LandingPage.astro`

**Purpose:** Template for rendering landing pages

```astro
---
import LandingLayout from '@/src/layouts/LandingLayout.astro'
import Components, { Components_Query, type ComponentsProps } from '@/components/Components.astro'
import { type Language } from '../global/languages'
import sanityFetch from '../utils/sanity.fetch'
import metadataFetch from '../utils/metadata.fetch'
import { ButtonDataQuery, type ButtonDataProps } from '../components/ui/Button'

type Props = NonNullable<Awaited<ReturnType<typeof fetchData>>>

export async function fetchData(slug: string, lang: Language) {
  const query = `
    *[_type == "LandingPage_Collection" && language == $language && slug.current == $slug][0] {
      "slug": slug.current,
      "name": name,
      navigationLinks[] {
        name,
        href
      },
      ${ButtonDataQuery('cta')}
      ${Components_Query}
    }
  `

  const page = await sanityFetch<{
    slug: string
    name: string
    navigationLinks: Array<{ name: string; href: string }>
    cta: ButtonDataProps
    components: ComponentsProps
  }>({
    query,
    params: { slug: `/${lang}/${slug}/`, language: lang },
  })

  if (!page) return null

  const metadata = await metadataFetch(page.slug)

  return {
    page,
    metadata,
  }
}

const { page, metadata } = Astro.props
---

<LandingLayout 
  {...metadata}
  navigationLinks={page.navigationLinks}
  cta={page.cta}
>
  <Components data={page.components} />
</LandingLayout>
```

#### 5. Landing Page Routes
**Locations:**
- `apps/astro/src/pages/pl/[...slug].astro` (new file)
- `apps/astro/src/pages/en/[...slug].astro` (new file)

**Note:** Use catch-all routes to handle landing pages separately from regular pages

```astro
---
import LandingPage, { fetchData } from '@/src/templates/LandingPage.astro'

// Check if it's a landing page first
const landingData = await fetchData(Astro.params.slug || '', 'pl')

if (landingData) {
  // Render as landing page
}

// Otherwise fall back to regular page handling
// Import existing DefaultPage logic
---

{landingData ? (
  <LandingPage {...landingData} />
) : (
  <!-- Existing default page logic -->
)}
```

**Better Approach:** Create separate routes for landing pages with specific patterns

#### 6. Sitemap Integration
**File:** `apps/astro/src/pages/sitemap-index.xml.ts`

Add landing pages to sitemap generation query:
```groq
*[_type == "LandingPage_Collection" && language == $language] {
  "slug": slug.current,
  _updatedAt
}
```

## Styling Guidelines

### LandingHeader Styles

**Key CSS Classes:**
```scss
.landing-header {
  // Simplified header with minimal navigation
  position: sticky;
  top: 0;
  z-index: 100;
  background-color: var(--neutral-100);
  border-bottom: 0.125rem solid;
  border-image: linear-gradient(...) 1; // Same gradient as main header
  
  .container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    max-width: calc(85.375rem - 2 * var(--pageMargin));
    margin: 0 auto;
  }
  
  .navigation {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    
    .nav-link {
      // Simple link styles
      min-height: 2.75rem;
      color: var(--primary-700);
      font-size: var(--typography-body-m);
      
      &:hover {
        // Simple underline effect
      }
    }
  }
  
  // Mobile styles
  @media (max-width: 49.9375rem) {
    // Simplified mobile menu
  }
}
```

### LandingFooter Styles

**Key CSS Classes:**
```scss
.landing-footer {
  // Minimal footer design
  padding: 2rem var(--pageMargin);
  background: var(--neutral-200);
  
  .container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    max-width: calc(85.375rem - 2 * var(--pageMargin));
    margin: 0 auto;
  }
  
  .bottom-bar {
    // Legal links and copyright
    background: var(--primary-800);
    color: var(--neutral-400);
  }
  
  @media (max-width: 41.1875rem) {
    // Stack on mobile
    .container {
      flex-direction: column;
      gap: 1.5rem;
    }
  }
}
```

## Implementation Steps

### Phase 1: Sanity Setup (Backend) - ✅ COMPLETED

1. **Create LandingPage_Collection Schema** ✅
   - [x] Create file: `apps/sanity/schema/collectionTypes/LandingPage_Collection.ts`
   - [x] Define fields: language, slug, navigationLinks, cta, components, seo
   - [x] Add field validations
   - [x] Configure preview display
   - [x] Add to schema-types.ts

2. **Update Structure Navigation** ✅
   - [x] Add LandingPage_Collection to structure/index.tsx
   - [x] Position below Pages_Collection
   - [x] Add appropriate icon (Rocket)

3. **Update Internal Link Types** ✅
   - [x] Add LandingPage_Collection to internal-linkable-types.ts
   - [x] Enable cross-linking from other content

4. **Test in Sanity Studio**
   - [ ] Create test landing page document
   - [ ] Verify all fields work correctly
   - [ ] Test navigation links array
   - [ ] Test CTA button configuration
   - [ ] Test page builder components

### Phase 2: Astro Frontend (Components) - ✅ COMPLETED

5. **Create LandingHeader Component** ✅
   - [x] Create file: `apps/astro/src/layouts/LandingHeader.astro`
   - [x] Implement simplified navigation
   - [x] Add logo with home link (extracted from Header.astro)
   - [x] Integrate CTA button (with light shade for primary theme)
   - [x] Removed language switcher (as per requirements)
   - [x] Implement mobile menu with hamburger button
   - [x] Add SCSS styling with colored backgrounds for nav links
   - [x] Navigation links centered in middle of header
   - [x] Min width of 3.25rem for all nav links
   - [x] Close button positioned over mobile nav (z-index: 300)
   - [x] Mobile menu closes when navigation links are clicked
   - [x] Test accessibility (skip links, ARIA)

6. **Create LandingFooter Component** ✅
   - [x] Create file: `apps/astro/src/layouts/LandingFooter.astro`
   - [x] Dummy component created (ready for design implementation)
   - [ ] Implement minimal footer layout (pending design)
   - [ ] Add legal links (pending design)
   - [ ] Add copyright and credits (pending design)
   - [ ] Add SCSS styling (pending design)
   - [ ] Ensure responsive design (pending design)

7. **Create LandingLayout Wrapper** ✅
   - [x] Create file: `apps/astro/src/layouts/LandingLayout.astro`
   - [x] Import LandingHeader and LandingFooter
   - [x] Configure props interface
   - [x] Add same global elements (Toast, CookieConsent)
   - [x] Remove Breadcrumbs component

### Phase 2.5: New Page Builder Components - ✅ COMPLETED

8. **Create ImagesMarqueeSection Component** ✅
   - [x] Create file: `apps/sanity/schema/components/ImagesMarqueeSection.ts`
   - [x] Add heading field
   - [x] Add images array (min 5, max 12)
   - [x] Add to Components.ts

9. **Create BlockColumn Component** ✅
   - [x] Create file: `apps/sanity/schema/components/BlockColumn.ts`
   - [x] Add heading field
   - [x] Add blocks array (min 2), each with image and text
   - [x] Add to Components.ts

10. **Update Newsletter Component** ✅
    - [x] Add boolean field "Zwykłe CTA zamiast newslettera"
    - [x] Add conditional CTA field
    - [x] Update conditional validation

### Phase 3: Astro Frontend (Templates & Routes) - ✅ COMPLETED

8. **Create LandingPage Template** ✅
   - [x] Create file: `apps/astro/src/templates/LandingPage.astro`
   - [x] Implement fetchData function with GROQ query (via unified fetch-page.ts)
   - [x] Add metadata fetching
   - [x] Integrate Components rendering
   - [x] TypeScript types properly configured

9. **Setup Landing Page Routes** ✅
   - [x] Decided on routing strategy: unified query approach
   - [x] Created unified `fetch-page.ts` utility (single API call for landing + regular pages)
   - [x] Modified route files for PL and EN (`pl/[slug].astro`, `en/[slug].astro`)
   - [x] Implemented landing page detection logic (checks landing page first, then regular)
   - [x] Index pages still use original DefaultPage.fetchData (preserved original behavior)
   - [x] Routes return 404 when no document found (no fallback to default page)
   - [x] Optimized to use single API call instead of two separate calls

10. **Update Sitemap Generation**
    - [ ] Add landing pages to sitemap query
    - [ ] Ensure proper URL formatting
    - [ ] Test sitemap.xml output

### Phase 4: Testing & Refinement

11. **Functional Testing**
    - [ ] Test creating landing page in Sanity
    - [ ] Verify navigation links render correctly
    - [ ] Test CTA button functionality
    - [ ] Verify components render properly
    - [ ] Test language switching
    - [ ] Verify SEO metadata
    - [ ] Test internal linking from other pages

12. **Responsive Testing**
    - [ ] Test desktop layout (1920px, 1440px, 1280px)
    - [ ] Test tablet layout (768px, 1024px)
    - [ ] Test mobile layout (375px, 414px)
    - [ ] Verify mobile menu functionality
    - [ ] Test touch interactions

13. **Accessibility Testing**
    - [ ] Test keyboard navigation
    - [ ] Verify ARIA labels
    - [ ] Test skip links
    - [ ] Check color contrast ratios
    - [ ] Test with screen reader
    - [ ] Verify focus indicators
    - [ ] Ensure minimum touch target sizes (44px)

14. **Performance Testing**
    - [ ] Run PageSpeed Insights
    - [ ] Check Core Web Vitals (LCP, FID, CLS)
    - [ ] Optimize images
    - [ ] Minimize CSS/JS
    - [ ] Test loading times

### Phase 5: Documentation & Deployment

15. **Documentation**
    - [ ] Document Sanity field usage
    - [ ] Create content guidelines for landing pages
    - [ ] Document component limitations
    - [ ] Add examples for navigation links
    - [ ] Document routing behavior

16. **Deployment**
    - [ ] Deploy Sanity schema changes
    - [ ] Deploy Astro frontend changes
    - [ ] Verify production build
    - [ ] Test on staging environment
    - [ ] Monitor for errors

## Technical Considerations

### Routing Strategy

**Option 1: Catch-All Route (Recommended)**
- Use `[...slug].astro` to catch all routes
- Check for landing page first, then fall back to regular pages
- Pros: Clean URLs, flexible
- Cons: Slightly more complex logic

**Option 2: Dedicated Landing Route Pattern**
- Use specific patterns like `landing-[slug].astro`
- Easier to maintain separation
- Pros: Clear separation, simpler logic
- Cons: URLs contain "landing-" prefix

**Decision:** Option 1 - Check for landing page type in existing catch-all routes

### Navigation Links Validation

```typescript
// In LandingPage_Collection schema
defineField({
  name: 'navigationLinks',
  type: 'array',
  title: 'Navigation Links',
  description: 'Links displayed in the landing page header (max 6 for optimal UX)',
  of: [
    {
      type: 'object',
      fields: [
        {
          name: 'name',
          type: 'string',
          title: 'Link Text',
          validation: Rule => Rule.required()
        },
        {
          name: 'href',
          type: 'string',
          title: 'URL',
          description: 'Full URL (e.g., /pl/kontakt/ or https://example.com)',
          validation: Rule => Rule.required()
        }
      ],
      preview: {
        select: {
          title: 'name',
          subtitle: 'href'
        }
      }
    }
  ],
  validation: Rule => [
    Rule.required().min(1).error('At least one navigation link is required'),
    Rule.max(6).warning('For optimal UX, limit navigation to 6 items')
  ]
})
```

### CTA Integration

The landing page uses the existing `cta` type which already handles:
- Text content
- Theme (primary/secondary)
- Link type (internal/external)
- URL validation

No additional work needed - just reference it:
```typescript
defineField({
  name: 'cta',
  type: 'cta',
  title: 'Call to Action',
  description: 'Primary CTA button displayed in the header',
  group: 'content',
  validation: Rule => Rule.required()
})
```

### Components Reuse

Landing pages will use the same component library as regular pages:
- All existing components from `schema/Components.ts`
- Same rendering logic in Astro
- Same styling and interactions
- No need to create landing-specific components

### SEO Considerations

1. **Unique Metadata**
   - Each landing page should have unique title and description
   - Use descriptive, conversion-focused copy
   - Include target keywords

2. **Canonical URLs**
   - Set proper canonical tags
   - Avoid duplicate content issues

3. **Social Sharing**
   - Custom Open Graph images for each landing page
   - Compelling social share text

4. **Structured Data**
   - Reuse existing Organization schema
   - Consider adding WebPage schema specific to landing pages

## Content Guidelines

### Navigation Links Best Practices

1. **Limit to 6 items** - Keep header uncluttered
2. **Clear labels** - Use descriptive, action-oriented text
3. **Strategic order** - Most important links first
4. **Include contact** - Make it easy to reach you
5. **Test on mobile** - Ensure all links are accessible

Example structure:
```
- O nas (About)
- Oferta (Services)
- Realizacje (Case Studies)
- Kontakt (Contact)
```

### CTA Button Guidelines

1. **Action-oriented text** - "Otrzymaj wycenę", "Zarezerwuj teraz"
2. **Use primary theme** - Make it stand out
3. **Link to conversion page** - Contact form, booking page, etc.
4. **Test placement** - Header and/or within page content

### Component Selection

**Recommended components for landing pages:**
- `BackgroundImageWithCenteredHeading` - Strong visual hero
- `FloatingPointsList` - Key benefits
- `CardSteps` - Process overview
- `Testimonials` - Social proof
- `GradientBackgroundCta` - Conversion focus
- `ContactForm` - Lead capture
- `Faq` - Address objections

**Avoid for landing pages:**
- `ActivitiesCarousel` - Too distracting
- `HighlightedBlogPosts` - Off-topic content
- Multiple navigation-heavy components

## Design Reference

While Figma design wasn't accessible in this planning phase, the implementation should follow these principles based on typical landing page best practices:

1. **Hero Section**
   - Large headline
   - Compelling subheadline
   - Primary CTA above the fold
   - Supporting visual

2. **Benefits Section**
   - 3-5 key benefits
   - Icons or illustrations
   - Short, scannable copy

3. **Social Proof**
   - Testimonials
   - Case studies
   - Trust badges
   - Statistics

4. **Features**
   - Detailed offering information
   - Clear value proposition
   - Supporting visuals

5. **Final CTA**
   - Repeat primary CTA
   - Urgency or scarcity if applicable
   - Low-friction conversion

## Migration Path

If existing pages need to be converted to landing pages:

1. **Identify candidates** - High-traffic, conversion-focused pages
2. **Create new landing page document** - Copy content to new collection
3. **Update slug** - Ensure URL remains the same or set up redirect
4. **Customize navigation** - Add landing-specific nav links
5. **Optimize for conversion** - Adjust components and CTAs
6. **Test thoroughly** - Verify functionality and analytics
7. **Archive old page** - Once landing page is live

## Performance Targets

Landing pages should meet these benchmarks:

- **Lighthouse Performance**: 90+
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Time to Interactive**: < 3.5s
- **Total Blocking Time**: < 200ms
- **Cumulative Layout Shift**: < 0.1

Optimization strategies:
- Lazy load images below the fold
- Minimize JavaScript
- Inline critical CSS
- Use optimized image formats (WebP)
- Leverage browser caching

## Future Enhancements

Potential features to add later:

1. **A/B Testing Support**
   - Multiple CTA variants
   - Component order testing
   - Headline variations

2. **Custom Form Builder**
   - Landing-specific form component
   - Custom field configuration
   - Integration with email marketing

3. **Analytics Integration**
   - Conversion tracking
   - Heatmap support
   - Goal completion events

4. **Dynamic Content**
   - Personalization based on source
   - URL parameter handling
   - Geo-targeting

5. **Popup/Exit Intent**
   - Additional conversion opportunities
   - Newsletter signup
   - Special offers

## Success Metrics

Track these KPIs for landing pages:

- Conversion rate
- Bounce rate
- Time on page
- Scroll depth
- CTA click-through rate
- Form submission rate
- Page load time

## Rollback Plan

If issues arise post-deployment:

1. **Sanity**: Schema changes are backwards compatible
2. **Astro**: Keep old routes as fallback
3. **Monitoring**: Set up error tracking for landing pages specifically
4. **Content**: Keep backup of original pages
5. **URLs**: Maintain redirects if URLs change

## Timeline Estimate

- **Phase 1** (Sanity Setup): 2-3 hours
- **Phase 2** (Components): 4-6 hours
- **Phase 3** (Templates & Routes): 3-4 hours
- **Phase 4** (Testing): 3-4 hours
- **Phase 5** (Documentation): 1-2 hours

**Total**: 13-19 hours

## Conclusion

This implementation creates a flexible, maintainable landing page system that:
- Reuses existing components and infrastructure
- Maintains brand consistency
- Focuses on conversion optimization
- Follows accessibility and performance best practices
- Provides content creators with an intuitive interface

The separation of LandingHeader/LandingFooter from the main site navigation reduces complexity and improves landing page performance while maintaining the ability to share common design elements and functionality.

