import { Box, Text, Tooltip } from '@sanity/ui'
import { defineField, defineType } from 'sanity'
import { InternalLinkableTypes } from '../../structure/internal-linkable-types'
import { isValidUrl } from '../../utils/is-valid-url'

const name = 'cta'
const title = 'Wezwanie do działania (CTA)'
const icon = () => '👆'

export default defineType({
  name,
  type: 'object',
  title,
  icon,
  fields: [
    defineField({
      name: 'text',
      type: 'string',
      title: 'Tekst',
      description: 'Tekst, który będzie wyświetlany na przycisku.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'theme',
      type: 'string',
      title: 'Motyw',
      description: (
        <>
          <em>Główny</em> (główny przycisk) lub <em>Drugorzędny</em> (mniej ważny)
        </>
      ),
      options: {
        list: [
          { title: 'Główny', value: 'primary' },
          { title: 'Drugorzędny', value: 'secondary' },
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      validation: (Rule) => Rule.required(),
      fieldset: 'style',
    }),
    defineField({
      name: 'linkType',
      type: 'string',
      title: 'Typ',
      description: (
        <>
          <em>Zewnętrzny</em> (inne strony), <em>Wewnętrzny</em> (w obrębie Twojej strony) lub <em>Kotwica</em>{' '}
          (nawigacja na tej samej stronie)
        </>
      ),
      options: {
        list: [
          { title: 'Zewnętrzny', value: 'external' },
          { title: 'Wewnętrzny', value: 'internal' },
          { title: 'Kotwica', value: 'anchor' },
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      validation: (Rule) => Rule.required(),
      fieldset: 'style',
    }),
    defineField({
      name: 'external',
      type: 'string',
      title: 'URL',
      description: 'Podaj pełny adres URL. Upewnij się, że zaczyna się od "https://" i jest poprawnym adresem URL.',
      hidden: ({ parent }) => parent?.linkType !== 'external',
      validation: (Rule) => [
        Rule.custom((value, { parent }) => {
          const linkType = (parent as { linkType?: string })?.linkType
          if (linkType === 'external') {
            if (!value) return 'URL jest wymagany'
            if (!value.startsWith('https://')) {
              return 'Link zewnętrzny musi zaczynać się od protokołu "https://"'
            }
            if (!isValidUrl(value)) return 'Nieprawidłowy URL'
          }
          return true
        }),
      ],
    }),
    defineField({
      name: 'internal',
      type: 'reference',
      title: 'Wewnętrzne odniesienie do strony',
      description: 'Wybierz wewnętrzną stronę, do której chcesz linkować.',
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
      hidden: ({ parent }) => parent?.linkType !== 'internal',
      validation: (rule) => [
        rule.custom((value, { parent }) => {
          const linkType = (parent as { linkType?: string })?.linkType
          if (linkType === 'internal' && !value?._ref)
            return 'Musisz wybrać wewnętrzną stronę, do której chcesz linkować.'
          return true
        }),
      ],
    }),
    defineField({
      name: 'anchor',
      type: 'string',
      title: 'Kotwica',
      description: 'Link do sekcji na tej samej stronie (np. "#kontakt", "#oferta").',
      placeholder: '#kontakt',
      hidden: ({ parent }) => parent?.linkType !== 'anchor',
      validation: (Rule) => [
        Rule.custom((value, { parent }) => {
          const linkType = (parent as { linkType?: string })?.linkType
          if (linkType === 'anchor') {
            if (!value) return 'Kotwica jest wymagana'
            if (!value.startsWith('#')) return 'Kotwica musi zaczynać się od znaku #'
            if (!/^#[a-z0-9-_]+$/i.test(value)) {
              return 'Kotwica może zawierać tylko #, litery, cyfry, myślniki i podkreślenia'
            }
          }
          return true
        }),
      ],
    }),
  ],
  fieldsets: [
    {
      name: 'style',
      title: 'Styl',
      options: {
        columns: 1,
      },
    },
  ],
  preview: {
    select: {
      title: 'text',
      theme: 'theme',
      linkType: 'linkType',
      external: 'external',
      internal: 'internal.slug.current',
      anchor: 'anchor',
    },
    prepare({ title, theme, linkType, external, internal, anchor }) {
      let icon = '🔗'
      let linkLabel = 'Link wewnętrzny'
      let subtitle = internal

      if (linkType === 'external') {
        icon = '🌐'
        linkLabel = 'Link zewnętrzny'
        subtitle = external
      } else if (linkType === 'anchor') {
        icon = '⚓️'
        linkLabel = 'Kotwica'
        subtitle = anchor
      }

      return {
        title: `${title}`,
        subtitle,
        media: () => (
          <Tooltip
            content={
              <Box padding={1}>
                <Text size={1}>
                  {icon} {linkLabel}
                  &nbsp;|&nbsp;
                  {theme === 'primary' ? 'Przycisk główny' : 'Przycisk drugorzędny'}
                </Text>
              </Box>
            }
            placement="top"
            portal
          >
            <span>{icon}</span>
          </Tooltip>
        ),
      }
    },
  },
})
