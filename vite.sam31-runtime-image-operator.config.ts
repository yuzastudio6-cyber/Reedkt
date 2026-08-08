import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    ssr: true,
    outDir: 'dist-sam31-runtime-image-operator',
    emptyOutDir: true,
    copyPublicDir: false,
    target: 'node22',
    rolldownOptions: {
      input: 'server/cli/canonical-sam3_1-runtime-image-cloud-job.ts',
      output: {
        entryFileNames: 'weeditpro-sam31-runtime-image-operator.js',
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
