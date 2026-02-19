import { DOMAIN } from '../global/constants'

export type SanityDocRef = {
  _type: string
  _id: string
  slug?: { current?: string }
  language?: string
}

const COLLECTION_LISTING_URLS: Record<string, string[]> = {
  Activities_Collection: ['/pl/integracje/', '/en/activities/'],
  Hotels_Collection: ['/pl/hotele/', '/en/hotels/'],
  BlogPost_Collection: ['/pl/blog/', '/en/blog/'],
  CaseStudy_Collection: ['/pl/realizacje/', '/en/case-studies/'],
  ActivitiesCategory_Collection: ['/pl/integracje/', '/en/activities/'],
  BlogCategory_Collection: ['/pl/blog/', '/en/blog/'],
  CaseStudyCategory_Collection: ['/pl/realizacje/', '/en/case-studies/'],
}

/**
 * Ensures every URL is returned in both trailing-slash and non-trailing-slash
 * variants, because Vercel caches them as separate ISR entries.
 */
function withBothSlashVariants(urls: string[]): string[] {
  const set = new Set<string>()
  for (const url of urls) {
    set.add(url.endsWith('/') ? url : `${url}/`)
    set.add(url.endsWith('/') ? url.slice(0, -1) : url)
  }
  return [...set]
}

/**
 * Returns the frontend URLs that directly render the given Sanity document.
 * Called for both the changed document and every document returned by
 * the GROQ reverse-reference lookup in the revalidate endpoint.
 *
 * Slugs in this project are stored as full paths (e.g. `/pl/integracje/foo/`),
 * so detail page URLs are simply `${base}${slug}`.
 */
export function getDirectUrls(doc: SanityDocRef): string[] {
  const base = DOMAIN.replace(/\/$/, '')
  const urls: string[] = []
  const slug = doc.slug?.current

  const listingUrls = COLLECTION_LISTING_URLS[doc._type]
  if (listingUrls) {
    if (slug) urls.push(`${base}${slug}`)
    listingUrls.forEach((path) => urls.push(`${base}${path}`))
    return withBothSlashVariants(urls)
  }

  switch (doc._type) {
    case 'Pages_Collection':
    case 'LandingPage_Collection':
      if (slug) urls.push(`${base}${slug}`)
      break

    case 'Index_Page':
      urls.push(`${base}/pl/`)
      urls.push(`${base}/en/`)
      break

    case 'Activities_Page':
      urls.push(`${base}/pl/integracje/`)
      urls.push(`${base}/en/activities/`)
      break

    case 'Hotels_Page':
      urls.push(`${base}/pl/hotele/`)
      urls.push(`${base}/en/hotels/`)
      break

    case 'Blog_Page':
      urls.push(`${base}/pl/blog/`)
      urls.push(`${base}/en/blog/`)
      break

    case 'CaseStudy_Page':
      urls.push(`${base}/pl/realizacje/`)
      urls.push(`${base}/en/case-studies/`)
      break

    case 'PrivacyPolicy_Page':
      urls.push(`${base}/pl/polityka-prywatnosci/`)
      urls.push(`${base}/en/privacy-policy/`)
      break

    case 'TermsAndConditions_Page':
      urls.push(`${base}/pl/regulamin/`)
      urls.push(`${base}/en/terms-and-conditions/`)
      break

    case 'NotFound_Page':
      urls.push(`${base}/pl/404/`)
      urls.push(`${base}/en/404/`)
      break

    case 'global':
      urls.push(`${base}/pl/`)
      urls.push(`${base}/en/`)
      urls.push(`${base}/pl/integracje/`)
      urls.push(`${base}/en/activities/`)
      urls.push(`${base}/pl/hotele/`)
      urls.push(`${base}/en/hotels/`)
      urls.push(`${base}/pl/blog/`)
      urls.push(`${base}/en/blog/`)
      urls.push(`${base}/pl/realizacje/`)
      urls.push(`${base}/en/case-studies/`)
      break

    default:
      urls.push(`${base}/pl/`)
      urls.push(`${base}/en/`)
      break
  }

  return withBothSlashVariants(urls)
}
