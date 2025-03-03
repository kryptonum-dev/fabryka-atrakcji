import { Book } from 'lucide-react'
import { defineField, defineType } from 'sanity'
import { defineSlugForDocument } from '../../utils/define-slug-for-document'

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
    }),
    defineField({
      name: 'components',
      type: 'components',
      title: 'Page Components',
    }),
  ],
  preview: {
    select: {
      title: 'name',
    },
    prepare: ({ title }) => ({
      title,
      icon,
    }),
  },
})
