import { dispatchToast } from './events'

export function showToast(message: string, type: 'success' | 'error' = 'success') {
  dispatchToast(message, type)
}
