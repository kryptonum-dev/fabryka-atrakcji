import { AlertTriangle } from 'lucide-react'
import { defineField, defineType } from 'sanity'
import { defineSlugForDocument } from '../../utils/define-slug-for-document'
import { languageLabel } from '../../utils/language-label'
import { getLanguagePreview } from '../../structure/languages'

const name = 'NotFound_Page'
const title = 'Nie znaleziono strony (404)'

export default defineType({
  name: name,
  type: 'document',
  title: title,
  icon: AlertTriangle,
  options: { documentPreview: true },
  fields: [
    defineField({
      name: 'language',
      type: 'string',
      readOnly: true,
      hidden: true,
    }),
    ...defineSlugForDocument({
      slugs: {
        pl: '/pl/404',
      },
    }),
    defineField({
      name: 'hero',
      type: 'object',
      title: 'Sekcja główna',
      description: 'Sekcja główna jest widoczna przed reużywalnymi kompontentami z listy "Komponenty podstrony".',
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
          name: 'imageList',
          type: 'array',
          title: 'Lista zdjęć',
          description: 'Zdjęcia pojawiają się w lewitujących okręgach, w kolejności, od najmniejszego do największego.',
          validation: (Rule) => Rule.required().length(4).error('Lista zdjęć musi zawierać 4 zdjęcia.'),
          of: [{ type: 'image' }],
        }),
        defineField({
          name: 'ctaText',
          type: 'Heading',
          title: 'Tekst nad CTA (opcjonalny)',
        }),
        defineField({
          name: 'ctas',
          type: 'array',
          title: 'Lista przycisków CTA',
          validation: (Rule) =>
            Rule.required().max(2).error('Lista przycisków CTA musi zawierać maksymalnie 2 przyciski.'),
          of: [{ type: 'cta' }],
        }),
      ],
    }),
    defineField({
      name: 'components',
      type: 'components',
      title: 'Komponenty podstrony',
    }),
    defineField({
      name: 'seo',
      type: 'seo',
      title: 'SEO',
      group: 'seo',
    }),
  ],
  groups: [
    {
      name: 'seo',
      title: 'SEO',
    },
  ],
  preview: {
    select: {
      title: 'name',
      language: 'language',
    },
    prepare: ({ title, language }) => {
      return getLanguagePreview({ title, languageId: language })
    },
  },
})
