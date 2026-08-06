import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, devices } from '@playwright/test'

const repositoryRoot = fileURLToPath(new URL('../..', import.meta.url))
// A professional-editor run writes durable private authority and rendered
// media. Reusing the default store across invocations can replay stale locks,
// reservations, or artifacts from an earlier run. Keep an explicit override
// for recovery tests while making the ordinary acceptance lane isolated.
const professionalEditorStorageRoot =
  process.env.PLAYWRIGHT_PROFESSIONAL_EDITOR_STORAGE_ROOT
  ?? mkdtempSync(join(tmpdir(), 'reeditpro-professional-editor-'))

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
