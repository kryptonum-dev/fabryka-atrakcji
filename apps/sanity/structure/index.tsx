import { BookOpen, FileArchive, Handshake, Hotel, House, HouseIcon, Receipt, Settings2, Users2Icon } from 'lucide-react'
import type { StructureResolver } from 'sanity/structure'
import { createCollection } from '../utils/create-collection'
import { createSingleton } from '../utils/create-singleton'
import { PricingSummaryView } from '../views/PricingSummaryView'

export const structure: StructureResolver = (S) =>
  S.list()
    .id('root')
    .title('Content')
    .items([
      createSingleton({ S, name: 'Index_Page' }),
      createCollection(S, 'Pages_Collection'),
      S.divider(),
      S.listItem()
        .title('Integracje')
        .icon(Handshake)
        .child(
          S.list()
            .title('Integracje')
            .items([
              createSingleton({ S, name: 'Activities_Page' }),
              createCollection(S, 'Activities_Collection'),
              createCollection(S, 'ActivitiesCategory_Collection'),
              S.divider(),
              createCollection(S, 'ActivitiesType_Collection'),
            ])
        ),
      S.listItem()
        .title('Hotele')
        .icon(Hotel)
        .child(
          S.list()
            .title('Hotele')
            .items([
              createSingleton({ S, name: 'Hotels_Page' }),
              createCollection(S, 'Hotels_Collection'),
              S.divider(),
              createCollection(S, 'Locations_Collection'),
              createCollection(S, 'Amenities_Collection'),
            ])
        ),
      S.listItem()
        .title('Realizacje')
        .icon(FileArchive)
        .child(
          S.list()
            .title('Realizacje')
            .items([
              createSingleton({ S, name: 'CaseStudy_Page' }),
              createCollection(S, 'CaseStudy_Collection'),
              createCollection(S, 'CaseStudyCategory_Collection'),
            ])
        ),
      S.listItem()
        .title('Wyceny')
        .icon(Receipt)
        .child(
          S.documentTypeList('Quotes_Collection')
            .title('Wyceny')
            .defaultOrdering([{ field: 'createdAt', direction: 'desc' }])
            .child((documentId) =>
              S.document()
                .documentId(documentId)
                .schemaType('Quotes_Collection')
                .views([
                  S.view.form().title('Dane podstawowe'),
                  S.view.component(PricingSummaryView).title('Podsumowanie cenowe'),
                ])
            )
        ),
      S.listItem()
        .title('Blog')
        .icon(BookOpen)
        .child(
          S.list()
            .title('Blog')
            .items([
              createSingleton({ S, name: 'Blog_Page' }),
              createCollection(S, 'BlogPost_Collection'),
              createCollection(S, 'BlogCategory_Collection'),
              createCollection(S, 'Author_Collection'),
            ])
        ),
      createCollection(S, 'Testimonial_Collection'),
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
              S.listItem()
                .title('Media społecznościowe')
                .icon(Users2Icon)
                .child(
                  S.documentTypeList('SocialMedia_Collection')
                    .title('Media społecznościowe')
                    .child((documentId) => S.document().documentId(documentId).schemaType('SocialMedia_Collection'))
                ),
              createSingleton({ S, name: 'Cart_Page' }),
              createSingleton({ S, name: 'Quote_Page' }),
              createSingleton({ S, name: 'ThankYouPage' }),
              createSingleton({ S, name: 'NotFound_Page' }),
              createSingleton({ S, name: 'TermsAndConditions_Page' }),
              createSingleton({ S, name: 'PrivacyPolicy_Page' }),
              createSingleton({ S, name: 'redirects' }),
            ])
        ),
    ])
