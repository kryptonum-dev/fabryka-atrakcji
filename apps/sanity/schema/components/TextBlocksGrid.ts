import { LayoutGrid, Square } from 'lucide-react'
import { defineField } from 'sanity'
import { sectionPreview } from '../../utils/section-preview'
import sectionId from '../ui/sectionId'
import { toPlainText } from '../../utils/to-plain-text'

const name = 'TextBlocksGrid'
const title = 'Siatka bloków tekstowych'
const icon = LayoutGrid

export default defineField({
  name,
  type: 'object',
  title,
  icon,
  fields: [
    defineField({
      name: 'list',
      type: 'array',
      title: 'Lista bloków z tekstem',
      validation: (Rule) =>
        Rule.required().min(6).max(16).error('Wymagana jest lista z co najmniej 6 i co najwyżej 16 bloków'),
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'heading', type: 'Heading', title: 'Nagłówek' }),
            defineField({ name: 'paragraph', type: 'Heading', title: 'Paragraf' }),
          ],
          preview: {
            select: {
              heading: 'heading',
              paragraph: 'paragraph',
            },
            prepare: ({ heading, paragraph }) => ({
              title: toPlainText(heading),
              subtitle: toPlainText(paragraph),
              media: Square,
            }),
          },
        },
      ],
    }),
    ...sectionId,
  ],
  preview: {
    select: {
      heading: 'heading',
    },
    prepare: () => ({
      title: title,
      ...sectionPreview({ imgUrl: `/static/components/${name}.webp`, icon }),
    }),
  },
})
