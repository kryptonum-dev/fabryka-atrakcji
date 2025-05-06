import { Box, Tooltip } from '@sanity/ui'
import type { LucideIcon } from 'lucide-react'

// Enhanced the preview to include both media and icon for compatibility.
// This ensures that the preview works seamlessly with both the main components
// for page builder and components embedded within the portable-text custom section.
export const sectionPreview = ({ imgUrl, icon }: { imgUrl: string; icon: LucideIcon }) => {
  const Icon = icon
  const Preview = () => (
    <Tooltip
      animate
      placement="top"
      portal
      content={
        <Box padding={2}>
          <img src={imgUrl} width={610} alt="" style={{ maxWidth: '100%' }} />
        </Box>
      }
    >
      <Icon />
    </Tooltip>
  )

  return {
    media: Preview,
    icon: Preview,
  }
}
