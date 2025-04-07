import type { PortableTextProps } from 'astro-portabletext/types'
import { ImageDataQuery, type ImageDataProps } from '../image'
import { PortableTextQuery, type PortableTextValue } from '../portable-text'
import { ContentPT_Query } from '../../blog/post/content-pt/index.astro'

export const BlogPostCardQuery = `
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
export type BlogPostCardProps = {
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
  _createdAt: string
  content: PortableTextProps['value']
  readingTime: number
}

export default function BlogPostCard({
  name,
  slug,
  description,
  title,
  image,
  _createdAt,
  content,
  readingTime,
  category,
}: BlogPostCardProps) {
  return <div>BlogPostCard</div>
}
