import { Calendar, Receipt } from 'lucide-react'
import { defineType, defineField } from 'sanity'

const title = 'Wyceny'
const icon = Receipt

// Function to get the correct Polish plural form for 'osoba'
const getPolishPersonPlural = (count: number): string => {
  // Get last digit and last two digits
  const lastDigit = count % 10
  const lastTwoDigits = count % 100

  // Special cases for teen numbers (11-19)
  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
    return 'osób'
  }

  // For numbers ending with 2-4, except those ending with 12-14
  if (lastDigit >= 2 && lastDigit <= 4) {
    return 'osoby'
  }

  // For numbers ending with 1, except those ending with 11
  if (lastDigit === 1) {
    return 'osoba'
  }

  // Default case (0, 5-9)
  return 'osób'
}

export default defineType({
  name: 'Quotes_Collection',
  title,
  icon,
  type: 'document',
  fields: [
    defineField({
      name: 'quoteId',
      title: 'ID wyceny',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'createdAt',
      title: 'Data utworzenia',
      type: 'datetime',
      readOnly: true,
    }),
    defineField({
      name: 'language',
      title: 'Język',
      type: 'string',
      options: {
        list: [
          { title: 'Polski', value: 'pl' },
          { title: 'Angielski', value: 'en' },
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
    }),
    defineField({
      name: 'participantCount',
      title: 'Liczba uczestników',
      type: 'number',
    }),
    defineField({
      name: 'selectedDates',
      title: 'Wybrane daty',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'start',
              title: 'Data rozpoczęcia',
              type: 'date',
            }),
            defineField({
              name: 'end',
              title: 'Data zakończenia',
              type: 'date',
            }),
          ],
          preview: {
            select: {
              start: 'start',
              end: 'end',
            },
            prepare({ start, end }) {
              return {
                title: `${start} - ${end}`,
                icon: Calendar,
              }
            },
          },
        },
      ],
    }),
    defineField({
      name: 'items',
      title: 'Elementy wyceny',
      type: 'array',
      of: [{ type: 'quoteItem' }],
    }),
  ],
  preview: {
    select: {
      quoteId: 'quoteId',
      participantCount: 'participantCount',
      date: 'createdAt',
      language: 'language',
    },
    prepare({ quoteId = '', participantCount = 0, date, language = 'pl' }) {
      // Format the date for subtitle
      const formattedDate = date ? new Date(date).toLocaleDateString('pl-PL') : ''
      const personPlural = getPolishPersonPlural(participantCount)

      return {
        title: quoteId,
        subtitle: `${participantCount} ${personPlural} • ${formattedDate} • ${language.toUpperCase()}`,
        media: icon,
      }
    },
  },
})
