import { expect, test } from 'bun:test'
import { listingSearch } from '../../apps/astro/src/server/search/listing-state'
import { searchNavigation, paginationPath, collectionPath } from '../../apps/astro/src/utils/search-navigation'
import { getOrderClause } from '../../apps/astro/src/utils/filters'

test('blank browsing, empty success and unavailable never collapse into one another', async () => {
  expect(await listingSearch('  ', 'hotels', 'pl')).toEqual({ isSearch: false, unavailable: false, candidates: null })
  expect(await listingSearch('lake', 'hotels', 'pl', async () => ({ status: 'success', data: [] }))).toEqual({
    isSearch: true,
    unavailable: false,
    candidates: [],
  })
  expect(await listingSearch('lake', 'hotels', 'pl', async () => ({ status: 'unavailable' }))).toEqual({
    isSearch: true,
    unavailable: true,
    candidates: [],
  })
  expect((await listingSearch('x'.repeat(501), 'hotels', 'pl')).unavailable).toBe(true)
})

test('bilingual search resets page, preserves facets and clears blank searches', () => {
  for (const [base, page, filter] of [
    ['/en/hotels', 'page', 'filter'],
    ['/pl/hotele', 'strona', 'filtr'],
  ]) {
    const path = `${base}/${page}/2/${filter}/`
    const params = new URLSearchParams('stars=4&search=old&order=priceAsc')
    expect(searchNavigation(path, params, ' lake ')).toBe(`${base}/${filter}/?stars=4&search=lake`)
    expect(searchNavigation(path, params, ' ')).toBe(`${base}/`)
    expect(collectionPath(path)).toBe(`${base}/`)
    expect(paginationPath(base, 3, path, params)).toBe(`${base}/${page}/3/${filter}/?${params}`)
    expect(paginationPath(base, 1, path)).toBe(`${base}/${filter}/`)
  }
  expect(getOrderClause(null, true)).toBe('_score desc, _id asc')
  expect(getOrderClause('priceAsc', true, 'hotels')).toBe('pricing.pricingVisible desc, pricing.pricePerPerson asc')
})
