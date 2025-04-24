import { Hotel } from 'lucide-react'
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
import StarRating from '../ui/StarRating'

const title = 'Hotele'
const icon = Hotel

export default defineType({
  name: 'Hotels_Collection',
  type: 'document',
  title,
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
      name: 'imageList',
      type: 'array',
      title: 'Lista zdjęć',
      description: 'Lista zdjęć wyświetlanych na stronie hotelu oraz przy jego refererowaniu',
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
      name: 'googleMapsLink',
      type: 'url',
      title: 'Link do Google Maps',
      validation: (Rule) => Rule.required().error('Link do Google Maps jest wymagany'),
      group: 'details',
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
      description: 'Ustaw cenę za osobę oraz opcjonalnie cenę za grupę',
      fields: [
        defineField({
          name: 'hasFixedGroupPrice',
          type: 'boolean',
          title: 'Dodaj cenę za grupę',
          initialValue: false,
        }),
        defineField({
          name: 'groupPrice',
          type: 'number',
          title: 'Cena za grupę (PLN)',
          hidden: ({ parent }) => !parent?.hasFixedGroupPrice,
          validation: (Rule) =>
            Rule.custom((value, context) => {
              const parent = context.parent as { hasFixedGroupPrice?: boolean }
              if (!parent?.hasFixedGroupPrice) return true
              if (!value) return 'Cena za grupę jest wymagana'
              if (value < 1) return 'Cena musi być większa niż 0'
              return true
            }),
        }),
        defineField({
          name: 'groupPeopleCount',
          type: 'number',
          title: 'Liczba osób w cenie grupowej',
          hidden: ({ parent }) => !parent?.hasFixedGroupPrice,
          validation: (Rule) =>
            Rule.custom((value, context) => {
              const parent = context.parent as { hasFixedGroupPrice?: boolean }
              if (!parent?.hasFixedGroupPrice) return true
              if (!value) return 'Liczba osób jest wymagana'
              if (value < 2) return 'Liczba osób musi być większa niż 1'
              return true
            }),
        }),
        defineField({
          name: 'pricePerPerson',
          type: 'number',
          title: 'Cena za osobę (PLN)',
          validation: (Rule) => Rule.required().min(1).error('Cena za osobę jest wymagana i musi być większa niż 0'),
        }),
      ],
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
