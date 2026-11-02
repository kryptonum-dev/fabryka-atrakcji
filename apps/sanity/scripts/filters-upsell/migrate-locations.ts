import type { Transaction } from '@sanity/client'
import {
  commitInBatches,
  createMigrationClient,
  fetchEnTwins,
  reference,
  runScript,
  toPublishedId,
  translationMetadata,
} from './shared'

// - creates "Warszawa i okolice" with an EN twin and moves all event spaces to it
// - merges the two "Warszawa i Mazowsze" documents into the one the hotels and the global form settings use
// - points the EN hotels that reference PL locations at EN locations
//
// The merged-away document stays in the dataset. It is listed in cleanup-deletions.ts. Existing drafts of hotels
// get the same changes.
//
//   dotenv -- bun apps/sanity/scripts/filters-upsell/migrate-locations.ts [--apply]

const SCRIPT = 'migrate-locations'

const SPACE_LOCATION = {
  pl: { id: 'filters-location-warszawa-i-okolice-pl', name: 'Warszawa i okolice', slug: 'warszawa-i-okolice' },
  en: { id: 'filters-location-warszawa-i-okolice-en', name: 'Warsaw area', slug: 'warsaw-area' },
} as const
const SPACE_LOCATION_METADATA = 'filters-location-warszawa-i-okolice-meta'

const MERGED_LOCATION_ID = '86b35d20-45d1-434a-acda-8e04d82b9f33'
const SURVIVING_LOCATION_ID = 'c3e1eb58-9f08-4d99-b90a-ab17f8a04d0a'

// PL and EN regions are not linked in the dataset. EN hotels take the EN region of their PL twin.
const EN_REGION_BY_PL_SLUG: Record<string, string> = {
  'centralna-polska': 'central-poland-warsaw',
  'warszawa-i-mazowsze': 'central-poland-warsaw',
  'jura-i-wyzyny': 'krakow-jura-uplands',
  'mazury-i-pojezierze': 'masuria-lakelands',
}

type Location = { _id: string; language: 'pl' | 'en'; name: string; slug: string }
type LocatedObject = { _id: string; _rev: string; language: 'pl' | 'en'; name: string; location: { _ref: string } }

runScript(SCRIPT, async () => {
  const client = createMigrationClient(SCRIPT)

  const locations = await client.fetch<Location[]>(
    `*[_type == "Locations_Collection" && !(_id in path("drafts.**"))]{ _id, language, name, "slug": slug.current }`
  )
  const spaces = await client.fetch<LocatedObject[]>(
    `*[_type == "EventSpaces_Collection" && !(_id in path("drafts.**"))]{ _id, _rev, language, name, location }`
  )
  const hotels = await client.fetch<LocatedObject[]>(
    `*[_type == "Hotels_Collection"]{ _id, _rev, language, name, location }`
  )

  const locationsById = new Map(locations.map((location) => [location._id, location]))
  const locationsBySlug = new Map(locations.map((location) => [location.slug, location]))
  const hotelsById = new Map(hotels.map((hotel) => [hotel._id, hotel]))
  const hotelTwins = await fetchEnTwins(client, 'Hotels_Collection', new Set(hotelsById.keys()))
  const plTwinOf = new Map([...hotelTwins].map(([pl, en]) => [en, pl]))

  const hasSpaceLocation = locationsById.has(SPACE_LOCATION.pl.id) && locationsById.has(SPACE_LOCATION.en.id)
  if (!hasSpaceLocation) console.log(`- create Locations_Collection "${SPACE_LOCATION.pl.name}" and EN twin`)

  const spaceMoves = spaces.flatMap((space) => {
    const target = SPACE_LOCATION[space.language].id
    return space.location._ref === target ? [] : [{ object: space, target }]
  })

  const mergedHotelMoves = hotels.flatMap((hotel) =>
    hotel.location._ref === MERGED_LOCATION_ID && hotel.language === 'pl'
      ? [{ object: hotel, target: SURVIVING_LOCATION_ID }]
      : []
  )

  const enHotelMoves = hotels.flatMap((hotel) => {
    if (hotel.language !== 'en' || locationsById.get(hotel.location._ref)?.language !== 'pl') return []

    const plTwin = hotelsById.get(plTwinOf.get(toPublishedId(hotel._id)) ?? '')
    const plSlug = locationsById.get(plTwin?.location._ref ?? hotel.location._ref)?.slug ?? ''
    const target = locationsBySlug.get(EN_REGION_BY_PL_SLUG[plSlug])
    if (!target) throw new Error(`No EN region for ${hotel.name} (${plSlug})`)
    return [{ object: hotel, target: target._id }]
  })

  const moves = [...spaceMoves, ...mergedHotelMoves, ...enHotelMoves]

  for (const { object, target } of moves) {
    const from = locationsById.get(object.location._ref)?.name
    const to = locationsById.get(target)?.name ?? SPACE_LOCATION[object.language].name
    console.log(`- [${object.language}] ${object.name.trim()}: "${from}" -> "${to}"`)
  }

  await commitInBatches(client, [
    ...(hasSpaceLocation
      ? []
      : [
          ...Object.entries(SPACE_LOCATION).map(
            ([language, { id, name, slug }]) =>
              (transaction: Transaction) =>
                transaction.createIfNotExists({
                  _id: id,
                  _type: 'Locations_Collection',
                  language,
                  name,
                  slug: { _type: 'slug', current: slug },
                })
          ),
          (transaction: Transaction) =>
            transaction.createIfNotExists(
              translationMetadata(SPACE_LOCATION_METADATA, 'Locations_Collection', {
                pl: SPACE_LOCATION.pl.id,
                en: SPACE_LOCATION.en.id,
              })
            ),
        ]),
    ...moves.map(
      ({ object, target }) =>
        (transaction: Transaction) =>
          transaction.patch(object._id, (patch) => patch.ifRevisionId(object._rev).set({ location: reference(target) }))
    ),
  ])

  return moves.length + (hasSpaceLocation ? 0 : 3)
})
