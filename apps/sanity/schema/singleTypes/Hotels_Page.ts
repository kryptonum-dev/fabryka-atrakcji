import { Book } from 'lucide-react'
import { defineType } from 'sanity'
import { defineSlugForDocument } from '../../utils/define-slug-for-document'
import { defineField } from 'sanity'
import { ComposeIcon, SearchIcon } from '@sanity/icons'
import { getLanguagePreview } from '../../structure/languages'

const name = 'Hotels_Page'
const title = 'Strona Hoteli'

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
        pl: '/pl/hotele',
        en: '/en/hotels',
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
      name: 'checklist',
      type: 'array',
      title: 'Lista z punktami (opcjonalna)',
      description: 'Lista z punktami wyświetla się poniżej paragrafu oraz nagłówka',
      group: 'content',
      of: [{ type: 'string' }],
      validation: (Rule) => Rule.min(2).max(3).error('Musisz wybrać między 2 a 3 punktami'),
    }),
    defineField({
      name: 'noResults',
      type: 'object',
      title: 'Brak wyników wyszukiwania',
      group: 'content',
      fields: [
        defineField({
          name: 'components',
          type: 'components',
          title: 'Komponenty podstrony (brak wyników wyszukiwania)',
          description: 'Komponenty podstrony, które pojawią się w przypadku braku wyników wyszukiwania',
        }),
      ],
    }),
    defineField({
      name: 'components',
      type: 'components',
      title: 'Komponenty podstrony (opcjonalne)',
      group: 'content',
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
