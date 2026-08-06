import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    ssr: true,
    outDir: 'dist-sam31-official-artifact-ingest',
    emptyOutDir: true,
    copyPublicDir: false,
    target: 'node22',
    rolldownOptions: {
      input: 'server/cli/canonical-sam3_1-official-artifact-ingest.ts',
      output: {
        entryFileNames: 'weeditpro-sam31-official-artifact-ingest.js',
        format: 'es',
        codeSplitting: false,
      },
    },
  },
  ssr: {
    target: 'node',
  },
})
