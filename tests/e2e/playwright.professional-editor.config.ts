import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, devices } from '@playwright/test'

const repositoryRoot = fileURLToPath(new URL('../..', import.meta.url))
const professionalEditorStorageRoot =
  process.env.PLAYWRIGHT_PROFESSIONAL_EDITOR_STORAGE_ROOT
  ?? resolve(repositoryRoot, 'test-results/professional-editor-storage')

export default defineConfig({
  testDir: '.',
  testMatch: ['editor-clean-slate.spec.ts'],
  outputDir: '../../test-results/professional-editor-e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  timeout: 90_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: 'http://127.0.0.1:5443',
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
      command: 'npx tsx tests/e2e/professional-editor-api-server.ts',
      cwd: repositoryRoot,
      env: {
        NODE_ENV: 'test',
        API_PORT: '5444',
        API_ALLOWED_CORS_ORIGINS: 'http://127.0.0.1:5443',
        API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
        E2E_RUNTIME_MODE: 'local',
        STORAGE_MODE: 'local',
        REEDITPRO_LARGE_MEDIA_FINALIZATION_MODE: 'private_local',
        LOCAL_STORAGE_ROOT: professionalEditorStorageRoot,
        PROVIDER_EXECUTION_ENABLED: 'false',
        WORKER_RUNTIME_MODE: 'mock',
      },
      reuseExistingServer: false,
      timeout: 120_000,
      url: 'http://127.0.0.1:5444/health',
    },
    {
      command: 'npm run dev -- --host 127.0.0.1 --port 5443',
      cwd: repositoryRoot,
      env: {
        NODE_ENV: 'test',
        E2E_RUNTIME_MODE: 'mock',
        API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
        STORAGE_MODE: 'local',
        PROVIDER_EXECUTION_ENABLED: 'false',
        WORKER_RUNTIME_MODE: 'mock',
        VITE_REEDITPRO_API_BASE_URL: 'http://127.0.0.1:5444',
        VITE_REEDITPRO_EDIT_REFERENCE_API_BASE_URL: 'http://127.0.0.1:5444',
        VITE_REEDITPRO_EDIT_REFERENCE_WORKSPACE_ID: 'workspace-internal-testing',
        VITE_REEDITPRO_INTERNAL_TEST_WORKSPACE_ID: 'workspace-internal-testing',
        VITE_REEDITPRO_API_MODE: 'frontend_safe',
        VITE_REEDITPRO_AUTH_MODE: 'local_test',
        VITE_REEDITPRO_E2E: 'true',
        VITE_REEDITPRO_E2E_AUTH_USER_ID: 'mock-user-runtime',
        VITE_REEDITPRO_E2E_LOCAL_PRIVATE_UPLOADS: 'true',
      },
      reuseExistingServer: false,
      timeout: 120_000,
      url: 'http://127.0.0.1:5443',
    },
  ],
})
