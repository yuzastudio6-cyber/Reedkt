import { defineConfig, devices } from '@playwright/test'

process.env.MOTION_STUDIO_E2E = 'true'

const port = Number(process.env.MOTION_STUDIO_PLAYWRIGHT_PORT ?? 5195)
const baseURL = `http://127.0.0.1:${port}`

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: [
    'motion-studio-navigation-library.spec.ts',
    'motion-studio-storytelling-entry.spec.ts',
    'motion-studio-storytelling-workspace.spec.ts',
    'motion-studio-storytelling-story-workspace.spec.ts',
    'motion-studio-storytelling-scenes-workspace.spec.ts',
    'motion-studio-storytelling-preview-workspace.spec.ts',
    'motion-studio-storytelling-audio-workspace.spec.ts',
    'motion-studio-storytelling-timeline-workspace.spec.ts',
    'motion-studio-storytelling-assets-workspace.spec.ts',
    'motion-studio-storytelling-sources-workspace.spec.ts',
    'motion-studio-storytelling-review-workspace.spec.ts',
  ],
  outputDir: 'test-results/motion-studio',
  fullyParallel: false,
  // The suite shares one cold Vite compiler. Serialize files so concurrent
  // lazy workspace compilation cannot consume state-specific assertion time.
  workers: 1,
  retries: 0,
  reporter: [['list']],
  timeout: 45_000,
  expect: { timeout: 7_500 },
  use: {
    baseURL,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'off',
    viewport: { width: 1440, height: 960 },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
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
      VITE_REEDITPRO_API_BASE_URL: 'http://127.0.0.1:8791',
      VITE_REEDITPRO_AUTH_MODE: 'local_test',
      VITE_REEDITPRO_INTERNAL_TEST_AUTH: 'true',
      VITE_REEDITPRO_E2E: 'true',
      VITE_REEDITPRO_E2E_AUTH_TOKEN: 'motion-studio-local-e2e-token',
      VITE_REEDITPRO_E2E_LOCAL_PRIVATE_UPLOADS: 'true',
    },
    reuseExistingServer: false,
    timeout: 120_000,
    url: baseURL,
  },
})
