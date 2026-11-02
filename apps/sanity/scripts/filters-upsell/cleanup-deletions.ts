import { commitInBatches, createMigrationClient, runScript } from './shared'

// Documents this change leaves behind. Dry-run by default. Deleting is permanent, so a person runs --apply,
// after checking the list below. A document that something still references is skipped.
//
//   dotenv -- bun apps/sanity/scripts/filters-upsell/cleanup-deletions.ts [--apply]
//
// After --apply, remove EventSpaceFeatures_Collection from excludedTypes in
// apps/astro/src/pages/sitemap-index.xml.ts. The entry keeps the feature slugs out of the sitemap until then.

const SCRIPT = 'cleanup-deletions'

const FEATURE_REASON = 'Old event space feature, unset everywhere by remove-features.ts'

const DELETIONS = [
  {
    id: '86b35d20-45d1-434a-acda-8e04d82b9f33',
    reason: 'Second "Warszawa i Mazowsze" location, merged by migrate-locations.ts',
  },
  { id: '399ef4a7-dd39-4b87-b0e1-fbf49f9d7494', reason: `${FEATURE_REASON}: Integracja` },
  { id: '580e2a4b-a181-4593-b3c2-c09e23356d8b', reason: `${FEATURE_REASON}: Loft` },
  { id: '675b7639-6757-4203-819b-07ca81de723e', reason: `${FEATURE_REASON}: Gala` },
  { id: '8f17c091-7660-43dd-9515-a0035893f42e', reason: `${FEATURE_REASON}: Indoor` },
  { id: 'c02037ca-2426-4275-9650-630e829b7eb6', reason: `${FEATURE_REASON}: Eleganckie` },
  { id: 'c98d089d-fb4a-4e0a-acc4-4d2c95588211', reason: `${FEATURE_REASON}: natura` },
  { id: 'cb4dfb83-b7ee-4cee-ad9b-019cf971f7aa', reason: `${FEATURE_REASON}: Outdoor` },
  { id: 'cd19b27a-5386-4b8a-bdb1-b96f7b4c45bd', reason: `${FEATURE_REASON}: Event plenerowy` },
  { id: 'f932e6bf-dfa9-47a9-9ca1-08eab221db95', reason: `${FEATURE_REASON}: Konferencja` },
]

runScript(SCRIPT, async () => {
  const client = createMigrationClient(SCRIPT)
  const deletable: string[] = []

  for (const { id, reason } of DELETIONS) {
    const document = await client.getDocument(id)
    if (!document) {
      console.log(`- ${id}: already gone`)
      continue
    }

    const referencedBy = await client.fetch<string[]>('*[references($id)]._id', { id })
    if (referencedBy.length > 0) {
      console.log(`- ${id}: SKIPPED, still referenced by ${referencedBy.join(', ')}`)
      continue
    }

    console.log(`- ${id} (${document._type}): ${reason}`)
    deletable.push(id)
  }

  await commitInBatches(
    client,
    deletable.map((id) => (transaction) => transaction.delete(id))
  )

  return deletable.length
})
