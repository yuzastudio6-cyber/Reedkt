import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    ssr: 'server/cli/verify-production-container-qualification-candidate.ts',
    outDir: 'dist-release-tools',
    emptyOutDir: true,
    target: 'node22',
    rollupOptions: {
      output: {
        entryFileNames: 'container-readiness-host-verifier.js',
        format: 'es',
      },
    },
  },
  ssr: {
    target: 'node',
    noExternal: true,
  },
})
