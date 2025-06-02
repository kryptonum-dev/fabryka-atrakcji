import { Hotel } from 'lucide-react'
import { defineField } from 'sanity'
import { sectionPreview } from '../../utils/section-preview'
import { toPlainText } from '../../utils/to-plain-text'
import sectionId from '../ui/sectionId'

const name = 'FeaturedHotelsList'
const title = 'Wyróżnione hotele'
const icon = Hotel

export default defineField({
  name,
  type: 'object',
  title,
  icon,
  fields: [
    defineField({
      name: 'labelIcon',
      type: 'boolean',
      title: 'Pokaż etykietę (zegar)',
      description: 'Jeśli zaznaczone, etykieta zostanie wyświetlona ponad nagłówkiem',
      initialValue: false,
    }),
    defineField({
      name: 'heading',
      type: 'Heading',
      title: 'Nagłówek',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'hotels',
      type: 'array',
      title: 'Lista hotele',
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
        Rule.required()
          .min(2)
          .error('Musisz wybrać co najmniej 2 hotele')
          .max(4)
          .error('Maksymalnie możesz wybrać 4 hotele'),
    }),
    defineField({
      name: 'cta',
      type: 'cta',
      title: 'Przycisk CTA',
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
