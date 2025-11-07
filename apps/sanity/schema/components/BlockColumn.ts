import { Columns } from 'lucide-react'
import { defineField } from 'sanity'
import { toPlainText } from '../../utils/to-plain-text'
import sectionId from '../ui/sectionId'
import { sectionPreview } from '../../utils/section-preview'

const name = 'BlockColumn'
const title = 'Kolumna z blokami'
const icon = Columns

export default defineField({
  name,
  type: 'object',
  title,
  icon,
  fields: [
    defineField({
      name: 'heading',
      type: 'Heading',
      title: 'Nagłówek',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'blocks',
      type: 'array',
      title: 'Lista bloków',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'image',
              type: 'image',
              title: 'Zdjęcie',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'text',
              type: 'text',
              rows: 2,
              title: 'Tekst',
              validation: (Rule) => Rule.required(),
            }),
          ],
          preview: {
            select: {
              text: 'text',
              image: 'image',
            },
            prepare: ({ text, image }) => ({
              title: text ? text.substring(0, 30) + (text.length > 30 ? '...' : '') : 'Blok',
              subtitle: 'Blok z tekstem i zdjęciem',
              media: image,
            }),
          },
        },
      ],
      validation: (Rule) => Rule.required().min(2).error('Wymagane co najmniej 2 bloki'),
    }),
    ...sectionId,
  ],
  preview: {
    select: {
      heading: 'heading',
    },
    prepare: ({ heading }) => ({
      title: title,
      subtitle: toPlainText(heading),
      ...sectionPreview({ imgUrl: `/static/components/${name}.webp`, icon }),
    }),
  },
})
