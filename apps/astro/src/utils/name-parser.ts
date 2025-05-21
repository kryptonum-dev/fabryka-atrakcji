/**
 * Extracts the first name from a full name string
 * Used for tracking and personalization purposes
 *
 * @param fullName - The full name string to parse
 * @returns The first name or the original string if parsing fails
 */
export function getFirstName(fullName: string): string {
  if (!fullName) return ''

  try {
    // Trim and split by whitespace
    const nameParts = fullName.trim().split(/\s+/)

    // Return the first part as the first name
    return nameParts[0] || fullName
  } catch (error) {
    console.error('Error parsing name:', error)
    return fullName
  }
}
