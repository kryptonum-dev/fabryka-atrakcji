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
}: DefineSlugConfig) => [
  ...(source
    ? []
    : [
        defineField({
          name: 'name',
          type: 'string',
          title: 'Nazwa',
          description: 'Nazwa dokumentu, używana do wyświetlania w ścieżce nawigacyjnej.',
          validation: (Rule) => Rule.required(),
        }),
      ]),
  defineField({
    name: 'slug',
    type: 'slug',
    title: 'Slug',
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
          if (slugs) return slugs[language]
          const currentPrefix = prefixes?.[language] ?? ''
          return `${currentPrefix}${slugify(slug)}`
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
            if (value?.current !== slugs[language]) {
              return `Slug musi być dokładnie "${slugs[language]}"`
            }
            return true
          }

          if (prefixes && value?.current) {
            const contentAfterPrefix = value.current.replace(currentPrefix, '').trim()
            if (!contentAfterPrefix || contentAfterPrefix === '/') {
              return `Slug musi zawierać treść po ${currentPrefix}. Sam ukośnik nie wystarczy.`
            }
          }

          if (
            value?.current &&
            value.current.replace(currentPrefix, '') !== slugify(value.current.replace(currentPrefix, ''))
          ) {
            return 'W slugu jest literówka. Pamiętaj, że slug może zawierać tylko małe litery, cyfry i myślniki.'
          }
          return true
        }).required()),
  }),
]
