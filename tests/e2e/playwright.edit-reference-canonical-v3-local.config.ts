import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { defineConfig, devices } from '@playwright/test'

const uiPort = Number(process.env.PLAYWRIGHT_EDIT_REFERENCE_V3_UI_PORT ?? 5417)
const apiPort = Number(process.env.PLAYWRIGHT_EDIT_REFERENCE_V3_API_PORT ?? 9017)
const baseURL = `http://127.0.0.1:${uiPort}`
const apiBaseURL = `http://127.0.0.1:${apiPort}`
const storageRoot = process.env.PLAYWRIGHT_EDIT_REFERENCE_V3_STORAGE_ROOT
  ?? join(tmpdir(), `reeditpro-edit-reference-v3-browser-${process.pid}`)
const supabaseUrl = requiredLocalEnvironment(
  'REEDITPRO_CANONICAL_V3_API_URL',
  'http://127.0.0.1:57431',
)
const supabaseAnonKey = requiredEnvironment('REEDITPRO_CANONICAL_V3_ANON_KEY')
const supabaseServiceRoleKey = requiredEnvironment(
  'REEDITPRO_CANONICAL_V3_SERVICE_ROLE_KEY',
)
const canonicalV3JwtSecret = requiredEnvironment('REEDITPRO_CANONICAL_V3_JWT_SECRET')

export default defineConfig({
  metadata: {
    editReferenceCanonicalStorageRoot: storageRoot,
    editReferenceCanonicalWorkspaceId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    persistenceAuthority: 'canonical_v3_local_supabase_rls',
  },
  testDir: '.',
  testMatch: 'edit-reference-canonical-v3-local-browser.spec.ts',
  outputDir: '../../test-results/edit-reference-canonical-v3-local-browser',
  fullyParallel: false,
  retries: 0,
  reporter: [['list']],
  timeout: 180_000,
  expect: { timeout: 20_000 },
  use: {
    baseURL,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'off',
    viewport: { width: 1280, height: 900 },
  },
  projects: [{
    name: 'chromium',
    use: { ...devices['Desktop Chrome'] },
  }],
  webServer: [
    {
      command: 'npx tsx edit-preferences-atomic-api-server.ts',
      cwd: '.',
      env: {
        NODE_ENV: 'test',
        API_PORT: String(apiPort),
        API_ALLOWED_CORS_ORIGINS: baseURL,
        API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
        E2E_RUNTIME_MODE: 'local',
        STORAGE_MODE: 'local',
        REEDITPRO_LARGE_MEDIA_FINALIZATION_MODE: 'private_local',
        LOCAL_STORAGE_ROOT: storageRoot,
        PROVIDER_EXECUTION_ENABLED: 'false',
        WORKER_RUNTIME_MODE: 'mock',
        SUPABASE_URL: supabaseUrl,
        SUPABASE_ANON_KEY: supabaseAnonKey,
        SUPABASE_SERVICE_ROLE_KEY: supabaseServiceRoleKey,
        REEDITPRO_CANONICAL_V3_API_URL: supabaseUrl,
        REEDITPRO_CANONICAL_V3_ANON_KEY: supabaseAnonKey,
        REEDITPRO_CANONICAL_V3_SERVICE_ROLE_KEY: supabaseServiceRoleKey,
        REEDITPRO_CANONICAL_V3_LOCAL_PRE_PLAN_SIGNING_SECRET:
          canonicalV3JwtSecret,
      },
      reuseExistingServer: false,
      timeout: 120_000,
      url: `${apiBaseURL}/health`,
    },
    {
      command: `npm run dev -- --host 127.0.0.1 --port ${uiPort}`,
      cwd: '../..',
      env: {
        NODE_ENV: 'test',
        E2E_RUNTIME_MODE: 'local',
        API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
        PROVIDER_EXECUTION_ENABLED: 'false',
        WORKER_RUNTIME_MODE: 'mock',
        STORAGE_MODE: 'local',
        VITE_REEDITPRO_EDIT_REFERENCE_API_BASE_URL: apiBaseURL,
        VITE_REEDITPRO_EDIT_REFERENCE_WORKSPACE_ID:
          'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        VITE_REEDITPRO_API_BASE_URL: apiBaseURL,
        VITE_REEDITPRO_API_MODE: 'frontend_safe',
        VITE_REEDITPRO_AUTH_MODE: 'supabase',
        VITE_REEDITPRO_E2E: 'true',
        VITE_SUPABASE_URL: supabaseUrl,
        VITE_SUPABASE_ANON_KEY: supabaseAnonKey,
      },
      reuseExistingServer: false,
      timeout: 120_000,
      url: baseURL,
    },
  ],
})

function requiredEnvironment(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`Missing required local browser environment: ${name}`)
  return value
}

function requiredLocalEnvironment(name: string, expected: string): string {
  const value = requiredEnvironment(name)
  if (value !== expected) {
    throw new Error(`${name} must target the isolated canonical V3 loopback stack.`)
  }
  return value
}
