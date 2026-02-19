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
import FileView from '../ui/PortableText/content/offer/FileView'
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
          name: 'address',
          type: 'object',
          title: 'Adres integracji',
          hidden: ({ parent }) => parent?.isNationwide,
          options: {
            columns: 2,
          },
          validation: (Rule) =>
            Rule.custom((value, { parent }) => {
              if ((parent as { isNationwide?: boolean })?.isNationwide) return true
              if (!value) return 'Adres jest wymagany gdy integracja nie jest ogólnopolska'
              return true
            }),
          fields: [
            defineField({
              name: 'street',
              type: 'string',
              title: 'Ulica i numer',
              validation: (Rule) =>
                Rule.custom((value, { document }) => {
                  const locationData = (document as any)?.location
                  if (locationData?.isNationwide) return true
                  if (!value) return 'Ulica i numer są wymagane'
                  return true
                }),
            }),
            defineField({
              name: 'postalCode',
              type: 'string',
              title: 'Kod pocztowy',
              validation: (Rule) =>
                Rule.custom((value, { document }) => {
                  const locationData = (document as any)?.location
                  if (locationData?.isNationwide) return true
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
                Rule.custom((value, { document }) => {
                  const locationData = (document as any)?.location
                  if (locationData?.isNationwide) return true
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
              validation: (Rule) =>
                Rule.custom((value, { document }) => {
                  const locationData = (document as any)?.location
                  if (locationData?.isNationwide) return true
                  if (!value) return 'Województwo jest wymagane'
                  return true
                }),
            }),
          ],
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
          title: 'Cena podstawowa netto (PLN)',
          description: 'Cena bez VAT',
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
          title: 'Cena netto za każdą dodatkową osobę (PLN / osoba)',
          description: 'Cena bez VAT',
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
        FileView,
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
      description:
        'Opcjonalne nadpisania formularza kontaktowego dla tej integracji (nagłówek, paragraf, obraz, komunikaty).',
      options: { collapsible: true, collapsed: false },
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
        defineField({
          name: 'formVisualImage',
          type: 'image',
          title: 'Zdjęcie sekcji formularza',
          description: 'Jeśli uzupełnione, zastąpi domyślne zdjęcie sekcji formularza.',
        }),
        defineField({
          name: 'overrideFormState',
          type: 'boolean',
          title: 'Nadpisz komunikaty formularza',
          description: 'Włącz, aby użyć niestandardowych komunikatów sukcesu/błędu dla tej integracji.',
          initialValue: false,
        }),
        defineField({
          name: 'formState',
          type: 'formState',
          title: 'Komunikaty formularza',
          description: 'Niestandardowe komunikaty sukcesu i błędu (wypełnij tylko gdy nadpisywanie jest włączone)',
          hidden: ({ parent }) => !(parent as { overrideFormState?: boolean })?.overrideFormState,
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
