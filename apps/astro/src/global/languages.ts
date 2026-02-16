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
      inquiry: {
        name: {
          label: 'Imię / Firma',
          required: 'Imię lub nazwa firmy jest wymagana',
          placeholder: 'Jan Kowalski / Nazwa firmy',
        },
        phone: {
          label: 'Telefon (opcjonalnie — przyspiesza kontakt)',
        },
        teamSize: {
          label: 'Ile osób w zespole?',
          required: 'Wybierz liczbę osób',
          placeholder: 'Wybierz...',
          options: {
            small: 'do 30',
            medium: '31-80',
            large: '81-150',
            xlarge: '150+',
          },
        },
        timeline: {
          label: 'Preferowany termin',
          placeholder: 'np. wrzesień 2026, Q3, konkretna data',
        },
        additionalInfo: {
          label: 'Dodatkowe informacje',
          placeholder: 'Opisz czego szukasz — budżet, styl, specjalne wymagania...',
        },
        region: {
          label: 'Preferowany region',
          options: {
            mountains: 'Góry',
            sea: 'Morze',
            mazury: 'Mazury',
            central: 'Centralna Polska',
            none: 'Brak preferencji',
          },
        },
        needsIntegration: 'Szukasz scenariusza integracji?',
        items: {
          heading: 'Twój wybór',
          remove: 'Usuń',
        },
        submit: 'Wyślij zapytanie',
      },
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
      inquiry: {
        name: {
          label: 'Name / Company',
          required: 'Name or company name is required',
          placeholder: 'John Smith / Company name',
        },
        phone: {
          label: 'Phone (optional — speeds up contact)',
        },
        teamSize: {
          label: 'How many people in your team?',
          required: 'Please select team size',
          placeholder: 'Select...',
          options: {
            small: 'up to 30',
            medium: '31-80',
            large: '81-150',
            xlarge: '150+',
          },
        },
        timeline: {
          label: 'Preferred date',
          placeholder: 'e.g. September 2026, Q3, specific date',
        },
        additionalInfo: {
          label: 'Additional information',
          placeholder: 'Describe what you need — budget, style, special requirements...',
        },
        region: {
          label: 'Preferred region',
          options: {
            mountains: 'Mountains',
            sea: 'Seaside',
            mazury: 'Masuria',
            central: 'Central Poland',
            none: 'No preference',
          },
        },
        needsIntegration: 'Looking for a team-building scenario?',
        items: {
          heading: 'Your selection',
          remove: 'Remove',
        },
        submit: 'Send inquiry',
      },
    },
  },
}
export const languages = ['pl', 'en'] as const

export const langPrefixes = {
  pl: '/pl/',
  en: '/en/',
}

export function getLangFromPath(pathname: string) {
  if (pathname.split('/').length === 1) return 'pl'
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

export const ogLocales = {
  pl: 'pl_PL',
  en: 'en_GB',
}
