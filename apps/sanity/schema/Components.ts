import { defineType } from 'sanity'
import ActivitiesCarousel from './components/ActivitiesCarousel'
import AsymmetricalPhotoGalleryGrid from './components/AsymmetricalPhotoGalleryGrid'
import BackgroundImageWithCenteredHeading from './components/BackgroundImageWithCenteredHeading'
import CardListWithCta from './components/CardListWithCta'
import CardSteps from './components/CardSteps'
import CaseStudyList from './components/CaseStudyList'
import ContactForm from './components/ContactForm'
import Faq from './components/Faq'
import FloatingPointsList from './components/FloatingPointsList'
import GradientBackgroundCta from './components/GradientBackgroundCta'
import HighlightedBlogPosts from './components/HighlightedBlogPosts'
import LargeImageWithGridList from './components/LargeImageWithGridList'
import ListImageProccessGrid from './components/ListImageProccessGrid'
import Newsletter from './components/Newsletter'
import StepsList from './components/StepsList'
import Testimonials from './components/Testimonials'
import TextBlocksGrid from './components/TextBlocksGrid'
import FeaturedHotelsList from './components/FeaturedHotelsList'
import ImagesMarqueeSection from './components/ImagesMarqueeSection'
import BlockColumn from './components/BlockColumn'
export default defineType({
  name: 'components',
  type: 'array',
  title: 'Components',
  of: [
    CardSteps,
    GradientBackgroundCta,
    CaseStudyList,
    ActivitiesCarousel,
    LargeImageWithGridList,
    Testimonials,
    HighlightedBlogPosts,
    Newsletter,
    AsymmetricalPhotoGalleryGrid,
    StepsList,
    Faq,
    ContactForm,
    ListImageProccessGrid,
    CardListWithCta,
    FloatingPointsList,
    BackgroundImageWithCenteredHeading,
    TextBlocksGrid,
    FeaturedHotelsList,
    ImagesMarqueeSection,
    BlockColumn,
  ],
  options: {
    insertMenu: {
      filter: true,
      showIcons: true,
      views: [
        { name: 'grid', previewImageUrl: (schemaTypeName) => `/static/components/${schemaTypeName}.webp` },
        { name: 'list' },
      ],
    },
  },
})
