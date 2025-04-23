import { defineField, defineType } from 'sanity'
import { TagIcon } from '@sanity/icons'

const title = 'Lista Udogodnień'
const icon = TagIcon

export default defineType({
  name: 'Amenities_Collection',
  type: 'document',
  title,
  icon,
  fields: [
    defineField({
      name: 'language',
      type: 'string',
      readOnly: true,
      hidden: true,
    }),
    defineField({
      name: 'name',
      type: 'string',
      title: 'Nazwa udogodnienia',
      validation: (Rule) => Rule.required().error('Nazwa udogodnienia jest wymagana'),
    }),
  ],
  preview: {
    select: {
      title: 'name',
    },
    prepare: ({ title }) => ({
      title: title || 'Brak nazwy',
      media: icon,
    }),
  },
})
