export type FacetGroup<T> = {
  key: string
  mode: 'any' | 'all'
  selected: string[]
  matches: (item: T, value: string) => boolean
  options: string[]
}

export type Range = { min: number; max: number | null }

/** Reads `101-200` or the open-ended `501-`. Returns null for anything else. */
export function parseRange(value: string): Range | null {
  const match = /^(\d+)-(\d*)$/.exec(value)
  if (!match) return null

  const min = Number(match[1])
  const max = match[2] ? Number(match[2]) : null
  return max !== null && max < min ? null : { min, max }
}

/** An object fits a range when it holds at least the lower bound. The upper bound is display-only. */
export function rangeMatches(max: number | null | undefined, rangeValue: string): boolean {
  const range = parseRange(rangeValue)
  return range !== null && typeof max === 'number' && max >= range.min
}

/**
 * Options combine with OR in `any` groups and with AND in `all` groups, and groups combine with AND.
 * Selected values that are not options are ignored, so a stale URL cannot empty the listing.
 *
 * An `any` option counts ignore that group's own selection, so they show what picking it adds.
 * An `all` option counts apply it, so they show what is left after narrowing further.
 */
export function computeFacets<T extends { _id: string }>(
  items: T[],
  groups: FacetGroup<T>[]
): { matchingIds: string[]; counts: Record<string, Record<string, number>> } {
  const passes = (item: T, group: FacetGroup<T>) => {
    const selected = group.selected.filter((value) => group.options.includes(value))
    if (selected.length === 0) return true
    const isMatch = (value: string) => group.matches(item, value)
    return group.mode === 'any' ? selected.some(isMatch) : selected.every(isMatch)
  }

  const passesAll = (item: T, activeGroups: FacetGroup<T>[]) => activeGroups.every((group) => passes(item, group))

  const counts = Object.fromEntries(
    groups.map((group) => {
      const activeGroups = group.mode === 'any' ? groups.filter((other) => other !== group) : groups
      const pool = items.filter((item) => passesAll(item, activeGroups))
      const optionCounts = group.options.map((option) => [
        option,
        pool.filter((item) => group.matches(item, option)).length,
      ])
      return [group.key, Object.fromEntries(optionCounts)]
    })
  )

  return {
    matchingIds: items.filter((item) => passesAll(item, groups)).map((item) => item._id),
    counts,
  }
}
