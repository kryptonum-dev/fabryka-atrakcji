import { ListChecks, MinusCircle, PlusCircle } from 'lucide-react'
import { defineArrayMember, defineField } from 'sanity'
import { sectionPreview } from '../../utils/section-preview'
import { toPlainText } from '../../utils/to-plain-text'
import sectionId from '../ui/sectionId'

const name = 'FloatingPointsList'
const title = 'Lista punktów z charakterem'
const icon = ListChecks

export default defineField({
  name,
  type: 'object',
  title,
  icon,
  fields: [
    defineField({
      name: 'backgroundImage',
      type: 'image',
      title: 'Zdjęcie w tle',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'heading',
      type: 'Heading',
      title: 'Nagłówek',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'mainParagraph',
      type: 'PortableText',
      title: 'Główny paragraf',
      description: 'Główny paragraf oznaczony jest ciemniejszym kolorem.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'subParagraph',
      type: 'PortableText',
      title: 'Dodatkowy paragraf (opcjonalny)',
    }),
    defineField({
      name: 'upDownPoints',
      type: 'array',
      title: 'Punkty pozytywne i negatywne',
      description:
        'Lista punktów które nachodzą na zdjęcie w tle. Punkty mogą być pozytywne (oznaczone strzałką w górę i jaśniejszym kolorem) oraz negatywne (oznaczone strzałką w dół i ciemniejszym kolorem).',
      of: [
        defineArrayMember({
          name: 'point',
          type: 'object',
          fields: [
            defineField({
              name: 'text',
              type: 'string',
              title: 'Treść punktu',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'character',
              type: 'string',
              title: 'Charakter',
              options: {
                list: ['pozytywny', 'negatywny'],
                layout: 'radio',
              },
              initialValue: 'pozytywny',
              validation: (Rule) => Rule.required(),
            }),
          ],
          preview: {
            select: {
              text: 'text',
              character: 'character',
            },
            prepare: ({ text, character }) => ({
              title: text,
              subtitle: character,
              media: character === 'pozytywny' ? PlusCircle : MinusCircle,
            }),
          },
        }),
      ],
      validation: (Rule) => Rule.required().min(2).max(5).error('Minimalna liczba punktów to 2, a maksymalna to 5.'),
    }),
    defineField({
      name: 'iconPoints',
      type: 'array',
      title: 'Lista punktów z ikonami ',
      description: 'Lista punktów z ikonami.',
      of: [
        defineArrayMember({
          name: 'point',
          type: 'object',
          fields: [
            defineField({
              name: 'icon',
              type: 'image',
              title: 'Ikona',
              validation: (Rule) => Rule.required(),
              options: {
                accept: '.svg',
              },
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
              icon: 'icon',
            },
            prepare: ({ heading, paragraph, icon }) => ({
              title: toPlainText(heading),
              subtitle: toPlainText(paragraph),
              media: icon,
            }),
          },
        }),
      ],
      validation: (Rule) => Rule.required().min(2).max(4).error('Minimalna liczba punktów to 2, a maksymalna to 4.'),
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
