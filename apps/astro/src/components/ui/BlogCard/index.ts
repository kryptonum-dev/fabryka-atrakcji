import { PortableTextQuery } from '../portable-text'
import { ImageDataQuery } from '../image'
import type { PortableTextProps } from 'astro-portabletext/types'
import type { ImageDataProps } from '../image'
import type { PortableTextValue } from '../portable-text'
import { ContentPT_Query } from '../../blog/post/content-pt/index.astro'

export { default as ReactBlogCard } from './Card'
export { default as AstroBlogCard } from './Card.astro'

export const BlogCardQuery = `
  name,
  "slug": slug.current,
  category -> {
    name,
    'slug': slug.current,
    'count': count(*[_type == 'BlogPost_Collection' && references(^._id) && defined(category)])
  },
  description,
  ${PortableTextQuery('title')}
  ${ImageDataQuery('image')}
  _createdAt,
  ${ContentPT_Query}
`
export type BlogCardProps = {
  name: string
  slug: string
  category: {
    name: string
    slug: string
    count: number
  }
  description: string
  title: PortableTextValue
  image: ImageDataProps
  imageConfig: {
    sizes: string
    loading: 'lazy' | 'eager'
  }
  _createdAt: string
  content: PortableTextProps['value']
  readingTime: number
}
