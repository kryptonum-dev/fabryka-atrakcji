import Checkbox from '@/src/components/ui/checkbox'
import Input from '@/src/components/ui/input'
import { REGEX } from '@/src/global/constants'
import { useEffect, useState } from 'preact/hooks'
import { useForm, type FieldValues } from 'react-hook-form'

const translations = (status?: 'idle' | 'loading' | 'success' | 'error') => {
  return {
    pl: {
      legal: {
        label: (
          <>
            Wyrażam zgodę na{' '}
            <a
              href="/pl/polityka-prywatnosci"
              data-shade="light"
              target="_blank"
              rel="noreferrer"
              className="link"
              tabIndex={status === 'loading' ? -1 : 0}
            >
              politykę prywatności
            </a>
          </>
        ),
        required: 'Zgoda jest wymagana',
      },
      email: {
        label: 'Email',
        required: 'Email jest wymagany',
        pattern: 'Niepoprawny adres e-mail',
      },
      phone: {
        label: 'Telefon (opcjonalnie)',
        description: 'Gwarantujemy kontakt wyłącznie w odpowiedzi na zadane pytania',
      },
      message: {
        label: 'Temat wiadomości',
        required: 'Temat jest wymagany',
      },
    },
    en: {
      legal: {
        label: (
          <>
            I agree to the{' '}
            <a
              href="/en/privacy-policy"
              data-shade="light"
              target="_blank"
              rel="noreferrer"
              className="link"
              tabIndex={status === 'loading' ? -1 : 0}
            >
              privacy policy
            </a>
          </>
        ),
        required: 'Legal consent is required',
      },
      email: {
        label: 'Email',
        required: 'Email is required',
        pattern: 'Invalid email address',
      },
      phone: {
        label: 'Phone (optional)',
        description: 'We guarantee contact only in response to questions asked',
      },
      message: {
        label: 'Message subject',
        required: 'Subject is required',
      },
    },
  }
}
export default function Form({
  children,
  lang = 'pl',
  ...props
}: {
  children: React.ReactNode
  lang?: 'pl' | 'en'
} & React.FormHTMLAttributes<HTMLFormElement>) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    control,
  } = useForm({ mode: 'onTouched' })

  useEffect(() => {
    const tryAgain = () => {
      setStatus('idle')
    }

    document.addEventListener('contact:try-again', tryAgain)
    return () => document.removeEventListener('contact:try-again', tryAgain)
  }, [])

  useEffect(() => {
    if (status === 'loading') {
      const submitButton = document.querySelectorAll('#submit')

      submitButton.forEach((button) => {
        button.setAttribute('disabled', 'disabled')
      })
    }

    if (status === 'idle') {
      const submitButton = document.querySelectorAll('#submit')

      submitButton.forEach((button) => {
        button.removeAttribute('disabled')
      })
    }
  }, [status])

  const onSubmit = async (data: FieldValues) => {
    setStatus('loading')

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, lang }),
      })
      const responseData = await response.json()
      if (response.ok && responseData.success) {
        setStatus('success')
        reset()
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  return (
    <form {...props} onSubmit={handleSubmit(onSubmit)} data-status={status}>
      <Input
        aria-hidden={status === 'loading'}
        disabled={status === 'loading'}
        label={translations()[lang].email.label}
        register={register('email', {
          required: { value: true, message: translations()[lang].email.required },
          pattern: { value: REGEX.email, message: translations()[lang].email.pattern },
        })}
        errors={errors}
        type="email"
      />
      <Input
        aria-hidden={status === 'loading'}
        disabled={status === 'loading'}
        register={{ name: 'phone' }}
        errors={errors}
        additonalInfo={translations()[lang].phone.description}
        label={translations()[lang].phone.label}
        phone={{
          isPhone: true,
          control,
        }}
      />
      <Input
        aria-hidden={status === 'loading'}
        disabled={status === 'loading'}
        label={translations()[lang].message.label}
        register={register('message', {
          required: { value: true, message: translations()[lang].message.required },
        })}
        errors={errors}
        isTextarea
      />
      <Checkbox
        aria-hidden={status === 'loading'}
        disabled={status === 'loading'}
        register={register('legal', {
          required: { value: true, message: translations()[lang].legal.required },
        })}
        errors={errors}
      >
        {translations(status)[lang].legal.label}
      </Checkbox>
      {children}
    </form>
  )
}
