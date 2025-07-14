import React from 'react'
import type { StructureBuilder, StructureResolverContext } from 'sanity/structure'
import { orderableDocumentListDeskItem } from '@sanity/orderable-document-list'
import { LANGUAGES, getLanguageFlag } from '../structure/languages'
import { schemaTypes } from '../structure/schema-types'
import { Preview } from './preview'

type Options = {
  orderable?: boolean
}

export const createCollection = (
  S: StructureBuilder,
  context: StructureResolverContext,
  name: string,
  options: Options = {}
) => {
  const { orderable = false } = options
  const {
    title,
    icon,
    options: schemaOptions,
    fields = [],
  } = schemaTypes.find((item) => item.name === name) as {
    title: string
    icon: React.ReactNode
    options: { documentPreview?: boolean }
    fields?: Array<{ name: string; type: string }>
  }
  const documentPreview = schemaOptions?.documentPreview ?? false
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

  if (orderable) {
    if (isInternationalized) {
      return S.listItem()
        .id(name)
        .title(title)
        .icon(icon)
        .child(
          S.list()
            .title(title)
            .items(
              LANGUAGES.map((lang) => {
                const Flag = lang.flag
                return orderableDocumentListDeskItem({
                  type: name,
                  title: lang.title,
                  icon: Flag || undefined,
                  id: `orderable-${name}-${lang.id}`,
                  filter: 'language == $lang',
                  params: { lang: lang.id },
                  S,
                  context,
                })
              })
            )
        )
    }

    return orderableDocumentListDeskItem({
      type: name,
      title: title,
      icon: typeof icon === 'function' ? icon : undefined,
      S,
      context,
    })
  }

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
