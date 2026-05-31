import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    ssr: 'src/backend/staging-final-render-hardening-worker/staging-final-render-hardening-worker-cli.ts',
    outDir: 'dist-staging-final-render-hardening-worker',
    emptyOutDir: true,
    target: 'node22',
    rollupOptions: {
      output: {
        entryFileNames: 'staging-final-render-hardening-worker-cli.js',
        format: 'es',
      },
    },
  },
  ssr: {
    target: 'node',
    noExternal: true,
  },
})
