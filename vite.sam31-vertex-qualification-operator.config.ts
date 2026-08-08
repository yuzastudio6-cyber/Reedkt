import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    ssr: true,
    outDir: 'dist-sam31-vertex-qualification-operator',
    emptyOutDir: true,
    copyPublicDir: false,
    target: 'node22',
    rolldownOptions: {
      input:
        'server/cli/canonical-sam3_1-source-checkpoint-qualification-vertex-cloud-job.ts',
      output: {
        entryFileNames: 'weeditpro-sam31-vertex-qualification-operator.js',
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
