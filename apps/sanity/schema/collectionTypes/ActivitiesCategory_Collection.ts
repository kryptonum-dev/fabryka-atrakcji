import { Handshake } from 'lucide-react'
import { defineField, defineType } from 'sanity'
import { orderRankField, orderRankOrdering } from '@sanity/orderable-document-list'
import { defineSlugForDocument } from '../../utils/define-slug-for-document'

const name = 'ActivitiesCategory_Collection'
const title = 'Kategorie integracji'
const icon = Handshake

export default defineType({
  name: name,
  type: 'document',
  title,
  icon,
  orderings: [orderRankOrdering],
  fields: [
    orderRankField({ type: name }),
    defineField({
      name: 'language',
      type: 'string',
      readOnly: true,
      hidden: true,
    }),
    defineField({
      name: 'name',
      type: 'string',
      title: 'Nazwa kategorii',
      description: 'Nazwa wyświetlana w breadcrumbs oraz w schematach dla Google',
      validation: (Rule) => Rule.required(),
    }),
    ...defineSlugForDocument({
      source: 'name',
      prefixes: {
        pl: '/pl/integracje/kategoria/',
        en: '/en/activities/category/',
      },
    }),
    defineField({
      name: 'heading',
      type: 'Heading',
      title: 'Nagłówek',
      description: 'Nagłówek wyświetlany na samej podstronie kategorii',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      type: 'object',
      title: 'Opis kategorii',
      validation: (Rule) => Rule.required().error('Opis jest wymagany'),
      fields: [
        defineField({
          name: 'long',
          type: 'text',
          title: 'Pełny opis',
          description: 'Pełny opis kategorii, wyświetlany na samej podstronie kategorii',
          rows: 8,
          validation: (Rule) => Rule.required().error('Pełny opis jest wymagany'),
        }),
        defineField({
          name: 'short',
          type: 'text',
          title: 'Krótki opis (opcjonalny)',
          description:
            'Krótki opis kategorii, wyświetlany podczas referowania kategorii i w listach kategorii (Maksymalnie 75 znaków). Jeśli nie zostanie wprowadzony, zastąpi go pełny opis, skrócony przez "..."',
          rows: 3,
          validation: (Rule) => Rule.max(75).error('Maksymalnie 75 znaków'),
        }),
      ],
    }),
    defineField({
      name: 'image',
      type: 'image',
      title: 'Zdjęcie kategorii',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'overwriteActivityPageComponents',
      type: 'boolean',
      title: 'Zastąp komponenty strony integracji',
      description:
        'Jeśli zaznaczone, komponenty kategorii zastąpią całkowicie komponenty ze strony integracji. Jeśli niezaznaczone, komponenty kategorii zostaną dodane na końcu po komponentach strony integracji.',
      initialValue: false,
    }),
    defineField({
      name: 'components',
      type: 'components',
      title: 'Komponenty podstrony (opcjonalne)',
      description: 'Komponenty dodatkowe dla tej kategorii. Ich zachowanie zależy od ustawienia powyżej.',
    }),
    defineField({
      name: 'formOverrides',
      type: 'object',
      title: 'Nadpisania formularza kontaktowego',
      description:
        'Opcjonalne nadpisania formularza kontaktowego dla tej kategorii (nagłówek, paragraf, obraz, komunikaty).',
      options: { collapsible: false, collapsed: false },
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
          description: 'Włącz, aby użyć niestandardowych komunikatów sukcesu/błędu dla tej kategorii.',
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
    }),
  ],
  preview: {
    select: {
      name: 'name',
      slug: 'slug.current',
    },
    prepare: ({ name, slug }) => ({
      title: name,
      subtitle: slug,
      icon,
    }),
  },
})
