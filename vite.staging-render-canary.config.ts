import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    ssr: 'server/cloud-run/staging-render-canary-service.ts',
    outDir: 'dist-staging-render-canary',
    emptyOutDir: true,
    target: 'node22',
    rollupOptions: {
      output: {
        entryFileNames: 'staging-render-canary-service.js',
        format: 'es',
      },
    },
  },
  ssr: {
    target: 'node',
    external: ['@google-cloud/storage', '@remotion/bundler', '@remotion/renderer', 'remotion'],
  },
})
