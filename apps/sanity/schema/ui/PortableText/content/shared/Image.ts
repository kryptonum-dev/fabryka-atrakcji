import { ImageIcon } from '@sanity/icons'
import { defineField } from 'sanity'

const name = 'Image'
const title = 'Zdjęcie'
const icon = ImageIcon

export default defineField({
  name: name,
  type: 'image',
  title: title,
  icon: icon,
  validation: (Rule) => Rule.required(),
})
