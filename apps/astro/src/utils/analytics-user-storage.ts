import type { AnalyticsUser } from '@/global/analytics/types'

const STORAGE_KEY = 'analytics-user'

function isBrowser() {
  return typeof window !== 'undefined'
}

function normalize(user: AnalyticsUser | null | undefined): AnalyticsUser | null {
  if (!user) return null
  const entries = Object.entries(user).filter(([, value]) => value !== undefined && value !== null && value !== '')
  return entries.length ? (Object.fromEntries(entries) as AnalyticsUser) : null
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


