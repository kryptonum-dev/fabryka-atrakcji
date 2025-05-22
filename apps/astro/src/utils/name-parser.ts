/**
 * Extracts the first name from a full name
 * Works with simple first name or first and last name formats
 * @param name The full name
 * @returns The extracted first name
 */
export function getFirstName(name: string): string {
  if (!name) return ''
  const nameParts = name.trim().split(/\s+/)
  return nameParts[0]
}

/**
 * Extracts the last name from a full name
 * @param name The full name
 * @returns The extracted last name or empty string if only one name part exists
 */
export function getLastName(name: string): string {
  if (!name) return ''
  const nameParts = name.trim().split(/\s+/)
  return nameParts.length > 1 ? nameParts[nameParts.length - 1] : ''
}
