export type ConsentGroupId = 'necessary' | 'analytics' | 'preferences' | 'marketing'

export type ConsentSubGroupId = 'conversion_api' | 'advanced_matching'

export type ConsentGroupCopy = {
  name: string
  description: string
}

export type CookieConsentCopy = {
  heading: string
  description: string
  learnMore: string
  settingsHeading: string
  settingsDescription: string
  necessary: ConsentGroupCopy
  analytics: ConsentGroupCopy
  preferences: ConsentGroupCopy
  marketing: ConsentGroupCopy & {
    subGroups: Record<'conversionApi' | 'advancedMatching', ConsentGroupCopy>
  }
  buttons: {
    deny: string
    setPreferences: string
    agreeAll: string
  }
}

export type ConsentSubGroup = {
  id: ConsentSubGroupId
  name: string
  description: string
}

export type ConsentGroup = {
  id: ConsentGroupId
  name: string
  description: string
  subGroups?: ConsentSubGroup[]
}

export type ConsentSelections = {
  necessary: boolean
  analytics: boolean
  preferences: boolean
  marketing: boolean
  conversion_api: boolean
  advanced_matching: boolean
}

export type ConsentModeState = {
  functionality_storage: 'granted' | 'denied'
  security_storage: 'granted' | 'denied'
  ad_storage: 'granted' | 'denied'
  ad_user_data: 'granted' | 'denied'
  ad_personalization: 'granted' | 'denied'
  analytics_storage: 'granted' | 'denied'
  personalization_storage: 'granted' | 'denied'
  conversion_api: 'granted' | 'denied'
  advanced_matching: 'granted' | 'denied'
}

export type CookieConsentClientProps = {
  copy: CookieConsentCopy
  groups: ConsentGroup[]
  privacyPolicyUrl: string
  metaPixelId?: string | null
  ga4Id?: string | null
  googleAdsId?: string | null
}


