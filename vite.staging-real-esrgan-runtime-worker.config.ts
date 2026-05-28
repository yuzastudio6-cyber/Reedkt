import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    ssr: 'src/backend/staging-real-esrgan-runtime-worker/staging-real-esrgan-runtime-worker-cli.ts',
    outDir: 'dist-staging-real-esrgan-runtime-worker',
    emptyOutDir: true,
    target: 'node22',
    rollupOptions: {
      output: {
        entryFileNames: 'staging-real-esrgan-runtime-worker-cli.js',
        format: 'es',
      },
    },
  },
  ssr: {
    target: 'node',
    noExternal: true,
  },
})
