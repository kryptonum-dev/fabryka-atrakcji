/**
 * Hashes a string using SHA-256 for tracking purposes
 * Used for hashing PII (Personally Identifiable Information) for tracking APIs
 *
 * @param input - The string to hash (email, phone, etc.)
 * @returns A SHA-256 hash of the input string
 */
export async function hash(input: string): Promise<string> {
  if (!input) return ''

  try {
    // Normalize input - lowercase and trim
    const normalizedInput = input.trim().toLowerCase()

    // Convert to UTF-8
    const encoder = new TextEncoder()
    const data = encoder.encode(normalizedInput)

    // Hash using SHA-256
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)

    // Convert to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')

    return hashHex
  } catch (error) {
    console.error('Error hashing data:', error)
    return ''
  }
}
