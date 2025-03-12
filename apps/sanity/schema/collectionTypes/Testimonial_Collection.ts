import { UserRound } from 'lucide-react'
import { defineField, defineType } from 'sanity'

const name = 'Testimonial_Collection'
const title = 'Opinie'

export default defineType({
  name: name,
  type: 'document',
  title,
  icon: UserRound,
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
      name: 'position',
      type: 'string',
      title: 'Stanowisko',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'company',
      type: 'string',
      title: 'Firma',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'logo',
      type: 'image',
      options: {
        accept: '.svg',
      },
      title: 'Logo firmy (opcjonalne)',
    }),
    defineField({
      name: 'image',
      type: 'object',
      title: 'Zdjęcie klienta (opcjonalne)',
      fields: [
        defineField({
          name: 'profileImage',
          type: 'image',
          title: 'Profil',
        }),
        defineField({
          name: 'fullImage',
          type: 'image',
          title: 'Pełne zdjęcie',
        }),
      ],
    }),
    defineField({
      name: 'date',
      type: 'date',
      title: 'Data opinii',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'review',
      type: 'Heading',
      title: 'Zawartość opinii',
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {
      name: 'name',
      position: 'position',
      company: 'company',
      image: 'image.profileImage',
      logo: 'logo',
    },
    prepare: ({ name, position, company, image, logo }) => ({
      title: name,
      subtitle: `${position} - ${company}`,
      media: image || logo,
    }),
  },
})
