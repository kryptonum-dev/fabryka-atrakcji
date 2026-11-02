import type { Transaction } from '@sanity/client'
import {
  commitInBatches,
  createMigrationClient,
  fetchEnTwins,
  runScript,
  translationMetadata,
  withDraft,
  type KeyedReference,
} from './shared'

// One-time migration of the client's curated amenities. Run it once, then leave it: "Teren outdoor" is a real
// option from here on, and a later run would move any hotel the client assigns to it back to "Basen".
//
// - repoints "Spa" to "SPA / Wellness" and "Dostęp do jeziora" to "Nad jeziorem / plaża"
// - moves "Teren outdoor" hotels, which got the option when it still meant an outdoor pool, to "Basen"
// - creates the missing EN twins, and renames the two EN twins whose PL document was renamed
// - points EN hotels at EN documents for the curated amenities only
// - aligns EN hotel capacities to the PL value
//
// Existing drafts of hotels get the same changes.
//
//   dotenv -- bun apps/sanity/scripts/filters-upsell/migrate-amenities.ts [--apply]

const SCRIPT = 'migrate-amenities'

const NEW_EN_TWINS = [
  { plSlug: 'SPA-wellness', id: 'filters-amenity-spa-wellness-en', name: 'SPA / Wellness', slug: 'spa-wellness' },
  { plSlug: 'wylacznosc', id: 'filters-amenity-exclusive-use-en', name: 'Exclusive use', slug: 'exclusive-use' },
]

const EN_RENAMES = [
  { slug: 'outdoor-pool', name: 'Outdoor team-building area' },
  { slug: 'private-beach', name: 'By the lake / beach' },
]

const CURATED_PL_SLUGS = [
  'SPA-wellness',
  'basen',
  'prywatna-plaza',
  'basen-zewnetrzny',
  'boiska-sportowe',
  'parking',
  'klub-nocny',
  'grill',
  'wylacznosc',
]

const REPOINTED_PL_SLUGS: Record<string, string> = {
  spa: 'SPA-wellness',
  'dostep-do-jeziora': 'prywatna-plaza',
  'basen-zewnetrzny': 'basen',
}

// EN twins of the repointed PL documents. They move with their PL originals.
const REPOINTED_EN_SLUGS: Record<string, string> = {
  'en-spa': 'SPA-wellness',
  'lake-access': 'prywatna-plaza',
  'outdoor-pool': 'basen',
}

const CAPACITY_FIELDS = ['overnight', 'conference', 'banquet'] as const

type Amenity = { _id: string; language: 'pl' | 'en'; name: string; slug: string }
type Capacity = Partial<Record<(typeof CAPACITY_FIELDS)[number], number>>
type Hotel = {
  _id: string
  _rev: string
  language: 'pl' | 'en'
  name: string
  amenities: KeyedReference[]
  maxPeople: Capacity
}

runScript(SCRIPT, async () => {
  const client = createMigrationClient(SCRIPT)

  const amenities = await client.fetch<Amenity[]>(
    `*[_type == "Amenities_Collection" && !(_id in path("drafts.**"))]{ _id, language, name, "slug": slug.current }`
  )
  const hotels = await client.fetch<Hotel[]>(
    `*[_type == "Hotels_Collection"]{ _id, _rev, language, name, amenities, maxPeople }`
  )

  const bySlug = new Map(amenities.map((amenity) => [amenity.slug, amenity]))
  const byId = new Map(amenities.map((amenity) => [amenity._id, amenity]))
  const documentBySlug = (slug: string) => {
    const amenity = bySlug.get(slug)
    if (!amenity) throw new Error(`No amenity with slug ${slug}`)
    return amenity
  }

  const twins = await fetchEnTwins(client, 'Amenities_Collection', new Set(byId.keys()))
  const enTwinId = (plSlug: string) => {
    const created = NEW_EN_TWINS.find((twin) => twin.plSlug === plSlug)
    const id = created?.id ?? twins.get(documentBySlug(plSlug)._id)
    if (!id) throw new Error(`No EN twin for ${plSlug}`)
    return id
  }

  const existingIds = new Set(byId.keys())
  const twinsToCreate = NEW_EN_TWINS.filter((twin) => !existingIds.has(twin.id))
  const renames = EN_RENAMES.flatMap(({ slug, name }) => {
    const amenity = bySlug.get(slug)
    if (!amenity) throw new Error(`No amenity with slug ${slug}`)
    return amenity.name === name ? [] : [{ amenity, name }]
  })

  for (const twin of twinsToCreate) console.log(`- create EN amenity ${twin.id} "${twin.name}"`)
  for (const { amenity, name } of renames) console.log(`- rename ${amenity._id} "${amenity.name}" -> "${name}"`)

  // Every amenity id a hotel of each language must end up on instead of the id it has now.
  const plTargets = new Map(
    Object.entries(REPOINTED_PL_SLUGS).map(([from, to]) => [documentBySlug(from)._id, documentBySlug(to)._id])
  )

  const enTargets = new Map<string, string>()
  for (const plSlug of CURATED_PL_SLUGS) enTargets.set(documentBySlug(plSlug)._id, enTwinId(plSlug))
  for (const [from, to] of Object.entries(REPOINTED_PL_SLUGS)) enTargets.set(documentBySlug(from)._id, enTwinId(to))
  for (const [from, to] of Object.entries(REPOINTED_EN_SLUGS)) enTargets.set(documentBySlug(from)._id, enTwinId(to))

  const hotelChanges = hotels.flatMap((hotel) => {
    const targets = hotel.language === 'pl' ? plTargets : enTargets
    const seen = new Set<string>()
    const current = hotel.amenities ?? []
    const next = current.flatMap((item) => {
      const ref = targets.get(item._ref) ?? item._ref
      if (seen.has(ref)) return []
      seen.add(ref)
      return [{ ...item, _ref: ref }]
    })

    const isChanged = next.length !== current.length || next.some((item, index) => item._ref !== current[index]._ref)
    return isChanged ? [{ hotel, next }] : []
  })

  const label = (id: string) => byId.get(id)?.name.trim() ?? NEW_EN_TWINS.find((twin) => twin.id === id)?.name ?? id

  for (const { hotel, next } of hotelChanges) {
    const removed = hotel.amenities.filter((item) => !next.some((entry) => entry._ref === item._ref))
    const added = next.filter((item) => !hotel.amenities.some((entry) => entry._ref === item._ref))
    console.log(
      `- [${hotel.language}] ${hotel.name.trim()}: -${removed.map((item) => label(item._ref)).join(', -')}` +
        ` +${added.map((item) => label(item._ref)).join(', +')}`
    )
  }

  const hotelsById = new Map(hotels.map((hotel) => [hotel._id, hotel]))
  const hotelTwins = await fetchEnTwins(client, 'Hotels_Collection', new Set(hotelsById.keys()))

  const capacityChanges = [...hotelTwins].flatMap(([plId, enId]) => {
    const pl = hotelsById.get(plId)
    if (!pl) return []

    return withDraft(enId, hotelsById).flatMap((targetId) => {
      const en = hotelsById.get(targetId) as Hotel
      const fields = Object.fromEntries(
        CAPACITY_FIELDS.filter((field) => pl.maxPeople?.[field] !== en.maxPeople?.[field]).map((field) => [
          `maxPeople.${field}`,
          pl.maxPeople?.[field],
        ])
      )
      return Object.keys(fields).length > 0 ? [{ en, pl, fields }] : []
    })
  })

  for (const { en, pl, fields } of capacityChanges) {
    const summary = Object.entries(fields)
      .map(([path, value]) => {
        const field = path.replace('maxPeople.', '') as (typeof CAPACITY_FIELDS)[number]
        return `${field} ${en.maxPeople?.[field]} -> ${value}`
      })
      .join(', ')
    console.log(`- capacity ${pl.name.trim()} (EN): ${summary}`)
  }

  await commitInBatches(client, [
    ...twinsToCreate.flatMap((twin) => [
      (transaction: Transaction) =>
        transaction.createIfNotExists({
          _id: twin.id,
          _type: 'Amenities_Collection',
          language: 'en',
          name: twin.name,
          slug: { _type: 'slug', current: twin.slug },
        }),
      (transaction: Transaction) =>
        transaction.createIfNotExists(
          translationMetadata(twin.id.replace(/-en$/, '-meta'), 'Amenities_Collection', {
            pl: documentBySlug(twin.plSlug)._id,
            en: twin.id,
          })
        ),
    ]),
    ...renames.map(
      ({ amenity, name }) =>
        (transaction: Transaction) =>
          transaction.patch(amenity._id, (patch) => patch.set({ name }))
    ),
    ...hotelChanges.map(
      ({ hotel, next }) =>
        (transaction: Transaction) =>
          transaction.patch(hotel._id, (patch) => patch.ifRevisionId(hotel._rev).set({ amenities: next }))
    ),
    // No revision guard here: the same EN hotel may already have been patched above in this run.
    ...capacityChanges.map(
      ({ en, fields }) =>
        (transaction: Transaction) =>
          transaction.patch(en._id, (patch) => patch.set(fields))
    ),
  ])

  return twinsToCreate.length + renames.length + hotelChanges.length + capacityChanges.length
})
