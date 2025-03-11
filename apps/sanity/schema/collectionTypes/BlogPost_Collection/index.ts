import { BookOpen } from 'lucide-react'
import { defineField, defineType } from 'sanity'
import { defineSlugForDocument } from '../../../utils/define-slug-for-document'

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
        'Nazwa wpisu na     u, wyświetlania przy refererowaniu, wyszukiwaniu oraz udostępnianiu w mediach społecznościowych',
      validation: (Rule) => Rule.required(),
    }),
    ...defineSlugForDocument({
      source: 'name',
      prefixes: {
        pl: '/pl/blog/',
        en: '/en/blog/',
      },
    }),
    defineField({
      name: 'title',
      type: 'Heading',
      title: 'Nagłówek',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      type: 'text',
      title: 'Opis',
      description: 'Krótki opis wpisu na blogu wyświetlany na stronie bloga oraz przy jego refererowaniu',
      validation: (Rule) => Rule.required().min(50).error('Opis musi zawierać co najmniej 50 znaków'),
    }),
    defineField({
      name: 'category',
      type: 'reference',
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
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'image',
      type: 'image',
      title: 'Główne zdjęcie',
      description:
        'Główne zdjęcie wpisu na blogu, wyświetlane w sekcji hero konkretnego wpisu oraz przy jego refererowaniu',
      validation: (Rule) => Rule.required(),
    }),
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
