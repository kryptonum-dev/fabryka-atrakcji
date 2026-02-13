import { defineField } from 'sanity'

export default defineField({
  name: 'socialProof',
  type: 'object',
  title: 'Social Proof',
  fields: [
    defineField({
      name: 'clientLogos',
      type: 'array',
      title: 'Loga firm klientów',
      description: 'Loga firm, z którymi współpracowaliśmy (5-8 logo)',
      of: [{ type: 'image' }],
      validation: (Rule) => Rule.max(8),
    }),
    defineField({
      name: 'metrics',
      type: 'array',
      title: 'Metryki',
      description: 'np. "10+ lat doświadczenia", "200+ zrealizowanych eventów"',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'testimonials',
      type: 'array',
      title: 'Opinie',
      description: '1-2 krótkie opinie wyświetlane nad formularzem',
      of: [
        {
          type: 'reference',
          to: [{ type: 'Testimonial_Collection' }],
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
      validation: (Rule) => Rule.max(3),
    }),
    defineField({
      name: 'trustElement',
      type: 'PortableText',
      title: 'Element zaufania',
      description: 'Tekst wyświetlany pod formularzem, np. "Odpowiedź w 24h"',
    }),
  ],
  options: {
    collapsible: true,
    collapsed: false,
  },
})
