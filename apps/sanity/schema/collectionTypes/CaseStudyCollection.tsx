import { FileSearch } from 'lucide-react'
import { defineField, defineType } from 'sanity'
import { defineSlugForDocument } from '../../utils/define-slug-for-document'
import { toPlainText } from '../../utils/to-plain-text'
import { ComposeIcon, SearchIcon, UserIcon } from '@sanity/icons'
import React from 'react'

const title = 'Realizacje'
const icon = FileSearch

export default defineType({
  name: 'CaseStudy_Collection',
  type: 'document',
  title,
  icon,
  fields: [
    defineField({
      name: 'language',
      type: 'string',
      readOnly: true,
      hidden: true,
    }),
    defineField({
      name: 'name',
      type: 'string',
      title: 'Nazwa realizacji',
      group: 'content',
      description:
        'Nazwa realizacji wyświetlania przy refererowaniu, wyszukiwaniu oraz udostępnianiu w mediach społecznościowych',
      validation: (Rule) => Rule.required(),
    }),
    ...defineSlugForDocument({
      source: 'name',
      prefixes: {
        pl: '/pl/realizacje/',
        en: '/en/case-studies/',
      },
    }),
    defineField({
      name: 'title',
      type: 'Heading',
      title: 'Nagłówek',
      group: 'content',
      description: 'Pełna nazwa realizacji wyświetlana na stronie realizacji',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'category',
      type: 'reference',
      title: 'Kategoria',
      description: 'Kategoria realizacji, będzie wyświetlana w sekcji z listą wszystkich realizacji.',
      group: 'content',
      to: { type: 'CaseStudyCategory_Collection' },
      validation: (Rule) => Rule.required(),
      options: {
        disableNew: true,
        filter: ({ document }) => {
          const language = (document as { language?: string })?.language
          return {
            filter: 'defined(slug.current) && language == $lang',
            params: { lang: language },
          }
        },
      },
    }),
    defineField({
      name: 'primaryImage',
      type: 'image',
      title: 'Główne zdjęcie',
      group: 'content',
      description:
        'Główne zdjęcie realizacji, wyświetlane w sekcji hero konkretnej realizacji oraz przy jej refererowaniu',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'secondaryImage',
      type: 'image',
      title: 'Dodatkowe zdjęcie',
      description: 'Dodatkowe zdjęcie wyświetla się przy najechaniu myszką bądź kliknięciu na kartę realizacji.',
      validation: (Rule) => Rule.required(),
      group: 'content',
    }),
    defineField({
      name: 'duration',
      type: 'number',
      title: 'Czas trwania',
      description: 'Liczba dni trwania integracji',
      group: 'content',
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'localization',
      type: 'string',
      title: 'Lokalizacja',
      description: 'Miasto, w którym odbyła się integracja',
      validation: (Rule) => Rule.required(),
      group: 'content',
    }),
    defineField({
      name: 'services',
      type: 'array',
      title: 'Usługi',
      description: 'Lista usług, które zostały zrealizowane podczas integracji',
      of: [{ type: 'string' }],
      group: 'content',
      validation: (Rule) => Rule.required().min(1).max(5).error('Maksymalna liczba usług to 5'),
    }),
    defineField({
      name: 'galleryHeading',
      type: 'Heading',
      title: 'Nagłówek galerii',
      group: 'content',
      validation: (Rule) => Rule.required(),
      initialValue: [
        {
          _key: '8a0d68722eaf',
          _type: 'block',
          children: [
            {
              _key: 'b0c030ee3f460',
              _type: 'span',
              marks: [],
              text: 'Zobacz, jak łączymy ludzi w akcjach, które ',
            },
            {
              _key: 'b0c030ee3f461',
              _type: 'span',
              marks: ['strong'],
              text: 'nie mają sobie równych!',
            },
          ],
          markDefs: [],
          style: 'normal',
        },
      ],
    }),
    defineField({
      name: 'mediaArray',
      type: 'array',
      title: 'Galeria zdjęć i filmów',
      of: [
        {
          type: 'object',
          fields: [
            { type: 'image', name: 'image', title: 'Zdjęcie', validation: (Rule) => Rule.required() },
            {
              type: 'string',
              name: 'youtubeId',
              title: 'ID filmu z YouTube (opcjonalne)',
              description: (
                <>
                  Kiedy dodane, filmik z YouTube pojawi się zamiast zdjęcia przy przyblieniu. Zdjęcie wciąż będzie
                  sprawować rolę miniaturki. Identyfikator filmu YouTube można znaleźć w adresie URL filmu. Na przykład
                  w adresie URL https://www.youtube.com/watch?v=dQw4w9WgXcQ, ID filmu to dQw4w9WgXcQ.
                </>
              ),
            },
          ],
          preview: {
            select: {
              image: 'image',
              imageFilename: 'image.asset.originalFilename',
            },
            prepare: ({ image, imageFilename }) => ({
              title: imageFilename || 'Untitled Image',
              media: image,
            }),
          },
        },
      ],
      group: 'content',
      description: 'Dla optymalnego wyświetlania na stronie, zalecamy użycie 9 zdjęć i filmów.',
      validation: (Rule) =>
        Rule.required().min(5).max(9).error('Minimalna liczba zdjęć i filmów to 5, a maksymalna to 9'),
    }),
    defineField({
      name: 'challenge',
      type: 'Heading',
      title: 'Wyzwanie',
      fieldset: 'challengeSolutionWrapper',
      group: 'content',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'solution',
      type: 'Heading',
      title: 'Rozwiązanie',
      fieldset: 'challengeSolutionWrapper',
      group: 'content',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'results',
      type: 'Heading',
      title: 'Wyniki',
      fieldset: 'challengeSolutionWrapper',
      group: 'content',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'testimonial',
      type: 'object',
      title: 'Opinia klienta (opcjonalna)',
      group: 'testimonial',
      fields: [
        defineField({
          name: 'name',
          type: 'string',
          title: 'Imię i nazwisko',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'position',
          type: 'string',
          title: 'Stanowisko',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'company',
          type: 'string',
          title: 'Firma',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'logo',
          type: 'image',
          title: 'Logo firmy (opcjonalne)',
        }),
        defineField({
          name: 'photo',
          type: 'image',
          title: 'Zdjęcie klienta',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'content',
          type: 'Heading',
          title: 'Treść opinii',
          validation: (Rule) => Rule.required(),
        }),
      ],
    }),
    defineField({
      name: 'components',
      type: 'components',
      title: 'Komponenty podstrony (opcjonalne)',
      group: 'content',
    }),
    defineField({
      name: 'seo',
      type: 'seo',
      title: 'SEO',
      group: 'seo',
    }),
  ],
  fieldsets: [
    {
      name: 'challengeSolutionWrapper',
      title: 'Wyzwanie i rozwiązanie',
      description:
        'Wyzwanie i rozwiązanie opisuje przebieg integracji, problemy, które napotkała ekipa organizacyjna oraz rozwiązania, które zostały zastosowane.',
    },
  ],
  groups: [
    {
      name: 'content',
      title: 'Treść',
      icon: ComposeIcon,
    },
    {
      name: 'testimonial',
      title: 'Opinia klienta',
      icon: UserIcon,
    },
    {
      name: 'seo',
      title: 'SEO',
      icon: SearchIcon,
    },
  ],
  preview: {
    select: {
      title: 'title',
      image: 'primaryImage',
      slug: 'slug',
    },
    prepare: ({ title, image, slug }) => ({
      title: toPlainText(title),
      media: image,
      icon,
      subtitle: slug.current,
    }),
  },
})
