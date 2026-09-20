import { catalogSearch } from './catalog-search'
import { parseSearchInput } from './contracts'

export async function handleSearchRequest(request: Request, search = catalogSearch): Promise<Response> {
  const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  let body: unknown
  try {
    body = await request.json()
  } catch {
    body = null
  }
  const input = parseSearchInput(body)
  if (!input)
    return new Response(JSON.stringify({ error: 'Invalid search query, type or language' }), { status: 400, headers })
  const result = await search(input, { signal: request.signal })
  return result.status === 'success'
    ? new Response(JSON.stringify({ data: result.data }), { status: 200, headers })
    : new Response(JSON.stringify({ error: 'Search is temporarily unavailable' }), { status: 503, headers })
}
