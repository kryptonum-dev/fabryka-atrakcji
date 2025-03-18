import { Handshake } from 'lucide-react'
import { defineField, defineType } from 'sanity'
import { defineSlugForDocument } from '../../utils/define-slug-for-document'

const name = 'ActivitiesCategory_Collection'
const title = 'Kategorie integracji'
const icon = Handshake

export default defineType({
  name: name,
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
      title: 'Nazwa kategorii',
      description: 'Nazwa wyświetlana w breadcrumbs oraz w schematach dla Google',
      validation: (Rule) => Rule.required(),
    }),
    ...defineSlugForDocument({
      source: 'name',
      prefixes: {
        pl: '/pl/integracje/kategoria/',
        en: '/en/activities/category/',
      },
    }),
    defineField({
      name: 'image',
      type: 'image',
      title: 'Zdjęcie kategorii',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      type: 'object',
      title: 'Opis kategorii',
      fields: [
        defineField({
          name: 'short',
          type: 'text',
          title: 'Krótki opis',
          description:
            'Krótki opis kategorii, wyświetlany podczas referowania kategorii i w listach kategorii (Maksymalnie 75 znaków)',
          validation: (Rule) => Rule.required().max(75).error('Maksymalnie 75 znaków'),
        }),
        defineField({
          name: 'long',
          type: 'text',
          title: 'Długi opis',
          description: 'Długi opis kategorii, wyświetlany na samej podstronie kategorii',
          validation: (Rule) => Rule.required(),
        }),
      ],
    }),
  ],
  preview: {
    select: {
      name: 'name',
      slug: 'slug.current',
    },
    prepare: ({ name, slug }) => ({
      title: name,
      subtitle: slug,
      icon,
    }),
  },
})
