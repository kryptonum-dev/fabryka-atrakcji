import type { MetaConversionProps } from '../pages/api/analytics/meta-conversion'

type Props = {
  user_data?: {
    email?: string
    name?: string
    phone?: string
  }
  meta?: {
    event_name: string
    content_name: string
  }
}

/**
 * Tracks analytics events for both GTM and Meta Conversion API
 *
 * This function handles both client-side tracking via dataLayer for GTM
 * and server-side conversion API tracking for Meta. It generates a unique
 * event ID for deduplication.
 *
 * @param {Object} params - The tracking parameters
 * @param {Object} [params.user_data] - Optional user data for personalized tracking
 * @param {string} [params.user_data.email] - User's email address
 * @param {string} [params.user_data.name] - User's name
 * @param {string} [params.user_data.phone] - User's phone number
 * @param {Object} [params.meta] - Meta tracking configuration
 * @param {string} params.meta.event_name - Name of the event to track
 * @param {string} params.meta.content_name - Name of the content associated with the event
 */
export async function trackEvent({ user_data, meta }: Props) {
  const event_time = {
    milliseconds: Date.now(),
    seconds: Math.floor(Date.now() / 1000),
  }
  const event_id = `${event_time.milliseconds}_${Math.random().toString(36).substring(2, 15)}`
  const url = window.location.href

  if (meta) {
    try {
      // Push to dataLayer for GTM
      window.dataLayer = window.dataLayer || []
      window.dataLayer.push({
        event: meta.event_name,
        content_name: meta.content_name,
        event_id,
        event_time: event_time.seconds,
        ...(user_data && { user_data }),
      })
    } catch (error) {
      console.warn('Failed to push to dataLayer:', error)
    }

    try {
      // Send to Meta Conversion API
      const payload: MetaConversionProps = {
        event_name: meta.event_name,
        content_name: meta.content_name,
        url,
        event_id,
        event_time: event_time.seconds,
        ...(user_data?.name && { name: user_data.name }),
        ...(user_data?.email && { email: user_data.email }),
        ...(user_data?.phone && { phone: user_data.phone }),
      }

      const response = await fetch('/api/analytics/meta-conversion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        console.warn('Meta conversion API call failed:', await response.text())
      }
    } catch (error) {
      console.warn('Failed to send Meta conversion event:', error)
    }
  }
}

// Declare global dataLayer
declare global {
  interface Window {
    dataLayer: any[]
  }
}
