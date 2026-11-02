import { LexoRank } from 'lexorank'
import { OPTION_GROUPS, optionId, optionMetadataId } from './options'
import { commitInBatches, createMigrationClient, runScript, translationMetadata, type Language } from './shared'

// Creates the option documents and cities in both languages. A document that already exists is left alone,
// so editors keep their changes when this runs again.
//
//   dotenv -- bun apps/sanity/scripts/filters-upsell/seed-options.ts [--apply]

const SCRIPT = 'seed-options'
const LANGUAGES: Language[] = ['pl', 'en']

runScript(SCRIPT, async () => {
  const client = createMigrationClient(SCRIPT)

  const documents = OPTION_GROUPS.flatMap(({ kind, schemaType, options }) => {
    let rank = LexoRank.min()

    return options.flatMap(({ slug, enSlug, name, point }) => {
      rank = rank.genNext().genNext()
      const orderRank = rank.toString()

      const localized = LANGUAGES.map((language) => ({
        _id: optionId(kind, slug, language),
        _type: schemaType,
        language,
        name: name[language],
        slug: { _type: 'slug', current: language === 'pl' ? slug : enSlug },
        orderRank,
        ...(point && { point: { _type: 'geopoint', ...point } }),
      }))

      const metadata = translationMetadata(optionMetadataId(kind, slug), schemaType, {
        pl: optionId(kind, slug, 'pl'),
        en: optionId(kind, slug, 'en'),
      })

      return [...localized, metadata]
    })
  })

  const existing = new Set(
    await client.fetch<string[]>('*[_id in $ids]._id', { ids: documents.map((document) => document._id) })
  )
  const missing = documents.filter((document) => !existing.has(document._id))

  for (const document of missing) {
    console.log(`- create ${document._type}:${document._id}`)
  }

  await commitInBatches(
    client,
    missing.map((document) => (transaction) => transaction.createIfNotExists(document))
  )

  return missing.length
})
