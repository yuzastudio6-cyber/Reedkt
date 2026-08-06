import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const privateWorkspaceApiOrigin = resolvePrivateWorkspaceApiOrigin(
  process.env.REEDITPRO_PRIVATE_WORKSPACE_API_ORIGIN,
)

// https://vite.dev/config/
export default defineConfig({
  envDir: process.env.REEDITPRO_VITE_ENV_DIR || undefined,
  plugins: [react()],
  server: privateWorkspaceApiOrigin
    ? {
        proxy: {
          '/v1': {
            target: privateWorkspaceApiOrigin,
            changeOrigin: false,
          },
        },
      }
    : undefined,
})

function resolvePrivateWorkspaceApiOrigin(value: string | undefined): string | undefined {
  const normalized = value?.trim()
  if (!normalized) return undefined

  const parsed = new URL(normalized)
  const hostname = parsed.hostname.toLowerCase()
  const loopback = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1'
  if (parsed.protocol !== 'http:' || !loopback || parsed.username || parsed.password || parsed.pathname !== '/') {
    throw new Error('REEDITPRO_PRIVATE_WORKSPACE_API_ORIGIN must be a credential-free loopback HTTP origin.')
  }

  return parsed.origin
}
