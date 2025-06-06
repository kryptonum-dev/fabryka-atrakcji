import { ShoppingCart } from 'lucide-react'
import { defineField, defineType } from 'sanity'
import { defineSlugForDocument } from '../../utils/define-slug-for-document'
import { getLanguagePreview } from '../../structure/languages'
import { ComposeIcon, SearchIcon } from '@sanity/icons'

const name = 'Cart_Page'
const title = 'Strona Koszyka'

export default defineType({
  name,
  type: 'document',
  title,
  icon: ShoppingCart,
  options: { documentPreview: true },
  fields: [
    defineField({
      name: 'language',
      type: 'string',
      readOnly: true,
      hidden: true,
    }),
    ...defineSlugForDocument({
      slugs: {
        pl: '/pl/koszyk',
        en: '/en/cart',
      },
      group: 'content',
    }),
    defineField({
      name: 'infoParagraph',
      type: 'Heading',
      title: 'Paragraf informacyjny',
      description:
        'Paragraf informacyjny pojawia się nad listą hoteli i integracji (w przypadku, gdy przynajmniej jeden hotel lub integracja jest w koszyku)',
      group: 'content',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'noResults',
      type: 'object',
      title: 'Brak wyników',
      group: 'content',
      validation: (Rule) => Rule.required(),
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
      ],
    }),
    defineField({
      name: 'errorState',
      type: 'object',
      title: 'Błąd podczas ładowania',
      group: 'content',
      validation: (Rule) => Rule.required(),
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
      ],
    }),

    defineField({
      name: 'orderAddons',
      type: 'object',
      title: 'Dodatki do zamówienia',
      group: 'content',
      fields: [
        defineField({
          name: 'transportOptions',
          type: 'object',
          title: 'Opcje transportu',
          description:
            'Dodatek w postaci transportu jest jedynym nieusuwalnym dodatkiem. Możliwość edycji zdjęcia oraz minimalnej ceny.',
          validation: (Rule) => Rule.required(),
          fields: [
            defineField({
              name: 'image',
              type: 'image',
              title: 'Zdjęcie',
              validation: (Rule) => Rule.required().error('Zdjęcie jest wymagane'),
            }),
            defineField({
              name: 'pricing',
              type: 'object',
              title: 'Cennik transportu',
              options: {
                collapsible: false,
                collapsed: false,
              },
              validation: (Rule) => Rule.required().error('Cennik jest wymagany'),
              fields: [
                {
                  name: 'basePrice',
                  type: 'number',
                  title: 'Cena podstawowa netto (PLN)',
                  description: 'Cena bazowa bez VAT za transport do określonej odległości',
                  validation: (Rule) =>
                    Rule.custom((value: number) => {
                      if (!value) return 'Cena podstawowa jest wymagana'
                      if (typeof value !== 'number' || !Number.isInteger(value)) return 'Cena musi być liczbą całkowitą'
                      if (value < 1) return 'Cena musi być większa niż 0 PLN'
                      return true
                    }),
                },
                {
                  name: 'maxKilometers',
                  type: 'number',
                  title: 'Maksymalna odległość w cenie podstawowej (km)',
                  description: 'Do ilu kilometrów obowiązuje cena podstawowa',
                  validation: (Rule) =>
                    Rule.custom((value: number) => {
                      if (!value) return 'Maksymalna odległość jest wymagana'
                      if (typeof value !== 'number' || !Number.isInteger(value))
                        return 'Odległość musi być liczbą całkowitą'
                      if (value < 1) return 'Odległość musi być większa niż 0 km'
                      return true
                    }),
                },
                {
                  name: 'pricePerKm',
                  type: 'number',
                  title: 'Cena netto za każdy dodatkowy kilometr (PLN)',
                  description: 'Kwota bez VAT doliczana za każdy kilometr powyżej maksymalnej odległości',
                  validation: (Rule) =>
                    Rule.custom((value: number) => {
                      if (value === undefined || value === null) return 'Cena za kilometr jest wymagana'
                      if (typeof value !== 'number' || !Number.isInteger(value))
                        return 'Cena za kilometr musi być liczbą całkowitą'
                      if (value < 1) return 'Cena za kilometr musi być większa niż 0 PLN'
                      return true
                    }),
                  initialValue: 1,
                },
                {
                  name: 'maxPeoplePerBus',
                  type: 'number',
                  title: 'Maksymalna liczba osób w jednym autobusie',
                  description: 'Po przekroczeniu tej liczby zostanie dodany kolejny autobus',
                  validation: (Rule) =>
                    Rule.custom((value: number) => {
                      if (!value) return 'Maksymalna liczba osób jest wymagana'
                      if (typeof value !== 'number' || !Number.isInteger(value))
                        return 'Liczba osób musi być liczbą całkowitą'
                      if (value < 1) return 'Liczba osób musi być większa niż 0'
                      return true
                    }),
                  initialValue: 50,
                },
              ],
            }),
          ],
        }),
        defineField({
          name: 'addonsList',
          type: 'array',
          title: 'Lista dodatków (opcjonalnie)',
          description: 'Lista opcjonalnych dodatków, które można dodać do każdego zamówienia',
          of: [
            {
              type: 'object',
              validation: (Rule) => Rule.required().error('Dodatki do zamówienia są wymagane'),
              fields: [
                defineField({
                  name: 'image',
                  type: 'image',
                  title: 'Zdjęcie',
                  validation: (Rule) => Rule.required(),
                }),
                defineField({
                  name: 'name',
                  type: 'string',
                  title: 'Nazwa dodatku',
                  validation: (Rule) => Rule.required(),
                }),
                defineField({
                  name: 'pricing',
                  type: 'object',
                  title: 'Cennik',
                  validation: (Rule) => Rule.required().error('Cennik jest wymagany'),
                  fields: [
                    {
                      name: 'type',
                      type: 'string',
                      title: 'Typ cennika',
                      options: {
                        list: [
                          { title: 'Stała cena', value: 'fixed' },
                          { title: 'Cena progowa', value: 'threshold' },
                        ],
                        layout: 'radio',
                      },
                      validation: (Rule) => Rule.required().error('Typ cennika jest wymagany'),
                      initialValue: 'fixed',
                    },
                    {
                      name: 'fixedPrice',
                      type: 'number',
                      title: 'Cena netto (PLN)',
                      description: 'Cena bez VAT',
                      hidden: ({ parent }) => parent?.type !== 'fixed',
                      validation: (Rule) =>
                        Rule.custom((value, context) => {
                          const parent = context.parent as any
                          if (parent?.type === 'fixed') {
                            if (!value) return 'Cena jest wymagana dla stałej ceny'
                            if (typeof value !== 'number' || !Number.isInteger(value))
                              return 'Cena musi być liczbą całkowitą'
                            if (value < 1) return 'Cena musi być większa niż 0 PLN'
                          }
                          return true
                        }),
                    },
                    {
                      name: 'threshold',
                      type: 'object',
                      title: 'Cena progowa',
                      options: {
                        collapsible: false,
                        collapsed: false,
                      },
                      hidden: ({ parent }) => parent?.type !== 'threshold',
                      validation: (Rule) =>
                        Rule.custom((value, context) => {
                          const parent = context.parent as any
                          const objValue = value as {
                            basePrice: number
                            maxUnits: number
                            additionalPrice: number
                            singular: string
                          }
                          if (
                            parent?.type === 'threshold' &&
                            (!objValue?.basePrice || !objValue?.maxUnits || !objValue?.additionalPrice)
                          ) {
                            return 'Wszystkie pola są wymagane dla ceny progowej'
                          }
                          return true
                        }),
                      fields: [
                        {
                          name: 'basePrice',
                          type: 'number',
                          title: 'Cena podstawowa netto (PLN)',
                          description: 'Cena bez VAT',
                          validation: (Rule) =>
                            Rule.custom((value: number) => {
                              if (!!value && (typeof value !== 'number' || !Number.isInteger(value)))
                                return 'Cena musi być liczbą całkowitą'
                              if (!!value && value < 1) return 'Cena musi być większa niż 0 PLN'
                              return true
                            }),
                        },
                        {
                          name: 'maxUnits',
                          type: 'number',
                          title: 'Maksymalna liczba osób w cenie podstawowej',
                          validation: (Rule) =>
                            Rule.custom((value: number) => {
                              if (!!value && (typeof value !== 'number' || !Number.isInteger(value)))
                                return 'Maksymalna liczba osób musi być liczbą całkowitą'
                              if (!!value && value < 1) return 'Maksymalna liczba osób musi być większa niż 0'
                              return true
                            }),
                        },
                        {
                          name: 'additionalPrice',
                          type: 'number',
                          title: 'Cena netto za każdą dodatkową osobę (PLN)',
                          description: 'Cena bez VAT',
                          validation: (Rule) =>
                            Rule.custom((value: number) => {
                              if (!!value && (typeof value !== 'number' || !Number.isInteger(value)))
                                return 'Cena musi być liczbą całkowitą'
                              if (!!value && value < 1) return 'Cena musi być większa niż 0 PLN'
                              return true
                            }),
                        },
                      ],
                    },
                  ],
                }),
              ],
            },
          ],
        }),
      ],
    }),
    defineField({
      name: 'seo',
      type: 'seo',
      title: 'SEO',
      group: 'seo',
    }),
  ],
  groups: [
    {
      name: 'content',
      title: 'Treść',
      icon: ComposeIcon,
    },
    {
      name: 'seo',
      title: 'SEO',
      icon: SearchIcon,
    },
  ],
  preview: {
    select: {
      title: 'name',
      language: 'language',
    },
    prepare: ({ title, language }) => {
      return getLanguagePreview({ title, languageId: language })
    },
  },
})
