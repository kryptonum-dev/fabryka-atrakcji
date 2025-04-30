import { persistentAtom } from '@nanostores/persistent'

export type CartItem = {
  id: string
  type: 'hotels' | 'activities'
  addOns: Record<string, any> // Empty object for now, will be used later
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
