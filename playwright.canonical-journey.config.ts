import { defineConfig, devices } from '@playwright/test'

const port = Number(process.env.PLAYWRIGHT_PORT ?? 5207)
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}`

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: ['**/canonical-journey-ui.spec.ts'],
  outputDir: 'test-results/canonical-journey-ui',
  fullyParallel: false,
  retries: 0,
  reporter: [['list']],
  timeout: 45_000,
  expect: { timeout: 7_500 },
  use: {
    baseURL,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'off',
    viewport: { width: 1280, height: 900 },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `npm run dev -- --host 127.0.0.1 --port ${port}`,
    env: {
      NODE_ENV: 'test',
      E2E_RUNTIME_MODE: 'mock',
      API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
      PROVIDER_EXECUTION_ENABLED: 'false',
      WORKER_RUNTIME_MODE: 'mock',
      STORAGE_MODE: 'local',
      VITE_REEDITPRO_API_MODE: 'frontend_safe',
      VITE_REEDITPRO_API_BASE_URL: baseURL,
      VITE_REEDITPRO_AUTH_MODE: 'local_test',
      VITE_REEDITPRO_E2E: 'true',
      VITE_REEDITPRO_E2E_AUTH_TOKEN: 'canonical-journey-playwright-token',
    },
    reuseExistingServer: false,
    timeout: 120_000,
    url: baseURL,
  },
})
