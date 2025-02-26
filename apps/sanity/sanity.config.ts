import { visionTool } from '@sanity/vision'
import { defineConfig } from 'sanity'
import { media } from 'sanity-plugin-media'
import { structureTool } from 'sanity/structure'
import { API_VERSION, DATASET, PROJECT_ID, STUDIO_HOST, TITLE } from './constants'
import { structure } from './structure'
import { schemaTypes, singletonActions, singletonTypes } from './structure/schema-types'

export default defineConfig({
  name: STUDIO_HOST,
  title: TITLE,
  projectId: PROJECT_ID,
  dataset: DATASET,
  apiVersion: API_VERSION,
  useCdn: false,
  plugins: [structureTool({ structure }), media(), visionTool()],

  schema: {
    types: schemaTypes,
    templates: (templates) => templates.filter(({ schemaType }) => !singletonTypes.has(schemaType)),
  },

  document: {
    actions: (input, context) =>
      singletonTypes.has(context.schemaType)
        ? input.filter(({ action }) => action && singletonActions.has(action))
        : input,
  },
})
