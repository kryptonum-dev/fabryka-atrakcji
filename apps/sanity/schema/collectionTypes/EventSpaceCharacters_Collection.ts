import { orderRankOrdering } from '@sanity/orderable-document-list'
import { Sparkles } from 'lucide-react'
import { defineType } from 'sanity'
import { defineFilterOptionFields } from '../../utils/filter-option'

const name = 'EventSpaceCharacters_Collection'
const title = 'Charakter przestrzeni'
const icon = Sparkles

export default defineType({
  name,
  type: 'document',
  title,
  icon,
  orderings: [orderRankOrdering],
  fields: defineFilterOptionFields({ type: name, nameTitle: 'Nazwa charakteru przestrzeni' }),
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
