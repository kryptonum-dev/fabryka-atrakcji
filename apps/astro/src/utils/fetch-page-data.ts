import { Components_Query } from '../components/Components.astro'

import groq from 'groq'
import type { ComponentsProps } from '../components/Components.astro'
import type { Language } from '../global/languages'
import metadataFetch from './metadata.fetch'
import sanityFetch from './sanity.fetch'

export async function fetchPageData({ name, lang, slug }: { name: string; lang: Language; slug?: string }) {
  const singleTypeQuery = groq`
    *[_type == "${name}" && language == $language][0] {
  "slug": slug.current,
  ${Components_Query}
}
`
  const collectionTypeQuery = groq`
    *[_type == "Pages_Collection" && language == $language && slug.current == $slug][0] {
        "slug": slug.current,
        ${Components_Query}
    }
`
  const page = await sanityFetch<{
    slug: string
    components: ComponentsProps
  }>({
    query: slug ? collectionTypeQuery : singleTypeQuery,
    params: { slug: slug || '', language: lang },
  })

  if (!page) return null
  const metadata = await metadataFetch(page.slug)
  return { page, metadata }
}
