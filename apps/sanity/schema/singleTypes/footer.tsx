import { ArrowBigLeftDashIcon, PanelBottom } from 'lucide-react'
import { defineField, defineType } from 'sanity'
import { InternalLinkableTypes } from '../../structure/internal-linkable-types'
import { getLanguagePreview } from '../../structure/languages'

export default defineType({
  name: 'footer',
  type: 'document',
  title: 'Stopka',
  icon: PanelBottom,
  fields: [
    defineField({
      name: 'language',
      type: 'string',
      readOnly: true,
      hidden: true,
    }),
    defineField({
      name: 'heading',
      type: 'Heading',
      title: 'Nagłówek',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'cta',
      type: 'cta',
      title: 'Przycisk CTA',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'highlightedActivitiesCategories',
      type: 'array',
      title: 'Wyróżnione kategorie integracji',
      description: 'Kategorie są wyświetlane w stopce w pierwszej kolumnie',
      validation: (Rule) =>
        Rule.required().min(3).max(8).error('Musisz wybrać co najmniej 3 kategorie integracji i maksymalnie 8'),
      of: [
        {
          type: 'reference',
          to: { type: 'ActivitiesCategory_Collection' },
          options: {
            disableNew: true,
            filter: ({ parent, document }) => {
              const language = (document as { language?: string })?.language
              const selectedIds =
                (parent as { _ref?: string }[])?.filter((item) => item._ref).map((item) => item._ref) || []
              return {
                filter: '!(_id in path("drafts.**")) && language == $lang && !(_id in $selectedIds)',
                params: { selectedIds, lang: language },
              }
            },
          },
        },
      ],
    }),
    defineField({
      name: 'otherLinks',
      type: 'array',
      title: 'Pozostałe linki',
      description: 'Pozostałe linki są wyświetlane w stopce w drugiej kolumnie',
      validation: (Rule) => Rule.required().min(2).max(6).error('Musisz wybrać co najmniej 2 linki i maksymalnie 6'),
      of: [
        {
          type: 'reference',
          to: InternalLinkableTypes,
          options: {
            disableNew: true,
            filter: ({ parent, document }) => {
              const language = (document as { language?: string })?.language
              const selectedIds =
                (parent as { _ref?: string }[])?.filter((item) => item._ref).map((item) => item._ref) || []
              return {
                filter: '!(_id in path("drafts.**")) && language == $lang && !(_id in $selectedIds)',
                params: { selectedIds, lang: language },
              }
            },
          },
        },
      ],
    }),
    defineField({
      name: 'restOfInformation',
      type: 'object',
      title: 'Pozostałe informacje  ',
      description: 'Pozostałe informacje są wyświetlane w stopce w trzeciej kolumnie',
      fields: [
        defineField({
          name: 'phoneHeading',
          type: 'string',
          title: 'Nagłówek telefonu',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'addressHeading',
          type: 'string',
          title: 'Nagłówek adresu',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'contactForm',
          type: 'object',
          title: 'Formularz kontaktowy',
          fields: [
            defineField({
              name: 'heading',
              type: 'string',
              title: 'Nagłówek',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'link',
              type: 'reference',
              title: 'Link do formularza',
              to: InternalLinkableTypes,
              options: {
                disableNew: true,
                filter: ({ document }) => {
                  const language = (document as { language?: string })?.language
                  return {
                    filter: 'defined(slug.current) && language == $lang',
                    params: { lang: language },
                  }
                },
              },
            }),
          ],
        }),
        defineField({
          name: 'socialMedia',
          type: 'object',
          title: 'Media społecznościowe',
          fields: [
            defineField({
              name: 'heading',
              type: 'string',
              title: 'Nagłówek',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'highlightedSocialMedia',
              type: 'array',
              title: 'Wyróżnione media społecznościowe',
              validation: (Rule) =>
                Rule.required().max(2).error('Musisz wybrać co najmniej 1 media społecznościowe i maksymalnie 2'),
              of: [
                {
                  type: 'reference',
                  to: { type: 'SocialMedia_Collection' },
                  options: {
                    disableNew: true,
                    filter: ({ parent, document }) => {
                      const selectedIds =
                        (parent as { _ref?: string }[])?.filter((item) => item._ref).map((item) => item._ref) || []
                      return {
                        filter: '!(_id in path("drafts.**"))',
                        params: { selectedIds },
                      }
                    },
                  },
                },
              ],
            }),
          ],
        }),
      ],
    }),
  ],
  preview: {
    select: {
      language: 'language',
    },
    prepare: ({ language }) => {
      return getLanguagePreview({ title: 'Stopka', languageId: language })
    },
  },
})
