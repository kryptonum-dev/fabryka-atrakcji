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
      name: 'quoteRecipients',
      type: 'array',
      title: 'Odbiorcy wyceny',
      description: 'Adresy email, na które będą wysyłane wyceny. Przynajmniej jeden adres jest wymagany.',
      group: 'content',
      of: [
        {
          type: 'string',
          validation: (Rule) =>
            Rule.custom((email: string | undefined) => {
              if (!email) return 'Email jest wymagany'
              const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i
              return emailRegex.test(email) ? true : 'Nieprawidłowy format adresu email'
            }),
        },
      ],
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'form',
      type: 'object',
      title: 'Formularz wyceny',
      group: 'content',
      fields: [
        defineField({
          name: 'heading',
          type: 'Heading',
          title: 'Nagłówek formularza',
        }),
        defineField({
          name: 'mailerliteGroupId',
          type: 'string',
          title: 'ID grupy MailerLite dla newslettera',
          description: 'Opcjonalne. Jeśli nie podano, opcja newslettera nie będzie wyświetlana.',
        }),
        defineField({
          name: 'error',
          type: 'object',
          title: 'Błąd formularza',
          fields: [
            defineField({
              name: 'heading',
              type: 'Heading',
              title: 'Nagłówek',
            }),
            defineField({
              name: 'paragraph',
              type: 'PortableText',
              title: 'Paragraf',
            }),
            defineField({
              name: 'button',
              type: 'string',
              title: 'Tekst przycisku',
            }),
          ],
        }),
      ],
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
      language: 'language',
    },
    prepare: ({ title, language }) => {
      return getLanguagePreview({ title, languageId: language })
    },
  },
})
