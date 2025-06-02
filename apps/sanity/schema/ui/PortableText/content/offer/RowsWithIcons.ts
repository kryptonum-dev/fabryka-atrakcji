import { defineField } from 'sanity'
import { ThListIcon } from '@sanity/icons'
import { sectionPreview } from '../../../../../utils/section-preview'

const name = 'RowsWithIcons'
const title = 'Wiersze z ikonami'
const icon = ThListIcon

export default defineField({
  name,
  type: 'object',
  title,
  ...sectionPreview({ imgUrl: `/static/offer/${name}.webp`, icon }),
  fields: [
    defineField({
      name: 'rows',
      type: 'array',
      title: 'Lista wierszy',
      validation: (Rule) => Rule.required().min(2).error('Musisz dodać minimum 2 wiersze'),
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'icon',
              type: 'image',
              title: 'Ikona',
              validation: (Rule) => Rule.required().error('Ikona jest wymagana'),
              options: {
                accept: '.svg',
              },
            }),
            defineField({
              name: 'text',
              type: 'string',
              title: 'Tekst',
              validation: (Rule) => Rule.required(),
            }),
          ],
          preview: {
            select: {
              title: 'text',
              media: 'icon',
            },
            prepare: ({ title, media }) => ({
              title,
              media: media || icon,
            }),
          },
        },
      ],
    }),
  ],
  preview: {
    select: {
      rows: 'rows',
    },
    prepare: ({ rows = [] }) => {
      const count = rows.length
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
