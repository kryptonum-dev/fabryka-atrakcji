import { Hotel, Utensils } from 'lucide-react'
import { defineField, defineType } from 'sanity'
import { defineSlugForDocument } from '../../utils/define-slug-for-document'
import {
  DocumentsIcon,
  InfoOutlineIcon,
  CreditCardIcon,
  SearchIcon,
  DocumentTextIcon,
  TagIcon,
  BasketIcon,
} from '@sanity/icons'
import createPortableText from '../ui/PortableText/content/index'
import Image from '../ui/PortableText/content/shared/Image'
import Checklist from '../ui/PortableText/content/shared/Checklist'
import Testimonials from '../ui/PortableText/content/offer/Testimonials'
import Faq from '../ui/PortableText/content/offer/Faq'
import BlocksWithImage from '../ui/PortableText/content/offer/BlocksWithImage'
import RowsWithIcons from '../ui/PortableText/content/offer/RowsWithIcons'
import Timeline from '../ui/PortableText/content/offer/Timeline'
import NextSteps from '../ui/PortableText/content/offer/NextSteps'
import ImageWithHeadingAndText from '../ui/PortableText/content/offer/ImageWithHeadingAndText'
import StarRating from '../ui/StarRating'
import Amenities from '../ui/PortableText/content/hotel/Amenities'
import StayingRules from '../ui/PortableText/content/hotel/StayingRules'
import Location from '../ui/PortableText/content/hotel/Location'
import { createAddonsObject } from '../shared/addons'
import { createAlertsObject } from '../shared/alerts'

// Reusable gastronomy field definitions
const createGastronomyAvailabilityField = (description: string) =>
  defineField({
    name: 'availability',
    type: 'string',
    title: 'Dostępność opcji',
    description,
    options: {
      list: [
        {
          title: 'Niedostępne - hotel nie oferuje tej opcji',
          value: 'disabled',
        },
        {
          title: 'Dostępne - cena ukryta (bezpłatne lub do uzgodnienia)',
          value: 'priceHidden',
        },
        {
          title: 'Dostępne - z widoczną ceną',
          value: 'withPrice',
        },
      ],
      layout: 'radio',
    },
    initialValue: 'withPrice',
    validation: (Rule) => Rule.required().error('Dostępność opcji jest wymagana'),
  })

const createGastronomyPriceField = () =>
  defineField({
    name: 'pricePerService',
    type: 'number',
    title: 'Cena za serwis (PLN)',
    description: 'Cena bez VAT - tylko liczby całkowite',
    hidden: ({ parent }) => parent?.availability !== 'withPrice',
    validation: (Rule) =>
      Rule.custom((value, context) => {
        const parent = context.parent as { availability?: string }
        if (parent?.availability !== 'withPrice') return true
        if (!value) return 'Cena jest wymagana gdy opcja ma widoczną cenę'
        if (value < 1) return 'Cena musi być większa niż 0'
        if (!Number.isInteger(value)) return 'Cena musi być liczbą całkowitą'
        return true
      }),
  })

const createGrillPriceField = () =>
  defineField({
    name: 'pricePerService',
    type: 'number',
    title: 'Cena za serwis grillowy (PLN)',
    description: 'Cena bez VAT za jeden serwis grillowy - tylko liczby całkowite',
    hidden: ({ parent }) => parent?.availability !== 'withPrice',
    validation: (Rule) =>
      Rule.custom((value, context) => {
        const parent = context.parent as { availability?: string }
        if (parent?.availability !== 'withPrice') return true
        if (!value) return 'Cena jest wymagana gdy opcja ma widoczną cenę'
        if (value < 1) return 'Cena musi być większa niż 0'
        if (!Number.isInteger(value)) return 'Cena musi być liczbą całkowitą'
        return true
      }),
  })

const createMealLevelField = () =>
  defineField({
    name: 'level',
    type: 'string',
    title: 'Poziom',
    options: {
      list: [
        { title: 'Economy', value: 'economy' },
        { title: 'Standard', value: 'standard' },
        { title: 'Exclusive', value: 'exclusive' },
      ],
      layout: 'radio',
      direction: 'horizontal',
    },
    validation: (Rule) => Rule.required().error('Poziom jest wymagany'),
  })

const createMealStyleField = () =>
  defineField({
    name: 'style',
    type: 'string',
    title: 'Sposób serwowania',
    options: {
      list: [
        { title: 'Served (na talerzu)', value: 'served' },
        { title: 'Buffet (szwedzki stół)', value: 'buffet' },
      ],
      layout: 'radio',
      direction: 'horizontal',
    },
    validation: (Rule) => Rule.required().error('Sposób serwowania jest wymagany'),
  })

const createMealPriceField = () =>
  defineField({
    name: 'pricePerService',
    type: 'number',
    title: 'Cena za serwis (PLN)',
    description: 'Cena bez VAT - tylko liczby całkowite',
    hidden: ({ parent }) => parent?.hidePricing,
    validation: (Rule) =>
      Rule.custom((value, context) => {
        const parent = context.parent as { hidePricing?: boolean }
        if (parent?.hidePricing) return true
        if (!value) return 'Cena jest wymagana jeśli nie jest ukryta'
        if (value < 1) return 'Cena musi być większa niż 0'
        if (!Number.isInteger(value)) return 'Cena musi być liczbą całkowitą'
        return true
      }),
  })

const createMealHidePricingField = () =>
  defineField({
    name: 'hidePricing',
    type: 'boolean',
    title: 'Ukryj cenę',
    description: 'Nie pokazuj ceny - opcja może być bezpłatna lub do ustalenia indywidualnie',
    initialValue: false,
  })

const title = 'Hotele'
const icon = Hotel

export default defineType({
  name: 'Hotels_Collection',
  type: 'document',
  title,
  options: {
    documentPreview: true,
  },
  icon,
  groups: [
    {
      name: 'general',
      title: 'Informacje ogólne',
      icon: DocumentsIcon,
    },
    {
      name: 'details',
      title: 'Szczegóły',
      icon: InfoOutlineIcon,
    },
    {
      name: 'pricing',
      title: 'Cennik',
      icon: CreditCardIcon,
    },
    {
      name: 'addons',
      title: 'Dodatki',
      icon: BasketIcon,
    },
    {
      name: 'gastronomy',
      title: 'Gastronomia',
      icon: TagIcon,
    },
    {
      name: 'alerts',
      title: 'Alerty',
      icon: InfoOutlineIcon,
    },
    {
      name: 'content',
      title: 'Treść',
      icon: DocumentTextIcon,
    },
    {
      name: 'seo',
      title: 'SEO',
      icon: SearchIcon,
    },
  ],
  fields: [
    defineField({
      name: 'language',
      type: 'string',
      readOnly: true,
      hidden: true,
      group: 'general',
    }),
    defineField({
      name: 'name',
      type: 'string',
      title: 'Nazwa hotelu',
      description: 'Nazwa hotelu wyświetlana przy wyszukiwaniu oraz udostępnianiu w mediach społecznościowych',
      validation: (Rule) => Rule.required().error('Nazwa hotelu jest wymagana'),
      group: 'general',
    }),
    ...defineSlugForDocument({
      source: 'name',
      prefixes: {
        pl: '/pl/hotele/',
        en: '/en/hotels/',
      },
    }),
    defineField({
      name: 'title',
      type: 'Heading',
      title: 'Nagłówek',
      description: 'Pełna nazwa hotelu wyświetlana na stronie hotelu',
      validation: (Rule) => Rule.required().error('Nagłówek jest wymagany'),
      group: 'general',
    }),
    defineField({
      name: 'description',
      type: 'text',
      title: 'Opis hotelu',
      description: 'Krótki opis hotelu wyświetlany na stronie hotelu oraz przy jego refererowaniu',
      validation: (Rule) => Rule.required().min(75).error('Opis musi zawierać co najmniej 75 znaków'),
      group: 'general',
    }),
    defineField({
      name: 'mediaList',
      type: 'array',
      title: 'Lista zdjęć i filmów',
      description:
        'Lista zdjęć i filmów wyświetlanych w sekcji hero konkretnej integracji oraz przy jej refererowaniu. Zdjęcie jest wymagane zawsze - służy jako miniaturka dla filmów. Opcjonalne - jeśli nie wypełnione, używane będzie pole "Lista zdjęć".',
      validation: (Rule) =>
        Rule.custom((value) => {
          if (!value || value.length === 0) return true // Optional field
          if (value.length < 2) return 'Jeśli wypełnione, lista musi zawierać co najmniej 2 media'
          return true
        }),
      of: [
        {
          type: 'object',
          fields: [
            {
              type: 'image',
              name: 'image',
              title: 'Zdjęcie',
              description: 'Zdjęcie wyświetlane w galerii. Dla filmów służy jako miniaturka.',
              validation: (Rule) => Rule.required(),
            },
            {
              type: 'string',
              name: 'youtubeId',
              title: 'ID filmu z YouTube (opcjonalne)',
              description:
                'Kiedy dodane, filmik z YouTube pojawi się w popupie zamiast zdjęcia. Zdjęcie wciąż będzie służyć jako miniaturka w galerii.',
              validation: (Rule) => Rule.optional(),
            },
          ],
          preview: {
            select: {
              image: 'image',
              youtubeId: 'youtubeId',
              filename: 'image.asset.originalFilename',
            },
            prepare: ({ image, youtubeId, filename }) => ({
              title: youtubeId ? `${filename || 'Media'} (Video)` : filename || 'Media',
              media: image,
              subtitle: youtubeId ? `YouTube: ${youtubeId}` : 'Zdjęcie',
            }),
          },
        },
      ],
      group: 'general',
    }),
    defineField({
      name: 'imageList',
      type: 'array',
      title: 'Lista zdjęć',
      description:
        'Tradycyjna lista zdjęć (bez obsługi filmów). Używane gdy pole "Lista zdjęć i filmów" nie jest wypełnione. Wymagane co najmniej 2 zdjęcia.',
      validation: (Rule) =>
        Rule.custom((value, { document }) => {
          const mediaList = (document as any)?.mediaList
          // If mediaList has content, imageList is not required
          if (mediaList && mediaList.length > 0) return true
          // If mediaList is empty, imageList is required with min 2 items
          if (!value || value.length === 0)
            return 'Lista zdjęć jest wymagana gdy "Lista zdjęć i filmów" nie jest wypełniona'
          if (value.length < 2) return 'Lista musi zawierać co najmniej 2 zdjęcia'
          return true
        }),
      of: [
        {
          type: 'image',
        },
      ],
      group: 'general',
    }),
    defineField({
      name: 'amenities',
      type: 'array',
      title: 'Udogodnienia',
      description: 'Lista udogodnień dostępnych w hotelu',
      validation: (Rule) => Rule.required().min(1).error('Przynajmniej jedno udogodnienie jest wymagane'),
      of: [
        {
          type: 'reference',
          to: { type: 'Amenities_Collection' },
          options: {
            disableNew: true,
            filter: ({ parent, document }) => {
              const language = (document as { language?: string })?.language
              const selectedIds =
                (parent as { _ref?: string }[])?.filter((item) => item._ref).map((item) => item._ref) || []
              return {
                filter: '!(_id in path("drafts.**")) && language == $lang',
                params: { selectedIds, lang: language },
              }
            },
          },
        },
      ],
      group: 'details',
    }),
    defineField({
      name: 'location',
      type: 'reference',
      to: [{ type: 'Locations_Collection' }],
      title: 'Lokalizacja',
      validation: (Rule) => Rule.required().error('Lokalizacja jest wymagana'),
      group: 'details',
    }),
    defineField({
      name: 'stars',
      type: 'number',
      title: 'Liczba gwiazdek',
      initialValue: 3,
      components: {
        input: StarRating,
      },
      validation: (Rule) => Rule.required().min(1).max(5).error('Liczba gwiazdek musi być między 1 a 5'),
      group: 'details',
    }),
    defineField({
      name: 'numberOfRooms',
      type: 'number',
      title: 'Liczba pokoi',
      validation: (Rule) =>
        Rule.custom((value) => {
          if (!value) return 'Liczba pokoi jest wymagana'
          if (value <= 0) return 'Liczba pokoi musi być większa niż 0'
          return true
        }),
      group: 'details',
    }),
    defineField({
      name: 'maxPeople',
      type: 'object',
      title: 'Maksymalna liczba osób',
      group: 'details',
      validation: (Rule) => Rule.required().error('Maksymalna liczba osób jest wymagana'),
      fields: [
        defineField({
          name: 'overnight',
          type: 'number',
          title: 'Nocleg',
          description: 'Maksymalna liczba osób na nocleg',
          validation: (Rule) =>
            Rule.custom((value) => {
              if (!value) return 'Maksymalna liczba osób na nocleg jest wymagana'
              if (value <= 0) return 'Maksymalna liczba osób musi być większa niż 0'
              return true
            }),
        }),
        defineField({
          name: 'conference',
          type: 'number',
          title: 'Konferencja',
          description: 'Wypełnij tylko jeśli hotel oferuje sale konferencyjne',
          validation: (Rule) =>
            Rule.custom((value) => {
              if (value && value <= 0) return 'Maksymalna liczba osób musi być większa niż 0'
              return true
            }),
        }),
        defineField({
          name: 'banquet',
          type: 'number',
          title: 'Bankiet',
          description: 'Wypełnij tylko jeśli hotel oferuje sale bankietowe',
          validation: (Rule) =>
            Rule.custom((value) => {
              if (value && value <= 0) return 'Maksymalna liczba osób musi być większa niż 0'
              return true
            }),
        }),
      ],
    }),
    defineField({
      name: 'address',
      type: 'object',
      title: 'Adres hotelu',
      group: 'details',
      options: {
        columns: 2,
      },
      validation: (Rule) => Rule.required().error('Adres jest wymagany'),
      fields: [
        defineField({
          name: 'street',
          type: 'string',
          title: 'Ulica i numer',
          validation: (Rule) => Rule.required().error('Ulica i numer jest wymagane'),
        }),
        defineField({
          name: 'postalCode',
          type: 'string',
          title: 'Kod pocztowy',
          validation: (Rule) =>
            Rule.custom((value) => {
              if (!value) return 'Kod pocztowy jest wymagany'
              if (!/^\d{2}-\d{3}$/.test(value)) return 'Kod pocztowy musi być w formacie XX-XXX'
              return true
            }),
        }),
        defineField({
          name: 'city',
          type: 'string',
          title: 'Miasto',
          validation: (Rule) =>
            Rule.custom((value) => {
              if (!value) return 'Miasto jest wymagane'
              return true
            }),
        }),
        defineField({
          name: 'voivodeship',
          type: 'string',
          title: 'Województwo',
          options: {
            list: [
              { title: 'Dolnośląskie', value: 'dolnoslaskie' },
              { title: 'Kujawsko-pomorskie', value: 'kujawsko-pomorskie' },
              { title: 'Lubelskie', value: 'lubelskie' },
              { title: 'Lubuskie', value: 'lubuskie' },
              { title: 'Łódzkie', value: 'lodzkie' },
              { title: 'Małopolskie', value: 'malopolskie' },
              { title: 'Mazowieckie', value: 'mazowieckie' },
              { title: 'Opolskie', value: 'opolskie' },
              { title: 'Podkarpackie', value: 'podkarpackie' },
              { title: 'Podlaskie', value: 'podlaskie' },
              { title: 'Pomorskie', value: 'pomorskie' },
              { title: 'Śląskie', value: 'slaskie' },
              { title: 'Świętokrzyskie', value: 'swietokrzyskie' },
              { title: 'Warmińsko-mazurskie', value: 'warminsko-mazurskie' },
              { title: 'Wielkopolskie', value: 'wielkopolskie' },
              { title: 'Zachodniopomorskie', value: 'zachodniopomorskie' },
            ],
          },
          initialValue: 'mazowieckie',
          validation: (Rule) => Rule.required().error('Województwo jest wymagane'),
        }),
      ],
    }),
    defineField({
      name: 'googleMaps',
      type: 'object',
      title: 'Mapy Google',
      group: 'details',
      validation: (Rule) => Rule.required().error('Mapy Google są wymagane'),
      fields: [
        defineField({
          name: 'googleMapsLink',
          type: 'url',
          title: 'Link do Google Maps',
          description: 'Link do Google Maps - przekierowuje do strony Google Maps',
          validation: (Rule) => Rule.required().error('Link do Google Maps jest wymagany'),
        }),
        defineField({
          name: 'googleMapsEmbed',
          type: 'url',
          title: 'Link do Google Maps Embed (opcjonalny)',
          description: 'Kod Embed Google Maps - używany do wyświetlania interaktywnej mapy na stronie',
        }),
      ],
    }),

    defineField({
      name: 'popularityIndex',
      type: 'number',
      title: 'Indeks popularności',
      description: 'Indeks popularności hotelu (0-100). Wyższy indeks oznacza lepszą pozycję na liście.',
      validation: (Rule) => Rule.min(0).max(100).error('Indeks popularności musi być między 0 a 100'),
      initialValue: 20,
      group: 'details',
    }),
    defineField({
      name: 'pricing',
      type: 'object',
      title: 'Cennik',
      group: 'pricing',
      description: 'Ustaw cenę netto za osobę oraz opcjonalnie cenę netto za grupę (ceny bez VAT)',
      fields: [
        defineField({
          name: 'pricingVisible',
          type: 'boolean',
          title: 'Cennik widoczny publicznie',
          description:
            'Czy ceny hotelu mają być widoczne na stronie? Jeśli wyłączone, użytkownicy będą informowani o konieczności kontaktu w celu uzyskania wyceny.',
          initialValue: true,
        }),
        defineField({
          name: 'hasFixedGroupPrice',
          type: 'boolean',
          title: 'Dodaj cenę za grupę',
          initialValue: false,
          hidden: ({ parent }) => !parent?.pricingVisible,
        }),
        defineField({
          name: 'groupPrice',
          type: 'number',
          title: 'Cena netto za grupę (PLN)',
          description: 'Cena bez VAT',
          hidden: ({ parent }) => !parent?.hasFixedGroupPrice || !parent?.pricingVisible,
          validation: (Rule) =>
            Rule.custom((value, context) => {
              const parent = context.parent as { hasFixedGroupPrice?: boolean; pricingVisible?: boolean }
              if (!parent?.pricingVisible || !parent?.hasFixedGroupPrice) return true
              if (!value) return 'Cena za grupę jest wymagana'
              if (value < 1) return 'Cena musi być większa niż 0'
              return true
            }),
        }),
        defineField({
          name: 'groupPeopleCount',
          type: 'number',
          title: 'Liczba osób w cenie grupowej',
          hidden: ({ parent }) => !parent?.hasFixedGroupPrice || !parent?.pricingVisible,
          validation: (Rule) =>
            Rule.custom((value, context) => {
              const parent = context.parent as { hasFixedGroupPrice?: boolean; pricingVisible?: boolean }
              if (!parent?.pricingVisible || !parent?.hasFixedGroupPrice) return true
              if (!value) return 'Liczba osób jest wymagana'
              if (value < 2) return 'Liczba osób musi być większa niż 1'
              return true
            }),
        }),
        defineField({
          name: 'pricePerPerson',
          type: 'number',
          title: 'Cena netto za osobę (PLN)',
          description: 'Cena bez VAT',
          hidden: ({ parent }) => !parent?.pricingVisible,
          validation: (Rule) =>
            Rule.custom((value, context) => {
              const parent = context.parent as { pricingVisible?: boolean }
              if (!parent?.pricingVisible) return true
              if (!value) return 'Cena za osobę jest wymagana'
              if (value < 1) return 'Cena za osobę musi być większa niż 0'
              return true
            }),
        }),
      ],
    }),
    createAddonsObject({
      title: 'Dodatki do hotelu',
      description: 'Zarządzaj dodatkami do hotelu',
      labels: {
        hasAddons: {
          title: 'Czy hotel ma dodatki?',
          description: 'Zaznacz, jeśli hotel ma możliwość wyboru dodatków.',
        },
        heading: {
          title: 'Nagłówek okienka dodatków',
          description: 'Nagłówek okienka dodatków, pojawia się przy wybieraniu dodatków do hotelu',
        },
        addonsChoice: {
          title: 'Możliwość wyboru dodatków',
          description:
            'Wybierz, ile maksymalnie dodatków może wybrać użytkownik. Przy wyborze maks. 1 dodatku, pole "Wybór ilości" zostaje automatycznie wyłączone.',
        },
        minOneAddon: {
          title: 'Wymagany wybór co najmniej jednego dodatku',
          description: 'Wybierz, czy użytkownik musi wybrać co najmniej jeden dodatek.',
        },
        addonsLayout: {
          title: 'Układ dodatków',
          description:
            'Wybierz układ dodatków. Układ pionowy (Dodatki wypisane jeden po drugim w formie wierszy tabeli) - używany gdy dodatki mają zdjęcia. Układ poziomy (Dodatki porozmieszczane w kafelkach) - używany gdy dodatki nie mają zdjęć.',
        },
        addonsHaveImage: {
          title: 'Dodatki mają zdjęcia',
          description:
            'Wybierz, czy dodatki mają zdjęcia. Jeśli zaznaczysz to pole, każdy dodatek będzie wymagał dodania zdjęcia.',
        },
        addonsList: {
          title: 'Lista dodatków',
          description: 'Dodaj dodatki do hotelu',
        },
        additionalInfo: {
          title: 'Dodatkowe informacje (opcjonalne)',
          description: 'Dodaj dodatkowe informacje o dodatkach - pojawiają się poniżej listy dodatków',
        },
      },
    }),
    defineField({
      name: 'gastronomy',
      type: 'object',
      title: 'Gastronomia',
      group: 'gastronomy',
      description: 'Ustaw cennik gastronomii dla hotelu',
      fields: [
        defineField({
          name: 'lunch',
          type: 'array',
          title: 'Opcje lunchowe',
          description: 'Wybierz dostępne kombinacje poziomów i sposobów serwowania lunchu',
          of: [
            {
              type: 'object',
              title: 'Opcja lunchowa',
              fields: [
                createMealLevelField(),
                createMealStyleField(),
                createMealPriceField(),
                createMealHidePricingField(),
              ],
              preview: {
                select: {
                  level: 'level',
                  style: 'style',
                  price: 'pricePerService',
                  hidePricing: 'hidePricing',
                },
                prepare: ({ level, style, price, hidePricing }: any) => ({
                  title: `${level?.charAt(0).toUpperCase() + level?.slice(1)} ${style?.charAt(0).toUpperCase() + style?.slice(1)}`,
                  subtitle: hidePricing ? 'Cena ukryta' : `${price || 0} PLN/serwis`,
                  media: Utensils,
                }),
              },
            },
          ],
          validation: (Rule) =>
            Rule.custom((items) => {
              if (!items || !Array.isArray(items)) return true
              const combinations = new Set()
              for (const item of items) {
                const typedItem = item as { level?: string; style?: string }
                if (typedItem.level && typedItem.style) {
                  const combo = `${typedItem.level}-${typedItem.style}`
                  if (combinations.has(combo)) {
                    return `Kombinacja "${typedItem.level} ${typedItem.style}" już istnieje. Każda kombinacja poziomu i stylu może wystąpić tylko raz.`
                  }
                  combinations.add(combo)
                }
              }
              return true
            }),
        }),
        defineField({
          name: 'supper',
          type: 'array',
          title: 'Opcje kolacyjne',
          description: 'Wybierz dostępne kombinacje poziomów i sposobów serwowania kolacji',
          of: [
            {
              type: 'object',
              title: 'Opcja kolacyjna',
              fields: [
                createMealLevelField(),
                createMealStyleField(),
                createMealPriceField(),
                createMealHidePricingField(),
              ],
              preview: {
                select: {
                  level: 'level',
                  style: 'style',
                  price: 'pricePerService',
                  hidePricing: 'hidePricing',
                },
                prepare: ({ level, style, price, hidePricing }: any) => ({
                  title: `${level?.charAt(0).toUpperCase() + level?.slice(1)} ${style?.charAt(0).toUpperCase() + style?.slice(1)}`,
                  subtitle: hidePricing ? 'Cena ukryta' : `${price || 0} PLN/serwis`,
                  media: Utensils,
                }),
              },
            },
          ],
          validation: (Rule) =>
            Rule.custom((items) => {
              if (!items || !Array.isArray(items)) return true
              const combinations = new Set()
              for (const item of items) {
                const typedItem = item as { level?: string; style?: string }
                if (typedItem.level && typedItem.style) {
                  const combo = `${typedItem.level}-${typedItem.style}`
                  if (combinations.has(combo)) {
                    return `Kombinacja "${typedItem.level} ${typedItem.style}" już istnieje. Każda kombinacja poziomu i stylu może wystąpić tylko raz.`
                  }
                  combinations.add(combo)
                }
              }
              return true
            }),
        }),
        defineField({
          name: 'openBar',
          type: 'array',
          title: 'Open Bar',
          description: 'Wybierz dostępne poziomy dla Open Bar',
          of: [
            {
              type: 'object',
              title: 'Opcja Open Bar',
              fields: [createMealLevelField(), createMealPriceField(), createMealHidePricingField()],
              preview: {
                select: {
                  level: 'level',
                  price: 'pricePerService',
                  hidePricing: 'hidePricing',
                },
                prepare: ({ level, price, hidePricing }: any) => ({
                  title: `Open Bar ${level?.charAt(0).toUpperCase() + level?.slice(1)}`,
                  subtitle: hidePricing ? 'Cena ukryta' : `${price || 0} PLN/serwis`,
                  media: Utensils,
                }),
              },
            },
          ],
          validation: (Rule) =>
            Rule.custom((items) => {
              if (!items || !Array.isArray(items)) return true
              const levels = new Set()
              for (const item of items) {
                const typedItem = item as { level?: string }
                if (typedItem.level) {
                  if (levels.has(typedItem.level)) {
                    return `Poziom "${typedItem.level}" już istnieje. Każdy poziom może wystąpić tylko raz.`
                  }
                  levels.add(typedItem.level)
                }
              }
              return true
            }),
        }),
        defineField({
          name: 'coffeeBreak',
          type: 'object',
          title: 'Coffee Break',
          fields: [
            createGastronomyAvailabilityField('Wybierz dostępność coffee break w hotelu'),
            createGastronomyPriceField(),
          ],
        }),
        defineField({
          name: 'grill',
          type: 'object',
          title: 'Grill',
          fields: [createGastronomyAvailabilityField('Wybierz dostępność grilla w hotelu'), createGrillPriceField()],
        }),
      ],
    }),
    createAlertsObject({
      paragraph: 'Alerty wyświetlane w koszyku dla tego hotelu.',
    }),
    createPortableText({
      title: 'Treść',
      additionalComponents: [
        Image,
        ImageWithHeadingAndText,
        Checklist,
        Timeline,
        Testimonials,
        Faq,
        BlocksWithImage,
        RowsWithIcons,
        NextSteps,
        Amenities,
        Location,
        StayingRules,
      ],
    }),
    defineField({
      name: 'components',
      type: 'components',
      title: 'Komponenty podstrony (opcjonalne)',
      group: 'content',
    }),
    defineField({
      name: 'formOverrides',
      type: 'object',
      title: 'Nadpisania formularza kontaktowego',
      description: 'Opcjonalne nadpisania nagłówka i paragrafu formularza kontaktowego dla tego hotelu.',
      options: { collapsible: true, collapsed: true },
      group: 'content',
      fields: [
        defineField({
          name: 'heading',
          type: 'Heading',
          title: 'Nagłówek formularza',
          description: 'Jeśli uzupełnione, zastąpi domyślny nagłówek formularza kontaktowego.',
        }),
        defineField({
          name: 'paragraph',
          type: 'PortableText',
          title: 'Paragraf formularza',
          description: 'Jeśli uzupełnione, zastąpi domyślny paragraf formularza kontaktowego.',
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
  preview: {
    select: {
      title: 'name',
      subtitle: 'description',
      mediaList: 'mediaList',
      imageList: 'imageList',
    },
    prepare: ({ title, subtitle, mediaList, imageList }) => ({
      title: title,
      subtitle: subtitle || 'Brak opisu',
      media: mediaList?.[0]?.image || imageList?.[0] || null,
      icon,
    }),
  },
})
