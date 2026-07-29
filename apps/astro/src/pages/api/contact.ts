export const prerender = false

import { checkBotId } from 'botid/server'
import { REGEX } from '@/global/constants'
import { htmlToString } from '@/utils/html-to-string'
import sanityFetch from '@/utils/sanity.fetch'
import { clientConfirmation, teamNotification, type TeamNotificationData } from '@/src/emails/contact-emails'
import type { APIRoute } from 'astro'

const RESEND_API_KEY = import.meta.env.RESEND_API_KEY || process.env.RESEND_API_KEY

const getContactRecipients = async (lang: string): Promise<string[]> => {
  try {
    const query = `*[_type == "global" && language == $lang][0].contactRecipients`
    const recipients = await sanityFetch<string[]>({ query, params: { lang }, tag: 'api.contact' })
    return recipients || ['lukasz@fabryka-atrakcji.com']
  } catch (error) {
    console.error('Failed to fetch contact recipients:', error)
    return ['lukasz@fabryka-atrakcji.com']
  }
}

// --- Shared types ---

type SelectedItem = { type: string; id: string; name: string; image?: string; url?: string }
type ContextItem = { type: string; id: string; name: string }

type BaseProps = {
  email: string
  legal: boolean
  phone?: string
  lang: string
  utm?: string | null
  /**
   * Honeypot. Deliberately named so no browser autofill heuristic can classify it — the
   * previous name `companyWebsite` matched Chromium's COMPANY_NAME regex on the `company`
   * substring, so Chrome/Edge filled it for real users. See the note on honeypotConfirmed.
   */
  ref2?: string
  /** Milliseconds between form render and submit, measured client-side. */
  elapsedMs?: number
}

type SimpleFormProps = BaseProps & {
  message: string
}

type InquiryFormProps = BaseProps & {
  name: string
  teamSize?: string
  timeline?: string
  region?: string
  needsIntegration?: boolean
  additionalInfo?: string
  contextItem?: ContextItem
  contextItemType?: string
  contextItemId?: string
  contextItemName?: string
  selectedItems?: SelectedItem[]
  sourceUrl?: string
}

type Props = SimpleFormProps | InquiryFormProps

const isInquiryForm = (data: Props): data is InquiryFormProps => 'name' in data && !!data.name
const MIN_ADDITIONAL_INFO_LETTERS = 16
const countLetters = (value: string) => (value.match(/\p{L}/gu) || []).length

// --- Bot signals ---

/** Nobody fills a B2B inquiry form in under three seconds. */
const MIN_FILL_MS = 3000

type BotIdVerdict = {
  isBot: boolean | null
  isHuman: boolean | null
  bypassed: boolean | null
  /** Absent means the client script never ran — NOT evidence of a bot. See note below. */
  headerPresent: boolean
  error?: string
}

/**
 * BotID never rejects on its own. It can only CONFIRM a honeypot trip — see
 * honeypotConfirmed below. A bot verdict with an empty honeypot is logged and let through.
 *
 * In April 2026 (commit c17a8ea) BotID was removed after blocking real users: the
 * `x-is-human` header was going missing for legitimate visitors — ad blockers, privacy
 * extensions, a submit that beat classification — and absent evidence was being treated
 * as proof of a bot. Leads landed in the Google Sheet with no email ever sent.
 *
 * So: this function can never throw. Every failure path returns nulls, which the
 * `isBot === true` check downstream reads as "not a bot" and lets the submission through.
 * Before BotID is ever allowed to block by itself, check the [BOTLOG] lines for accepted
 * submissions where isBot=true — those would have been the false positives.
 */
const getBotIdVerdict = async (request: Request): Promise<BotIdVerdict> => {
  const headerPresent = request.headers.has('x-is-human')
  const unknown = { isBot: null, isHuman: null, bypassed: null, headerPresent }
  if (import.meta.env.DEV) return unknown
  try {
    const verification = await checkBotId({ advancedOptions: { checkLevel: 'basic' } })
    return {
      isBot: verification?.isBot ?? null,
      isHuman: verification?.isHuman ?? null,
      bypassed: verification?.bypassed ?? null,
      headerPresent,
    }
  } catch (error) {
    return { ...unknown, error: error instanceof Error ? error.message : String(error) }
  }
}

/**
 * Every submission is logged to stdout (Vercel runtime logs) under a single greppable
 * prefix, whether accepted or rejected. Search `[BOTLOG]` in the Vercel dashboard.
 * The verdict is deliberately NOT returned to the caller — telling a spammer they were
 * detected just lets them tune around it.
 */
const logSubmission = (params: {
  verdict: 'accepted' | 'rejected'
  reason: string
  data: Partial<BaseProps & InquiryFormProps>
  honeypotTripped: boolean
  honeypotValue: string | null
  elapsedMs: number | null
  botid: BotIdVerdict
  request: Request
  clientAddress: string | null
}) => {
  const { verdict, reason, data, honeypotTripped, honeypotValue, elapsedMs, botid, request, clientAddress } = params
  console.info(
    '[BOTLOG]',
    JSON.stringify({
      verdict,
      reason,
      honeypotTripped,
      // Truncated: enough to tell a browser autofill (a company name) from bot filler text,
      // without dumping arbitrary user input into the logs.
      honeypotValue: honeypotValue ? honeypotValue.slice(0, 32) : null,
      elapsedMs,
      botid,
      email: data.email ?? null,
      lang: data.lang ?? null,
      sourceUrl: data.sourceUrl ?? null,
      ip: clientAddress,
      ua: request.headers.get('user-agent'),
      referer: request.headers.get('referer'),
    })
  )
}

// --- Email helpers ---

const buildTeamData = (data: Props, isInquiry: boolean): TeamNotificationData => {
  if (isInquiry) {
    const d = data as InquiryFormProps
    const contextItem = d.contextItem || (d.contextItemName ? {
      type: d.contextItemType || '',
      id: d.contextItemId || '',
      name: d.contextItemName,
    } : null)

    return {
      formType: 'inquiry',
      email: d.email,
      phone: d.phone,
      lang: d.lang,
      utm: d.utm,
      name: d.name,
      teamSize: d.teamSize,
      timeline: d.timeline,
      region: d.region,
      needsIntegration: d.needsIntegration,
      additionalInfo: d.additionalInfo,
      contextItem,
      selectedItems: d.selectedItems,
      sourceUrl: d.sourceUrl,
    }
  }

  const d = data as SimpleFormProps
  return {
    formType: 'simple',
    email: d.email,
    phone: d.phone,
    lang: d.lang,
    utm: d.utm,
    message: d.message,
  }
}

// --- API Route ---

export const POST: APIRoute = async ({ request, clientAddress }) => {
  try {
    const data = (await request.json()) as Props
    const { email, legal, phone, lang, utm } = data

    const ip = clientAddress ?? null
    const honeypotValue = data.ref2?.trim() || null
    const honeypotTripped = !!honeypotValue
    const elapsedMs = typeof data.elapsedMs === 'number' ? data.elapsedMs : null
    const tooFast = elapsedMs !== null && elapsedMs < MIN_FILL_MS
    const botid = await getBotIdVerdict(request)
    const logContext = {
      data: data as Partial<BaseProps & InquiryFormProps>,
      honeypotTripped,
      honeypotValue,
      elapsedMs,
      botid,
      request,
      clientAddress: ip,
    }

    /**
     * The honeypot alone is NOT sufficient to reject.
     *
     * On 2026-07-29 it blocked two real B2B leads (IFB Poland, Simon Kucher) — Chrome and
     * Edge ignore `autocomplete="off"` for address-profile autofill and filled the field
     * for humans. Three of the four honeypot trips in that observation window were false
     * positives. BotID, meanwhile, was right 6/6 and said `isHuman` for every one of them.
     *
     * So a honeypot trip only rejects when BotID independently agrees it is a bot. The
     * `=== true` is deliberate: a null/unknown verdict (BotID errored, header missing,
     * classification never ran) falls through to accept, keeping the fail-open posture that
     * c17a8ea established after the last round of blocked leads.
     */
    const honeypotConfirmed = honeypotTripped && botid.isBot === true

    // Rejections return the same generic 400 as a validation failure, so a spammer cannot
    // tell detection apart from a malformed payload.
    if (honeypotConfirmed || tooFast) {
      logSubmission({
        ...logContext,
        verdict: 'rejected',
        reason: honeypotConfirmed ? 'honeypot+botid' : 'too-fast',
      })
      return new Response(JSON.stringify({ message: 'Missing required fields', success: false }), { status: 400 })
    }

    // Validation: email + legal always required; message required for simple form, name required for inquiry form
    if (!REGEX.email.test(email) || !legal) {
      logSubmission({ ...logContext, verdict: 'rejected', reason: 'invalid-email-or-legal' })
      return new Response(JSON.stringify({ message: 'Missing required fields', success: false }), { status: 400 })
    }

    if (isInquiryForm(data)) {
      if (!data.name) {
        logSubmission({ ...logContext, verdict: 'rejected', reason: 'missing-name' })
        return new Response(JSON.stringify({ message: 'Missing name field', success: false }), { status: 400 })
      }

      const additionalInfo = data.additionalInfo?.trim() || ''
      const isAdditionalInfoValid = additionalInfo.length > 0 && countLetters(additionalInfo) >= MIN_ADDITIONAL_INFO_LETTERS
      if (!isAdditionalInfoValid) {
        logSubmission({ ...logContext, verdict: 'rejected', reason: 'additional-info-too-short' })
        const message =
          lang === 'en'
            ? 'Additional information is required and must contain at least 16 letters'
            : 'Dodatkowe informacje są wymagane i muszą zawierać co najmniej 16 liter'
        return new Response(JSON.stringify({ message, success: false }), { status: 400 })
      }
    } else {
      if (!data.message) {
        logSubmission({ ...logContext, verdict: 'rejected', reason: 'missing-message' })
        return new Response(JSON.stringify({ message: 'Missing message field', success: false }), { status: 400 })
      }
    }

    logSubmission({ ...logContext, verdict: 'accepted', reason: 'passed-all-checks' })

    // Build email content based on form type
    const isInquiry = isInquiryForm(data)
    const teamData = buildTeamData(data, isInquiry)
    const emailHtml = teamNotification(teamData)
    const emailSubject = isInquiry
      ? `${lang === 'en' ? 'New inquiry from' : 'Nowe zapytanie od'} ${data.name}`
      : `${lang === 'en' ? 'Message from contact form sent by' : 'Wiadomość z formularza kontaktowego wysłana przez'} ${email}`

    // Fetch dynamic recipients
    const recipients = await getContactRecipients(lang)

    // Send emails sequentially to respect rate limit (2 emails per second)
    const sendEmailWithDelay = async (recipient: string, delay: number) => {
      if (delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay))
      }

      return fetch(`https://api.resend.com/emails`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: `${isInquiry ? (lang === 'en' ? 'Fabryka Atrakcji Inquiry' : 'Zapytanie Fabryka Atrakcji') : (lang === 'en' ? 'Fabryka Atrakcji Contact Form' : 'Formularz Fabryki Atrakcji')} <formularz@send.fabryka-atrakcji.com>`,
          to: recipient,
          reply_to: email,
          subject: emailSubject,
          html: emailHtml,
          text: htmlToString(emailHtml),
        }),
      })
    }

    // Send emails to recipients sequentially (500ms delay = 2 emails per second)
    const emailResults: Array<{ status: 'fulfilled'; value: Response } | { status: 'rejected'; error: any }> = []
    for (let i = 0; i < recipients.length; i++) {
      try {
        const delay = i * 500
        const result = await sendEmailWithDelay(recipients[i], delay)
        emailResults.push({ status: 'fulfilled', value: result })
      } catch (error) {
        console.error(`Failed to send email to ${recipients[i]}:`, error)
        emailResults.push({ status: 'rejected', error })
      }
    }

    // Check if any email failed
    const failedEmails = emailResults.filter(
      (result) => result.status === 'rejected' || (result.status === 'fulfilled' && result.value.status !== 200)
    )

    if (failedEmails.length === emailResults.length) {
      return new Response(JSON.stringify({ message: 'Failed to send emails to all recipients', success: false }), {
        status: 400,
      })
    }

    // Log if some emails failed but not all
    if (failedEmails.length > 0) {
      console.warn(`Failed to send ${failedEmails.length} out of ${emailResults.length} emails`)
    }

    // Wait additional time before sending user confirmation to respect rate limit
    const additionalDelay = recipients.length * 500
    await new Promise((resolve) => setTimeout(resolve, additionalDelay))

    // Send user confirmation email
    const confirmationName = isInquiry ? data.name : undefined
    const confirmationSubject = isInquiry
      ? (lang === 'en' ? 'We received your inquiry — Fabryka Atrakcji' : 'Otrzymaliśmy Twoje zapytanie — Fabryka Atrakcji')
      : (lang === 'en' ? 'Thank you for contacting Fabryka Atrakcji' : 'Dziękujemy za kontakt z Fabryką Atrakcji')

    const confirmationHtml = clientConfirmation({ name: confirmationName, email, lang })
    const userRes = await fetch(`https://api.resend.com/emails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `Fabryka Atrakcji <formularz@send.fabryka-atrakcji.com>`,
        to: email,
        subject: confirmationSubject,
        html: confirmationHtml,
        text: htmlToString(confirmationHtml),
      }),
    })

    if (userRes.status !== 200) {
      const errorData = await userRes.json().catch(() => ({}))
      console.error('Failed to send user confirmation:', errorData)

      // Still return success for the main emails, but log the confirmation failure
      return new Response(
        JSON.stringify({
          message:
            'Messages sent successfully, but confirmation email failed. Please check if the email address is correct.',
          success: true,
          warning: 'Confirmation email not sent',
        }),
        { status: 200 }
      )
    }

    return new Response(
      JSON.stringify({ message: 'Successfully sent message and confirmation email', success: true }),
      { status: 200 }
    )
  } catch (error) {
    console.error('Contact form error:', error)
    return new Response(JSON.stringify({ message: 'An error occurred while sending message', success: false }), {
      status: 400,
    })
  }
}
