import type { MetaConversionProps } from '../pages/api/analytics/meta-conversion'

type Item = {
  item_id: string
  item_name: string
  item_category?: string
  price?: number
  quantity?: number
  [key: string]: any
}

type Props = {
  event_name: string // Required top-level parameter for all tracking
  user_data?: {
    email?: string
    name?: string
    phone?: string
  }
  meta?: {
    event_name?: string // Optional, override for Meta (if different from GTM)
    content_name: string // Required for Meta tracking
  }
  ecommerce?: {
    items: Item[]
    currency?: string
    value?: number
    [key: string]: any
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
 * @param {string} params.event_name - Required name of the event to track (for GTM/GA4)
 * @param {Object} [params.user_data] - Optional user data for personalized tracking
 * @param {string} [params.user_data.email] - User's email address
 * @param {string} [params.user_data.name] - User's name
 * @param {string} [params.user_data.phone] - User's phone number
 * @param {Object} [params.meta] - Meta-specific tracking configuration
 * @param {string} [params.meta.event_name] - Override event name for Meta (if different from GTM)
 * @param {string} params.meta.content_name - Content name for Meta tracking
 * @param {Object} [params.ecommerce] - E-commerce data for product tracking
 * @param {Array} [params.ecommerce.items] - Array of products being viewed or interacted with
 */
export async function trackEvent({ event_name, user_data, meta, ecommerce }: Props) {
  const event_time = {
    milliseconds: Date.now(),
    seconds: Math.floor(Date.now() / 1000),
  }
  const event_id = `${event_time.milliseconds}_${Math.random().toString(36).substring(2, 15)}`
  const url = window.location.href

  try {
    // Push to dataLayer for GTM
    window.dataLayer = window.dataLayer || []
    window.dataLayer.push({
      event: event_name,
      // Include meta_content_name only if meta object is provided
      ...(meta?.content_name && { meta_content_name: meta.content_name }),
      event_id,
      event_time: event_time.seconds,
      ...(user_data && { user_data }),
      ...(ecommerce && { ecommerce }),
    })
  } catch (error) {
    console.warn('Failed to push to dataLayer:', error)
  }

  // Only send to Meta Conversion API if we have the required meta configuration
  if (meta?.content_name) {
    try {
      // For Meta, use override event_name if provided, otherwise fall back to main event_name
      const metaEventName = meta.event_name || event_name

      const payload: MetaConversionProps = {
        event_name: metaEventName,
        content_name: meta.content_name,
        url,
        event_id,
        event_time: event_time.seconds,
        ...(user_data?.name && { name: user_data.name }),
        ...(user_data?.email && { email: user_data.email }),
        ...(user_data?.phone && { phone: user_data.phone }),
        // Add basic product info for Meta if available
        ...(ecommerce?.items && {
          custom_parameters: {
            content_ids: ecommerce.items.map((item) => item.item_id),
            content_category: ecommerce.items[0]?.item_category,
            content_type: 'product',
            currency: ecommerce.currency || 'PLN',
            ...(ecommerce.value && { value: ecommerce.value }),
          },
        }),
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

/**
 * Helper function specifically for tracking add_to_cart events
 *
 * @param {string} itemId - The ID of the item being added to cart
 * @param {string} itemType - The type of item ('hotels' or 'activities')
 * @param {string} itemName - The name of the item
 * @param {Array} addons - Optional array of addons selected with the item
 */
export function trackAddToCart(
  itemId: string,
  itemType: 'hotels' | 'activities',
  itemName: string,
  addons: any[] = []
) {
  // Get item category based on type
  const category = itemType === 'hotels' ? 'hotel' : 'activity'

  // Track the event
  trackEvent({
    event_name: 'add_to_cart',
    meta: {
      content_name: document.title,
      // For Meta, use standard add_to_cart event name
      event_name: 'AddToCart',
    },
    ecommerce: {
      items: [
        {
          item_id: itemId,
          item_name: itemName,
          item_category: category,
          quantity: 1,
        },
      ],
      currency: 'PLN',
      // Include addon information if available
      addons_count: addons.length,
      has_addons: addons.length > 0,
    },
  })
}

// Declare global dataLayer
declare global {
  interface Window {
    dataLayer: any[]
  }
}
