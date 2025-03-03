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
          <em>Zewnętrzny</em> (inne strony) lub <em>Wewnętrzny</em> (w obrębie Twojej strony)
        </>
      ),
      options: {
        list: [
          { title: 'Zewnętrzny', value: 'external' },
          { title: 'Wewnętrzny', value: 'internal' },
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
  ],
  fieldsets: [
    {
      name: 'style',
      title: 'Styl',
      options: {
        columns: 2,
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
    },
    prepare({ title, theme, linkType, external, internal }) {
      const isExternal = linkType === 'external'
      const icon = isExternal ? '🌐' : '🔗'
      return {
        title: `${title}`,
        subtitle: isExternal ? external : internal,
        media: () => (
          <Tooltip
            content={
              <Box padding={1}>
                <Text size={1}>
                  {icon} {isExternal ? 'Link zewnętrzny' : 'Link wewnętrzny'}
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
