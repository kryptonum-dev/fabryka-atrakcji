import { type Language } from '../global/languages'
import sanityFetch from './sanity.fetch'
import metadataFetch from './metadata.fetch'
import { Components_Query, type ComponentsProps } from '../components/Components.astro'
import { ButtonDataQuery, type ButtonDataProps } from '../components/ui/Button'

type LandingPageQueryResult = {
  slug: string
  name: string
  navigationLinks: Array<{ name: string; href: string }>
  cta: ButtonDataProps
  components: ComponentsProps
}

type RegularPageQueryResult = {
  slug: string
  name: string
  firstItemType: string
  components: ComponentsProps
}

export type LandingPageData = LandingPageQueryResult & {
  type: 'landing'
}

export type RegularPageData = RegularPageQueryResult & {
  type: 'regular'
}

export type PageData = LandingPageData | RegularPageData

export async function fetchPage(slug: string, lang: Language) {
  // Skip unified query for index pages (they use original DefaultPage fetchData)
  if (!slug) return null

  // Unified query that checks both landing page and regular page types
  const query = `
    {
      "landingPage": *[_type == "LandingPage_Collection" && language == $language && slug.current == $slug][0] {
        "slug": slug.current,
        "name": name,
        navigationLinks[] {
          name,
          href
        },
        ${ButtonDataQuery('cta')}
        ${Components_Query}
      },
      "regularPage": *[_type == "Pages_Collection" && language == $language && slug.current == $slug][0] {
        "slug": slug.current,
        "name": name,
        "firstItemType": components[0]._type,
        ${Components_Query}
      }
    }
  `

  const result = await sanityFetch<{
    landingPage: LandingPageQueryResult | null
    regularPage: RegularPageQueryResult | null
  }>({
    query,
    params: { slug: `/${lang}/${slug}/`, language: lang },
  })

  // Determine which page type we found
  let pageData: PageData | null = null

  if (result.landingPage) {
    pageData = {
      ...result.landingPage,
      type: 'landing',
    }
  } else if (result.regularPage) {
    pageData = {
      ...result.regularPage,
      type: 'regular',
    }
  }

  if (!pageData) return null

  const metadata = await metadataFetch(pageData.slug)

  return {
    data: pageData,
    metadata,
  }
}
