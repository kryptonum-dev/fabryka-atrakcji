import type { ButtonDataProps } from '../components/ui/Button'
import type { ImageDataProps } from '../components/ui/image'
import type { PortableTextValue } from '../components/ui/portable-text'

export type FormStateTypes = {
  success: {
    heading: PortableTextValue
    paragraph: PortableTextValue
    highlightedSocialMedia: {
      name: string
      link: string
      iconString: string
    }[]
  }
  error: {
    heading: PortableTextValue
    paragraph: PortableTextValue
  }
}

export type FormStatusTypes = {
  sending: boolean
  success: boolean | undefined
}

export type ClientFormStateTypes = {
  success: {
    heading: string
    paragraph: string
    highlightedSocialMedia: {
      name: string
      link: string
      iconString: string
    }[]
  }
  error: {
    heading: string
    paragraph: string
  }
}

export type BaseHotelProps = {
  _id: string
  id: string
  hotelsPage: {
    name: string
    slug: string
  }
  _type: 'Hotels_Collection'
  name: string
  slug: string
  title: PortableTextValue
  description: string
  imageList: ImageDataProps[]
  amenities: Array<{
    _id: string
    name: string
    icon?: any
  }>
  location: {
    _id: string
    name: string
  }
  stars: number
  numberOfRooms: number
  maxPeople: {
    overnight: number
    conference?: number
    banquet?: number
  }
  address: {
    street: string
    postalCode: string
    city: string
    voivodeship: string
  }
  googleMaps: {
    googleMapsLink: string
  }
  popularityIndex: number
  pricing: {
    pricingVisible?: boolean
    hasFixedGroupPrice?: boolean
    groupPrice?: number
    groupPeopleCount?: number
    pricePerPerson: number
  }
  addons?: AddonProps
  alerts?: Alert[]
}

export type Alert = {
  heading: any
  paragraph?: any
  cta: {
    text: string
    internalReference: {
      _id: string
      name: string
      slug: string
    }
  }
}

export type BaseActivityProps = {
  _id: string
  id: string
  name: string
  slug: string
  title: PortableTextValue
  description: string
  imageList: ImageDataProps[]
  categories: Array<{
    name: string
    slug: string
  }>
  activityType: Array<{
    name: string
    slug: string
  }>
  participantsCount: {
    min: number
    max: number
  }
  duration: {
    isFullDay: boolean
    hours?: number
  }
  location: {
    isNationwide: boolean
    customLocation?: string
    googleMapsLink?: string
    isIndoor: 'indoor' | 'outdoor'
  }
  languages: string[]
  popularityIndex: number
  pricing: {
    basePrice: number
    maxParticipants: number
    additionalPersonPrice: number
  }
  addons?: AddonProps
  alerts?: Alert[]
}

export type AddonProps = {
  hasAddons: boolean
  heading?: PortableTextValue
  addonsChoice?: 'unlimited' | 'limited'
  minOneAddon?: boolean
  addonsLayout?: 'vertical' | 'horizontal'
  addonsHaveImage?: boolean
  addonsList?: Array<AddonItem>
  additionalInfo?: string
  fullAddonsList?: Array<AddonItem>
}

export type AddonItem = {
  _key: string
  name: string
  image?: ImageDataProps
  pricing: {
    type: 'fixed' | 'per_unit' | 'threshold' | 'individual'
    fixedPrice?: number
    perUnit?: {
      price: number
      hasCount: boolean
      singular: string
      plural: string
    }
    threshold?: {
      basePrice: number
      maxUnits: number
      additionalPrice: number
      singular: string
      plural: string
    }
  }
  description?: string
}

export type ExtraItem = {
  _key: string
  name: string
  image: ImageDataProps
  pricing: {
    type: string
    pricePerKm?: number
    fixedPrice: number
    threshold: {
      basePrice: number
      maxUnits: number
      additionalPrice: number
      singular: boolean
    }
  }
}
