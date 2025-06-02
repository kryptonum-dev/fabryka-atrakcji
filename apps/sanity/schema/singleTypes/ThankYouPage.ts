import { defineField, defineType } from 'sanity'
import { CheckIcon, Clock, Smile } from 'lucide-react'
import { getLanguagePreview } from '../../structure/languages'
import { defineSlugForDocument } from '../../utils/define-slug-for-document'
import { ComposeIcon, SearchIcon } from '@sanity/icons'
export default defineType({
  name: 'ThankYouPage',
  title: 'Strona podziękowania',
  type: 'document',
  icon: Smile,
  fields: [
    defineField({
      name: 'language',
      type: 'string',
      readOnly: true,
      hidden: true,
    }),
    ...defineSlugForDocument({
      slugs: {
        pl: '/pl/strona-podziekowania',
        en: '/en/thank-you-page',
      },
      group: 'content',
    }),
    defineField({
      name: 'image',
      type: 'image',
      title: 'Zdjęcie tła',
      group: 'content',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'heading',
      type: 'Heading',
      title: 'Nagłówek',
      group: 'content',
      validation: (Rule) => Rule.required().error('Nagłówek jest wymagany'),
    }),
    defineField({
      name: 'stepList',
      type: 'array',
      title: 'Lista kroków',
      description:
        'Lista kroków, które ułatwią klientowi zrozumienie, jak przebiega proces kompleksowej wyceny po wypełnieniu formularza.',
      group: 'content',
      validation: (Rule) =>
        Rule.required()
          .error('Lista kroków jest wymagana')
          .min(2)
          .error('Lista kroków musi zawierać co najmniej 2 kroki'),
      of: [
        defineField({
          name: 'step',
          type: 'object',
          title: 'Krok',
          validation: (Rule) => Rule.required(),
          fields: [
            defineField({
              name: 'checked',
              type: 'boolean',
              title: 'Czy odchaczony',
              description:
                'Jeśli jest odchaczony, krok zostanie oznaczony dla klienta jako już wykonany. (Przykładowo, wypełnienie formularza - to krok już wykonany)',
              initialValue: false,
              validation: (Rule) => Rule.required().error('Czy odchaczony jest wymagane'),
            }),
            defineField({
              name: 'text',
              type: 'string',
              title: 'Tekst',
              validation: (Rule) => Rule.required().error('Tekst jest wymagany'),
            }),
          ],
          preview: {
            select: {
              text: 'text',
              checked: 'checked',
            },
            prepare({ text, checked }) {
              return {
                title: text,
                media: checked ? CheckIcon : Clock,
              }
            },
          },
        }),
      ],
    }),
    defineField({
      name: 'socials',
      type: 'object',
      title: 'Referencje do mediów społecznościowych',
      group: 'content',
      validation: (Rule) => Rule.required(),
      fields: [
        defineField({
          name: 'heading',
          type: 'Heading',
          title: 'Nagłówek',
          validation: (Rule) => Rule.required().error('Nagłówek jest wymagany'),
        }),
        defineField({
          name: 'highlightedSocialMedia',
          type: 'array',
          title: 'Wyróżnione media społecznościowe',
          validation: (Rule) => Rule.required().length(2).error('Musisz wybrać dokładnie 2 media społecznościowe'),
          of: [
            {
              type: 'reference',
              to: { type: 'SocialMedia_Collection' },
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
      ],
    }),
    defineField({
      name: 'seo',
      type: 'seo',
      title: 'SEO',
      group: 'seo',
    }),
  ],
  groups: [
    {
      name: 'content',
      title: 'Treść',
      icon: ComposeIcon,
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
