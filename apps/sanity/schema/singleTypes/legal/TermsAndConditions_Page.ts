import { defineField, defineType } from 'sanity'
import { defineSlugForDocument } from '../../../utils/define-slug-for-document'
import PortableText from './portable-text'
import { getLanguagePreview } from '../../../structure/languages'
import { Book, FileArchive } from 'lucide-react'
import { ComposeIcon } from '@sanity/icons'
import { SearchIcon } from '@sanity/icons'

export default defineType({
  name: 'TermsAndConditions_Page',
  type: 'document',
  title: 'Regulamin',
  icon: FileArchive,
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
        pl: '/pl/regulamin',
        en: '/en/terms-and-conditions',
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
    PortableText,
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
