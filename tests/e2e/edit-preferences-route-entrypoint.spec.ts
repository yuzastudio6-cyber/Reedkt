import { expect, test } from '@playwright/test'
import { expectNoHorizontalOverflow, setViewport } from './helpers/layout'
import { gotoRoute } from './helpers/routes'

test.describe('Edit Preferences route entrypoint', () => {
  test('opens the clean Preferences page safely', async ({ page }) => {
    await setViewport(page, 1440)
    await gotoRoute(page, '/preferences')

    const sidebarNav = page.getByRole('navigation', { name: /desktop app navigation/i })
    await expect(sidebarNav.getByRole('link')).toHaveCount(3)
    await expect(sidebarNav.getByRole('link', { name: /^Home$/ })).toBeVisible()
    await expect(sidebarNav.getByRole('link', { name: /^Project$/ })).toBeVisible()
    await expect(sidebarNav.getByRole('link', { name: /^Preferences$/ })).toBeVisible()
    await expect(sidebarNav).not.toContainText(/Projects|AI Editor|Media Library|Templates|Team|Analytics|Exports|Brand Kit|Settings/i)
    await expect(page.locator('.sidebar')).not.toContainText(/credits available|storage used|Creator workspace|Tommy/i)
    await expect(page.getByRole('button', { name: /open wallet/i })).toHaveCount(0)
    await expect(page.getByTestId('preferences-clean-shell')).toBeVisible()
    await expect(page.getByTestId('preferences-clean-shell')).toContainText('Edit defaults')
    await expect(page.getByTestId('preferences-clean-shell')).toContainText('Privacy')
    await expect(page.getByTestId('preferences-clean-shell')).toContainText('Save preference')
    await expect(page.getByText(/provider call made|worker created|render started|credit reserved|upload started/i)).toHaveCount(0)
    await expectNoHorizontalOverflow(page)
  })

  test('keeps retired old shell routes out of the app sidebar surface', async ({ page }) => {
    await setViewport(page, 1440)

    await gotoRoute(page, '/wallet')
    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(page.getByRole('navigation', { name: /desktop app navigation/i }).getByRole('link')).toHaveCount(3)

    await gotoRoute(page, '/brand-kit')
    await expect(page).toHaveURL(/\/preferences$/)
    await expect(page.getByRole('navigation', { name: /desktop app navigation/i }).getByRole('link')).toHaveCount(3)

    await gotoRoute(page, '/exports')
    await expect(page).toHaveURL(/\/projects$/)
    await expect(page.getByRole('navigation', { name: /desktop app navigation/i }).getByRole('link')).toHaveCount(3)
  })

  test('keeps legacy edit preferences route as a redirect', async ({ page }) => {
    await setViewport(page, 1280)
    await gotoRoute(page, '/edit-preferences')

    await expect(page).toHaveURL(/\/preferences$/)
    await expect(page.getByTestId('preferences-clean-shell')).toBeVisible()
    await expectNoHorizontalOverflow(page)
  })
})
