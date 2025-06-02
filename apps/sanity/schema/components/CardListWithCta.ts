import { CreditCard, IdCard, ListEnd } from 'lucide-react'
import { defineField } from 'sanity'
import { sectionPreview } from '../../utils/section-preview'
import { toPlainText } from '../../utils/to-plain-text'
import sectionId from '../ui/sectionId'

const name = 'CardListWithCta'
const title = 'Lista kart z wezwaniem do działania'
const icon = ListEnd

export default defineField({
  name,
  type: 'object',
  title,
  icon,
  fields: [
    defineField({
      name: 'heading',
      type: 'Heading',
      title: 'Nagłówek',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'paragraph',
      type: 'PortableText',
      title: 'Paragraf',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'ctas',
      type: 'array',
      title: 'Wezwania do działania',
      description: 'Lista wezwań do działania, muszisz dodać przynajmniej 1 i maksymalnie 2',
      validation: (Rule) =>
        Rule.required()
          .min(1)
          .error('Musisz dodać przynajmniej 1 wezwanie do działania')
          .max(2)
          .error('Możesz dodać maksymalnie 2 wezwania do działania'),
      of: [{ type: 'cta' }],
    }),
    defineField({
      name: 'cards',
      type: 'array',
      title: 'Lista kart',
      description: 'Każda karta posiada zdjęcie, nagłówek, oraz paragraf',
      validation: (Rule) => Rule.required().min(2).max(3).error('Musisz dodać przynajmniej 2 i maksymalnie 3 karty'),
      of: [
        {
          type: 'object',
          name: 'card',
          title: 'Karta',
          fields: [
            defineField({
              name: 'image',
              type: 'image',
              title: 'Zdjęcie',
            }),
            defineField({
              name: 'heading',
              type: 'Heading',
              title: 'Nagłówek',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'paragraph',
              type: 'Heading',
              title: 'Paragraf',
              validation: (Rule) => Rule.required(),
            }),
          ],
          preview: {
            select: {
              heading: 'heading',
              paragraph: 'paragraph',
              media: 'image',
            },
            prepare: ({ heading, paragraph, media }) => ({
              title: toPlainText(heading),
              subtitle: toPlainText(paragraph),
              media,
            }),
          },
        },
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
