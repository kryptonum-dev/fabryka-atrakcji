const LOCATION_PARAMS = ['lat', 'lng', 'radius']

// URLSearchParams decodes the name, so `l%61t=52.2` cannot slip past
const isLocationParam = (pair: string) => {
  const [name] = new URLSearchParams(pair).keys()
  return LOCATION_PARAMS.includes(name)
}

/** Removes the point and radius from a URL or path. Everything else stays exactly as written. */
export function stripLocationParams(url: string): string {
  const hashStart = url.indexOf('#')
  const beforeHash = hashStart === -1 ? url : url.slice(0, hashStart)
  const hash = hashStart === -1 ? '' : url.slice(hashStart)

  const queryStart = beforeHash.indexOf('?')
  if (queryStart === -1) return url

  const path = beforeHash.slice(0, queryStart)
  const query = beforeHash
    .slice(queryStart + 1)
    .split('&')
    .filter((pair) => !isLocationParam(pair))
    .join('&')

  return `${path}${query ? `?${query}` : ''}${hash}`
}

/** The radius alone is not location data: hotels use it with a city from a public list. */
export function hasCoordinates(search: string): boolean {
  const params = new URLSearchParams(search)
  return params.has('lat') || params.has('lng')
}
