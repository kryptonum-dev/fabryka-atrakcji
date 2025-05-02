import { persistentAtom } from '@nanostores/persistent'

export type AddonItem = {
  id: string
  count?: number
}

export type CartItem = {
  id: string
  type: 'hotels' | 'activities'
  addOns: AddonItem[]
}

export const cartStore = persistentAtom<{
  hotels: CartItem[]
  activities: CartItem[]
}>(
  'cart',
  { hotels: [], activities: [] },
  {
    encode: JSON.stringify,
    decode: JSON.parse,
  }
)

// Helper functions
export function addToCart(item: CartItem) {
  const currentCart = cartStore.get()
  const collection = item.type === 'hotels' ? 'hotels' : 'activities'

  // Check if item already exists
  const exists = currentCart[collection].some((cartItem: CartItem) => cartItem.id === item.id)

  if (!exists) {
    cartStore.set({
      ...currentCart,
      [collection]: [...currentCart[collection], item],
    })
    return true
  }
  return false
}

export function removeFromCart(id: string, type: 'hotels' | 'activities') {
  const currentCart = cartStore.get()
  const collection = type === 'hotels' ? 'hotels' : 'activities'

  cartStore.set({
    ...currentCart,
    [collection]: currentCart[collection].filter((item: CartItem) => item.id !== id),
  })
}

export function isInCart(id: string, type: 'hotels' | 'activities'): boolean {
  const currentCart = cartStore.get()
  const collection = type === 'hotels' ? 'hotels' : 'activities'

  return currentCart[collection].some((item: CartItem) => item.id === id)
}

/**
 * Gets a specific item from the cart by id and type
 */
export function getCartItem(id: string, type: 'hotels' | 'activities'): CartItem | undefined {
  const currentCart = cartStore.get()
  const collection = type === 'hotels' ? 'hotels' : 'activities'

  return currentCart[collection].find((item) => item.id === id)
}

export function updateCartAddons(id: string, type: 'hotels' | 'activities', addons: AddonItem[]): void {
  const currentCart = cartStore.get()
  const collection = type === 'hotels' ? 'hotels' : 'activities'

  const existingItemIndex = currentCart[collection].findIndex((item) => item.id === id)

  if (existingItemIndex !== -1) {
    currentCart[collection][existingItemIndex].addOns = addons
    cartStore.set(currentCart)
  }
}
