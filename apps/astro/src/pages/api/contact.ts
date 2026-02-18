export const prerender = false

import { checkBotId } from 'botid/server'
import { REGEX } from '@/global/constants'
import { htmlToString } from '@/utils/html-to-string'
import sanityFetch from '@/utils/sanity.fetch'
import { clientConfirmation, teamNotification, type TeamNotificationData } from '@/src/emails/contact-emails'
import type { APIRoute } from 'astro'

const RESEND_API_KEY = import.meta.env.RESEND_API_KEY || process.env.RESEND_API_KEY

// STAGING/PREVIEW OVERRIDE — remove before production merge
const PREVIEW_RECIPIENTS = ['oliwier@kryptonum.eu']
const IS_PREVIEW_DEPLOYMENT = process.env.VERCEL_ENV === 'preview'

const getContactRecipients = async (lang: string): Promise<string[]> => {
  if (IS_PREVIEW_DEPLOYMENT && PREVIEW_RECIPIENTS.length > 0) {
    console.log(`[PREVIEW] Overriding recipients to: ${PREVIEW_RECIPIENTS.join(', ')}`)
    return PREVIEW_RECIPIENTS
  }

  try {
    const query = `*[_type == "global" && language == $lang][0].contactRecipients`
    const recipients = await sanityFetch<string[]>({ query, params: { lang } })
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

export const POST: APIRoute = async ({ request }) => {
  try {
    // TODO: Remove DEV guard after testing
    if (!import.meta.env.DEV) {
      const verification = await checkBotId()
      if (verification?.isBot) {
        console.warn('BotID blocked request:', {
          isBot: verification.isBot,
          isHuman: verification.isHuman,
          isVerifiedBot: verification.isVerifiedBot,
          bypassed: verification.bypassed,
        })
        return new Response(JSON.stringify({ message: 'Access denied', success: false }), { status: 403 })
      }
    }

    const data = (await request.json()) as Props
    const { email, legal, phone, lang, utm } = data

    // Validation: email + legal always required; message required for simple form, name required for inquiry form
    if (!REGEX.email.test(email) || !legal) {
      return new Response(JSON.stringify({ message: 'Missing required fields', success: false }), { status: 400 })
    }

    if (isInquiryForm(data)) {
      if (!data.name) {
        return new Response(JSON.stringify({ message: 'Missing name field', success: false }), { status: 400 })
      }
    } else {
      if (!data.message) {
        return new Response(JSON.stringify({ message: 'Missing message field', success: false }), { status: 400 })
      }
    }

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
