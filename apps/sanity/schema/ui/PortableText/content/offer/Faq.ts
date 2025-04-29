import { TextIcon } from '@sanity/icons'
import { defineField } from 'sanity'
import { sectionPreview } from '../../../../../utils/section-preview'
import { toPlainText } from '../../../../../utils/to-plain-text'

const name = 'Faq'
const title = 'Pytania i odpowiedzi'
const icon = TextIcon

export default defineField({
  name,
  type: 'object',
  title,
  ...sectionPreview({ imgUrl: `/static/BlogPost_Collection/${name}.webp`, icon }),
  fields: [
    defineField({
      name: 'heading',
      type: 'Heading',
      title: 'Nagłówek',
      validation: (Rule) => Rule.required(),
      initialValue: [
        {
          _key: '8a0d68722eaf',
          _type: 'block',
          children: [
            {
              _key: 'b0c030ee3f460',
              _type: 'span',
              marks: [],
              text: 'Sprawdź o co najczęściej ',
            },
            {
              _key: 'b0c030ee3f460',
              _type: 'span',
              marks: ['strong'],
              text: 'pytali nasi klienci ',
            },
          ],
          markDefs: [],
          style: 'normal',
        },
      ],
    }),
    defineField({
      name: 'questions',
      type: 'array',
      title: 'Pytania i odpowiedzi',
      validation: (Rule) => Rule.required().min(2).error('Musisz wybrać minimum 2 pytania'),
      of: [
        {
          type: 'reference',
          to: [{ type: 'Faq_Collection' }],
          options: {
            disableNew: true,
            filter: ({ parent, document }) => {
              const language = (document as { language?: string })?.language
              const selectedIds =
                (parent as { _ref?: string }[])?.filter((item) => item._ref).map((item) => item._ref) || []
              return {
                filter: '!(_id in $selectedIds) && !(_id in path("drafts.**")) && language == $lang',
                params: { selectedIds, lang: language },
              }
            },
          },
        },
      ],
    }),
    defineField({
      name: 'contactBlock',
      type: 'object',
      title: 'Blok kontaktowy',
      fields: [
        defineField({
          name: 'heading',
          type: 'Heading',
          title: 'Nagłówek',
          validation: (Rule) => Rule.required(),
          initialValue: [
            {
              _key: '8a0d68722eaf',
              _type: 'block',
              children: [
                {
                  _key: 'b0c030ee3f460',
                  _type: 'span',
                  marks: ['strong'],
                  text: 'Masz inne pytanie?',
                },
              ],
              markDefs: [],
              style: 'normal',
            },
          ],
        }),
        defineField({
          name: 'paragraph',
          type: 'Heading',
          title: 'Paragraf',
          validation: (Rule) => Rule.required(),
          initialValue: [
            {
              _key: '8a0d68722eaf',
              _type: 'block',
              children: [
                {
                  _key: 'b0c030ee3f460',
                  _type: 'span',
                  marks: [],
                  text: 'Skontaktuj się z nami!',
                },
              ],
              markDefs: [],
              style: 'normal',
            },
          ],
        }),
        defineField({
          name: 'formPopup',
          type: 'formPopup',
          title: 'Okienko formularza',
          validation: (Rule) => Rule.required(),
        }),
      ],
    }),
  ],
  preview: {
    select: {
      heading: 'heading',
    },
    prepare({ heading }) {
      return {
        title,
        subtitle: toPlainText(heading),
        icon,
      }
    },
  },
})
