import { expect, test } from 'bun:test'
import { computeFacets, parseRange, rangeMatches, type FacetGroup } from '../../apps/astro/src/utils/listing-facets'

type Hotel = { _id: string; location: string; stars: number; amenities: string[]; banquet: number }

const hotels: Hotel[] = [
  { _id: 'a', location: 'mazury', stars: 4, amenities: ['spa', 'pool'], banquet: 500 },
  { _id: 'b', location: 'mazury', stars: 5, amenities: ['spa'], banquet: 150 },
  { _id: 'c', location: 'tatry', stars: 4, amenities: ['pool'], banquet: 80 },
  { _id: 'd', location: 'jura', stars: 3, amenities: [], banquet: 600 },
]

const location = (selected: string[] = []): FacetGroup<Hotel> => ({
  key: 'location',
  mode: 'any',
  selected,
  matches: (hotel, value) => hotel.location === value,
  options: ['mazury', 'tatry', 'jura'],
})

const stars = (selected: string[] = []): FacetGroup<Hotel> => ({
  key: 'stars',
  mode: 'any',
  selected,
  matches: (hotel, value) => hotel.stars === Number(value),
  options: ['3', '4', '5'],
})

const amenities = (selected: string[] = []): FacetGroup<Hotel> => ({
  key: 'amenities',
  mode: 'all',
  selected,
  matches: (hotel, value) => hotel.amenities.includes(value),
  options: ['spa', 'pool'],
})

const banquet = (selected: string[] = []): FacetGroup<Hotel> => ({
  key: 'banquet',
  mode: 'any',
  selected,
  matches: (hotel, value) => rangeMatches(hotel.banquet, value),
  options: ['1-100', '101-200', '501-'],
})

test('no selection matches everything and keeps item order', () => {
  const { matchingIds } = computeFacets(hotels, [location(), amenities()])
  expect(matchingIds).toEqual(['a', 'b', 'c', 'd'])
})

test('options inside an any group combine with OR', () => {
  expect(computeFacets(hotels, [location(['mazury', 'tatry'])]).matchingIds).toEqual(['a', 'b', 'c'])
})

test('groups combine with AND', () => {
  expect(computeFacets(hotels, [location(['mazury', 'tatry']), stars(['4'])]).matchingIds).toEqual(['a', 'c'])
})

test('options inside an all group combine with AND', () => {
  expect(computeFacets(hotels, [amenities(['spa', 'pool'])]).matchingIds).toEqual(['a'])
  expect(computeFacets(hotels, [amenities(['spa'])]).matchingIds).toEqual(['a', 'b'])
})

test('any counts ignore their own selection and apply the other groups', () => {
  const { counts } = computeFacets(hotels, [location(['mazury']), stars(['4'])])
  expect(counts.location).toEqual({ mazury: 1, tatry: 1, jura: 0 })
  expect(counts.stars).toEqual({ '3': 0, '4': 1, '5': 1 })
})

test('all counts apply their own selection', () => {
  const { counts } = computeFacets(hotels, [location(), amenities(['spa'])])
  expect(counts.amenities).toEqual({ spa: 2, pool: 1 })
})

test('selected values that are not options are ignored', () => {
  const { matchingIds, counts } = computeFacets(hotels, [location(['atlantis']), amenities(['helipad'])])
  expect(matchingIds).toEqual(['a', 'b', 'c', 'd'])
  expect(counts.location).toEqual({ mazury: 2, tatry: 1, jura: 1 })
  expect(computeFacets(hotels, [location(['atlantis', 'tatry'])]).matchingIds).toEqual(['c'])
})

test('a selection with no match returns no ids and still counts the other options', () => {
  const { matchingIds, counts } = computeFacets(hotels, [location(['jura']), amenities(['spa'])])
  expect(matchingIds).toEqual([])
  expect(counts.location).toEqual({ mazury: 2, tatry: 0, jura: 0 })
})

test('empty input gives empty results with zero counts', () => {
  expect(computeFacets([], [location()])).toEqual({
    matchingIds: [],
    counts: { location: { mazury: 0, tatry: 0, jura: 0 } },
  })
})

test('a range matches when the maximum reaches its lower bound', () => {
  expect(rangeMatches(500, '101-200')).toBe(true)
  expect(rangeMatches(101, '101-200')).toBe(true)
  expect(rangeMatches(100, '101-200')).toBe(false)
})

test('open ranges have no upper bound', () => {
  expect(rangeMatches(501, '501-')).toBe(true)
  expect(rangeMatches(1300, '501-')).toBe(true)
  expect(rangeMatches(500, '501-')).toBe(false)
})

test('a missing maximum or a malformed range never matches', () => {
  expect(rangeMatches(undefined, '1-100')).toBe(false)
  expect(rangeMatches(null, '1-100')).toBe(false)
  expect(rangeMatches(500, 'abc')).toBe(false)
})

test('range facets count a big venue in every lower range', () => {
  const { matchingIds, counts } = computeFacets(hotels, [banquet(['101-200', '501-'])])
  expect(matchingIds).toEqual(['a', 'b', 'd'])
  expect(counts.banquet).toEqual({ '1-100': 4, '101-200': 3, '501-': 1 })
})

test('parseRange reads closed and open ranges', () => {
  expect(parseRange('101-200')).toEqual({ min: 101, max: 200 })
  expect(parseRange('501-')).toEqual({ min: 501, max: null })
  expect(parseRange('100-100')).toEqual({ min: 100, max: 100 })
})

test('parseRange rejects malformed values', () => {
  for (const value of ['', '-', '-100', '100', '200-100', '1-2-3', 'a-b', '1.5-2', ' 1-2']) {
    expect(parseRange(value)).toBeNull()
  }
})
