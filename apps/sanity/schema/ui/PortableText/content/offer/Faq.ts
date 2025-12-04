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
      name: 'faqType',
      type: 'string',
      title: 'Typ pytań FAQ',
      description: 'Wybierz, czy chcesz użyć pytań lokalnych (tylko dla tej podstrony) czy globalnych (z kolekcji FAQ)',
      options: {
        list: [
          { title: 'Lokalne', value: 'scoped' },
          { title: 'Globalne', value: 'global' },
        ],
        layout: 'radio',
      },
      initialValue: 'scoped',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'questions',
      type: 'array',
      title: 'Lokalne pytania i odpowiedzi',
      description: 'Dodaj pytania i odpowiedzi, które będą widoczne tylko na tej podstronie',
      hidden: ({ parent }) => parent?.faqType !== 'scoped',
      validation: (Rule) =>
        Rule.custom((value, context: any) => {
          if (context.parent?.faqType === 'scoped' && (!value || value.length < 2)) {
            return 'Musisz dodać minimum 2 pytania'
          }
          return true
        }),
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
      name: 'globalQuestions',
      type: 'array',
      title: 'Globalne pytania i odpowiedzi',
      description: 'Wybierz pytania z kolekcji FAQ, które będą wyświetlane na tej podstronie',
      hidden: ({ parent }) => parent?.faqType !== 'global',
      validation: (Rule) =>
        Rule.custom((value, context: any) => {
          if (context.parent?.faqType === 'global' && (!value || value.length < 2)) {
            return 'Musisz dodać minimum 2 pytania'
          }
          return true
        }),
      of: [
        {
          type: 'reference',
          to: [{ type: 'Faq_Collection' }],
          options: {
            disableNew: false,
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
      faqType: 'faqType',
    },
    prepare({ heading, faqType }) {
      const faqTypeText = faqType === 'global' ? ' (Globalne)' : ' (Lokalne)'
      return {
        title: title + faqTypeText,
        subtitle: toPlainText(heading),
        icon,
      }
    },
  },
})
