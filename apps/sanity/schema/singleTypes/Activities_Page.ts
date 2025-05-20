import { Book } from 'lucide-react'
import { defineType } from 'sanity'
import { defineSlugForDocument } from '../../utils/define-slug-for-document'
import { defineField } from 'sanity'
import { ComposeIcon, SearchIcon } from '@sanity/icons'
import { getLanguagePreview } from '../../structure/languages'

const name = 'Activities_Page'
const title = 'Strona Integracji'

export default defineType({
  name,
  type: 'document',
  title,
  icon: Book,
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
        pl: '/pl/integracje',
        en: '/en/activities',
      },
      group: 'content',
    }),
    defineField({
      name: 'heading',
      type: 'Heading',
      title: 'Nagłówek',
      description: 'Główny nagłówek strony',
      group: 'content',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'paragraph',
      type: 'Heading',
      title: 'Paragraf',
      group: 'content',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'activitiesCarousel',
      type: 'ActivitiesCarousel',
      title: 'Wyróżnione integracje',
      description: 'Wyróżnione integracje wyświetlają się pod listą kategorii integracji',
      group: 'content',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'components',
      type: 'components',
      title: 'Komponenty podstrony (opcjonalne)',
      group: 'content',
    }),
    defineField({
      name: 'noResults',
      type: 'object',
      title: 'Brak wyników wyszukiwania',
      group: 'content',
      fields: [
        defineField({
          name: 'heading',
          type: 'Heading',
          title: 'Nagłówek',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'buttonText',
          type: 'string',
          title: 'Tekst przycisku',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'highlightedCategories',
          type: 'array',
          title: 'Wyróżnione kategorie integracji',
          validation: (Rule) => Rule.required().length(4).error('Musisz wybrać dokładnie 4 kategorie integracji'),
          of: [
            {
              type: 'reference',
              to: [{ type: 'ActivitiesCategory_Collection' }],
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
        defineField({
          name: 'components',
          type: 'components',
          title: 'Komponenty podstrony (brak wyników wyszukiwania)',
          description: 'Komponenty podstrony, które pojawią się w przypadku braku wyników wyszukiwania',
        }),
      ],
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
      name: 'content',
      title: 'Treść',
      icon: ComposeIcon,
    },
    {
      name: 'seo',
      title: 'SEO',
      icon: SearchIcon,
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
