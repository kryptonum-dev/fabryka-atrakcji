export function showToast(message: string, type: 'success' | 'error' = 'success') {
  document.dispatchEvent(
    new CustomEvent('show-toast', {
      detail: { message, type },
    })
  )
}
