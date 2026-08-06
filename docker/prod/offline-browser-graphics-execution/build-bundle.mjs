import { build } from 'esbuild'

await build({
  entryPoints: ['/app/browser-operations.ts'],
  outfile: '/app/browser-operations.bundle.js',
  bundle: true,
  platform: 'browser',
  format: 'iife',
  target: ['chrome120'],
  legalComments: 'none',
  minify: true,
  sourcemap: false,
})
