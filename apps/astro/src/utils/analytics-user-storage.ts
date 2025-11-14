import type { AnalyticsUser, AnalyticsUtm } from '@/global/analytics/types'

const STORAGE_KEY = 'analytics-user'
const UTM_STORAGE_KEY = 'analytics-utm'

function isBrowser() {
  return typeof window !== 'undefined'
}

function normalize(user: AnalyticsUser | null | undefined): AnalyticsUser | null {
  if (!user) return null
  const entries = Object.entries(user).filter(([, value]) => value !== undefined && value !== null && value !== '')
  return entries.length ? (Object.fromEntries(entries) as AnalyticsUser) : null
}

type StoredUtm = Partial<Omit<AnalyticsUtm, 'capturedAt'>> & { capturedAt?: number }

function normalizeUtm(utm?: StoredUtm | null): AnalyticsUtm | null {
  if (!utm) return null
  const { capturedAt, ...rest } = utm
  const entries = Object.entries(rest).filter(([, value]) => value !== undefined && value !== null && value !== '')
  if (!entries.length) return null
  const base = Object.fromEntries(entries) as Omit<AnalyticsUtm, 'capturedAt'>
  return {
    ...base,
    capturedAt: typeof capturedAt === 'number' ? capturedAt : Date.now(),
  }
}

export function loadAnalyticsUser(): AnalyticsUser | null {
  if (!isBrowser()) return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AnalyticsUser
    return normalize(parsed)
  } catch (error) {
    console.error('[AnalyticsUserStorage] Failed to load user data', error)
    return null
  }
}

export function normalizeAnalyticsUser(user: AnalyticsUser | null | undefined): AnalyticsUser | null {
  return normalize(user)
}

export function saveAnalyticsUser(user: AnalyticsUser): void {
  if (!isBrowser()) return
  const normalized = normalize(user)
  if (!normalized) {
    clearAnalyticsUser()
    return
  }
  try {
    const current = loadAnalyticsUser()
    const merged = {
      ...(current ?? {}),
      ...normalized,
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
    document.dispatchEvent(
      new CustomEvent('analytics_user_updated', {
        detail: merged,
      })
    )
  } catch (error) {
    console.error('[AnalyticsUserStorage] Failed to save user data', error)
  }
}

export function clearAnalyticsUser(): void {
  if (!isBrowser()) return
  try {
    window.localStorage.removeItem(STORAGE_KEY)
    document.dispatchEvent(
      new CustomEvent('analytics_user_updated', {
        detail: null,
      })
    )
  } catch (error) {
    console.error('[AnalyticsUserStorage] Failed to clear user data', error)
  }
}

export function loadAnalyticsUtm(): AnalyticsUtm | null {
  if (!isBrowser()) return null
  try {
    const raw = window.sessionStorage.getItem(UTM_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredUtm
    return normalizeUtm(parsed)
  } catch (error) {
    console.error('[AnalyticsUserStorage] Failed to load UTM data', error)
    return null
  }
}

export function saveAnalyticsUtm(values: StoredUtm): AnalyticsUtm | null {
  if (!isBrowser()) return null
  const normalized = normalizeUtm({ ...values, capturedAt: Date.now() })
  if (!normalized) return null
  try {
    window.sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(normalized))
    document.dispatchEvent(
      new CustomEvent('analytics_utm_updated', {
        detail: normalized,
      })
    )
    return normalized
  } catch (error) {
    console.error('[AnalyticsUserStorage] Failed to save UTM data', error)
    return null
  }
}

export function clearAnalyticsUtm(): void {
  if (!isBrowser()) return
  try {
    window.sessionStorage.removeItem(UTM_STORAGE_KEY)
    document.dispatchEvent(
      new CustomEvent('analytics_utm_updated', {
        detail: null,
      })
    )
  } catch (error) {
    console.error('[AnalyticsUserStorage] Failed to clear UTM data', error)
  }
}


