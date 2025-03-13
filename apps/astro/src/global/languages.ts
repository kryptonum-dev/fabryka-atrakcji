export const LANGUAGES = ['pl'] as const
export type Language = (typeof LANGUAGES)[number]

const translations = {
  pl: {
    breadcrumbsName: 'Strona główna',
  },
  en: {
    breadcrumbsName: 'Homepage',
  },
}

export const langPrefixes = {
  pl: '/pl/',
}

export function useTranslations(lang: Language) {
  return function t(key: keyof (typeof translations)['pl']) {
    return translations[lang][key]
  }
}

export const getLocaleFromPath = (pathname: string) => {
  const [, locale] = pathname.split('/')
  return locale === 'en' ? 'en' : 'pl'
}
