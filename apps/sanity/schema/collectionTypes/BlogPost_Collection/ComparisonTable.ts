import { defineField } from 'sanity'
import { sectionPreview } from '../../../utils/section-preview'
import { toPlainText } from '../../../utils/to-plain-text'
import { ChartUpwardIcon } from '@sanity/icons'

const name = 'ComparisonTable'
const title = 'Tabela porównawcza'
const icon = ChartUpwardIcon

type ComparisonColumns = {
  leftColumn?: string
  rightColumn?: string
  thirdColumn?: string
  fourthColumn?: string
}

const columnOrder = (value: ComparisonColumns) => [
  value.leftColumn,
  value.rightColumn,
  value.thirdColumn,
  value.fourthColumn,
]

// Liczba kolumn = pozycja ostatniego wypełnionego nagłówka (min. 2, maks. 4)
const countColumns = (value: ComparisonColumns) =>
  columnOrder(value).reduce((count, column, index) => (column?.trim() ? index + 1 : count), 0)

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
      description:
        'Wypełnij od 2 do 4 kolumn. Tabela wyświetli tyle kolumn, ile nagłówków tutaj uzupełnisz — puste kolumny 3 i 4 są pomijane.',
      options: {
        columns: 2,
      },
      fields: [
        defineField({
          name: 'leftColumn',
          type: 'string',
          title: 'Kolumna 1',
        }),
        defineField({
          name: 'rightColumn',
          type: 'string',
          title: 'Kolumna 2',
        }),
        defineField({
          name: 'thirdColumn',
          type: 'string',
          title: 'Kolumna 3 (opcjonalna)',
        }),
        defineField({
          name: 'fourthColumn',
          type: 'string',
          title: 'Kolumna 4 (opcjonalna)',
        }),
      ],

      validation: (Rule) =>
        Rule.required().custom((value) => {
          const columns = value as ComparisonColumns | undefined
          if (!columns) return true
          if (countColumns(columns) < 2) return 'Wypełnij nagłówki co najmniej dwóch kolumn.'
          if (columns.thirdColumn?.trim() && !columns.rightColumn?.trim())
            return 'Nie zostawiaj luki — wypełnij kolumnę 2 zanim uzupełnisz kolumnę 3.'
          if (columns.fourthColumn?.trim() && !columns.thirdColumn?.trim())
            return 'Nie zostawiaj luki — wypełnij kolumnę 3 zanim uzupełnisz kolumnę 4.'
          return true
        }),
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
              description: 'Wypełnij tyle kolumn, ile nagłówków ustawiłeś w „Nagłówki porównania”.',
              options: {
                columns: 2,
              },
              fields: [
                defineField({
                  name: 'leftColumn',
                  type: 'text',
                  rows: 2,
                  title: 'Kolumna 1',
                }),
                defineField({
                  name: 'rightColumn',
                  type: 'text',
                  rows: 2,
                  title: 'Kolumna 2',
                }),
                defineField({
                  name: 'thirdColumn',
                  type: 'text',
                  rows: 2,
                  title: 'Kolumna 3 (opcjonalna)',
                }),
                defineField({
                  name: 'fourthColumn',
                  type: 'text',
                  rows: 2,
                  title: 'Kolumna 4 (opcjonalna)',
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
    prepare: ({ comparisonHeading }: { comparisonHeading?: ComparisonColumns }) => {
      const columns = comparisonHeading
        ? columnOrder(comparisonHeading)
            .slice(0, Math.max(2, countColumns(comparisonHeading)))
            .map((column) => column?.trim() || '—')
        : []
      return {
        title: `Tabela porównawcza${columns.length ? ` [${columns.join(' vs ')}]` : ''}`,
      }
    },
  },
})
