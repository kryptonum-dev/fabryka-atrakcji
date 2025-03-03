import type { StructureBuilder } from 'sanity/structure'
import { LANGUAGES } from '../structure/languages'
import { schemaTypes } from '../structure/schema-types'
import { Preview } from './preview'

// Define the language type locally if import doesn't work
type Language = {
  id: string
  title: string
  flag: React.FC
}

export const createSingleton = ({ S, name }: { S: StructureBuilder; name: string }) => {
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
        ? S.documentTypeList(name)
            .defaultLayout('detail')
            .id(name)
            .title(title)
            .filter('_type == $type')
            .params({ type: name })
            .child((documentId) => S.document().documentId(documentId).schemaType(name).views(views))
        : S.document().documentId(name).schemaType(name).views(views)
    )
}
