import { TextIcon } from '@sanity/icons'
import { defineField } from 'sanity'
import { sectionPreview } from '../../../utils/section-preview'

const name = 'Faq'
const title = 'Pytania i odpowiedzi'
const icon = TextIcon

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
      name: 'questions',
      type: 'array',
      title: 'Pytania i odpowiedzi',
      validation: (Rule) => Rule.required().min(2).max(10).error('Musisz wybrać między 2 a 10 pytaniami'),
      of: [
        {
          type: 'reference',
          to: [{ type: 'Faq_Collection' }],
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
    }),
  ],
  preview: {
    prepare() {
      return {
        title,
        icon,
      }
    },
  },
})
