import { getImage } from 'astro:assets'

const MAX_WIDTH = 2560

export const optimizeImage = async ({ image, width, height }: { image: string; width: number; height: number }) => {
  // Cap width at MAX_WIDTH to prevent image proxy timeouts on large uploads
  const cappedWidth = Math.min(width, MAX_WIDTH)
  const cappedHeight = width > MAX_WIDTH ? Math.round((height * MAX_WIDTH) / width) : height

  const optimizedImage = await getImage({
    src: image,
    format: 'webp',
    width: cappedWidth,
    height: cappedHeight,
    widths: [48, 64, 96, 128, 256, 384, 640, 750, 828, 1080, 1200, 1920, 2048, 2560],
    sizes: '324px',
  })

  return optimizedImage
}
