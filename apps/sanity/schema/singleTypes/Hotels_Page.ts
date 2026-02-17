import { Book, MessageSquare } from 'lucide-react'
import { defineType } from 'sanity'
import { defineSlugForDocument } from '../../utils/define-slug-for-document'
import { defineField } from 'sanity'
import { CommentIcon, ComposeIcon, SearchIcon } from '@sanity/icons'
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
        'Domyślny nagłówek i paragraf formularza kontaktowego na podstronach poszczególnych hoteli. Można nadpisać w każdym hotelu osobno.',
      group: 'inquiry',
      options: { collapsible: true, collapsed: false },
      validation: (Rule) => Rule.required().error('Domyślny formularz na stronie hotelu jest wymagany'),
      fields: [
        defineField({
          name: 'heading',
          type: 'Heading',
          title: 'Nagłówek formularza',
          description: 'Domyślny nagłówek formularza na podstronie hotelu',
          validation: (Rule) => Rule.required().error('Nagłówek jest wymagany'),
        }),
        defineField({
          name: 'paragraph',
          type: 'PortableText',
          title: 'Paragraf formularza',
          description: 'Domyślny paragraf formularza na podstronie hotelu',
        }),
      ],
    }),
    defineField({
      name: 'escapeHatchHeading',
      type: 'Heading',
      title: 'Nagłówek "Escape Hatch"',
      description: 'Nagłówek sekcji "Nie wiesz jaki hotel wybrać?" wyświetlanej nad listą hoteli',
      group: 'inquiry',
      fieldset: 'escapeHatch',
    }),
    defineField({
      name: 'escapeHatchText',
      type: 'PortableText',
      title: 'Tekst "Escape Hatch"',
      description: 'Tekst sekcji "Nie wiesz jaki hotel wybrać?" wyświetlanej nad listą hoteli',
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
      title: 'Sekcja "Escape Hatch"',
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
