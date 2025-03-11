import { Highlighter } from 'lucide-react'
import { defineField } from 'sanity'
import { sectionPreview } from '../../utils/section-preview'
import { toPlainText } from '../../utils/to-plain-text'
import sectionId from '../ui/sectionId'

const name = 'ActivitiesCarousel'
const title = 'Wyróżnione integracje'
const icon = Highlighter

export default defineField({
  name,
  type: 'object',
  title,
  icon,
  fields: [
    defineField({
      name: 'labelIcon',
      type: 'image',
      title: 'Ikona etykiety (opcjonalna)',
      description: 'Ikona wyświetlana ponad nagłówkiem',
      options: {
        accept: '.svg',
      },
    }),
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
      name: 'cta',
      type: 'cta',
      title: 'Przycisk CTA',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'activities',
      type: 'array',
      title: 'Lista Integracji',
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
        Rule.required()
          .min(4)
          .error('Musisz wybrać co najmniej 4 integracje')
          .max(8)
          .error('Maksymalnie możesz wybrać 8 integracji'),
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
