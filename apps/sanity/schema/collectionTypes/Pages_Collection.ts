import { Book } from 'lucide-react'
import { defineField, defineType } from 'sanity'
import { defineSlugForDocument } from '../../utils/define-slug-for-document'
import { ComposeIcon, SearchIcon } from '@sanity/icons'

const title = 'Podstrony'
const icon = Book

export default defineType({
  name: 'Pages_Collection',
  type: 'document',
  title,
  icon,
  options: { documentPreview: true },
  fields: [
    defineField({
      name: 'language',
      type: 'string',
      readOnly: true,
      hidden: true,
    }),
    ...defineSlugForDocument({
      prefixes: {
        pl: '/pl/',
        en: '/en/',
      },
      group: 'content',
    }),
    defineField({
      name: 'components',
      type: 'components',
      title: 'Page Components',
      group: 'content',
    }),
    defineField({
      name: 'seo',
      type: 'seo',
      title: 'SEO',
      group: 'seo',
    }),
  ],
  groups: [
    {
      name: 'content',
      title: 'Treść',
      icon: ComposeIcon,
    },
    {
      name: 'seo',
      title: 'SEO',
      icon: SearchIcon,
    },
  ],
  preview: {
    select: {
      title: 'name',
      slug: 'slug.current',
    },
    prepare: ({ title, slug }) => ({
      title,
      subtitle: slug,
      icon,
    }),
  },
})
