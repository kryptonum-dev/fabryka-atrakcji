import { useForm, type Control } from 'react-hook-form'
import { useState } from 'react'
import Input from '@/src/components/ui/input'
import Checkbox from '@/src/components/ui/checkbox'
import { REGEX } from '@/src/global/constants'
import styles from './styles.module.scss'
import Button from '../../ui/Button'
import { cartStore } from '@/src/store/cart'

type FormData = {
  email: string
  phone?: string
  additionalInfo?: string
  legal: boolean
  newsletter: boolean
}

type QuoteFormProps = {
  translations: Record<string, string>
  quoteId: string
  mailerliteGroupId?: string
  quoteRecipients: string[]
  quote?: any
}

export default function QuoteForm({
  translations,
  quoteId,
  mailerliteGroupId,
  quoteRecipients,
  quote,
}: QuoteFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
  } = useForm<FormData>()

  // Function to clear all cart data from localStorage
  const clearCartData = () => {
    // Reset the cart store to empty state
    cartStore.set({ hotels: [], activities: [] })

    // Remove all cart-related data from localStorage
    localStorage.removeItem('cart')
    localStorage.removeItem('cart_dates')
    localStorage.removeItem('cart_order_addons')
    localStorage.removeItem('cart_participant_count')
    localStorage.removeItem('transport_address')

    // Also clear any pending transport items
    localStorage.removeItem('pending_transport_item')
    localStorage.removeItem('pending_transport_removal')
  }

  const onSubmit = async (data: FormData) => {
    // Dispatch event to show loading state
    document.dispatchEvent(new CustomEvent('quote-form-submitting'))
    setIsSubmitting(true)

    try {
      // Prepare data for the quote API
      const submitData = {
        email: data.email,
        phone: data.phone,
        additionalInfo: data.additionalInfo,
        legal: data.legal,
        newsletter: data.newsletter,
        quoteId: quoteId,
        quoteRecipients: quoteRecipients,
        lang: translations.thankYouUrl.includes('/en/') ? 'en' : 'pl',
        quote: quote,
      }

      // Send data to our API endpoint
      const response = await fetch('/api/initialQuote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      const result = await response.json()

      // Handle newsletter subscription separately if opted in
      if (data.newsletter && mailerliteGroupId) {
        try {
          // Call the existing newsletter API endpoint
          await fetch('/api/newsletter', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: data.email,
              legal: data.legal, // Reuse the legal acceptance
              group_id: mailerliteGroupId,
            }),
          })
          // We don't need to wait for or check the response
          // as this is a secondary action
        } catch (error) {
          console.error('Newsletter subscription error:', error)
          // Continue with redirect even if newsletter fails
        }
      }

      if (result.success) {
        // Clear all cart data from localStorage
        clearCartData()

        // Get the redirect URL
        const redirectUrl = result.redirectUrl || translations.thankYouUrl

        // Use location.replace() instead of replaceState + href
        // This completely replaces the current URL in history, preventing back navigation
        window.location.replace(redirectUrl)
      } else {
        // Show error state
        document.dispatchEvent(new CustomEvent('quote-form-error'))
      }
    } catch (error) {
      console.error('Form submission error:', error)
      // Dispatch error event to show error state
      document.dispatchEvent(new CustomEvent('quote-form-error'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles['QuoteForm']}>
      <Input
        label={translations.email}
        register={register('email', {
          required: { value: true, message: translations.emailRequired },
          pattern: { value: REGEX.email, message: translations.emailInvalid },
        })}
        errors={errors}
        type="email"
      />
      <Input
        label={translations.phone}
        register={{ name: 'phone' }}
        errors={errors}
        additonalInfo={translations.phoneHelper}
        phone={{
          isPhone: true,
          control: control as unknown as Control,
        }}
      />
      <Input label={translations.additionalInfo} register={register('additionalInfo')} errors={errors} isTextarea />
      <Checkbox
        register={register('legal', {
          required: { value: true, message: translations.legalRequired },
        })}
        errors={errors}
      >
        {translations.privacyPolicy}{' '}
        <a href={translations.privacyPolicyUrl} className="link" data-shade="light" target="_blank">
          {translations.privacyPolicySecond}
        </a>
      </Checkbox>

      {/* Only show newsletter checkbox if mailerliteGroupId is provided */}
      {mailerliteGroupId && (
        <Checkbox register={register('newsletter')} errors={errors}>
          {translations.newsletter}
        </Checkbox>
      )}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? <span className={styles.loader}></span> : translations.submit}
      </Button>
    </form>
  )
}
