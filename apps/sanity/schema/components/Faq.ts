import { HelpCircle } from 'lucide-react'
import { defineField } from 'sanity'
import { sectionPreview } from '../../utils/section-preview'
import { toPlainText } from '../../utils/to-plain-text'
import sectionId from '../ui/sectionId'

const name = 'Faq'
const title = 'Sekcja FAQ'
const icon = HelpCircle

export default defineField({
  name,
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
      name: 'questions',
      type: 'array',
      title: 'Wyróżnione pytania',
      validation: (Rule) => Rule.required().min(4).max(12).error('Musisz wybrać między 4 a 12 pytaniami'),
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
    defineField({
      name: 'subheading',
      type: 'Heading',
      title: 'Nagłówek podrzędny',
      description: 'Nagłówek widoczny pod listą pytań.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'paragraph',
      type: 'PortableText',
      title: 'Paragraf',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'formPopup',
      type: 'formPopup',
      title: 'Okienko formularza',
      validation: (Rule) => Rule.required(),
    }),
    ...sectionId,
  ],
  preview: {
    select: {
      heading: 'heading',
    },
    prepare: ({ heading }) => ({
      title: title,
      subtitle: toPlainText(heading),
      ...sectionPreview({ imgUrl: `/static/components/${name}.webp`, icon }),
    }),
  },
})
