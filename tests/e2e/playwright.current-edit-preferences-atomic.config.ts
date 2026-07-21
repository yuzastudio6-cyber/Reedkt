import { resolve } from 'node:path'
import { defineConfig, devices } from '@playwright/test'

const uiPort = Number(process.env.PLAYWRIGHT_CURRENT_EDIT_PREFERENCES_UI_PORT ?? 5433)
const apiPort = Number(process.env.PLAYWRIGHT_CURRENT_EDIT_PREFERENCES_API_PORT ?? 5434)
const baseURL = `http://127.0.0.1:${uiPort}`
const apiBaseURL = `http://127.0.0.1:${apiPort}`

export default defineConfig({
  testDir: '.',
  testMatch: [
    'edit-preferences-atomic-apply.spec.ts',
    'edit-preferences-current-edit.spec.ts',
  ],
  outputDir: '../../test-results/current-edit-preferences-atomic-e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  timeout: 60_000,
  expect: { timeout: 10_000 },
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
      env: {
        NODE_ENV: 'test',
        API_PORT: String(apiPort),
        API_ALLOWED_CORS_ORIGINS: baseURL,
        API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
        E2E_RUNTIME_MODE: 'local',
        STORAGE_MODE: 'local',
        REEDITPRO_LARGE_MEDIA_FINALIZATION_MODE: 'private_local',
        LOCAL_STORAGE_ROOT: resolve('test-results/current-edit-preferences-atomic-storage'),
        PROVIDER_EXECUTION_ENABLED: 'false',
        WORKER_RUNTIME_MODE: 'mock',
      },
      reuseExistingServer: false,
      timeout: 120_000,
      url: `${apiBaseURL}/health`,
    },
    {
      command: `npm run dev -- --host 127.0.0.1 --port ${uiPort}`,
      env: {
        NODE_ENV: 'test',
        E2E_RUNTIME_MODE: 'mock',
        API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
        STORAGE_MODE: 'local',
        PROVIDER_EXECUTION_ENABLED: 'false',
        WORKER_RUNTIME_MODE: 'mock',
        VITE_REEDITPRO_API_BASE_URL: apiBaseURL,
        VITE_REEDITPRO_API_MODE: 'frontend_safe',
        VITE_REEDITPRO_AUTH_MODE: 'local_test',
        VITE_REEDITPRO_E2E: 'true',
        VITE_REEDITPRO_E2E_AUTH_USER_ID: 'mock-user-runtime',
        VITE_REEDITPRO_E2E_LOCAL_PRIVATE_UPLOADS: 'true',
      },
      reuseExistingServer: false,
      timeout: 120_000,
      url: baseURL,
    },
  ],
})
