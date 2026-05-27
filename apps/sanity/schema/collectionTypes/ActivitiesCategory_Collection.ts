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
      name: 'activities',
      type: 'array',
      title: 'Integracje w tej kategorii',
      description:
        'Lista integracji przypisanych do tej kategorii. Kolejność na liście = kolejność wyświetlania na stronie.',
      validation: (Rule) =>
        Rule.custom((items) => {
          if (!items || items.length === 0) return true
          const refs = (items as Array<{ activity?: { _ref?: string } }>)
            .map((item) => item.activity?._ref)
            .filter(Boolean)
          if (new Set(refs).size !== refs.length) {
            return 'Ta sama integracja nie może pojawić się w kategorii więcej niż raz'
          }
          return true
        }),
      of: [
        {
          type: 'object',
          name: 'activityEntry',
          fields: [
            defineField({
              name: 'activity',
              type: 'reference',
              to: [{ type: 'Activities_Collection' }],
              title: 'Integracja',
              validation: (Rule) => Rule.required(),
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
            }),
            defineField({
              name: 'nameOverride',
              type: 'string',
              title: 'Nadpisana nazwa (opcjonalnie)',
              description:
                'Jeśli uzupełnione, ta nazwa będzie wyświetlana zamiast oryginalnej nazwy integracji w tej kategorii.',
            }),
            defineField({
              name: 'descriptionOverride',
              type: 'text',
              title: 'Nadpisany opis (opcjonalnie)',
              description:
                'Jeśli uzupełnione, ten opis będzie wyświetlany zamiast oryginalnego opisu integracji w tej kategorii.',
              rows: 3,
            }),
          ],
          preview: {
            select: {
              activityName: 'activity.name',
              nameOverride: 'nameOverride',
              mediaList: 'activity.mediaList',
              imageList: 'activity.imageList',
            },
            prepare: ({ activityName, nameOverride, mediaList, imageList }) => ({
              title: nameOverride || activityName || 'Wybierz integrację',
              subtitle: nameOverride ? `Oryginał: ${activityName}` : undefined,
              media: mediaList?.[0]?.image || imageList?.[0],
            }),
          },
        },
      ],
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
