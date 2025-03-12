import { Image } from 'lucide-react'
import { defineField } from 'sanity'
import { sectionPreview } from '../../utils/section-preview'
import { toPlainText } from '../../utils/to-plain-text'
import sectionId from '../ui/sectionId'

const name = 'BackgroundImageWithCenteredHeading'
const title = 'Zdjęcie w tle z wyśrodkowanym nagłówkiem'
const icon = Image

export default defineField({
  name,
  type: 'object',
  title,
  icon,
  fields: [
    defineField({
      name: 'backgroundImage',
      type: 'image',
      title: 'Zdjęcie w tle',
      validation: (Rule) => Rule.required(),
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
      name: 'cta',
      type: 'cta',
      title: 'Przycisk CTA',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'points',
      type: 'array',
      title: 'Lista punktów',
      description: 'Wymagane 3 punkty',
      of: [{ type: 'string' }],
      validation: (Rule) => Rule.required().length(3).error('Musisz dodać 3 punkty'),
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
