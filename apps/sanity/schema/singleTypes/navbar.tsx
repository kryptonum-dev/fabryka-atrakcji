import { PanelTop } from 'lucide-react'
import { defineField, defineType } from 'sanity'
import { getLanguagePreview } from '../../structure/languages'

export default defineType({
  name: 'navbar',
  type: 'document',
  title: 'Nawigacja',
  icon: PanelTop,
  fields: [
    defineField({
      name: 'language',
      type: 'string',
      readOnly: true,
      hidden: true,
    }),
    defineField({
      name: 'highlightedActivities',
      type: 'array',
      title: 'Wyróżnione kategorie integracji',
      validation: (Rule) =>
        Rule.required().min(2).max(4).error('Musisz wybrać co najmniej 2 kategorie integracji i maksymalnie 4'),
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
                filter: '!(_id in path("drafts.**")) && language == $lang && !(_id in $selectedIds)',
                params: { selectedIds, lang: language },
              }
            },
          },
        },
      ],
    }),
    defineField({
      name: 'highlightedCaseStudies',
      type: 'array',
      title: 'Wyróżnione realizacje',
      validation: (Rule) =>
        Rule.required().min(2).max(4).error('Musisz wybrać co najmniej 2 realizacje i maksymalnie 4'),
      of: [
        {
          type: 'reference',
          to: [{ type: 'CaseStudy_Collection' }],
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
  ],

  preview: {
    select: {
      language: 'language',
    },
    prepare: ({ language }) => {
      return getLanguagePreview({ title: 'Nawigacja', languageId: language })
    },
  },
})
