import { writeFile } from 'node:fs/promises'
const args = process.argv.slice(2)
const base = args[args.indexOf('--base-url') + 1]
if (!base?.startsWith('http')) throw new Error('Specify --base-url')
const checks: { path: string; status: number; cards: number; cache: string | null; passed: boolean }[] = []
const signatures = new Map<string, string>()
for (const [path, query] of [
  ['/pl/integracje/filtr/', 'Budowanie Mostu'],
  ['/pl/integracje/filtr/', 'Warsztaty Florystyczne'],
  ['/en/activities/filter/', 'Art & Wine'],
  ['/en/activities/filter/', 'Saboteur'],
  ['/pl/hotele/filtr/', 'Barceló Warsaw Powiśle'],
  ['/pl/hotele/filtr/', 'Zamek Janów Podlaski'],
  ['/en/hotels/filter/', 'Mierzęcin Palace'],
  ['/en/hotels/filter/', 'Kliczków Castle'],
  ['/en/hotels/page/2/filter/', 'hotel'],
  ['/pl/hotele/strona/2/filtr/', 'hotel'],
]) {
  const url = new URL(path, base)
  url.searchParams.set('search', query)
  const response = await fetch(url, { signal: AbortSignal.timeout(60_000) })
  const html = await response.text()
  const cards = [...html.matchAll(/<article\b[^>]*>[\s\S]*?<\/article>/g)]
    .map((match) => match[0])
    .filter((card) =>
      path.includes('hotel') || path.includes('hotele')
        ? card.includes('class="HotelCard"')
        : card.includes('data-activity-card')
    )
  const signature = cards.map((card) => /href="([^"]+)"/.exec(card)?.[1] ?? '').join('|')
  const previous = signatures.get(path)
  const passed =
    response.ok &&
    cards.length > 0 &&
    !html.includes('data-search-unavailable') &&
    (!previous || previous !== signature)
  signatures.set(path, signature)
  checks.push({
    path: url.pathname + url.search,
    status: response.status,
    cards: cards.length,
    cache: response.headers.get('x-vercel-cache'),
    passed,
  })
  console.log(`${passed ? 'PASS' : 'FAIL'} ${url.pathname} (${cards.length} cards)`)
}
for (const path of [
  '/pl/hotele/filtr/?search=hotel&stars=5&order=priceAsc',
  '/en/hotels/filter/?search=hotel&stars=5&order=priceAsc',
  '/en/activities/filter/?search=painting&order=newest',
]) {
  const response = await fetch(new URL(path, base), { signal: AbortSignal.timeout(60_000) })
  const html = await response.text()
  const cards = [...html.matchAll(/<article\b/g)].length
  checks.push({
    path,
    status: response.status,
    cards,
    cache: response.headers.get('x-vercel-cache'),
    passed: response.ok && !html.includes('data-search-unavailable'),
  })
}
const passed = checks.every((check) => check.passed)
await writeFile(
  new URL(
    `../../../context/changes/sanity-dataset-embeddings-migration/smoke-${new URL(base).hostname === 'localhost' ? 'local' : 'deployed'}.json`,
    import.meta.url
  ),
  JSON.stringify({ base, timestamp: new Date().toISOString(), passed, checks }, null, 2) + '\n'
)
console.log(JSON.stringify({ passed, checks: checks.length }))
if (args.includes('--check') && !passed) process.exitCode = 1
