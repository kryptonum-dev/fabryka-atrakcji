import { Book } from 'lucide-react'
import { defineType } from 'sanity'
import { defineSlugForDocument } from '../../utils/define-slug-for-document'
import { defineField } from 'sanity'
import { CommentIcon, ComposeIcon, SearchIcon } from '@sanity/icons'
import { getLanguagePreview } from '../../structure/languages'

const name = 'Activities_Page'
const title = 'Strona Integracji'

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
        pl: '/pl/integracje',
        en: '/en/activities',
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
      name: 'activitiesCarousel',
      type: 'ActivitiesCarousel',
      title: 'Wyróżnione integracje',
      description: 'Wyróżnione integracje wyświetlają się pod listą kategorii integracji',
      group: 'content',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'components',
      type: 'components',
      title: 'Komponenty podstrony (opcjonalne)',
      group: 'content',
    }),
    defineField({
      name: 'noResults',
      type: 'object',
      title: 'Brak wyników wyszukiwania',
      group: 'content',
      fields: [
        defineField({
          name: 'heading',
          type: 'Heading',
          title: 'Nagłówek',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'buttonText',
          type: 'string',
          title: 'Tekst przycisku',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'highlightedCategories',
          type: 'array',
          title: 'Wyróżnione kategorie integracji',
          validation: (Rule) => Rule.required().length(4).error('Musisz wybrać dokładnie 4 kategorie integracji'),
          of: [
            {
              type: 'reference',
              to: [{ type: 'ActivitiesCategory_Collection' }],
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
        }),
        defineField({
          name: 'components',
          type: 'components',
          title: 'Komponenty podstrony (brak wyników wyszukiwania)',
          description: 'Komponenty podstrony, które pojawią się w przypadku braku wyników wyszukiwania',
        }),
      ],
    }),
    defineField({
      name: 'formHeading',
      type: 'Heading',
      title: 'Nagłówek formularza',
      description: 'Nagłówek formularza zapytania na dole strony listy integracji',
      group: 'inquiry',
      fieldset: 'listingForm',
    }),
    defineField({
      name: 'formParagraph',
      type: 'PortableText',
      title: 'Paragraf formularza',
      description: 'Paragraf formularza zapytania na dole strony listy integracji',
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
      title: 'Domyślny formularz na stronie integracji',
      description:
        'Domyślny nagłówek i paragraf formularza kontaktowego na podstronach poszczególnych integracji. Można nadpisać w każdej integracji osobno.',
      group: 'inquiry',
      options: { collapsible: true, collapsed: false },
      validation: (Rule) => Rule.required().error('Domyślny formularz na stronie integracji jest wymagany'),
      fields: [
        defineField({
          name: 'heading',
          type: 'Heading',
          title: 'Nagłówek formularza',
          description: 'Domyślny nagłówek formularza na podstronie integracji',
          validation: (Rule) => Rule.required().error('Nagłówek jest wymagany'),
        }),
        defineField({
          name: 'paragraph',
          type: 'PortableText',
          title: 'Paragraf formularza',
          description: 'Domyślny paragraf formularza na podstronie integracji',
        }),
      ],
    }),
    defineField({
      name: 'escapeHatchHeading',
      type: 'string',
      title: 'Tekst podpowiedzi',
      description:
        'Tekst podpowiedzi wyświetlanej pod opisem kategorii, np. "Nie wiesz od czego zacząć?"',
      group: 'inquiry',
      fieldset: 'escapeHatch',
    }),
    defineField({
      name: 'escapeHatchText',
      type: 'string',
      title: 'Tekst linku CTA',
      description:
        'Tekst linku kierującego do formularza, np. "Wyślij zapytanie — dobierzemy najlepszą integrację."',
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
      title: 'Formularz na stronie listy integracji',
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
