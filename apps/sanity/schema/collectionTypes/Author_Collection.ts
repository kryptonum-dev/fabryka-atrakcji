import { UsersIcon } from '@sanity/icons'
import { defineField, defineType } from 'sanity'

const title = 'Autorzy'
const icon = UsersIcon

export default defineType({
  name: 'Author_Collection',
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
      title: 'Imię i nazwisko',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'displayName',
      type: 'string',
      title: 'Imię w bierniku',
      description: 'Imię autora wyświetlane w tekście jako biernik: "Napisano przez [imię]"',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'image',
      type: 'image',
      title: 'Zdjęcie autora',
      description: 'Dla optymalnego wyświetlenia zdjęcie powinno być kwadratowe i pokazywać twarz autora',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      type: 'object',
      title: 'Opis autora',
      fields: [
        defineField({
          name: 'short',
          type: 'string',
          title: 'Krótki opis',
          description: 'Krótki opis powinien zawierać maksymalnie kilka słów',
          validation: (Rule) =>
            Rule.required().min(10).max(100).error('Krótki opis musi zawierać co najmniej 10 i maksymalnie 100 znaków'),
        }),
        defineField({
          name: 'full',
          type: 'text',
          title: 'Pełny opis',
          validation: (Rule) => Rule.required().min(50).error('Pełny opis musi zawierać co najmniej 50 znaków'),
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'description.short',
      media: 'image',
    },
    prepare({ title, subtitle, media }) {
      return {
        title,
        subtitle,
        media: media || icon,
      }
    },
  },
})
