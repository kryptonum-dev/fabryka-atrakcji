import { Grid } from 'lucide-react'
import { defineField } from 'sanity'
import { sectionPreview } from '../../utils/section-preview'
import { toPlainText } from '../../utils/to-plain-text'
import sectionId from '../ui/sectionId'

const name = 'AsymmetricalPhotoGalleryGrid'
const title = 'Asymetryczna taśma zdjęć'
const icon = Grid

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
      name: 'imageTape',
      type: 'array',
      title: 'Taśma zdjęć',
      validation: (Rule) => Rule.required().length(10).error('Taśma zdjęć musi zawierać 10 zdjęć'),
      of: [{ type: 'image' }],
    }),
    defineField({
      name: 'firstColumn',
      type: 'object',
      title: 'Pierwsza kolumna',
      fieldset: 'columns',
      validation: (Rule) => Rule.required(),
      fields: [
        defineField({
          name: 'mainParagraph',
          type: 'Heading',
          title: 'Główny paragraf',
        }),
        defineField({
          name: 'secondaryParagraph',
          type: 'PortableText',
          title: 'Dodatkowy paragraf (opcjonalny)',
        }),
        defineField({
          name: 'image',
          type: 'image',
          title: 'Zdjęcie',
        }),
      ],
    }),
    defineField({
      name: 'secondColumn',
      type: 'object',
      title: 'Druga kolumna',
      fieldset: 'columns',
      validation: (Rule) => Rule.required(),
      fields: [
        defineField({
          name: 'image',
          type: 'image',
          title: 'Zdjęcie',
        }),
        defineField({
          name: 'icon',
          type: 'image',
          options: {
            accept: '.svg',
          },
          title: 'Ikona',
        }),
        defineField({
          name: 'boldText',
          type: 'string',
          title: 'Tekst wyróżniony',
        }),
        defineField({
          name: 'normalText',
          type: 'string',
          title: 'Tekst normalny',
        }),
      ],
    }),
    defineField({
      name: 'thirdColumn',
      type: 'object',
      title: 'Trzecia kolumna',
      fieldset: 'columns',
      validation: (Rule) => Rule.required(),
      fields: [
        defineField({
          name: 'image',
          type: 'image',
          title: 'Zdjęcie',
        }),
        defineField({
          name: 'paragraph',
          type: 'PortableText',
          title: 'Paragraf',
        }),
      ],
    }),
    ...sectionId,
  ],
  fieldsets: [
    {
      name: 'columns',
      title: 'Kolumny',
      options: {
        collapsible: true,
        collapsed: false,
      },
    },
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
