import type { StructureResolver } from 'sanity/structure'
import { createCollection } from '../utils/create-collection'
import { createSingleton } from '../utils/create-singleton'

export const structure: StructureResolver = (S) =>
  S.list()
    .id('root')
    .title('Content')
    .items([
      createSingleton({ S, name: 'global' }),
      createSingleton({ S, name: 'redirects' }),
      S.divider(),
      createSingleton({ S, name: 'Index_Page' }),
      S.divider(),
      createCollection(S, 'Faq_Collection'),
    ])
