import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    ssr: true,
    outDir: 'dist-sam31-authorized-terms-finalization',
    emptyOutDir: true,
    copyPublicDir: false,
    target: 'node22',
    rolldownOptions: {
      input: 'server/cli/canonical-sam3_1-authorized-terms-finalization.ts',
      output: {
        entryFileNames: 'weeditpro-sam31-authorized-terms-finalization.js',
        format: 'es',
        codeSplitting: false,
      },
    },
  },
  ssr: {
    target: 'node',
    noExternal: true,
  },
})
