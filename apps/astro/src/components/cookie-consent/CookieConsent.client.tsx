import { useCallback, useEffect, useRef, useState } from 'preact/hooks'
import type { JSX, RefObject } from 'preact'

import Button from '@/components/ui/Button'
import Switch from '@/components/ui/Switch'
import { loadAnalyticsUser, normalizeAnalyticsUser } from '@/utils/analytics-user-storage'
import { setCookie } from '@/utils/set-cookie'

import '@/components/cookie-consent/CookieConsent.client.scss'

import type {
  ConsentModeState,
  ConsentSelections,
  CookieConsentClientProps,
  ConsentGroup,
  ConsentSubGroup,
} from './CookieConsent.types'

const COOKIE_NAME = 'cookie-consent'
const CONSENT_ACCEPT_TTL_DAYS = 365
const CONSENT_DENY_TTL_DAYS = 30 / (24 * 60) // 30 minutes

const DENIED_CONSENT_MODE: ConsentModeState = {
  functionality_storage: 'denied',
  security_storage: 'denied',
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
  personalization_storage: 'denied',
  conversion_api: 'denied',
  advanced_matching: 'denied',
}

const DEFAULT_SELECTIONS: ConsentSelections = {
  necessary: true,
  analytics: false,
  preferences: false,
  marketing: false,
  conversion_api: false,
  advanced_matching: false,
}

const loadedMetaPixels = new Set<string>()
let gtagScriptPromise: Promise<void> | null = null
let metaPixelScriptPromise: Promise<void> | null = null

type FbqBootstrap = ((...args: unknown[]) => void) & {
  push: (...args: unknown[]) => void
  queue: unknown[][]
  loaded: boolean
  version: string
}

type WindowWithFbq = Window & { _fbq?: typeof window.fbq }

function isBrowser() {
  return typeof window !== 'undefined'
}

function setAnalyticsReady(ready: boolean) {
  if (!isBrowser()) {
    return
  }
  window.__analyticsReady = ready
  if (ready) {
    document.dispatchEvent(new Event('analytics_ready'))
  }
}

function phoneToE164(raw?: string, defaultCountry = '+48') {
  if (!raw) return undefined
  const normalized = raw.replace(/[^\d+]/g, '')
  if (!normalized) return undefined
  if (normalized.startsWith('+')) return normalized
  if (normalized.startsWith('00')) return `+${normalized.slice(2)}`
  return `${defaultCountry}${normalized}`
}

function buildAdvancedMatching(selection: ConsentSelections) {
  if (!selection.advanced_matching) return null
  const user = normalizeAnalyticsUser(loadAnalyticsUser())
  if (!user) return null

  const payload: Record<string, string> = {}
  if (user.email) payload.em = user.email.trim().toLowerCase()
  if (user.phone) {
    const phone = phoneToE164(user.phone)
    if (phone) payload.ph = phone
  }
  if (user.first_name) payload.fn = user.first_name.trim().toLowerCase()
  if (user.last_name) payload.ln = user.last_name.trim().toLowerCase()
  if (user.city) payload.ct = user.city.trim().toLowerCase()
  if (user.postal_code) payload.zp = user.postal_code.trim().toLowerCase()
  if (user.country_code) payload.country = user.country_code.trim().toLowerCase()
  if (user.external_id) payload.external_id = user.external_id.toString().trim()

  return Object.keys(payload).length ? payload : null
}

function resolveConsentTtl(selection: ConsentSelections) {
  const hasOptionalConsent =
    selection.analytics || selection.preferences || selection.marketing || selection.conversion_api || selection.advanced_matching
  return hasOptionalConsent ? CONSENT_ACCEPT_TTL_DAYS : CONSENT_DENY_TTL_DAYS
}

function bootstrapMetaPixel() {
  if (!isBrowser()) {
    return
  }

  if (typeof window.fbq === 'function') {
    return
  }

  const fbq: FbqBootstrap = ((...args: unknown[]) => {
    fbq.queue.push(args)
  }) as FbqBootstrap

  fbq.push = (...args: unknown[]) => {
    fbq.queue.push(args)
  }
  fbq.queue = []
  fbq.loaded = true
  fbq.version = '2.0'

  window.fbq = fbq
    ; (window as WindowWithFbq)._fbq = fbq
}

function loadMetaPixelScript() {
  if (!isBrowser()) {
    return Promise.resolve()
  }

  if (metaPixelScriptPromise) {
    return metaPixelScriptPromise
  }

  metaPixelScriptPromise = new Promise((resolve) => {
    const existing = document.getElementById('meta-pixel-script') as HTMLScriptElement | null
    if (existing) {
      if ((existing as any)._loaded) {
        resolve()
        return
      }
      existing.addEventListener(
        'load',
        () => {
          ; (existing as any)._loaded = true
          resolve()
        },
        { once: true }
      )
      existing.addEventListener(
        'error',
        () => {
          console.error('[CookieConsent] Failed to load Meta Pixel script')
          resolve()
        },
        { once: true }
      )
      return
    }

    const script = document.createElement('script')
    script.id = 'meta-pixel-script'
    script.async = true
    script.src = 'https://connect.facebook.net/en_US/fbevents.js'
    script.onload = () => {
      ; (script as any)._loaded = true
      resolve()
    }
    script.onerror = () => {
      console.error('[CookieConsent] Failed to load Meta Pixel script')
      resolve()
    }
    document.head.appendChild(script)
  })

  return metaPixelScriptPromise
}

async function ensureMetaPixel(pixelId: string | null | undefined, selection: ConsentSelections) {
  if (!pixelId || !isBrowser()) {
    return
  }

  bootstrapMetaPixel()
  const scriptPromise = loadMetaPixelScript()
  const advancedMatching = buildAdvancedMatching(selection)

  window.__metaPixelId = pixelId
  window.__metaPixelAdvancedMatching = Boolean(selection.advanced_matching)

  if (!loadedMetaPixels.has(pixelId)) {
    loadedMetaPixels.add(pixelId)
    window.fbq?.('set', 'autoConfig', false, pixelId)
    if (advancedMatching) {
      window.fbq?.('init', pixelId, advancedMatching)
    } else {
      window.fbq?.('init', pixelId)
    }
  }

  await scriptPromise
}

function ensureGtagScript(primaryId?: string | null) {
  if (!primaryId || !isBrowser()) {
    return Promise.resolve()
  }

  if (gtagScriptPromise) {
    return gtagScriptPromise
  }

  if (!window.dataLayer) {
    window.dataLayer = []
  }

  if (typeof window.gtag !== 'function') {
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer!.push(args)
    }
  }

  gtagScriptPromise = new Promise((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-analytics="gtag"]')
    if (existing) {
      window.gtag?.('js', new Date())
      resolve()
      return
    }

    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(primaryId)}`
    script.dataset.analytics = 'gtag'
    script.onload = () => {
      window.gtag?.('js', new Date())
      resolve()
    }
    script.onerror = () => {
      console.error('[CookieConsent] Failed to load gtag script')
      resolve()
    }
    document.head.appendChild(script)
  })

  return gtagScriptPromise
}

function toConsentMode(selection: ConsentSelections): ConsentModeState {
  return {
    functionality_storage: selection.necessary ? 'granted' : 'denied',
    security_storage: selection.necessary ? 'granted' : 'denied',
    ad_storage: selection.marketing ? 'granted' : 'denied',
    ad_user_data: selection.marketing ? 'granted' : 'denied',
    ad_personalization: selection.marketing ? 'granted' : 'denied',
    analytics_storage: selection.analytics ? 'granted' : 'denied',
    personalization_storage: selection.preferences ? 'granted' : 'denied',
    conversion_api: selection.conversion_api ? 'granted' : 'denied',
    advanced_matching: selection.advanced_matching ? 'granted' : 'denied',
  }
}

function selectionFromConsent(consent?: ConsentModeState | null): ConsentSelections {
  if (!consent) {
    return { ...DEFAULT_SELECTIONS }
  }

  return {
    necessary: consent.functionality_storage === 'granted' && consent.security_storage === 'granted',
    analytics: consent.analytics_storage === 'granted',
    preferences: consent.personalization_storage === 'granted',
    marketing: consent.ad_storage === 'granted',
    conversion_api: consent.conversion_api === 'granted',
    advanced_matching: consent.advanced_matching === 'granted',
  }
}

function parseConsentCookie(raw: string | null): ConsentModeState | null {
  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as ConsentModeState
    const keys = [
      'functionality_storage',
      'security_storage',
      'ad_storage',
      'ad_user_data',
      'ad_personalization',
      'analytics_storage',
      'personalization_storage',
      'conversion_api',
      'advanced_matching',
    ] as const
    const hasAllKeys = keys.every((key) => key in parsed)
    return hasAllKeys ? parsed : null
  } catch (error) {
    console.warn('[CookieConsent] Failed to parse consent cookie.', error)
    return null
  }
}

function getCookie(name: string) {
  if (typeof document === 'undefined') return null
  const cookies = document.cookie.split('; ').filter(Boolean)
  for (const cookie of cookies) {
    if (cookie.startsWith(`${name}=`)) {
      return decodeURIComponent(cookie.slice(name.length + 1))
    }
  }
  return null
}

function useFocusTrap(isVisible: boolean, dialogRef: RefObject<HTMLElement>, extraDependency?: unknown) {
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!isVisible) {
      return
    }

    const dialog = dialogRef.current
    if (!dialog) {
      return
    }

    previousFocusRef.current = document.activeElement as HTMLElement | null

    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ]

    const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelectors.join(','))).filter(
      (element) => !element.hasAttribute('disabled') && element.tabIndex !== -1
    )

    if (focusable.length === 0) {
      dialog.focus({ preventScroll: true })
      return
    }

    const defaultFocusable = dialog.querySelector<HTMLElement>('[data-initial-focus]')
    const buttonFallback = focusable.find((element) => element.tagName === 'BUTTON')
    const firstFocusable = focusable[0]!
    const lastFocusable = focusable[focusable.length - 1]!

      ; (defaultFocusable ?? buttonFallback ?? firstFocusable).focus({ preventScroll: true })

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') {
        return
      }

      if (event.shiftKey) {
        if (document.activeElement === firstFocusable || !dialog.contains(document.activeElement)) {
          event.preventDefault()
          lastFocusable.focus({ preventScroll: true })
        }
      } else if (document.activeElement === lastFocusable) {
        event.preventDefault()
        firstFocusable.focus({ preventScroll: true })
      }
    }

    const handleFocusIn = (event: FocusEvent) => {
      if (!dialog.contains(event.target as Node)) {
        firstFocusable.focus({ preventScroll: true })
      }
    }

    dialog.addEventListener('keydown', handleKeyDown)
    document.addEventListener('focusin', handleFocusIn)

    return () => {
      dialog.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('focusin', handleFocusIn)
      previousFocusRef.current?.focus({ preventScroll: true })
      previousFocusRef.current = null
    }
  }, [dialogRef, isVisible, extraDependency])
}

declare global {
  interface Window {
    __analyticsReady?: boolean
    __pageViewTracked?: boolean
    __metaPixelId?: string | null
    __metaPixelAdvancedMatching?: boolean
  }
}

export default function CookieConsentClient({
  copy,
  groups,
  privacyPolicyUrl,
  metaPixelId,
  ga4Id,
  googleAdsId,
}: CookieConsentClientProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false)
  const [consentSelections, setConsentSelections] = useState<ConsentSelections>(() => ({ ...DEFAULT_SELECTIONS }))

  const dialogRef = useRef<HTMLElement>(null)
  const settingsRef = useRef<HTMLDivElement>(null)
  const configuredIdsRef = useRef<Set<string>>(new Set())

  useFocusTrap(isVisible, dialogRef, isPreferencesOpen)

  const initializeTracking = useCallback(
    async (selection: ConsentSelections) => {
      if (metaPixelId) {
        if (selection.marketing) {
          await ensureMetaPixel(metaPixelId, selection)
          window.fbq?.('consent', 'grant')
        } else {
          window.fbq?.('consent', 'revoke')
        }
      }

      const primaryGtagId = ga4Id ?? googleAdsId ?? null
      const requiresGtag = Boolean((ga4Id && selection.analytics) || (googleAdsId && selection.marketing))

      if (primaryGtagId && requiresGtag) {
        await ensureGtagScript(primaryGtagId)

        if (ga4Id && selection.analytics && !configuredIdsRef.current.has(ga4Id)) {
          window.gtag?.('config', ga4Id, { send_page_view: false })
          configuredIdsRef.current.add(ga4Id)
        }

        if (googleAdsId && selection.marketing && !configuredIdsRef.current.has(googleAdsId)) {
          window.gtag?.('config', googleAdsId)
          configuredIdsRef.current.add(googleAdsId)
        }
      }
    },
    [ga4Id, googleAdsId, metaPixelId]
  )

  useEffect(() => {
    if (isBrowser()) {
      setAnalyticsReady(false)
    }
  }, [])

  useEffect(() => {
    if (!isBrowser()) {
      return
    }

    window.dataLayer = window.dataLayer || []
    if (typeof window.gtag !== 'function') {
      window.gtag = function gtag(...args: unknown[]) {
        window.dataLayer?.push(args)
      }
    }

    const storedConsent = parseConsentCookie(getCookie(COOKIE_NAME))
    const currentPathname = window.location.pathname
    const isPrivacyPolicyRoute = Boolean(currentPathname && privacyPolicyUrl && currentPathname.startsWith(privacyPolicyUrl))

    if (!storedConsent) {
      if (!isPrivacyPolicyRoute) {
        setIsVisible(true)
      }
      setConsentSelections({ ...DEFAULT_SELECTIONS })
      setIsPreferencesOpen(false)
      return
    }

    const selection = selectionFromConsent(storedConsent)
    setConsentSelections(selection)

    const run = async () => {
      setAnalyticsReady(false)
      try {
        await initializeTracking(selection)
      } finally {
        setAnalyticsReady(true)
      }
    }

    void run()
  }, [initializeTracking, privacyPolicyUrl])

  useEffect(() => {
    if (!isPreferencesOpen || !settingsRef.current) {
      return
    }
    const firstInteractiveInput = settingsRef.current.querySelector<HTMLInputElement>('input:not([disabled])')
    requestAnimationFrame(() => {
      firstInteractiveInput?.focus({ preventScroll: true })
    })
  }, [isPreferencesOpen])

  useEffect(() => {
    if (!metaPixelId) {
      return
    }

    const handleAnalyticsUserUpdated = () => {
      if (consentSelections.advanced_matching) {
        ensureMetaPixel(metaPixelId, consentSelections)
      }
    }
    document.addEventListener('analytics_user_updated', handleAnalyticsUserUpdated)
    return () => {
      document.removeEventListener('analytics_user_updated', handleAnalyticsUserUpdated)
    }
  }, [metaPixelId, consentSelections])

  const handleConsentApply = useCallback(
    async (selection: ConsentSelections) => {
      const consentMode = toConsentMode(selection)
      window.gtag?.('consent', 'update', consentMode)
      setCookie(COOKIE_NAME, JSON.stringify(consentMode), resolveConsentTtl(selection))

      setConsentSelections(selection)
      setIsVisible(false)
      setIsPreferencesOpen(false)
      if (isBrowser()) {
        window.__metaPixelId = metaPixelId ?? null
        window.__metaPixelAdvancedMatching = selection.advanced_matching
      }
      setAnalyticsReady(false)
      try {
        await initializeTracking(selection)
      } finally {
        setAnalyticsReady(true)
        document.dispatchEvent(new CustomEvent('cookie_consent_updated', { detail: consentMode }))
      }
    },
    [initializeTracking, metaPixelId]
  )

  const handleAcceptAll = useCallback(() => {
    void handleConsentApply({
      necessary: true,
      marketing: true,
      analytics: true,
      preferences: true,
      conversion_api: true,
      advanced_matching: true,
    })
  }, [handleConsentApply])

  const handleDenyAll = useCallback(() => {
    void handleConsentApply({
      necessary: false,
      marketing: false,
      analytics: false,
      preferences: false,
      conversion_api: false,
      advanced_matching: false,
    })
  }, [handleConsentApply])

  const handlePreferencesToggle = useCallback(() => {
    if (!isPreferencesOpen) {
      setIsPreferencesOpen(true)
      return
    }
    void handleConsentApply(consentSelections)
  }, [consentSelections, handleConsentApply, isPreferencesOpen])

  const handleGroupChange = useCallback((group: ConsentGroup, checked: boolean) => {
    setConsentSelections((prev) => {
      const updated: ConsentSelections = {
        ...prev,
        [group.id]: checked,
      }

      if (group.id === 'necessary') {
        updated.necessary = true
        return updated
      }

      if (group.subGroups) {
        for (const subGroup of group.subGroups) {
          updated[subGroup.id] = checked
        }
      }

      return updated
    })
  }, [])

  const handleSubGroupChange = useCallback((subGroup: ConsentSubGroup, checked: boolean) => {
    setConsentSelections((prev) => {
      const updated: ConsentSelections = {
        ...prev,
        [subGroup.id]: checked,
      }
      if (checked) {
        updated.marketing = true
      } else if (!updated.conversion_api && !updated.advanced_matching) {
        updated.marketing = false
      }
      return updated
    })
  }, [])

  useEffect(() => {
    const resetButton = document.getElementById('reset-cookie-consent')
    if (!resetButton) return

    const handleReset = () => {
      document.cookie = `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`
      window.gtag?.('consent', 'default', DENIED_CONSENT_MODE)
      window.fbq?.('consent', 'revoke')
      setConsentSelections({ ...DEFAULT_SELECTIONS })
      setIsVisible(true)
      setIsPreferencesOpen(false)
    }

    resetButton.addEventListener('click', handleReset)
    return () => {
      resetButton.removeEventListener('click', handleReset)
    }
  }, [])

  return (
    <aside className="cookie-consent" aria-hidden={isVisible ? 'false' : 'true'}>
      <section ref={dialogRef} className="content">
        <header className="header">
          <div data-header-initial style={isPreferencesOpen ? { display: 'none' } : undefined}>
            <h2 className="heading">{copy.heading}</h2>
            <p className="description">
              {copy.description}{' '}
              <a href={privacyPolicyUrl} target="_blank" rel="noopener" className="link" data-shade="light">
                {copy.learnMore}
              </a>
            </p>
          </div>
          <div data-header-settings style={isPreferencesOpen ? undefined : { display: 'none' }}>
            <h3 className="heading">{copy.settingsHeading}</h3>
            <p className="description">
              {copy.settingsDescription}{' '}
              <a href={privacyPolicyUrl} target="_blank" rel="noopener" className="link" data-shade="light">
                {copy.learnMore}
              </a>
            </p>
          </div>
        </header>

        <div className="settings" ref={settingsRef} style={isPreferencesOpen ? undefined : { display: 'none' }}>
          {groups.map((group) => {
            const descriptionId = `${group.id}-description`
            return (
              <div className="group" data-group={group.id} key={group.id}>
                <label htmlFor={group.id} style={{ ...(group.id === 'necessary' && { cursor: 'not-allowed' }) }}>
                  <Switch
                    inputProps={{
                      id: group.id,
                      checked: consentSelections[group.id],
                      onChange: (event: JSX.TargetedEvent<HTMLInputElement, Event>) =>
                        handleGroupChange(group, event.currentTarget.checked),
                      disabled: group.id === 'necessary',
                      'aria-describedby': descriptionId,
                    }}
                    size="md"
                  />
                  <p className="name">{group.name}</p>
                  <p id={descriptionId} className="description">
                    {group.description}
                  </p>
                </label>

                {group.subGroups && (
                  <div className="sub-groups">
                    {group.subGroups.map((subGroup) => {
                      const subDescriptionId = `${subGroup.id}-description`
                      return (
                        <label key={subGroup.id} htmlFor={subGroup.id} className="sub-group">
                          <Switch
                            inputProps={{
                              id: subGroup.id,
                              checked: consentSelections[subGroup.id],
                              onChange: (event: JSX.TargetedEvent<HTMLInputElement, Event>) =>
                                handleSubGroupChange(subGroup, event.currentTarget.checked),
                              'aria-describedby': subDescriptionId,
                            }}
                            size="md"
                          />
                          <p className="name">{subGroup.name}</p>
                          <p id={subDescriptionId} className="description">
                            {subGroup.description}
                          </p>
                        </label>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="actions">
          <button
            type="button"
            className="setPreferences"
            onClick={handlePreferencesToggle}
            aria-expanded={isPreferencesOpen}
          >
            {copy.buttons.setPreferences}
          </button>
          <button type="button" className="deny" onClick={handleDenyAll}>
            {copy.buttons.deny}
          </button>
          <Button type="button" className="agree" theme="primary" onClick={handleAcceptAll} data-initial-focus>
            {copy.buttons.agreeAll}
          </Button>
        </div>
      </section>
    </aside>
  )
}

