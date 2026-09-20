import { readFile, writeFile } from 'node:fs/promises'
import { catalogSearch } from '../../astro/src/server/search/catalog-search'
import { COLLECTIONS, parseSearchInput } from '../../astro/src/server/search/contracts'
import { ELIGIBILITY } from '../../astro/src/server/search/dataset-provider'
import { searchClient } from '../../astro/src/server/search/search-client'

const folder = new URL('../../../context/changes/sanity-dataset-embeddings-migration/', import.meta.url)
const corpus = JSON.parse(await readFile(new URL('evaluation-corpus.json', folder), 'utf8'))
const args = process.argv.slice(2)
const provider = args[args.indexOf('--provider') + 1]
if (!['dataset', 'legacy'].includes(provider)) throw new Error('Specify --provider legacy|dataset')
const positives = corpus.cases.filter((item: any) => item.assertion === 'positive')
if (positives.length < 8) throw new Error('Judge at least eight real-content positives first')
for (const type of ['activities', 'hotels'])
  for (const language of ['pl', 'en']) {
    if (
      !positives.some((item: any) => item.type === type && item.language === language && item.category === 'exact_name')
    )
      throw new Error(`Missing exact-name case: ${type}/${language}`)
  }
const reports = []
const timings: number[] = []
for (let run = 1; run <= 3; run++) {
  for (const item of corpus.cases) {
    if (run > 1 && item.assertion !== 'positive') continue
    const input = parseSearchInput({ searchQuery: item.query, type: item.type, language: item.language })
    if (!input) throw new Error(`Invalid corpus input ${item.id}`)
    const start = Date.now()
    const result = await catalogSearch(input, { provider })
    const elapsedMs = Date.now() - start
    if (item.assertion === 'positive') timings.push(elapsedMs)
    const ids = result.status === 'success' ? result.data.map((row) => row.value.documentId) : []
    const eligible = ids.length
      ? await searchClient().fetch<string[]>(
          `*[_id in $ids && _type == $type && language == $language && ${ELIGIBILITY}]._id`,
          { ids, type: COLLECTIONS[input.type], language: input.language }
        )
      : []
    const valid = result.status === 'success' && ids.every((id) => eligible.includes(id))
    const hit = item.assertion !== 'positive' || ids.slice(0, 5).some((id) => item.expected_document_ids?.includes(id))
    reports.push({ id: item.id, run, assertion: item.assertion, elapsedMs, ids, valid, hit, passed: valid && hit })
    console.log(`${item.id} run ${run}: ${valid && hit ? 'PASS' : 'FAIL'} (${elapsedMs}ms)`)
  }
}
const ordered = timings.sort((a, b) => a - b)
const p95Ms = ordered[Math.ceil(ordered.length * 0.95) - 1]
const passed = reports.every((row) => row.passed) && p95Ms <= 3000
const report = {
  provider,
  timestamp: new Date().toISOString(),
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: 'production',
  p95Ms,
  passed,
  reports,
}
await writeFile(new URL(`evaluation-${provider}.json`, folder), JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify({ provider, passed, p95Ms, cases: reports.length }))
if (args.includes('--check') && !passed) process.exitCode = 1
