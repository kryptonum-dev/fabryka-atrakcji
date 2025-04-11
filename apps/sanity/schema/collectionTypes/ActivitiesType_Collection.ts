import { Tag } from 'lucide-react'
import { defineField, defineType } from 'sanity'
import { slugify } from '../../utils/slugify'

const title = 'Rodzaj aktywności'
const icon = Tag

export default defineType({
  name: 'ActivitiesType_Collection',
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
      title: 'Nazwa rodzaju aktywności',
      validation: (Rule) => Rule.required(),
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
    prepare({ title }) {
      return {
        title,
        media: icon,
      }
    },
  },
})
