import { MapPin } from 'lucide-react'
import { defineField, defineType } from 'sanity'

const title = 'Lokalizacje'
const icon = MapPin

export default defineType({
  name: 'Locations_Collection',
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
      title: 'Nazwa lokalizacji',
      validation: (Rule) => Rule.required().error('Nazwa lokalizacji jest wymagana'),
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
