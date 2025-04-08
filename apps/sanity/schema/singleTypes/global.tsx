import { BarChartIcon, CaseIcon, CommentIcon, SearchIcon, UsersIcon } from '@sanity/icons'
import { CogIcon } from 'lucide-react'
import { defineField, defineType } from 'sanity'
import { getLanguagePreview } from '../../structure/languages'

export default defineType({
  name: 'global',
  type: 'document',
  title: 'Ustawienia globalne',
  icon: CogIcon,
  fields: [
    defineField({
      name: 'language',
      type: 'string',
      readOnly: true,
      hidden: true,
    }),
    defineField({
      name: 'email',
      type: 'string',
      title: 'Email',
      group: 'contact',
      validation: (Rule) => Rule.required().email(),
    }),
    defineField({
      name: 'tel',
      type: 'string',
      title: 'Telefon (opcjonalny)',
      group: 'contact',
    }),
    defineField({
      name: 'openHours',
      type: 'object',
      title: 'Godziny otwarcia',
      group: 'contact',
      description: 'Wpisz czas w formacie HH:MM',
      fields: [
        defineField({
          name: 'from',
          type: 'string',
          title: 'Od',
          validation: (Rule) =>
            Rule.custom((value: any, context) => {
              if (!value) {
                return 'Czas jest wymagany'
              }
              if (value && !value.match(/^\d{2}:\d{2}$/)) {
                return 'Czas musi być w formacie HH:MM'
              }
              const [hh, mm] = value.split(':').map(Number)
              if (hh > 24 || mm > 60) {
                return 'Czas musi być w formacie HH:MM, gdzie HH <= 24 i MM <= 60'
              }
              return true
            }),
          fieldset: 'openHours',
        }),
        defineField({
          name: 'to',
          type: 'string',
          title: 'Do',
          validation: (Rule) =>
            Rule.custom((value: any, context) => {
              if (!value) {
                return 'Czas jest wymagany'
              }
              if (value && !value.match(/^\d{2}:\d{2}$/)) {
                return 'Czas musi być w formacie HH:MM'
              }
              const [hh, mm] = value.split(':').map(Number)
              if (hh > 24 || mm > 60) {
                return 'Czas musi być w formacie HH:MM, gdzie HH <= 24 i MM <= 60'
              }
              return true
            }),
          fieldset: 'openHours',
        }),
        defineField({
          name: 'closedWeekends',
          type: 'boolean',
          title: 'Zamknięte w weekendy',
          fieldset: 'openHours',
        }),
      ],
      fieldsets: [
        {
          name: 'openHours',
          title: 'Godziny otwarcia',
          options: {
            columns: 2,
          },
        },
      ],
    }),
    defineField({
      name: 'googleData',
      type: 'object',
      title: 'Dane z Google',
      group: 'analytics',
      fields: [
        defineField({
          name: 'rating',
          type: 'number',
          title: 'Ocena (1.0 - 5.0)',
          validation: (Rule) => Rule.required().min(1).max(5),
          fieldset: 'rating',
        }),
        defineField({
          name: 'ratingCount',
          type: 'number',
          title: 'Liczba opinii',
          validation: (Rule) => Rule.required(),
          fieldset: 'rating',
        }),
      ],
      fieldsets: [
        {
          name: 'rating',
          title: 'Ocena (opcjonalna)',
          options: { columns: 2 },
        },
      ],
    }),
    defineField({
      name: 'seo',
      type: 'object',
      title: 'Global SEO',
      group: 'seo',
      fields: [
        defineField({
          name: 'img',
          type: 'image',
          title: 'Social Share Image',
          description:
            'Social Share Image is visible when sharing website on social media. The dimensions of the image should be 1200x630px. For maximum compatibility, use JPG or PNG formats, as WebP may not be supported everywhere.',
          validation: (Rule) => Rule.required(),
        }),
      ],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'OrganizationSchema',
      type: 'object',
      title: 'Ustrukturyzowane dane organizacji',
      group: 'organization',
      description: (
        <>
          Dowiedz się więcej o{' '}
          <a
            href="https://developers.google.com/search/docs/appearance/structured-data/organization?hl=en"
            target="_blank"
            rel="noreferrer"
          >
            Ustrukturyzowanych danych organizacji
          </a>
        </>
      ),
      options: { collapsible: true },
      fields: [
        defineField({
          name: 'name',
          type: 'string',
          title: 'Nazwa',
          description: 'Wpisz nazwę swojej organizacji, tak jak chcesz, aby pojawiła się w wynikach wyszukiwania.',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'description',
          type: 'text',
          rows: 3,
          title: 'Opis',
          description: 'Krótki opis Twojej organizacji, który pojawi się w wynikach wyszukiwania.',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'address',
          type: 'object',
          title: 'Adres',
          description: 'Adres fizyczny Twojej organizacji, który będzie widoczny w wynikach wyszukiwania.',
          validation: (Rule) => Rule.required(),
          fields: [
            defineField({
              name: 'street',
              type: 'string',
              title: 'Ulica i numer',
              validation: (Rule) => Rule.required(),
              fieldset: 'addressDetails',
            }),
            defineField({
              name: 'city',
              type: 'string',
              title: 'Miasto',
              validation: (Rule) => Rule.required(),
              fieldset: 'addressDetails',
            }),
            defineField({
              name: 'postalCode',
              type: 'string',
              title: 'Kod pocztowy',
              validation: (Rule) => Rule.required().regex(/^\d{2}-\d{3}$/, 'Kod pocztowy musi być w formacie XX-XXX'),
              fieldset: 'addressDetails',
            }),
            defineField({
              name: 'country',
              type: 'string',
              title: 'Kraj',
              initialValue: 'Polska',
              validation: (Rule) => Rule.required(),
              fieldset: 'addressDetails',
            }),
          ],
          fieldsets: [
            {
              name: 'addressDetails',
              title: 'Szczegóły adresu',
              options: { columns: 2 },
            },
          ],
        }),
        defineField({
          name: 'businessDetails',
          type: 'object',
          title: 'Dane biznesowe (opcjonalne)',
          description:
            'Dodatkowe informacje biznesowe, które poprawiają widoczność Twojej organizacji w wynikach wyszukiwania i budują zaufanie z potencjalnymi klientami. Podanie tych danych może znacznie poprawić Twoją pozycję w SEO.',
          options: { collapsible: true },
          fields: [
            defineField({
              name: 'vatID',
              type: 'string',
              title: 'VAT ID (NIP)',
              validation: (Rule) => Rule.regex(/^[0-9]{10}$/, 'NIP musi składać się z 10 cyfr'),
            }),
            defineField({
              name: 'regon',
              type: 'string',
              title: 'REGON',
              validation: (Rule) => Rule.regex(/^[0-9]{9}$/, 'REGON musi składać się z 9 cyfr'),
            }),
            defineField({
              name: 'legalName',
              type: 'string',
              title: 'Pełna nazwa firmy',
            }),
            defineField({
              name: 'foundingDate',
              type: 'date',
              title: 'Data założenia firmy',
            }),
            defineField({
              name: 'founder',
              type: 'string',
              title: 'Założyciel (imię i nazwisko)',
            }),
            defineField({
              name: 'priceRange',
              type: 'number',
              title: 'Zakres cenowy',
              description: 'Wybierz zakres cenowy od 1 ($) do 4 ($$$$)',
              options: {
                list: [
                  { title: '$ - Budżetowy', value: 1 },
                  { title: '$$ - Średni', value: 2 },
                  { title: '$$$ - Premium', value: 3 },
                  { title: '$$$$ - Luksusowy', value: 4 },
                ],
              },
            }),
          ],
        }),
      ],
    }),
  ],
  groups: [
    {
      name: 'contact',
      title: 'Dane kontaktowe',
      icon: UsersIcon,
    },
    {
      name: 'analytics',
      title: 'Analityka',
      icon: BarChartIcon,
    },
    {
      name: 'seo',
      title: 'SEO',
      icon: SearchIcon,
    },
    {
      name: 'organization',
      title: 'Dane organizacyjne',
      icon: CaseIcon,
    },
  ],
  preview: {
    select: {
      language: 'language',
    },
    prepare: ({ language }) => {
      return getLanguagePreview({ title: 'Ustawienia globalne', languageId: language })
    },
  },
})
