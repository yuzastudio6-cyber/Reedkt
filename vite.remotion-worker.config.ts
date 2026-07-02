import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    ssr: 'src/backend/render/remotion-worker/remotion-worker-cli.ts',
    outDir: 'dist-remotion-worker',
    emptyOutDir: true,
    target: 'node22',
    rollupOptions: {
      output: {
        entryFileNames: 'remotion-worker-cli.js',
        format: 'es',
      },
    },
  },
  ssr: {
    target: 'node',
    noExternal: true,
  },
})
