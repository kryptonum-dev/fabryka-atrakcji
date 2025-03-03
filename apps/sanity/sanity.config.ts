import { assist } from '@sanity/assist'
import { documentInternationalization } from '@sanity/document-internationalization'
import { visionTool } from '@sanity/vision'
import { defineConfig } from 'sanity'
import { media } from 'sanity-plugin-media-i18n'
import { structureTool } from 'sanity/structure'
import { API_VERSION, DATASET, PROJECT_ID, STUDIO_HOST, TITLE } from './constants'
import { Logo } from './schema/ui/logo'
import { structure } from './structure'
import { LANGUAGES } from './structure/languages'
import { i18nTypes, schemaTypes, singletonActions, singletonTypes } from './structure/schema-types'

export default defineConfig({
  name: STUDIO_HOST,
  title: TITLE,
  projectId: PROJECT_ID,
  dataset: DATASET,
  apiVersion: API_VERSION,
  useCdn: false,
  icon: Logo,
  plugins: [
    structureTool({ structure }),
    media({
      locales: LANGUAGES.map(({ id, title }) => ({ id: id, name: title })),
    }),
    visionTool(),
    documentInternationalization({
      supportedLanguages: LANGUAGES,
      schemaTypes: i18nTypes,
    }),
    assist({
      translate: {
        document: {
          languageField: 'language',
        },
      },
    }),
  ],

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
