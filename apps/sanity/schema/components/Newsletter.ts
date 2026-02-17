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
      name: 'image',
      type: 'image',
      title: 'Zdjęcie',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'useSimpleCta',
      type: 'boolean',
      title: 'Zwykłe CTA zamiast newslettera',
      description: 'Jeśli zaznaczone, zamiast formularza newslettera zostanie wyświetlone zwykłe CTA',
      initialValue: false,
    }),
    defineField({
      name: 'cta',
      type: 'cta',
      title: 'Wezwanie do działania',
      description: 'Przycisk CTA wyświetlany zamiast formularza newslettera',
      hidden: ({ parent }) => !parent?.useSimpleCta,
      validation: (Rule) =>
        Rule.custom((value, { parent }) => {
          if ((parent as { useSimpleCta?: boolean })?.useSimpleCta === true && !value) {
            return 'Wezwanie do działania jest wymagane, gdy opcja "Zwykłe CTA zamiast newslettera" jest włączona'
          }
          return true
        }),
    }),
    defineField({
      name: 'ctaText',
      type: 'string',
      title: 'Tekst przycisku',
      description: 'Tekst przycisku, który otwiera okno z formularzem',
      hidden: ({ parent }) => parent?.useSimpleCta === true,
      validation: (Rule) =>
        Rule.custom((value, { parent }) => {
          if ((parent as { useSimpleCta?: boolean })?.useSimpleCta !== true && !value) {
            return 'Tekst przycisku jest wymagany, gdy opcja "Zwykłe CTA zamiast newslettera" jest wyłączona'
          }
          return true
        }),
    }),

    defineField({
      name: 'formPopup',
      type: 'object',
      title: 'Okienko formularza',
      hidden: ({ parent }) => parent?.useSimpleCta === true,
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
          validation: (Rule) => Rule.required(),
        }),
      ],
      validation: (Rule) =>
        Rule.custom((value, { parent }) => {
          if ((parent as { useSimpleCta?: boolean })?.useSimpleCta !== true && !value) {
            return 'Okienko formularza jest wymagane, gdy opcja "Zwykłe CTA zamiast newslettera" jest wyłączona'
          }
          return true
        }),
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
