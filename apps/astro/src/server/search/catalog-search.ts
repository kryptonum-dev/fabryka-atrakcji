import { parseCandidates, SEARCH_TIMEOUT_MS, type SearchInput, type SearchResult } from './contracts'
import { datasetSearch } from './dataset-provider'

type Provider = (input: SearchInput, signal: AbortSignal) => Promise<unknown>
type Options = {
  signal?: AbortSignal
  timeoutMs?: number
  retrieve?: Provider
}

export async function catalogSearch(input: SearchInput, options: Options = {}): Promise<SearchResult> {
  const started = Date.now()
  const controller = new AbortController()
  const abort = () => controller.abort()
  options.signal?.addEventListener('abort', abort, { once: true })
  if (options.signal?.aborted) abort()
  const timer = setTimeout(abort, options.timeoutMs ?? SEARCH_TIMEOUT_MS)
  let rejectOnAbort: () => void = () => {}
  try {
    if (controller.signal.aborted) throw new Error('Search aborted')
    const aborted = new Promise<never>((_, reject) => {
      rejectOnAbort = () => reject(new Error('Search aborted'))
      if (controller.signal.aborted) rejectOnAbort()
      else controller.signal.addEventListener('abort', rejectOnAbort, { once: true })
    })
    const result = await Promise.race([(options.retrieve ?? datasetSearch)(input, controller.signal), aborted])
    const data = parseCandidates(result, input.type)
    console.info('[search]', { provider: 'dataset', durationMs: Date.now() - started, status: 'success' })
    return { status: 'success', data }
  } catch (error) {
    const statusCode =
      typeof (error as { statusCode?: unknown })?.statusCode === 'number'
        ? (error as { statusCode: number }).statusCode
        : undefined
    console.error('[search]', {
      statusCode,
      category: statusCode === 401 || statusCode === 403 ? 'authorization' : statusCode === 429 ? 'quota' : 'provider',
      provider: 'dataset',
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
