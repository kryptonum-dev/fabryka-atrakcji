import type { AnalyticsUser, AnalyticsUtm } from '@/global/analytics/types'
import {
  loadAnalyticsUser,
  loadAnalyticsUtm,
  saveAnalyticsUser,
  saveAnalyticsUtm,
} from './analytics-user-storage'

export type TrackEventUser = AnalyticsUser

type MetaEventName =
  | 'PageView'
  | 'ViewContent'
  | 'ViewCategory'
  | 'Search'
  | 'AddToCart'
  | 'RemoveFromCart'
  | 'InitiateCheckout'
  | 'AddPaymentInfo'
  | 'Purchase'
  | 'Lead'
  | 'Contact'
  | 'ViewCart'
  | 'CompleteRegistration'
  | 'PageScroll'
  | 'TimeOnPage'
  | 'Form'
  | 'Login'
  | 'Logout'
  | 'Download'

type MetaEventParamsMap = {
  CompleteRegistration: Record<string, never>
  PageView: {
    page_path?: string
    page_title?: string
  }
  ViewCategory: {
    category_id?: string
    category_name?: string
    value?: number
    currency?: string
    content_ids?: string[]
  }
  ViewContent: {
    content_ids?: string[]
    content_type?: string
    content_category?: string
    value?: number
    currency?: string
  }
  Search: {
    search_string?: string
  }
  AddToCart: {
    content_ids?: string[]
    content_type?: string
    value?: number
    currency?: string
    quantity?: number
  }
  RemoveFromCart: {
    content_ids?: string[]
    content_type?: string
    value?: number
    currency?: string
    quantity?: number
  }
  InitiateCheckout: {
    value?: number
    currency?: string
    content_ids?: string[]
  }
  AddPaymentInfo: {
    payment_type?: string
    value?: number
    currency?: string
  }
  Purchase: {
    value: number
    currency: string
    order_id?: string
  }
  Lead: {
    form_name?: string
    content_name?: string
    value?: number
    currency?: string
  }
  Contact: {
    contact_type?: string
    contact_value?: string
  }
  ViewCart: {
    value?: number
    currency?: string
    content_ids?: string[]
  }
  PageScroll: {
    percent_scrolled?: number
  }
  TimeOnPage: {
    seconds?: number
  }
  Form: {
    form_name?: string
    success?: boolean
  }
  Login: Record<string, never>
  Logout: Record<string, never>
  Download: {
    file_name?: string
    file_type?: string
  }
}

type Ga4EventName =
  | 'sign_up'
  | 'page_view'
  | 'view_item_list'
  | 'view_item'
  | 'search'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'begin_checkout'
  | 'add_payment_info'
  | 'purchase'
  | 'scroll'
  | 'engagement_time'
  | 'generate_lead'
  | 'form_submit'
  | 'login'
  | 'logout'
  | 'file_download'
  | 'lead'
  | 'contact'
  | 'view_cart'

type Ga4EventParamsMap = {
  sign_up: {
    method?: string
  }
  page_view: {
    page_location?: string
    page_title?: string
    page_path?: string
  }
  view_item_list: {
    item_list_id?: string
    item_list_name?: string
    items?: Array<Record<string, unknown>>
  }
  view_item: {
    currency?: string
    value?: number
    items?: Array<Record<string, unknown>>
  }
  search: {
    search_term?: string
  }
  add_to_cart: {
    currency?: string
    value?: number
    items?: Array<Record<string, unknown>>
  }
  remove_from_cart: {
    currency?: string
    value?: number
    items?: Array<Record<string, unknown>>
  }
  begin_checkout: {
    currency?: string
    value?: number
    items?: Array<Record<string, unknown>>
    coupon?: string
  }
  add_payment_info: {
    currency?: string
    value?: number
    items?: Array<Record<string, unknown>>
    payment_type?: string
  }
  purchase: {
    currency: string
    transaction_id: string
    value: number
    tax?: number
    shipping?: number
    coupon?: string
    items?: Array<Record<string, unknown>>
  }
  scroll: {
    percent_scrolled?: number
  }
  engagement_time: {
    seconds?: number
  }
  generate_lead: {
    form_name?: string
    value?: number
  }
  form_submit: {
    form_name?: string
  }
  login: {
    method?: string
  }
  logout: {
    method?: string
  }
  file_download: {
    file_name?: string
    file_extension?: string
  }
  lead: {
    form_name?: string
    value?: number
  }
  contact: {
    contact_type?: string
    contact_value?: string
  }
  view_cart: {
    currency?: string
    value?: number
    items?: Array<Record<string, unknown>>
  }
}

export type TrackEventMeta<T extends MetaEventName = MetaEventName> = {
  eventName: T
  params?: MetaEventParamsMap[T]
  contentName?: string
}

export type TrackEventGa4<T extends Ga4EventName = Ga4EventName> = {
  eventName: T
  params?: Ga4EventParamsMap[T]
}

export type TrackEventParams<
  TMeta extends MetaEventName = MetaEventName,
  TGa4 extends Ga4EventName = Ga4EventName
> = {
  eventId?: string
  url?: string
  user?: TrackEventUser
  meta?: TrackEventMeta<TMeta>
  ga4?: TrackEventGa4<TGa4>
}

const UTM_PARAM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const
type UtmKey = (typeof UTM_PARAM_KEYS)[number]

type MetaRequestBodyPayload = {
  event_name: MetaEventName
  content_name?: string
  url: string
  event_id: string
  event_time: number
  user?: TrackEventUser
  custom_event_params?: Record<string, unknown>
  utm?: Partial<Record<UtmKey, string>>
}

function extractUtmFromUrl(url?: string | null): Partial<Record<UtmKey, string>> | undefined {
  if (!url) return undefined
  try {
    const base =
      typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'https://placeholder.local'
    const parsed = new URL(url, base)
    const params: Partial<Record<UtmKey, string>> = {}
    for (const key of UTM_PARAM_KEYS) {
      const value = parsed.searchParams.get(key)
      if (value) params[key] = value
    }
    return Object.keys(params).length ? params : undefined
  } catch {
    return undefined
  }
}

function resolveUtmPayload(utm?: AnalyticsUtm | null): Partial<Record<UtmKey, string>> | undefined {
  if (!utm) return undefined
  const { capturedAt, ...rest } = utm
  const entries = Object.entries(rest).filter(([, value]) => value !== undefined && value !== null && value !== '')
  return entries.length ? (Object.fromEntries(entries) as Partial<Record<UtmKey, string>>) : undefined
}

type FbqFunction = ((...args: unknown[]) => void) & {
  loaded?: boolean
  queue?: unknown[]
  callMethod?: (...args: unknown[]) => void
}

type WindowWithFbq = Window & {
  _fbq?: FbqFunction
  fbq?: FbqFunction
  gtag?: (...args: unknown[]) => void
  __metaPixelId?: string
  __metaPixelAdvancedMatching?: boolean
}

type PendingEvent<
  TMeta extends MetaEventName = MetaEventName,
  TGa4 extends Ga4EventName = Ga4EventName
> = Required<Pick<TrackEventParams<TMeta, TGa4>, 'eventId'>> & {
  url: string
  eventTime: number
  user?: TrackEventUser
  meta?: TrackEventMeta<TMeta>
  ga4?: TrackEventGa4<TGa4>
  utm?: AnalyticsUtm
  attempt?: number
  awaitingReady?: boolean
  gaDispatched?: boolean
  capiDispatched?: boolean
}

const COOKIE_NAME = 'cookie-consent'
const pendingEvents: PendingEvent[] = []
let waitingForConsent = false
let waitingForReadiness = false
const MAX_META_RETRIES = 3
const MAX_GA4_RETRIES = 3
const META_STANDARD_EVENTS = new Set<MetaEventName>([
  'PageView',
  'ViewContent',
  'Search',
  'AddToCart',
  'InitiateCheckout',
  'AddPaymentInfo',
  'Purchase',
  'CompleteRegistration',
])

type ConsentMode = {
  ad_storage?: 'granted' | 'denied'
  analytics_storage?: 'granted' | 'denied'
  ad_user_data?: 'granted' | 'denied'
  ad_personalization?: 'granted' | 'denied'
  conversion_api?: 'granted' | 'denied'
  advanced_matching?: 'granted' | 'denied'
}

function normalizeUser(user?: TrackEventUser | null): TrackEventUser | undefined {
  if (!user) return undefined
  const entries = Object.entries(user).filter(([, value]) => value !== undefined && value !== null && value !== '')
  if (!entries.length) return undefined
  return Object.fromEntries(entries) as TrackEventUser
}

function mergeUserData(
  user?: TrackEventUser,
  options: { persist?: boolean } = {}
): TrackEventUser | undefined {
  const stored = normalizeUser(loadAnalyticsUser())
  const provided = normalizeUser(user)
  if (!stored && !provided) return undefined
  const merged: TrackEventUser = {
    ...(stored ?? {}),
    ...(provided ?? {}),
  }

  if (options.persist && typeof window !== 'undefined' && provided) {
    if (!stored || hasUserDifference(stored, merged)) {
      saveAnalyticsUser(merged)
    }
  }

  return merged
}

function hasUserDifference(
  previous: TrackEventUser | undefined,
  next: TrackEventUser | undefined
): boolean {
  if (!previous && next) return true
  if (previous && !next) return true
  const previousEntries = previous ? Object.entries(previous) : []
  const nextEntries = next ? Object.entries(next) : []
  if (previousEntries.length !== nextEntries.length) return true
  const nextMap = new Map(nextEntries)
  for (const [key, value] of previousEntries) {
    if (!Object.is(nextMap.get(key), value)) {
      return true
    }
  }
  return false
}

function getCookie(name: string) {
  if (typeof document === 'undefined') return null
  const parts = `; ${document.cookie}`.split(`; ${name}=`)
  if (parts.length === 2) return decodeURIComponent(parts.pop()!.split(';').shift()!)
  return null
}

function parseConsent(): ConsentMode {
  const raw = getCookie(COOKIE_NAME)
  if (!raw) return {}
  try {
    return JSON.parse(raw) as ConsentMode
  } catch {
    return {}
  }
}

function isAnalyticsReady() {
  if (typeof window === 'undefined') return false
  return window.__analyticsReady === true
}

function hasConsentDecision() {
  return Boolean(getCookie(COOKIE_NAME))
}

function enqueue(
  event: PendingEvent,
  options: { waitForConsent?: boolean; waitForReadiness?: boolean } = {}
) {
  pendingEvents.push(event)
  if (options.waitForConsent && !waitingForConsent) {
    waitingForConsent = true
    document.addEventListener(
      'cookie_consent_updated',
      () => {
        waitingForConsent = false
        if (!waitingForReadiness) {
          flushQueue()
        }
      },
      { once: true }
    )
  }

  if (options.waitForReadiness && !waitingForReadiness) {
    waitingForReadiness = true
    document.addEventListener(
      'analytics_ready',
      () => {
        waitingForReadiness = false
        if (!waitingForConsent) {
          flushQueue()
        }
      },
      { once: true }
    )
  }
}

function flushQueue() {
  while (pendingEvents.length) {
    const event = pendingEvents.shift()!
    sendEvent(event)
  }
}

function flushFbqQueue(fbqFn: FbqFunction) {
  if (typeof window === 'undefined') return
  const windowWithFbq = window as WindowWithFbq
  const queue = windowWithFbq._fbq?.queue
  if (!Array.isArray(queue) || typeof fbqFn.callMethod !== 'function') {
    return
  }

  while (queue.length) {
    const args = queue.shift()
    if (!Array.isArray(args)) continue
    try {
      fbqFn.callMethod.apply(fbqFn, args as [])
    } catch (err) {
      console.error('[Meta] fbq manual flush failed', err)
    }
  }
}

function sendEvent(event: PendingEvent) {
  const { meta, ga4 } = event
  const attempt = event.attempt ?? 0

  if (!isAnalyticsReady()) {
    if (event.awaitingReady) {
      return
    }
    enqueue({ ...event, awaitingReady: true }, { waitForReadiness: true })
    return
  }

  const processedEvent = event.awaitingReady ? { ...event, awaitingReady: false } : event
  const resolvedUser = mergeUserData(processedEvent.user, { persist: true })
  processedEvent.user = resolvedUser

  const consent = parseConsent()
  const marketingGranted = consent.ad_storage === 'granted' || consent.ad_user_data === 'granted'
  const conversionApiGranted = consent.conversion_api === 'granted'

  const canSendMetaPixel = Boolean(meta && marketingGranted)
  const canSendMetaCapi = Boolean(meta && conversionApiGranted)

  const utmPayload = resolveUtmPayload(processedEvent.utm)

  if (meta && (canSendMetaPixel || canSendMetaCapi)) {
    const metaParams = { ...(meta.params ?? {}) } as Record<string, unknown>
    if (meta.contentName) {
      metaParams.content_name = meta.contentName
    }
    const metaPayload = Object.keys(metaParams).length > 0 ? metaParams : {}

    if (canSendMetaCapi && !processedEvent.capiDispatched) {
      const metaBody: MetaRequestBodyPayload = {
        event_name: meta.eventName,
        content_name: meta.contentName,
        url: processedEvent.url,
        event_id: processedEvent.eventId,
        event_time: Math.floor(processedEvent.eventTime / 1000),
        user: resolvedUser,
        custom_event_params: meta.params as Record<string, unknown> | undefined,
      }
      if (utmPayload) {
        metaBody.utm = utmPayload
      }

      let dispatchedViaBeacon = false
      if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
        try {
          const beaconPayload = JSON.stringify(metaBody)
          const beaconResult = navigator.sendBeacon(
            '/api/analytics/meta',
            new Blob([beaconPayload], { type: 'application/json' })
          )
          if (beaconResult) {
            processedEvent.capiDispatched = true
            dispatchedViaBeacon = true
          }
        } catch (err) {
          console.error('[Meta] sendBeacon failed', err)
        }
      }

      if (!dispatchedViaBeacon) {
        try {
          void fetch('/api/analytics/meta', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            keepalive: true,
            body: JSON.stringify(metaBody),
          }).then(async (res) => {
            if (!res.ok) {
              console.error('[Meta] trackEvent failed', await res.text())
            }
          })
          processedEvent.capiDispatched = true
        } catch (err) {
          console.error('[Meta] trackEvent fetch error', err)
        }
      }
    }

    if (canSendMetaPixel) {
      const windowWithFbq = window as WindowWithFbq
      if (windowWithFbq.__metaPixelAdvancedMatching) {
        const payload = buildAdvancedMatchingPayload(processedEvent.user)
        if (payload) {
          applyMetaPixelUserData(windowWithFbq.__metaPixelId, payload)
        }
      }

      if (typeof window.fbq === 'function') {
        const fbqFn = window.fbq as FbqFunction
        try {
          const method = META_STANDARD_EVENTS.has(meta.eventName) ? 'track' : 'trackCustom'
          const args: Parameters<FbqFunction> = [
            method,
            meta.eventName,
            metaPayload,
            {
              eventID: processedEvent.eventId,
            },
          ]
          
          if (typeof fbqFn.callMethod === 'function') {
            flushFbqQueue(fbqFn)
            fbqFn.callMethod.apply(fbqFn, args)
            flushFbqQueue(fbqFn)
          } else {
            fbqFn(...args)
            setTimeout(() => {
              flushFbqQueue(fbqFn)
            }, 250)
          }
        } catch (err) {
          console.error('[Meta] fbq tracking failed', err)
        }
      } else if (attempt < MAX_META_RETRIES) {
        setTimeout(() => {
          sendEvent({
            ...processedEvent,
            attempt: attempt + 1,
            gaDispatched: processedEvent.gaDispatched,
            capiDispatched: processedEvent.capiDispatched,
          })
        }, 200)
      }
    }
  }

  const canSendGa4 = Boolean(ga4)
  if (canSendGa4 && ga4) {
    if (typeof window.gtag === 'function') {
      if (!processedEvent.gaDispatched) {
        try {
          const params = { ...(ga4.params ?? {}), event_id: processedEvent.eventId }
          window.gtag('event', ga4.eventName, params)
          processedEvent.gaDispatched = true
        } catch (err) {
          console.error(`[GA4] trackEvent error for ${ga4.eventName}`, err)
        }
      }
    } else if (attempt < MAX_GA4_RETRIES) {
      setTimeout(() => {
        sendEvent({
          ...processedEvent,
          attempt: attempt + 1,
          awaitingReady: false,
          gaDispatched: processedEvent.gaDispatched,
        })
      }, 200)
    }
  }
}

export function trackEvent<
  TMeta extends MetaEventName = MetaEventName,
  TGa4 extends Ga4EventName = Ga4EventName
>(params: TrackEventParams<TMeta, TGa4>): string {
  if (typeof window === 'undefined') {
    return params.eventId || (typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2))
  }

  const now = Date.now()
  const eventId = params.eventId || (typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2))

  const eventUrl = params.url || window.location.href
  const providedUser = normalizeUser(params.user)
  const existingUtm = loadAnalyticsUtm()
  const urlUtm = extractUtmFromUrl(eventUrl)
  const activeUtm = urlUtm ? saveAnalyticsUtm(urlUtm) ?? existingUtm : existingUtm
  const event: PendingEvent = {
    eventId,
    url: eventUrl,
    eventTime: now,
    user: providedUser,
    meta: params.meta,
    ga4: params.ga4,
    utm: activeUtm ?? undefined,
  }

  if (!params.meta && !params.ga4) {
    return eventId
  }

  const needsConsent = !hasConsentDecision()
  const needsReadiness = !isAnalyticsReady()

  if (needsConsent) {
    if (params.meta) {
      enqueue(
        { ...event, ga4: undefined },
        { waitForConsent: true, waitForReadiness: needsReadiness }
      )
    }
    if (params.ga4) {
      const ga4Event = { ...event, meta: undefined }
      if (needsReadiness) {
        enqueue(ga4Event, { waitForConsent: false, waitForReadiness: true })
      } else {
        sendEvent(ga4Event)
      }
    }
    return eventId
  }

  if (needsReadiness) {
    enqueue(event, { waitForConsent: false, waitForReadiness: true })
    return eventId
  }

  sendEvent(event)
  return eventId
}

if (typeof window !== 'undefined') {
  window.trackEvent = trackEvent
}

function buildAdvancedMatchingPayload(user?: TrackEventUser | null) {
  const normalized = normalizeUser(user)
  if (!normalized) return null

  const payload: Record<string, string> = {}
  if (normalized.email) payload.em = normalized.email.trim().toLowerCase()

  if (normalized.phone) {
    const phone = phoneToE164(normalized.phone)
    if (phone) payload.ph = phone
  }

  if (normalized.first_name) payload.fn = normalized.first_name.trim().toLowerCase()
  if (normalized.last_name) payload.ln = normalized.last_name.trim().toLowerCase()
  if (normalized.city) payload.ct = normalized.city.trim().toLowerCase()
  if (normalized.postal_code) payload.zp = normalized.postal_code.trim().toLowerCase()
  if (normalized.country_code) payload.country = normalized.country_code.trim().toLowerCase()
  if (normalized.external_id) payload.external_id = normalized.external_id.toString().trim()

  return Object.keys(payload).length ? payload : null
}

function phoneToE164(raw: string | number, defaultCountry = '+48') {
  const stringified = typeof raw === 'number' ? String(raw) : raw
  const normalized = stringified.replace(/[^ 0-9+]/g, '')
  if (!normalized) return undefined
  if (normalized.startsWith('+')) return normalized
  if (normalized.startsWith('00')) return `+${normalized.slice(2)}`
  return `${defaultCountry}${normalized}`
}

type MetaPixelInstance = {
  userData?: Record<string, unknown>
  userDataFormFields?: Record<string, unknown>
}

type FbqWithInstance = FbqFunction & {
  instance?: {
    pixelsByID?: Record<string, MetaPixelInstance | undefined>
  }
}

function applyMetaPixelUserData(pixelId: string | undefined, payload: Record<string, string>) {
  if (!pixelId) {
    return
  }

  const fbqGlobal = window.fbq as FbqWithInstance | undefined
  const pixelInstance = fbqGlobal?.instance?.pixelsByID?.[pixelId]

  if (!pixelInstance) {
    console.warn('[Meta] userData skipped – pixel instance not ready', {
      pixelId,
      hasInstance: Boolean(fbqGlobal?.instance),
    })
    return
  }

  pixelInstance.userData = {
    ...(pixelInstance.userData ?? {}),
    ...payload,
  }

  pixelInstance.userDataFormFields = {
    ...(pixelInstance.userDataFormFields ?? {}),
    ...payload,
  }
}

