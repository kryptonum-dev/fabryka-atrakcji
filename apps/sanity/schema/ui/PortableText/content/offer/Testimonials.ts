import { defineField } from 'sanity'
import { UsersIcon } from '@sanity/icons'
const title = 'Opinie klientów'
const icon = UsersIcon

export default defineField({
  name: 'Testimonials',
  type: 'object',
  title,
  icon,
  fields: [
    defineField({
      name: 'testimonials',
      type: 'array',
      title: 'Lista opinii',
      validation: (Rule) => Rule.required().min(2).error('Musisz wybrać minimum 2 opinie'),
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
    }),
  ],
  preview: {
    select: {
      testimonials: 'testimonials',
    },
    prepare: ({ testimonials = [] }) => ({
      title: 'Opinie klientów',
      subtitle: `Liczba opinii: [${testimonials.length}]`,
      media: icon,
    }),
  },
})
