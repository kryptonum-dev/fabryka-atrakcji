import { FileSearch } from 'lucide-react'
import { defineField, defineType } from 'sanity'
import { toPlainText } from '../../utils/to-plain-text'

const title = 'Realizacje'
const icon = FileSearch

export default defineType({
  name: 'CaseStudy_Collection',
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
      title: 'Nazwa realizacji',
      description:
        'Nazwa realizacji wyświetlania przy refererowaniu, wyszukiwaniu oraz udostępnianiu w mediach społecznościowych',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'title',
      type: 'Heading',
      title: 'Nagłówek',
      description: 'Pełna nazwa realizacji wyświetlana na stronie realizacji',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'image',
      type: 'image',
      title: 'Główne zdjęcie',
      description:
        'Główne zdjęcie realizacji, wyświetlane w sekcji hero konkretnej realizacji oraz przy jej refererowaniu',
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      image: 'image',
    },
    prepare: ({ title, image }) => ({
      title: toPlainText(title),
      media: image,
      icon,
    }),
  },
})
