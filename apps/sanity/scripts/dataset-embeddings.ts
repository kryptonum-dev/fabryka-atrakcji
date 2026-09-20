import { readFile, writeFile } from 'node:fs/promises'
import { searchClient } from '../../astro/src/server/search/search-client'
import { SEARCH_API_VERSION, SEARCH_DATASET } from '../../astro/src/server/search/contracts'

const projection = (
  await readFile(new URL('../config/dataset-embeddings.projection.groq', import.meta.url), 'utf8')
).trim()
const projectId = process.env.SANITY_PROJECT_ID
const token = process.env.SANITY_API_TOKEN || process.env.SANITY_AUTH_TOKEN
if (!projectId || !token) throw new Error('SANITY_PROJECT_ID and management token are required')
const endpoint = `https://api.sanity.io/v${SEARCH_API_VERSION}/projects/${projectId}/datasets/${SEARCH_DATASET}/settings/embeddings`
const args = process.argv.slice(2)
async function settings(method = 'GET') {
  const response = await fetch(endpoint, {
    method,
    signal: AbortSignal.timeout(30_000),
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    ...(method === 'PUT' ? { body: JSON.stringify({ enabled: true, projection }) } : {}),
  })
  if (!response.ok) throw new Error(`Settings HTTP ${response.status}: ${(await response.text()).slice(0, 1000)}`)
  return response.json()
}
async function queryReady(): Promise<boolean> {
  try {
    await searchClient().fetch<unknown>(
      '*[_type == "Hotels_Collection"] | score(text::semanticSimilarity("hotel"))[0...1]{_id}',
      {},
      { signal: AbortSignal.timeout(8000) }
    )
    return true
  } catch {
    return false
  }
}
async function waitUntilReady() {
  const deadline = Date.now() + 10 * 60_000
  while (Date.now() < deadline) {
    const state = await settings()
    console.log(JSON.stringify({ enabled: state.enabled, status: state.status }))
    if (state.status === 'error' || !state.enabled) throw new Error('Embeddings are not available')
    if (state.status === 'ready' && (await queryReady())) {
      if (state.projection?.trim() !== projection) throw new Error('Projection does not match')
      return
    }
    await new Promise((resolve) => setTimeout(resolve, 10_000))
  }
  throw new Error('Embeddings readiness timed out after ten minutes')
}
let before = await settings()
if (args[0] === 'enable') {
  console.log(
    JSON.stringify(
      {
        projectId,
        dataset: SEARCH_DATASET,
        before,
        intended: { enabled: true, projection },
        apply: args.includes('--apply'),
      },
      null,
      2
    )
  )
  if (args.includes('--apply')) {
    await writeFile(
      new URL(
        '../../../context/changes/sanity-dataset-embeddings-migration/settings-before-enable.json',
        import.meta.url
      ),
      JSON.stringify(before, null, 2) + '\n',
      { flag: 'wx' }
    )
    console.log(JSON.stringify(await settings('PUT'), null, 2))
    if (args.includes('--wait')) await waitUntilReady()
  }
} else if (args[0] === 'status') {
  if (args.includes('--wait')) {
    await waitUntilReady()
    before = await settings()
  }
  console.log(JSON.stringify(before, null, 2))
  if (
    args.includes('--check-ready') &&
    !(before.enabled && before.status === 'ready' && before.projection?.trim() === projection && (await queryReady()))
  )
    process.exitCode = 1
} else throw new Error('Usage: status [--check-ready] | enable [--apply]')
