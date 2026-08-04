import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    ssr: true,
    outDir: 'dist-release-tools',
    emptyOutDir: true,
    target: 'node22',
    rollupOptions: {
      input: {
        'container-readiness-host-verifier':
          'server/cli/verify-production-container-qualification-candidate.ts',
        'container-manual-review-package':
          'server/cli/prepare-production-container-manual-qualification-review.ts',
      },
      output: {
        entryFileNames: '[name].js',
        format: 'es',
      },
    },
  },
  ssr: {
    target: 'node',
    noExternal: true,
  },
})
