export const prerender = false

import type { APIRoute } from 'astro'

const GEOAPIFY_API_KEY = import.meta.env.GEOAPIFY_API_KEY || process.env.GEOAPIFY_API_KEY
const GEOAPIFY_URL = 'https://api.geoapify.com/v1/geocode/autocomplete'
const GEOAPIFY_TIMEOUT_MS = 5000

const MIN_TEXT_LENGTH = 3
const MAX_TEXT_LENGTH = 100

const RATE_LIMIT = 20
const RATE_WINDOW_MS = 60_000
const MAX_TRACKED_CLIENTS = 5000

type GeoapifyResult = { formatted?: string; lat?: number; lon?: number }

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })

const rateWindows = new Map<string, { count: number; resetAt: number }>()

// Per serverless instance, so this slows a script down rather than stopping it. BotID only covers /api/contact.
const isRateLimited = (client: string) => {
  const now = Date.now()
  const window = rateWindows.get(client)

  if (window && window.resetAt > now) {
    window.count++
    return window.count > RATE_LIMIT
  }

  if (rateWindows.size >= MAX_TRACKED_CLIENTS) rateWindows.clear()
  rateWindows.set(client, { count: 1, resetAt: now + RATE_WINDOW_MS })
  return false
}

// request.url has a localhost origin on Vercel, so the host comes from the headers. A browser always sends Origin
// on a POST, so a missing one is not a page of this site.
const isSameOrigin = (request: Request) => {
  const origin = request.headers.get('origin')
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
  if (!origin || !host) return false

  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}

export const GET: APIRoute = () =>
  new Response(null, { status: 405, headers: { Allow: 'POST', 'Cache-Control': 'no-store' } })

// POST, because a GET would put the typed address in access logs. Do not log the text.
export const POST: APIRoute = async ({ request, clientAddress }) => {
  if (!isSameOrigin(request)) return json({ message: 'Forbidden' }, 403)
  if (isRateLimited(clientAddress ?? 'unknown')) return json({ message: 'Too many requests' }, 429)

  const body = (await request.json().catch(() => null)) as { text?: unknown; lang?: unknown } | null
  const text = typeof body?.text === 'string' ? body.text.trim() : ''
  if (text.length < MIN_TEXT_LENGTH || text.length > MAX_TEXT_LENGTH) return json({ message: 'Invalid text' }, 400)

  if (!GEOAPIFY_API_KEY) {
    console.error('[geocode] GEOAPIFY_API_KEY is not set')
    return json({ message: 'Address search is unavailable' }, 502)
  }

  const url = new URL(GEOAPIFY_URL)
  url.searchParams.set('text', text)
  url.searchParams.set('filter', 'countrycode:pl')
  url.searchParams.set('limit', '5')
  url.searchParams.set('format', 'json')
  url.searchParams.set('lang', body?.lang === 'en' ? 'en' : 'pl')
  url.searchParams.set('apiKey', GEOAPIFY_API_KEY)

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(GEOAPIFY_TIMEOUT_MS) })
    if (!response.ok) {
      console.error('[geocode] Geoapify responded with', response.status)
      return json({ message: 'Address search is unavailable' }, 502)
    }

    const { results = [] } = (await response.json()) as { results?: GeoapifyResult[] }
    return json(
      results
        .filter((result) => result.formatted && Number.isFinite(result.lat) && Number.isFinite(result.lon))
        .map((result) => ({ label: result.formatted, lat: result.lat, lng: result.lon }))
    )
  } catch (error) {
    // Only the name: the message of a failed fetch can repeat the URL, and with it the key and the text
    console.error('[geocode] Request failed:', error instanceof Error ? error.name : 'unknown')
    return json({ message: 'Address search is unavailable' }, 502)
  }
}
