export const prerender = true

import type { APIRoute } from 'astro'
import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import ico from 'sharp-ico'

const favicon = path.resolve('src/assets/favicon.svg')

export const GET: APIRoute = async () => {
  const svgBuffer = await fs.readFile(favicon)
  const processedFavicon = await sharp(svgBuffer).resize(32, 32).toBuffer()
  const icoBuffer = ico.encode([processedFavicon])

  return new Response(icoBuffer, {
    headers: { 'Content-Type': 'image/x-icon' },
  })
}
