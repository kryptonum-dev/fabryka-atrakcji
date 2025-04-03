import { defineField } from 'sanity'
import { sectionPreview } from '../../../utils/section-preview'
import { toPlainText } from '../../../utils/to-plain-text'
import { ChartUpwardIcon } from '@sanity/icons'

const name = 'ComparisonTable'
const title = 'Tabela porównawcza'
const icon = ChartUpwardIcon

export default defineField({
  name: name,
  type: 'object',
  title: title,
  ...sectionPreview({ imgUrl: `/static/BlogPost_Collection/${name}.webp`, icon }),

  fields: [
    defineField({
      name: 'comparisonHeading',
      type: 'object',
      title: 'Nagłówki porównania',
      options: {
        columns: 2,
      },
      fields: [
        defineField({
          name: 'leftColumn',
          type: 'string',
          title: 'Lewa kolumna',
        }),
        defineField({
          name: 'rightColumn',
          type: 'string',
          title: 'Prawa kolumna',
        }),
      ],

      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'comparisonTable',
      type: 'array',
      title: 'Lista elementów porównawczych',
      of: [
        {
          type: 'object',
          name: 'item',
          title: 'Element porównawczy',
          fields: [
            defineField({
              name: 'heading',
              type: 'Heading',
              title: 'Nagłówek',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'comparisonItems',
              type: 'object',
              title: 'Elementy porównawcze',
              options: {
                columns: 2,
              },
              fields: [
                defineField({
                  name: 'leftColumn',
                  type: 'text',
                  rows: 2,
                  title: 'Lewa kolumna',
                }),
                defineField({
                  name: 'rightColumn',
                  type: 'text',
                  rows: 2,
                  title: 'Prawa kolumna',
                }),
              ],
              validation: (Rule) => Rule.required(),
            }),
          ],
          preview: {
            select: {
              heading: 'heading',
              comparisonItems: 'comparisonItems',
            },
            prepare: ({ heading }) => ({
              title: toPlainText(heading),
              media: icon,
            }),
          },
        },
      ],
      validation: (Rule) => Rule.required(),
    }),
  ],

  preview: {
    select: {
      comparisonHeading: 'comparisonHeading',
      comparisonTable: 'comparisonTable',
    },
    prepare: ({ comparisonHeading }) => ({
      title: `Tabela porównawcza${comparisonHeading ? ` [${comparisonHeading.leftColumn} vs ${comparisonHeading.rightColumn}]` : ''}`,
    }),
  },
})
