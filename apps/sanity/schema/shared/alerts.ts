import { toPlainText } from '../../utils/to-plain-text'

import { AlertCircleIcon } from 'lucide-react'
import { defineField } from 'sanity'
import { InternalLinkableTypes } from '../../structure/internal-linkable-types'

export const createAlertsObject = ({
  heading = 'Alerty (opcjonalne)',
  paragraph = 'Alerty wyświetlane w koszyku.',
}: {
  heading?: string
  paragraph?: string
}) =>
  defineField({
    name: 'alerts',
    type: 'array',
    title: heading,
    description: paragraph,
    of: [
      {
        type: 'object',
        fields: [
          defineField({
            name: 'heading',
            type: 'Heading',
            title: 'Nagłówek',
            validation: (Rule) => Rule.required(),
          }),
          defineField({
            name: 'paragraph',
            type: 'Heading',
            title: 'Paragraf',
            validation: (Rule) => Rule.required(),
          }),
          defineField({
            name: 'cta',
            type: 'object',
            title: 'Przycisk CTA',
            validation: (Rule) => Rule.required(),
            fields: [
              defineField({
                name: 'text',
                type: 'string',
                title: 'Tekst przycisku',
              }),
              defineField({
                name: 'internalReference',
                type: 'reference',
                title: 'Wewnętrzna referencja do strony',
                description: 'Wybierz wewnętrzną stronę do linkowania.',
                to: InternalLinkableTypes,
                options: {
                  disableNew: true,
                  filter: ({ document }) => {
                    const language = (document as { language?: string })?.language
                    return {
                      filter: 'defined(slug.current) && language == $lang',
                      params: { lang: language },
                    }
                  },
                },
              }),
            ],
          }),
        ],
        preview: {
          select: {
            title: 'heading',
            paragraph: 'paragraph',
          },
          prepare({ title, paragraph }) {
            return {
              title: toPlainText(title),
              subtitle: toPlainText(paragraph),
              icon: AlertCircleIcon,
            }
          },
        },
      },
    ],
    group: 'alerts',
  })
