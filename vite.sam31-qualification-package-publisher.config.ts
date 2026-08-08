import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    ssr: true,
    outDir: 'dist-sam31-qualification-package-publisher',
    emptyOutDir: true,
    copyPublicDir: false,
    target: 'node22',
    rolldownOptions: {
      input:
        'server/cli/canonical-sam3_1-source-checkpoint-qualification-package-cloud-job.ts',
      output: {
        entryFileNames: 'weeditpro-sam31-qualification-package-publisher.js',
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
