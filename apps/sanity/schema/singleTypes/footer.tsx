import { defineField, defineType } from 'sanity'
import { getLanguagePreview } from '../../structure/languages'
import { PanelBottom } from 'lucide-react'

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
      name: 'name',
      type: 'string',
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
