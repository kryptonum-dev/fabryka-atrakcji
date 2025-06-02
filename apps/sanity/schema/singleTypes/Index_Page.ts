import { House } from 'lucide-react'
import { createPageSchema } from '../templates/pageTemplate'

const name = 'Index_Page'
const title = 'Strona Główna'

export default createPageSchema({
  name,
  title,
  icon: House,
})
