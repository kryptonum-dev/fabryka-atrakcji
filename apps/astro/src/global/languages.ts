export const LANGUAGES = ['pl', 'en'] as const
export type Language = (typeof LANGUAGES)[number]

export const translations = {
  pl: {
    breadcrumbsName: 'Strona główna',
    form: {
      legal: {
        labelFirst: 'Akceptuję',
        labelSecond: 'Politykę Prywatności',
        link: '/pl/polityka-prywatnosci/',
        required: 'Zgoda jest wymagana',
      },
      terms: {
        labelFirst: 'Akceptuję',
        labelSecond: 'Regulamin',
        link: '/pl/regulamin/',
        required: 'Akceptacja regulaminu jest wymagana',
      },
      combined: {
        labelFirst: 'Akceptuję',
        labelSecond: 'Regulamin',
        labelMiddle: 'i',
        labelThird: 'Politykę Prywatności',
        termsLink: '/pl/regulamin/',
        privacyLink: '/pl/polityka-prywatnosci/',
        required: 'Akceptacja regulaminu i polityki prywatności jest wymagana',
      },
      newsletter: {
        terms: {
          labelFirst: 'Akceptuję',
          labelSecond: 'Regulamin',
          labelThird: 'i wyrażam zgodę na otrzymywanie Newslettera',
          link: '/pl/regulamin/',
          required: 'Akceptacja regulaminu i zgoda na newsletter jest wymagana',
        },
      },
      email: {
        label: 'Email',
        required: 'Email jest wymagany',
        pattern: 'Niepoprawny adres e-mail',
      },
      phone: {
        label: 'Telefon (opcjonalnie)',
        description: 'Gwarantujemy kontakt wyłącznie w odpowiedzi na zadane pytania',
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
        labelFirst: 'I accept the',
        labelSecond: 'Privacy Policy',
        link: '/en/privacy-policy/',
        required: 'Legal consent is required',
      },
      terms: {
        labelFirst: 'I accept the',
        labelSecond: 'Terms and Conditions',
        link: '/en/terms-and-conditions/',
        required: 'Terms and Conditions acceptance is required',
      },
      combined: {
        labelFirst: 'I accept the',
        labelSecond: 'Terms and Conditions',
        labelMiddle: 'and',
        labelThird: 'Privacy Policy',
        termsLink: '/en/terms-and-conditions/',
        privacyLink: '/en/privacy-policy/',
        required: 'Terms and Conditions and Privacy Policy acceptance is required',
      },
      newsletter: {
        terms: {
          labelFirst: 'I accept the',
          labelSecond: 'Terms and Conditions',
          labelThird: 'and consent to receiving the Newsletter',
          link: '/en/terms-and-conditions/',
          required: 'Terms and Conditions acceptance and newsletter consent is required',
        },
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
export const languages = ['pl', 'en'] as const

export const langPrefixes = {
  pl: '/pl/',
}

export function getLangFromPath(pathname: string) {
  if (pathname.split('/').length === 2) return 'pl'
  const [, lang] = pathname.split('/')

  if (languages.includes(lang as Language)) return lang as Language
  return 'pl'
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
