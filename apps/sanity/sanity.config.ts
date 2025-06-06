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
import { embeddingsIndexDashboard } from '@sanity/embeddings-index-ui'

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
    process.env.NODE_ENV === 'development'
      ? embeddingsIndexDashboard()
      : { name: 'embeddings-index-dashboard-disabled' },
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
    actions: (input, context) => {
      // For singleton types
      if (singletonTypes.has(context.schemaType)) {
        return input.filter(({ action }) => action && singletonActions.has(action))
      }

      // For Quotes_Collection - allow only viewing, deleting and custom actions
      if (context.schemaType === 'Quotes_Collection') {
        return input.filter(({ action }) => {
          // Allow custom actions (they don't have a standard action type)
          if (!action) return true

          // Allow only specific built-in actions
          return action === 'delete' || action === 'restore'
        })
      }

      // For all other types
      return input
    },
    newDocumentOptions: (prev, { creationContext }) => {
      const { type, schemaType } = creationContext
      if (type === 'structure' && (schemaType == 'SocialMedia_Collection' || schemaType == 'Quotes_Collection')) {
        return []
      }
      return prev
    },
  },
})
