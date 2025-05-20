// Single Types
import Activities_Page from '../schema/singleTypes/Activities_Page'
import Blog_Page from '../schema/singleTypes/Blog_Page'
import CaseStudy_Page from '../schema/singleTypes/CaseStudy_Page'
import footer from '../schema/singleTypes/footer'
import global from '../schema/singleTypes/global'
import Index_Page from '../schema/singleTypes/Index_Page'
import navbar from '../schema/singleTypes/navbar'
import NotFound_Page from '../schema/singleTypes/NotFound_Page'
import redirects from '../schema/singleTypes/redirects'
import TermsAndConditions_Page from '../schema/singleTypes/legal/TermsAndConditions_Page'
import PrivacyPolicy_Page from '../schema/singleTypes/legal/PrivacyPolicy_Page'
import Hotels_Page from '../schema/singleTypes/Hotels_Page'
import Cart_Page from '../schema/singleTypes/Cart_Page'
import Quote_Page from '../schema/singleTypes/Quote_Page'
import ThankYouPage from '../schema/singleTypes/ThankYouPage'
const singleTypes = [
  global,
  redirects,
  Index_Page,
  CaseStudy_Page,
  Activities_Page,
  Blog_Page,
  NotFound_Page,
  navbar,
  footer,
  TermsAndConditions_Page,
  PrivacyPolicy_Page,
  Hotels_Page,
  Cart_Page,
  Quote_Page,
  ThankYouPage,
]

// Collections Types
import Activities_Collection from '../schema/collectionTypes/Activities_Collection'
import ActivitiesCategory_Collection from '../schema/collectionTypes/ActivitiesCategory_Collection'
import Amenities_Collection from '../schema/collectionTypes/Amenities_Collection'
import BlogCategory_Collection from '../schema/collectionTypes/BlogCategory_Collection'
import BlogPost_Collection from '../schema/collectionTypes/BlogPost_Collection'
import CaseStudy_Collection from '../schema/collectionTypes/CaseStudy_Collection'
import CaseStudyCategory_Collection from '../schema/collectionTypes/CaseStudyCategory_Collection'
import Faq_Collection from '../schema/collectionTypes/Faq_Collection'
import Pages_Collection from '../schema/collectionTypes/Pages_Collection'
import SocialMedia_Collection from '../schema/collectionTypes/SocialMedia_Collection'
import Testimonial_Collection from '../schema/collectionTypes/Testimonial_Collection'
import Author_Collection from '../schema/collectionTypes/Author_Collection'
import ActivitiesType_Collection from '../schema/collectionTypes/ActivitiesType_Collection'
import Hotels_Collection from '../schema/collectionTypes/Hotels_Collection'
import Locations_Collection from '../schema/collectionTypes/Locations_Collection'
import Quotes_Collection from '../schema/collectionTypes/Quotes_Collection'

const collectionTypes = [
  Faq_Collection,
  Pages_Collection,
  CaseStudy_Collection,
  CaseStudyCategory_Collection,
  Activities_Collection,
  ActivitiesCategory_Collection,
  BlogPost_Collection,
  BlogCategory_Collection,
  Testimonial_Collection,
  SocialMedia_Collection,
  Author_Collection,
  ActivitiesType_Collection,
  Hotels_Collection,
  Locations_Collection,
  Amenities_Collection,
  Quotes_Collection,
]

// Components
import Components from '../schema/Components'

const components = [Components]

// UI Components
import cta from '../schema/ui/cta'
import formState from '../schema/ui/formState'
import PortableText from '../schema/ui/PortableText'
import Heading from '../schema/ui/PortableText/Heading'
import seo from '../schema/ui/seo'
import formPopup from '../schema/ui/formPopup'
import quoteItem from '../schema/shared/quoteItem'
import ActivitiesCarousel from '../schema/components/ActivitiesCarousel'

const ui = [cta, seo, PortableText, Heading, formState, formPopup, quoteItem, ActivitiesCarousel]

export const schemaTypes = [...singleTypes, ...collectionTypes, ...components, ...ui]

export const i18nTypes = [...singleTypes, ...collectionTypes]
  .map((type) => type.name)
  .filter((name) => !['redirects', 'Quotes_Collection'].includes(name))

export const singletonActions = new Set(['publish', 'discardChanges', 'restore'])
export const singletonTypes = new Set(singleTypes.map((type) => type.name as string))
