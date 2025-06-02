import React from 'react'
import { PricingSummary } from '../components/PricingSummary'

// Custom view for displaying the pricing summary in Sanity Studio
export const PricingSummaryView = (props: {
  documentId?: string
  document?: {
    displayed?: any
    draft?: any
    published?: any
  }
}) => {
  return (
    <div style={{ padding: '1rem' }}>
      <PricingSummary {...props} />
    </div>
  )
}
