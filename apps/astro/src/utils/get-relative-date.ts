export function getRelativeDate({ date, upperCase = false }: { date: Date | string; upperCase?: boolean }) {
  const today = new Date()
  const targetDate = new Date(date)

  today.setHours(0, 0, 0, 0)
  targetDate.setHours(0, 0, 0, 0)

  const diffTime = Math.abs(today.getTime() - targetDate.getTime())
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return upperCase ? 'Dzisiaj' : 'dzisiaj'
  if (diffDays === 1) return upperCase ? 'Wczoraj' : 'wczoraj'
  if (diffDays <= 6) return `${diffDays} dni temu`
  return new Intl.DateTimeFormat('pl-PL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(targetDate))
}
