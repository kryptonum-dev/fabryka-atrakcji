export function sanityImageUrl(baseUrl: string, params: { w?: number; h?: number; q?: number; fit?: string }): string {
  const url = new URL(baseUrl)
  if (params.w) url.searchParams.set('w', String(params.w))
  if (params.h) url.searchParams.set('h', String(params.h))
  url.searchParams.set('auto', 'format')
  url.searchParams.set('q', String(params.q ?? 75))
  if (params.fit) url.searchParams.set('fit', params.fit)
  return url.toString()
}

export function sanityImageSrcset(
  baseUrl: string,
  widths: number[],
  maxOriginalWidth: number,
  quality?: number,
): string {
  const filtered = widths.filter((w) => w <= maxOriginalWidth)
  if (!filtered.includes(maxOriginalWidth)) {
    filtered.push(maxOriginalWidth)
  }
  return filtered
    .map((w) => `${sanityImageUrl(baseUrl, { w, q: quality ?? 75 })} ${w}w`)
    .join(', ')
}
