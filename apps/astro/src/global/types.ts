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
