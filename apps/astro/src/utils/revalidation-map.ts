import { DOMAIN } from '../global/constants'

export type SanityDocRef = {
  _type: string
  _id: string
  slug?: { current?: string }
  language?: string
}

/**
 * Returns the frontend URLs that directly render the given Sanity document.
 * Called for both the changed document and every document returned by
 * the GROQ reverse-reference lookup in the revalidate endpoint.
 *
 * When adding a new frontend-visible document type to the Sanity schema,
 * add a matching case here.
 */
export function getDirectUrls(doc: SanityDocRef): string[] {
  const base = DOMAIN.replace(/\/$/, '')
  const urls: string[] = []
  const slug = doc.slug?.current

  switch (doc._type) {
    // --- Content collections with dedicated detail pages ---

    case 'Activities_Collection':
      if (slug) {
        urls.push(`${base}/pl/integracje/${slug}`)
        urls.push(`${base}/en/activities/${slug}`)
      }
      urls.push(`${base}/pl/integracje`)
      urls.push(`${base}/en/activities`)
      break

    case 'Hotels_Collection':
      if (slug) {
        urls.push(`${base}/pl/hotele/${slug}`)
        urls.push(`${base}/en/hotels/${slug}`)
      }
      urls.push(`${base}/pl/hotele`)
      urls.push(`${base}/en/hotels`)
      break

    case 'BlogPost_Collection':
      if (slug) {
        urls.push(`${base}/pl/blog/${slug}`)
        urls.push(`${base}/en/blog/${slug}`)
      }
      urls.push(`${base}/pl/blog`)
      urls.push(`${base}/en/blog`)
      break

    case 'CaseStudy_Collection':
      if (slug) {
        urls.push(`${base}/pl/realizacje/${slug}`)
        urls.push(`${base}/en/case-studies/${slug}`)
      }
      urls.push(`${base}/pl/realizacje`)
      urls.push(`${base}/en/case-studies`)
      break

    // Dynamic pages and landing pages both render under /{lang}/{slug}
    case 'Pages_Collection':
    case 'LandingPage_Collection':
      if (slug) {
        urls.push(`${base}/pl/${slug}`)
        urls.push(`${base}/en/${slug}`)
      }
      break

    // --- Category collections (have their own listing pages) ---

    case 'ActivitiesCategory_Collection':
      if (slug) {
        urls.push(`${base}/pl/integracje/kategoria/${slug}`)
        urls.push(`${base}/en/activities/category/${slug}`)
      }
      urls.push(`${base}/pl/integracje`)
      urls.push(`${base}/en/activities`)
      break

    case 'BlogCategory_Collection':
      if (slug) {
        urls.push(`${base}/pl/blog/kategoria/${slug}`)
        urls.push(`${base}/en/blog/category/${slug}`)
      }
      urls.push(`${base}/pl/blog`)
      urls.push(`${base}/en/blog`)
      break

    case 'CaseStudyCategory_Collection':
      if (slug) {
        urls.push(`${base}/pl/realizacje/kategoria/${slug}`)
        urls.push(`${base}/en/case-studies/category/${slug}`)
      }
      urls.push(`${base}/pl/realizacje`)
      urls.push(`${base}/en/case-studies`)
      break

    // --- Singleton page configs ---

    case 'Index_Page':
      urls.push(`${base}/pl`)
      urls.push(`${base}/en`)
      break

    case 'Activities_Page':
      urls.push(`${base}/pl/integracje`)
      urls.push(`${base}/en/activities`)
      break

    case 'Hotels_Page':
      urls.push(`${base}/pl/hotele`)
      urls.push(`${base}/en/hotels`)
      break

    case 'Blog_Page':
      urls.push(`${base}/pl/blog`)
      urls.push(`${base}/en/blog`)
      break

    case 'CaseStudy_Page':
      urls.push(`${base}/pl/realizacje`)
      urls.push(`${base}/en/case-studies`)
      break

    case 'PrivacyPolicy_Page':
      urls.push(`${base}/pl/polityka-prywatnosci`)
      urls.push(`${base}/en/privacy-policy`)
      break

    case 'TermsAndConditions_Page':
      urls.push(`${base}/pl/regulamin`)
      urls.push(`${base}/en/terms-and-conditions`)
      break

    case 'NotFound_Page':
      urls.push(`${base}/pl/404`)
      urls.push(`${base}/en/404`)
      break

    // global affects all key pages — it is fetched by Header, Footer, ContactForm,
    // and every page template. The reference lookup is skipped for this type
    // (see revalidate.ts) and all key entry points are invalidated directly.
    case 'global':
      urls.push(`${base}/pl`)
      urls.push(`${base}/en`)
      urls.push(`${base}/pl/integracje`)
      urls.push(`${base}/en/activities`)
      urls.push(`${base}/pl/hotele`)
      urls.push(`${base}/en/hotels`)
      urls.push(`${base}/pl/blog`)
      urls.push(`${base}/en/blog`)
      urls.push(`${base}/pl/realizacje`)
      urls.push(`${base}/en/case-studies`)
      break

    // Types whose impact is resolved via the GROQ reverse-reference lookup
    // (e.g. Amenities_Collection → Hotels_Collection → hotel pages).
    // The default case ensures the homepage is at minimum refreshed.
    default:
      urls.push(`${base}/pl`)
      urls.push(`${base}/en`)
      break
  }

  return urls
}
