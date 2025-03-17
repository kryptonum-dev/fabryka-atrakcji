import { Handshake } from 'lucide-react'
import { defineField, defineType } from 'sanity'
import { defineSlugForDocument } from '../../utils/define-slug-for-document'
import { toPlainText } from '../../utils/to-plain-text'

const title = 'Integracje'
const icon = Handshake

export default defineType({
  name: 'Activities_Collection',
  type: 'document',
  title,
  icon,
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
      title: 'Nazwa integracji',
      description:
        'Nazwa integracji wyświetlania przy refererowaniu, wyszukiwaniu oraz udostępnianiu w mediach społecznościowych',
      validation: (Rule) => Rule.required(),
    }),
    ...defineSlugForDocument({
      source: 'name',
      prefixes: {
        pl: '/pl/integracje/',
        en: '/en/activities/',
      },
    }),
    defineField({
      name: 'title',
      type: 'Heading',
      title: 'Nagłówek',
      description: 'Pełna nazwa integracji wyświetlana na stronie integracji',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'categories',
      type: 'array',
      title: 'Kategorie',
      of: [
        {
          type: 'reference',
          to: { type: 'ActivitiesCategory_Collection' },
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
      name: 'image',
      type: 'image',
      title: 'Główne zdjęcie',
      description:
        'Główne zdjęcie integracji, wyświetlane w sekcji hero konkretnej integracji oraz przy jej refererowaniu',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      type: 'text',
      title: 'Opis integracji',
      description: 'Krótki opis integracji wyświetlany na stronie integracji oraz przy jej refererowaniu',
      validation: (Rule) => Rule.required().min(75).error('Opis musi zawierać co najmniej 75 znaków'),
    }),
    defineField({
      name: 'details',
      type: 'object',
      title: 'Szczegóły integracji',
      fields: [
        defineField({
          name: 'participantsCount',
          type: 'object',
          title: 'Przedział liczby uczestników',
          validation: (Rule) => Rule.required(),
          options: {
            columns: 2,
          },
          fields: [
            defineField({
              name: 'min',
              type: 'number',
              title: 'Minimalna liczba uczestników',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'max',
              type: 'number',
              title: 'Maksymalna liczba uczestników',
              validation: (Rule) => Rule.required(),
            }),
          ],
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'description',
      image: 'image',
    },
    prepare: ({ title, subtitle, image }) => ({
      title: toPlainText(title),
      subtitle: subtitle || 'Brak opisu',
      media: image,
      icon,
    }),
  },
})
