import React from 'react'
import { Stack, Text, Flex } from '@sanity/ui'
import type { NumberInputProps, NumberSchemaType } from 'sanity'
import { set } from 'sanity'

const StarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
    <mask id="path-1-inside-1_7671_94180" fill="white">
      <path d="M7.69913 1.27242C7.8214 1.02467 8.17468 1.02467 8.29695 1.27242L10.0757 4.87655C10.1243 4.97493 10.2181 5.04312 10.3267 5.0589L14.3041 5.63684C14.5775 5.67657 14.6866 6.01256 14.4888 6.20541L11.6107 9.01083C11.5322 9.08741 11.4963 9.19774 11.5149 9.30587L12.1943 13.2672C12.241 13.5395 11.9552 13.7472 11.7106 13.6186L8.15315 11.7483C8.05605 11.6973 7.94004 11.6973 7.84293 11.7483L4.28544 13.6186C4.0409 13.7472 3.75509 13.5395 3.80179 13.2672L4.48121 9.30587C4.49976 9.19774 4.46391 9.08741 4.38534 9.01083L1.50728 6.20541C1.30944 6.01256 1.41861 5.67657 1.69201 5.63684L5.66941 5.0589C5.77798 5.04312 5.87183 4.97493 5.92039 4.87655L7.69913 1.27242Z" />
    </mask>
    <g clipPath="url(#paint0_angular_7671_94180_clip_path)" data-figma-skip-parse="true">
      <g transform="matrix(0.00479403 0.00457126 -0.00479402 0.00457128 7.99804 7.37211)">
        <foreignObject x="-2979.21" y="-2979.21" width="5958.41" height="5958.41">
          <div
            className="star-gradient"
            style={{
              height: '100%',
              width: '100%',
              opacity: 1,
              background:
                'conic-gradient(from 90deg,rgba(121, 141, 220, 1) 0deg,rgba(231, 199, 143, 1) 90deg,rgba(250, 116, 104, 1) 266.4deg,rgba(121, 141, 220, 1) 360deg)',
            }}
          />
        </foreignObject>
      </g>
    </g>
    <path d="M7.69913 1.27242C7.8214 1.02467 8.17468 1.02467 8.29695 1.27242L10.0757 4.87655C10.1243 4.97493 10.2181 5.04312 10.3267 5.0589L14.3041 5.63684C14.5775 5.67657 14.6866 6.01256 14.4888 6.20541L11.6107 9.01083C11.5322 9.08741 11.4963 9.19774 11.5149 9.30587L12.1943 13.2672C12.241 13.5395 11.9552 13.7472 11.7106 13.6186L8.15315 11.7483C8.05605 11.6973 7.94004 11.6973 7.84293 11.7483L4.28544 13.6186C4.0409 13.7472 3.75509 13.5395 3.80179 13.2672L4.48121 9.30587C4.49976 9.19774 4.46391 9.08741 4.38534 9.01083L1.50728 6.20541C1.30944 6.01256 1.41861 5.67657 1.69201 5.63684L5.66941 5.0589C5.77798 5.04312 5.87183 4.97493 5.92039 4.87655L7.69913 1.27242Z" />
    <defs>
      <clipPath id="paint0_angular_7671_94180_clip_path">
        <path d="M7.69913 1.27242C7.8214 1.02467 8.17468 1.02467 8.29695 1.27242L10.0757 4.87655C10.1243 4.97493 10.2181 5.04312 10.3267 5.0589L14.3041 5.63684C14.5775 5.67657 14.6866 6.01256 14.4888 6.20541L11.6107 9.01083C11.5322 9.08741 11.4963 9.19774 11.5149 9.30587L12.1943 13.2672C12.241 13.5395 11.9552 13.7472 11.7106 13.6186L8.15315 11.7483C8.05605 11.6973 7.94004 11.6973 7.84293 11.7483L4.28544 13.6186C4.0409 13.7472 3.75509 13.5395 3.80179 13.2672L4.48121 9.30587C4.49976 9.19774 4.46391 9.08741 4.38534 9.01083L1.50728 6.20541C1.30944 6.01256 1.41861 5.67657 1.69201 5.63684L5.66941 5.0589C5.77798 5.04312 5.87183 4.97493 5.92039 4.87655L7.69913 1.27242Z" />
      </clipPath>
    </defs>
  </svg>
)

const StarRating = (props: NumberInputProps<NumberSchemaType>) => {
  const { value = 3, onChange } = props

  return (
    <Stack space={3}>
      <Flex gap={3} style={{ cursor: 'pointer' }}>
        {[1, 2, 3, 4, 5].map((rating) => (
          <Flex
            key={rating}
            align="center"
            onClick={() => onChange(set(rating))}
            style={{
              opacity: rating <= (value || 0) ? 1 : 0.3,
              transition: 'opacity 0.15s',
            }}
          >
            <StarIcon />
          </Flex>
        ))}
      </Flex>
      <Text size={1}>
        {value || 0} {value === 1 ? 'gwiazdka' : value < 5 ? 'gwiazdki' : 'gwiazdek'}
      </Text>
    </Stack>
  )
}

export default StarRating
