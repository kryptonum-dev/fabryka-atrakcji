import type { Language } from '../global/languages'

export function getParticipantsText(participants: number, lang: Language) {
  const translations = {
    pl: {
      single: 'osoba',
      few: 'osoby',
      plural: 'osób',
    },
    en: {
      single: 'person',
      few: 'people',
      plural: 'people',
    },
  }

  const t = translations[lang]

  if (lang === 'pl') {
    if (participants === 1) return t.single
    if (participants % 10 >= 2 && participants % 10 <= 4 && (participants % 100 < 10 || participants % 100 >= 20)) {
      return t.few
    }
    return t.plural
  }
  return participants === 1 ? t.single : t.plural
}
