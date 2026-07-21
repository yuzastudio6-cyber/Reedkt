import { defineConfig, devices } from '@playwright/test'

const uiPort = Number(process.env.PLAYWRIGHT_EDIT_REFERENCE_CANONICAL_UI_PORT ?? 5413)
const apiPort = Number(process.env.PLAYWRIGHT_EDIT_REFERENCE_CANONICAL_API_PORT ?? 9005)
// Local-test project persistence is intentionally fixed to this workspace.
// Keeping Edit Preferences on the same exact scope proves the canonical
// library-to-named-edit handoff instead of creating a second test authority.
const workspaceId = 'workspace-internal-testing'
const baseURL = `http://127.0.0.1:${uiPort}`
const apiBaseURL = `http://127.0.0.1:${apiPort}`
const storageRoot = process.env.PLAYWRIGHT_EDIT_REFERENCE_CANONICAL_STORAGE_ROOT
  ?? `/Volumes/REeditproWork/reeditpro-e2e-runtime/edit-reference-canonical-${process.pid}`

export default defineConfig({
  metadata: {
    editReferenceCanonicalStorageRoot: storageRoot,
    editReferenceCanonicalWorkspaceId: workspaceId,
  },
  testDir: '.',
  testMatch: 'edit-reference-canonical-real-file-flow.spec.ts',
  outputDir: '../../test-results/edit-reference-canonical-real-file-e2e',
  fullyParallel: false,
  retries: 0,
  reporter: [['list']],
  timeout: 120_000,
  expect: { timeout: 15_000 },
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
      command: 'npx tsx ../../server/index.ts',
      env: {
        NODE_ENV: 'test',
        API_PORT: String(apiPort),
        API_ALLOWED_CORS_ORIGINS: baseURL,
        API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
        E2E_RUNTIME_MODE: 'mock',
        STORAGE_MODE: 'local',
        REEDITPRO_LARGE_MEDIA_FINALIZATION_MODE: 'private_local',
        LOCAL_STORAGE_ROOT: storageRoot,
        PROVIDER_EXECUTION_ENABLED: 'false',
        WORKER_RUNTIME_MODE: 'mock',
      },
      reuseExistingServer: false,
      timeout: 120_000,
      url: `${apiBaseURL}/v1/edit-references?workspaceId=${workspaceId}`,
    },
    {
      command: `npm run dev -- --host 127.0.0.1 --port ${uiPort}`,
      env: {
        NODE_ENV: 'test',
        E2E_RUNTIME_MODE: 'mock',
        API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
        PROVIDER_EXECUTION_ENABLED: 'false',
        WORKER_RUNTIME_MODE: 'mock',
        STORAGE_MODE: 'local',
        VITE_REEDITPRO_EDIT_REFERENCE_API_BASE_URL: apiBaseURL,
        VITE_REEDITPRO_EDIT_REFERENCE_WORKSPACE_ID: workspaceId,
        VITE_REEDITPRO_INTERNAL_TEST_WORKSPACE_ID: workspaceId,
        VITE_REEDITPRO_API_BASE_URL: apiBaseURL,
        VITE_REEDITPRO_API_MODE: 'frontend_safe',
        VITE_REEDITPRO_AUTH_MODE: 'local_test',
        VITE_REEDITPRO_INTERNAL_TEST_AUTH: 'true',
        VITE_REEDITPRO_E2E: 'true',
        VITE_REEDITPRO_E2E_AUTH_USER_ID: 'mock-user-runtime',
      },
      reuseExistingServer: false,
      timeout: 120_000,
      url: baseURL,
    },
  ],
})
