import { Tag } from 'lucide-react'
import { defineField, defineType } from 'sanity'

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
