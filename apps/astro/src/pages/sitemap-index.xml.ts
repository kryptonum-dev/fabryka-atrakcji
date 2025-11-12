export const prerender = false

import { DOMAIN } from '@/global/constants'
import type { APIRoute } from 'astro'
import sanityFetch from '@/utils/sanity.fetch'

// Normalize URL construction to avoid double slashes
const normalizeUrl = (domain: string, path: string) => {
  return `${domain.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
}

// Types to exclude from sitemap
const excludedTypes = [
  'NotFound_Page',
  'Cart_Page',
  'ThankYouPage',
  'Quote_Page',
  'Amenities_Collection',
  'ActivitiesType_Collection',
  'Locations_Collection',
  'BlogCategory_Collection',
  'CaseStudyCategory_Collection',
  'ActivitiesCategory_Collection',
]

const slugs = [
  // Fetch all pages with defined slugs from Sanity (both PL and EN)
  ...(await sanityFetch<string[]>({
    query: `
      *[defined(slug.current) && !(_type in ${JSON.stringify(excludedTypes)}) && language in ['pl', 'en']].slug.current
    `,
  })),
]

// Add dynamic pagination paths manually by calling the actual functions
try {
  const {
    staticPathsPage: blogStaticPathsPage,
    staticPathsCategoryPage: blogStaticPathsCategoryPage,
    staticPathsCategory: blogStaticPathsCategory,
  } = await import('@/src/templates/blog/BlogPage.astro')
  const {
    staticPathsPage: caseStudyStaticPathsPage,
    staticPathsCategoryPage: caseStudyStaticPathsCategoryPage,
    staticPathsCategory: caseStudyStaticPathsCategory,
  } = await import('@/src/templates/caseStudies/CaseStudyPage.astro')
  const { staticPaths: activitiesStaticPaths } = await import('@/src/templates/activities/CategoriesPage.astro')
  const {
    staticPathsCategoryPage: activitiesStaticPathsCategoryPage,
    staticPathsCategory: activitiesStaticPathsCategory,
  } = await import('@/src/templates/activities/ActivitiesPage.astro')
  const { staticPaths: hotelsStaticPaths } = await import('@/src/templates/hotels/HotelsPage.astro')

  // Blog pages (PL)
  const blogPages = await blogStaticPathsPage('pl')
  slugs.push(
    ...blogPages.filter(({ params }) => params.page !== '1').map(({ params }) => `/pl/blog/strona/${params.page}`)
  )

  const blogCategories = await blogStaticPathsCategory('pl')
  blogCategories.forEach((category: any) => {
    slugs.push(`/pl/blog/kategoria/${category.params.category}/`)
  })

  // Blog category pages (PL)
  const blogCategoryPages = await blogStaticPathsCategoryPage('pl')
  blogCategoryPages.forEach((categoryPages: any) => {
    if (Array.isArray(categoryPages)) {
      categoryPages.forEach(({ params }) => {
        if (params.page !== '1') {
          slugs.push(`/pl/blog/kategoria/${params.category}/strona/${params.page}`)
        }
      })
    }
  })

  // Blog pages (EN)
  const blogPagesEn = await blogStaticPathsPage('en')
  slugs.push(
    ...blogPagesEn.filter(({ params }) => params.page !== '1').map(({ params }) => `/en/blog/page/${params.page}`)
  )

  const blogCategoriesEn = await blogStaticPathsCategory('en')
  blogCategoriesEn.forEach((category: any) => {
    slugs.push(`/en/blog/category/${category.params.category}/`)
  })

  // Blog category pages (EN)
  const blogCategoryPagesEn = await blogStaticPathsCategoryPage('en')
  blogCategoryPagesEn.forEach((categoryPages: any) => {
    if (Array.isArray(categoryPages)) {
      categoryPages.forEach(({ params }) => {
        if (params.page !== '1') {
          slugs.push(`/en/blog/category/${params.category}/page/${params.page}`)
        }
      })
    }
  })

  // Case study pages (PL)
  const caseStudyPages = await caseStudyStaticPathsPage('pl')
  slugs.push(
    ...caseStudyPages
      .filter(({ params }) => params.page !== '1')
      .map(({ params }) => `/pl/realizacje/strona/${params.page}`)
  )

  const caseStudyCategories = await caseStudyStaticPathsCategory('pl')
  caseStudyCategories.forEach((category: any) => {
    slugs.push(`/pl/realizacje/kategoria/${category.params.category}/`)
  })

  // Case study category pages (PL)
  const caseStudyCategoryPages = await caseStudyStaticPathsCategoryPage('pl')
  caseStudyCategoryPages.forEach((categoryPages: any) => {
    if (Array.isArray(categoryPages)) {
      categoryPages.forEach(({ params }) => {
        if (params.page !== '1') {
          slugs.push(`/pl/realizacje/kategoria/${params.category}/strona/${params.page}`)
        }
      })
    }
  })

  // Case study pages (EN)
  const caseStudyPagesEn = await caseStudyStaticPathsPage('en')
  slugs.push(
    ...caseStudyPagesEn
      .filter(({ params }) => params.page !== '1')
      .map(({ params }) => `/en/case-studies/page/${params.page}`)
  )

  const caseStudyCategoriesEn = await caseStudyStaticPathsCategory('en')
  caseStudyCategoriesEn.forEach((category: any) => {
    slugs.push(`/en/case-studies/category/${category.params.category}/`)
  })

  // Case study category pages (EN)
  const caseStudyCategoryPagesEn = await caseStudyStaticPathsCategoryPage('en')
  caseStudyCategoryPagesEn.forEach((categoryPages: any) => {
    if (Array.isArray(categoryPages)) {
      categoryPages.forEach(({ params }) => {
        if (params.page !== '1') {
          slugs.push(`/en/case-studies/category/${params.category}/page/${params.page}`)
        }
      })
    }
  })

  // Activities pages (PL)
  const activitiesPages = await activitiesStaticPaths('pl')
  slugs.push(...activitiesPages.map(({ params }) => `/pl/integracje/strona/${params.page}/`))

  const activitiesCategories = await activitiesStaticPathsCategory('pl')
  activitiesCategories.forEach((category: any) => {
    slugs.push(`/pl/integracje/kategoria/${category.params.category}`)
  })

  // Activities category pages (PL)
  const activitiesCategoryPages = await activitiesStaticPathsCategoryPage('pl')
  activitiesCategoryPages.forEach(({ params }) => {
    if (params.page !== '1/') {
      slugs.push(`/pl/integracje/kategoria/${params.category}strona/${params.page}`)
    }
  })

  // Activities pages (EN)
  const activitiesPagesEn = await activitiesStaticPaths('en')
  slugs.push(...activitiesPagesEn.map(({ params }) => `/en/activities/page/${params.page}/`))

  const activitiesCategoriesEn = await activitiesStaticPathsCategory('en')
  activitiesCategoriesEn.forEach((category: any) => {
    slugs.push(`/en/activities/category/${category.params.category}`)
  })

  // Activities category pages (EN)
  const activitiesCategoryPagesEn = await activitiesStaticPathsCategoryPage('en')
  activitiesCategoryPagesEn.forEach(({ params }) => {
    if (params.page !== '1/') {
      slugs.push(`/en/activities/category/${params.category}page/${params.page}`)
    }
  })

  // Hotels pages (PL)
  const hotelsPages = await hotelsStaticPaths('pl')
  slugs.push(
    ...hotelsPages.filter(({ params }) => params.page !== '1').map(({ params }) => `/pl/hotele/strona/${params.page}`)
  )

  // Hotels pages (EN)
  const hotelsPagesEn = await hotelsStaticPaths('en')
  slugs.push(
    ...hotelsPagesEn.filter(({ params }) => params.page !== '1').map(({ params }) => `/en/hotels/page/${params.page}`)
  )
} catch (error) {
  console.warn('Error loading static paths for sitemap:', error)
}

const response = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
  ${slugs.map((slug) => `<url><loc>${normalizeUrl(DOMAIN, slug)}</loc></url>`).join('\n  ')}
</urlset>`

export const GET: APIRoute = () => {
  return new Response(response, {
    headers: {
      'Content-Type': 'application/xml',
    },
  })
}
