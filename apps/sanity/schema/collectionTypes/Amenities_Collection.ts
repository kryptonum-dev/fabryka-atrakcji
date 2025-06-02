import { defineField, defineType } from 'sanity'
import { TagIcon } from '@sanity/icons'
import { slugify } from '../../utils/slugify'

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
    defineField({
      name: 'slug',
      type: 'slug',
      title: 'Slug (używany do filtrowania)',
      description: 'Automatycznie generowany na podstawie nazwy, używany do filtrowania aktywności',
      options: {
        source: 'name',
        slugify: slugify,
      },
      validation: (Rule) => Rule.required(),
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
