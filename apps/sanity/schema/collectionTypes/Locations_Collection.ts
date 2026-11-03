import { orderRankField, orderRankOrdering } from '@sanity/orderable-document-list'
import { MapPin } from 'lucide-react'
import { defineField, defineType } from 'sanity'
import { slugify } from '../../utils/slugify'

const name = 'Locations_Collection'
const title = 'Lokalizacje'
const icon = MapPin

export default defineType({
  name,
  type: 'document',
  title,
  icon,
  orderings: [orderRankOrdering],
  fields: [
    orderRankField({ type: name }),
    defineField({
      name: 'language',
      type: 'string',
      readOnly: true,
      hidden: true,
    }),
    defineField({
      name: 'name',
      type: 'string',
      title: 'Nazwa lokalizacji',
      validation: (Rule) => Rule.required().error('Nazwa lokalizacji jest wymagana'),
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
      icon,
    }),
  },
})
