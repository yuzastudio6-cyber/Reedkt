import {
  build,
} from '/app/node_modules/esbuild/lib/main.js'

await build({
  entryPoints: [
    '/qualification/browser-operation.ts',
  ],
  outfile:
    '/qualification/browser-operation.bundle.js',
  bundle: true,
  nodePaths: ['/app/node_modules'],
  platform: 'browser',
  format: 'iife',
  target: ['chrome120'],
  legalComments: 'none',
  minify: true,
  sourcemap: false,
})
