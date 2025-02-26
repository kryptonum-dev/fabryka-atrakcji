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
      noExternal: [],
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
            exclude: [],
          },
        }
      : {}),
  }),
})
