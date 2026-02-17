export type InquiryItem = {
  type: 'integracja' | 'hotel'
  id: string
  name: string
  image: string
  url: string
}

const INQUIRY_STORAGE_KEY = 'fa-inquiry-items'

export function getInquiryItems(): InquiryItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(INQUIRY_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function setInquiryItems(items: InquiryItem[]): void {
  localStorage.setItem(INQUIRY_STORAGE_KEY, JSON.stringify(items))
  document.dispatchEvent(new CustomEvent('inquiry-updated'))
}

export function addToInquiry(item: InquiryItem): boolean {
  const items = getInquiryItems()
  if (items.some((i) => i.id === item.id)) return false
  setInquiryItems([...items, item])
  return true
}

export function removeFromInquiry(id: string): InquiryItem[] {
  const items = getInquiryItems().filter((item) => item.id !== id)
  setInquiryItems(items)
  return items
}

export function clearInquiry(): void {
  localStorage.removeItem(INQUIRY_STORAGE_KEY)
  document.dispatchEvent(new CustomEvent('inquiry-updated'))
}

export function isInInquiry(id: string): boolean {
  return getInquiryItems().some((item) => item.id === id)
}

export function getInquiryCount(): number {
  return getInquiryItems().length
}
