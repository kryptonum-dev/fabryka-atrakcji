import { defineField, defineType } from 'sanity'
import { TagIcon } from '@sanity/icons'
import { slugify } from '../../utils/slugify'

const title = 'Lista Cech Przestrzeni'
const icon = TagIcon

export default defineType({
  name: 'EventSpaceFeatures_Collection',
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
      title: 'Nazwa cechy przestrzeni',
      validation: (Rule) => Rule.required().error('Nazwa cechy przestrzeni jest wymagana'),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      title: 'Slug (uzywany do filtrowania)',
      description: 'Automatycznie generowany na podstawie nazwy, uzywany do filtrowania przestrzeni eventowych',
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
