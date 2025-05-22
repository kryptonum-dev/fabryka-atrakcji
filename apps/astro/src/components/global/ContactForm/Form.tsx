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
import { trackEvent } from '@/src/utils/track-event'

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

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, lang }),
      })
      const responseData = await response.json()

      if (response.ok && responseData.success) {
        setStatus({ sending: false, success: true })
        reset()

        trackEvent({
          event_name: 'contact',
          user_data: {
            email: data.email,
            phone: data.phone || undefined,
          },
          meta: {
            content_name: 'Contact Form Submission',
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
          required: { value: true, message: t.form.legal.required },
        })}
        errors={errors}
      >
        {t.form.legal.labelFirst}{' '}
        <a
          href={t.form.legal.link}
          target="_blank"
          rel="noopener noreferrer"
          className="link"
          data-shade="light"
          tabIndex={isFilled ? -1 : 0}
        >
          {t.form.legal.labelSecond}
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
