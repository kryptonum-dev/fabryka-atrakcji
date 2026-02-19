import { defineField } from 'sanity'

export default defineField({
  name: 'socialProof',
  type: 'object',
  title: 'Social Proof',
  fields: [
    defineField({
      name: 'clientLogos',
      type: 'array',
      title: 'Loga firm klientów',
      description: 'Loga firm, z którymi współpracowaliśmy (5-8 logo)',
      of: [{ type: 'image' }],
      validation: (Rule) => Rule.max(8),
    }),
    defineField({
      name: 'metrics',
      type: 'array',
      title: 'Metryki',
      description: 'np. "10+ lat doświadczenia", "200+ zrealizowanych eventów"',
      of: [{ type: 'string' }],
    }),
  ],
  options: {
    collapsible: true,
    collapsed: false,
  },
})
