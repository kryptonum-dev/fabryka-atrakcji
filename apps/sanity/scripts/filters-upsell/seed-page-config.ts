import { commitInBatches, createMigrationClient, keyedReference, runScript, type Language } from './shared'

// Fills the filter settings on the listing pages and their drafts. A field that already has a value is left alone,
// so editors keep their changes when this runs again. Run migrate-amenities.ts first: it creates two of the EN
// amenities.
//
//   dotenv -- bun apps/sanity/scripts/filters-upsell/seed-page-config.ts [--apply]

const SCRIPT = 'seed-page-config'

const PARTICIPANT_RANGES = [
  { min: 1, max: 100 },
  { min: 101, max: 200 },
  { min: 201, max: 300 },
  { min: 301, max: 500 },
  { min: 501 },
]
const HOTEL_RADII = [25, 50, 100, 150]
const SPACE_RADII = [1, 3, 5, 10, 20, 30]
const VISIBLE_AMENITIES = 4

// The order the client worked through them in Studio on 2 and 5 October 2026.
const CURATED_AMENITIES: { pl: string; en: string }[] = [
  { pl: 'SPA-wellness', en: 'spa-wellness' },
  { pl: 'basen', en: 'swimming-pool' },
  { pl: 'prywatna-plaza', en: 'private-beach' },
  { pl: 'basen-zewnetrzny', en: 'outdoor-pool' },
  { pl: 'boiska-sportowe', en: 'sports-fields' },
  { pl: 'parking', en: 'en-parking' },
  { pl: 'klub-nocny', en: 'night-club' },
  { pl: 'grill', en: 'en-grill' },
  { pl: 'wylacznosc', en: 'exclusive-use' },
]

const HOTEL_COPY: Record<Language, Record<string, unknown>> = {
  pl: {
    filterHeadings: {
      location: 'Region',
      distance: 'Odległość od miasta',
      overnight: 'Liczba uczestników: nocleg',
      conference: 'Liczba uczestników: konferencja',
      banquet: 'Liczba uczestników: bankiet',
      stars: 'Standard',
      amenities: 'Udogodnienia',
      surroundings: 'Otoczenie',
    },
    noCategoryLabel: 'Bez oficjalnej kategoryzacji',
  },
  en: {
    filterHeadings: {
      location: 'Region',
      distance: 'Distance from a city',
      overnight: 'Participants: overnight',
      conference: 'Participants: conference',
      banquet: 'Participants: banquet',
      stars: 'Standard',
      amenities: 'Amenities',
      surroundings: 'Surroundings',
    },
    noCategoryLabel: 'No official category',
  },
}

const SPACE_COPY: Record<Language, Record<string, unknown>> = {
  pl: {
    filterHeadings: {
      location: 'Lokalizacja',
      distance: 'Odległość od adresu',
      addressPlaceholder: 'Wpisz adres, np. Prosta 51, Warszawa',
      spaceType: 'Rodzaj przestrzeni',
      capacityPrefix: 'Liczba uczestników:',
      eventType: 'Typ wydarzenia',
      character: 'Charakter przestrzeni',
      facilities: 'Zaplecze i możliwości',
    },
    mixedSpaceTypeLabel: 'Wnętrze + plener',
  },
  en: {
    filterHeadings: {
      location: 'Location',
      distance: 'Distance from an address',
      addressPlaceholder: 'Enter an address, e.g. Prosta 51, Warsaw',
      spaceType: 'Space type',
      capacityPrefix: 'Participants:',
      eventType: 'Event type',
      character: 'Space character',
      facilities: 'Facilities and options',
    },
    mixedSpaceTypeLabel: 'Indoor + outdoor',
  },
}

type PageRow = { _id: string; _type: 'Hotels_Page' | 'EventSpaces_Page'; language: Language } & Record<string, unknown>

runScript(SCRIPT, async () => {
  const client = createMigrationClient(SCRIPT)

  const pages = await client.fetch<PageRow[]>(`*[_type in ["Hotels_Page", "EventSpaces_Page"]]`)
  const amenities = await client.fetch<{ _id: string; slug: string; language: Language }[]>(
    `*[_type == "Amenities_Collection" && !(_id in path("drafts.**"))]{ _id, language, "slug": slug.current }`
  )

  const amenityId = (slug: string, language: Language) => {
    const amenity = amenities.find((item) => item.slug === slug && item.language === language)
    if (!amenity) throw new Error(`No ${language} amenity with slug ${slug}. Run migrate-amenities.ts first.`)
    return amenity._id
  }

  const desiredFields = ({ _type, language }: PageRow): Record<string, unknown> =>
    _type === 'Hotels_Page'
      ? {
          ...HOTEL_COPY[language],
          participantRanges: PARTICIPANT_RANGES.map((range) => ({
            _key: `range-${range.min}`,
            _type: 'option',
            ...range,
          })),
          distanceRadii: HOTEL_RADII,
          curatedAmenities: CURATED_AMENITIES.map((amenity) =>
            keyedReference(amenityId(amenity[language], language), amenity[language])
          ),
          visibleAmenities: VISIBLE_AMENITIES,
        }
      : { ...SPACE_COPY[language], distanceRadii: SPACE_RADII }

  const changes = pages.flatMap((page) => {
    const missing = Object.entries(desiredFields(page)).filter(([field]) => page[field] === undefined)
    return missing.length > 0 ? [{ page, fields: Object.fromEntries(missing) }] : []
  })

  for (const { page, fields } of changes) {
    console.log(`- ${page._type}:${page._id} [${page.language}]: ${Object.keys(fields).join(', ')}`)
  }

  await commitInBatches(
    client,
    changes.map(
      ({ page, fields }) =>
        (transaction) =>
          transaction.patch(page._id, (patch) => patch.set(fields))
    )
  )

  return changes.length
})
