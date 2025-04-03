import { defineField } from 'sanity'
import { InternalLinkableTypes } from '../../../structure/internal-linkable-types'
import { isValidUrl } from '../../../utils/is-valid-url'
import Checklist from './Checklist'
import Buttons from './Buttons'
import Image from './Image'
import Quote from './Quote'
import ComparisonTable from './ComparisonTable'
import Faq from './Faq'
export default defineField({
  name: 'content',
  type: 'array',
  title: 'Treść wpisu',
  group: 'content',
  of: [
    defineField({
      type: 'block',
      name: 'block',
      styles: [
        { title: 'Normal', value: 'normal' },
        {
          title: 'Heading 2',
          value: 'h2',
          component: ({ children }) => <h2 style={{ fontSize: '1.875rem', fontWeight: 400, margin: 0 }}>{children}</h2>,
        },
        {
          title: 'Heading 3',
          value: 'h3',
          component: ({ children }) => <h3 style={{ fontSize: '1.5rem', fontWeight: 400, margin: 0 }}>{children}</h3>,
        },
      ],
      lists: [
        { title: 'Bullet', value: 'bullet' },
        { title: 'Numbered', value: 'number' },
      ],
      marks: {
        decorators: [
          {
            title: 'Strong',
            value: 'strong',
            component: ({ children }) => <strong style={{ fontWeight: 700 }}>{children}</strong>,
          },
          { title: 'Emphasis', value: 'em' },
        ],
        annotations: [
          defineField({
            name: 'link',
            type: 'object',
            title: 'Link',
            icon: () => '🔗',
            fields: [
              defineField({
                name: 'linkType',
                type: 'string',
                title: 'Typ',
                description:
                  'Wybierz "Zewnętrzny" dla linków do stron poza Twoim domeną lub "Wewnętrzny" dla linków do stron w ramach Twojej domeny.',
                options: {
                  list: ['external', 'internal'],
                  layout: 'radio',
                  direction: 'horizontal',
                },
                initialValue: 'internal',
                validation: (Rule) => Rule.required(),
              }),
              defineField({
                name: 'external',
                type: 'string',
                title: 'URL',
                description:
                  'Wpisz pełny URL. Upewnij się, że zaczyna się od "https://", "mailto:" lub "tel:" protokołu.',
                hidden: ({ parent }) => parent?.linkType !== 'external',
                validation: (Rule) => [
                  Rule.custom((value, { parent }) => {
                    const linkType = (parent as { linkType?: string })?.linkType
                    if (linkType === 'external') {
                      if (!value) return 'URL jest wymagane'
                      if (!value.startsWith('https://') && !value.startsWith('mailto:') && !value.startsWith('tel:')) {
                        return 'Link zewnętrzny musi zaczynać się od "https://", "mailto:" lub "tel:" protokołu'
                      }
                      if (!isValidUrl(value)) return 'Nieprawidłowy URL'
                    }
                    return true
                  }),
                ],
              }),
              defineField({
                name: 'internal',
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
                hidden: ({ parent }) => parent?.linkType !== 'internal',
                validation: (rule) => [
                  rule.custom((value, { parent }) => {
                    const linkType = (parent as { linkType?: string })?.linkType
                    if (linkType === 'internal' && !value?._ref) return 'Musisz wybrać wewnętrzną stronę do linkowania.'
                    return true
                  }),
                ],
              }),
            ],
          }),
        ],
      },
    }),
    Image,
    Buttons,
    Checklist,
    Quote,
    ComparisonTable,
    Faq,
  ],
  validation: (Rule) => Rule.required(),
})
