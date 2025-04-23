import { defineField } from 'sanity'
import { TextIcon } from '@sanity/icons'
import { toPlainText } from '../../../../../utils/to-plain-text'

const title = 'Zdjęcie z tekstem i nagłówkiem'
const icon = TextIcon

export default defineField({
  name: 'ImageWithHeadingAndText',
  type: 'object',
  title,
  icon,
  fields: [
    defineField({
      name: 'image',
      type: 'image',
      title: 'Zdjęcie',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'heading',
      type: 'Heading',
      title: 'Nagłówek',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'text',
      type: 'PortableText',
      title: 'Treść',
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {
      image: 'image',
      heading: 'heading',
    },
    prepare: ({ image, heading }) => {
      return {
        title,
        subtitle: toPlainText(heading),
        media: image,
      }
    },
  },
})
