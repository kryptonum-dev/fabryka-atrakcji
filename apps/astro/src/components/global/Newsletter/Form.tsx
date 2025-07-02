import Button from '@/src/components/ui/Button'
import Checkbox from '@/src/components/ui/checkbox'
import Input from '@/src/components/ui/input'
import { REGEX } from '@/src/global/constants'
import { translations, type Language } from '@/src/global/languages'
import type { ClientFormStateTypes, FormStatusTypes } from '@/src/global/types'
import { useState, useEffect } from 'preact/hooks'
import { useForm, type FieldValues } from 'react-hook-form'
import FormState from '../../ui/FormState'
import Loader from '../../ui/Loader'
import { trackEvent } from '@/src/pages/api/analytics/track-event'

export default function Form({
  lang = 'pl',
  formState,
  groupId,
}: {
  lang?: Language
  formState: ClientFormStateTypes
  groupId: string
}) {
  const [status, setStatus] = useState<FormStatusTypes>({ sending: false, success: undefined })
  const [shouldAnimate, setShouldAnimate] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ mode: 'onTouched' })

  const t = translations[lang]

  const updateStatus = (newStatus: FormStatusTypes) => {
    if (newStatus.success !== status.success) {
      setShouldAnimate(true)
    }
    setStatus(newStatus)
  }

  const onSubmit = async (data: FieldValues) => {
    updateStatus({ sending: true, success: undefined })
    data.group_id = groupId

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const responseData = await response.json()
      if (response.ok && responseData.success) {
        updateStatus({ sending: false, success: true })
        reset()

        // Track subscribe event
        trackEvent({
          user_data: {
            email: data.email,
          },
          ga: {
            event_name: 'lead',
          },
          meta: {
            event_name: 'Lead',
            content_name: 'Global Newsletter Subscription',
          },
        })
      } else {
        updateStatus({ sending: false, success: false })
      }
    } catch {
      updateStatus({ sending: false, success: false })
    }
  }

  const handleRestart = (e: React.MouseEvent) => {
    e.stopPropagation()
    updateStatus({ sending: false, success: undefined })
    setShouldAnimate(false)
  }

  useEffect(() => {
    if (shouldAnimate) {
      const timer = setTimeout(() => {
        setShouldAnimate(false)
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [shouldAnimate])

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
        animate={shouldAnimate}
      />
    </form>
  )
}
