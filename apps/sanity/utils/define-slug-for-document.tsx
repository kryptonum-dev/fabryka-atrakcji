import { defineField, type SlugDefinition, type SlugOptions } from 'sanity'
import { LANGUAGES } from '../structure/languages'
import { isUniqueSlug } from './is-unique-slug'
import { PathnameFieldComponent } from './slug-field-component'
import { slugify } from './slugify'
const isProduction = process.env.NODE_ENV === 'production'

type LanguageValues = {
  [key in (typeof LANGUAGES)[number]['id']]: string
}

type DefineSlugConfig = {
  source?: string
  group?: string
} & (
  | { prefixes: LanguageValues; slugs?: never; slugify?: never; validate?: never }
  | { slugs: LanguageValues; prefixes?: never; slugify?: never; validate?: never }
  | {
      slugify: SlugOptions['slugify']
      validate?: SlugDefinition['validation']
      prefixes?: never
      slugs?: never
    }
)

export const defineSlugForDocument = ({
  source,
  prefixes,
  slugs,
  slugify: customSlugify,
  validate: customValidate,
  group,
}: DefineSlugConfig) => [
  ...(source
    ? []
    : [
        defineField({
          name: 'name',
          type: 'string',
          title: 'Nazwa',
          ...(group ? { group } : {}),
          description: 'Nazwa dokumentu, używana do wyświetlania w ścieżce nawigacyjnej.',
          validation: (Rule) => Rule.required(),
        }),
      ]),
  defineField({
    name: 'slug',
    type: 'slug',
    title: 'Slug',
    ...(group ? { group } : {}),
    components: {
      field: (props) => <PathnameFieldComponent {...props} prefixes={prefixes} />,
    },
    description: (
      <span style={{ color: 'var(--card-fg-color)' }}>
        Slug to unikalny identyfikator dokumentu, używany do SEO i linków.
        {isProduction && slugs && (
          <>
            {' '}
            <strong>
              <em>Ten slug nie może być zmieniony.</em>
            </strong>
          </>
        )}
      </span>
    ),
    readOnly: isProduction && !!slugs,
    options: {
      source: source || 'name',
      slugify:
        customSlugify ||
        ((slug, _, context) => {
          const language = (context.parent as { language: (typeof LANGUAGES)[number]['id'] })?.language ?? 'pl'
          if (slugs) {
            const slugValue = slugs[language]
            // Ensure trailing slash for predefined slugs (except root)
            return slugValue === '/' ? slugValue : `${slugValue.replace(/\/$/, '')}/`
          }
          const currentPrefix = prefixes?.[language] ?? ''
          const slugified = `${currentPrefix}${slugify(slug)}`
          // Ensure trailing slash for generated slugs (except root)
          return slugified === '/' ? slugified : `${slugified.replace(/\/$/, '')}/`
        }),
      isUnique: isUniqueSlug,
    },
    validation:
      customValidate ||
      ((Rule) =>
        Rule.custom(async (value, context) => {
          const language = (context.parent as { language: (typeof LANGUAGES)[number]['id'] })?.language ?? 'pl'
          const currentPrefix = prefixes?.[language] ?? ''

          if (currentPrefix && value?.current && !value.current.startsWith(currentPrefix)) {
            return `Slug powinien zaczynać się od ${currentPrefix}`
          }

          if (slugs) {
            const expectedSlug = slugs[language]
            const expectedWithTrailingSlash =
              expectedSlug === '/' ? expectedSlug : `${expectedSlug.replace(/\/$/, '')}/`
            if (value?.current !== expectedWithTrailingSlash) {
              return `Slug musi być dokładnie "${expectedWithTrailingSlash}"`
            }
            return true
          }

          if (prefixes && value?.current) {
            const contentAfterPrefix = value.current.replace(currentPrefix, '').trim()
            if (!contentAfterPrefix || contentAfterPrefix === '/') {
              return `Slug musi zawierać treść po ${currentPrefix}. Sam ukośnik nie wystarczy.`
            }
          }

          // Check for trailing slash requirement (except for root)
          if (value?.current && value.current !== '/' && !value.current.endsWith('/')) {
            return 'Slug musi kończyć się ukośnikiem (/)'
          }

          if (
            value?.current &&
            value.current.replace(currentPrefix, '') !==
              slugify(value.current.replace(currentPrefix, '').replace(/\/$/, '')) + (value.current === '/' ? '' : '/')
          ) {
            return 'W slugu jest literówka. Pamiętaj, że slug może zawierać tylko małe litery, cyfry i myślniki, oraz musi kończyć się ukośnikiem.'
          }
          return true
        }).required()),
  }),
]
