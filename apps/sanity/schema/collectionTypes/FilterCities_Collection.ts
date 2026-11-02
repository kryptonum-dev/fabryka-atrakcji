import { orderRankOrdering } from '@sanity/orderable-document-list'
import { MapPin } from 'lucide-react'
import { defineField, defineType } from 'sanity'
import { COPY_COORDINATES_HINT, defineFilterOptionFields, validateCoordinates } from '../../utils/filter-option'

const name = 'FilterCities_Collection'
const title = 'Miasta w filtrze odległości'
const icon = MapPin

export default defineType({
  name,
  type: 'document',
  title,
  icon,
  orderings: [orderRankOrdering],
  fields: [
    ...defineFilterOptionFields({ type: name, nameTitle: 'Nazwa miasta' }),
    defineField({
      name: 'point',
      type: 'geopoint',
      title: 'Współrzędne',
      description: `Punkt, od którego liczymy promień w linii prostej, zwykle centrum miasta. ${COPY_COORDINATES_HINT}`,
      validation: (Rule) => Rule.custom(validateCoordinates),
    }),
  ],
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
