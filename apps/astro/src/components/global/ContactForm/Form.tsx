import Button from '@/src/components/ui/Button'
import Checkbox from '@/src/components/ui/checkbox'
import Input from '@/src/components/ui/input'
import { REGEX } from '@/src/global/constants'
import { translations, type Language } from '@/src/global/languages'
import type { ClientFormStateTypes, FormStatusTypes } from '@/src/global/types'
import { useState } from 'preact/hooks'
import { useForm, type FieldValues } from 'react-hook-form'
import FormState from '../../ui/FormState'
import Loader from '../../ui/Loader'
import { trackEvent } from '@/utils/track-event'
import { getUtmString, getUtmForSheet } from '@/utils/analytics-user-storage'

export default function Form({
  lang = 'pl',
  formState,
  children,
}: {
  lang?: Language
  formState: ClientFormStateTypes
  children: React.ReactNode
}) {
  const [status, setStatus] = useState<FormStatusTypes>({ sending: false, success: undefined })

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm({ mode: 'onTouched' })

  const t = translations[lang]

  const onSubmit = async (data: FieldValues) => {
    setStatus({ sending: true, success: undefined })

    // Fire and forget - log to Google Sheet (sendBeacon guarantees delivery)
    navigator.sendBeacon('/api/s3d', JSON.stringify({
      formType: 'contact_form',
      email: data.email,
      phone: data.phone && data.phone !== '+48' ? data.phone : undefined,
      message: data.message,
      utm: getUtmForSheet(),
    }))

    try {
      const utmString = getUtmString()
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, lang, ...(utmString ? { utm: utmString } : {}) }),
      })
      const responseData = await response.json()

      if (response.ok && responseData.success) {
        setStatus({ sending: false, success: true })
        reset()

        trackEvent({
          user: {
            email: data.email,
            phone: data.phone && data.phone !== '+48' ? data.phone : undefined,
          },
          ga4: {
            eventName: 'lead',
            params: {
              form_name: 'contact_form',
            },
          },
          meta: {
            eventName: 'Lead',
            contentName: 'contact_form',
            params: {
              form_name: 'contact_form',
            },
          },
        })
      } else {
        setStatus({ sending: false, success: false })
      }
    } catch {
      setStatus({ sending: false, success: false })
    }
  }

  const handleRestart = (e: React.MouseEvent) => {
    e.stopPropagation()
    setStatus({ sending: false, success: undefined })
  }

  const isFilled = status.sending || status.success !== undefined

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input
        aria-hidden={isFilled}
        disabled={isFilled}
        label={t.form.email.label}
        register={register('email', {
          required: { value: true, message: t.form.email.required },
          pattern: { value: REGEX.email, message: t.form.email.pattern },
        })}
        errors={errors}
        type="email"
      />
      <Input
        aria-hidden={isFilled}
        disabled={isFilled}
        register={{ name: 'phone' }}
        errors={errors}
        additonalInfo={t.form.phone.description}
        label={t.form.phone.label}
        phone={{
          isPhone: true,
          control,
        }}
      />
      <Input
        aria-hidden={isFilled}
        disabled={isFilled}
        label={t.form.message.label}
        register={register('message', {
          required: { value: true, message: t.form.message.required },
        })}
        errors={errors}
        isTextarea
      />
      <Checkbox
        aria-hidden={isFilled}
        disabled={isFilled}
        register={register('legal', {
          required: { value: true, message: t.form.combined.required },
        })}
        errors={errors}
      >
        {t.form.combined.labelFirst}{' '}
        <a
          href={t.form.combined.termsLink}
          target="_blank"
          rel="noopener noreferrer"
          className="link"
          data-shade="light"
          tabIndex={isFilled ? -1 : 0}
        >
          {t.form.combined.labelSecond}
        </a>{' '}
        {t.form.combined.labelMiddle}{' '}
        <a
          href={t.form.combined.privacyLink}
          target="_blank"
          rel="noopener noreferrer"
          className="link"
          data-shade="light"
          tabIndex={isFilled ? -1 : 0}
        >
          {t.form.combined.labelThird}
        </a>
      </Checkbox>
      <Button type="submit" disabled={isFilled}>
        {t.form.submit}
      </Button>
      {children}
      <Loader
        isLoading={isFilled}
        hasFinishedLoading={status.sending === false && status.success !== undefined}
        lang={lang}
      />
      <FormState
        success={formState.success}
        error={formState.error}
        isSuccess={status.success}
        handleRestart={handleRestart}
        lang={lang}
      />
    </form>
  )
}
