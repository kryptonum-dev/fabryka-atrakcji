import { Users2Icon } from 'lucide-react'
import { defineField, defineType } from 'sanity'
import { isValidUrl } from '../../utils/is-valid-url'

const name = 'SocialMedia_Collection'
const title = 'Media społecznościowe'
const icon = Users2Icon

export default defineType({
  name,
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
      validation: (Rule) => Rule.required(),
      hidden: true,
    }),
    defineField({
      name: 'link',
      type: 'url',
      title: 'Link',
      validation: (Rule) => [
        Rule.custom((value) => {
          if (!value) return true
          if (!value.startsWith('https://')) {
            return 'Link zewnętrzny musi zaczynać się od protokołu "https://"'
          }
          if (!isValidUrl(value)) return 'Nieprawidłowy URL'

          return true
        }),
      ],
    }),
    defineField({
      name: 'icon',
      type: 'image',
      title: 'Ikona',
      options: {
        accept: '.svg',
      },
      validation: (Rule) => Rule.required(),
      hidden: true,
    }),
    defineField({
      name: 'iconString',
      type: 'text',
      title: 'Tekst ikony',
      validation: (Rule) => Rule.required(),
      hidden: true,
    }),
  ],
  preview: {
    select: {
      title: 'name',
      link: 'link',
      icon: 'icon',
    },
    prepare: ({ title, link, icon }) => ({
      title,
      subtitle: link,
      media: icon,
    }),
  },
})
