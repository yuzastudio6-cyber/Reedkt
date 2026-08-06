import { defineConfig, devices } from '@playwright/test'

// Keep the standard suite isolated from parallel feature checkouts. Reusing an
// arbitrary process on a shared Vite port can produce valid-looking evidence
// for a different source tree, so local reuse must be an explicit opt-in.
const port = Number(process.env.PLAYWRIGHT_PORT ?? 5203)
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}`
const reuseExistingServer = process.env.PLAYWRIGHT_REUSE_SERVER === undefined
  ? false
  : process.env.PLAYWRIGHT_REUSE_SERVER === 'true'

export default defineConfig({
  testDir: './tests/e2e',
  // Canonical journey UI coverage uses a dedicated frontend-safe HTTP runtime
  // and must not be collected by the standard mock-only browser suite.
  // Historical standalone Edit Brief specs target the retired ProjectHomePage
  // and /brief route. The active product keeps one inline Brief inside the named
  // edit and covers that lifecycle through editor.spec.ts.
  testIgnore: [
    '**/._*',
    '**/canonical-journey-ui.spec.ts',
    '**/edit-preferences-atomic-apply.spec.ts',
    '**/edit-preferences-current-edit.spec.ts',
    '**/edit-reference-canonical-real-file-flow.spec.ts',
    '**/edit-reference-canonical-v3-local-browser.spec.ts',
    '**/edit-reference-long-form-review.spec.ts',
    '**/editor-clean-slate.spec.ts',
    '**/google-oauth-sign-in.spec.ts',
    '**/motion-studio-*.spec.ts',
    '**/professional-long-form-customer-delivery-media-source.spec.ts',
    '**/professional-long-form-customer-delivery-review-ui.spec.ts',
    '**/project-edit-brief-*.spec.ts',
    '**/project-source-video-brief-playback.spec.ts',
    '**/screenshots.spec.ts',
  ],
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
  webServer: {
    command: `npm run dev -- --host 127.0.0.1 --port ${port} --strictPort`,
    env: {
      NODE_ENV: 'test',
      E2E_RUNTIME_MODE: 'mock',
      API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
      PROVIDER_EXECUTION_ENABLED: 'false',
      WORKER_RUNTIME_MODE: 'mock',
      STORAGE_MODE: 'local',
      // Standard browser QA is intentionally mock-only. The authenticated API + private
      // media pipeline is exercised separately by `npm run qa:internal-pipeline`.
      VITE_REEDITPRO_API_MODE: 'mock',
      // Browser QA enters through the same guarded sign-in route as a tester. This session
      // is sessionStorage-only, loopback + DEV restricted, and does not create a bearer token.
      VITE_REEDITPRO_AUTH_MODE: 'local_test',
      // Enables guarded E2E-only branches such as /editor?qaApprovalFailure=1 without exposing debug UI.
      VITE_REEDITPRO_E2E: 'true',
      VITE_REEDITPRO_E2E_LOCAL_PRIVATE_UPLOADS: 'true',
    },
    reuseExistingServer,
    timeout: 120_000,
    url: baseURL,
  },
})
