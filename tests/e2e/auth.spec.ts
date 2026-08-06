import { expect, test } from '@playwright/test'
import { expectNoHorizontalOverflow, setViewport } from './helpers/layout'
import { gotoRoute } from './helpers/routes'

test.describe('frontend authentication entry', () => {
  test.beforeEach(async ({ page }) => {
    await setViewport(page, 1280)
  })

  test('keeps landing public and routes Sign In to the dedicated entry', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('link', { name: /^Sign In$/i })).toHaveAttribute('href', '/sign-in')
    await expect(page.getByTestId('app-session-identity')).toHaveCount(0)
    await expectNoHorizontalOverflow(page)
  })

  test('keeps the skip link quiet until keyboard focus makes it available', async ({ page }) => {
    await page.goto('/sign-in')
    const skipLink = page.getByRole('link', { name: 'Skip to main content' })
    const restingBox = await skipLink.boundingBox()
    expect(restingBox?.y ?? 0).toBeLessThan(0)

    await page.keyboard.press('Tab')
    await expect(skipLink).toBeFocused()
    await expect.poll(async () => (await skipLink.boundingBox())?.y ?? -1).toBeGreaterThanOrEqual(0)
  })

  test('guards app routes and preserves a sanitized internal return path', async ({ page }) => {
    await page.goto('/projects/new?from=auth#project-details')

    await expect(page).toHaveURL(/\/sign-in\?returnTo=/)
    const signInCard = page.getByTestId('sign-in-card')
    await expect(signInCard).toBeVisible()
    await expect(page.getByTestId('local-test-sign-in')).toBeVisible()
    expect(await page.locator('.auth-layout').evaluate((element) => getComputedStyle(element).display)).toBe('grid')
    expect(
      await page.locator('.auth-layout').evaluate((element) => getComputedStyle(element).gridTemplateColumns.trim().split(/\s+/).length),
    ).toBe(2)
    expect(await signInCard.evaluate((element) => getComputedStyle(element).display)).toBe('grid')
    await expect(page.locator('.auth-page')).not.toContainText(/frontend anon|service-role|supabase env|backend readiness/i)

    const returnTo = await page.evaluate(() => new URLSearchParams(window.location.search).get('returnTo'))
    expect(returnTo).toBe('/projects/new?from=auth#project-details')

    await page.getByTestId('local-test-sign-in').click()
    await expect(page).toHaveURL(/\/projects\/new\?from=auth#project-details$/)
    await expect(page.getByTestId('app-shell')).toBeVisible()
  })

  test('preserves the legacy internal redirect alias without accepting an external target', async ({ page }) => {
    await page.goto('/sign-in?redirect=%2Fprojects%2Fnew%3Ffrom%3Dredirect-alias')
    await page.getByTestId('local-test-sign-in').click()

    await expect(page).toHaveURL(/\/projects\/new\?from=redirect-alias$/)
    await expect(page.getByTestId('app-shell')).toBeVisible()
  })

  test('rejects an external return target', async ({ page }) => {
    await page.goto('/sign-in?returnTo=https%3A%2F%2Fevil.example%2Fcapture')
    await page.getByTestId('local-test-sign-in').click()

    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(page.getByTestId('app-shell')).toBeVisible()
  })

  test('uses a tab-scoped local identity with no fake bearer token and signs out cleanly', async ({ page }) => {
    await gotoRoute(page, '/dashboard')

    const identity = page.getByTestId('app-session-identity')
    await expect(identity).toContainText('Local test user')
    await expect(identity).toContainText('Test session')

    const browserStorage = await page.evaluate(() => ({
      local: Object.fromEntries(Array.from({ length: window.localStorage.length }, (_, index) => {
        const key = window.localStorage.key(index) ?? ''
        return [key, window.localStorage.getItem(key)]
      })),
      session: Object.fromEntries(Array.from({ length: window.sessionStorage.length }, (_, index) => {
        const key = window.sessionStorage.key(index) ?? ''
        return [key, window.sessionStorage.getItem(key)]
      })),
    }))

    expect(browserStorage.session['reeditpro.auth.localTestSession.v1']).toBeTruthy()
    expect(JSON.stringify(browserStorage.session)).not.toMatch(/bearer|access[_-]?token|jwt/i)
    expect(Object.keys(browserStorage.local).some((key) => key.includes('auth-token'))).toBe(false)

    await identity.getByRole('button', { name: /^Sign out$/i }).click()
    await expect(page).toHaveURL(/\/sign-in\?returnTo=/)
    await expect(page.getByTestId('local-test-sign-in')).toBeVisible()

    const localSession = await page.evaluate(() => window.sessionStorage.getItem('reeditpro.auth.localTestSession.v1'))
    expect(localSession).toBeNull()
  })
})
