import { Book } from 'lucide-react'
import { createPageSchema } from '../templates/pageTemplate'

const name = 'Activities_Page'
const title = 'Strona Integracji'

export default createPageSchema({
  name,
  title,
  icon: Book,
  slugs: {
    pl: '/pl/integracje',
    en: '/en/activities',
  },
})
