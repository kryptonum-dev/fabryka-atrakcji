import { TextIcon } from '@sanity/icons'
import { defineField } from 'sanity'
import { sectionPreview } from '../../../../../utils/section-preview'
import { toPlainText } from '../../../../../utils/to-plain-text'
import { MessageCircleQuestion } from 'lucide-react'

const name = 'Faq'
const title = 'Pytania i odpowiedzi'
const icon = TextIcon

export default defineField({
  name,
  type: 'object',
  title,
  ...sectionPreview({ imgUrl: `/static/offer/${name}.webp`, icon }),
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
      validation: (Rule) => Rule.required().min(2).error('Musisz dodać minimum 2 pytania'),
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'question',
              type: 'Heading',
              title: 'Pytanie',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'answer',
              type: 'PortableText',
              title: 'Odpowiedź',
              validation: (Rule) => Rule.required(),
            }),
          ],
          preview: {
            select: {
              question: 'question',
              answer: 'answer',
            },
            prepare({ question, answer }) {
              return {
                title: toPlainText(question),
                subtitle: toPlainText(answer),
                icon: MessageCircleQuestion,
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
