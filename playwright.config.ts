import { defineConfig, devices } from '@playwright/test'

const port = Number(process.env.PLAYWRIGHT_PORT ?? 5277)
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}`
const apiPort = Number(process.env.PLAYWRIGHT_API_PORT ?? 8877)
const apiBaseURL = `http://127.0.0.1:${apiPort}`
const reuseExistingServer = process.env.PLAYWRIGHT_REUSE_SERVER === 'true'
const editReferenceRunScope = (process.env.PLAYWRIGHT_EDIT_REFERENCE_RUN_SCOPE ?? `${Date.now()}-${process.pid}`)
  .replace(/[^a-zA-Z0-9-]/g, '-')
const localStorageRoot = process.env.PLAYWRIGHT_LOCAL_UPLOAD_STORAGE_ROOT
  ?? `test-results/edit-reference-private-${editReferenceRunScope}`
const internalTestAuthEnabled = process.env.PLAYWRIGHT_INTERNAL_TEST_AUTH === 'true'
const backendUploadEnabled = process.env.PLAYWRIGHT_SOURCE_VIDEO_BACKEND_UPLOAD === 'true'
const localEditPreviewEnabled = process.env.PLAYWRIGHT_LOCAL_EDIT_PREVIEW_SMOKE === 'true'
const backendUploadApiBaseUrl = process.env.PLAYWRIGHT_SOURCE_VIDEO_BACKEND_UPLOAD_API_BASE_URL ?? apiBaseURL

export default defineConfig({
  testDir: './tests/e2e',
  testIgnore: ['**/._*'],
  outputDir: 'test-results/e2e',
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  timeout: 45_000,
  expect: {
    timeout: 7_500,
  },
  use: {
    baseURL,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    video: 'off',
    viewport: { width: 1280, height: 900 },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'npm run dev:api',
      env: {
        NODE_ENV: 'test',
        API_PORT: String(apiPort),
        E2E_RUNTIME_MODE: 'local',
        API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
        PROVIDER_EXECUTION_ENABLED: 'false',
        WORKER_RUNTIME_MODE: 'mock',
        STORAGE_MODE: 'local',
        LOCAL_STORAGE_ROOT: localStorageRoot,
      },
      reuseExistingServer,
      timeout: 120_000,
      url: `${apiBaseURL}/health`,
    },
    {
      command: `npm run dev -- --host 127.0.0.1 --port ${port}`,
      env: {
        NODE_ENV: 'test',
        E2E_RUNTIME_MODE: 'mock',
        API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
        PROVIDER_EXECUTION_ENABLED: 'false',
        WORKER_RUNTIME_MODE: 'mock',
        STORAGE_MODE: 'local',
        VITE_API_BASE_URL: `http://127.0.0.1:${port}`,
        VITE_REEDITPRO_EDIT_REFERENCE_API_BASE_URL: apiBaseURL,
        VITE_REEDITPRO_EDIT_REFERENCE_WORKSPACE_ID: `workspace-edit-reference-${editReferenceRunScope}`,
        VITE_REEDITPRO_API_BASE_URL: backendUploadApiBaseUrl,
        VITE_REEDITPRO_INTERNAL_TEST_AUTH: internalTestAuthEnabled ? 'true' : 'false',
        VITE_REEDITPRO_LOCAL_EDIT_PREVIEW_SMOKE: localEditPreviewEnabled ? 'true' : 'false',
        VITE_REEDITPRO_SOURCE_VIDEO_BACKEND_UPLOAD: backendUploadEnabled ? 'true' : 'false',
        // Enables guarded E2E-only branches such as /editor?qaApprovalFailure=1 without exposing debug UI.
        VITE_REEDITPRO_E2E: 'true',
      },
      reuseExistingServer,
      timeout: 120_000,
      url: baseURL,
    },
  ],
})
