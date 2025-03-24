export const prerender = false

import { REGEX } from '@/global/constants'
import { htmlToString } from '@/utils/html-to-string'
import type { APIRoute } from 'astro'

const RESEND_API_KEY = import.meta.env.RESEND_API_KEY || process.env.RESEND_API_KEY

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
    const res = await fetch(`https://api.resend.com/emails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `${lang === 'en' ? 'Fabryka Atrakcji Contact Form' : 'Formularz Fabryki Atrakcji'} <formularz@send.fabryka-atrakcji.com>`,
        to: 'oliwier@kryptonum.eu',
        reply_to: email,
        subject: `${lang === 'en' ? 'Message from contact form sent by' : 'Wiadomość z formularza kontaktowego wysłana przez'} ${email}`,
        html: template({ email, message, phone, lang }),
        text: htmlToString(template({ email, message, phone, lang })),
      }),
    })

    if (res.status !== 200) {
      return new Response(JSON.stringify({ message: 'Something went wrong', success: false }), { status: 400 })
    }

    const userRes = await fetch(`https://api.resend.com/emails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `${lang === 'en' ? 'Fabryka Atrakcji Contact Form' : 'Formularz Fabryki Atrakcji'} <formularz@send.fabryka-atrakcji.com>`,
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
