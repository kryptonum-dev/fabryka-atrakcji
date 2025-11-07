import { Images } from 'lucide-react'
import { defineField } from 'sanity'
import { toPlainText } from '../../utils/to-plain-text'
import sectionId from '../ui/sectionId'
import { sectionPreview } from '../../utils/section-preview'

const name = 'ImagesMarqueeSection'
const title = 'Sekcja z taśmą zdjęć'
const icon = Images

export default defineField({
  name,
  type: 'object',
  title,
  icon,
  fields: [
    defineField({
      name: 'heading',
      type: 'Heading',
      title: 'Nagłówek',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'images',
      type: 'array',
      title: 'Lista zdjęć',
      description: 'Lista zdjęć wyświetlanych w taśmie (min 5, max 12)',
      of: [
        {
          type: 'image',
          title: 'Zdjęcie',
        },
      ],
      validation: (Rule) =>
        Rule.required().min(5).error('Wymagane minimum 5 zdjęć').max(12).error('Maksymalnie 12 zdjęć'),
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
