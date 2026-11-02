/**
 * Provider gate for Phase 8: does Geoapify autocomplete find real Polish office addresses?
 *
 * Run from the repo root: bunx dotenv -- bun context/changes/filters-upsell-hotels-spaces/geoapify-check.ts
 *
 * Pass means at least 18 of 20 addresses have a result in the top 3 within 150 m of the expected point.
 * Exits non-zero below that. Expected points come from GUGiK (the national address register, PRG), read
 * on 2026-11-02, so Geoapify's OSM data is checked against a source it does not derive from.
 * The set was fixed before the first Geoapify run. Do not swap an address after seeing it fail.
 */

type Address = { text: string; lat: number; lng: number }
type Result = { lat: number; lon: number; formatted?: string }

const REQUIRED_HITS = 18
const MAX_DISTANCE_M = 150
const TOP_RESULTS = 3
const REQUEST_GAP_MS = 250

const ADDRESSES: Address[] = [
  { text: 'Prosta 51, Warszawa', lat: 52.23058, lng: 20.98733 },
  { text: 'Domaniewska 39, Warszawa', lat: 52.18316, lng: 21.00541 },
  { text: 'Grzybowska 62, Warszawa', lat: 52.23414, lng: 20.9861 },
  { text: 'Marszałkowska 142, Warszawa', lat: 52.23796, lng: 21.00736 },
  { text: 'Puławska 145, Warszawa', lat: 52.18099, lng: 21.02317 },
  { text: 'Postępu 15, Warszawa', lat: 52.18047, lng: 20.99695 },
  { text: 'Aleje Jerozolimskie 181, Warszawa', lat: 52.21113, lng: 20.95237 },
  { text: 'Chłodna 51, Warszawa', lat: 52.2356, lng: 20.98228 },
  { text: 'Aleja Pokoju 5, Kraków', lat: 50.05849, lng: 19.96266 },
  { text: 'Lubicz 23, Kraków', lat: 50.06471, lng: 19.95138 },
  { text: 'Powstańców Śląskich 95, Wrocław', lat: 51.09462, lng: 17.02068 },
  { text: 'Legnicka 48, Wrocław', lat: 51.11773, lng: 16.99655 },
  { text: 'Półwiejska 42, Poznań', lat: 52.40112, lng: 16.92827 },
  { text: 'Roosevelta 22, Poznań', lat: 52.40696, lng: 16.91177 },
  { text: 'Aleja Grunwaldzka 472, Gdańsk', lat: 54.40302, lng: 18.572 },
  { text: 'Świętojańska 9, Gdynia', lat: 54.52078, lng: 18.54332 },
  { text: 'Chorzowska 6, Katowice', lat: 50.26441, lng: 19.02058 },
  { text: 'Uniwersytecka 13, Katowice', lat: 50.26153, lng: 19.02507 },
  { text: 'Krakowskie Przedmieście 55, Lublin', lat: 51.24775, lng: 22.55255 },
  { text: 'Aleja Niepodległości 22, Szczecin', lat: 53.42671, lng: 14.55216 },
]

function distanceM(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * 6371000 * Math.asin(Math.sqrt(h))
}

async function autocomplete(text: string, apiKey: string): Promise<Result[]> {
  const url = new URL('https://api.geoapify.com/v1/geocode/autocomplete')
  url.searchParams.set('text', text)
  url.searchParams.set('filter', 'countrycode:pl')
  url.searchParams.set('limit', '5')
  url.searchParams.set('format', 'json')
  url.searchParams.set('lang', 'pl')
  url.searchParams.set('apiKey', apiKey)

  const response = await fetch(url)
  // Only the status: a thrown fetch error or a printed URL would carry the key
  if (!response.ok) throw new Error(`Geoapify returned ${response.status}`)
  const { results } = (await response.json()) as { results?: Result[] }
  return results ?? []
}

const apiKey = process.env.GEOAPIFY_API_KEY
if (!apiKey) {
  console.error('GEOAPIFY_API_KEY is not set')
  process.exit(1)
}

let hits = 0

for (const address of ADDRESSES) {
  const results = (await autocomplete(address.text, apiKey)).slice(0, TOP_RESULTS)
  const distances = results.map((result) => distanceM(address, { lat: result.lat, lng: result.lon }))
  const best = distances.length > 0 ? Math.min(...distances) : Infinity
  const isHit = best <= MAX_DISTANCE_M
  if (isHit) hits++

  const position = distances.indexOf(best) + 1
  console.log(
    `${isHit ? 'HIT ' : 'MISS'}  ${address.text}  ` +
      (results.length > 0
        ? `best ${Math.round(best)} m at #${position}: ${results[position - 1].formatted}`
        : 'no results')
  )
  await Bun.sleep(REQUEST_GAP_MS)
}

const passed = hits >= REQUIRED_HITS
console.log(
  `\n${hits} of ${ADDRESSES.length} within ${MAX_DISTANCE_M} m in the top ${TOP_RESULTS}: ${passed ? 'PASS' : 'FAIL'}`
)
process.exit(passed ? 0 : 1)
