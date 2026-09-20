import { expect, test } from 'bun:test'
import { catalogSearch } from '../../apps/astro/src/server/search/catalog-search'
import { handleSearchRequest } from '../../apps/astro/src/server/search/api'

const input = { searchQuery: 'lake', type: 'hotels', language: 'en' } as const
const candidate = { score: 1, value: { documentId: 'h1', type: 'Hotels_Collection' } }

test('dataset retrieval returns candidates or an unavailable result on failure', async () => {
  expect(await catalogSearch(input, { retrieve: async () => [candidate] })).toEqual({
    status: 'success',
    data: [candidate],
  })
  for (const statusCode of [401, 403, 429, 500]) {
    expect(
      await catalogSearch(input, {
        retrieve: async () => {
          throw Object.assign(new Error('Request failed'), { statusCode })
        },
      })
    ).toEqual({ status: 'unavailable' })
  }
})

test('empty success, malformed results, deadline and cancellation are distinct', async () => {
  expect(await catalogSearch(input, { retrieve: async () => [] })).toEqual({ status: 'success', data: [] })
  expect(await catalogSearch(input, { retrieve: async () => ({ error: 'secret' }) })).toEqual({
    status: 'unavailable',
  })
  expect(
    await catalogSearch(input, {
      timeoutMs: 5,
      retrieve: () => new Promise(() => {}),
    })
  ).toEqual({ status: 'unavailable' })
  let calls = 0
  expect(
    await catalogSearch(input, {
      signal: AbortSignal.abort(),
      retrieve: async () => {
        calls++
        return []
      },
    })
  ).toEqual({ status: 'unavailable' })
  expect(calls).toBe(0)
})

test('API preserves the envelope and ignores public provider overrides', async () => {
  const request = (body: unknown) =>
    new Request('http://local/api/embeddings', { method: 'POST', body: JSON.stringify(body) })
  const response = await handleSearchRequest(request({ ...input, provider: 'dataset' }), async (received) => {
    expect(received).toEqual(input)
    return { status: 'success', data: [candidate] }
  })
  expect(await response.json()).toEqual({ data: [candidate] })
  expect(response.headers.get('cache-control')).toBe('no-store')
  expect((await handleSearchRequest(request({}))).status).toBe(400)
  expect((await handleSearchRequest(new Request('http://local', { method: 'POST', body: '{' }))).status).toBe(400)
  const failure = await handleSearchRequest(request(input), async () => ({ status: 'unavailable' }))
  expect(failure.status).toBe(503)
  expect(await failure.json()).toEqual({ error: 'Search is temporarily unavailable' })
})
