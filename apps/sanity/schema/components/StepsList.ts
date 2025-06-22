import { ListOrdered, MousePointerClick, StepForward, StepForwardIcon } from 'lucide-react'
import { defineField } from 'sanity'
import { InternalLinkableTypes } from '../../structure/internal-linkable-types'
import { sectionPreview } from '../../utils/section-preview'
import { toPlainText } from '../../utils/to-plain-text'
import sectionId from '../ui/sectionId'

const name = 'StepsList'
const title = 'Lista kroków'
const icon = ListOrdered

export default defineField({
  name,
  type: 'object',
  title,
  icon,
  fields: [
    defineField({
      name: 'imageColumns',
      type: 'array',
      title: 'Kolumny z obrazkami',
      description: 'Kolumhy ze zdjęciami, które animują się w górę i dół strony, wymagane są 2 kolumny',
      validation: (Rule) => Rule.required().length(2).error('Wymagane są 2 kolumny'),
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'blockObject',
              type: 'object',
              title: 'Kafelek',
              description: 'Kafelek będzie wyświetlał się na środku kolumny zdjęć',
              fields: [
                defineField({
                  name: 'icon',
                  type: 'image',
                  title: 'Ikona',
                  options: { accept: '.svg' },
                  validation: (Rule) => Rule.required(),
                }),
                defineField({
                  name: 'text',
                  type: 'string',
                  title: 'Tekst',
                  validation: (Rule) => Rule.required(),
                }),
                defineField({
                  name: 'link',
                  type: 'object',
                  title: 'Link',
                  description: 'Link, który zostanie uruchomiony po kliknięciu w kolumnę',
                  validation: (Rule) => Rule.required(),
                  options: {
                    collapsed: false,
                    collapsible: false,
                  },
                  fields: [
                    defineField({
                      name: 'linkType',
                      type: 'string',
                      title: 'Typ linku',
                      description:
                        'Wybierz "Zewnętrzny" dla linków do innych stron lub "Wewnętrzny" dla linków w obrębie Twojej strony',
                      options: {
                        list: [
                          { title: 'Zewnętrzny', value: 'external' },
                          { title: 'Wewnętrzny', value: 'internal' },
                        ],
                        layout: 'radio',
                        direction: 'horizontal',
                      },
                      initialValue: 'internal',
                      validation: (Rule) => Rule.required(),
                    }),
                    defineField({
                      name: 'external',
                      type: 'string',
                      title: 'URL',
                      description: 'Podaj pełny adres URL. Upewnij się, że zaczyna się od "https://"',
                      hidden: ({ parent }) => parent?.linkType !== 'external',
                      validation: (Rule) => [
                        Rule.custom((value, { parent }) => {
                          const linkType = (parent as { linkType?: string })?.linkType
                          if (linkType === 'external') {
                            if (!value) return 'URL jest wymagany'
                            if (!value.startsWith('https://')) {
                              return 'Link zewnętrzny musi zaczynać się od protokołu "https://"'
                            }
                          }
                          return true
                        }),
                      ],
                    }),
                    defineField({
                      name: 'internal',
                      type: 'reference',
                      title: 'Wewnętrzne odniesienie do strony',
                      description: 'Wybierz wewnętrzną stronę, do której chcesz linkować.',
                      to: InternalLinkableTypes,
                      options: {
                        disableNew: true,
                        filter: ({ document }) => {
                          const language = (document as { language?: string })?.language
                          return {
                            filter: 'defined(slug.current) && language == $lang',
                            params: { lang: language },
                          }
                        },
                      },
                      hidden: ({ parent }) => parent?.linkType !== 'internal',
                      validation: (rule) => [
                        rule.custom((value, { parent }) => {
                          const linkType = (parent as { linkType?: string })?.linkType
                          if (linkType === 'internal' && !value?._ref)
                            return 'Musisz wybrać wewnętrzną stronę, do której chcesz linkować.'
                          return true
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            defineField({
              name: 'images',
              type: 'array',
              title: 'Zdjęcia w kolumnie',
              description:
                'Zdjęcia będą wyświetlane w kolumnie, jedno pod drugim, pierwsze zdjęcie na liście będzie wyświetlane na górze kolumny',
              of: [{ type: 'image' }],
              validation: (Rule) => Rule.required().length(5).error('Wymagane jest 5 zdjęć'),
            }),
          ],
          preview: {
            select: {
              icon: 'blockObject.icon',
              text: 'blockObject.text',
            },
            prepare: ({ icon, text }) => ({
              title: text || 'Kafelek',
              media: icon,
            }),
          },
        },
      ],
    }),
    defineField({
      name: 'heading',
      type: 'Heading',
      title: 'Heading',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'paragraph',
      type: 'PortableText',
      title: 'Paragraf',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'steps',
      type: 'array',
      title: 'Lista kroków',
      validation: (Rule) => Rule.required().min(2).error('Minimum 2 kroki').max(4).error('Maksymalnie 4 kroki'),
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'heading', type: 'Heading', title: 'Nagłówek', validation: (Rule) => Rule.required() }),
            defineField({ name: 'paragraph', type: 'PortableText', title: 'Paragraf (opcjonalny)' }),
            defineField({
              name: 'blocks',
              type: 'array',
              title: 'Kafelki',
              of: [
                {
                  type: 'object',
                  name: 'ctaBlock',
                  title: 'Kafelek z CTA',
                  fields: [
                    defineField({ name: 'cta', type: 'cta', title: 'CTA', validation: (Rule) => Rule.required() }),
                    defineField({
                      name: 'text',
                      type: 'Heading',
                      title: 'Tekst',
                      validation: (Rule) => Rule.required(),
                    }),
                  ],
                  preview: {
                    select: {
                      text: 'text',
                    },
                    prepare: ({ text }) => ({
                      title: toPlainText(text) || 'Kafelek z CTA',
                      media: MousePointerClick,
                    }),
                  },
                },
                {
                  type: 'object',
                  name: 'imageBlock',
                  title: 'Kafelek z tekstem i ikoną',
                  fields: [
                    defineField({
                      name: 'textIconBlock',
                      type: 'object',
                      title: 'Bloczek z tekstem i ikoną',
                      fields: [
                        defineField({
                          name: 'icon',
                          type: 'image',
                          title: 'Ikona',
                          options: { accept: '.svg' },
                          validation: (Rule) => Rule.required(),
                        }),
                        defineField({
                          name: 'text',
                          type: 'string',
                          title: 'Tekst bloczka',
                          validation: (Rule) => Rule.required(),
                        }),
                      ],
                    }),
                    defineField({
                      name: 'text',
                      type: 'Heading',
                      title: 'Tekst',
                      validation: (Rule) => Rule.required(),
                    }),
                  ],
                  preview: {
                    select: {
                      icon: 'textIconBlock.icon',
                      title: 'textIconBlock.text',
                      subtitle: 'text',
                    },
                    prepare: ({ icon, title, subtitle }) => ({
                      title: title,
                      subtitle: toPlainText(subtitle),
                      media: icon,
                    }),
                  },
                },
              ],
            }),
          ],
          preview: {
            select: {
              title: 'heading',
              subtitle: 'paragraph',
            },
            prepare: ({ title, subtitle }) => {
              return {
                title: toPlainText(title),
                subtitle: toPlainText(subtitle),
                media: StepForwardIcon,
              }
            },
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
