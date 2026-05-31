import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    ssr: 'src/backend/staging-pro-color-image-runtime-worker/staging-pro-color-image-runtime-worker-cli.ts',
    outDir: 'dist-staging-pro-color-image-runtime-worker',
    emptyOutDir: true,
    target: 'node22',
    rollupOptions: {
      output: {
        entryFileNames: 'staging-pro-color-image-runtime-worker-cli.js',
        format: 'es',
      },
    },
  },
  ssr: {
    target: 'node',
    noExternal: true,
  },
})
