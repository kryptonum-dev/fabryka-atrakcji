import { FileArchive, Handshake, Settings2 } from 'lucide-react'
import type { StructureResolver } from 'sanity/structure'
import { createCollection } from '../utils/create-collection'
import { createSingleton } from '../utils/create-singleton'
export const structure: StructureResolver = (S) =>
  S.list()
    .id('root')
    .title('Content')
    .items([
      createSingleton({ S, name: 'Index_Page' }),
      S.divider(),
      createCollection(S, 'Pages_Collection'),
      S.listItem()
        .title('Realizacje')
        .icon(FileArchive)
        .child(
          S.list()
            .title('Realizacje')
            .items([createSingleton({ S, name: 'CaseStudy_Page' }), createCollection(S, 'CaseStudy_Collection')])
        ),
      S.listItem()
        .title('Integracje')
        .icon(Handshake)
        .child(
          S.list()
            .title('Integracje')
            .items([createSingleton({ S, name: 'Activities_Page' }), createCollection(S, 'Activities_Collection')])
        ),
      createCollection(S, 'Faq_Collection'),
      S.divider(),
      S.listItem()
        .title('Konfiguracja strony')
        .icon(Settings2)
        .child(
          S.list()
            .title('Konfiguracja strony')
            .items([
              createSingleton({ S, name: 'navbar' }),
              createSingleton({ S, name: 'footer' }),
              createSingleton({ S, name: 'global' }),
              createSingleton({ S, name: 'redirects' }),
            ])
        ),
    ])
