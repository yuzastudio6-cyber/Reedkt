import { defineConfig, devices } from '@playwright/test'

const frontendUrl = 'http://127.0.0.1:5173'
const backendUrl = 'http://127.0.0.1:8787'

const mockedE2EEnv = {
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'mock',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
  WORKER_RUNTIME_MODE: 'mock',
  STORAGE_MODE: 'local',
  LOCAL_STORAGE_ROOT: '.reeditpro-local-e2e-storage',
  FRONTEND_URL: frontendUrl,
  BACKEND_URL: backendUrl,
  VITE_REEDITPRO_API_BASE_URL: backendUrl,
  VITE_REEDITPRO_API_MODE: 'mock',
  VITE_E2E_BROWSER_TEST: 'true',
}

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: frontendUrl,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
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
      url: `${backendUrl}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
      env: mockedE2EEnv,
    },
    {
      command: 'npm run dev -- --host 127.0.0.1 --port 5173 --strictPort',
      url: frontendUrl,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
      env: mockedE2EEnv,
    },
  ],
})
