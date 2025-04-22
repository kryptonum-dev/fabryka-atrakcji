import { defineField } from 'sanity'
import { ClockIcon } from '@sanity/icons'
import { toPlainText } from '../../../../../utils/to-plain-text'

const title = 'Oś czasu'
const icon = ClockIcon
export default defineField({
  name: 'timeline',
  type: 'object',
  title,
  icon,
  fields: [
    defineField({
      name: 'heading',
      type: 'Heading',
      title: 'Nagłówek osi (opcjonalny)',
    }),
    defineField({
      name: 'timelineItems',
      type: 'array',
      title: 'Elementy osi',
      of: [
        {
          type: 'object',
          fields: [
            { type: 'string', name: 'title', title: 'Tytuł', validation: (Rule) => Rule.required() },
            { type: 'text', rows: 3, name: 'description', title: 'Opis (opcjonalny)' },
            {
              type: 'number',
              name: 'duration',
              title: 'Czas trwania (w minutach)',
              validation: (Rule) => Rule.required().integer().min(1),
            },
          ],
          preview: {
            select: {
              title: 'title',
              description: 'description',
              duration: 'duration',
            },
            prepare: ({ title, description, duration }) => ({
              title: `${title} (${duration} min)`,
              ...(description && { subtitle: description }),
              media: icon,
            }),
          },
        },
      ],
      validation: (Rule) => Rule.required().min(1).error('Musisz dodać minimum 1 element osi'),
    }),
  ],

  preview: {
    select: {
      heading: 'heading',
    },
    prepare: ({ heading }) => ({
      title,
      ...(heading && { subtitle: toPlainText(heading) }),
      media: icon,
    }),
  },
})
