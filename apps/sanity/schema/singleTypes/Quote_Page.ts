import { defineField, defineType } from 'sanity'
import { Receipt } from 'lucide-react'
import { getLanguagePreview } from '../../structure/languages'
import { defineSlugForDocument } from '../../utils/define-slug-for-document'
import { ComposeIcon, SearchIcon } from '@sanity/icons'
export default defineType({
  name: 'Quote_Page',
  title: 'Strona wyceny',
  type: 'document',
  icon: Receipt,
  fields: [
    defineField({
      name: 'language',
      type: 'string',
      readOnly: true,
      hidden: true,
    }),
    ...defineSlugForDocument({
      slugs: {
        pl: '/pl/wycena',
        en: '/en/quote',
      },
      group: 'content',
    }),
    defineField({
      name: 'additionalInfo',
      type: 'Heading',
      title: 'Informacje dodatkowe',
      group: 'content',
    }),
    defineField({
      name: 'seo',
      type: 'seo',
      title: 'SEO',
      group: 'seo',
    }),

    // Contact form fields will be added later as mentioned
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
