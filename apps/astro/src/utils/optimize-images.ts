import { sanityImageUrl, sanityImageSrcset } from './sanity-image'

export type SanityImageResult = {
  src: string
  srcSet: { attribute: string }
  alt: string
  attributes: { width: number; height: number }
}

const MAX_WIDTH = 2560
const WIDTHS = [48, 64, 96, 128, 256, 384, 640, 750, 828, 1080, 1200, 1920, 2048, 2560]

export const optimizeImage = ({
  image,
  width,
  height,
  alt = '',
}: {
  image: string
  width: number
  height: number
  alt?: string | null
}): SanityImageResult => {
  const cappedWidth = Math.min(width, MAX_WIDTH)
  const cappedHeight = width > MAX_WIDTH ? Math.round((height * MAX_WIDTH) / width) : height

  return {
    src: sanityImageUrl(image, { w: cappedWidth }),
    srcSet: {
      attribute: sanityImageSrcset(image, WIDTHS, width),
    },
    alt: alt || '',
    attributes: {
      width: cappedWidth,
      height: cappedHeight,
    },
  }
}
