import { parseRange } from './listing-facets'

export type HotelParams = {
  location: string[]
  surroundings: string[]
  amenities: string[]
  stars: string[]
  overnight: string[]
  conference: string[]
  banquet: string[]
  city: string | null
  radius: number | null
}

export type SpaceParams = {
  location: string[]
  eventType: string[]
  character: string[]
  spaceType: string[]
  facilities: string[]
  capacity: Record<string, string[]>
  point: { lat: number; lng: number } | null
  radius: number | null
}

const CAPACITY_PREFIX = 'capacity_'
const POLAND = { lat: { min: 49, max: 55 }, lng: { min: 14, max: 25 } }

// Slugs are not validated here: computeFacets drops anything that is not a real option.
function parseList(searchParams: URLSearchParams, name: string): string[] {
  const values = (searchParams.get(name) ?? '').split(',').map((value) => value.trim())
  return [...new Set(values.filter(Boolean))]
}

function parseRanges(searchParams: URLSearchParams, name: string): string[] {
  return parseList(searchParams, name).filter((value) => parseRange(value) !== null)
}

function parseNumber(value: string | null): number | null {
  return value !== null && /^\d+(\.\d+)?$/.test(value.trim()) ? Number(value) : null
}

function parseRadius(searchParams: URLSearchParams): number | null {
  const radius = parseNumber(searchParams.get('radius'))
  return radius !== null && radius > 0 ? radius : null
}

// Rounded to 3 decimals, about 100 m, so a precise point in a hand-edited URL is never used.
function parsePoint(searchParams: URLSearchParams): SpaceParams['point'] {
  const lat = parseNumber(searchParams.get('lat'))
  const lng = parseNumber(searchParams.get('lng'))
  if (lat === null || lng === null) return null
  if (lat < POLAND.lat.min || lat > POLAND.lat.max || lng < POLAND.lng.min || lng > POLAND.lng.max) return null
  return { lat: Math.round(lat * 1000) / 1000, lng: Math.round(lng * 1000) / 1000 }
}

function parseCapacity(searchParams: URLSearchParams): SpaceParams['capacity'] {
  const entries = [...new Set(searchParams.keys())]
    .filter((name) => name.startsWith(CAPACITY_PREFIX) && name.length > CAPACITY_PREFIX.length)
    .map((name) => [name.slice(CAPACITY_PREFIX.length), parseRanges(searchParams, name)] as const)
    .filter(([, ranges]) => ranges.length > 0)
  return Object.fromEntries(entries)
}

export function parseHotelParams(searchParams: URLSearchParams): HotelParams {
  const city = searchParams.get('city')?.trim() || null
  const radius = parseRadius(searchParams)
  const hasDistance = city !== null && radius !== null

  return {
    location: parseList(searchParams, 'location'),
    surroundings: parseList(searchParams, 'surroundings'),
    amenities: parseList(searchParams, 'amenities'),
    stars: parseList(searchParams, 'stars').filter((value) => /^[0-5]$/.test(value)),
    overnight: parseRanges(searchParams, 'overnight'),
    conference: parseRanges(searchParams, 'conference'),
    banquet: parseRanges(searchParams, 'banquet'),
    city: hasDistance ? city : null,
    radius: hasDistance ? radius : null,
  }
}

export function parseSpaceParams(searchParams: URLSearchParams): SpaceParams {
  const point = parsePoint(searchParams)
  const radius = parseRadius(searchParams)
  const hasDistance = point !== null && radius !== null

  return {
    location: parseList(searchParams, 'location'),
    eventType: parseList(searchParams, 'eventType'),
    character: parseList(searchParams, 'character'),
    spaceType: parseList(searchParams, 'spaceType'),
    facilities: parseList(searchParams, 'facilities'),
    capacity: parseCapacity(searchParams),
    point: hasDistance ? point : null,
    radius: hasDistance ? radius : null,
  }
}
