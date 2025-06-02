import { defineField } from 'sanity'
import { InternalLinkableTypes } from '../../../structure/internal-linkable-types'
import { isValidUrl } from '../../../utils/is-valid-url'
import { toPlainText } from '../../../utils/to-plain-text'
import { PinIcon } from '@sanity/icons'

export default defineField({
  name: 'content',
  type: 'array',
  title: 'Treść',
  of: [
    defineField({
      type: 'block',
      name: 'block',
      styles: [
        { title: 'Normal', value: 'normal' },
        {
          title: 'Heading 2',
          value: 'h2',
          component: ({ children }) => <h2 style={{ fontSize: '1.875rem', fontWeight: 400, margin: 0 }}>{children}</h2>,
        },
        {
          title: 'Heading 3',
          value: 'h3',
          component: ({ children }) => <h3 style={{ fontSize: '1.5rem', fontWeight: 400, margin: 0 }}>{children}</h3>,
        },
      ],
      lists: [
        { title: 'Bullet', value: 'bullet' },
        { title: 'Numbered', value: 'number' },
      ],
      marks: {
        decorators: [
          {
            title: 'Strong',
            value: 'strong',
            component: ({ children }) => <strong style={{ fontWeight: 700 }}>{children}</strong>,
          },
          { title: 'Emphasis', value: 'em' },
        ],
        annotations: [],
      },
    }),
    defineField({
      name: 'ContactInfo',
      type: 'object',
      title: 'Dane kontaktowe',
      icon: PinIcon,
      fields: [
        defineField({
          name: 'tel',
          type: 'string',
          title: 'Numer telefonu',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'email',
          type: 'string',
          title: 'Adres email',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'physicalAddress',
          type: 'string',
          title: 'Adres fizyczny',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'googleMapsLink',
          type: 'string',
          title: 'Link do Map Google (opcjonalny)',
          description: 'Link prowadzący do mapy Google Fabryki Atrakcji',
          validation: (Rule) => [
            Rule.custom((value) => {
              if (!value) return 'URL jest wymagany'
              if (!value.startsWith('https://')) {
                return 'Link zewnętrzny musi zaczynać się od protokołu "https://"'
              }
              if (!isValidUrl(value)) return 'Nieprawidłowy URL'
              return true
            }),
          ],
        }),
      ],
      preview: {
        select: {
          email: 'email',
          tel: 'tel',
        },
        prepare: ({ email, tel }) => ({
          title: 'Dane kontaktowe',
          subtitle: [email ? `Email: ${email}` : '', tel ? `Tel: ${tel}` : ''].filter(Boolean).join('; '),
        }),
      },
      validation: (Rule) => Rule.required(),
    }),
  ],
  validation: (Rule) => Rule.required(),
})
