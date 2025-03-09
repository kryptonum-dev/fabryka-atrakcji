// Single Types
import Activities_Page from '../schema/singleTypes/Activities_Page'
import CaseStudy_Page from '../schema/singleTypes/CaseStudy_Page'
import footer from '../schema/singleTypes/footer'
import global from '../schema/singleTypes/global'
import Index_Page from '../schema/singleTypes/Index_Page'
import navbar from '../schema/singleTypes/navbar'
import redirects from '../schema/singleTypes/redirects'

const singleTypes = [global, redirects, Index_Page, CaseStudy_Page, Activities_Page, navbar, footer]

// Collections Types
import Activities_Collection from '../schema/collectionTypes/Activities_Collection'
import CaseStudy_Collection from '../schema/collectionTypes/CaseStudyCollection'
import Faq_Collection from '../schema/collectionTypes/Faq_Collection'
import Pages_Collection from '../schema/collectionTypes/Pages_Collection'

const collectionTypes = [Faq_Collection, Pages_Collection, CaseStudy_Collection, Activities_Collection]

// Components
import Components from '../schema/Components'

const components = [Components]

// UI Components
import cta from '../schema/ui/cta'
import PortableText from '../schema/ui/PortableText'
import Heading from '../schema/ui/PortableText/Heading'
import seo from '../schema/ui/seo'

const ui = [cta, seo, PortableText, Heading]

export const schemaTypes = [...singleTypes, ...collectionTypes, ...components, ...ui]

export const i18nTypes = [...singleTypes, ...collectionTypes]
  .map((type) => type.name)
  .filter((name) => !['redirects'].includes(name))

export const singletonActions = new Set(['publish', 'discardChanges', 'restore'])
export const singletonTypes = new Set(singleTypes.map((type) => type.name as string))
