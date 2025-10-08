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

const UKFlag = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="15" viewBox="0 0 640 480" style={{ borderRadius: '3px' }}>
    <path fill="#012169" d="M0 0h640v480H0z" />
    <path fill="#FFF" d="m75 0 244 181L562 0h78v62L400 241l240 178v61h-80L320 301 81 480H0v-60l239-178L0 64V0h75z" />
    <path
      fill="#C8102E"
      d="m424 281 216 159v40L369 281h55zm-184 20 6 35L54 480H0l240-179zM640 0v3L391 191l2-44L590 0h50zM0 0l239 176h-60L0 42V0z"
    />
    <path fill="#FFF" d="M241 0v480h160V0H241zM0 160v160h640V160H0z" />
    <path fill="#C8102E" d="M0 193v96h640v-96H0zM273 0v480h96V0h-96z" />
  </svg>
)

export const LANGUAGES: Language[] = [
  {
    id: 'pl',
    title: 'Polski (PL Polish)',
    flag: PolandFlag,
  },
  {
    id: 'en',
    title: 'English (EN)',
    flag: UKFlag,
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
