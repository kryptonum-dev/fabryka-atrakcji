import { Controller, type Control, type FieldErrors } from 'react-hook-form'
import { PhoneInput } from 'react-international-phone'
import Error from '../error'
import styles from './Input.module.scss'
import Textarea from './Textarea'

type Props = {
  register: {
    name: string
  }
  label: string
  additonalInfo?: string
  isTextarea?: boolean
  phone?: {
    isPhone: boolean
    control: Control
    rules?: {
      required: { value: boolean; message: string }
      pattern: { value: RegExp; message: string }
    }
  }
  errors: FieldErrors
} & React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement>

export default function Input({ register, label, additonalInfo, isTextarea, phone, errors, ...props }: Props) {
  const Element = isTextarea ? Textarea : 'input'

  console.log(errors)

  const handlePhoneKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow: backspace, delete, tab, escape, arrow keys, home, end
    if (
      e.key === 'Backspace' ||
      e.key === 'Delete' ||
      e.key === 'Tab' ||
      e.key === 'Escape' ||
      e.key === 'ArrowLeft' ||
      e.key === 'ArrowRight' ||
      e.key === 'ArrowUp' ||
      e.key === 'ArrowDown' ||
      e.key === 'Home' ||
      e.key === 'End' ||
      // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
      ((e.ctrlKey || e.metaKey) && (e.key === 'a' || e.key === 'c' || e.key === 'v' || e.key === 'x'))
    ) {
      return
    }

    // Allow: + key (for international format)
    if (e.key === '+') return

    // Ensure that it is a number and stop the keypress if not
    if (!/[0-9]/.test(e.key)) {
      e.preventDefault()
    }
  }

  return (
    <label className={styles.Input} data-is-phone={phone?.isPhone}>
      <div className={styles.wrapper}>
        <p className={styles.label}>{label}</p>
        {additonalInfo && <p className={styles.additonalInfo}>{additonalInfo}</p>}
        <Error error={errors[register.name]?.message?.toString()} />
      </div>
      <div className={styles.box}>
        <div className={styles.gradient}></div>
        {phone?.isPhone ? (
          <Controller
            data-lenis-prevent
            name={register.name}
            rules={phone.rules}
            control={phone.control}
            render={({ field }) => (
              <PhoneInput
                {...props}
                {...field}
                defaultCountry="pl"
                inputProps={{
                  onKeyDown: handlePhoneKeyDown,
                }}
              />
            )}
          />
        ) : (
          <Element {...register} {...props} aria-invalid={!!errors[register.name]} />
        )}
      </div>
    </label>
  )
}
