import { rangeMatches, rangeValue, type FacetGroup } from './listing-facets'
import type { HotelParams } from './listing-params'

export type HotelFacet = {
  _id: string
  location: string | null
  stars: number | null
  amenities: string[] | null
  surroundings: string[] | null
  maxPeople: { overnight?: number; conference?: number; banquet?: number } | null
  distanceKm: number | null
}

type FacetOptions = {
  locations: { slug: string }[]
  surroundings: { slug: string }[]
  amenities: { slug: string }[]
  participantRanges: { min: number; max: number | null }[]
  distanceRadii: number[]
}

const STARS = ['5', '4', '3', '2', '1', '0']

const slugs = (options: { slug: string }[]) => options.map((option) => option.slug)

export function hotelFacetGroups(params: HotelParams, options: FacetOptions): FacetGroup<HotelFacet>[] {
  const participantGroup = (key: 'overnight' | 'conference' | 'banquet'): FacetGroup<HotelFacet> => ({
    key,
    mode: 'any',
    selected: params[key],
    options: options.participantRanges.map(rangeValue),
    matches: (hotel, value) => rangeMatches(hotel.maxPeople?.[key], value),
  })

  return [
    {
      key: 'location',
      mode: 'any',
      selected: params.location,
      options: slugs(options.locations),
      matches: (hotel, value) => hotel.location === value,
    },
    {
      key: 'surroundings',
      mode: 'any',
      selected: params.surroundings,
      options: slugs(options.surroundings),
      matches: (hotel, value) => hotel.surroundings?.includes(value) ?? false,
    },
    {
      key: 'amenities',
      mode: 'all',
      selected: params.amenities,
      options: slugs(options.amenities),
      matches: (hotel, value) => hotel.amenities?.includes(value) ?? false,
    },
    {
      key: 'stars',
      mode: 'any',
      selected: params.stars,
      options: STARS,
      matches: (hotel, value) => String(hotel.stars) === value,
    },
    participantGroup('overnight'),
    participantGroup('conference'),
    participantGroup('banquet'),
    {
      key: 'distance',
      mode: 'any',
      selected: params.radius ? [String(params.radius)] : [],
      options: options.distanceRadii.map(String),
      matches: (hotel, value) => hotel.distanceKm !== null && hotel.distanceKm <= Number(value),
    },
  ]
}
