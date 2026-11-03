import type { Transaction } from '@sanity/client'
import { LexoRank } from 'lexorank'
import { commitInBatches, createMigrationClient, runScript, toPublishedId, withDraft } from './shared'

// Gives every location an `orderRank`, so editors can drag regions into order in Studio. Before this, the filters
// listed regions in GROQ's default order, by `_id`, so the ranks follow `_id` and the filters look the same.
// A location that already has a rank keeps it, and its draft gets the same one. Unranked locations go after the
// ranked ones. Safe to run again: once every document has a rank there is nothing to patch.
//
//   dotenv -- bun apps/sanity/scripts/filters-upsell/seed-location-order.ts [--apply]

const SCRIPT = 'seed-location-order'

type Location = { _id: string; _rev: string; language?: string; name?: string; orderRank?: string }

runScript(SCRIPT, async () => {
  const client = createMigrationClient(SCRIPT)

  const locations = await client.fetch<Location[]>(
    `*[_type == "Locations_Collection"]{ _id, _rev, language, name, orderRank }`
  )
  const byId = new Map(locations.map((location) => [location._id, location]))
  const publishedIds = [...new Set(locations.map((location) => toPublishedId(location._id)))].sort()

  const ranks = locations.flatMap(({ orderRank }) => (orderRank ? [LexoRank.parse(orderRank)] : []))
  let rank = ranks.reduce((max, current) => (current.compareTo(max) > 0 ? current : max), LexoRank.min())

  const changes = publishedIds.flatMap((id) => {
    const variants = withDraft(id, byId).map((targetId) => byId.get(targetId) as Location)

    let orderRank = variants.find((location) => location.orderRank)?.orderRank
    if (!orderRank) {
      rank = rank.genNext().genNext()
      orderRank = rank.toString()
    }

    return variants.flatMap((location) => (location.orderRank ? [] : [{ location, orderRank }]))
  })

  for (const { location, orderRank } of changes) {
    console.log(
      `- [${location.language ?? '?'}] ${location._id} ${JSON.stringify(location.name)}: orderRank=${orderRank}`
    )
  }

  await commitInBatches(
    client,
    changes.map(
      ({ location, orderRank }) =>
        (transaction: Transaction) =>
          transaction.patch(location._id, (patch) => patch.ifRevisionId(location._rev).set({ orderRank }))
    )
  )

  return changes.length
})
