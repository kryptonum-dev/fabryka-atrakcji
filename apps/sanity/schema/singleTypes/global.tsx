import { BarChartIcon, CaseIcon, CommentIcon, SearchIcon, UsersIcon } from '@sanity/icons'
import { CogIcon, User2Icon } from 'lucide-react'
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
      name: 'newsletterPdf',
      type: 'file',
      title: 'PDF dla Newslettera',
      group: 'forms',
      options: {
        accept: 'application/pdf',
      },
      description: 'Plik PDF do udostępnienia dla subskrybentów newslettera',
    }),
    defineField({
      name: 'newsletterPdfGroups',
      type: 'array',
      title: 'Grupy z dostępem do PDF',
      description:
        'Lista ID grup z MailerLite, które mają dostęp do pliku PDF. Pozostaw puste, aby umożliwić dostęp wszystkim.',
      of: [{ type: 'string' }],
      group: 'forms',
    }),
    defineField({
      name: 'analytics',
      title: 'Analytika',
      group: 'analytics',
      type: 'object',
      options: { collapsible: true, collapsed: false },
      description: 'Skonfiguruj analitykę strony. Pozostaw pola puste, aby wyłączyć śledzenie.',
      fields: [
        defineField({
          name: 'ga4Id',
          type: 'string',
          title: 'Google Analytics Measurement ID',
          description: 'Format: G-XXXXXXXXXX. Używane do śledzenia Google Analytics.',
          validation: (Rule) => Rule.required().error('Google Analytics Measurement ID jest wymagane'),
        }),
        defineField({
          name: 'googleAdsMeasurementId',
          type: 'string',
          title: 'Google Ads Conversion ID',
          description: 'Format: AW-XXXXXXXXX. Używane do śledzenia konwersji i remarketingu w Google Ads.',
          validation: (Rule) => Rule.required().error('Google Ads Conversion ID jest wymagane'),
        }),
        defineField({
          name: 'metaPixelId',
          type: 'string',
          title: 'ID Meta (Facebook) Pixel',
          description: 'Format: XXXXXXXXXX. Używane do śledzenia Meta Pixel i API konwersji.',
          validation: (Rule) =>
            Rule.custom((value) => {
              if (!value) return true
              if (!/^\d{15}$/.test(value)) {
                return 'Nieprawidłowy format ID Meta Pixel. Powinien to być 15-cyfrowy numer.'
              }
              return true
            }),
        }),
        defineField({
          name: 'metaConversionToken',
          type: 'string',
          title: 'Meta Conversion API Token',
          description: 'Secret token for server-side Meta Conversion API tracking.',
        }),
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
            }),
            defineField({
              name: 'city',
              type: 'string',
              title: 'Miasto',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'postalCode',
              type: 'string',
              title: 'Kod pocztowy',
              validation: (Rule) => Rule.required().regex(/^\d{2}-\d{3}$/, 'Kod pocztowy musi być w formacie XX-XXX'),
            }),
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
    defineField({
      name: 'inquiryFormDefaults',
      type: 'object',
      title: 'Domyślne ustawienia formularza zapytania',
      description: 'Ustawienia współdzielone przez formularze zapytań na stronach list i szczegółów',
      group: 'forms',
      options: { collapsible: true, collapsed: false },
      fields: [
        defineField({
          name: 'paragraph',
          type: 'PortableText',
          title: 'Domyślny paragraf',
          description: 'Paragraf wyświetlany pod nagłówkiem formularza (fallback dla szablonów)',
        }),
        defineField({
          name: 'state',
          type: 'formState',
          title: 'Stan formularza',
          description: 'Komunikaty sukcesu i błędu wyświetlane po wysłaniu formularza',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'socialProof',
          type: 'socialProof',
          title: 'Social Proof',
          description: 'Elementy budujące zaufanie współdzielone przez wszystkie formularze',
        }),
        defineField({
          name: 'formVisualImage',
          type: 'image',
          title: 'Domyślne zdjęcie sekcji formularza',
          description:
            'Domyślny obraz lewej kolumny w formularzu kontaktowym. Używany, gdy sekcja ContactForm nie ma ustawionego własnego obrazu.',
        }),
        defineField({
          name: 'responseBadge',
          type: 'object',
          title: 'Domyślny badge odpowiedzi',
          description: 'Domyślny tekst i ikona badge przy formularzu zapytania.',
          options: { collapsible: true, collapsed: true },
          fields: [
            defineField({
              name: 'text',
              type: 'string',
              title: 'Tekst badge',
            }),
            defineField({
              name: 'icon',
              type: 'image',
              title: 'Ikona badge',
              description: 'Mała ikona wyświetlana po lewej stronie tekstu badge.',
            }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'listingFilters',
      type: 'object',
      title: 'Ustawienia filtrów listingów',
      description: 'Konfiguracja opcji filtrów na listingach (integracje i hotele).',
      group: 'filters',
      options: { collapsible: true, collapsed: false },
      fields: [
        defineField({
          name: 'activityParticipantGroups',
          type: 'array',
          title: 'Grupy "Liczba osób" (integracje)',
          description:
            'Zakresy uczestników używane w filtrze "Liczba osób" na listingu integracji. Wymagane: 2-6 grup.',
          of: [
            defineField({
              name: 'participantGroup',
              type: 'object',
              title: 'Grupa',
              fields: [
                defineField({
                  name: 'label',
                  type: 'string',
                  title: 'Etykieta',
                  description: 'Np. "1-30", "31-80", "150+".',
                  validation: (Rule) => Rule.required(),
                }),
                defineField({
                  name: 'min',
                  type: 'number',
                  title: 'Min',
                  validation: (Rule) => Rule.required().min(1),
                }),
                defineField({
                  name: 'max',
                  type: 'number',
                  title: 'Max (opcjonalne)',
                  description: 'Pozostaw puste dla zakresu otwartego (np. 150+).',
                  validation: (Rule) => Rule.min(1),
                }),
              ],
              preview: {
                select: { label: 'label', min: 'min', max: 'max' },
                prepare: ({ label, min, max }) => ({
                  media: User2Icon,
                  title: label || `${min}${typeof max === 'number' ? `-${max}` : '+'}`,
                }),
              },
              validation: (Rule) =>
                Rule.custom((value) => {
                  const group = value as { min?: number; max?: number } | undefined
                  if (!group) return true
                  if (typeof group.max === 'number' && typeof group.min === 'number' && group.max < group.min) {
                    return 'Pole "max" musi być większe lub równe "min".'
                  }
                  return true
                }),
            }),
          ],
          validation: (Rule) => Rule.required().min(2).max(6),
        }),
        defineField({
          name: 'hotelLocationOptions',
          type: 'array',
          title: 'Opcje "Lokalizacja" (hotele)',
          description:
            'Lista lokalizacji wyświetlana w filtrze "Lokalizacja" na listingu hoteli. Wymagane: 2-6 pozycji.',
          of: [
            defineField({
              name: 'location',
              type: 'reference',
              to: [{ type: 'Locations_Collection' }],
              options: {
                disableNew: true,
                filter: ({ document }) => {
                  const language = (document as { language?: string })?.language
                  return {
                    filter: '!(_id in path("drafts.**")) && language == $lang',
                    params: { lang: language },
                  }
                },
              },
            }),
          ],
          validation: (Rule) => Rule.required().min(2).max(6),
        }),
      ],
    }),
    defineField({
      name: 'contactRecipients',
      type: 'array',
      title: 'Odbiorcy formularza kontaktowego',
      description:
        'Adresy email, na które będą wysyłane wiadomości z formularza kontaktowego. Przynajmniej jeden adres jest wymagany.',
      group: 'forms',
      of: [
        {
          type: 'string',
          validation: (Rule) =>
            Rule.custom((email: string | undefined) => {
              if (!email) return 'Email jest wymagany'
              const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i
              return emailRegex.test(email) ? true : 'Nieprawidłowy format adresu email'
            }),
        },
      ],
      validation: (Rule) => Rule.required().min(1),
    }),
  ],
  groups: [
    {
      name: 'contact',
      title: 'Dane kontaktowe',
      icon: UsersIcon,
    },
    {
      name: 'forms',
      title: 'Formularze',
      icon: CommentIcon,
    },
    {
      name: 'filters',
      title: 'Filtry listingów',
      icon: SearchIcon,
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
