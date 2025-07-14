import { BookOpen, FileArchive, Handshake, Hotel, House, HouseIcon, Receipt, Settings2, Users2Icon } from 'lucide-react'
import type { StructureResolver } from 'sanity/structure'
import { createCollection } from '../utils/create-collection'
import { createSingleton } from '../utils/create-singleton'
import { PricingSummaryView } from '../views/PricingSummaryView'

export const structure: StructureResolver = (S, context) =>
  S.list()
    .id('root')
    .title('Content')
    .items([
      createSingleton({ S, name: 'Index_Page' }),
      createCollection(S, context, 'Pages_Collection'),
      S.divider(),
      S.listItem()
        .title('Integracje')
        .icon(Handshake)
        .child(
          S.list()
            .title('Integracje')
            .items([
              createSingleton({ S, name: 'Activities_Page' }),
              createCollection(S, context, 'Activities_Collection'),
              createCollection(S, context, 'ActivitiesCategory_Collection', { orderable: true }),
              S.divider(),
              createCollection(S, context, 'ActivitiesType_Collection'),
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
              createCollection(S, context, 'Hotels_Collection'),
              S.divider(),
              createCollection(S, context, 'Locations_Collection'),
              createCollection(S, context, 'Amenities_Collection'),
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
              createCollection(S, context, 'CaseStudy_Collection'),
              createCollection(S, context, 'CaseStudyCategory_Collection'),
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
              createCollection(S, context, 'BlogPost_Collection'),
              createCollection(S, context, 'BlogCategory_Collection'),
              createCollection(S, context, 'Author_Collection'),
            ])
        ),
      createCollection(S, context, 'Testimonial_Collection'),
      createCollection(S, context, 'Faq_Collection'),
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
