import { BookOpen } from 'lucide-react'
import { defineField } from 'sanity'
import { sectionPreview } from '../../utils/section-preview'
import { toPlainText } from '../../utils/to-plain-text'
import sectionId from '../ui/sectionId'

const name = 'HighlightedBlogPosts'
const title = 'Wyróżnione wpisy na blogu'
const icon = BookOpen

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
      name: 'subHeading',
      type: 'Heading',
      title: 'Podnagłówek (opcjonalny)',
    }),
    defineField({
      name: 'paragraph',
      type: 'PortableText',
      title: 'Paragraf',
      validation: (Rule) => Rule.optional(),
    }),
    defineField({
      name: 'cta',
      type: 'cta',
      title: 'Przycisk CTA',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'blogPosts',
      type: 'array',
      title: 'Wyróżnione wpisy na blogu',
      validation: (Rule) =>
        Rule.required().min(5).max(8).error('Musisz wybrać co najmniej 5 wpisów na blogu i maksymalnie 8'),
      of: [
        {
          type: 'reference',
          to: [{ type: 'BlogPost_Collection' }],
          options: {
            disableNew: true,
            filter: ({ parent, document }) => {
              const language = (document as { language?: string })?.language
              const selectedIds =
                (parent as { _ref?: string }[])?.filter((item) => item._ref).map((item) => item._ref) || []
              return {
                filter: '!(_id in path("drafts.**")) && language == $lang',
                params: { selectedIds, lang: language },
              }
            },
          },
        },
      ],
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
