import { Book } from 'lucide-react'
import { createPageSchema } from '../templates/pageTemplate'

const name = 'Blog_Page'
const title = 'Strona bloga'

export default createPageSchema({
  name,
  title,
  icon: Book,
  slugs: {
    pl: '/pl/blog',
    en: '/en/blog',
  },
})
