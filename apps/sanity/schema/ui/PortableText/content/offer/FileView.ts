import { defineField } from 'sanity'
import { DocumentPdfIcon } from '@sanity/icons'
import { toPlainText } from '../../../../../utils/to-plain-text'

const name = 'FileView'
const title = 'Podgląd pliku'
const icon = DocumentPdfIcon

export default defineField({
  name,
  type: 'object',
  icon,
  title,
  fields: [
    defineField({
      name: 'heading',
      type: 'Heading',
      title: 'Nagłówek',
      validation: (Rule) => Rule.required(),
      initialValue: [
        {
          _key: '8a0d68722eaf',
          _type: 'block',
          children: [
            {
              _key: 'b0c030ee3f460',
              _type: 'span',
              marks: [],
              text: 'Zobacz ofertę ',
            },
            {
              _key: 'b0c030ee3f460',
              _type: 'span',
              marks: ['strong'],
              text: 'w wersji PDF',
            },
          ],
          markDefs: [],
          style: 'normal',
        },
      ],
    }),
    defineField({
      name: 'paragraph',
      type: 'PortableText',
      title: 'Treść',
      validation: (Rule) => Rule.required(),
      initialValue: [
        {
          _key: '8a0d68722eaf',
          _type: 'block',
          children: [
            {
              _key: 'b0c030ee3f460',
              _type: 'span',
              marks: ['strong'],
              text: 'Nasza integracja wpadła ci w oko i chciałbyś mieć ją pod ręką?',
            },
            {
              _key: 'b0c030ee3f460',
              _type: 'span',
              marks: [],
              text: ' Pobierz naszą ofertę w wersji PDF – z gotowymi scenariuszami, atrakcjami i przykładami realizacji. Przejrzysta, konkretna i gotowa do przesłania dalej – idealna dla działów HR, Office Managerów i wszystkich, którzy chcą działać sprawnie.',
            },
          ],
        },
      ],
    }),
    defineField({
      name: 'buttonText',
      type: 'string',
      title: 'Tekst przycisku',
      description: 'Tekst przycisku do pobrania pliku',
      validation: (Rule) => Rule.required(),
      initialValue: 'Zobacz ofertę PDF',
    }),
    defineField({
      name: 'file',
      type: 'file',
      title: 'Plik PDF',
      description: 'Wybierz plik PDF do wyświetlenia',
      options: {
        accept: '.pdf',
      },
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {
      heading: 'heading',
      description: 'description',
    },
    prepare: ({ heading, description }) => {
      return {
        title,
        subtitle: `${toPlainText(heading)} - ${description || 'Brak opisu'}`,
      }
    },
  },
})
