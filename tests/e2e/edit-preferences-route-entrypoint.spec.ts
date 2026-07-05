import { expect, test } from '@playwright/test'
import { expectNoHorizontalOverflow, setViewport } from './helpers/layout'
import { gotoRoute } from './helpers/routes'

test.describe('Edit Preferences route entrypoint', () => {
  test('opens the mock/local preference library and shows seeded options safely', async ({ page }) => {
    await setViewport(page, 1440)
    await gotoRoute(page, '/edit-preferences')

    const sidebarNav = page.getByRole('navigation', { name: /desktop app navigation/i })
    await expect(sidebarNav.getByRole('link')).toHaveCount(3)
    await expect(sidebarNav.getByRole('link', { name: /^Home$/ })).toBeVisible()
    await expect(sidebarNav.getByRole('link', { name: /^Projects$/ })).toBeVisible()
    await expect(sidebarNav.getByRole('link', { name: /^Preferences$/ })).toBeVisible()
    await expect(sidebarNav).not.toContainText(/AI Editor|Media Library|Templates|Team|Analytics|Exports|Brand Kit|Settings/i)
    await expect(page.getByRole('button', { name: /open wallet/i })).toHaveCount(0)
    await expect(page.getByTestId('edit-preferences-page')).toBeVisible()
    await expect(page.getByTestId('edit-preference-summary-strip')).toContainText('Product-ready')
    await expect(page.getByTestId('edit-preference-summary-strip')).toContainText('0')
    await expect(page.getByTestId('edit-preference-toolbar')).toContainText('providerCalls: false')
    await expect(page.getByTestId('edit-preference-toolbar')).toContainText('supabaseWrites: false')
    await expect(page.getByTestId('edit-preference-card-list')).toContainText('@lifestyle-travel-vlog')
    await expect(page.getByTestId('edit-preference-detail-panel')).toContainText('Do not copy')
    await expect(page.getByTestId('edit-preference-detail-panel')).toContainText('No fetch')
    await expect(page.getByText(/provider call made|worker created|render started|credit reserved|upload started/i)).toHaveCount(0)
    await expectNoHorizontalOverflow(page)
  })

  test('creates a browser-local draft without fetching media or starting runtime work', async ({ page }) => {
    await setViewport(page, 1280)
    await gotoRoute(page, '/edit-preferences')

    await expect(page.getByTestId('edit-preference-create-flow')).toBeVisible()
    await page.getByText('Reference label or URL text').click()
    await page.getByLabel('Preference name').fill('Warm founder lesson')
    await page.getByLabel('Tags').fill('founder, warm, lesson')
    await page.getByLabel('Direction').fill('Keep the speaker natural, use clean captions, and adapt reference pacing without copying any shots.')
    await page.getByRole('button', { name: /Save browser-local draft/i }).click()

    await expect(page.getByTestId('edit-preference-status-note')).toContainText('@warm-founder-lesson created in browser-local storage only')
    await expect(page.getByTestId('edit-preference-card-list')).toContainText('@warm-founder-lesson')
    await expect(page.getByTestId('edit-preference-detail-panel')).toContainText('Reference label/URL text was recorded without fetching the URL')
    await expect(page.getByTestId('edit-preference-detail-panel')).toContainText('Review before use')
    await expect(page.getByTestId('edit-preference-detail-panel')).toContainText('Qwen')
    await expect(page.getByTestId('edit-preference-detail-panel')).toContainText('Supabase persistence')
    await expectNoHorizontalOverflow(page)
  })
})
