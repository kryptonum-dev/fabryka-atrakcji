import { FileText } from 'lucide-react'
import { createPageSchema } from '../templates/pageTemplate'

const name = 'Blog_Page'
const title = 'Blog'

export default createPageSchema({
  name,
  title,
  icon: FileText,
  slugs: {
    pl: '/pl/blog',
    en: '/en/blog',
  },
})
