import { orderRankOrdering } from '@sanity/orderable-document-list'
import { CalendarDays } from 'lucide-react'
import { defineType } from 'sanity'
import { defineFilterOptionFields } from '../../utils/filter-option'

const name = 'EventTypes_Collection'
const title = 'Typy wydarzeń'
const icon = CalendarDays

export default defineType({
  name,
  type: 'document',
  title,
  icon,
  orderings: [orderRankOrdering],
  fields: defineFilterOptionFields({ type: name, nameTitle: 'Nazwa typu wydarzenia' }),
  preview: {
    select: {
      title: 'name',
    },
    prepare: ({ title }) => ({
      title: title || 'Brak nazwy',
      media: icon,
    }),
  },
})
