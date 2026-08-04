import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    // `server/index.ts` is the hardened Express API entrypoint. The older
    // `src/server/server.ts` runtime is a local mock scaffold and must never be
    // emitted as the production Cloud Run artifact.
    ssr: true,
    outDir: 'dist-server',
    emptyOutDir: true,
    target: 'node22',
    rollupOptions: {
      input: {
        server: 'server/index.ts',
        'container-readiness-receipt':
          'server/cli/production-container-qualification-receipt.ts',
        'weeditpro-source-analysis-l4-visual-evidence-worker':
          'server/cli/run-weeditpro-source-analysis-l4-visual-evidence-worker.ts',
      },
      output: {
        entryFileNames: '[name].js',
        format: 'es',
      },
    },
  },
  ssr: {
    target: 'node',
  },
})
