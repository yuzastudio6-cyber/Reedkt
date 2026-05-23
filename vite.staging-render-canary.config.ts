import { builtinModules } from 'node:module'
import { defineConfig } from 'vite'

const EXTERNAL_PACKAGES = [
  '@google-cloud/storage',
  '@google-cloud/paginator',
  '@remotion/bundler',
  '@remotion/renderer',
  'gaxios',
  'gcp-metadata',
  'google-auth-library',
  'remotion',
]

const EXTERNAL_PACKAGE_PREFIXES = [
  '@google-cloud/',
  'gaxios/',
  'gcp-metadata/',
  'google-auth-library/',
]

const NODE_BUILTINS = new Set(builtinModules.flatMap((name) => [name, `node:${name}`]))

function isNodeBuiltin(id: string): boolean {
  const normalized = id.replace(/^node:/, '')
  return NODE_BUILTINS.has(id)
    || builtinModules.some((name) => normalized === name || normalized.startsWith(`${name}/`))
}

function isStagingRenderCanaryExternal(id: string): boolean {
  return isNodeBuiltin(id)
    || EXTERNAL_PACKAGES.includes(id)
    || EXTERNAL_PACKAGE_PREFIXES.some((prefix) => id.startsWith(prefix))
}

export default defineConfig({
  build: {
    ssr: 'server/cloud-run/staging-render-canary-service.ts',
    outDir: 'dist-staging-render-canary',
    emptyOutDir: true,
    target: 'node22',
    rollupOptions: {
      external: isStagingRenderCanaryExternal,
      output: {
        entryFileNames: 'staging-render-canary-service.js',
        format: 'es',
      },
    },
  },
  ssr: {
    target: 'node',
    external: EXTERNAL_PACKAGES,
  },
})
