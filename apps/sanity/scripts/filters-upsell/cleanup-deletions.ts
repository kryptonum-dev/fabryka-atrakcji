import { commitInBatches, createMigrationClient, runScript } from './shared'

// Documents this change leaves behind. Dry-run by default. Deleting is permanent, so a person runs --apply,
// after checking the list below. A document that something still references is skipped.
//
//   dotenv -- bun apps/sanity/scripts/filters-upsell/cleanup-deletions.ts [--apply]

const SCRIPT = 'cleanup-deletions'

const DELETIONS = [
  {
    id: '86b35d20-45d1-434a-acda-8e04d82b9f33',
    reason: 'Second "Warszawa i Mazowsze" location, merged by migrate-locations.ts',
  },
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
