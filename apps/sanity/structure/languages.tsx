import React from 'react'
import { languageLabel } from '../utils/language-label'

// Define the language type
type Language = {
  id: string
  title: string
  flag: React.FC
}

// Flag components with border radius
const PolandFlag = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="15" viewBox="0 0 640 480" style={{ borderRadius: '3px' }}>
    <g fillRule="evenodd">
      <path fill="#fff" d="M640 480H0V0h640z" />
      <path fill="#dc143c" d="M640 480H0V240h640z" />
    </g>
  </svg>
)

export const LANGUAGES: Language[] = [
  {
    id: 'pl',
    title: 'Polski (PL Polish)',
    flag: PolandFlag,
  },
]

/**
 * Returns the Flag component for a given language ID
 * @param languageId The language ID to get the flag for
 * @returns The Flag component or null if not found
 */
export const getLanguageFlag = (languageId: string): React.FC | null => {
  const language = LANGUAGES.find((lang) => lang.id === languageId)
  return language?.flag || null
}

/**
 * Returns an object with title and media properties for a given language ID
 * @param languageId The language ID to get the preview for
 * @returns Object with title and media properties for use in Sanity preview
 */
export const getLanguagePreview = ({ title, languageId }: { title: string; languageId: 'pl' | 'en' }) => {
  const Flag = getLanguageFlag(languageId)

  return {
    title,
    subtitle: languageLabel(languageId),
    media: Flag ? <Flag /> : null,
  }
}
