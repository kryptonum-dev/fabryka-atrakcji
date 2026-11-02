import { describe, expect, test } from 'bun:test'
import { hasCoordinates, stripLocationParams } from '../../apps/astro/src/utils/strip-location-params'

describe('stripLocationParams', () => {
  test('removes the point and radius from a full URL', () => {
    expect(
      stripLocationParams(
        'https://www.fabryka-atrakcji.com/pl/przestrzenie-eventowe/filtr/?lat=52.23&lng=21.01&radius=5'
      )
    ).toBe('https://www.fabryka-atrakcji.com/pl/przestrzenie-eventowe/filtr/')
  })

  test('removes them from a path', () => {
    expect(stripLocationParams('/pl/przestrzenie-eventowe/filtr/?lat=52.23&lng=21.01&radius=5')).toBe(
      '/pl/przestrzenie-eventowe/filtr/'
    )
  })

  test('keeps other parameters exactly as written, in order', () => {
    expect(stripLocationParams('/filtr/?eventType=a,b&lat=52.23&search=hala%20X&lng=21.01&order=newest&radius=5')).toBe(
      '/filtr/?eventType=a,b&search=hala%20X&order=newest'
    )
  })

  test('keeps the hash', () => {
    expect(stripLocationParams('/filtr/?lat=52.23&lng=21.01#kontakt')).toBe('/filtr/#kontakt')
    expect(stripLocationParams('/filtr/?order=newest&lat=52.23#kontakt')).toBe('/filtr/?order=newest#kontakt')
  })

  test('leaves a URL with nothing to strip untouched', () => {
    expect(stripLocationParams('https://www.fabryka-atrakcji.com/pl/kontakt/')).toBe(
      'https://www.fabryka-atrakcji.com/pl/kontakt/'
    )
    expect(stripLocationParams('/filtr/?order=newest#kontakt')).toBe('/filtr/?order=newest#kontakt')
    expect(stripLocationParams('')).toBe('')
  })

  test('does not touch parameters that only contain the names', () => {
    expect(stripLocationParams('/filtr/?flat=1&lngth=2&radius2=3')).toBe('/filtr/?flat=1&lngth=2&radius2=3')
  })

  test('catches an encoded parameter name', () => {
    expect(stripLocationParams('/filtr/?l%61t=52.23&order=newest')).toBe('/filtr/?order=newest')
  })

  test('removes a repeated parameter and one with no value', () => {
    expect(stripLocationParams('/filtr/?lat=52.23&lat=50.1&lng&order=newest')).toBe('/filtr/?order=newest')
  })

  test('survives a malformed percent sequence', () => {
    expect(stripLocationParams('/filtr/?search=100%&lat=52.23')).toBe('/filtr/?search=100%')
  })
})

describe('hasCoordinates', () => {
  test('is true for either coordinate', () => {
    expect(hasCoordinates('?lat=52.23&lng=21.01&radius=5')).toBe(true)
    expect(hasCoordinates('?lng=21.01')).toBe(true)
  })

  test('is false for a hotel city radius', () => {
    expect(hasCoordinates('?city=warszawa&radius=25')).toBe(false)
  })

  test('is false for an empty search', () => {
    expect(hasCoordinates('')).toBe(false)
  })
})
