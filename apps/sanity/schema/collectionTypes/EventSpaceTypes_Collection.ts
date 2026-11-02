import { orderRankOrdering } from '@sanity/orderable-document-list'
import { LayoutGrid } from 'lucide-react'
import { defineType } from 'sanity'
import { defineFilterOptionFields } from '../../utils/filter-option'

const name = 'EventSpaceTypes_Collection'
const title = 'Rodzaje przestrzeni'
const icon = LayoutGrid

export default defineType({
  name,
  type: 'document',
  title,
  icon,
  orderings: [orderRankOrdering],
  // The listing reserves `mixed` in `spaceType` for objects with two or more types.
  fields: defineFilterOptionFields({ type: name, nameTitle: 'Nazwa rodzaju przestrzeni', reservedSlugs: ['mixed'] }),
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
