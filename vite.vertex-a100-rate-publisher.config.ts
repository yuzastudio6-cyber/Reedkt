import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    ssr: true,
    outDir: 'dist-vertex-a100-rate-publisher',
    emptyOutDir: true,
    copyPublicDir: false,
    target: 'node22',
    rolldownOptions: {
      input:
        'server/cli/canonical-vertex-a100-account-effective-rate-cloud-job.ts',
      output: {
        entryFileNames: 'weeditpro-vertex-a100-rate-publisher.js',
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
