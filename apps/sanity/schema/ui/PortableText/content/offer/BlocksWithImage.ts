import { defineField } from 'sanity'
import { ListIcon } from '@sanity/icons'
import { toPlainText } from '../../../../../utils/to-plain-text'
import { sectionPreview } from '../../../../../utils/section-preview'

const name = 'BlocksWithImage'
const title = 'Lista bloków ze zdjęciem'
const icon = ListIcon

export default defineField({
  name,
  type: 'object',
  title,
  ...sectionPreview({ imgUrl: `/static/offer/${name}.webp`, icon }),
  fields: [
    defineField({
      name: 'blocks',
      type: 'array',
      title: 'Lista bloków',
      validation: (Rule) => Rule.required().min(2).max(6).error('Musisz dodać od 2 do 6 bloków'),
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
              type: 'Heading',
              title: 'Treść bloku',
              validation: (Rule) => Rule.required(),
            }),
          ],
          preview: {
            select: {
              title: 'text',
              media: 'image',
            },
            prepare: ({ title, media }) => ({
              title: toPlainText(title),
              media: media || icon,
            }),
          },
        },
      ],
    }),
  ],
  preview: {
    select: {
      blocks: 'blocks',
    },
    prepare: ({ blocks = [] }) => {
      const count = blocks.length
      let subtitle
      if (count === 0) {
        subtitle = 'Brak elementów'
      } else if (count === 1) {
        subtitle = '1 element'
      } else if (count >= 2 && count <= 4) {
        subtitle = `${count} elementy`
      } else {
        subtitle = `${count} elementów`
      }

      return {
        title,
        ...(subtitle && { subtitle }),
      }
    },
  },
})
