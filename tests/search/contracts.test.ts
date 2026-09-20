import { expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { parse, evaluate } from 'groq-js'
import { parseSearchInput, parseCandidates } from '../../apps/astro/src/server/search/contracts'

const block = (text: string) => ({
  _type: 'block',
  markDefs: [{ _ref: 'secret-ref' }],
  children: [{ _type: 'span', text }],
})
const projection = readFileSync(
  new URL('../../apps/sanity/config/dataset-embeddings.projection.groq', import.meta.url),
  'utf8'
)
async function project(document: object) {
  return (await evaluate(parse(`* ${projection}`), { dataset: [document] })).get()
}

test('projects local prose and nested text without references or promotional content', async () => {
  const result = JSON.stringify(
    await project({
      _type: 'Hotels_Collection',
      name: 'Lake hotel',
      title: [block('Retreat')],
      description: 'Rest',
      amenities: [{ _ref: 'secret-ref' }],
      location: { _ref: 'secret-ref' },
      content: [
        block('Kayaking'),
        { _type: 'Amenities', amenityGroups: [{ heading: 'Wellness', list: ['Pool'] }] },
        { _type: 'Faq', faqType: 'scoped', questions: [{ question: [block('Dogs?')], answer: [block('Welcome')] }] },
        { _type: 'Faq', faqType: 'global', questions: [{ question: [block('Excluded')] }] },
        { _type: 'Location', howToGetThere: { transportList: { byCar: 'Warsaw', callout: 'Excluded' } } },
        { _type: 'BlocksWithImage', blocks: [{ text: [block('Forest')], image: { alt: 'Excluded' } }] },
        { _type: 'NextSteps', heading: [block('Excluded')] },
      ],
    })
  )
  for (const text of [
    'Lake hotel',
    'Retreat',
    'Rest',
    'Kayaking',
    'Wellness',
    'Pool',
    'Dogs?',
    'Welcome',
    'Warsaw',
    'Forest',
  ])
    expect(result).toContain(text)
  for (const text of ['secret-ref', 'Excluded', 'markDefs', '_type']) expect(result).not.toContain(text)
})

test('optional content and unsupported document types are harmless', async () => {
  expect(await project({ _type: 'Other', name: 'Excluded' })).toEqual([{}])
  expect((await project({ _type: 'Activities_Collection', name: 'Trip' }))[0].name).toBe('Trip')
})

test('validates bounded input and optional locale', () => {
  expect(parseSearchInput({ searchQuery: '  lake  ', type: 'hotels', language: 'en' })?.searchQuery).toBe('lake')
  expect(parseSearchInput({ searchQuery: 'lake', type: 'hotels' })?.language).toBeUndefined()
  for (const value of [
    null,
    {},
    { searchQuery: ' ', type: 'hotels' },
    { searchQuery: 'a'.repeat(501), type: 'hotels' },
    { searchQuery: 5, type: 'hotels' },
    { searchQuery: 'x', type: 'bad' },
    { searchQuery: 'x', type: 'hotels', language: 'xx' },
  ])
    expect(parseSearchInput(value)).toBeNull()
})

test('sanitizes candidates and rejects wrong-type, unpublished and malformed payloads', () => {
  const candidate = { score: 1, value: { documentId: 'hotel-1', type: 'Hotels_Collection' }, _embeddings: ['private'] }
  expect(parseCandidates([candidate, candidate], 'hotels')).toEqual([{ score: 1, value: candidate.value }])
  for (const id of ['drafts.hotel', 'versions.release.hotel', ''])
    expect(() => parseCandidates([{ ...candidate, value: { ...candidate.value, documentId: id } }], 'hotels')).toThrow()
  expect(() => parseCandidates([candidate], 'activities')).toThrow()
  expect(() => parseCandidates([{ ...candidate, score: Infinity }], 'hotels')).toThrow()
})
