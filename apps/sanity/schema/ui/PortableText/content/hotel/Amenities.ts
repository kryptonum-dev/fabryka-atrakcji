import { HomeIcon } from '@sanity/icons'
import { defineField, defineArrayMember } from 'sanity'
import { sectionPreview } from '../../../../../utils/section-preview'
import { toPlainText } from '../../../../../utils/to-plain-text'
import { CheckCircleIcon } from 'lucide-react'

const name = 'Amenities'
const title = 'Lista udogodnień'
const icon = HomeIcon

export default defineField({
  name,
  type: 'object',
  title,
  ...sectionPreview({ imgUrl: `/static/hotel/${name}.webp`, icon }),
  fields: [
    defineField({
      name: 'heading',
      type: 'Heading',
      title: 'Nagłówek (opcjonalny)',
    }),
    defineField({
      name: 'amenityGroups',
      type: 'array',
      title: 'Grupy udogodnień',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({
              name: 'heading',
              type: 'string',
              title: 'Nagłówek grupy',
              validation: (Rule) => Rule.required().error('Nagłówek grupy jest wymagany'),
            }),
            defineField({
              name: 'list',
              type: 'array',
              title: 'Lista udogodnień',
              of: [{ type: 'string' }],
              validation: (Rule) => Rule.min(2).error('Lista musi zawierać co najmniej 2 elementy'),
            }),
          ],
          preview: {
            select: {
              heading: 'heading',
              list: 'list',
            },
            prepare: ({ heading, list }) => ({
              title: heading,
              subtitle: `Lista elementów: ${list.length}`,
              icon: CheckCircleIcon,
            }),
          },
        }),
      ],
      validation: (Rule) => Rule.required().error('Przynajmniej jedna grupa udogodnień jest wymagana'),
    }),
  ],
  preview: {
    select: {
      heading: 'heading',
    },
    prepare: ({ heading }) => ({
      title,
      subtitle: toPlainText(heading) || '',
      icon,
    }),
  },
})
