import { defineField } from 'sanity'
import { PlusSquareIcon } from 'lucide-react'

interface AddonsConfig {
  title: string
  description?: string
  labels: {
    hasAddons: {
      title: string
      description: string
    }
    heading: {
      title: string
      description: string
    }
    addonsChoice: {
      title: string
      description: string
    }
    minOneAddon: {
      title: string
      description: string
    }
    addonsLayout: {
      title: string
      description: string
    }
    addonsHaveImage: {
      title: string
      description: string
    }
    addonsList: {
      title: string
      description: string
    }
    additionalInfo: {
      title: string
      description: string
    }
  }
}

export const createAddonsObject = (config: AddonsConfig) => {
  return defineField({
    name: 'addons',
    type: 'object',
    title: config.title,
    description: config.description,
    group: 'addons',
    fields: [
      defineField({
        name: 'hasAddons',
        type: 'boolean',
        title: config.labels.hasAddons.title,
        description: config.labels.hasAddons.description,
        initialValue: false,
      }),
      defineField({
        name: 'heading',
        type: 'Heading',
        description: config.labels.heading.description,
        title: config.labels.heading.title,
        hidden: ({ parent }) => !parent?.hasAddons,
        validation: (Rule) =>
          Rule.custom((value, context) => {
            const parent = context.parent as any
            if (parent?.hasAddons && !value) return 'Nagłówek okienka dodatków jest wymagany'
            return true
          }),
        initialValue: [
          {
            _key: '8a0d68722eaf',
            _type: 'block',
            children: [
              {
                _key: 'b0c030ee3f460',
                _type: 'span',
                marks: [],
                text: 'Do tej oferty możesz dobrać dodatki! ',
              },
              {
                _key: 'b0c030ee3f460',
                _type: 'span',
                marks: ['strong'],
                text: '(opcjonalne)',
              },
            ],
            markDefs: [],
            style: 'normal',
          },
        ],
      }),
      defineField({
        name: 'addonsChoice',
        type: 'string',
        title: config.labels.addonsChoice.title,
        description: config.labels.addonsChoice.description,
        options: {
          list: [
            { title: 'Nielimitowana ilość dodatków', value: 'unlimited' },
            { title: 'Maks. 1 dodatek', value: 'limited' },
          ],
          layout: 'radio',
          direction: 'horizontal',
        },
        hidden: ({ parent }) => !parent?.hasAddons,
        initialValue: 'unlimited',
        validation: (Rule) =>
          Rule.custom((value, context) => {
            const parent = context.parent as any
            if (parent?.hasAddons && !value) return 'Możliwość wyboru dodatków jest wymagana'
            return true
          }),
      }),
      defineField({
        name: 'minOneAddon',
        type: 'boolean',
        title: config.labels.minOneAddon.title,
        description: config.labels.minOneAddon.description,
        hidden: ({ parent }) => !parent?.hasAddons,
        initialValue: false,
      }),
      defineField({
        name: 'addonsLayout',
        type: 'string',
        title: config.labels.addonsLayout.title,
        description: config.labels.addonsLayout.description,
        options: {
          list: [
            { title: 'Układ pionowy', value: 'vertical' },
            { title: 'Układ poziomy (Możliwość dodania zdjęć, wymagane minimum 3 dodatki)', value: 'horizontal' },
          ],
          layout: 'radio',
          direction: 'vertical',
        },
        hidden: ({ parent }) => !parent?.hasAddons,
        initialValue: 'vertical',
        validation: (Rule) =>
          Rule.custom((value, context) => {
            const parent = context.parent as any
            if (parent?.hasAddons && !value) return 'Układ dodatków jest wymagany'
            return true
          }),
      }),
      defineField({
        name: 'addonsHaveImage',
        type: 'boolean',
        title: config.labels.addonsHaveImage.title,
        description: config.labels.addonsHaveImage.description,
        initialValue: false,
        hidden: ({ parent }) => !parent?.hasAddons || parent?.addonsLayout === 'vertical',
      }),
      defineField({
        name: 'addonsList',
        type: 'array',
        title: config.labels.addonsList.title,
        description: config.labels.addonsList.description,
        hidden: ({ parent }) => !parent?.hasAddons,
        validation: (Rule) =>
          Rule.custom((value, context) => {
            const parent = context.parent as any
            if (parent?.hasAddons && (!value || value.length === 0)) return 'Lista dodatków jest wymagana'
            if (parent?.hasAddons && parent?.addonsLayout === 'horizontal' && value && value.length < 3)
              return 'Dla układu poziomego wymagane są minimum 3 dodatki'
            return true
          }),
        of: [
          {
            type: 'object',
            fields: [
              {
                name: 'image',
                type: 'image',
                title: 'Zdjęcie dodatku',
                hidden: ({ document }) => {
                  const doc = document as any
                  return doc?.addons?.addonsHaveImage !== true || doc?.addons?.addonsLayout === 'vertical'
                },
                validation: (Rule) =>
                  Rule.custom((value, context) => {
                    const document = context.document as any
                    const isHorizontal = document?.addons?.addonsLayout === 'horizontal'
                    const hasImage = document?.addons?.addonsHaveImage === true

                    if (isHorizontal && hasImage && !value) {
                      return 'Zdjęcie jest wymagane dla układu poziomego z włączonymi zdjęciami'
                    }
                    return true
                  }),
              },
              {
                name: 'name',
                type: 'string',
                title: 'Nazwa dodatku',
                validation: (Rule) => Rule.required().error('Nazwa dodatku jest wymagana'),
              },
              {
                name: 'pricing',
                type: 'object',
                title: 'Cennik dodatku',
                validation: (Rule) => Rule.required().error('Cennik dodatku jest wymagany'),
                fields: [
                  {
                    name: 'type',
                    type: 'string',
                    title: 'Typ cennika',
                    options: {
                      list: [
                        { title: 'Stała cena', value: 'fixed' },
                        { title: 'Cena za jednostkę', value: 'per_unit' },
                        { title: 'Cena progowa', value: 'threshold' },
                        { title: 'Wycena indywidualna', value: 'individual' },
                      ],
                      layout: 'radio',
                    },
                    validation: (Rule) => Rule.required().error('Typ cennika jest wymagany'),
                  },
                  {
                    name: 'fixedPrice',
                    type: 'number',
                    title: 'Cena (PLN)',
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
                    name: 'perUnit',
                    type: 'object',
                    title: 'Cena za jednostkę',
                    options: {
                      collapsible: false,
                      collapsed: false,
                    },
                    hidden: ({ parent }) => parent?.type !== 'per_unit',
                    validation: (Rule) =>
                      Rule.custom((value, context) => {
                        const parent = context.parent as any

                        const objValue = value as { singular: string; plural: string; price: number }

                        if (
                          parent?.type === 'per_unit' &&
                          (!objValue?.singular || !objValue?.plural || !objValue?.price)
                        ) {
                          return 'Cena za jednostkę jest wymagana'
                        }
                        return true
                      }),
                    fields: [
                      {
                        name: 'price',
                        type: 'number',
                        title: 'Cena za jednostkę (PLN)',
                        validation: (Rule) =>
                          Rule.custom((value: number) => {
                            if (!!value && (typeof value !== 'number' || !Number.isInteger(value)))
                              return 'Cena musi być liczbą całkowitą'
                            if (!!value && value < 1) return 'Cena musi być większa niż 0 PLN'
                            return true
                          }),
                      },
                      {
                        name: 'hasCount',
                        type: 'boolean',
                        title: 'Możliwość wyboru ilości (opcjonalne)',
                        description: 'Wybierz, czy użytkownik może wybrać ilość dodatku.',
                        initialValue: false,
                        hidden: ({ document }) => {
                          const doc = document as any
                          return doc?.addons?.addonsChoice === 'limited' || doc?.addons?.minOneAddon === true
                        },
                      },
                      {
                        name: 'singular',
                        type: 'string',
                        title: 'Nazwa jednostki (pojedyncza)',
                        description: 'np. osoba, dzień',
                      },
                      {
                        name: 'plural',
                        type: 'string',
                        title: 'Nazwa jednostki (mnoga)',
                        description: 'np. osoby/osób, dni',
                      },
                    ],
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
                          plural: string
                        }
                        if (
                          parent?.type === 'threshold' &&
                          (!objValue?.basePrice ||
                            !objValue?.maxUnits ||
                            !objValue?.additionalPrice ||
                            !objValue?.singular ||
                            !objValue?.plural)
                        ) {
                          return 'Wszystkie pola są wymagane dla ceny progowej'
                        }
                        return true
                      }),
                    fields: [
                      {
                        name: 'basePrice',
                        type: 'number',
                        title: 'Cena podstawowa (PLN)',
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
                        title: 'Maksymalna liczba jednostek w cenie podstawowej',
                        validation: (Rule) =>
                          Rule.custom((value: number) => {
                            if (!!value && (typeof value !== 'number' || !Number.isInteger(value)))
                              return 'Maksymalna liczba jednostek musi być liczbą całkowitą'
                            if (!!value && value < 1) return 'Maksymalna liczba jednostek musi być większa niż 0'
                            return true
                          }),
                      },
                      {
                        name: 'additionalPrice',
                        type: 'number',
                        title: 'Cena za każdą dodatkową jednostkę (PLN)',
                        validation: (Rule) =>
                          Rule.custom((value: number) => {
                            if (!!value && (typeof value !== 'number' || !Number.isInteger(value)))
                              return 'Cena musi być liczbą całkowitą'
                            if (!!value && value < 1) return 'Cena musi być większa niż 0 PLN'
                            return true
                          }),
                      },
                      {
                        name: 'singular',
                        type: 'string',
                        title: 'Nazwa jednostki (pojedyncza)',
                        description: 'np. osoba, dzień',
                      },
                      {
                        name: 'plural',
                        type: 'string',
                        title: 'Nazwa jednostki (mnoga)',
                        description: 'np. osoby/osób, dni',
                      },
                    ],
                  },
                ],
              },
            ],
            preview: {
              select: {
                name: 'name',
                image: 'image',
                pricingType: 'pricing.type',
                fixedPrice: 'pricing.fixedPrice',
                perUnitPrice: 'pricing.perUnit.price',
                perUnitSingular: 'pricing.perUnit.singular',
                thresholdBasePrice: 'pricing.threshold.basePrice',
                thresholdMaxUnits: 'pricing.threshold.maxUnits',
                thresholdPlural: 'pricing.threshold.plural',
              },
              prepare: ({
                name,
                image,
                pricingType,
                fixedPrice,
                perUnitPrice,
                perUnitSingular,
                thresholdBasePrice,
                thresholdMaxUnits,
                thresholdPlural,
              }) => {
                let subtitle = ''

                switch (pricingType) {
                  case 'fixed':
                    subtitle = `${fixedPrice} PLN`
                    break
                  case 'per_unit':
                    subtitle = `${perUnitPrice} PLN / ${perUnitSingular}`
                    break
                  case 'threshold':
                    subtitle = `${thresholdBasePrice} PLN (do ${thresholdMaxUnits} ${thresholdPlural})`
                    break
                  case 'individual':
                    subtitle = 'Wycena indywidualna'
                    break
                }

                return {
                  title: name,
                  subtitle,
                  media: PlusSquareIcon,
                }
              },
            },
          },
        ],
      }),
      defineField({
        name: 'additionalInfo',
        type: 'text',
        title: config.labels.additionalInfo.title,
        description: config.labels.additionalInfo.description,
        rows: 4,
        hidden: ({ parent }) => !parent?.hasAddons,
      }),
    ],
  })
}
