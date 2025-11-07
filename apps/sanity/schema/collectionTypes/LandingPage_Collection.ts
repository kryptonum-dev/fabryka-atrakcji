import { Rocket } from 'lucide-react'
import { defineField, defineType } from 'sanity'
import { defineSlugForDocument } from '../../utils/define-slug-for-document'
import { ComposeIcon, SearchIcon } from '@sanity/icons'

const title = 'Strony lądowania'
const icon = Rocket

export default defineType({
  name: 'LandingPage_Collection',
  type: 'document',
  title,
  icon,
  options: { documentPreview: true },
  fields: [
    defineField({
      name: 'language',
      type: 'string',
      readOnly: true,
      hidden: true,
    }),
    ...defineSlugForDocument({
      prefixes: {
        pl: '/pl/',
        en: '/en/',
      },
      group: 'content',
    }),
    defineField({
      name: 'navigationLinks',
      type: 'array',
      title: 'Linki nawigacyjne',
      description: 'Linki wyświetlane w nagłówku strony lądowania (maksymalnie 6 dla optymalnego UX)',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'name',
              type: 'string',
              title: 'Tekst linku',
              validation: (Rule: any) => Rule.required().error('Tekst linku jest wymagany'),
            },
            {
              name: 'href',
              type: 'string',
              title: 'URL',
              description: 'Pełny adres URL (np. /pl/kontakt/, https://example.com lub #kontakt)',
              validation: (Rule: any) => Rule.required().error('URL jest wymagany'),
            },
          ],
          preview: {
            select: {
              title: 'name',
              subtitle: 'href',
            },
          },
        },
      ],
      validation: (Rule: any) => [
        Rule.required().min(1).error('Wymagany jest co najmniej jeden link nawigacyjny'),
        Rule.max(6).warning('Dla optymalnego UX, ogranicz nawigację do 6 elementów'),
      ],
      group: 'content',
    }),
    defineField({
      name: 'cta',
      type: 'cta',
      title: 'Wezwanie do działania',
      description: 'Główny przycisk CTA wyświetlany w nagłówku',
      group: 'content',
      validation: (Rule: any) => Rule.required().error('Wezwanie do działania jest wymagane'),
    }),
    defineField({
      name: 'components',
      type: 'components',
      title: 'Komponenty strony',
      group: 'content',
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
      slug: 'slug.current',
    },
    prepare: ({ title, slug }) => ({
      title: title || slug || 'Bez tytułu',
      subtitle: slug || 'Brak slugu',
      icon,
    }),
  },
})
