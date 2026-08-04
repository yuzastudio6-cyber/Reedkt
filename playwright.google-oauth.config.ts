import { defineConfig, devices } from '@playwright/test'

const port = Number(process.env.PLAYWRIGHT_GOOGLE_OAUTH_PORT ?? 5201)
const baseURL = `http://127.0.0.1:${port}`

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: 'google-oauth-sign-in.spec.ts',
  outputDir: 'test-results/google-oauth-sign-in',
  reporter: [['list']],
  timeout: 30_000,
  expect: { timeout: 7_500 },
  use: {
    ...devices['Desktop Chrome'],
    baseURL,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `npm run dev -- --host 127.0.0.1 --port ${port}`,
    env: {
      NODE_ENV: 'test',
      VITE_REEDITPRO_AUTH_MODE: 'supabase',
      VITE_REEDITPRO_API_MODE: 'mock',
      VITE_SUPABASE_URL: 'https://oauth-fixture.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'fixture-public-anon-key',
    },
    reuseExistingServer: false,
    timeout: 120_000,
    url: baseURL,
  },
})
