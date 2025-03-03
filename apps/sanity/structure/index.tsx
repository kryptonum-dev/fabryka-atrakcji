import type { StructureResolver } from 'sanity/structure'
import { createCollection } from '../utils/create-collection'
import { createSingleton } from '../utils/create-singleton'
import { Settings2 } from 'lucide-react'
export const structure: StructureResolver = (S) =>
  S.list()
    .id('root')
    .title('Content')
    .items([
      createSingleton({ S, name: 'Index_Page' }),
      S.divider(),
      createCollection(S, 'Pages_Collection'),
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
