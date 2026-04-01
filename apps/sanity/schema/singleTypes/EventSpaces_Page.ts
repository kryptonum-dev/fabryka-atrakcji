import { Book } from 'lucide-react'
import { defineType } from 'sanity'
import { defineSlugForDocument } from '../../utils/define-slug-for-document'
import { defineField } from 'sanity'
import { CommentIcon, ComposeIcon, SearchIcon } from '@sanity/icons'
import { getLanguagePreview } from '../../structure/languages'

const name = 'EventSpaces_Page'
const title = 'Strona Przestrzeni Eventowych'

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
        pl: '/pl/przestrzenie-eventowe',
        en: '/en/event-spaces',
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
      name: 'capacityFilterOptions',
      type: 'array',
      title: 'Opcje filtra liczby osób',
      description: 'Zarządzaj dostępnymi przedziałami liczby osób wyświetlanymi w filtrze.',
      group: 'content',
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
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'areaFilterOptions',
      type: 'array',
      title: 'Opcje filtra powierzchni (m2)',
      description: 'Zarządzaj dostępnymi przedziałami powierzchni wyświetlanymi w filtrze.',
      group: 'content',
      of: [
        defineField({
          name: 'option',
          type: 'object',
          fields: [
            defineField({
              name: 'min',
              type: 'number',
              title: 'Minimum (m2)',
              validation: (Rule) => Rule.required().min(1),
            }),
            defineField({
              name: 'max',
              type: 'number',
              title: 'Maksimum (m2, opcjonalne)',
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
              title: max ? `${min}–${max} m2` : `${min}+ m2`,
              subtitle: max ? `${min}–${max} m2` : `${min}+ m2`,
            }),
          },
        }),
      ],
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'formHeading',
      type: 'Heading',
      title: 'Nagłówek formularza',
      description: 'Nagłówek formularza zapytania na dole strony listy przestrzeni eventowych',
      group: 'inquiry',
      fieldset: 'listingForm',
    }),
    defineField({
      name: 'formParagraph',
      type: 'PortableText',
      title: 'Paragraf formularza',
      description: 'Paragraf formularza zapytania na dole strony listy przestrzeni eventowych',
      group: 'inquiry',
      fieldset: 'listingForm',
    }),
    defineField({
      name: 'formVisualImage',
      type: 'image',
      title: 'Zdjęcie sekcji formularza',
      description: 'Opcjonalne zdjęcie formularza na stronie listy przestrzeni eventowych (nadpisuje globalne domyślne).',
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
      hidden: ({ document }) => !(document as { overrideFormState?: boolean })?.overrideFormState,
      group: 'inquiry',
      fieldset: 'listingForm',
    }),
    defineField({
      name: 'detailFormDefaults',
      type: 'object',
      title: 'Domyślny formularz na stronie przestrzeni eventowej',
      description:
        'Domyślne ustawienia formularza kontaktowego na podstronach poszczególnych przestrzeni eventowych. Można nadpisać w każdej przestrzeni osobno.',
      group: 'inquiry',
      options: { collapsible: true, collapsed: false },
      fields: [
        defineField({
          name: 'heading',
          type: 'Heading',
          title: 'Nagłówek formularza',
          description: 'Domyślny nagłówek formularza na podstronie przestrzeni eventowej',
        }),
        defineField({
          name: 'paragraph',
          type: 'PortableText',
          title: 'Paragraf formularza',
          description: 'Domyślny paragraf formularza na podstronie przestrzeni eventowej',
        }),
        defineField({
          name: 'formVisualImage',
          type: 'image',
          title: 'Zdjęcie sekcji formularza',
          description: 'Domyślne zdjęcie formularza na podstronie przestrzeni eventowej.',
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
        'Tekst podpowiedzi wyświetlanej pod checklistą, np. "Nie wiesz jaką przestrzeń wybrać?"',
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
      title: 'Formularz na stronie listy przestrzeni eventowych',
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
