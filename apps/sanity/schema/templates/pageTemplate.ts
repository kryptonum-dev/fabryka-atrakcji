import type { LucideIcon } from 'lucide-react'
import { defineField, defineType } from 'sanity'
import { getLanguagePreview } from '../../structure/languages'
import { defineSlugForDocument } from '../../utils/define-slug-for-document'

type PageTemplateProps = {
  name: string
  title: string
  icon: LucideIcon
  slugs?: Record<string, string>
  isInternationalized?: boolean
}

export const createPageSchema = ({
  name,
  title,
  icon,
  slugs = {
    pl: '/pl',
    en: '/en',
  },
  isInternationalized = true,
}: PageTemplateProps) => {
  return defineType({
    name,
    type: 'document',
    title,
    icon,
    options: { documentPreview: true },
    fields: [
      ...(isInternationalized
        ? [
            defineField({
              name: 'language',
              type: 'string',
              readOnly: true,
              hidden: true,
            }),
          ]
        : []),
      ...defineSlugForDocument({
        slugs,
      }),
      defineField({
        name: 'components',
        type: 'components',
        title: 'Komponenty podstrony',
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
        name: 'seo',
        title: 'SEO',
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
}
