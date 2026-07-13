import { expect, test } from '@playwright/test'
import { setViewport } from './helpers/layout'
import { gotoRoute } from './helpers/routes'

test.describe('App sign-in internal testing mock auth', () => {
  test.skip(
    process.env.PLAYWRIGHT_INTERNAL_TEST_AUTH !== 'true',
    'Run the app with VITE_REEDITPRO_INTERNAL_TEST_AUTH=true to verify browser-local testing sign-in.',
  )

  test('creates a guarded browser-local testing session and opens app home', async ({ page }) => {
    await setViewport(page, 1440)
    await gotoRoute(page, '/sign-in?redirect=/dashboard')

    await expect(page.getByRole('heading', { name: /pick up exactly where you left off/i })).toBeVisible()
    await expect(page.getByTestId('sign-in-card')).toContainText('Local preview session')
    await expect(page.getByTestId('sign-in-card')).toContainText(/browser-only workspace/i)
    await page.getByTestId('local-test-sign-in').click()

    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(page.getByRole('heading', { level: 1, name: 'Home' })).toBeVisible()
    await expect(page.getByTestId('app-session-identity')).toContainText('Local test user')

    await page.getByTestId('app-session-identity').getByRole('button', { name: /^Sign out$/i }).click()
    await expect(page).toHaveURL(/\/sign-in\?returnTo=/)
    await expect(page.getByTestId('local-test-sign-in')).toBeVisible()
    await expect(page.locator('body')).not.toContainText(/SUPABASE_SERVICE_ROLE|provider call made:\s*true|worker dispatch started|credit reserved:\s*true|production ready:\s*true/i)
  })
})
