import { expect, test } from '@playwright/test'
import { expectNoHorizontalOverflow, setViewport } from './helpers/layout'
import { gotoRoute } from './helpers/routes'

test.describe('Edit Preferences route entrypoint', () => {
  test('opens the canonical library-first Edit Preferences workspace safely', async ({ page }) => {
    await setViewport(page, 1440)
    await gotoRoute(page, '/preferences')

    const sidebarNav = page.getByRole('navigation', { name: /desktop app navigation/i })
    await expect(sidebarNav.getByRole('link', { name: /^Home$/ })).toBeVisible()
    await expect(sidebarNav.getByRole('link', { name: /^Edit Videos$/ })).toHaveAttribute('href', '/projects')
    await expect(sidebarNav.getByRole('link', { name: /^Edit Preferences$/ })).toBeVisible()
    await expect(sidebarNav).not.toContainText(/AI Editor|Media Library|Templates|Team|Analytics|Exports|Brand Kit|Settings/i)
    await expect(page.locator('.sidebar')).not.toContainText(/credits available|storage used|Creator workspace|Tommy/i)
    await expect(page.getByRole('button', { name: /open wallet/i })).toHaveCount(0)
    const preferences = page.getByTestId('edit-preferences-page')
    await expect(preferences).toBeVisible()
    await expect(page.getByRole('heading', { level: 1, name: 'Edit Preferences' })).toBeVisible()
    await expect(preferences.getByRole('tab', { name: 'Library' })).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByTestId('edit-reference-library-unavailable')).toBeVisible()
    await expect(page.getByTestId('edit-reference-empty-state')).toHaveCount(0)
    await expect(page.getByTestId('preference-edit-level')).toHaveCount(0)
    await expect(page.getByRole('button', { name: /^Save defaults$/i })).toHaveCount(0)
    await expect(page.getByTestId('internal-testing-details')).toHaveCount(0)
    await expect(page.getByText(/provider call made|worker created|render started|credit reserved|upload started/i)).toHaveCount(0)
    await expectNoHorizontalOverflow(page)
  })

  test('opens the canonical project and named-edit library from Edit Videos', async ({ page }) => {
    await setViewport(page, 1440)
    await gotoRoute(page, '/dashboard')

    await page.getByRole('navigation', { name: /desktop app navigation/i })
      .getByRole('link', { name: /^Edit Videos$/ })
      .click()

    await expect(page).toHaveURL(/\/projects$/)
    await expect(page.getByRole('heading', { level: 1, name: 'Edit Videos' })).toBeVisible()
    await expect(page.getByRole('navigation', { name: /desktop app navigation/i })
      .getByRole('link', { name: /^Edit Videos$/ })).toHaveAttribute('aria-current', 'page')
    await expect(page.getByRole('link', { name: /New project/i }).first()).toBeVisible()
    await expectNoHorizontalOverflow(page)
  })

  test('keeps retired old shell routes out of the app sidebar surface', async ({ page }) => {
    await setViewport(page, 1440)

    await gotoRoute(page, '/wallet')
    await expect(page).toHaveURL(/\/preferences$/)
    await expect(page.getByTestId('edit-preferences-page')).toBeVisible()
    await expect(page.getByRole('navigation', { name: /desktop app navigation/i })
      .getByRole('link', { name: /^Edit Videos$/ })).toHaveAttribute('href', '/projects')

    await gotoRoute(page, '/brand-kit')
    await expect(page).toHaveURL(/\/preferences$/)
    await expect(page.getByRole('navigation', { name: /desktop app navigation/i })
      .getByRole('link', { name: /^Edit Preferences$/ })).toBeVisible()

    await gotoRoute(page, '/exports')
    await expect(page).toHaveURL(/\/projects$/)
    await expect(page.getByRole('navigation', { name: /desktop app navigation/i })
      .getByRole('link', { name: /^Home$/ })).toBeVisible()
  })

  test('keeps legacy edit preferences route as a redirect', async ({ page }) => {
    await setViewport(page, 1280)
    await gotoRoute(page, '/edit-preferences')

    await expect(page).toHaveURL(/\/preferences$/)
    await expect(page.getByTestId('edit-preferences-page')).toBeVisible()
    await expectNoHorizontalOverflow(page)
  })
})
