import { defineConfig, devices } from '@playwright/test'

const port = Number(process.env.PLAYWRIGHT_EDIT_REFERENCE_REVIEW_PORT ?? 5398)
const baseURL = `http://127.0.0.1:${port}`

export default defineConfig({
  testDir: '.',
  testMatch: 'edit-reference-long-form-review.spec.ts',
  outputDir: '../../test-results/edit-reference-long-form-review-e2e',
  fullyParallel: false,
  retries: 0,
  reporter: [['list']],
  timeout: 90_000,
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
  webServer: {
    command: `npm run dev -- --host 127.0.0.1 --port ${port}`,
    env: {
      NODE_ENV: 'test',
      E2E_RUNTIME_MODE: 'mock',
      API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
      PROVIDER_EXECUTION_ENABLED: 'false',
      WORKER_RUNTIME_MODE: 'mock',
      STORAGE_MODE: 'local',
      VITE_REEDITPRO_EDIT_REFERENCE_API_BASE_URL: 'http://127.0.0.1:8999',
      VITE_REEDITPRO_EDIT_REFERENCE_WORKSPACE_ID: 'workspace-long-form-review-ui',
      VITE_REEDITPRO_INTERNAL_TEST_WORKSPACE_ID: 'workspace-long-form-review-ui',
      VITE_REEDITPRO_API_BASE_URL: 'http://127.0.0.1:8999',
      VITE_REEDITPRO_AUTH_MODE: 'local_test',
      VITE_REEDITPRO_INTERNAL_TEST_AUTH: 'true',
      VITE_REEDITPRO_E2E: 'true',
    },
    reuseExistingServer: false,
    timeout: 120_000,
    url: baseURL,
  },
})
