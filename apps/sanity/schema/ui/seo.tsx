import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'seo',
  title: 'SEO',
  type: 'object',
  validation: (Rule) => Rule.required(),
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      title: 'Tytuł',
      description: 'Tytuł jest widoczny w oknie przeglądarki i w wyszukiwarkach.',
      validation: (Rule) => [Rule.max(70).warning('Pole powinno zawierać maksymalnie 70 znaków.'), Rule.required()],
    }),
    defineField({
      name: 'description',
      type: 'text',
      title: 'Opis',
      rows: 4,
      description: 'Opis jest widoczny w wyszukiwarkach i podczas udostępniania strony w mediach społecznościowych.',
      validation: (Rule) => [
        Rule.min(110).warning('Pole powinno zawierać co najmniej 110 znaków.'),
        Rule.max(160).warning('Pole powinno zawierać maksymalnie 160 znaków.'),
        Rule.required(),
      ],
    }),
    defineField({
      name: 'img',
      type: 'image',
      title: 'Social Share Image (opcjonalny)',
      description: (
        <>
          Social Share Image jest widoczny podczas udostępniania strony w mediach społecznościowych. Wymiary obrazu
          powinny wynosić 1200x630px. Dla maksymalnej kompatybilności użyj formatów JPG lub PNG, ponieważ WebP może nie
          być obsługiwany na wszystkich platformach. Jeśli to pole pozostanie puste, zostanie użyty obraz zdefiniowany w{' '}
          <a href="/structure/konfiguracjaStrony;global">ustawieniach globalnych</a>.
        </>
      ),
    }),
    defineField({
      name: 'doNotIndex',
      type: 'boolean',
      title: 'Nie indeksuj strony',
      description: 'Zaznacz to pole, jeśli strona nie powinna być indeksowana przez wyszukiwarki.',
      initialValue: false,
    }),
  ],
})
