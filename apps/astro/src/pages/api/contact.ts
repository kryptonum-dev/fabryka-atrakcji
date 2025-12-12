export const prerender = false

import { checkBotId } from 'botid/server'
import { REGEX } from '@/global/constants'
import { htmlToString } from '@/utils/html-to-string'
import sanityFetch from '@/utils/sanity.fetch'
import type { APIRoute } from 'astro'

const RESEND_API_KEY = import.meta.env.RESEND_API_KEY || process.env.RESEND_API_KEY

const getContactRecipients = async (lang: string): Promise<string[]> => {
  try {
    const query = `*[_type == "global" && language == $lang][0].contactRecipients`
    const recipients = await sanityFetch<string[]>({ query, params: { lang } })
    return recipients || ['lukasz@fabryka-atrakcji.com'] // Fallback to current email
  } catch (error) {
    console.error('Failed to fetch contact recipients:', error)
    return ['lukasz@fabryka-atrakcji.com'] // Fallback on error
  }
}

const template = ({
  email,
  message,
  phone,
  lang,
  utm,
}: {
  email: string
  message: string
  phone?: string
  lang: string
  utm?: string | null
}) => {
  const normalizedUtm = utm?.trim() || null
  const utmLabel = normalizedUtm || (lang === 'en' ? 'no data' : 'brak danych')

  switch (lang) {
    case 'en':
      return `
            <p>Email: <b>${email}</b></p>
            ${!!phone && phone !== '+48' ? `<p>Phone: <b>${phone}</b></p>` : ''}
            <br />
            <p>${message.trim().replace(/\n/g, '<br />')}</p>
            <br />
            <p>UTM: <b>${utmLabel}</b></p>
        `
    default:
      return `
            <p>Adres email: <b>${email}</b></p>
            ${!!phone && phone !== '+48' ? `<p>Telefon: <b>${phone}</b></p>` : ''}
            <br />
            <p>${message.trim().replace(/\n/g, '<br />')}</p>
            <br />
            <p>UTM: <b>${utmLabel}</b></p>
        `
  }
}
const userConfirmationTemplate = ({ email, lang }: { email: string; lang: string }) => {
  switch (lang) {
    case 'en':
      return `
            <p>Hello ${email},</p>
            <p>Thank you for contacting Fabryka Atrakcji. We have received your message and will contact you soon.</p>
            <br />
            <p>Best regards,</p>
            <p>Fabryka Atrakcji Team</p>
        `
    default:
      return `
            <p>Cześć ${email},</p>
            <p>Dziękujemy za skontaktowanie się z Fabryką Atrakcji. Otrzymaliśmy Twoją wiadomość i wkrótce się z Tobą skontaktujemy.</p>
            <br />
            <p>Z poważaniem,</p>
            <p>Zespół Fabryki Atrakcji</p>
        `
  }
}

type Props = {
  email: string
  message: string
  legal: boolean
  phone: string
  lang: string
  utm?: string | null
}

export const POST: APIRoute = async ({ request }) => {
  try {
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

    const { email, message, legal, phone, lang, utm } = (await request.json()) as Props
    if (!REGEX.email.test(email) || !message || !legal) {
      return new Response(JSON.stringify({ message: 'Missing required fields', success: false }), { status: 400 })
    }

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
          from: `${lang === 'en' ? 'Fabryka Atrakcji Contact Form' : 'Formularz Fabryki Atrakcji'} <formularz@send.fabryka-atrakcji.com>`,
          to: recipient,
          reply_to: email,
          subject: `${lang === 'en' ? 'Message from contact form sent by' : 'Wiadomość z formularza kontaktowego wysłana przez'} ${email}`,
          html: template({ email, message, phone, lang, utm }),
          text: htmlToString(template({ email, message, phone, lang, utm })),
        }),
      })
    }

    // Send emails to recipients sequentially (500ms delay = 2 emails per second)
    const emailResults: Array<{ status: 'fulfilled'; value: Response } | { status: 'rejected'; error: any }> = []
    for (let i = 0; i < recipients.length; i++) {
      try {
        const delay = i * 500 // 500ms delay between emails
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
    const userRes = await fetch(`https://api.resend.com/emails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `Fabryka Atrakcji <formularz@send.fabryka-atrakcji.com>`,
        to: email,
        subject: `${lang === 'en' ? 'Thank you for contacting Fabryka Atrakcji' : 'Dziękujemy za kontakt z Fabryką Atrakcji'}`,
        html: userConfirmationTemplate({ email, lang }),
        text: htmlToString(userConfirmationTemplate({ email, lang })),
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
