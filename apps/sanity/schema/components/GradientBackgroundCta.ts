import { Palette } from 'lucide-react'
import { defineField } from 'sanity'
import { sectionPreview } from '../../utils/section-preview'
import { toPlainText } from '../../utils/to-plain-text'
import sectionId from '../ui/sectionId'

const name = 'GradientBackgroundCta'
const title = 'Sekcja z Gradientem w tle i CTA'
const icon = Palette

export default defineField({
  name,
  type: 'object',
  title,
  icon,
  fields: [
    defineField({
      name: 'imagesGrid',
      type: 'array',
      title: 'Siatka zdjęć w tle',
      description: 'Siatka zdjęć porozmieszczonych w tle, za gradientem',
      validation: (Rule) => Rule.required().length(9).error('Musisz dodać dokładnie 9 zdjęć'),
      of: [{ type: 'image' }],
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
      name: 'ctas',
      type: 'array',
      title: 'Wezwania do działania',
      description: 'Lista wezwań do działania, muszisz dodać przynajmniej 1 i maksymalnie 2',
      validation: (Rule) =>
        Rule.required()
          .min(1)
          .error('Musisz dodać przynajmniej 1 wezwanie do działania')
          .max(2)
          .error('Możesz dodać maksymalnie 2 wezwania do działania'),
      of: [{ type: 'cta' }],
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
