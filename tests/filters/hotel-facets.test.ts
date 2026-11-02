import { expect, test } from 'bun:test'
import { hotelFacetGroups, type HotelFacet } from '../../apps/astro/src/utils/hotel-facets'
import { computeFacets } from '../../apps/astro/src/utils/listing-facets'
import { parseHotelParams } from '../../apps/astro/src/utils/listing-params'

const hotel = (_id: string, fields: Partial<HotelFacet> = {}): HotelFacet => ({
  _id,
  location: 'mazury',
  stars: 4,
  amenities: [],
  surroundings: [],
  maxPeople: { overnight: 100, conference: 100, banquet: 100 },
  distanceKm: null,
  ...fields,
})

const options = {
  locations: [{ slug: 'mazury' }, { slug: 'jura' }],
  surroundings: [{ slug: 'gory' }, { slug: 'nad-morzem' }],
  amenities: [{ slug: 'basen' }, { slug: 'spa' }],
  participantRanges: [
    { min: 1, max: 100 },
    { min: 101, max: 200 },
    { min: 501, max: null },
  ],
  distanceRadii: [25, 50],
}

const facets = (items: HotelFacet[], query: string) =>
  computeFacets(items, hotelFacetGroups(parseHotelParams(new URLSearchParams(query)), options))

test('regions combine with OR, and other filters narrow them with AND', () => {
  const items = [hotel('a'), hotel('b', { location: 'jura' }), hotel('c', { location: 'jura', stars: 5 })]

  expect(facets(items, 'location=mazury,jura').matchingIds).toEqual(['a', 'b', 'c'])
  expect(facets(items, 'location=mazury,jura&stars=5').matchingIds).toEqual(['c'])
})

test('a 500-person hotel matches 101-200 but not 501-', () => {
  const items = [hotel('big', { maxPeople: { overnight: 500 } }), hotel('small')]

  expect(facets(items, 'overnight=101-200').matchingIds).toEqual(['big'])
  expect(facets(items, 'overnight=501-').matchingIds).toEqual([])
})

test('each participant parameter reads its own capacity', () => {
  const items = [hotel('banquet', { maxPeople: { overnight: 50, conference: 50, banquet: 600 } })]

  expect(facets(items, 'banquet=501-').matchingIds).toEqual(['banquet'])
  expect(facets(items, 'conference=501-').matchingIds).toEqual([])
})

test('amenities must all be present, and only curated ones count', () => {
  const items = [hotel('both', { amenities: ['basen', 'spa'] }), hotel('one', { amenities: ['basen', 'sauna'] })]

  expect(facets(items, 'amenities=basen,spa').matchingIds).toEqual(['both'])
  expect(facets(items, 'amenities=sauna').matchingIds).toEqual(['both', 'one'])
})

test('a hotel with no official category matches stars 0', () => {
  const result = facets([hotel('none', { stars: 0 }), hotel('four')], 'stars=0')

  expect(result.matchingIds).toEqual(['none'])
  expect(result.counts.stars).toEqual({ '5': 0, '4': 1, '3': 0, '2': 0, '1': 0, '0': 1 })
})

test('the radius keeps hotels at or inside it, and drops hotels with no distance', () => {
  const items = [hotel('at', { distanceKm: 25 }), hotel('out', { distanceKm: 25.1 }), hotel('unknown')]

  expect(facets(items, 'city=warszawa&radius=25').matchingIds).toEqual(['at'])
})

test('a radius outside the configured list is ignored', () => {
  const items = [hotel('far', { distanceKm: 900 })]

  expect(facets(items, 'city=warszawa&radius=75').matchingIds).toEqual(['far'])
})
