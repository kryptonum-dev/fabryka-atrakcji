import { RocketIcon } from '@sanity/icons'
import { defineField } from 'sanity'
import { sectionPreview } from '../../../utils/section-preview'
import { toPlainText } from '../../../utils/to-plain-text'

const name = 'Cta'
const title = 'Wezwanie do działania'
const icon = RocketIcon

export default defineField({
  name,
  type: 'object',
  title,
  ...sectionPreview({ imgUrl: `/static/BlogPost_Collection/${name}.webp`, icon }),
  fields: [
    defineField({
      name: 'heading',
      type: 'Heading',
      title: 'Nagłówek',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'paragraph',
      type: 'PortableText',
      title: 'Paragraf',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'highlightType',
      type: 'string',
      title: 'Typ wyróżnienia',
      description:
        'Typ wyróżnienia, determinuje jakiego typu dokumenty pokazujemy w tej sekcji oraz gdzie kierujemy użytkownika po kliknięciu w przycisk',
      options: {
        list: [
          { title: 'Integracje', value: 'activities' },
          { title: 'Realizacje', value: 'caseStudies' },
          { title: 'Hotele', value: 'hotels' },
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'activities',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'caseStudies',
      type: 'array',
      title: 'Wyróżnione realizacje',
      hidden: ({ parent }) => parent?.highlightType !== 'caseStudies',
      of: [
        {
          type: 'reference',
          to: [{ type: 'CaseStudy_Collection' }],
          options: {
            disableNew: true,
            filter: ({ parent, document }) => {
              const language = (document as { language?: string })?.language
              const selectedIds =
                (parent as { _ref?: string }[])?.filter((item) => item._ref).map((item) => item._ref) || []
              return {
                filter: '!(_id in $selectedIds) && !(_id in path("drafts.**")) && language == $lang',
                params: { selectedIds, lang: language },
              }
            },
          },
        },
      ],
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const parent = context.parent as { highlightType?: string }
          if (parent?.highlightType === 'caseStudies') {
            if (!value || value.length === 0) {
              return 'Musisz wybrać co najmniej 1 realizację'
            }
            if (value.length > 2) {
              return 'Możesz wybrać maksymalnie 2 realizacje'
            }
          }
          return true
        }),
    }),
    defineField({
      name: 'activities',
      type: 'array',
      title: 'Wyróżnione integracje',
      hidden: ({ parent }) => parent?.highlightType !== 'activities',
      of: [
        {
          type: 'reference',
          to: [{ type: 'Activities_Collection' }],
          options: {
            disableNew: true,
            filter: ({ parent, document }) => {
              const language = (document as { language?: string })?.language
              const selectedIds =
                (parent as { _ref?: string }[])?.filter((item) => item._ref).map((item) => item._ref) || []
              return {
                filter: '!(_id in $selectedIds) && !(_id in path("drafts.**")) && language == $lang',
                params: { selectedIds, lang: language },
              }
            },
          },
        },
      ],
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const parent = context.parent as { highlightType?: string }
          if (parent?.highlightType === 'activities') {
            if (!value || value.length === 0) {
              return 'Musisz wybrać co najmniej 1 integrację'
            }
            if (value.length > 2) {
              return 'Możesz wybrać maksymalnie 2 integracje'
            }
          }
          return true
        }),
    }),
    defineField({
      name: 'hotels',
      type: 'array',
      title: 'Wyróżnione hotele',
      hidden: ({ parent }) => parent?.highlightType !== 'hotels',
      of: [
        {
          type: 'reference',
          to: [{ type: 'Hotels_Collection' }],
          options: {
            disableNew: true,
            filter: ({ parent, document }) => {
              const language = (document as { language?: string })?.language
              const selectedIds =
                (parent as { _ref?: string }[])?.filter((item) => item._ref).map((item) => item._ref) || []
              return {
                filter: '!(_id in $selectedIds) && !(_id in path("drafts.**")) && language == $lang',
                params: { selectedIds, lang: language },
              }
            },
          },
        },
      ],
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const parent = context.parent as { highlightType?: string }
          if (parent?.highlightType === 'hotels') {
            if (!value || value.length === 0) {
              return 'Musisz wybrać co najmniej 1 hotel'
            }
            if (value.length > 2) {
              return 'Możesz wybrać maksymalnie 2 hotele'
            }
          }
          return true
        }),
    }),
  ],
  preview: {
    select: {
      heading: 'heading',
      highlightType: 'highlightType',
    },
    prepare({ heading, highlightType }) {
      const typeLabel =
        highlightType === 'activities' ? 'Integracje' : highlightType === 'caseStudies' ? 'Realizacje' : 'Hotele'
      return {
        title: `${title} [${typeLabel}]`,
        subtitle: toPlainText(heading),
        icon,
      }
    },
  },
})
