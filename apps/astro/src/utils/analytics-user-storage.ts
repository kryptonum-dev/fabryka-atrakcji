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
    const raw = window.localStorage.getItem(UTM_STORAGE_KEY)
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
    window.localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(normalized))
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
    window.localStorage.removeItem(UTM_STORAGE_KEY)
    document.dispatchEvent(
      new CustomEvent('analytics_utm_updated', {
        detail: null,
      })
    )
  } catch (error) {
    console.error('[AnalyticsUserStorage] Failed to clear UTM data', error)
  }
}

export function formatAnalyticsUtmString(utm: AnalyticsUtm | null): string | null {
  if (!utm) return null
  const { capturedAt: _capturedAt, ...rest } = utm
  const preferredOrder = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']

  const normalizedEntries: string[] = []
  const pushEntry = (key: string, value: unknown) => {
    if (value === undefined || value === null) return
    const normalizedValue = typeof value === 'string' ? value.trim() : String(value)
    if (!normalizedValue) return
    normalizedEntries.push(`${key}=${encodeURIComponent(normalizedValue)}`)
  }

  preferredOrder.forEach((key) => {
    pushEntry(key, rest[key as keyof typeof rest])
  })

  Object.entries(rest).forEach(([key, value]) => {
    if (preferredOrder.includes(key)) return
    pushEntry(key, value)
  })

  return normalizedEntries.length ? `?${normalizedEntries.join('&')}` : null
}

/**
 * Convenience function: load UTM from storage and format as query string
 */
export function getUtmString(): string | null {
  return formatAnalyticsUtmString(loadAnalyticsUtm())
}

/**
 * Format UTM params as multiline text for Google Sheets
 * Example output:
 * utm_source=facebook
 * utm_medium=cpc
 * utm_campaign=summer
 */
export function getUtmForSheet(): string | null {
  const utm = loadAnalyticsUtm()
  if (!utm) return null

  const { capturedAt: _capturedAt, ...rest } = utm
  const lines: string[] = []

  Object.entries(rest).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      lines.push(`${key}=${value}`)
    }
  })

  return lines.length ? lines.join('\n') : null
}


