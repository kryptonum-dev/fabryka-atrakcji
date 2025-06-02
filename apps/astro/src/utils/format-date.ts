export const monthShortcuts = {
  pl: ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
} as const

export type Language = 'pl' | 'en'

export function formatDateWithShortcut(date: Date | string, lang: Language = 'pl'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return `${dateObj.getDate()} ${monthShortcuts[lang][dateObj.getMonth()]}`
}
