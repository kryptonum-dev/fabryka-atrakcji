import { defineField } from 'sanity'
import { TextIcon } from '@sanity/icons'
import { toPlainText } from '../../../../../utils/to-plain-text'
import { sectionPreview } from '../../../../../utils/section-preview'

const name = 'ImageWithHeadingAndText'
const title = 'Zdjęcie z tekstem i nagłówkiem'
const icon = TextIcon

export default defineField({
  name,
  type: 'object',
  ...sectionPreview({ imgUrl: `/static/offer/${name}.webp`, icon }),
  title,
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
      heading: 'heading',
    },
    prepare: ({ heading }) => {
      return {
        title,
        subtitle: toPlainText(heading),
      }
    },
  },
})
