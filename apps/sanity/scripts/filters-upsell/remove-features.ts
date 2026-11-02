import { commitInBatches, createMigrationClient, runScript } from './shared'

// Clears the old filter data: `features` on event spaces and `areaFilterOptions` on the event spaces page, drafts
// included. Export the dataset first, because a restore is the only way back. The feature documents themselves are
// listed in cleanup-deletions.ts.
//
//   dotenv -- bun apps/sanity/scripts/filters-upsell/remove-features.ts [--apply]

const SCRIPT = 'remove-features'

const TARGETS = [
  { type: 'EventSpaces_Collection', field: 'features' },
  { type: 'EventSpaces_Page', field: 'areaFilterOptions' },
]

type Row = { _id: string; _rev: string; label?: string; language?: string }

runScript(SCRIPT, async () => {
  const client = createMigrationClient(SCRIPT)
  const changes: { id: string; rev: string; field: string }[] = []

  for (const { type, field } of TARGETS) {
    const rows = await client.fetch<Row[]>(
      `*[_type == $type && defined(${field})]{ _id, _rev, "label": coalesce(name, _type), language }`,
      { type }
    )

    for (const { _id, _rev, label, language } of rows) {
      console.log(`- ${_id} [${language}] ${label}: unset ${field}`)
      changes.push({ id: _id, rev: _rev, field })
    }
  }

  await commitInBatches(
    client,
    changes.map(
      ({ id, rev, field }) =>
        (transaction) =>
          transaction.patch(id, (patch) => patch.ifRevisionId(rev).unset([field]))
    )
  )

  return changes.length
})
