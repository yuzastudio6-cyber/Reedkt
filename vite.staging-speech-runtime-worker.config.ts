import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    ssr: 'src/backend/staging-speech-runtime-worker/staging-speech-runtime-worker-cli.ts',
    outDir: 'dist-staging-speech-runtime-worker',
    emptyOutDir: true,
    target: 'node22',
    rollupOptions: {
      output: {
        entryFileNames: 'staging-speech-runtime-worker-cli.js',
        format: 'es',
      },
    },
  },
  ssr: {
    target: 'node',
    noExternal: true,
  },
})
