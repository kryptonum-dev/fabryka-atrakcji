import { readFileSync } from 'node:fs'
import { createClient, type SanityClient, type Transaction } from '@sanity/client'
import { API_VERSION, DATASET, PROJECT_ID } from '../../constants'

const DATA_DIR = new URL('../../../../context/changes/filters-upsell-hotels-spaces/data/', import.meta.url)

// Sanity rejects very large transactions, and a smaller batch also keeps the revalidation webhook calm.
const TRANSACTION_SIZE = 40

export type Language = 'pl' | 'en'

export type Reference = { _type: 'reference'; _ref: string }
export type KeyedReference = Reference & { _key: string }

export const isApply = process.argv.slice(2).includes('--apply')

export const readData = <T>(fileName: string): T => JSON.parse(readFileSync(new URL(fileName, DATA_DIR), 'utf8')) as T

export const createMigrationClient = (scriptName: string): SanityClient => {
  const token = process.env.SANITY_API_TOKEN
  if (!token) throw new Error('Missing SANITY_API_TOKEN environment variable')

  const projectId = process.env.SANITY_PROJECT_ID || PROJECT_ID
  const dataset = process.env.SANITY_DATASET || DATASET

  console.log(`[${scriptName}] mode=${isApply ? 'apply' : 'dry-run'} project=${projectId} dataset=${dataset}`)
  return createClient({ projectId, dataset, apiVersion: API_VERSION, useCdn: false, token })
}

export const reference = (id: string): Reference => ({ _type: 'reference', _ref: id })

export const keyedReference = (id: string, key: string): KeyedReference => ({ _key: key, ...reference(id) })

const translationValue = (language: Language, id: string, schemaType: string) => ({
  _key: language,
  _type: 'internationalizedArrayReferenceValue',
  value: { _type: 'reference', _ref: id, _weak: true, _strengthenOnPublish: { type: schemaType } },
})

// Same shape the document-internationalization plugin writes when an editor links two documents.
export const translationMetadata = (id: string, schemaType: string, translations: Record<Language, string>) => ({
  _id: id,
  _type: 'translation.metadata',
  schemaTypes: [schemaType],
  translations: [
    translationValue('pl', translations.pl, schemaType),
    translationValue('en', translations.en, schemaType),
  ],
})

type MetadataRow = { translations?: { _key: string; value?: { _ref?: string } }[] }

// Maps each PL document to its EN twin. Metadata can point at deleted documents, so `knownIds` filters those out.
export const fetchEnTwins = async (client: SanityClient, schemaType: string, knownIds: Set<string>) => {
  const rows = await client.fetch<MetadataRow[]>(
    `*[_type == "translation.metadata" && $schemaType in schemaTypes]{ translations }`,
    { schemaType }
  )

  const twins = new Map<string, string>()
  for (const { translations = [] } of rows) {
    const pl = translations.find((item) => item._key === 'pl')?.value?._ref
    const en = translations.find((item) => item._key === 'en')?.value?._ref
    if (pl && en && knownIds.has(pl) && knownIds.has(en)) twins.set(pl, en)
  }
  return twins
}

// The API returns object keys in its own order, so plain JSON.stringify would call equal values different.
const sortKeys = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(sortKeys)
  if (value === null || typeof value !== 'object') return value
  return Object.fromEntries(
    Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => [key, sortKeys(item)])
  )
}

// Studio shows a draft over its published document, and publishing a draft replaces the published fields. So every
// write also goes to an existing draft. The dataset holds a few stale ones from 2025 and 2026.
export const withDraft = (id: string, existingIds: { has: (id: string) => boolean }) =>
  [id, `drafts.${id}`].filter((candidate) => existingIds.has(candidate))

export const toPublishedId = (id: string) => id.replace(/^drafts\./, '')

export const isSameJson = (a: unknown, b: unknown) => JSON.stringify(sortKeys(a)) === JSON.stringify(sortKeys(b))

// Runs every mutation in order, in small transactions. Does nothing on a dry-run.
export const commitInBatches = async (
  client: SanityClient,
  mutations: ((transaction: Transaction) => Transaction)[]
) => {
  if (!isApply) return

  for (let start = 0; start < mutations.length; start += TRANSACTION_SIZE) {
    const batch = mutations.slice(start, start + TRANSACTION_SIZE)
    await batch.reduce((transaction, mutate) => mutate(transaction), client.transaction()).commit()
  }
}

export const runScript = (scriptName: string, run: () => Promise<number>) => {
  run()
    .then((changes) => {
      console.log(`[${scriptName}] ${isApply ? 'applied' : 'would apply'} changes=${changes}`)
    })
    .catch((error) => {
      console.error(`[${scriptName}] failed`)
      console.error(error)
      process.exit(1)
    })
}
