import { defineType } from 'sanity'
import CardSteps from './components/CardSteps'
import FullWidthPhoto from './components/FullWidthPhoto'

export default defineType({
  name: 'components',
  type: 'array',
  title: 'Components',
  of: [FullWidthPhoto, CardSteps],
  options: {
    insertMenu: {
      filter: true,
      showIcons: true,
      views: [
        { name: 'grid', previewImageUrl: (schemaTypeName) => `/static/${schemaTypeName}.webp` },
        { name: 'list' },
      ],
    },
  },
})
