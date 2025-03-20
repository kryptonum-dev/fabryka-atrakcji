import Input from '@/src/components/ui/input'
import { REGEX } from '@/src/global/constants'
import { useEffect, useState } from 'preact/hooks'
import { useForm, type FieldValues } from 'react-hook-form'

export default function Form({
  children,
  privacyPolicy,
  phoneDescription,
  ...props
}: {
  children: React.ReactNode
  privacyPolicy: {
    text: string
    link: string
  }
  phoneDescription: string
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

    document.addEventListener('Contact-TryAgain', tryAgain)
    return () => document.removeEventListener('Contact-TryAgain', tryAgain)
  }, [])

  const onSubmit = async (data: FieldValues) => {
    setStatus('loading')

    //   const response = await sendContactEmail(data as sendContactEmailProps)

    const response = { success: true }

    if (response.success) {
      setStatus('success')
      reset()
    } else {
      setStatus('error')
    }
  }

  console.log(errors)

  return (
    <form {...props} onSubmit={handleSubmit(onSubmit)} data-status={status}>
      <Input
        aria-hidden={status === 'loading'}
        tabIndex={status === 'loading' ? -1 : 0}
        label="Email"
        register={register('email', {
          required: { value: true, message: 'Email jest wymagany' },
          pattern: { value: REGEX.email, message: 'Niepoprawny adres e-mail' },
        })}
        errors={errors}
        type="email"
      />
      <Input
        aria-hidden={status === 'loading'}
        disabled={status === 'loading'}
        register={{ name: 'phone' }}
        errors={errors}
        additonalInfo={phoneDescription}
        label="Telefon (opcjonalnie)"
        phone={{
          isPhone: true,
          control,
        }}
      />
      <Input
        aria-hidden={status === 'loading'}
        disabled={status === 'loading'}
        label="Temat wiadomości"
        register={register('message', {
          required: { value: true, message: 'Temat jest wymagany' },
        })}
        errors={errors}
        isTextarea
        placeholder="Napisz o czym chcesz porozmawiać"
      />
      {/* <Checkbox
        aria-hidden={status === 'loading'}
        disabled={status === 'loading'}
        register={register('legal', {
          required: { value: true, message: 'Zgoda jest wymagana' },
        })}
        errors={errors}
      >
        Akceptuję{' '}
        <a
          href="/polityka-prywatnosci"
          aria-hidden={status === 'loading'}
          tabIndex={status === 'loading' ? -1 : 0}
          target="_blank"
          rel="noopener noreferrer"
          className="link"
        >
          politykę prywatności
        </a>
      </Checkbox> */}
      {children}
    </form>
  )
}
