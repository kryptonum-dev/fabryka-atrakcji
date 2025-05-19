import { Cpu, Handshake, PlusSquareIcon } from 'lucide-react'
import { defineField, defineType } from 'sanity'
import { defineSlugForDocument } from '../../utils/define-slug-for-document'
import { DocumentsIcon, InfoOutlineIcon, CreditCardIcon, SearchIcon, DocumentTextIcon } from '@sanity/icons'
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
import { createAddonsObject } from '../shared/addons'
import { createAlertsObject } from '../shared/alerts'

const title = 'Integracje'
const icon = Handshake

export default defineType({
  name: 'Activities_Collection',
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
      icon: CreditCardIcon,
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
      title: 'Nazwa integracji',
      description:
        'Nazwa integracji wyświetlania przy refererowaniu, wyszukiwaniu oraz udostępnianiu w mediach społecznościowych',
      validation: (Rule) => Rule.required().error('Nazwa integracji jest wymagana'),
      group: 'general',
    }),
    ...defineSlugForDocument({
      source: 'name',
      prefixes: {
        pl: '/pl/integracje/',
        en: '/en/activities/',
      },
    }),
    defineField({
      name: 'title',
      type: 'Heading',
      title: 'Nagłówek',
      description: 'Pełna nazwa integracji wyświetlana na stronie integracji',
      validation: (Rule) => Rule.required().error('Nagłówek jest wymagany'),
      group: 'general',
    }),
    defineField({
      name: 'description',
      type: 'text',
      title: 'Opis integracji',
      description: 'Krótki opis integracji wyświetlany na stronie integracji oraz przy jej refererowaniu',
      validation: (Rule) => Rule.required().min(75).error('Opis musi zawierać co najmniej 75 znaków'),
      group: 'general',
    }),
    defineField({
      name: 'imageList',
      type: 'array',
      title: 'Lista zdjęć',
      description: 'Lista zdjęć wyświetlanych w sekcji hero konkretnej integracji oraz przy jej refererowaniu',
      validation: (Rule) =>
        Rule.required().error('Lista zdjęć jest wymagana').min(2).error('Przynajmniej 2 zdjęcia są wymagane'),
      of: [
        {
          type: 'image',
        },
      ],
      group: 'general',
    }),
    defineField({
      name: 'categories',
      type: 'array',
      title: 'Kategorie',
      validation: (Rule) => Rule.required().min(1).error('Przynajmniej jedna kategoria jest wymagana'),
      description:
        'Lista kategorii do których należy dana integracja, integracja może należeć do więcej niż jednej kategorii.',
      of: [
        {
          type: 'reference',
          to: { type: 'ActivitiesCategory_Collection' },
          options: {
            disableNew: true,
            filter: ({ parent, document }) => {
              const language = (document as { language?: string })?.language
              const selectedIds =
                (parent as { _ref?: string }[])?.filter((item) => item._ref).map((item) => item._ref) || []
              return {
                filter: '!(_id in path("drafts.**")) && language == $lang && !(_id in $selectedIds)',
                params: { selectedIds, lang: language },
              }
            },
          },
        },
      ],
      group: 'general',
    }),
    defineField({
      name: 'activityType',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{ type: 'ActivitiesType_Collection' }],
          options: {
            disableNew: true,
            filter: ({ document }) => {
              const language = (document as { language?: string })?.language
              return {
                filter: 'language == $lang',
                params: { lang: language },
              }
            },
          },
        },
      ],
      title: 'Rodzaj aktywności',
      description: 'Wybierz rodzaje aktywności z listy. Możesz wybrać więcej niż jeden rodzaj aktywności.',
      validation: (Rule) => Rule.required().min(1).error('Przynajmniej jeden rodzaj aktywności jest wymagany'),
      group: 'details',
    }),
    defineField({
      name: 'participantsCount',
      type: 'object',
      title: 'Przedział liczby uczestników',
      validation: (Rule) => Rule.required().error('Przedział liczby uczestników jest wymagany'),
      options: {
        columns: 2,
      },
      fields: [
        defineField({
          name: 'min',
          type: 'number',
          title: 'Minimalna liczba uczestników',
          validation: (Rule) => Rule.required().min(1).error('Minimalna liczba uczestników musi być większa niż 0'),
        }),
        defineField({
          name: 'max',
          type: 'number',
          title: 'Maksymalna liczba uczestników',
          validation: (Rule) =>
            Rule.custom((max, { parent }) => {
              const parentObj = parent as { min?: number }
              if (!max) return 'Maksymalna liczba uczestników jest wymagana'

              if (typeof parentObj?.min === 'number' && typeof max === 'number' && max < parentObj.min) {
                return 'Maksymalna liczba uczestników musi być większa lub równa minimalnej'
              }
              return true
            }),
        }),
      ],
      group: 'details',
    }),

    defineField({
      name: 'duration',
      type: 'object',
      title: 'Czas trwania',
      validation: (Rule) => Rule.required().error('Czas trwania jest wymagany'),
      fields: [
        defineField({
          name: 'isFullDay',
          type: 'boolean',
          title: 'Cały dzień',
          initialValue: false,
        }),
        defineField({
          name: 'hours',
          type: 'number',
          title: 'Ilość godzin (h)',
          hidden: ({ parent }) => parent?.isFullDay,
          validation: (Rule) =>
            Rule.custom((hours, { parent }) => {
              const parentObj = parent as { isFullDay?: boolean }
              if (parentObj?.isFullDay) return true
              if (!hours) return 'Wymagane gdy nie jest zaznaczone "Cały dzień"'
              if (hours < 1 || hours > 24) return 'Wartość musi być między 1 a 24'
              return true
            }),
        }),
      ],
      group: 'details',
    }),
    defineField({
      name: 'location',
      type: 'object',
      title: 'Lokalizacja',
      validation: (Rule) => Rule.required(),
      fields: [
        defineField({
          name: 'isNationwide',
          type: 'boolean',
          title: 'W całej Polsce',
          initialValue: false,
        }),
        defineField({
          name: 'customLocation',
          type: 'string',
          title: 'Konkretna lokalizacja',
          description: 'Wprowadź nazwę konkretnej lokalizacji w której odbywa się integracja.',
          hidden: ({ parent }) => parent?.isNationwide,
          validation: (Rule) =>
            Rule.custom((value, { parent }) => {
              if ((parent as { isNationwide?: boolean })?.isNationwide) return true
              if (!value) return 'Lokalizacja jest wymagana'
              return true
            }),
        }),
        defineField({
          name: 'googleMapsLink',
          type: 'url',
          title: 'Link do Google Maps (opcjonalny)',
          description: 'Jeśli integracja odbywa się w określonym miejscu, podaj link do Google Maps.',
          hidden: ({ parent }) => parent?.isNationwide,
          validation: (Rule) =>
            Rule.custom((value, { parent }) => {
              if ((parent as { isNationwide?: boolean })?.isNationwide) return true
              return true
            }),
        }),
        defineField({
          name: 'isIndoor',
          type: 'string',
          title: 'Indoor/Outdoor',
          description: 'Wybierz gdzie odbywa się aktywność',
          options: {
            list: [
              { title: 'Indoor (w pomieszczeniu)', value: 'indoor' },
              { title: 'Outdoor (na zewnątrz)', value: 'outdoor' },
            ],
            layout: 'radio',
            direction: 'horizontal',
          },
          initialValue: 'indoor',
        }),
      ],
      group: 'details',
    }),
    defineField({
      name: 'languages',
      type: 'array',
      title: 'Wspierane języki',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'Polski', value: 'pl' },
          { title: 'Angielski', value: 'en' },
          { title: 'Niemiecki', value: 'de' },
        ],
      },
      initialValue: ['pl'],
      validation: (Rule) => Rule.required().error('Przynajmniej jeden język musi być wybrany'),
      group: 'details',
    }),
    defineField({
      name: 'popularityIndex',
      type: 'number',
      title: 'Indeks popularności',
      description:
        'Indeks popularności integracji, określa jak pozycjonuje się dana integracja w liście integracji na stronie. Wyższy indeks oznacza lepszą pozycję na liście. (0 - 100)',
      validation: (Rule) => Rule.min(0).max(100).error('Indeks popularności musi być między 0 a 100'),
      initialValue: 20,
      group: 'details',
    }),
    defineField({
      name: 'pricing',
      type: 'object',
      title: 'Cennik',
      group: 'pricing',
      validation: (Rule) => Rule.required().error('Cennik jest wymagany'),
      fields: [
        defineField({
          name: 'basePrice',
          type: 'number',
          title: 'Cena podstawowa (PLN)',
          validation: (Rule) =>
            Rule.custom((value) => {
              if (!value) {
                return 'Cena podstawowa jest wymagana dla tego typu cennika'
              }
              if (value < 1) {
                return 'Cena podstawowa musi być większa niż 0'
              }
              return true
            }),
        }),
        defineField({
          name: 'maxParticipants',
          type: 'number',
          title: 'Maksymalna liczba osób w cenie podstawowej',
          validation: (Rule) =>
            Rule.custom((value) => {
              if (!value) {
                return 'Maksymalna liczba osób jest wymagana dla tego typu cennika'
              }
              if (value < 1) {
                return 'Maksymalna liczba osób w cenie podstawowej musi być większa niż 0'
              }
              return true
            }),
        }),
        defineField({
          name: 'additionalPersonPrice',
          type: 'number',
          title: 'Cena za każdą dodatkową osobę (PLN / osoba)',
          validation: (Rule) =>
            Rule.custom((value) => {
              if (!value) {
                return 'Cena za dodatkową osobę jest wymagana dla tego typu cennika'
              }
              if (value < 1) {
                return 'Cena za każdą dodatkową osobę musi być większa niż 0'
              }
              return true
            }),
        }),
      ],
    }),
    createAddonsObject({
      title: 'Dodatki do integracji',
      description: 'Zarządzaj dodatkami do integracji',
      labels: {
        hasAddons: {
          title: 'Czy integracja ma dodatki?',
          description: 'Zaznacz, jeśli integracja ma możliwość wyboru dodatków.',
        },
        heading: {
          title: 'Nagłówek okienka dodatków',
          description: 'Nagłówek okienka dodatków, pojawia się przy wybieraniu dodatków do danej integracji',
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
          description: 'Dodaj dodatki do integracji',
        },
        additionalInfo: {
          title: 'Dodatkowe informacje (opcjonalne)',
          description: 'Dodaj dodatkowe informacje o dodatkach - pojawiają się poniżej listy dodatków',
        },
      },
    }),
    createAlertsObject({
      paragraph: 'Alerty wyświetlane w koszyku dla tego hotelu.',
    }),
    createPortableText({
      title: 'Treść integracji',
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
      ],
    }),
    defineField({
      name: 'components',
      type: 'components',
      title: 'Komponenty podstrony (opcjonalne)',
      group: 'content',
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
      imageList: 'imageList',
    },
    prepare: ({ title, subtitle, imageList }) => ({
      title: title,
      subtitle: subtitle || 'Brak opisu',
      media: imageList?.[0] || null,
      icon,
    }),
  },
})
