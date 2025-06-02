export const prerender = false

import { REGEX } from '@/global/constants'
import { htmlToString } from '@/utils/html-to-string'
import sanityFetch from '@/utils/sanity.fetch'
import type { APIRoute } from 'astro'

const RESEND_API_KEY = import.meta.env.RESEND_API_KEY || process.env.RESEND_API_KEY

const getContactRecipients = async (lang: string): Promise<string[]> => {
  try {
    const query = `*[_type == "global" && language == $lang][0].contactRecipients`
    const recipients = await sanityFetch<string[]>({ query, params: { lang } })
    return recipients || ['oliwier@kryptonum.eu'] // Fallback to current email
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
}: {
  email: string
  message: string
  phone?: string
  lang: string
}) => {
  switch (lang) {
    case 'en':
      return `
            <p>Email: <b>${email}</b></p>
            ${!!phone && phone !== '+48' ? `<p>Phone: <b>${phone}</b></p>` : ''}
            <br />
            <p>${message.trim().replace(/\n/g, '<br />')}</p>   
        `
    default:
      return `
            <p>Adres email: <b>${email}</b></p>
            ${!!phone && phone !== '+48' ? `<p>Telefon: <b>${phone}</b></p>` : ''}
            <br />
            <p>${message.trim().replace(/\n/g, '<br />')}</p>   
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
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const { email, message, legal, phone, lang } = (await request.json()) as Props
    if (!REGEX.email.test(email) || !message || !legal) {
      return new Response(JSON.stringify({ message: 'Missing required fields', success: false }), { status: 400 })
    }

    // Fetch dynamic recipients
    const recipients = await getContactRecipients(lang)

    // Send to all recipients
    const emailPromises = recipients.map((recipient) =>
      fetch(`https://api.resend.com/emails`, {
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
          html: template({ email, message, phone, lang }),
          text: htmlToString(template({ email, message, phone, lang })),
        }),
      })
    )

    // Wait for all emails to be sent
    const emailResults = await Promise.allSettled(emailPromises)

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
      return new Response(
        JSON.stringify({
          message: 'Failed to send confirmation email to user',
          success: false,
        }),
        { status: 400 }
      )
    }

    return new Response(
      JSON.stringify({ message: 'Successfully sent message and confirmation email', success: true }),
      { status: 200 }
    )
  } catch {
    return new Response(JSON.stringify({ message: 'An error occurred while sending message', success: false }), {
      status: 400,
    })
  }
}
