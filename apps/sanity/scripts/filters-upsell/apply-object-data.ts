import { optionId } from './options'
import {
  commitInBatches,
  createMigrationClient,
  fetchEnTwins,
  isSameJson,
  keyedReference,
  readData,
  reference,
  runScript,
  withDraft,
  type KeyedReference,
  type Language,
} from './shared'

// Writes surroundings to hotels, and capacities, event types, characters and facilities to spaces, from
// data/hotels.json and data/spaces.json. PL values are mapped to EN documents for each EN twin. Existing drafts get
// the same values.
//
//   dotenv -- bun apps/sanity/scripts/filters-upsell/apply-object-data.ts [--apply]

const SCRIPT = 'apply-object-data'

// EN documents with no PL twin, mapped to the PL document of the same hotel.
const ENGLISH_ORPHANS = {
  // Published duplicate of Głęboczek Vine Resort.
  'd73d889d-9cb9-487b-88b9-28b12264ad6d': 'c02f9411-6c5f-4a23-a72e-8394830483f9',
  // Never published draft of Novotel Gdańsk Marina.
  '8d7020db-667d-4f3b-9e2d-36b95c2dab7a': '1544b53a-f12f-4b04-b33a-5c6c97f35075',
}

type HotelData = Record<string, { name: string; surroundings: string[] }>
type SpaceData = Record<
  string,
  {
    name: string
    capacities: { spaceType: string; maxPeople: number }[]
    eventTypes: string[]
    characters: string[]
    facilities: string[]
  }
>

type HotelRow = { _id: string; _rev: string; name: string; surroundings?: KeyedReference[] }
type SpaceRow = {
  _id: string
  _rev: string
  name: string
  capacities?: unknown[]
  eventTypes?: KeyedReference[]
  characters?: KeyedReference[]
  facilities?: KeyedReference[]
}

type Change = { id: string; rev: string; label: string; fields: Record<string, unknown> }

const references = (kind: Parameters<typeof optionId>[0], slugs: string[], language: Language) =>
  slugs.map((slug) => keyedReference(optionId(kind, slug, language), slug))

const toHotelFields = (hotel: HotelData[string], language: Language) => ({
  surroundings: references('surroundings', hotel.surroundings, language),
})

const toSpaceFields = (space: SpaceData[string], language: Language) => ({
  capacities: space.capacities.map(({ spaceType, maxPeople }) => ({
    _key: spaceType,
    _type: 'capacityEntry',
    spaceType: reference(optionId('space-type', spaceType, language)),
    maxPeople,
  })),
  eventTypes: references('event-type', space.eventTypes, language),
  characters: references('character', space.characters, language),
  facilities: references('facility', space.facilities, language),
})

const changedFields = <T extends Record<string, unknown>>(current: Record<string, unknown>, desired: T) =>
  Object.fromEntries(Object.entries(desired).filter(([field, value]) => !isSameJson(current[field], value)))

runScript(SCRIPT, async () => {
  const client = createMigrationClient(SCRIPT)
  const hotelData = readData<HotelData>('hotels.json')
  const spaceData = readData<SpaceData>('spaces.json')

  const hotels = await client.fetch<HotelRow[]>(`*[_type == "Hotels_Collection"]{ _id, _rev, name, surroundings }`)
  const spaces = await client.fetch<SpaceRow[]>(
    `*[_type == "EventSpaces_Collection"]{ _id, _rev, name, capacities, eventTypes, characters, facilities }`
  )

  const hotelsById = new Map(hotels.map((hotel) => [hotel._id, hotel]))
  const spacesById = new Map(spaces.map((space) => [space._id, space]))
  const hotelTwins = await fetchEnTwins(client, 'Hotels_Collection', new Set(hotelsById.keys()))
  const spaceTwins = await fetchEnTwins(client, 'EventSpaces_Collection', new Set(spacesById.keys()))

  const collect = <Row extends { _id: string; _rev: string; name: string }>(
    rows: Map<string, Row>,
    id: string,
    desired: Record<string, unknown>
  ): Change[] => {
    const ids = withDraft(id, rows)
    if (ids.length === 0) throw new Error(`No object with id ${id}`)

    return ids.flatMap((targetId) => {
      const row = rows.get(targetId) as Row
      const fields = changedFields(row as unknown as Record<string, unknown>, desired)
      if (Object.keys(fields).length === 0) return []
      return [{ id: targetId, rev: row._rev, label: row.name.trim(), fields }]
    })
  }

  const hotelChanges = Object.entries(hotelData).flatMap(([id, hotel]) => {
    const twin = hotelTwins.get(id)
    return [
      ...collect(hotelsById, id, toHotelFields(hotel, 'pl')),
      ...(twin ? collect(hotelsById, twin, toHotelFields(hotel, 'en')) : []),
    ]
  })

  const orphanChanges = Object.entries(ENGLISH_ORPHANS).flatMap(([id, plId]) =>
    collect(hotelsById, id, toHotelFields(hotelData[plId], 'en'))
  )

  const spaceChanges = Object.entries(spaceData).flatMap(([id, space]) => {
    const twin = spaceTwins.get(id)
    return [
      ...collect(spacesById, id, toSpaceFields(space, 'pl')),
      ...(twin ? collect(spacesById, twin, toSpaceFields(space, 'en')) : []),
    ]
  })

  const changes = [...hotelChanges, ...orphanChanges, ...spaceChanges]

  for (const { id, label, fields } of changes) {
    console.log(`- ${id} ${label}: ${Object.keys(fields).join(', ')}`)
  }

  await commitInBatches(
    client,
    changes.map(
      ({ id, rev, fields }) =>
        (transaction) =>
          transaction.patch(id, (patch) => patch.ifRevisionId(rev).set(fields))
    )
  )

  return changes.length
})
