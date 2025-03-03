import React from 'react'

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
