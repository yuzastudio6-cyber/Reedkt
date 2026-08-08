import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    ssr: true,
    outDir: 'dist-sam31-official-probe-fixture-ingest',
    emptyOutDir: true,
    copyPublicDir: false,
    target: 'node22',
    rolldownOptions: {
      input:
        'server/cli/canonical-sam3_1-official-probe-fixture-ingest.ts',
      output: {
        entryFileNames:
          'weeditpro-sam31-official-probe-fixture-ingest.js',
        format: 'es',
        codeSplitting: false,
      },
    },
  },
  ssr: {
    target: 'node',
    noExternal: true,
    external: ['abort-controller'],
  },
})
