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

