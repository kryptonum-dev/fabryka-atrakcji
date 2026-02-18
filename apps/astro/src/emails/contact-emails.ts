/**
 * Branded email templates for Fabryka Atrakcji contact forms.
 *
 * Brand palette (from global.scss):
 *   --primary-400: #74535e   (muted mauve)
 *   --primary-500: #db664e   (coral accent)
 *   --primary-800: #45051c   (dark burgundy — logo, headings)
 *   --neutral-100: #fffbfb   (off-white)
 *   --neutral-200: #f5f1ec   (warm background)
 *   --neutral-300: #ede6de   (divider)
 *   --neutral-500: #d2c1b0   (tan / muted)
 */

const SITE = 'https://www.fabryka-atrakcji.com'

const normalizeLegacyItemPath = (path: string): string =>
  path
    .replace('/pl/integracja/', '/pl/integracje/')
    .replace('/en/activity/', '/en/activities/')

const getAbsoluteItemUrl = (url?: string): string | null => {
  if (!url?.trim()) return null
  const raw = url.trim()

  if (/^https?:\/\//i.test(raw)) {
    const parsed = new URL(raw)
    const normalizedPath = normalizeLegacyItemPath(`${parsed.pathname}${parsed.search}${parsed.hash}`)
    return new URL(normalizedPath, SITE).toString()
  }

  const normalized = normalizeLegacyItemPath(raw)
  if (normalized.startsWith('/')) return `${SITE}${normalized}`
  return `${SITE}/${normalized}`
}

// ─── shared pieces ───────────────────────────────────────────────

const fontStack = "'Helvetica Neue', Helvetica, Arial, sans-serif"

const layout = (content: string, variant: 'dark' | 'light' = 'dark') => {
  const isDark = variant === 'dark'
  const bg = isDark ? '#45051c' : '#f5f1ec'
  const cardBg = isDark ? '#fffbfb' : '#fffbfb'

  return `
<!DOCTYPE html>
<html lang="pl">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:${bg};font-family:${fontStack};-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${bg};">
    <!-- top accent bar -->
    <tr><td align="center" style="padding:48px 16px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
        <tr><td style="padding:24px 0;text-align:center;">
          <a href="${SITE}" target="_blank" style="text-decoration:none;color:${isDark ? '#f5f1ec' : '#45051c'};font-size:15px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;">Fabryka Atrakcji</a>
        </td></tr>
      </table>
    </td></tr>
    <!-- card -->
    <tr><td align="center" style="padding:0 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${cardBg};border-radius:12px;overflow:hidden;">
        <!-- coral accent stripe -->
        <tr><td style="height:4px;background:linear-gradient(90deg,#db664e,#db2a50);font-size:0;line-height:0;">&nbsp;</td></tr>
        <!-- body -->
        <tr><td style="padding:36px 40px 32px;">
          ${content}
        </td></tr>
      </table>
    </td></tr>
    <!-- footer -->
    <tr><td align="center" style="padding:24px 16px 48px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
        <tr><td style="text-align:center;">
          <p style="margin:0;font-size:12px;color:${isDark ? '#74535e' : '#d2c1b0'};line-height:1.6;">
            <a href="tel:+48606757685" target="_blank" style="color:${isDark ? '#e6c8d5' : '#74535e'};text-decoration:none;">+48 606 757 685</a>
            &nbsp;&middot;&nbsp;
            <a href="${SITE}" target="_blank" style="color:${isDark ? '#e6c8d5' : '#74535e'};text-decoration:none;">fabryka-atrakcji.com</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ─── client confirmation (same for inquiry & FAQ) ────────────────

export const clientConfirmation = ({
  name,
  email,
  lang,
}: {
  name?: string
  email: string
  lang: string
}) => {
  const greeting = name || email
  const isEn = lang === 'en'

  const body = isEn
    ? `
      <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#45051c;line-height:1.3;">We got your message</p>
      <p style="margin:0 0 28px;font-size:13px;color:#74535e;letter-spacing:0.03em;">Expect a reply within 24h</p>
      <p style="margin:0 0 20px;font-size:15px;color:#74535e;line-height:1.7;">
        Hi <strong style="color:#45051c;">${greeting}</strong>,<br/>
        Thank you for reaching out. We'll review your message and get back to you shortly with next steps.
      </p>
      <p style="margin:0;font-size:14px;color:#74535e;line-height:1.6;">
        — <strong style="color:#45051c;">Fabryka Atrakcji</strong>
      </p>`
    : `
      <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#45051c;line-height:1.3;">Otrzymaliśmy Twoją wiadomość</p>
      <p style="margin:0 0 28px;font-size:13px;color:#74535e;letter-spacing:0.03em;">Odpowiemy w ciągu 24h</p>
      <p style="margin:0 0 20px;font-size:15px;color:#74535e;line-height:1.7;">
        Cześć <strong style="color:#45051c;">${greeting}</strong>,<br/>
        Dziękujemy za wiadomość. Przejrzymy Twoje zgłoszenie i wrócimy z kolejnymi krokami.
      </p>
      <p style="margin:0;font-size:14px;color:#74535e;line-height:1.6;">
        — <strong style="color:#45051c;">Fabryka Atrakcji</strong>
      </p>`

  return layout(body, 'dark')
}

// ─── team notification ───────────────────────────────────────────

type SelectedItem = { type: string; id: string; name: string; image?: string; url?: string }
type ContextItem = { type: string; id: string; name: string }

export type TeamNotificationData = {
  formType: 'inquiry' | 'simple'
  email: string
  phone?: string
  lang: string
  utm?: string | null
  // inquiry-specific
  name?: string
  teamSize?: string
  timeline?: string
  region?: string
  needsIntegration?: boolean
  additionalInfo?: string
  contextItem?: ContextItem | null
  selectedItems?: SelectedItem[]
  sourceUrl?: string
  // simple-specific
  message?: string
}

const teamSizeLabels: Record<string, string> = {
  small: 'do 30 osób',
  'do-30': 'do 30 osób',
  '31-80': '31–80 osób',
  '81-150': '81–150 osób',
  '150+': '150+ osób',
}

const regionLabels: Record<string, string> = {
  gory: 'Góry',
  morze: 'Morze',
  mazury: 'Mazury',
  centralna: 'Centralna Polska',
  brak: 'Brak preferencji',
}

const hasPhone = (phone?: string) => !!phone && phone !== '+48'

const row = (label: string, value: string) => `
  <tr>
    <td style="padding:10px 16px 10px 0;font-size:12px;color:#74535e;vertical-align:middle;white-space:nowrap;text-transform:uppercase;letter-spacing:0.05em;line-height:1.5;">${label}</td>
    <td style="padding:10px 0;font-size:14px;color:#45051c;line-height:1.5;vertical-align:middle;">${value}</td>
  </tr>`

export const teamNotification = (d: TeamNotificationData) => {
  const isInquiry = d.formType === 'inquiry'
  const heading = isInquiry ? 'Nowe zapytanie' : 'Nowa wiadomość'

  // Build rows — only show filled fields
  const rows: string[] = []

  if (d.name) rows.push(row('Kontakt', `<strong>${d.name}</strong>`))
  rows.push(row('Email', `<a href="mailto:${d.email}" target="_blank" style="color:#45051c;text-decoration:underline;text-decoration-color:#db664e;text-underline-offset:2px;">${d.email}</a>`))
  if (hasPhone(d.phone)) rows.push(row('Telefon', `<a href="tel:${d.phone}" target="_blank" style="color:#45051c;text-decoration:none;">${d.phone}</a>`))
  if (d.teamSize) rows.push(row('Zespół', `<strong>${teamSizeLabels[d.teamSize] || d.teamSize}</strong>`))
  if (d.timeline) rows.push(row('Termin', `<strong>${d.timeline}</strong>`))
  if (d.region) rows.push(row('Region', `<strong>${regionLabels[d.region] || d.region}</strong>`))
  if (d.needsIntegration) rows.push(row('Integracja', '<span style="color:#db664e;font-weight:600;">Tak — szuka scenariusza</span>'))

  // Context item
  if (d.contextItem) {
    rows.push(row('Dotyczy', `<strong>${d.contextItem.name}</strong> <span style="color:#74535e;font-size:12px;">${d.contextItem.type}</span>`))
  }

  // Selected items
  let itemsBlock = ''
  if (d.selectedItems && d.selectedItems.length > 0) {
    const list = d.selectedItems
      .map((item) => {
        const itemUrl = getAbsoluteItemUrl(item.url)
        const label = itemUrl
          ? `<a href="${itemUrl}" target="_blank" style="color:#45051c;text-decoration:underline;text-decoration-color:#db664e;text-underline-offset:2px;">${item.name}</a>`
          : `<strong>${item.name}</strong>`
        return `<li style="padding:4px 0;font-size:14px;color:#45051c;">${label} <span style="color:#74535e;font-size:11px;text-transform:uppercase;letter-spacing:0.03em;">${item.type}</span></li>`
      })
      .join('')
    itemsBlock = `
      <div style="margin-top:24px;">
        <p style="margin:0 0 8px;font-size:12px;color:#74535e;text-transform:uppercase;letter-spacing:0.05em;">Wybrane pozycje (${d.selectedItems.length})</p>
        <ul style="margin:0;padding-left:18px;">${list}</ul>
      </div>`
  }

  // Message (simple form)
  let messageBlock = ''
  if (d.message?.trim()) {
    messageBlock = `
      <div style="margin-top:24px;padding:20px;background:#f5f1ec;border-radius:8px;">
        <p style="margin:0;font-size:14px;color:#45051c;line-height:1.7;">${d.message.trim().replace(/\n/g, '<br/>')}</p>
      </div>`
  }

  // Additional info (inquiry form)
  let infoBlock = ''
  if (d.additionalInfo?.trim()) {
    infoBlock = `
      <div style="margin-top:24px;padding:20px;background:#f5f1ec;border-radius:8px;">
        <p style="margin:0 0 6px;font-size:11px;color:#74535e;text-transform:uppercase;letter-spacing:0.05em;">Dodatkowe informacje</p>
        <p style="margin:0;font-size:14px;color:#45051c;line-height:1.7;">${d.additionalInfo.trim().replace(/\n/g, '<br/>')}</p>
      </div>`
  }

  // Metadata footer
  const metaParts: string[] = []
  if (d.sourceUrl) metaParts.push(`Źródło: ${d.sourceUrl}`)
  metaParts.push(`UTM: ${d.utm?.trim() || 'brak danych'}`)
  metaParts.push(`Język: ${d.lang}`)
  const metaBlock = `
    <div style="margin-top:28px;padding-top:16px;border-top:1px solid #ede6de;">
      ${metaParts.map((t) => `<p style="margin:0 0 2px;font-size:11px;color:#74535e;">${t}</p>`).join('')}
    </div>`

  const body = `
    <h1 style="margin:0 0 24px;font-size:20px;font-weight:700;color:#45051c;">${heading}</h1>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #ede6de;">
      ${rows.join('')}
    </table>
    ${itemsBlock}
    ${messageBlock}
    ${infoBlock}
    ${metaBlock}`

  return layout(body, 'dark')
}
