import { Grid3X3, List } from 'lucide-react'
import { defineField } from 'sanity'
import { sectionPreview } from '../../utils/section-preview'
import { toPlainText } from '../../utils/to-plain-text'
import sectionId from '../ui/sectionId'

const name = 'ListImageProccessGrid'
const title = 'Siatka z blokami tekstu i iterowanymi zdjęciami'
const icon = Grid3X3

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
      name: 'contentList',
      type: 'array',
      title: 'Lista bloków tekstowych',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'icon',
              type: 'image',
              title: 'Ikona',
              options: { accept: '.svg' },
              validation: (Rule) => Rule.required(),
            }),
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
        },
      ],
      validation: (Rule) => Rule.required().length(3),
    }),
    defineField({
      name: 'imagesList',
      type: 'array',
      title: 'Lista zdjęć',
      description:
        'Przy wersji komputerowej zdjęcia są wyświetlane w pętli, ich zmiana zachodzi co kilka sekund (Wymagane 3 zdjęcia)',
      of: [
        {
          type: 'object',
          name: 'listImage',
          title: 'Zdjęcie z listą punktów',
          fields: [
            {
              name: 'backgroundImage',
              type: 'image',
              title: 'Zdjęcie tła',
              description: 'Dla optymalnego efektu prosimy nie zmieniać bazowego zdjęcia',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'foregroundImage',
              type: 'image',
              title: 'Zdjęcie w przodzie',
              description: 'Dla optymalnego efektu prosimy nie zmieniać bazowego zdjęcia',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'list',
              type: 'array',
              title: 'Lista punktów',
              of: [{ type: 'string' }],
              validation: (Rule) => Rule.required().length(4).error('Wymagane 4 punkty'),
            },
          ],
          preview: {
            prepare: () => ({
              title: 'Zdjęcie z listą punktów',
              media: List,
            }),
          },
        },
        {
          type: 'object',
          name: 'logoImage',
          title: 'Zdjęcie z logo firmy',
          fields: [
            {
              name: 'backgroundImage',
              type: 'image',
              title: 'Zdjęcie tła',
              description: 'Dla optymalnego efektu prosimy nie zmieniać bazowego zdjęcia',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'foregroundImage',
              type: 'image',
              title: 'Zdjęcie w przodzie',
              description: 'Dla optymalnego efektu prosimy nie zmieniać bazowego zdjęcia',
              validation: (Rule) => Rule.required(),
            },
          ],
          preview: {
            prepare: () => ({
              title: 'Zdjęcie z logo firmy',
              media: List,
            }),
          },
        },
        {
          type: 'object',
          name: 'floatingPointsImage',
          title: 'Zdjęcie z lewitującymi punktami',
          fields: [
            {
              name: 'backgroundImage',
              type: 'image',
              title: 'Zdjęcie tła',
              description: 'Dla optymalnego efektu prosimy nie zmieniać bazowego zdjęcia',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'foregroundImage',
              type: 'image',
              title: 'Zdjęcie w przodzie',
              description: 'Dla optymalnego efektu prosimy nie zmieniać bazowego zdjęcia',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'list',
              type: 'array',
              title: 'Lista punktów',
              of: [{ type: 'string' }],
              validation: (Rule) => Rule.required().length(3).error('Wymagane 3 punkty'),
            },
          ],
          preview: {
            prepare: () => ({
              title: 'Zdjęcie z lewitującymi punktami',
              media: List,
            }),
          },
        },
        {
          type: 'object',
          name: 'iconListImage',
          title: 'Zdjęcie z ikonkami w okręgach',
          fields: [
            {
              name: 'backgroundImage',
              type: 'image',
              title: 'Zdjęcie tła',
              description: 'Dla optymalnego efektu prosimy nie zmieniać bazowego zdjęcia',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'foregroundImage',
              type: 'image',
              title: 'Zdjęcie w przodzie',
              description: 'Dla optymalnego efektu prosimy nie zmieniać bazowego zdjęcia',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'list',
              type: 'array',
              title: 'Lista ikon',
              of: [{ type: 'image', options: { accept: '.svg' } }],
              validation: (Rule) => Rule.required().length(5).error('Wymaganych jest 5 ikonek'),
            },
          ],
          preview: {
            prepare: () => ({
              title: 'Zdjęcie z ikonkami w okręgach',
              media: List,
            }),
          },
        },
      ],
      validation: (Rule) => Rule.required().length(4).error('Wymagane 4 zdjęcia'),
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
