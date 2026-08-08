import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    ssr: true,
    outDir: 'dist-gpu-rate-publisher',
    emptyOutDir: true,
    copyPublicDir: false,
    target: 'node22',
    rolldownOptions: {
      input: 'server/cli/canonical-gpu-account-effective-rate-cloud-job.ts',
      output: {
        entryFileNames: 'weeditpro-gpu-rate-publisher.js',
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
