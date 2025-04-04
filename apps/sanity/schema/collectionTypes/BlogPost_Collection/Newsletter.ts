import { AddUserIcon } from '@sanity/icons'
import { defineField } from 'sanity'
import { sectionPreview } from '../../../utils/section-preview'
import { toPlainText } from '../../../utils/to-plain-text'

const name = 'Newsletter'
const title = 'Newsletter'
const icon = AddUserIcon

export default defineField({
  name,
  type: 'object',
  title,
  ...sectionPreview({ imgUrl: `/static/BlogPost_Collection/${name}.webp`, icon }),
  fields: [
    defineField({
      name: 'image',
      type: 'image',
      title: 'Zdjęcie (opcjonalne)',
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
      name: 'buttonText',
      type: 'string',
      title: 'Tekst przycisku formularza',
      validation: (Rule) => Rule.required(),
      fieldset: 'form',
    }),
    defineField({
      name: 'groupId',
      type: 'string',
      title: 'ID grupy MailerLite',
      validation: (Rule) => Rule.required(),
      fieldset: 'form',
    }),
    defineField({
      name: 'formState',
      type: 'formState',
      title: 'Stan formularza',
      fieldset: 'form',
    }),
  ],
  fieldsets: [
    {
      name: 'form',
      title: 'Formularz',
    },
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
