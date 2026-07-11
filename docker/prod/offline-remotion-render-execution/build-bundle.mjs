import { rm } from 'node:fs/promises'
import { resolve } from 'node:path'

import { bundle } from '@remotion/bundler'

const outDir = '/opt/remotion-bundle'
await rm(outDir, { recursive: true, force: true })
await bundle({
  entryPoint: resolve('/app/entry.tsx'),
  outDir,
  rootDir: '/app',
  publicDir: null,
  enableCaching: false,
  askAIEnabled: false,
  keyboardShortcutsEnabled: false,
  webpackOverride: (configuration) => configuration,
})
