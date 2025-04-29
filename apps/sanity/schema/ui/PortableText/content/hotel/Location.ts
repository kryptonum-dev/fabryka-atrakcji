import { PinIcon } from '@sanity/icons'
import { defineField } from 'sanity'
import { sectionPreview } from '../../../../../utils/section-preview'
import { toPlainText } from '../../../../../utils/to-plain-text'

const name = 'Location'
const title = 'Lokalizacja i okolica'
const icon = PinIcon

export default defineField({
  name,
  type: 'object',
  title,
  ...sectionPreview({ imgUrl: `/static/BlogPost_Collection/${name}.webp`, icon }),
  fields: [
    defineField({
      name: 'heading',
      type: 'Heading',
      title: 'Nagłówek',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'howToGetThere',
      type: 'object',
      title: 'Jak dojechać',
      fields: [
        defineField({
          name: 'heading',
          type: 'Heading',
          title: 'Nagłówek',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'content',
          type: 'array',
          title: 'Treść',
          of: [{ type: 'block' }],
          validation: (Rule) => Rule.required(),
        }),
      ],
    }),
    defineField({
      name: 'attractions',
      type: 'object',
      title: 'Atrakcje w okolicy',
      fields: [
        defineField({
          name: 'heading',
          type: 'Heading',
          title: 'Nagłówek',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'list',
          type: 'array',
          title: 'Lista atrakcji',
          of: [
            {
              type: 'object',
              fields: [
                defineField({
                  name: 'name',
                  type: 'string',
                  title: 'Nazwa atrakcji',
                  validation: (Rule) => Rule.required(),
                }),
                defineField({
                  name: 'description',
                  type: 'text',
                  title: 'Opis',
                  validation: (Rule) => Rule.required(),
                }),
                defineField({
                  name: 'distance',
                  type: 'string',
                  title: 'Odległość',
                  validation: (Rule) => Rule.required(),
                }),
                defineField({
                  name: 'googleMapsLink',
                  type: 'url',
                  title: 'Link do Google Maps',
                  validation: (Rule) => Rule.required(),
                }),
              ],
              preview: {
                select: {
                  title: 'name',
                  subtitle: 'distance',
                },
                prepare({ title, subtitle }) {
                  return {
                    title,
                    subtitle: `Odległość: ${subtitle}`,
                  }
                },
              },
            },
          ],
          validation: (Rule) => Rule.required().min(1),
        }),
      ],
    }),
  ],
  preview: {
    select: {
      heading: 'heading',
    },
    prepare({ heading }) {
      return {
        title,
        subtitle: toPlainText(heading),
        icon,
      }
    },
  },
})
