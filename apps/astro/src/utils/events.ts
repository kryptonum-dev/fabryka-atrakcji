export type CartItemType = 'hotels' | 'activities'
type CartEventType = 'add' | 'remove'
type ToastType = 'success' | 'error'

interface CartEventDetail {
  itemId: string
  itemType: CartItemType
  action: CartEventType
}

interface AddonsPopupDetail {
  itemId: string
  itemType: CartItemType
  hasAddons: boolean
  isEditing: boolean
  minOneAddon: boolean
  requiresAddons: boolean
  addonsChoice: string
  addonData?: any // Optional addon data for dynamic rendering
}

interface CartUpdateDetail {
  itemId: string
  itemType: CartItemType
  action?: 'update' | 'remove'
  addons?: Array<{
    id: string
    count?: number
  }>
}

interface ToastEventDetail {
  message: string
  type: ToastType
}

// Event dispatchers
export function dispatchCartUpdate(itemId: string, itemType: CartItemType, action: CartEventType) {
  document.dispatchEvent(
    new CustomEvent<CartEventDetail>('cart-updated', {
      detail: {
        itemId,
        itemType,
        action,
      },
    })
  )
}

export function dispatchAddonsPopup({
  itemId,
  itemType,
  hasAddons,
  isEditing,
  minOneAddon,
  requiresAddons,
  addonsChoice,
  addonData,
}: AddonsPopupDetail) {
  document.dispatchEvent(
    new CustomEvent('open-addons-popup', {
      detail: {
        itemId,
        itemType,
        hasAddons,
        isEditing,
        minOneAddon,
        requiresAddons,
        addonsChoice,
        addonData,
      },
      bubbles: true,
    })
  )
}

// Simpler cart update event for when we just need to sync the cart state
export function dispatchSimpleCartUpdate(itemId: string, itemType: CartItemType) {
  document.dispatchEvent(
    new CustomEvent<CartUpdateDetail>('cart-updated', {
      detail: {
        itemId,
        itemType,
      },
    })
  )
}

export function dispatchToast(message: string, type: ToastType = 'success') {
  document.dispatchEvent(
    new CustomEvent<ToastEventDetail>('show-toast', {
      detail: { message, type },
    })
  )
}

// Add a new event dispatcher for addon updates
export function dispatchAddonUpdate(
  itemId: string,
  itemType: CartItemType,
  addons: Array<{ id: string; count?: number }>
) {
  document.dispatchEvent(
    new CustomEvent<CartUpdateDetail>('cart-updated', {
      detail: {
        itemId,
        itemType,
        action: 'update',
        addons,
      },
    })
  )
}

// Event listeners
export function listenToCartUpdates(callback: () => void) {
  document.addEventListener('cart-updated', callback)

  // Return cleanup function
  return () => {
    document.removeEventListener('cart-updated', callback)
  }
}

export async function listenToAddonsPopup(callback: (detail: AddonsPopupDetail) => Promise<void>) {
  const handler = async (event: Event) => {
    const customEvent = event as CustomEvent<AddonsPopupDetail>
    await callback(customEvent.detail)
  }

  document.addEventListener('open-addons-popup', handler)

  // Return cleanup function
  return () => {
    document.removeEventListener('open-addons-popup', handler)
  }
}

export function listenToToast(callback: (detail: ToastEventDetail) => void) {
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<ToastEventDetail>
    callback(customEvent.detail)
  }

  document.addEventListener('show-toast', handler)

  // Return cleanup function
  return () => {
    document.removeEventListener('show-toast', handler)
  }
}
