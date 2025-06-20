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
    isr: {
      bypassToken: process.env.VERCEL_DEPLOYMENT_ID,
      exclude: [
        /^\/api\/.+/,
        /^\/pl\/koszyk/,

        // Try matching ONLY paths that are exactly /pl/hotele with optional trailing slash
        // and nothing after it
        /^\/pl\/hotele\/?(?:\?.*)?$/, // This should match /pl/hotele/ or /pl/hotele but NOT /pl/hotele/anything

        // Your other exclusions...
        /^\/pl\/hotele\/strona\//,
        /^\/pl\/integracje\/?(?:\?.*)?$/,
        /^\/pl\/integracje\/kategoria\/[^\/]+\/?$/,
        /^\/pl\/integracje\/kategoria\/[^\/]+\/strona\//,
        /^\/pl\/integracje\/strona\//,
      ],
    },
  }),
})
