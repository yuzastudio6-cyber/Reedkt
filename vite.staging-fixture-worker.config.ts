import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    ssr: 'src/backend/staging-fixture-worker/staging-fixture-worker-cli.ts',
    outDir: 'dist-staging-fixture-worker',
    emptyOutDir: true,
    target: 'node22',
    rollupOptions: {
      output: {
        entryFileNames: 'staging-fixture-worker-cli.js',
        format: 'es',
      },
    },
  },
  ssr: {
    target: 'node',
    noExternal: true,
  },
})
