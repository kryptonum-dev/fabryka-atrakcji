import { defineField } from 'sanity'
import { slugify } from '../../utils/slugify'

type Props = {
  _key: string
  sectionId?: string
}

export default [
  defineField({
    name: 'sectionId',
    type: 'string',
    title: 'ID sekcji (opcjonalnie)',
    description: 'ID sekcji to unikalny identyfikator używany do linkowania do określonych sekcji strony.',
    validation: (Rule) => [
      Rule.custom((value, context) => {
        if (!value) return true
        if (value?.startsWith('#'))
          return 'ID sekcji nie może zaczynać się od symbolu "#". Musi być tylko ciągiem znaków.'
        const components = (context.document?.components || []) as Props[]
        const currentComponent = context.parent as Props
        const isDuplicate = components.some(
          (component) => component._key !== currentComponent._key && component.sectionId === value
        )
        if (isDuplicate) return 'Ten ID sekcji jest już używany w innym komponencie. ID sekcji muszą być unikalne.'
        return true
      }),
      Rule.custom((value) => {
        if (!value) return true
        const slugified = slugify(value)
        if (slugified !== value) {
          return 'ID sekcji może zawierać tylko małe litery, cyfry i myślniki (bez specjalnych znaków). Nie może zaczynać ani kończyć się myślnikiem.'
        }
        return true
      }),
    ],
  }),
]
