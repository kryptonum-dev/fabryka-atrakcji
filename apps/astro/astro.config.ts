import preact from '@astrojs/preact'
import vercel from '@astrojs/vercel'
import { defineConfig } from 'astro/config'
import redirects from './redirects'
import { DOMAIN } from './src/global/constants'
import { isPreviewDeployment } from './src/utils/is-preview-deployment'

export default defineConfig({
  site: DOMAIN,
  integrations: [preact({ compat: true })],
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
            bypassToken: process.env.ISR_BYPASS_TOKEN,
            // Without this the adapter never expires an entry, so a 404 cached for a
            // not-yet-published URL would outlive the publish.
            expiration: 3600,
            // Filter routes need both layers. The adapter turns these regexes into patterns with no
            // trailing slash, so they only cover `/filtr` and `/filter`. The canonical `/filtr/` and
            // `/filter/` forms the app links to are bypassed by the wildcard rewrites in vercel.json.
            exclude: [
              /^\/api\/.+/,
              /.*\/filtr.*/, // Exclude any URL containing "/filtr"
              /.*\/filter.*/, // Exclude any URL containing "/filter"
            ],
          },
        }
      : {}),
  }),
})
