export const prerender = true

import type { APIRoute } from 'astro'
import { DOMAIN } from '@/global/constants'

// Single source of truth for robots.txt. There is deliberately no `public/robots.txt` —
// this prerendered route overwrites anything of that name in the build output, which is how
// an earlier static blocklist went silently inert.
const content = [
  '# Abusive SEO crawlers burning serverless budget',
  'User-Agent: SERankingBacklinksBot',
  'Disallow: /',
  '',
  'User-Agent: PetalBot',
  'Disallow: /',
  '',
  'User-Agent: *',
  'Allow: /',
  'Disallow: /api/',
  '',
  `Sitemap: ${DOMAIN}sitemap-index.xml`,
].join('\n')

export const GET: APIRoute = () => {
  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain',
    },
  })
}
