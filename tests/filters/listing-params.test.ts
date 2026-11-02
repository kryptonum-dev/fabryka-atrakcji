import { expect, test } from 'bun:test'
import { buildFilterUrl, getOrderClause } from '../../apps/astro/src/utils/filters'
import { parseHotelParams, parseSpaceParams } from '../../apps/astro/src/utils/listing-params'

const hotel = (query: string) => parseHotelParams(new URLSearchParams(query))
const space = (query: string) => parseSpaceParams(new URLSearchParams(query))

const emptyHotel = {
  location: [],
  surroundings: [],
  amenities: [],
  stars: [],
  overnight: [],
  conference: [],
  banquet: [],
  city: null,
  radius: null,
}

const emptySpace = {
  location: [],
  eventType: [],
  character: [],
  spaceType: [],
  facilities: [],
  capacity: {},
  point: null,
  radius: null,
}

test('hotel params read comma-separated values', () => {
  expect(
    hotel(
      'location=a,b&surroundings=gory,morze&amenities=SPA-wellness,basen&stars=0,5&overnight=101-200,501-&conference=1-100&banquet=301-500'
    )
  ).toEqual({
    location: ['a', 'b'],
    surroundings: ['gory', 'morze'],
    amenities: ['SPA-wellness', 'basen'],
    stars: ['0', '5'],
    overnight: ['101-200', '501-'],
    conference: ['1-100'],
    banquet: ['301-500'],
    city: null,
    radius: null,
  })
})

test('an empty query gives empty params', () => {
  expect(hotel('')).toEqual(emptyHotel)
  expect(space('')).toEqual(emptySpace)
})

test('lists drop blanks and duplicates', () => {
  expect(hotel('location=a,,a, b ,').location).toEqual(['a', 'b'])
  expect(hotel('location=').location).toEqual([])
})

test('stars outside 0-5 are rejected', () => {
  expect(hotel('stars=0,3,5,6,-1,1.5,05,abc').stars).toEqual(['0', '3', '5'])
})

test('malformed ranges are rejected, valid ones stay', () => {
  expect(hotel('overnight=101-200,200-100,abc,150,-5,501-').overnight).toEqual(['101-200', '501-'])
  expect(space('capacity_wnetrze=abc').capacity).toEqual({})
})

test('city and radius only count together', () => {
  expect(hotel('city=warszawa&radius=25')).toMatchObject({ city: 'warszawa', radius: 25 })
  expect(hotel('city=warszawa')).toMatchObject({ city: null, radius: null })
  expect(hotel('radius=25')).toMatchObject({ city: null, radius: null })
  expect(hotel('city=&radius=25')).toMatchObject({ city: null, radius: null })
})

test('invalid radius values drop the whole distance filter', () => {
  for (const radius of ['0', '-5', 'abc', '', '1e3']) {
    expect(hotel(`city=warszawa&radius=${radius}`)).toMatchObject({ city: null, radius: null })
    expect(space(`lat=52.2&lng=21&radius=${radius}`)).toMatchObject({ point: null, radius: null })
  }
})

test('old hotel and space parameters are ignored', () => {
  expect(hotel('minRooms=150&maxRooms=200&minPrice=1&maxPrice=9&order=newest&search=spa')).toEqual(emptyHotel)
  expect(space('features=a&minArea=1&maxArea=9&minCapacity=1&maxCapacity=9&area=1-9&capacity=1-9')).toEqual(emptySpace)
})

test('space params read comma-separated values', () => {
  expect(space('location=warszawa,krakow&eventType=gala&character=loft&spaceType=mixed,plener&facilities=a,b')).toEqual(
    {
      ...emptySpace,
      location: ['warszawa', 'krakow'],
      eventType: ['gala'],
      character: ['loft'],
      spaceType: ['mixed', 'plener'],
      facilities: ['a', 'b'],
    }
  )
})

test('capacity is read per space type, including new types', () => {
  expect(space('capacity_wnetrze=1-50,151-&capacity_plener=51-100&capacity_taras=1-50').capacity).toEqual({
    wnetrze: ['1-50', '151-'],
    plener: ['51-100'],
    taras: ['1-50'],
  })
  expect(space('capacity_=1-50').capacity).toEqual({})
})

test('a capacity slug cannot reach the object prototype', () => {
  const { capacity } = space('capacity___proto__=1-50')
  expect(Object.getPrototypeOf(capacity)).toBe(Object.prototype)
  expect(Object.keys(capacity)).toEqual(['__proto__'])
})

test('a point is rounded to 3 decimals', () => {
  expect(space('lat=52.22977&lng=21.01178&radius=5')).toMatchObject({ point: { lat: 52.23, lng: 21.012 }, radius: 5 })
})

test('lat, lng and radius only count together', () => {
  for (const query of ['lat=52.2&lng=21', 'lat=52.2&radius=5', 'lng=21&radius=5']) {
    expect(space(query)).toMatchObject({ point: null, radius: null })
  }
})

test('points outside Poland are rejected', () => {
  for (const query of ['lat=48.9&lng=21', 'lat=55.1&lng=21', 'lat=52&lng=13.9', 'lat=52&lng=25.1', 'lat=abc&lng=21']) {
    expect(space(`${query}&radius=5`)).toMatchObject({ point: null, radius: null })
  }
  expect(space('lat=49&lng=14&radius=5').point).toEqual({ lat: 49, lng: 14 })
  expect(space('lat=55&lng=25&radius=5').point).toEqual({ lat: 55, lng: 25 })
})

test('sorting keeps every remaining filter, including new parameters', () => {
  const searchParams = new URLSearchParams('surroundings=gory,morze&capacity_plener=1-50&city=sopot&radius=25')
  expect(buildFilterUrl({ order: 'newest', searchParams, currentPath: '/pl/hotele/filtr/' })).toBe(
    '/pl/hotele/filtr/?surroundings=gory%2Cmorze&capacity_plener=1-50&city=sopot&radius=25&order=newest'
  )
})

test('a new parameter alone keeps the filter route', () => {
  const searchParams = new URLSearchParams('surroundings=gory&order=newest')
  expect(buildFilterUrl({ order: undefined, searchParams, currentPath: '/pl/hotele/filtr/' })).toBe(
    '/pl/hotele/filtr/?surroundings=gory'
  )
})

test('clearing the last parameter leaves the filter route', () => {
  const searchParams = new URLSearchParams('order=newest')
  expect(buildFilterUrl({ order: undefined, searchParams, currentPath: '/pl/hotele/filtr/' })).toBe('/pl/hotele/')
  expect(buildFilterUrl({ order: undefined, searchParams, currentPath: '/en/event-spaces/page/2/filter/' })).toBe(
    '/en/event-spaces/'
  )
})

test('sorting from a static listing moves to the filter route', () => {
  expect(
    buildFilterUrl({ order: 'newest', searchParams: new URLSearchParams(), currentPath: '/pl/przestrzenie-eventowe/' })
  ).toBe('/pl/przestrzenie-eventowe/filtr/?order=newest')
})

test('distance order applies to event spaces only', () => {
  expect(getOrderClause('distance', false, 'eventSpaces')).toBe('distanceKm asc')
  expect(getOrderClause('distance', false, 'hotels')).toBe('popularityIndex desc')
  expect(getOrderClause('distance', true, 'hotels')).toBe('_score desc, _id asc')
})
