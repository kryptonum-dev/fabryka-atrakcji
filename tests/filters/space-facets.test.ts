import { expect, test } from 'bun:test'
import { computeFacets } from '../../apps/astro/src/utils/listing-facets'
import { parseSpaceParams } from '../../apps/astro/src/utils/listing-params'
import { spaceFacetGroups, spaceOrder, type SpaceFacet } from '../../apps/astro/src/utils/space-facets'

const space = (_id: string, fields: Partial<SpaceFacet> = {}): SpaceFacet => ({
  _id,
  location: 'warszawa',
  eventTypes: [],
  characters: [],
  facilities: [],
  capacities: [{ type: 'wnetrze', maxPeople: 100 }],
  distanceKm: null,
  ...fields,
})

const options = {
  locations: [{ slug: 'warszawa' }, { slug: 'krakow' }],
  spaceTypes: [{ slug: 'wnetrze' }, { slug: 'plener' }],
  eventTypes: [{ slug: 'konferencja' }, { slug: 'gala' }],
  characters: [{ slug: 'loft' }, { slug: 'zabytkowa' }],
  facilities: [{ slug: 'techniczne' }, { slug: 'kuchenne' }],
  capacityFilterOptions: [
    { min: 1, max: 50 },
    { min: 51, max: 100 },
    { min: 151, max: null },
  ],
  distanceRadii: [1, 5],
}

const facets = (items: SpaceFacet[], query: string) =>
  computeFacets(items, spaceFacetGroups(parseSpaceParams(new URLSearchParams(query)), options))

const mixed = space('mixed', {
  capacities: [
    { type: 'plener', maxPeople: 1000 },
    { type: 'wnetrze', maxPeople: 130 },
  ],
})

test('a mixed object matches mixed and each of its single types', () => {
  const items = [space('indoor'), space('outdoor', { capacities: [{ type: 'plener', maxPeople: 300 }] }), mixed]

  expect(facets(items, 'spaceType=mixed').matchingIds).toEqual(['mixed'])
  expect(facets(items, 'spaceType=plener').matchingIds).toEqual(['outdoor', 'mixed'])
  expect(facets(items, 'spaceType=wnetrze').matchingIds).toEqual(['indoor', 'mixed'])
})

test('capacity reads the figure of its own space type', () => {
  expect(facets([mixed], 'capacity_plener=151-').matchingIds).toEqual(['mixed'])
  expect(facets([mixed], 'capacity_wnetrze=151-').matchingIds).toEqual([])
})

test('a space type a space does not have never matches its capacity filter', () => {
  expect(facets([space('indoor')], 'capacity_plener=1-50').matchingIds).toEqual([])
})

test('capacity ranges match when the maximum reaches the lower bound, and combine with OR', () => {
  const items = [space('small', { capacities: [{ type: 'wnetrze', maxPeople: 40 }] }), space('big')]

  expect(facets(items, 'capacity_wnetrze=51-100').matchingIds).toEqual(['big'])
  expect(facets(items, 'capacity_wnetrze=1-50').matchingIds).toEqual(['small', 'big'])
  expect(facets(items, 'capacity_wnetrze=1-50,151-').matchingIds).toEqual(['small', 'big'])
})

test('capacity filters of different types combine with AND', () => {
  const items = [mixed, space('indoor', { capacities: [{ type: 'wnetrze', maxPeople: 200 }] })]

  expect(facets(items, 'capacity_wnetrze=51-100&capacity_plener=151-').matchingIds).toEqual(['mixed'])
})

test('a new space type works without a code change', () => {
  const groups = spaceFacetGroups(parseSpaceParams(new URLSearchParams('capacity_dach=151-')), {
    ...options,
    spaceTypes: [...options.spaceTypes, { slug: 'dach' }],
  })
  const items = [space('roof', { capacities: [{ type: 'dach', maxPeople: 200 }] }), space('indoor')]

  expect(computeFacets(items, groups).matchingIds).toEqual(['roof'])
})

test('an unknown capacity type or range is ignored', () => {
  const items = [space('a'), space('b')]

  expect(facets(items, 'capacity_dach=151-').matchingIds).toEqual(['a', 'b'])
  expect(facets(items, 'capacity_wnetrze=7-8').matchingIds).toEqual(['a', 'b'])
})

test('facilities must all be present', () => {
  const items = [space('both', { facilities: ['techniczne', 'kuchenne'] }), space('one', { facilities: ['kuchenne'] })]

  expect(facets(items, 'facilities=techniczne,kuchenne').matchingIds).toEqual(['both'])
  expect(facets(items, 'facilities=kuchenne').matchingIds).toEqual(['both', 'one'])
})

test('event types and characters combine with OR inside a filter and AND between filters', () => {
  const items = [
    space('a', { eventTypes: ['konferencja'], characters: ['loft'] }),
    space('b', { eventTypes: ['gala'], characters: ['zabytkowa'] }),
  ]

  expect(facets(items, 'eventType=konferencja,gala').matchingIds).toEqual(['a', 'b'])
  expect(facets(items, 'eventType=konferencja,gala&character=zabytkowa').matchingIds).toEqual(['b'])
  expect(facets(items, 'eventType=gala&character=loft').matchingIds).toEqual([])
})

test('a space type count ignores its own selection, and mixed is counted', () => {
  const items = [space('indoor'), mixed]
  const { counts } = facets(items, 'spaceType=mixed')

  expect(counts.spaceType).toEqual({ wnetrze: 2, plener: 1, mixed: 1 })
})

test('capacity counts are keyed by the parameter name of each type', () => {
  const { counts } = facets([mixed], '')

  expect(counts.capacity_plener['151-']).toBe(1)
  expect(counts.capacity_wnetrze['151-']).toBe(0)
})

test('an object with no capacities matches no type or capacity filter', () => {
  const items = [space('empty', { capacities: null })]

  expect(facets(items, 'spaceType=wnetrze').matchingIds).toEqual([])
  expect(facets(items, 'spaceType=mixed').matchingIds).toEqual([])
  expect(facets(items, 'capacity_wnetrze=1-50').matchingIds).toEqual([])
  expect(facets(items, '').matchingIds).toEqual(['empty'])
})

test('removed area and feature parameters do not narrow the listing', () => {
  const items = [space('a'), space('b')]

  expect(facets(items, 'features=loft&minArea=100&maxCapacity=10').matchingIds).toEqual(['a', 'b'])
})

test('distance keeps objects inside the radius and drops objects with no distance', () => {
  const items = [space('near', { distanceKm: 0.5 }), space('far', { distanceKm: 3 }), space('none')]

  expect(facets(items, 'lat=52.23&lng=21&radius=1').matchingIds).toEqual(['near'])
})

test('a point sorts nearest first unless the visitor picked another order', () => {
  expect(spaceOrder(null, true)).toBe('distance')
  expect(spaceOrder('distance', true)).toBe('distance')
  expect(spaceOrder('newest', true)).toBe('newest')
})

test('with no point there is no distance to sort by', () => {
  expect(spaceOrder(null, false)).toBe('popularity')
  expect(spaceOrder('distance', false)).toBe('popularity')
  expect(spaceOrder('newest', false)).toBe('newest')
})
