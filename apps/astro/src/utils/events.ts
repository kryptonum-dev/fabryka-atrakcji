type ToastType = 'success' | 'error'

interface ToastEventDetail {
  message: string
  type: ToastType
}

export function dispatchToast(message: string, type: ToastType = 'success') {
  document.dispatchEvent(
    new CustomEvent<ToastEventDetail>('show-toast', {
      detail: { message, type },
    })
  )
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
