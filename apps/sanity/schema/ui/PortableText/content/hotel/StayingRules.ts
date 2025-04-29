import { ClipboardIcon } from '@sanity/icons'
import { defineField } from 'sanity'
import { sectionPreview } from '../../../../../utils/section-preview'
import { toPlainText } from '../../../../../utils/to-plain-text'

const name = 'StayingRules'
const title = 'Regulamin pobytu'
const icon = ClipboardIcon

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
    }),
    defineField({
      name: 'rulesList',
      type: 'object',
      title: 'Lista zasad',
      description:
        'Wszystkie zasady oprócz zameldowania i wymeldowania są opcjonalne. Jeśli nie zostaną wypełnione, nie będą wyświetlane na stronie.',
      fields: [
        defineField({
          name: 'checkIn',
          type: 'PortableText',
          title: 'Zameldowanie',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'checkOut',
          type: 'PortableText',
          title: 'Wymeldowanie',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'cancellationPolicy',
          type: 'PortableText',
          title: 'Odwołanie rezerwacji',
        }),
        defineField({
          name: 'quietHours',
          type: 'PortableText',
          title: 'Cisza nocna',
        }),
        defineField({
          name: 'petPolicy',
          type: 'PortableText',
          title: 'Zwierzęta',
        }),
        defineField({
          name: 'valuablesStorage',
          type: 'PortableText',
          title: 'Przechowywanie wartościowych przedmiotów',
        }),
        defineField({
          name: 'guestPolicy',
          type: 'PortableText',
          title: 'Polityka dotycząca gości zewnętrznych',
        }),
        defineField({
          name: 'otherRules',
          type: 'PortableText',
          title: 'Pozostałe zasady',
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
