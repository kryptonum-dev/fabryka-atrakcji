import { orderRankOrdering } from '@sanity/orderable-document-list'
import { Wrench } from 'lucide-react'
import { defineType } from 'sanity'
import { defineFilterOptionFields } from '../../utils/filter-option'

const name = 'EventSpaceFacilities_Collection'
const title = 'Zaplecze i możliwości'
const icon = Wrench

export default defineType({
  name,
  type: 'document',
  title,
  icon,
  orderings: [orderRankOrdering],
  fields: defineFilterOptionFields({ type: name, nameTitle: 'Nazwa zaplecza' }),
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
