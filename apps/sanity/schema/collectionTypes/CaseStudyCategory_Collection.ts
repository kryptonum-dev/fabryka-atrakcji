import { FileSearch } from 'lucide-react'
import { defineField, defineType } from 'sanity'
import { defineSlugForDocument } from '../../utils/define-slug-for-document'

const icon = FileSearch

export default defineType({
  name: 'CaseStudyCategory_Collection',
  type: 'document',
  title: 'Kategorie realizacji',
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
      title: 'Nazwa kategorii',
      description: 'Nazwa wyświetlana w breadcrumbs oraz w schematach dla Google',
      validation: (Rule) => Rule.required(),
    }),
    ...defineSlugForDocument({
      source: 'name',
      prefixes: {
        pl: '/pl/realizacje/kategoria/',
        en: '/en/case-studies/category/',
      },
    }),
    defineField({
      name: 'seo',
      type: 'seo',
      title: 'SEO',
    }),
  ],
  preview: {
    select: {
      name: 'name',
      slug: 'slug.current',
    },
    prepare: ({ name, slug }) => ({
      title: name,
      subtitle: slug,
      icon,
    }),
  },
})
