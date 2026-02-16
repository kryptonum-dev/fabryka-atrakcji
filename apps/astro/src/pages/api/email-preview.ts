export const prerender = false

import { clientConfirmation, teamNotification } from '@/src/emails/contact-emails'
import type { APIRoute } from 'astro'

const MOCK_INQUIRY = {
  formType: 'inquiry' as const,
  email: 'jan.kowalski@firma.pl',
  phone: '+48 606 757 685',
  lang: 'pl',
  utm: 'google / cpc / integracje-firmowe',
  name: 'Jan Kowalski',
  teamSize: '31-80',
  timeline: 'wrzesień 2026',
  region: 'gory',
  additionalInfo: 'Szukamy czegoś energetycznego dla zespołu 50 osób. Idealnie w górach, z opcją grillowania wieczorem. Budżet ok. 200 zł/os.',
  sourceUrl: 'https://www.fabryka-atrakcji.com/pl/kontakt/',
  selectedItems: [
    { type: 'integracja', id: '1', name: 'Olimpiada Firmowa', url: 'https://www.fabryka-atrakcji.com/pl/integracje/olimpiada-firmowa/' },
    { type: 'hotel', id: '2', name: 'Hotel Narvil Conference & Spa', url: 'https://www.fabryka-atrakcji.com/pl/hotele/narvil/' },
  ],
  contextItem: { type: 'integracja', id: '3', name: 'Team Building w górach' },
}

const MOCK_SIMPLE = {
  formType: 'simple' as const,
  email: 'anna@example.com',
  phone: '+48 512 345 678',
  lang: 'pl',
  utm: 'direct',
  message: 'Cześć, mam pytanie o wasze atrakcje integracyjne. Czy organizujecie eventy na terenie Warszawy? Interesuje mnie team building dla ok. 30 osób.',
}

export const GET: APIRoute = async ({ url }) => {
  const template = url.searchParams.get('t') || 'team-inquiry'

  const templates: Record<string, string> = {
    'team-inquiry': teamNotification(MOCK_INQUIRY),
    'team-simple': teamNotification(MOCK_SIMPLE),
    'client': clientConfirmation({ name: 'Jan Kowalski', email: 'jan@firma.pl', lang: 'pl' }),
    'client-en': clientConfirmation({ name: 'John Smith', email: 'john@company.com', lang: 'en' }),
  }

  const html = templates[template]
  if (!html) {
    const links = Object.keys(templates)
      .map((k) => `<a href="?t=${k}">${k}</a>`)
      .join(' · ')
    return new Response(`<p>Pick a template: ${links}</p>`, {
      headers: { 'content-type': 'text/html' },
    })
  }

  return new Response(html, { headers: { 'content-type': 'text/html' } })
}
