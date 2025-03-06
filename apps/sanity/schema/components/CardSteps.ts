import { ListOrdered, PlusCircle, ShoppingCart } from 'lucide-react'
import { defineField } from 'sanity'
import { InternalLinkableTypes } from '../../structure/internal-linkable-types'
import { toPlainText } from '../../utils/to-plain-text'
import sectionId from '../ui/sectionId'

const name = 'CardSteps'
const title = 'Sekcja z Kartami Kroków'
const icon = ListOrdered

const commonStepFields = [
  defineField({
    name: 'optional',
    type: 'boolean',
    title: 'Opcjonalny',
    description: 'Jeśli zaznaczone, ponad kartą widoczny będzie tekst informujący o tym, że krok jest opcjonalny',
    initialValue: false,
  }),
  defineField({
    name: 'text',
    type: 'Heading',
    title: 'Tekst',
    validation: (Rule) => Rule.required(),
  }),
  defineField({
    name: 'badge',
    type: 'string',
    title: 'Naklejka z tekstem (opcjonalna)',
    description: 'Naklejka będzie widoczna w lewym dolnym rogu karty.',
  }),
]

export default defineField({
  name,
  type: 'object',
  title,
  icon,
  fields: [
    defineField({
      name: 'label',
      type: 'string',
      title: 'Tekst nad nagłówkiem (opcjonalny)',
      description: 'Tekst wraz z opcjonalną ikonką, widoczny ponad głównym nagłówkiem',
    }),
    defineField({
      name: 'heading',
      type: 'Heading',
      title: 'Nagłówek',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'steps',
      type: 'array',
      title: 'Lista kroków',
      of: [
        defineField({
          name: 'imagesCard',
          type: 'object',
          title: 'Karta ze zdjęciami',
          fields: [
            ...commonStepFields,
            defineField({
              name: 'firstImage',
              type: 'image',
              title: 'Zdjęcie Pierwsze',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'secondImage',
              type: 'image',
              title: 'Zdjęcie Drugie',
              validation: (Rule) => Rule.required(),
            }),
          ],
          preview: {
            select: {
              text: 'text',
              firstImage: 'firstImage',
            },
            prepare: ({ text, firstImage }) => ({
              title: toPlainText(text) || 'Karta ze zdjęciami',
              subtitle: 'Karta ze zdjęciami',
              media: firstImage,
            }),
          },
        }),
        defineField({
          name: 'plusCard',
          type: 'object',
          title: 'Karta z plusem',
          fields: [
            ...commonStepFields,
            defineField({
              name: 'firstAction',
              type: 'string',
              title: 'Akcja Pierwsza',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'secondAction',
              type: 'string',
              title: 'Akcja Druga',
              validation: (Rule) => Rule.required(),
            }),
          ],
          preview: {
            select: {
              text: 'text',
            },
            prepare: ({ text }) => ({
              title: toPlainText(text) || 'Karta z plusem',
              subtitle: 'Karta z plusem',
              media: PlusCircle,
            }),
          },
        }),
        defineField({
          name: 'cartCard',
          type: 'object',
          title: 'Karta z koszykiem',
          fields: [
            ...commonStepFields,
            defineField({
              name: 'blocks',
              type: 'array',
              title: 'Lista bloków',
              of: [
                defineField({
                  name: 'textBlock',
                  type: 'object',
                  title: 'Blok',
                  fields: [
                    defineField({
                      name: 'icon',
                      type: 'image',
                      title: 'Ikona',
                      description: 'Akceptuje tylko pliki SVG',
                      options: {
                        accept: '.svg',
                      },
                      validation: (Rule) => Rule.required(),
                    }),
                    defineField({
                      name: 'text',
                      type: 'string',
                      title: 'Tekst',
                      validation: (Rule) => Rule.required(),
                    }),
                  ],
                  preview: {
                    select: {
                      text: 'text',
                      icon: 'icon',
                    },
                    prepare: ({ text, icon }) => ({
                      title: text || 'Blok',
                      media: icon,
                    }),
                  },
                }),
              ],
              validation: (Rule) => Rule.required().length(3).error('Musisz dodać dokładnie 3 bloki'),
            }),
          ],
          preview: {
            select: {
              text: 'text',
            },
            prepare: ({ text }) => ({
              title: toPlainText(text) || 'Karta z koszykiem',
              subtitle: 'Karta z koszykiem',
              media: ShoppingCart,
            }),
          },
        }),
      ],
      validation: (Rule) => Rule.required().length(3).error('Musisz dodać dokładnie 3 karty'),
    }),
    defineField({
      name: 'subheading',
      type: 'Heading',
      title: 'Podnagłówek',
      description: 'Nagłówek drugorzędny, widoczny poniżej listy kroków',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'firstParagraph',
      type: 'PortableText',
      title: 'Pierwszy paragraf (opcjonalny)',
      description: 'Paragraf widoczny z lewej strony podsekcji',
    }),
    defineField({
      name: 'secondParagraph',
      type: 'PortableText',
      title: 'Drugi paragraf (opcjonalny)',
      description: 'Paragraf widoczny z prawej strony podsekcji',
    }),
    defineField({
      name: 'additionalCardsList',
      type: 'array',
      title: 'Dodatkowe karty',
      description:
        'Dodatkowe karty widoczne pod sekcją z kartami kroków. Karty posiadają w sobie link, kierujący do wybranej podstrony.',
      of: [
        defineField({
          name: 'additionalCard',
          type: 'object',
          title: 'Dodatkowa karta',
          fields: [
            defineField({
              name: 'visibleImage',
              type: 'image',
              title: 'Widoczne zdjęcie',
              description: 'Zdjęcie widoczne na karcie',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'hoverImage',
              type: 'image',
              title: 'Ukryte zdjęcie',
              description: 'Zdjęcie ukryte na karcie, widoczne po najechaniu kursorem',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'text',
              type: 'string',
              title: 'Tekst',
              validation: (Rule) => Rule.required(),
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
      validation: (Rule) => Rule.required().length(2).error('Musisz dodać dokładnie 2 dodatkowe karty'),
    }),
    ...sectionId,
  ],
  preview: {
    select: {
      heading: 'heading',
      steps: 'steps',
    },
    prepare: ({ heading }) => ({
      title: title,
      subtitle: toPlainText(heading),
      //   ...sectionPreview({ imgUrl: `/static/components/${name}.webp`, icon: icon() }),
    }),
  },
})
