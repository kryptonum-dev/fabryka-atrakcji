import { defineField } from 'sanity'
import { ArrowRightIcon } from '@sanity/icons'
import { toPlainText } from '../../../../../utils/to-plain-text'

const title = 'Lista następnych kroków'
const icon = ArrowRightIcon

export default defineField({
  name: 'NextSteps',
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
      name: 'timelineItems',
      type: 'array',
      title: 'Elementy osi',
      of: [
        {
          type: 'object',
          fields: [
            { type: 'string', name: 'title', title: 'Tytuł', validation: (Rule) => Rule.required() },
            { type: 'PortableText', name: 'description', title: 'Opis (opcjonalny)' },
          ],
          preview: {
            select: {
              title: 'title',
              description: 'description',
            },
            prepare: ({ title, description }) => ({
              title,
              ...(description && { subtitle: toPlainText(description) }),
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
