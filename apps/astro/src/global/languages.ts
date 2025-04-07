export const LANGUAGES = ['pl'] as const
export type Language = (typeof LANGUAGES)[number]

export const translations = {
  pl: {
    breadcrumbsName: 'Strona główna',
    form: {
      legal: {
        labelFirst: 'Wyrażam zgodę na',
        labelSecond: 'politykę prywatności',
        link: '/pl/polityka-prywatnosci',
        required: 'Zgoda jest wymagana',
      },
      email: {
        label: 'Email',
        required: 'Email jest wymagany',
        pattern: 'Niepoprawny adres e-mail',
      },
      phone: {
        label: 'Telefon (opcjonalnie)',
        description: 'Gwarantujemy kontakt wyłącznie w odpowiedzi na zadane pytania',
      },
      message: {
        label: 'Temat wiadomości',
        required: 'Temat jest wymagany',
      },
      submit: 'Wyślij wiadomość',
    },
  },
  en: {
    breadcrumbsName: 'Homepage',
    form: {
      legal: {
        labelFirst: 'I agree to',
        labelSecond: 'privacy policy',
        link: '/en/privacy-policy',
        required: 'Legal consent is required',
      },
      email: {
        label: 'Email',
        required: 'Email is required',
        pattern: 'Invalid email address',
      },
      phone: {
        label: 'Phone (optional)',
        description: 'We guarantee contact only in response to questions asked',
      },
      message: {
        label: 'Message subject',
        required: 'Subject is required',
      },
      submit: 'Send message',
    },
  },
}

export const langPrefixes = {
  pl: '/pl/',
}

export function getLangFromPath(pathname: string) {
  const [, lang] = pathname.split('/')
  return lang
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
