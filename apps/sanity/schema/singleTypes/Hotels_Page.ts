import { Book, MessageSquare } from 'lucide-react'
import { defineType } from 'sanity'
import { defineSlugForDocument } from '../../utils/define-slug-for-document'
import { filterByDocumentLanguage } from '../../utils/filter-option'
import { defineField } from 'sanity'
import { CommentIcon, ComposeIcon, FilterIcon, SearchIcon } from '@sanity/icons'
import { getLanguagePreview } from '../../structure/languages'

const name = 'Hotels_Page'
const title = 'Strona Hoteli'

export default defineType({
  name,
  type: 'document',
  title,
  icon: Book,
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
        pl: '/pl/hotele',
        en: '/en/hotels',
      },
      group: 'content',
    }),
    defineField({
      name: 'heading',
      type: 'Heading',
      title: 'Nagłówek',
      description: 'Główny nagłówek strony',
      group: 'content',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'paragraph',
      type: 'Heading',
      title: 'Paragraf',
      group: 'content',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'checklist',
      type: 'array',
      title: 'Lista z punktami (opcjonalna)',
      description: 'Lista z punktami wyświetla się poniżej paragrafu oraz nagłówka',
      group: 'content',
      of: [{ type: 'string' }],
      validation: (Rule) => Rule.min(2).max(3).error('Musisz wybrać między 2 a 3 punktami'),
    }),
    defineField({
      name: 'noResults',
      type: 'object',
      title: 'Brak wyników wyszukiwania',
      group: 'content',
      fields: [
        defineField({
          name: 'components',
          type: 'components',
          title: 'Komponenty podstrony (brak wyników wyszukiwania)',
          description: 'Komponenty podstrony, które pojawią się w przypadku braku wyników wyszukiwania',
        }),
      ],
    }),
    defineField({
      name: 'components',
      type: 'components',
      title: 'Komponenty podstrony (opcjonalne)',
      group: 'content',
    }),
    defineField({
      name: 'filterHeadings',
      type: 'object',
      title: 'Nagłówki filtrów',
      group: 'filters',
      fields: [
        defineField({ name: 'location', type: 'string', title: 'Region' }),
        defineField({ name: 'distance', type: 'string', title: 'Odległość od miasta' }),
        defineField({ name: 'overnight', type: 'string', title: 'Liczba uczestników: nocleg' }),
        defineField({ name: 'conference', type: 'string', title: 'Liczba uczestników: konferencja' }),
        defineField({ name: 'banquet', type: 'string', title: 'Liczba uczestników: bankiet' }),
        defineField({ name: 'stars', type: 'string', title: 'Standard' }),
        defineField({ name: 'amenities', type: 'string', title: 'Udogodnienia' }),
        defineField({ name: 'surroundings', type: 'string', title: 'Otoczenie' }),
      ],
    }),
    defineField({
      name: 'participantRanges',
      type: 'array',
      title: 'Przedziały liczby uczestników',
      description:
        'Wspólne dla noclegu, konferencji i bankietu. Hotel pasuje, gdy jego maksymalna liczba osób sięga minimum przedziału.',
      group: 'filters',
      of: [
        defineField({
          name: 'option',
          type: 'object',
          fields: [
            defineField({
              name: 'min',
              type: 'number',
              title: 'Minimum',
              validation: (Rule) => Rule.required().min(1),
            }),
            defineField({
              name: 'max',
              type: 'number',
              title: 'Maksimum (opcjonalne)',
              validation: (Rule) =>
                Rule.custom((value, context) => {
                  const min = (context.parent as { min?: number })?.min
                  if (!value) return true
                  if (value < 1) return 'Maksimum musi być większe niż 0'
                  if (min && value <= min) return 'Maksimum musi być większe niż minimum'
                  return true
                }),
            }),
          ],
          preview: {
            select: {
              min: 'min',
              max: 'max',
            },
            prepare: ({ min, max }) => ({
              title: max ? `${min}–${max} osób` : `od ${min} osób`,
              subtitle: max ? `${min}–${max} osób` : `od ${min} osób`,
            }),
          },
        }),
      ],
    }),
    defineField({
      name: 'distanceRadii',
      type: 'array',
      title: 'Promienie w filtrze odległości (km)',
      group: 'filters',
      of: [{ type: 'number', validation: (Rule) => Rule.required().positive() }],
      validation: (Rule) => Rule.unique(),
    }),
    defineField({
      name: 'curatedAmenities',
      type: 'array',
      title: 'Udogodnienia w filtrze',
      description: 'Filtr pokazuje tylko te udogodnienia, w tej samej kolejności co tutaj.',
      group: 'filters',
      of: [
        {
          type: 'reference',
          to: { type: 'Amenities_Collection' },
          options: {
            disableNew: true,
            filter: filterByDocumentLanguage,
          },
        },
      ],
      validation: (Rule) => Rule.unique(),
    }),
    defineField({
      name: 'visibleAmenities',
      type: 'number',
      title: 'Liczba udogodnień widocznych od razu',
      description: 'Pozostałe udogodnienia są schowane pod przyciskiem „Pokaż więcej”.',
      group: 'filters',
      validation: (Rule) => Rule.integer().min(1),
    }),
    defineField({
      name: 'noCategoryLabel',
      type: 'string',
      title: 'Etykieta opcji bez kategoryzacji',
      description:
        'Opcja filtra Standard. Pojawi się, gdy pierwszy hotel dostanie oznaczenie „Bez oficjalnej kategoryzacji”.',
      group: 'filters',
    }),
    defineField({
      name: 'formHeading',
      type: 'Heading',
      title: 'Nagłówek formularza',
      description: 'Nagłówek formularza zapytania na dole strony listy hoteli',
      group: 'inquiry',
      fieldset: 'listingForm',
    }),
    defineField({
      name: 'formParagraph',
      type: 'PortableText',
      title: 'Paragraf formularza',
      description: 'Paragraf formularza zapytania na dole strony listy hoteli',
      group: 'inquiry',
      fieldset: 'listingForm',
    }),
    defineField({
      name: 'formVisualImage',
      type: 'image',
      title: 'Zdjęcie sekcji formularza',
      description: 'Opcjonalne zdjęcie formularza na stronie listy hoteli (nadpisuje globalne domyślne).',
      group: 'inquiry',
      fieldset: 'listingForm',
    }),
    defineField({
      name: 'overrideFormState',
      type: 'boolean',
      title: 'Nadpisz komunikaty formularza',
      description: 'Gdy włączone, użyj niestandardowych komunikatów sukcesu/błędu zamiast globalnych',
      initialValue: false,
      group: 'inquiry',
      fieldset: 'listingForm',
    }),
    defineField({
      name: 'formState',
      type: 'formState',
      title: 'Komunikaty formularza',
      description: 'Niestandardowe komunikaty sukcesu i błędu (wypełnij tylko gdy nadpisywanie jest włączone)',
      hidden: ({ document }) => !(document as any)?.overrideFormState,
      group: 'inquiry',
      fieldset: 'listingForm',
    }),
    defineField({
      name: 'detailFormDefaults',
      type: 'object',
      title: 'Domyślny formularz na stronie hotelu',
      description:
        'Domyślne ustawienia formularza kontaktowego na podstronach poszczególnych hoteli. Można nadpisać w każdym hotelu osobno.',
      group: 'inquiry',
      options: { collapsible: true, collapsed: false },
      fields: [
        defineField({
          name: 'heading',
          type: 'Heading',
          title: 'Nagłówek formularza',
          description: 'Domyślny nagłówek formularza na podstronie hotelu',
        }),
        defineField({
          name: 'paragraph',
          type: 'PortableText',
          title: 'Paragraf formularza',
          description: 'Domyślny paragraf formularza na podstronie hotelu',
        }),
        defineField({
          name: 'formVisualImage',
          type: 'image',
          title: 'Zdjęcie sekcji formularza',
          description: 'Domyślne zdjęcie formularza na podstronie hotelu.',
        }),
        defineField({
          name: 'overrideFormState',
          type: 'boolean',
          title: 'Nadpisz komunikaty formularza',
          description: 'Gdy włączone, użyj niestandardowych komunikatów sukcesu/błędu zamiast globalnych.',
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
      name: 'escapeHatchHeading',
      type: 'string',
      title: 'Tekst podpowiedzi',
      description:
        'Tekst podpowiedzi wyświetlanej pod checklistą, np. "Nie wiesz jaki hotel wybrać?"',
      group: 'inquiry',
      fieldset: 'escapeHatch',
    }),
    defineField({
      name: 'escapeHatchText',
      type: 'string',
      title: 'Tekst linku CTA',
      description:
        'Tekst linku kierującego do formularza, np. "Wyślij zapytanie — zaproponujemy sprawdzone opcje."',
      group: 'inquiry',
      fieldset: 'escapeHatch',
    }),
    defineField({
      name: 'seo',
      type: 'seo',
      title: 'SEO',
      group: 'seo',
    }),
  ],
  fieldsets: [
    {
      name: 'listingForm',
      title: 'Formularz na stronie listy hoteli',
      options: { collapsible: true, collapsed: false },
    },
    {
      name: 'escapeHatch',
      title: 'Podpowiedź "Escape Hatch"',
      options: { collapsible: true, collapsed: false },
    },
  ],
  groups: [
    {
      name: 'content',
      title: 'Treść',
      icon: ComposeIcon,
    },
    {
      name: 'filters',
      title: 'Filtry',
      icon: FilterIcon,
    },
    {
      name: 'inquiry',
      title: 'Formularz zapytania',
      icon: CommentIcon,
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
