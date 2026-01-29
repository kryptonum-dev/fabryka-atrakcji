import { useForm, type Control } from 'react-hook-form'
import { useState } from 'react'
import Input from '@/src/components/ui/input'
import Checkbox from '@/src/components/ui/checkbox'
import { REGEX } from '@/src/global/constants'
import styles from './styles.module.scss'
import Button from '../../ui/Button'
import { cartStore } from '@/src/store/cart'
import { trackEvent } from '@/utils/track-event'
import type { AnalyticsUser } from '@/global/analytics/types'
import { getUtmForSheet } from '@/utils/analytics-user-storage'

// Helper functions for Google Sheet data
const createItemsSummary = (items: any[]): string => {
  if (!items?.length) return ''
  const parts: string[] = []
  items.forEach((item) => {
    if (item.type === 'hotel' && item.hotels?.[0]) {
      parts.push(`Hotel: ${item.hotels[0].name}`)
      item.activities?.forEach((a: any) => parts.push(`  + ${a.name}`))
    } else if (item.type === 'activity' && item.activities?.[0]) {
      parts.push(`Integracja: ${item.activities[0].name}`)
    }
    if (item.transport?.distance) parts.push(`  Transport: ${item.transport.distance} km`)
  })
  return parts.join('\n')
}

const formatDatesForSheet = (dates: Array<{ start: string; end: string }>): string => {
  if (!dates?.length) return ''
  return dates.map((d) => {
    const s = new Date(d.start), e = new Date(d.end)
    const fmt = (dt: Date) => `${dt.getDate().toString().padStart(2, '0')}.${(dt.getMonth() + 1).toString().padStart(2, '0')}.${dt.getFullYear()}`
    return s.getTime() === e.getTime() || isNaN(e.getTime()) ? fmt(s) : `${fmt(s)} - ${fmt(e)}`
  }).join(', ')
}

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
    // Reset the cart store to empty state (clears current language cart)
    cartStore.set({ hotels: [], activities: [] })

    // Remove all cart-related data from localStorage
    localStorage.removeItem('cart_pl')
    localStorage.removeItem('cart_en')
    localStorage.removeItem('cart') // Legacy - can be removed eventually
    localStorage.removeItem('cart_dates')
    localStorage.removeItem('cart_order_addons')
    localStorage.removeItem('cart_participant_count')
    localStorage.removeItem('transport_address')
    localStorage.removeItem('transport_dates')
    localStorage.removeItem('transport_participant_count')
    localStorage.removeItem('cart_gastronomy_items')
    localStorage.removeItem('cart_people_per_bus')
    localStorage.removeItem('activity_address')

    // Also clear any pending transport items
    localStorage.removeItem('pending_transport_item')
    localStorage.removeItem('pending_transport_removal')
  }

  const buildAnalyticsUser = (formData: FormData): AnalyticsUser => {
    const user: AnalyticsUser = {
      email: formData.email.trim(),
    }

    const normalizedPhone = formData.phone?.trim()
    if (normalizedPhone && normalizedPhone !== '+48') {
      user.phone = normalizedPhone
    }

    if (typeof window !== 'undefined') {
      const resolveAddress = (): { street?: string; postal?: string; city?: string } | null => {
        const keys: Array<'activity_address' | 'transport_address'> = ['activity_address', 'transport_address']
        for (const key of keys) {
          const raw = window.localStorage.getItem(key)
          if (!raw) continue
          try {
            const parsed = JSON.parse(raw) as { street?: string; postal?: string; city?: string } | null
            if (parsed && (parsed.street || parsed.postal || parsed.city)) {
              return parsed
            }
          } catch (error) {
            console.error('[QuoteForm] Failed to parse stored address data', error)
          }
        }
        return null
      }

      const address = resolveAddress()
      if (address?.street) {
        user.address = address.street
      }
      if (address?.postal) {
        user.postal_code = address.postal
      }
      if (address?.city) {
        user.city = address.city
      }
    }

    return user
  }

  const onSubmit = async (data: FormData) => {
    // Dispatch event to show loading state
    document.dispatchEvent(new CustomEvent('quote-form-submitting'))
    setIsSubmitting(true)

    // Fire and forget - log to Google Sheet (sendBeacon guarantees delivery)
    const priceBrutto = quote?.items?.reduce((sum: number, item: any) => sum + (item.totalPrice || 0), 0) || 0
    const priceNetto = quote?.items?.reduce((sum: number, item: any) => sum + (item.totalNettoPrice || 0), 0) || 0
    navigator.sendBeacon('/api/s3d', JSON.stringify({
      formType: 'configurator_form',
      email: data.email,
      phone: data.phone && data.phone !== '+48' ? data.phone : undefined,
      additionalInfo: data.additionalInfo,
      utm: getUtmForSheet(),
      quote: {
        participants: quote?.participantCount || '',
        dates: formatDatesForSheet(quote?.selectedDates || []),
        priceBrutto,
        priceNetto,
        itemsSummary: createItemsSummary(quote?.items || []),
      },
    }))

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
              legal: data.legal,
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
        const analyticsUser = buildAnalyticsUser(data)

        const toNumber = (candidate: unknown): number | undefined => {
          if (typeof candidate === 'number' && Number.isFinite(candidate)) {
            return candidate
          }
          if (typeof candidate === 'string') {
            const normalized = candidate.replace(/[^\d.,-]/g, '').replace(',', '.').trim()
            if (!normalized) {
              return undefined
            }
            const parsed = Number(normalized)
            return Number.isFinite(parsed) ? parsed : undefined
          }
          return undefined
        }

        const pickNumeric = (...candidates: Array<unknown>): number | undefined => {
          for (const value of candidates) {
            const numeric = toNumber(value)
            if (numeric !== undefined) {
              return numeric
            }
          }
          return undefined
        }

        const sumTotals = (
          items: Array<{ totalPrice?: unknown; totalNettoPrice?: unknown }> | undefined,
          key: 'totalPrice' | 'totalNettoPrice'
        ): number | undefined => {
          if (!items?.length) return undefined
          const sum = items.reduce((acc, item) => {
            const value = toNumber(item?.[key])
            return acc + (value ?? 0)
          }, 0)
          return Number.isFinite(sum) ? sum : undefined
        }

        const quoteItemsFromProp: Array<{ totalPrice?: unknown; totalNettoPrice?: unknown }> | undefined =
          Array.isArray(quote?.items) ? (quote.items as Array<{ totalPrice?: unknown; totalNettoPrice?: unknown }>) : undefined

        const quoteItemsFromResponse: Array<{ totalPrice?: unknown; totalNettoPrice?: unknown }> | undefined =
          Array.isArray(result.quote?.items)
            ? (result.quote.items as Array<{ totalPrice?: unknown; totalNettoPrice?: unknown }>)
            : undefined

        const bruttoFromProp = sumTotals(quoteItemsFromProp, 'totalPrice')
        const nettoFromProp = sumTotals(quoteItemsFromProp, 'totalNettoPrice')
        const bruttoFromResponse = sumTotals(quoteItemsFromResponse, 'totalPrice')
        const nettoFromResponse = sumTotals(quoteItemsFromResponse, 'totalNettoPrice')

        const leadValue = pickNumeric(
          (quote as unknown as { totalPrice?: unknown })?.totalPrice,
          bruttoFromProp,
          (() => {
            const netto = pickNumeric(
              (quote as unknown as { totalNettoPrice?: unknown })?.totalNettoPrice,
              nettoFromProp
            )
            return netto !== undefined ? Math.round(netto * 1.23) : undefined
          })(),
          result.quote?.totalPrice,
          bruttoFromResponse,
          (() => {
            const netto = pickNumeric(result.quote?.totalNettoPrice, nettoFromResponse)
            return netto !== undefined ? Math.round(netto * 1.23) : undefined
          })(),
          result.estimatedValue
        )

        // Clear all cart data from localStorage after we've persisted analytics data
        clearCartData()

        trackEvent({
          ga4: {
            eventName: 'lead',
            params: {
              form_name: 'configurator_form',
              ...(leadValue !== undefined ? { value: leadValue, currency: 'PLN' } : {}),
            },
          },
          meta: {
            eventName: 'Lead',
            contentName: 'configurator_form',
            params: {
              form_name: 'configurator_form',
              ...(leadValue !== undefined ? { value: leadValue, currency: 'PLN' } : {}),
            },
          },
          user: analyticsUser,
        })

        // Give the analytics requests a brief moment to flush before navigation
        await new Promise((resolve) => setTimeout(resolve, 150))
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
          required: { value: true, message: translations.combinedRequired },
        })}
        errors={errors}
      >
        {translations.combined}{' '}
        <a href={translations.termsUrl} className="link" data-shade="light" target="_blank">
          {translations.termsSecond}
        </a>{' '}
        {translations.combinedMiddle}{' '}
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
