import { createClient } from '@sanity/client'
import { API_VERSION, DATASET, PROJECT_ID } from '../constants'

type PortableTextValue = Record<string, unknown>[]

type ContactFormComponent = {
  _type: 'ContactForm'
  _key?: string
  heading?: PortableTextValue
  paragraph?: PortableTextValue
}

type MigratedDocument = {
  _id: string
  _type: 'ActivitiesCategory_Collection' | 'Activities_Collection' | 'Hotels_Collection'
  name?: string
  language?: string
  slug?: string
  formOverrides?: {
    heading?: PortableTextValue
    paragraph?: PortableTextValue
  }
  contactForms?: ContactFormComponent[]
}

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
    _type in ["ActivitiesCategory_Collection", "Activities_Collection", "Hotels_Collection"]
    && (${includeDrafts ? 'true' : '!(_id in path("drafts.**"))'})
  ]{
    _id,
    _type,
    name,
    language,
    "slug": slug.current,
    formOverrides,
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

  for (const doc of documents) {
    scanned += 1

    const sourceContactForm = (doc.contactForms || []).find(
      (component) => hasPortableTextContent(component.heading) || hasPortableTextContent(component.paragraph)
    )

    if (!sourceContactForm) {
      continue
    }

    withContactForm += 1

    const shouldSetHeading =
      hasPortableTextContent(sourceContactForm.heading) && (force || !hasPortableTextContent(doc.formOverrides?.heading))
    const shouldSetParagraph =
      hasPortableTextContent(sourceContactForm.paragraph) &&
      (force || !hasPortableTextContent(doc.formOverrides?.paragraph))

    if (
      !force &&
      (hasPortableTextContent(doc.formOverrides?.heading) || hasPortableTextContent(doc.formOverrides?.paragraph))
    ) {
      const blockedHeading = hasPortableTextContent(doc.formOverrides?.heading) && hasPortableTextContent(sourceContactForm.heading)
      const blockedParagraph =
        hasPortableTextContent(doc.formOverrides?.paragraph) && hasPortableTextContent(sourceContactForm.paragraph)
      if (blockedHeading || blockedParagraph) {
        skippedBecauseOverridesPresent += 1
      }
    }

    const setPayload: Record<string, PortableTextValue> = {}
    if (shouldSetHeading && sourceContactForm.heading) {
      setPayload['formOverrides.heading'] = sourceContactForm.heading
      updatedHeading += 1
    }
    if (shouldSetParagraph && sourceContactForm.paragraph) {
      setPayload['formOverrides.paragraph'] = sourceContactForm.paragraph
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
