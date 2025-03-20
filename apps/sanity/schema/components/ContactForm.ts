import { MessageSquare } from 'lucide-react'
import { defineField } from 'sanity'
import { sectionPreview } from '../../utils/section-preview'
import { toPlainText } from '../../utils/to-plain-text'
import sectionId from '../ui/sectionId'

const name = 'ContactForm'
const title = 'Formularz kontaktowy'
const icon = MessageSquare

export default defineField({
  name,
  type: 'object',
  title,
  icon,
  fields: [
    defineField({
      name: 'headingImage',
      type: 'image',
      title: 'Zdjęcie przy nagłówku',
      description: 'Jeśli dodane, zdjęcie pojawi się po lewej stronie nagłówka, wymiary zdjęcia to 28x28 px',
    }),
    defineField({
      name: 'heading',
      type: 'Heading',
      title: 'Nagłówek',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'paragraph',
      type: 'PortableText',
      title: 'Paragraf',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'state',
      type: 'object',
      title: 'Stan formularza',
      fields: [
        defineField({
          name: 'success',
          type: 'object',
          title: 'Sukces',
          fields: [
            defineField({
              name: 'heading',
              type: 'Heading',
              title: 'Nagłówek',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'paragraph',
              type: 'PortableText',
              title: 'Paragraf',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'highlightedSocialMedia',
              type: 'array',
              title: 'Wyróżnione media społecznościowe',
              validation: (Rule) => Rule.required().length(2).error('Musisz wybrać dokładnie 2 media społecznościowe'),
              of: [
                {
                  type: 'reference',
                  to: { type: 'SocialMedia_Collection' },
                  options: {
                    disableNew: true,
                    filter: ({ parent, document }) => {
                      const language = (document as { language?: string })?.language
                      const selectedIds =
                        (parent as { _ref?: string }[])?.filter((item) => item._ref).map((item) => item._ref) || []
                      return {
                        filter: '!(_id in path("drafts.**")) && language == $lang',
                        params: { selectedIds, lang: language },
                      }
                    },
                  },
                },
              ],
            }),
          ],
          validation: (Rule) => Rule.required(),
          options: {
            collapsible: true,
            collapsed: false,
          },
        }),
        defineField({
          name: 'error',
          type: 'object',
          title: 'Błąd',
          fields: [
            defineField({
              name: 'heading',
              type: 'Heading',
              title: 'Nagłówek',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'paragraph',
              type: 'PortableText',
              title: 'Paragraf',
              validation: (Rule) => Rule.required(),
            }),
          ],
          validation: (Rule) => Rule.required(),
          options: {
            collapsible: true,
            collapsed: false,
          },
        }),
      ],
      initialValue: {
        error: {
          heading: [
            {
              _key: '8a0d68722eaf',
              _type: 'block',
              children: [
                {
                  _key: 'b0c030ee3f460',
                  _type: 'span',
                  marks: [],
                  text: 'Oj, chyba serwer postanowił zrobić sobie przerwę…',
                },
              ],
              markDefs: [],
              style: 'normal',
            },
          ],
          paragraph: [
            {
              _key: 'ebb0292e568a',
              _type: 'block',
              children: [
                {
                  _key: '640c8ab70cba0',
                  _type: 'span',
                  marks: [],
                  text: 'Wygląda to na chwilowe trudności techniczne. Spróbuj ponownie lub wróć za moment.',
                },
              ],
              markDefs: [],
              style: 'normal',
            },
          ],
        },
        success: {
          heading: [
            {
              _key: '4b59f811d0a8',
              _type: 'block',
              children: [
                {
                  _key: '539e16d1343b0',
                  _type: 'span',
                  marks: [],
                  text: 'Gotowe! Teraz my przejmujemy stery!',
                },
              ],
              markDefs: [],
              style: 'normal',
            },
          ],
          paragraph: [
            {
              _key: 'ab95362f4845',
              _type: 'block',
              children: [
                {
                  _key: 'b1c1d6105cb50',
                  _type: 'span',
                  marks: [],
                  text: 'Twój formularz dotarł do nas bez problemu. Spodziewaj się kontaktu z naszej strony – razem stworzymy coś wyjątkowego!',
                },
              ],
              markDefs: [],
              style: 'normal',
            },
          ],
          highlightedSocialMedia: [
            {
              _key: '123',
              _type: 'reference',
              _ref: '8c6f9338-c736-4e57-8505-163cf272bea1',
            },
            {
              _key: '1234',
              _type: 'reference',
              _ref: '20c6e7fe-6b0e-4035-8828-d335030f3e8e',
            },
          ],
        },
      },
      validation: (Rule) => Rule.required(),
    }),
    ...sectionId,
  ],
  preview: {
    select: {
      heading: 'heading',
    },
    prepare: ({ heading }) => ({
      title: title,
      subtitle: toPlainText(heading),
      ...sectionPreview({ imgUrl: `/static/components/${name}.webp`, icon }),
    }),
  },
})
