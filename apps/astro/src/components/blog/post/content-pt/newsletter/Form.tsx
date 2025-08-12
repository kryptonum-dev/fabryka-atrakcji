import Button from '@/src/components/ui/Button'
import Checkbox from '@/src/components/ui/checkbox'
import Input from '@/src/components/ui/input'
import { REGEX } from '@/src/global/constants'
import { translations, type Language } from '@/src/global/languages'
import type { ClientFormStateTypes, FormStatusTypes } from '@/src/global/types'
import { useState } from 'preact/hooks'
import { useForm, type FieldValues } from 'react-hook-form'
import FormState from '@/components/ui/FormState'
import Loader from '@/components/ui/Loader'
import { trackEvent } from '@/src/pages/api/analytics/track-event'

export default function Form({
  lang = 'pl',
  formState,
  groupId,
  buttonText,
}: {
  lang?: Language
  formState: ClientFormStateTypes
  groupId: string
  buttonText: string
}) {
  const [status, setStatus] = useState<FormStatusTypes>({ sending: false, success: undefined })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ mode: 'onTouched' })

  const t = translations[lang]

  const onSubmit = async (data: FieldValues) => {
    setStatus({ sending: true, success: undefined })

    data.group_id = groupId
    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const responseData = await response.json()
      if (response.ok && responseData.success) {
        setStatus({ sending: false, success: true })
        reset()

        // Track subscribe event
        trackEvent({
          user_data: {
            email: data.email,
          },
          meta: {
            event_name: 'subscribe',
            content_name: 'Blog Newsletter Subscription',
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
    <form onSubmit={handleSubmit(onSubmit)} data-finished={status.success !== undefined}>
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
        {buttonText}
      </Button>
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
