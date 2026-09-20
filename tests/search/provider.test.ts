import { expect, test } from 'bun:test'
import { catalogSearch } from '../../apps/astro/src/server/search/catalog-search'
import { handleSearchRequest } from '../../apps/astro/src/server/search/api'

const input = { searchQuery: 'lake', type: 'hotels', language: 'en' } as const
const candidate = { score: 1, value: { documentId: 'h1', type: 'Hotels_Collection' } }

test('provider switch is explicit, without fallback', async () => {
  let legacyCalls = 0
  const providers = {
    dataset: async () => [candidate],
    legacy: async () => {
      legacyCalls++
      return []
    },
  }
  expect(await catalogSearch(input, { provider: 'dataset', providers })).toEqual({
    status: 'success',
    data: [candidate],
  })
  expect(await catalogSearch(input, { provider: 'invalid', providers })).toEqual({ status: 'unavailable' })
  for (const status of [401, 403, 429, 500]) {
    expect(
      await catalogSearch(input, {
        provider: 'dataset',
        providers: {
          ...providers,
          dataset: async () => {
            throw new Error(`HTTP ${status}`)
          },
        },
      })
    ).toEqual({ status: 'unavailable' })
  }
  expect(legacyCalls).toBe(0)
})

test('empty success, malformed results, deadline and cancellation are distinct', async () => {
  const providers = { dataset: async () => [], legacy: async () => [] }
  expect(await catalogSearch(input, { provider: 'dataset', providers })).toEqual({ status: 'success', data: [] })
  expect(
    await catalogSearch(input, {
      provider: 'dataset',
      providers: { ...providers, dataset: async () => ({ error: 'secret' }) },
    })
  ).toEqual({ status: 'unavailable' })
  expect(
    await catalogSearch(input, {
      provider: 'dataset',
      timeoutMs: 5,
      providers: { ...providers, dataset: () => new Promise(() => {}) },
    })
  ).toEqual({ status: 'unavailable' })
  expect(await catalogSearch(input, { provider: 'dataset', signal: AbortSignal.abort(), providers })).toEqual({
    status: 'unavailable',
  })
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
