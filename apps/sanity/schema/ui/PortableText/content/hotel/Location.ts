import { PinIcon } from '@sanity/icons'
import { defineField } from 'sanity'
import { sectionPreview } from '../../../../../utils/section-preview'
import { toPlainText } from '../../../../../utils/to-plain-text'
import { MapIcon } from 'lucide-react'

const name = 'Location'
const title = 'Lokalizacja i okolica'
const icon = PinIcon

export default defineField({
  name,
  type: 'object',
  title,
  ...sectionPreview({ imgUrl: `/static/hotel/${name}.webp`, icon }),
  fields: [
    defineField({
      name: 'heading',
      type: 'Heading',
      title: 'Nagłówek',
      initialValue: [
        {
          _key: '8a0d68722eaf',
          _type: 'block',
          children: [
            {
              _key: 'b0c030ee3f460',
              _type: 'span',
              marks: ['strong'],
              text: 'Gdzie',
            },
            {
              _key: 'b0c030ee3f460',
              _type: 'span',
              marks: [],
              text: ' znajduje się hotel',
            },
          ],
          markDefs: [],
          style: 'normal',
        },
      ],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'howToGetThere',
      type: 'object',
      title: 'Informacje o dojazdzie',
      fields: [
        defineField({
          name: 'subheading',
          type: 'Heading',
          title: 'Nagłówek dodatkowy',
          initialValue: [
            {
              _key: '8a0d68722eaf',
              _type: 'block',
              children: [
                {
                  _key: 'b0c030ee3f460',
                  _type: 'span',
                  marks: ['strong'],
                  text: 'Jak',
                },
                {
                  _key: 'b0c030ee3f460',
                  _type: 'span',
                  marks: [],
                  text: ' dojechać',
                },
              ],
              markDefs: [],
              style: 'normal',
            },
          ],
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'transportList',
          type: 'object',
          title: 'Lista informacji o transporcie',
          description:
            'Poniższe informacje są opcjonalne, jeśli żadna z nich nie zostanie uzupełniona, podsekcja z informacjami o dojazdzie nie będzie widoczna.',
          fields: [
            {
              name: 'byCar',
              type: 'text',
              title: 'Dojazd samochodem',
              rows: 3,
              description: 'Krótki opis najwygodniejszego sposobu dojazdu do hotelu samochodem',
            },
            {
              name: 'publicTransport',
              type: 'text',
              title: 'Transport publiczny',
              rows: 3,
              description: 'Opis jak dojechać do hotelu za pomocą transportu publicznego',
            },
            {
              name: 'parking',
              type: 'text',
              title: 'Informacje o parkingu',
              rows: 3,
              description: 'Opis gdzie znajduje się parking oraz czy jest płatny',
            },
            {
              name: 'callout',
              type: 'text',
              title: 'Dodatkowe informacje o dojazdzie',
              rows: 3,
              initialValue:
                'Nie musisz martwić się organizacją transportu – zespół naszych ekspertów chętnie zajmie się logistyką, w tym wynajmem autokarów czy zapewnieniem prywatnych kierowców. Wystarczy, że w koszyku zaznaczysz opcję transport.',
            },
          ],
        }),
      ],
    }),
    defineField({
      name: 'attractions',
      type: 'object',
      title: 'Atrakcje w okolicy',
      fields: [
        defineField({
          name: 'subheading',
          type: 'Heading',
          title: 'Nagłówek dodatkowy',
          validation: (Rule) => Rule.required(),
          initialValue: [
            {
              _key: '8a0d68722eaf',
              _type: 'block',
              children: [
                {
                  _key: 'b0c030ee3f460',
                  _type: 'span',
                  marks: ['strong'],
                  text: 'W okolicach',
                },
                {
                  _key: 'b0c030ee3f460',
                  _type: 'span',
                  marks: [],
                  text: ' obiektu znajdziecie',
                },
              ],
              markDefs: [],
              style: 'normal',
            },
          ],
        }),
        defineField({
          name: 'highlightedAttractions',
          type: 'array',
          title: 'Wyróżnione atrakcje',
          of: [
            {
              type: 'object',
              fields: [
                defineField({
                  name: 'name',
                  type: 'string',
                  title: 'Nazwa',
                  validation: (Rule) => Rule.required().error('Nazwa atrakcji jest wymagana'),
                }),
                defineField({
                  name: 'distance',
                  type: 'number',
                  title: 'Odległość (w metrach)',
                  validation: (Rule) => Rule.required().min(1).error('Odległość musi być liczbą większą niż 0 metrów'),
                }),
              ],
              preview: {
                select: {
                  name: 'name',
                  distance: 'distance',
                },
                prepare({ name, distance }) {
                  return {
                    title: name,
                    subtitle: `${distance} m`,
                    media: PinIcon,
                  }
                },
              },
            },
          ],
          validation: (Rule) => Rule.required().min(3).max(8).error('Wymagane jest od 3 do 8 wyróżnionych atrakcji'),
        }),
        defineField({
          name: 'list',
          type: 'array',
          title: 'Lista wszystkich atrakcji',
          of: [
            {
              type: 'object',
              fields: [
                defineField({
                  name: 'heading',
                  type: 'string',
                  title: 'Nagłówek',
                  validation: (Rule) => Rule.required().error('Nagłówek jest wymagany'),
                }),
                defineField({
                  name: 'items',
                  type: 'array',
                  of: [
                    {
                      type: 'object',
                      fields: [
                        defineField({
                          name: 'name',
                          type: 'string',
                          title: 'Nazwa',
                          validation: (Rule) => Rule.required().error('Nazwa atrakcji jest wymagana'),
                        }),
                        defineField({
                          name: 'distance',
                          type: 'number',
                          title: 'Odległość (w metrach)',
                          validation: (Rule) =>
                            Rule.required().min(1).error('Odległość musi być liczbą większą niż 0 metrów'),
                        }),
                      ],
                      preview: {
                        select: {
                          name: 'name',
                          distance: 'distance',
                        },
                        prepare({ name, distance }) {
                          return {
                            title: name,
                            subtitle: `${distance} m`,
                            media: PinIcon,
                          }
                        },
                      },
                    },
                  ],
                  title: 'Elementy',
                  validation: (Rule) => Rule.required().error('Lista elementów jest wymagana'),
                }),
              ],
              preview: {
                select: {
                  title: 'heading',
                  subtitle: 'items',
                },
                prepare({ title, subtitle }) {
                  return {
                    title,
                    subtitle: `Liczba elementów: ${subtitle.length}`,
                    icon: MapIcon,
                  }
                },
              },
            },
          ],
          validation: (Rule) => Rule.required().min(1).error('Wymagana jest co najmniej jedna atrakcja'),
        }),
      ],
    }),
  ],
  preview: {
    select: {
      heading: 'heading',
    },
    prepare({ heading }) {
      return {
        title,
        subtitle: toPlainText(heading),
        icon,
      }
    },
  },
})
