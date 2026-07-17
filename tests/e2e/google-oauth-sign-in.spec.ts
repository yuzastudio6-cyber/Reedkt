import { expect, test } from '@playwright/test'
import { expectNoHorizontalOverflow, setViewport } from './helpers/layout'

const oauthAuthorizePrefix = 'https://oauth-fixture.supabase.co/auth/v1/authorize'

test.describe('Google OAuth sign-in', () => {
  test.beforeEach(async ({ page }) => {
    await page.route(`${oauthAuthorizePrefix}**`, async (route) => {
      await route.fulfill({
        body: '<!doctype html><title>OAuth handoff captured</title>',
        contentType: 'text/html',
        status: 200,
      })
    })
  })

  test('keeps Google primary and email/password as an accessible fallback', async ({ page }) => {
    await setViewport(page, 375, 667)
    await page.goto('/sign-in')

    const google = page.getByTestId('google-sign-in')
    await expect(google).toBeVisible()
    await expect(google).toHaveText(/Continue with Google/)
    expect(await google.evaluate((element) => Number.parseFloat(getComputedStyle(element).minHeight))).toBeGreaterThanOrEqual(44)
    const googleBox = await google.boundingBox()
    expect(googleBox).not.toBeNull()
    expect((googleBox?.y ?? 667) + (googleBox?.height ?? 0)).toBeLessThanOrEqual(667)

    await expect(page.getByLabel('Email')).not.toBeVisible()
    await page.getByTestId('auth-password-toggle').click()
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
    await expect(page.getByTestId('auth-submit-button')).toHaveText(/Sign in with email/)
    await expectNoHorizontalOverflow(page)
  })

  test('hands off to Google with the exact safe internal return path', async ({ page }) => {
    await page.goto('/sign-in?returnTo=%2Fprojects%2Fnew%3Ffrom%3Dgoogle%23details')
    const requestPromise = page.waitForRequest((request) => request.url().startsWith(oauthAuthorizePrefix))
    await page.getByTestId('google-sign-in').click()
    const request = await requestPromise
    const authorizeUrl = new URL(request.url())

    expect(authorizeUrl.searchParams.get('provider')).toBe('google')
    expect(authorizeUrl.searchParams.get('redirect_to')).toBe(
      'http://127.0.0.1:5201/sign-in?returnTo=%2Fprojects%2Fnew%3Ffrom%3Dgoogle%23details',
    )
    expect(request.url()).not.toContain('fixture-public-anon-key')
  })

  test('replaces an external return target with the dashboard', async ({ page }) => {
    await page.goto('/sign-in?returnTo=https%3A%2F%2Fevil.example%2Fcollect')
    const requestPromise = page.waitForRequest((request) => request.url().startsWith(oauthAuthorizePrefix))
    await page.getByTestId('google-sign-in').click()
    const authorizeUrl = new URL((await requestPromise).url())

    expect(authorizeUrl.searchParams.get('redirect_to')).toBe(
      'http://127.0.0.1:5201/sign-in?returnTo=%2Fdashboard',
    )
  })

  test('shows a recoverable, non-technical cancellation message', async ({ page }) => {
    await page.goto('/sign-in?error=access_denied&error_description=provider-internal-details')
    await expect(page.getByRole('alert')).toHaveText('Google sign-in was cancelled. Try again when you are ready.')
    await expect(page.getByRole('alert')).not.toContainText('provider-internal-details')
    await expect(page.getByTestId('google-sign-in')).toBeEnabled()
  })
})
