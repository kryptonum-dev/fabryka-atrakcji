import { Book } from 'lucide-react'
import { defineType } from 'sanity'
import { ComposeIcon } from '@sanity/icons'
import { defineField } from 'sanity'
import { defineSlugForDocument } from '../../utils/define-slug-for-document'
import { SearchIcon } from '@sanity/icons'
import { getLanguagePreview } from '../../structure/languages'

const name = 'Blog_Page'
const title = 'Strona bloga'

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
        pl: '/pl/blog',
        en: '/en/blog',
      },
      group: 'content',
    }),
    defineField({
      name: 'heading',
      type: 'Heading',
      title: 'Nagłówek',
      description: 'Główny nagłówek na tej stronie nie jest widoczny, umieszczamy go głównie w kontekście SEO',
      group: 'content',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'subheading',
      type: 'Heading',
      title: 'Podnagłówek',
      description: 'Podnagłówek na tej stronie jest widoczny ponad listą wpisów na blogu, ale pod wyróżnionym wpisem.',
      group: 'content',
      fieldset: 'listing',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'paragraph',
      type: 'Heading',
      title: 'Paragraf',
      group: 'content',
      fieldset: 'listing',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'components',
      type: 'components',
      title: 'Komponenty podstrony',
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
  fieldsets: [
    {
      name: 'listing',
      title: 'Lista wpisów',
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
