import { rangeMatches, rangeValue, type FacetGroup } from './listing-facets'
import type { SpaceParams } from './listing-params'

export type SpaceFacet = {
  _id: string
  location: string | null
  eventTypes: string[] | null
  characters: string[] | null
  facilities: string[] | null
  capacities: { type: string | null; maxPeople: number | null }[] | null
  distanceKm: number | null
}

type FacetOptions = {
  locations: { slug: string }[]
  spaceTypes: { slug: string }[]
  eventTypes: { slug: string }[]
  characters: { slug: string }[]
  facilities: { slug: string }[]
  capacityFilterOptions: { min: number; max?: number | null }[]
  distanceRadii: number[]
}

/** Not a document: objects with two or more capacities. The space type schema reserves this slug. */
export const MIXED_SPACE_TYPE = 'mixed'

const slugs = (options: { slug: string }[]) => options.map((option) => option.slug)

export function spaceFacetGroups(params: SpaceParams, options: FacetOptions): FacetGroup<SpaceFacet>[] {
  const hasSpaceType = (space: SpaceFacet, value: string) => {
    const capacities = space.capacities ?? []
    if (value === MIXED_SPACE_TYPE) return capacities.length >= 2
    return capacities.some((capacity) => capacity.type === value)
  }

  // New space types get a capacity filter of their own, with no code change
  const capacityGroups = slugs(options.spaceTypes).map(
    (slug): FacetGroup<SpaceFacet> => ({
      key: `capacity_${slug}`,
      mode: 'any',
      selected: params.capacity[slug] ?? [],
      options: options.capacityFilterOptions.map(rangeValue),
      matches: (space, value) =>
        rangeMatches(space.capacities?.find((capacity) => capacity.type === slug)?.maxPeople, value),
    })
  )

  return [
    {
      key: 'location',
      mode: 'any',
      selected: params.location,
      options: slugs(options.locations),
      matches: (space, value) => space.location === value,
    },
    {
      key: 'spaceType',
      mode: 'any',
      selected: params.spaceType,
      options: [...slugs(options.spaceTypes), MIXED_SPACE_TYPE],
      matches: hasSpaceType,
    },
    ...capacityGroups,
    {
      key: 'eventType',
      mode: 'any',
      selected: params.eventType,
      options: slugs(options.eventTypes),
      matches: (space, value) => space.eventTypes?.includes(value) ?? false,
    },
    {
      key: 'character',
      mode: 'any',
      selected: params.character,
      options: slugs(options.characters),
      matches: (space, value) => space.characters?.includes(value) ?? false,
    },
    {
      key: 'facilities',
      mode: 'all',
      selected: params.facilities,
      options: slugs(options.facilities),
      matches: (space, value) => space.facilities?.includes(value) ?? false,
    },
    {
      key: 'distance',
      mode: 'any',
      selected: params.radius ? [String(params.radius)] : [],
      options: options.distanceRadii.map(String),
      matches: (space, value) => space.distanceKm !== null && space.distanceKm <= Number(value),
    },
  ]
}
