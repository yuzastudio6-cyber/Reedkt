import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    ssr: 'src/backend/staging-deepfilternet-runtime-worker/staging-deepfilternet-runtime-worker-cli.ts',
    outDir: 'dist-staging-deepfilternet-runtime-worker',
    emptyOutDir: true,
    target: 'node24',
    rollupOptions: {
      output: {
        entryFileNames: 'staging-deepfilternet-runtime-worker-cli.js',
        format: 'es',
      },
    },
  },
  ssr: {
    target: 'node',
    noExternal: true,
  },
})
