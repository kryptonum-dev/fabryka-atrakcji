export const prerender = true

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
  // Fetch all pages with defined slugs from Sanity
  ...(await sanityFetch<string[]>({
    query: `
      *[defined(slug.current) && !(_type in ${JSON.stringify(excludedTypes)})].slug.current
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

  // Blog pages
  const blogPages = await blogStaticPathsPage('pl')
  slugs.push(
    ...blogPages.filter(({ params }) => params.page !== '1').map(({ params }) => `/pl/blog/strona/${params.page}`)
  )

  const blogCategories = await blogStaticPathsCategory('pl')
  blogCategories.forEach((category: any) => {
    slugs.push(`/pl/blog/kategoria/${category.params.category}/`)
  })

  // Blog category pages
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

  // Case study pages
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

  // Case study category pages
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

  // Activities pages
  const activitiesPages = await activitiesStaticPaths('pl')
  slugs.push(
    ...activitiesPages
      .filter(({ params }) => params.page !== '1')
      .map(({ params }) => `/pl/integracje/strona/${params.page}`)
  )

  const activitiesCategories = await activitiesStaticPathsCategory('pl')
  activitiesCategories.forEach((category: any) => {
    slugs.push(`/pl/integracje/kategoria/${category.params.category}/`)
  })

  // Activities category pages
  const activitiesCategoryPages = await activitiesStaticPathsCategoryPage('pl')
  activitiesCategoryPages.forEach((categoryPages: any) => {
    if (Array.isArray(categoryPages)) {
      categoryPages.forEach(({ params }) => {
        if (params.page !== '1') {
          slugs.push(`/pl/integracje/kategoria/${params.category}/strona/${params.page}`)
        }
      })
    }
  })

  // Hotels pages
  const hotelsPages = await hotelsStaticPaths('pl')
  slugs.push(
    ...hotelsPages.filter(({ params }) => params.page !== '1').map(({ params }) => `/pl/hotele/strona/${params.page}`)
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
