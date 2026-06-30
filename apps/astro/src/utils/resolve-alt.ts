import type { Language } from '@/global/languages'

export type AltTexts = { pl?: string | null; en?: string | null } | null | undefined

/**
 * Resolves the alt text for the current page language from the localized
 * `altTexts` object stored by the `sanity-plugin-media-i18n` plugin.
 * Falls back to Polish (the primary language) so no image is left without
 * a description when a translation is missing.
 */
export function resolveAlt(altTexts: AltTexts, lang: Language): string {
  return altTexts?.[lang] || altTexts?.pl || ''
}
