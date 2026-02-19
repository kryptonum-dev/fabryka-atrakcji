import { createClient } from '@sanity/client'
import { API_VERSION, DATASET, PROJECT_ID } from '../constants'

type PortableTextValue = Record<string, unknown>[]

type ContactFormComponent = {
  _type: 'ContactForm'
  _key?: string
  heading?: PortableTextValue
  paragraph?: PortableTextValue
}

// Collection types store overrides in a nested `formOverrides` object
type CollectionDocument = {
  _id: string
  _type: 'ActivitiesCategory_Collection' | 'Activities_Collection' | 'Hotels_Collection'
  name?: string
  language?: string
  slug?: string
  formOverrides?: {
    heading?: PortableTextValue
    paragraph?: PortableTextValue
  }
  formHeading?: never
  formParagraph?: never
  contactForms?: ContactFormComponent[]
}

// Singleton page types store overrides as top-level `formHeading`/`formParagraph` fields
type SingletonDocument = {
  _id: string
  _type: 'Activities_Page' | 'Hotels_Page'
  name?: string
  language?: string
  slug?: string
  formOverrides?: never
  formHeading?: PortableTextValue
  formParagraph?: PortableTextValue
  contactForms?: ContactFormComponent[]
}

type MigratedDocument = CollectionDocument | SingletonDocument

const COLLECTION_TYPES = ['ActivitiesCategory_Collection', 'Activities_Collection', 'Hotels_Collection'] as const
const SINGLETON_TYPES = ['Activities_Page', 'Hotels_Page'] as const
const ALL_TYPES = [...COLLECTION_TYPES, ...SINGLETON_TYPES]

const isCollectionDoc = (doc: MigratedDocument): doc is CollectionDocument =>
  (COLLECTION_TYPES as readonly string[]).includes(doc._type)

const args = new Set(process.argv.slice(2))
const isApply = args.has('--apply')
const isDryRun = !isApply
const force = args.has('--force')
const removeContactForm = args.has('--remove-contact-form')
const includeDrafts = args.has('--include-drafts')

const token = process.env.SANITY_API_TOKEN
const dataset = process.env.SANITY_DATASET || DATASET
const projectId = process.env.SANITY_PROJECT_ID || PROJECT_ID

if (!token) {
  throw new Error('Missing SANITY_API_TOKEN environment variable')
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: API_VERSION,
  useCdn: false,
  token,
})

const query = `
  *[
    _type in ${JSON.stringify(ALL_TYPES)}
    && (${includeDrafts ? 'true' : '!(_id in path("drafts.**"))'})
  ]{
    _id,
    _type,
    name,
    language,
    "slug": slug.current,
    formOverrides,
    formHeading,
    formParagraph,
    "contactForms": components[_type == "ContactForm"]{
      _key,
      _type,
      heading,
      paragraph
    }
  }
`

const hasPortableTextContent = (value?: PortableTextValue): boolean => Array.isArray(value) && value.length > 0

const formatDoc = (doc: MigratedDocument) => {
  const slug = doc.slug ? ` (${doc.slug})` : ''
  const lang = doc.language ? ` [${doc.language}]` : ''
  return `${doc._type}:${doc._id}${lang}${slug}`
}

// Returns the current heading/paragraph already set on the destination fields (for skip-if-present logic)
const getExistingOverrides = (doc: MigratedDocument) => {
  if (isCollectionDoc(doc)) {
    return { heading: doc.formOverrides?.heading, paragraph: doc.formOverrides?.paragraph }
  }
  return { heading: doc.formHeading, paragraph: doc.formParagraph }
}

// Returns the dot-notation field paths used in the Sanity patch set payload
const getDestinationPaths = (doc: MigratedDocument) => {
  if (isCollectionDoc(doc)) {
    return { heading: 'formOverrides.heading', paragraph: 'formOverrides.paragraph' }
  }
  return { heading: 'formHeading', paragraph: 'formParagraph' }
}

const run = async () => {
  const documents = await client.fetch<MigratedDocument[]>(query)

  let scanned = 0
  let withContactForm = 0
  let changed = 0
  let updatedHeading = 0
  let updatedParagraph = 0
  let removedComponents = 0
  let skippedBecauseOverridesPresent = 0

  console.log(
    `[migrate-contact-form-overrides] mode=${isDryRun ? 'dry-run' : 'apply'} force=${force} removeContactForm=${removeContactForm} includeDrafts=${includeDrafts}`
  )
  console.log(`[migrate-contact-form-overrides] project=${projectId} dataset=${dataset}`)
  console.log(`[migrate-contact-form-overrides] types=${ALL_TYPES.join(', ')}`)

  for (const doc of documents) {
    scanned += 1

    const sourceContactForm = (doc.contactForms || []).find(
      (component) => hasPortableTextContent(component.heading) || hasPortableTextContent(component.paragraph)
    )

    if (!sourceContactForm) {
      continue
    }

    withContactForm += 1

    const existing = getExistingOverrides(doc)
    const destinationPaths = getDestinationPaths(doc)

    const shouldSetHeading =
      hasPortableTextContent(sourceContactForm.heading) && (force || !hasPortableTextContent(existing.heading))
    const shouldSetParagraph =
      hasPortableTextContent(sourceContactForm.paragraph) && (force || !hasPortableTextContent(existing.paragraph))

    if (!force && (hasPortableTextContent(existing.heading) || hasPortableTextContent(existing.paragraph))) {
      const blockedHeading = hasPortableTextContent(existing.heading) && hasPortableTextContent(sourceContactForm.heading)
      const blockedParagraph =
        hasPortableTextContent(existing.paragraph) && hasPortableTextContent(sourceContactForm.paragraph)
      if (blockedHeading || blockedParagraph) {
        skippedBecauseOverridesPresent += 1
      }
    }

    const setPayload: Record<string, PortableTextValue> = {}
    if (shouldSetHeading && sourceContactForm.heading) {
      setPayload[destinationPaths.heading] = sourceContactForm.heading
      updatedHeading += 1
    }
    if (shouldSetParagraph && sourceContactForm.paragraph) {
      setPayload[destinationPaths.paragraph] = sourceContactForm.paragraph
      updatedParagraph += 1
    }

    const unsetPaths: string[] = []
    if (removeContactForm && sourceContactForm._key) {
      unsetPaths.push(`components[_key=="${sourceContactForm._key}"]`)
      removedComponents += 1
    }

    if (Object.keys(setPayload).length === 0 && unsetPaths.length === 0) {
      continue
    }

    changed += 1

    console.log(`- ${formatDoc(doc)}`)
    if (Object.keys(setPayload).length > 0) {
      const fields = Object.keys(setPayload).join(', ')
      console.log(`  set: ${fields}`)
    }
    if (unsetPaths.length > 0) {
      console.log(`  unset: ${unsetPaths.join(', ')}`)
    }

    if (!isDryRun) {
      let patch = client.patch(doc._id).set(setPayload)
      if (unsetPaths.length > 0) {
        patch = patch.unset(unsetPaths)
      }
      await patch.commit({ autoGenerateArrayKeys: true })
    }
  }

  console.log('\n[migrate-contact-form-overrides] summary')
  console.log(`scanned=${scanned}`)
  console.log(`withContactForm=${withContactForm}`)
  console.log(`changed=${changed}`)
  console.log(`updatedHeading=${updatedHeading}`)
  console.log(`updatedParagraph=${updatedParagraph}`)
  console.log(`removedComponents=${removedComponents}`)
  console.log(`skippedBecauseOverridesPresent=${skippedBecauseOverridesPresent}`)
}

run().catch((error) => {
  console.error('[migrate-contact-form-overrides] failed')
  console.error(error)
  process.exit(1)
})
