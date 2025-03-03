import React from 'react'
import type { StructureBuilder } from 'sanity/structure'
import { LANGUAGES, getLanguageFlag } from '../structure/languages'
import { schemaTypes } from '../structure/schema-types'
import { Preview } from './preview'

export const createCollection = (S: StructureBuilder, name: string) => {
  const {
    title,
    icon,
    options,
    fields = [],
  } = schemaTypes.find((item) => item.name === name) as {
    title: string
    icon: React.ReactNode
    options: { documentPreview?: boolean }
    fields?: Array<{ name: string; type: string }>
  }
  const documentPreview = options?.documentPreview ?? false
  const isInternationalized = fields.some((field) => field.name === 'language')

  const views = [
    S.view
      .form()
      .title('Editor')
      .icon(() => '🖋️'),
    ...(documentPreview
      ? [
          S.view
            .component(Preview)
            .title('Preview')
            .icon(() => '👀'),
        ]
      : []),
  ]

  return S.listItem()
    .id(name)
    .title(title)
    .icon(icon)
    .child(
      isInternationalized
        ? S.list()
            .title(title)
            .items(
              LANGUAGES.map((lang) => {
                const Flag = lang.flag
                return S.listItem()
                  .title(lang.title)
                  .icon(() => (Flag ? <Flag /> : icon))
                  .child(
                    S.documentTypeList(name)
                      .title(lang.title)
                      .filter('_type == $type && language == $lang')
                      .params({ type: name, lang: lang.id })
                      .apiVersion('2024-12-31')
                      .child((documentId) => S.document().documentId(documentId).schemaType(name).views(views))
                      .initialValueTemplates([S.initialValueTemplateItem(`${name}-${lang.id}`)])
                  )
              })
            )
        : S.documentTypeList(name)
            .defaultLayout('detail')
            .title(title)
            .child((documentId) => S.document().documentId(documentId).schemaType(name).views(views))
    )
}
