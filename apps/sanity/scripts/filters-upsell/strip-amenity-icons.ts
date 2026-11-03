import type { Transaction } from '@sanity/client'
import { commitInBatches, createMigrationClient, runScript, toPublishedId, withDraft } from './shared'

// Removes the decorative icons the client typed in front of amenity names ("♨  SPA / Wellness", "P  Parking /
// autokar") and the stray spaces they left. Only `name` changes; slugs stay as they are. Safe to run again: a
// clean name produces no patch.
//
//   dotenv -- bun apps/sanity/scripts/filters-upsell/strip-amenity-icons.ts [--apply]

const SCRIPT = 'strip-amenity-icons'

const ICON = String.raw`[\p{S}\p{Extended_Pictographic}\u{FE0F}\u{200D}]+`
const LEADING_ICON = new RegExp(String.raw`^\s*${ICON}\s*`, 'u')
const TRAILING_ICON = new RegExp(String.raw`\s*${ICON}\s*$`, 'u')
// A single letter used as an icon, like the "P" in "P  Parking / autokar": the word after it starts with the same
// letter, so a real one-letter word ("A la carte") is never removed.
const LETTER_ICON = /^(\p{L})\s+(?=\1)/iu

export const stripIcons = (name: string) =>
  name.replace(LEADING_ICON, '').replace(TRAILING_ICON, '').replace(LETTER_ICON, '').replace(/\s+/g, ' ').trim()

type Amenity = { _id: string; _rev: string; language?: string; name?: string }

runScript(SCRIPT, async () => {
  const client = createMigrationClient(SCRIPT)

  const amenities = await client.fetch<Amenity[]>(`*[_type == "Amenities_Collection"]{ _id, _rev, language, name }`)
  const byId = new Map(amenities.map((amenity) => [amenity._id, amenity]))
  const publishedIds = [...new Set(amenities.map((amenity) => toPublishedId(amenity._id)))].sort()

  const changes = publishedIds.flatMap((id) =>
    withDraft(id, byId).flatMap((targetId) => {
      const amenity = byId.get(targetId) as Amenity
      if (typeof amenity.name !== 'string') return []
      const name = stripIcons(amenity.name)
      return name && name !== amenity.name ? [{ amenity, name }] : []
    })
  )

  for (const { amenity, name } of changes) {
    console.log(
      `- [${amenity.language ?? '?'}] ${amenity._id}: ${JSON.stringify(amenity.name)} -> ${JSON.stringify(name)}`
    )
  }

  await commitInBatches(
    client,
    changes.map(
      ({ amenity, name }) =>
        (transaction: Transaction) =>
          transaction.patch(amenity._id, (patch) => patch.ifRevisionId(amenity._rev).set({ name }))
    )
  )

  return changes.length
})
