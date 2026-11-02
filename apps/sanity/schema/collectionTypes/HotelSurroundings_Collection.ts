import { orderRankOrdering } from '@sanity/orderable-document-list'
import { Trees } from 'lucide-react'
import { defineType } from 'sanity'
import { defineFilterOptionFields } from '../../utils/filter-option'

const name = 'HotelSurroundings_Collection'
const title = 'Otoczenie hotelu'
const icon = Trees

export default defineType({
  name,
  type: 'document',
  title,
  icon,
  orderings: [orderRankOrdering],
  fields: defineFilterOptionFields({ type: name, nameTitle: 'Nazwa otoczenia' }),
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
