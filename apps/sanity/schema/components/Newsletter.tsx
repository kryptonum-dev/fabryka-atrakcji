import { Mail } from 'lucide-react'
import { defineField } from 'sanity'
import { sectionPreview } from '../../utils/section-preview'
import { toPlainText } from '../../utils/to-plain-text'
import sectionId from '../ui/sectionId'

const name = 'Newsletter'
const title = 'Newsletter'
const icon = Mail

export default defineField({
  name,
  type: 'object',
  title,
  icon,
  fields: [
    defineField({
      name: 'background',
      type: 'image',
      title: 'Zdjęcie tła',
      description: 'Zdjęcie będzie używane jako tło dla sekcji, zalecamy nie zmieniać bazowego zdjęcia',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'heading',
      type: 'Heading',
      title: 'Nagłówek',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'subheading',
      type: 'Heading',
      title: 'Podtytuł (opcjonalny)',
    }),
    defineField({
      name: 'paragraph',
      type: 'PortableText',
      title: 'Paragraf',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'ctaText',
      type: 'string',
      title: 'Tekst przycisku',
      description: 'Tekst przycisku, który otwiera okno z formularzem',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'image',
      type: 'image',
      title: 'Zdjęcie',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'formPopup',
      type: 'object',
      title: 'Okienko formularza',
      fields: [
        defineField({
          name: 'groupId',
          type: 'string',
          title: 'ID grupy MailerLite',
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
          name: 'formState',
          type: 'formState',
        }),
      ],
      validation: (Rule) => Rule.required(),
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
