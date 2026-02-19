import { defineField } from 'sanity'

export default defineField({
  name: 'formState',
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
        }),
        defineField({
          name: 'paragraph',
          type: 'PortableText',
          title: 'Paragraf',
        }),
        defineField({
          name: 'highlightedSocialMedia',
          type: 'array',
          title: 'Wyróżnione media społecznościowe',
          validation: (Rule) => Rule.max(2).error('Musisz wybrać maksymalnie 2 media społecznościowe'),
          of: [
            {
              type: 'reference',
              to: { type: 'SocialMedia_Collection' },
              options: {
                disableNew: true,
                filter: ({ parent, document }) => {
                  const selectedIds =
                    (parent as { _ref?: string }[])?.filter((item) => item._ref).map((item) => item._ref) || []
                  return {
                    filter: '!(_id in path("drafts.**")) && !(_id in $selectedIds)',
                    params: { selectedIds },
                  }
                },
              },
            },
          ],
        }),
      ],
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
        }),
        defineField({
          name: 'paragraph',
          type: 'PortableText',
          title: 'Paragraf',
        }),
      ],
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
})
