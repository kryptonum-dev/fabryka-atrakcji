import { ImagePlus } from 'lucide-react'
import { defineField } from 'sanity'
import { sectionPreview } from '../../utils/section-preview'
import { toPlainText } from '../../utils/to-plain-text'
import sectionId from '../ui/sectionId'

const name = 'LargeImageWithGridList'
const title = 'Duży obraz z listą elementów z tekstem i ikoną'
const icon = ImagePlus

export default defineField({
  name,
  type: 'object',
  title,
  icon,
  fields: [
    defineField({
      name: 'backgroundImage',
      type: 'image',
      title: 'Zdjęcie tła',
      description: 'Dla najlepszego efektu zdjęcie powinno być w ciemnych odcieniach',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'heading',
      type: 'Heading',
      title: 'Heading',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'textIconList',
      type: 'array',
      title: 'Lista elementów z tekstem i ikoną',
      validation: (Rule) => Rule.required().min(2).max(4),
      of: [
        defineField({
          type: 'object',
          name: 'item',
          fields: [
            defineField({
              name: 'icon',
              type: 'image',
              options: {
                accept: '.svg',
              },
              title: 'Ikona',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'heading',
              type: 'Heading',
              title: 'Nagłówek elementu',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'paragraph',
              type: 'Heading',
              title: 'Paragraf',

              validation: (Rule) =>
                Rule.required().custom((value) => {
                  if (!value) return true

                  const blocks = value || []

                  const plainText = toPlainText(blocks as never[])

                  if (plainText.length > 250) {
                    return `Tekst przekracza 250 znaków, obecnie jest to ${plainText.length} znaków`
                  }

                  return true
                }),
            }),
          ],
          preview: {
            select: {
              title: 'heading',
              subtitle: 'paragraph',
              icon: 'icon',
            },
            prepare: ({ title, subtitle, icon }) => ({
              title: toPlainText(title),
              subtitle: toPlainText(subtitle),
              media: icon,
            }),
          },
        }),
      ],
    }),
    ...sectionId,
  ],
  preview: {
    select: {
      heading: 'heading',
    },
    prepare: ({ heading }) => ({
      title: title,
      subtitle: toPlainText(heading),
      ...sectionPreview({ imgUrl: `/static/components/${name}.webp`, icon }),
    }),
  },
})
