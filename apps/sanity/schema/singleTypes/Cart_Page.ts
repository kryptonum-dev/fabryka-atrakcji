import { ShoppingCart } from 'lucide-react'
import { defineField, defineType } from 'sanity'
import { defineSlugForDocument } from '../../utils/define-slug-for-document'
import { getLanguagePreview } from '../../structure/languages'
import { ComposeIcon, SearchIcon } from '@sanity/icons'

const name = 'Cart_Page'
const title = 'Strona Koszyka'

export default defineType({
  name,
  type: 'document',
  title,
  icon: ShoppingCart,
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
        pl: '/pl/koszyk',
        en: '/en/cart',
      },
      group: 'content',
    }),
    defineField({
      name: 'infoParagraph',
      type: 'Heading',
      title: 'Paragraf informacyjny',
      description:
        'Paragraf informacyjny pojawia się nad listą hoteli i integracji (w przypadku, gdy przynajmniej jeden hotel lub integracja jest w koszyku)',
      group: 'content',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'noResults',
      type: 'object',
      title: 'Brak wyników',
      group: 'content',
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
