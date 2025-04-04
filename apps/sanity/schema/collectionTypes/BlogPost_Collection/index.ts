import { BookOpen } from 'lucide-react'
import { defineField, defineType } from 'sanity'
import { defineSlugForDocument } from '../../../utils/define-slug-for-document'
import PortableText from './portable-text'
import { ComposeIcon, SearchIcon } from '@sanity/icons'

const name = 'BlogPost_Collection'
const title = 'Wpisy na blogu'
const icon = BookOpen

export default defineType({
  name: name,
  type: 'document',
  title,
  icon,
  options: { documentPreview: true },
  fields: [
    defineField({
      name: 'language',
      type: 'string',
      readOnly: true,
      hidden: true,
    }),
    defineField({
      name: 'name',
      type: 'string',
      title: 'Nazwa',
      description:
        'Nazwa wpisu na blogu, wyświetlania przy refererowaniu, wyszukiwaniu oraz udostępnianiu w mediach społecznościowych',
      validation: (Rule) => Rule.required(),
      group: 'content',
    }),
    ...defineSlugForDocument({
      source: 'name',
      prefixes: {
        pl: '/pl/blog/',
        en: '/en/blog/',
      },
      group: 'content',
    }),
    defineField({
      name: 'title',
      type: 'Heading',
      title: 'Nagłówek',
      validation: (Rule) => Rule.required(),
      group: 'content',
    }),
    defineField({
      name: 'description',
      type: 'text',
      title: 'Opis',
      rows: 4,
      description: 'Krótki opis wpisu na blogu wyświetlany na stronie bloga oraz przy jego refererowaniu',
      validation: (Rule) => Rule.required().min(50).error('Opis musi zawierać co najmniej 50 znaków'),
      group: 'content',
    }),
    defineField({
      name: 'category',
      type: 'reference',
      title: 'Kategoria wpisu',
      to: [{ type: 'BlogCategory_Collection' }],
      options: {
        filter: ({ document }) => {
          const language = (document as { language?: string })?.language
          return {
            filter: 'language == $language',
            params: { language: language },
          }
        },
      },
      group: 'content',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'author',
      type: 'reference',
      title: 'Autor',
      to: [{ type: 'Author_Collection' }],
      options: {
        filter: ({ document }) => {
          const language = (document as { language?: string })?.language
          return {
            filter: 'language == $language',
            params: { language: language },
          }
        },
      },
      group: 'content',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'image',
      type: 'image',
      title: 'Główne zdjęcie',
      description:
        'Główne zdjęcie wpisu na blogu, wyświetlane w sekcji hero konkretnego wpisu oraz przy jego refererowaniu',
      validation: (Rule) => Rule.required(),
      group: 'content',
    }),
    PortableText,
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
      name: 'name',
      description: 'description',
      media: 'image',
    },
    prepare: ({ name, description, media }) => ({
      title: name,
      subtitle: description,
      icon,
      media: media,
    }),
  },
})
