import type { Language } from '../global/languages'

export function getRelativeDate({
  date,
  upperCase = false,
  lang = 'pl',
}: {
  date: Date | string
  upperCase?: boolean
  lang?: Language
}) {
  const translations = {
    pl: {
      todayUpper: 'Dzisiaj',
      todayLower: 'dzisiaj',
      yesterdayUpper: 'Wczoraj',
      yesterdayLower: 'wczoraj',
      daysAgo: 'dni temu',
      intl: 'pl-PL',
    },
    en: {
      todayUpper: 'Today',
      todayLower: 'today',
      yesterdayUpper: 'Yesterday',
      yesterdayLower: 'yesterday',
      daysAgo: 'days ago',
      intl: 'en-US',
    },
  }

  const t = translations[lang]

  const today = new Date()
  const targetDate = new Date(date)

  today.setHours(0, 0, 0, 0)
  targetDate.setHours(0, 0, 0, 0)

  const diffTime = Math.abs(today.getTime() - targetDate.getTime())
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return upperCase ? t.todayUpper : t.todayLower
  if (diffDays === 1) return upperCase ? t.yesterdayUpper : t.yesterdayLower
  if (diffDays <= 6) return `${diffDays} ${t.daysAgo}`
  return new Intl.DateTimeFormat(t.intl, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(targetDate))
}
