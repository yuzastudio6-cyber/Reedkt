import { expect, test } from '@playwright/test'
import { setViewport } from './helpers/layout'
import { gotoRoute } from './helpers/routes'

test.describe('App sign-in internal testing mock auth', () => {
  test.skip(
    process.env.PLAYWRIGHT_INTERNAL_TEST_AUTH !== 'true',
    'Run the app with VITE_REEDITPRO_INTERNAL_TEST_AUTH=true to verify browser-local testing sign-in.',
  )

  test('creates a browser-local testing session and opens app home', async ({ page }) => {
    await setViewport(page, 1440)
    await gotoRoute(page, '/sign-in?redirect=/dashboard')

    await expect(page.getByRole('heading', { name: /sign in to test the reeditpro app/i })).toBeVisible()
    await expect(page.getByTestId('auth-local-testing-session-notice')).toContainText('Local app session is enabled')
    await expect(page.getByTestId('auth-local-testing-session-notice')).toContainText(/does not send credentials to Supabase/i)
    await expect(page.getByText(/Mock auth enabled|Mock auth inactive/i)).toBeVisible()

    await page.getByLabel('Email').fill('internal.tester@reeditpro.local')
    await page.getByLabel('Password').fill('reeditpro-testing')
    await page.getByTestId('auth-submit-button').click()

    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(page.getByRole('heading', { name: /start a clean reeditpro edit/i })).toBeVisible()

    await gotoRoute(page, '/sign-in?redirect=/dashboard')
    await expect(page.getByText('Session found')).toBeVisible()
    await expect(page.getByText('internal.tester@reeditpro.local')).toBeVisible()
    await expect(page.locator('body')).not.toContainText(/SUPABASE_SERVICE_ROLE|provider call made:\s*true|worker dispatch started|credit reserved:\s*true|production ready:\s*true/i)
  })
})
