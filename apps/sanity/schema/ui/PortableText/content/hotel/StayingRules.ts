import { ClipboardIcon } from '@sanity/icons'
import { defineField } from 'sanity'
import { sectionPreview } from '../../../../../utils/section-preview'
import { toPlainText } from '../../../../../utils/to-plain-text'

const name = 'StayingRules'
const title = 'Regulamin pobytu'
const icon = ClipboardIcon

export default defineField({
  name,
  type: 'object',
  title,
  ...sectionPreview({ imgUrl: `/static/BlogPost_Collection/${name}.webp`, icon }),
  fields: [
    defineField({
      name: 'heading',
      type: 'Heading',
      title: 'Nagłówek',
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {
      heading: 'heading',
    },
    prepare({ heading }) {
      return {
        title,
        subtitle: toPlainText(heading),
        icon,
      }
    },
  },
})
