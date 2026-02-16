import { MessageSquare } from 'lucide-react'
import { defineField } from 'sanity'
import { sectionPreview } from '../../utils/section-preview'
import { toPlainText } from '../../utils/to-plain-text'
import sectionId from '../ui/sectionId'

const name = 'ContactForm'
const title = 'Formularz kontaktowy'
const icon = MessageSquare

export default defineField({
  name,
  type: 'object',
  title,
  icon,
  fields: [
    defineField({
      name: 'headingImage',
      type: 'image',
      title: 'Zdjęcie przy nagłówku',
      description: 'Jeśli dodane, zdjęcie pojawi się po lewej stronie nagłówka, wymiary zdjęcia to 28x28 px',
    }),
    defineField({
      name: 'formVisualImage',
      type: 'image',
      title: 'Zdjęcie sekcji formularza',
      description:
        'Oddzielne zdjęcie do lewej kolumny przy formularzu (hero kontaktowy). Jeśli puste, użyte zostanie zdjęcie domyślne z ustawień globalnych.',
    }),
    defineField({
      name: 'heading',
      type: 'Heading',
      title: 'Nagłówek',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'paragraph',
      type: 'PortableText',
      title: 'Paragraf',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'showInquiries',
      type: 'boolean',
      title: 'Pokaż zapisane zapytania',
      description: 'Gdy włączone, formularz wyświetli zapisane integracje/hotele z localStorage użytkownika',
      initialValue: true,
    }),
    defineField({
      name: 'socialProof',
      type: 'socialProof',
      title: 'Social Proof',
      description: 'Elementy budujące zaufanie wyświetlane wokół formularza (opcjonalne)',
    }),
    defineField({
      name: 'overrideFormState',
      type: 'boolean',
      title: 'Nadpisz komunikaty formularza',
      description:
        'Gdy wyłączone, formularz użyje globalnych komunikatów sukcesu/błędu z ustawień globalnych. Włącz, aby ustawić niestandardowe komunikaty dla tego formularza.',
      initialValue: false,
    }),
    defineField({
      name: 'responseBadge',
      type: 'object',
      title: 'Badge odpowiedzi (nad formularzem)',
      description:
        'Opcjonalny badge widoczny przy formularzu. Jeśli puste, użyte zostaną ustawienia globalne.',
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({
          name: 'text',
          type: 'string',
          title: 'Tekst badge',
        }),
        defineField({
          name: 'icon',
          type: 'image',
          title: 'Ikona badge',
          description: 'Mała ikona wyświetlana po lewej stronie tekstu badge.',
        }),
      ],
    }),
    defineField({
      name: 'state',
      type: 'formState',
      title: 'Komunikaty formularza',
      description: 'Niestandardowe komunikaty sukcesu i błędu (wypełnij tylko gdy nadpisywanie jest włączone)',
      hidden: ({ parent }) => !(parent as any)?.overrideFormState,
    }),
    ...sectionId,
  ],
  preview: {
    select: {
      heading: 'heading',
    },
    prepare: ({ heading }) => ({
      title: title,
      subtitle: toPlainText(heading),
      ...sectionPreview({ imgUrl: `/static/components/${name}.webp`, icon }),
    }),
  },
})
