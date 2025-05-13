/**
 * Format a number as currency based on the language.
 * @param value Number to format as currency
 * @param lang Language code (defaults to 'pl')
 * @returns Formatted currency string
 */
export function formatCurrency(value: number, lang: string = 'pl'): string {
  const formatter = new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'pl-PL', {
    style: 'currency',
    currency: 'PLN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })

  return formatter.format(value)
}
