import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    // `server/index.ts` is the hardened Express API entrypoint. The older
    // `src/server/server.ts` runtime is a local mock scaffold and must never be
    // emitted as the production Cloud Run artifact.
    ssr: 'server/index.ts',
    outDir: 'dist-server',
    emptyOutDir: true,
    target: 'node22',
    rollupOptions: {
      output: {
        entryFileNames: 'server.js',
        format: 'es',
      },
    },
  },
  ssr: {
    target: 'node',
  },
})
