export type AnalyticsUser = {
  email?: string
  phone?: string
  first_name?: string
  last_name?: string
  name?: string
  external_id?: string | number
  postal_code?: string
  city?: string
  country_code?: string
  state?: string
  address?: string
  [key: string]: unknown
}

export type AnalyticsUtm = {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_term?: string
  utm_content?: string
  capturedAt: number
}

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (command: string, ...args: unknown[]) => void
    fbq?: (...args: unknown[]) => void
    trackEvent?: typeof import('@/utils/track-event').trackEvent
    __analyticsReady?: boolean
    __pageViewTracked?: boolean
  }
}

export {}

