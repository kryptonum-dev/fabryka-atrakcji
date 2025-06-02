import { LinkIcon } from '@sanity/icons'
import { defineField } from 'sanity'

const name = 'Buttons'
const title = 'Rząd przycisków'
const icon = LinkIcon

export default defineField({
  name,
  type: 'object',
  title,
  icon,
  fields: [
    defineField({
      name: 'buttons',
      type: 'array',
      title: 'Przyciski',
      validation: (Rule) =>
        Rule.required().min(1).max(2).error('Lista musi zawierać co najmniej jeden punkt i maksymalnie dwa'),
      of: [{ type: 'cta' }],
    }),
  ],
  preview: {
    prepare() {
      return {
        title,
        icon,
      }
    },
  },
})
