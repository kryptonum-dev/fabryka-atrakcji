import { CheckmarkIcon } from '@sanity/icons'
import { defineField } from 'sanity'
import { sectionPreview } from '../../../utils/section-preview'

const name = 'Checklist'
const title = 'Lista punktów z ptaszkami'
const icon = CheckmarkIcon

export default defineField({
  name,
  type: 'object',
  title,
  ...sectionPreview({ imgUrl: `/static/BlogPost_Collection/${name}.webp`, icon }),
  fields: [
    defineField({
      name: 'items',
      type: 'array',
      title: 'Punkty',
      validation: (Rule) => Rule.required().min(1).error('Lista musi zawierać co najmniej jeden punkt'),
      of: [{ type: 'string' }],
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
