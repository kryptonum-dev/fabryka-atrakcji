import { Book } from 'lucide-react'
import { createPageSchema } from '../templates/pageTemplate'

const name = 'CaseStudy_Page'
const title = 'Strona Realizacji'

export default createPageSchema({
  name,
  title,
  icon: Book,
  slugs: {
    pl: '/pl/realizacje',
    en: '/en/case-studies',
  },
})
