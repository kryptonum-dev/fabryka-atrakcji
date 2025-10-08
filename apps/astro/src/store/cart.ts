export type AddonItem = {
  id: string
  count?: number
}

export type CartItem = {
  id: string
  type: 'hotels' | 'activities'
  addOns: AddonItem[]
}

export type CartData = {
  hotels: CartItem[]
  activities: CartItem[]
}

// Helper to get current language from window location
const getCurrentLang = (): 'pl' | 'en' => {
  if (typeof window === 'undefined') return 'pl'
  return window.location.pathname.startsWith('/en/') ? 'en' : 'pl'
}

// Helper to get language-specific cart key
const getCartKey = (lang: 'pl' | 'en' = getCurrentLang()): string => {
  return lang === 'en' ? 'cart_en' : 'cart_pl'
}

// Get cart data from localStorage
const getCartData = (): CartData => {
  if (typeof window === 'undefined') return { hotels: [], activities: [] }

  const cartKey = getCartKey()
  const data = localStorage.getItem(cartKey)

  if (!data) return { hotels: [], activities: [] }

  try {
    return JSON.parse(data)
  } catch {
    return { hotels: [], activities: [] }
  }
}

// Set cart data to localStorage
const setCartData = (data: CartData): void => {
  if (typeof window === 'undefined') return

  const cartKey = getCartKey()
  localStorage.setItem(cartKey, JSON.stringify(data))

  // Dispatch cart-updated event
  window.dispatchEvent(new Event('cart-updated'))
}

// Nanostores-compatible atom that reads/writes from language-specific localStorage
export const cartStore = {
  get: getCartData,
  set: setCartData,
}

// Helper functions
export function addToCart(item: CartItem) {
  const currentCart = getCartData()
  const collection = item.type === 'hotels' ? 'hotels' : 'activities'

  // Check if item already exists
  const exists = currentCart[collection].some((cartItem: CartItem) => cartItem.id === item.id)

  if (!exists) {
    setCartData({
      ...currentCart,
      [collection]: [...currentCart[collection], item],
    })
    return true
  }
  return false
}

export function removeFromCart(id: string, type: 'hotels' | 'activities') {
  const currentCart = getCartData()
  const collection = type === 'hotels' ? 'hotels' : 'activities'

  setCartData({
    ...currentCart,
    [collection]: currentCart[collection].filter((item: CartItem) => item.id !== id),
  })
}

export function isInCart(id: string, type: 'hotels' | 'activities'): boolean {
  const currentCart = getCartData()
  const collection = type === 'hotels' ? 'hotels' : 'activities'

  return currentCart[collection].some((item: CartItem) => item.id === id)
}

/**
 * Gets a specific item from the cart by id and type
 */
export function getCartItem(id: string, type: 'hotels' | 'activities'): CartItem | undefined {
  const currentCart = getCartData()
  const collection = type === 'hotels' ? 'hotels' : 'activities'

  return currentCart[collection].find((item) => item.id === id)
}

export function updateCartAddons(id: string, type: 'hotels' | 'activities', addons: AddonItem[]): void {
  const currentCart = getCartData()
  const collection = type === 'hotels' ? 'hotels' : 'activities'

  const existingItemIndex = currentCart[collection].findIndex((item) => item.id === id)

  if (existingItemIndex !== -1) {
    currentCart[collection][existingItemIndex].addOns = addons
    setCartData(currentCart)
  }
}
