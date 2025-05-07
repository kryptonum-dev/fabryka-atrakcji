import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import Input from '../../ui/input'
import styles from './styles.module.scss'

type FormValues = {
  street: string
  postal: string
  city: string
}

type TranslationType = {
  title: string
  street: string
  streetPlaceholder: string
  streetRequired: string
  postal: string
  postalPlaceholder: string
  postalRequired: string
  postalPattern: string
  city: string
  cityRequired: string
  submit: string
}

interface AddressFormProps {
  onSubmit?: (data: FormValues) => void
  defaultValues?: Partial<FormValues>
  translations: TranslationType
}

export default function AddressForm({ onSubmit, defaultValues = {}, translations }: AddressFormProps) {
  // Keep a reference to the original values for cancellation
  const [originalValues, setOriginalValues] = useState<Partial<FormValues>>({})
  const formInitialized = useRef(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues,
  })

  // Load default values from localStorage on mount
  useEffect(() => {
    if (formInitialized.current) return

    try {
      const savedAddress = localStorage.getItem('transport_address')
      if (savedAddress) {
        const parsedAddress = JSON.parse(savedAddress)
        // Only reset if we have valid data
        if (parsedAddress.street || parsedAddress.postal || parsedAddress.city) {
          setOriginalValues(parsedAddress)
          reset(parsedAddress)
          formInitialized.current = true
        }
      }
    } catch (error) {
      console.error('Error loading saved address data:', error)
    }
  }, [reset])

  // Set up event listeners for popup close to reset form
  useEffect(() => {
    // Find the close button in the popup
    const popupCloseBtn = document.querySelector('.address-popup .CloseButton')
    const popupContent = document.querySelector('.address-popup')

    const handleClose = () => {
      // Reset form to original values when popup is closed without submitting
      reset(originalValues)
    }

    // Listen for close button click
    if (popupCloseBtn) {
      popupCloseBtn.addEventListener('click', handleClose)
    }

    // Listen for click outside (assuming your popup system has a click-outside-to-close feature)
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popupContent &&
        !popupContent.contains(e.target as Node) &&
        e.target &&
        !(e.target as Element).closest('.address-popup')
      ) {
        handleClose()
      }
    }

    document.addEventListener('click', handleClickOutside)

    return () => {
      if (popupCloseBtn) {
        popupCloseBtn.removeEventListener('click', handleClose)
      }
      document.removeEventListener('click', handleClickOutside)
    }
  }, [reset, originalValues])

  const submitHandler = (data: FormValues) => {
    // Update original values on successful submit
    setOriginalValues(data)

    // Save data to localStorage
    localStorage.setItem('transport_address', JSON.stringify(data))

    // Dispatch custom event for CartPage.astro to handle
    const event = new CustomEvent('address-form-submitted', {
      detail: { data },
      bubbles: true,
    })
    document.dispatchEvent(event)

    // Call onSubmit prop if provided
    if (onSubmit) {
      onSubmit(data)
    }

    // Try to close the popup
    try {
      const popup = document.querySelector('.address-popup')
      if (popup) {
        const closeButton = popup.querySelector('.CloseButton')
        if (closeButton && closeButton instanceof HTMLElement) {
          closeButton.click()
        }
      }
    } catch (error) {
      console.error('Error closing popup:', error)
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit(submitHandler)}>
      <Input
        register={register('street', {
          required: translations.streetRequired,
        })}
        label={translations.street}
        placeholder={translations.streetPlaceholder}
        errors={errors}
      />

      <div className={styles.row} style={{ marginBottom: errors.postal ? '1.5rem' : '0' }}>
        <Input
          register={register('postal', {
            required: translations.postalRequired,
            pattern: {
              value: /^\d{2}-\d{3}$/,
              message: translations.postalPattern,
            },
          })}
          label={translations.postal}
          placeholder={translations.postalPlaceholder}
          errors={errors}
        />

        <Input
          register={register('city', {
            required: translations.cityRequired,
          })}
          label={translations.city}
          errors={errors}
        />
      </div>

      <button className={styles.submit} type="submit">
        {translations.submit}
      </button>
    </form>
  )
}
