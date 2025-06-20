import preact from '@astrojs/preact'
import vercel from '@astrojs/vercel'
import { defineConfig } from 'astro/config'
import redirects from './redirects'
import { DOMAIN } from './src/global/constants'
import { isPreviewDeployment } from './src/utils/is-preview-deployment'

export default defineConfig({
  site: DOMAIN,
  integrations: [preact({ compat: true })],
  image: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
      },
    ],
  },
  vite: {
    ssr: {
      noExternal: ['react-hook-form', 'react-international-phone', 'embla-carousel-react'],
    },
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern',
        },
      },
    },
  },
  prefetch: {
    prefetchAll: true,
  },
  redirects: redirects,
  output: 'server',
  adapter: vercel({
    ...(!isPreviewDeployment
      ? {
          isr: {
            bypassToken: process.env.VERCEL_DEPLOYMENT_ID,
            exclude: [
              /^\/api\/.+/,
              /^\/pl\/koszyk/,
              // Exclude hotel listing page (both with and without trailing slash)
              /^\/pl\/hotele$/,
              /^\/pl\/hotele\/$/,
              // Exclude hotel pagination pages
              /^\/pl\/hotele\/strona\//,
              // Exclude activities listing pages
              /^\/pl\/integracje$/,
              /^\/pl\/integracje\/$/,
              // Exclude category pages with explicit patterns
              /^\/pl\/integracje\/kategoria\/[^\/]+$/,
              /^\/pl\/integracje\/kategoria\/[^\/]+\/$/,
              // Exclude category pagination
              /^\/pl\/integracje\/kategoria\/[^\/]+\/strona\//,
              // Exclude activities pagination
              /^\/pl\/integracje\/strona\//,
            ],
          },
        }
      : {}),
  }),
})
