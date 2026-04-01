import { House } from 'lucide-react'
import { defineField, defineType } from 'sanity'
import { defineSlugForDocument } from '../../utils/define-slug-for-document'
import {
  DocumentsIcon,
  InfoOutlineIcon,
  CreditCardIcon,
  SearchIcon,
  DocumentTextIcon,
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
import Amenities from '../ui/PortableText/content/hotel/Amenities'
import Location from '../ui/PortableText/content/hotel/Location'
import { createAlertsObject } from '../shared/alerts'

const title = 'Przestrzenie Eventowe'
const icon = House

export default defineType({
  name: 'EventSpaces_Collection',
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
      title: 'Nazwa przestrzeni eventowej',
      description: 'Nazwa przestrzeni wyświetlana przy wyszukiwaniu oraz udostępnianiu w mediach społecznościowych',
      validation: (Rule) => Rule.required().error('Nazwa przestrzeni eventowej jest wymagana'),
      group: 'general',
    }),
    ...defineSlugForDocument({
      source: 'name',
      prefixes: {
        pl: '/pl/przestrzenie-eventowe/',
        en: '/en/event-spaces/',
      },
    }),
    defineField({
      name: 'title',
      type: 'Heading',
      title: 'Nagłówek',
      description: 'Pełna nazwa przestrzeni eventowej wyświetlana na stronie szczegółowej',
      validation: (Rule) => Rule.required().error('Nagłówek jest wymagany'),
      group: 'general',
    }),
    defineField({
      name: 'description',
      type: 'text',
      title: 'Opis przestrzeni eventowej',
      description: 'Krótki opis przestrzeni eventowej wyświetlany na stronie szczegółowej oraz przy jej refererowaniu',
      validation: (Rule) => Rule.required().min(75).error('Opis musi zawierać co najmniej 75 znaków'),
      group: 'general',
    }),
    defineField({
      name: 'mediaList',
      type: 'array',
      title: 'Lista zdjęć i filmów',
      description:
        'Lista zdjęć i filmów wyświetlanych w sekcji hero konkretnej przestrzeni eventowej. Zdjęcie jest wymagane zawsze - służy jako miniaturka dla filmów. Opcjonalne - jeśli nie wypełnione, używane będzie pole "Lista zdjęć".',
      validation: (Rule) =>
        Rule.custom((value) => {
          if (!value || value.length === 0) return true
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
          const mediaList = (document as { mediaList?: unknown[] })?.mediaList
          if (mediaList && mediaList.length > 0) return true
          if (!value || value.length === 0) return 'Lista zdjęć jest wymagana gdy "Lista zdjęć i filmów" nie jest wypełniona'
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
      description: 'Lista udogodnień dostępnych w przestrzeni eventowej',
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
      name: 'areaM2',
      type: 'number',
      title: 'Powierzchnia (m2)',
      validation: (Rule) =>
        Rule.custom((value) => {
          if (!value) return 'Powierzchnia jest wymagana'
          if (value <= 0) return 'Powierzchnia musi być większa niż 0'
          return true
        }),
      group: 'details',
    }),
    defineField({
      name: 'maxPeople',
      type: 'number',
      title: 'Maksymalna liczba osób',
      description: 'Główna maksymalna liczba osób dla tej przestrzeni eventowej',
      validation: (Rule) =>
        Rule.custom((value) => {
          if (!value) return 'Maksymalna liczba osób jest wymagana'
          if (value <= 0) return 'Maksymalna liczba osób musi być większa niż 0'
          return true
        }),
      group: 'details',
    }),
    defineField({
      name: 'address',
      type: 'object',
      title: 'Adres przestrzeni eventowej',
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
      description: 'Indeks popularności przestrzeni eventowej (0-100). Wyższy indeks oznacza lepszą pozycję na liście.',
      validation: (Rule) => Rule.min(0).max(100).error('Indeks popularności musi być między 0 a 100'),
      initialValue: 20,
      group: 'details',
    }),
    defineField({
      name: 'pricing',
      type: 'object',
      title: 'Cennik',
      group: 'pricing',
      description: 'Ustaw widoczność orientacyjnej ceny lub pozostaw informację o wycenie indywidualnej',
      fields: [
        defineField({
          name: 'pricingVisible',
          type: 'boolean',
          title: 'Pokaż orientacyjną cenę',
          description: 'Czy orientacyjna cena ma być widoczna publicznie na stronie?',
          initialValue: false,
        }),
        defineField({
          name: 'displayMode',
          type: 'string',
          title: 'Tryb prezentacji ceny',
          initialValue: 'quoteOnly',
          options: {
            list: [
              { title: 'Cena dostępna w wycenie', value: 'quoteOnly' },
              { title: 'Cena od', value: 'fromPrice' },
            ],
          },
          hidden: ({ parent }) => !(parent as { pricingVisible?: boolean })?.pricingVisible,
        }),
        defineField({
          name: 'fromPrice',
          type: 'number',
          title: 'Cena od (PLN netto)',
          description: 'Orientacyjna cena początkowa',
          hidden: ({ parent }) =>
            !(parent as { pricingVisible?: boolean; displayMode?: string })?.pricingVisible ||
            (parent as { displayMode?: string })?.displayMode !== 'fromPrice',
          validation: (Rule) =>
            Rule.custom((value, context) => {
              const parent = context.parent as { pricingVisible?: boolean; displayMode?: string }
              if (!parent?.pricingVisible || parent?.displayMode !== 'fromPrice') return true
              if (!value) return 'Cena od jest wymagana'
              if (value < 1) return 'Cena musi być większa niż 0'
              return true
            }),
        }),
        defineField({
          name: 'priceLabel',
          type: 'string',
          title: 'Etykieta ceny (opcjonalna)',
          description: 'Np. "za dzień", "za event", "za wynajem"',
          hidden: ({ parent }) => !(parent as { pricingVisible?: boolean })?.pricingVisible,
        }),
      ],
    }),
    createAlertsObject({
      paragraph: 'Alerty wyświetlane przy formularzu zapytania dla tej przestrzeni eventowej.',
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
      description: 'Opcjonalne nadpisania formularza kontaktowego dla tej przestrzeni eventowej.',
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
          description: 'Włącz, aby użyć niestandardowych komunikatów sukcesu/błędu dla tej przestrzeni eventowej.',
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
      title,
      subtitle: subtitle || 'Brak opisu',
      media: mediaList?.[0]?.image || imageList?.[0] || null,
      icon,
    }),
  },
})
