import { UserIcon } from '@sanity/icons'
import { defineField } from 'sanity'
import { sectionPreview } from '../../../utils/section-preview'

const name = 'Quote'
const title = 'Bloczek z cytatem'
const icon = UserIcon

export default defineField({
  name: name,
  type: 'object',
  title: title,
  ...sectionPreview({ imgUrl: `/static/BlogPost_Collection/${name}.webp`, icon }),
  fields: [
    defineField({
      name: 'quote',
      type: 'text',
      title: 'Cytat',
      description: 'Cytat sam w sobie, będzie w kursywie.',
      rows: 2,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'author',
      type: 'object',
      title: 'Autor',
      fields: [
        defineField({
          name: 'name',
          type: 'string',
          title: 'Imię',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'title',
          type: 'string',
          title: 'Stanowisko i firma',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'image',
          type: 'image',
          title: 'Zdjęcie',
          validation: (Rule) => Rule.required(),
        }),
      ],
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {
      quote: 'quote',
    },
    prepare: ({ quote }) => ({
      title,
      subtitle: `"${quote}"`,
      icon,
    }),
  },
})
