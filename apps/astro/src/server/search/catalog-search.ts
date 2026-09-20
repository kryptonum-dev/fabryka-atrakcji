import {
  parseCandidates,
  SEARCH_TIMEOUT_MS,
  type SearchInput,
  type SearchProvider,
  type SearchResult,
} from './contracts'
import { datasetSearch } from './dataset-provider'
import { legacySearch } from './legacy-provider'
import { searchConfig } from './search-client'

type Provider = (input: SearchInput, signal: AbortSignal) => Promise<unknown>
type Options = {
  provider?: string
  signal?: AbortSignal
  timeoutMs?: number
  providers?: Record<SearchProvider, Provider>
}

export async function catalogSearch(input: SearchInput, options: Options = {}): Promise<SearchResult> {
  const provider = options.provider ?? searchConfig().provider
  const started = Date.now()
  const controller = new AbortController()
  const abort = () => controller.abort()
  options.signal?.addEventListener('abort', abort, { once: true })
  if (options.signal?.aborted) abort()
  const timer = setTimeout(abort, options.timeoutMs ?? SEARCH_TIMEOUT_MS)
  let rejectOnAbort: () => void = () => {}
  try {
    if (controller.signal.aborted) throw new Error('Search aborted')
    if (provider !== 'legacy' && provider !== 'dataset') throw new Error('Invalid search provider')
    const providers = options.providers ?? { legacy: legacySearch, dataset: datasetSearch }
    const aborted = new Promise<never>((_, reject) => {
      rejectOnAbort = () => reject(new Error('Search aborted'))
      if (controller.signal.aborted) rejectOnAbort()
      else controller.signal.addEventListener('abort', rejectOnAbort, { once: true })
    })
    const result = await Promise.race([providers[provider](input, controller.signal), aborted])
    const data = parseCandidates(result, input.type)
    console.info('[search]', { provider, durationMs: Date.now() - started, status: 'success' })
    return { status: 'success', data }
  } catch {
    console.error('[search]', {
      provider: provider === 'dataset' ? 'dataset' : provider === 'legacy' ? 'legacy' : 'invalid',
      durationMs: Date.now() - started,
      status: controller.signal.aborted ? 'aborted' : 'unavailable',
    })
    return { status: 'unavailable' }
  } finally {
    clearTimeout(timer)
    options.signal?.removeEventListener('abort', abort)
    controller.signal.removeEventListener('abort', rejectOnAbort)
  }
}
