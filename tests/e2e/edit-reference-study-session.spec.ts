import { expect, test } from '@playwright/test'
import { gotoRoute } from './helpers/routes'
import { expectNoHorizontalOverflow, setViewport } from './helpers/layout'

test.describe('Edit Reference durable study session', () => {
  test('creates, chats, reloads, and keeps future gates truthful', async ({ page }) => {
    const referenceName = `Evidence-first documentary ${Date.now()}`
    await gotoRoute(page, '/preferences')

    await expect(page.getByTestId('edit-preference-tab-edit-references')).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByTestId('edit-preferences-sidebar-link')).toContainText('Edit Preferences')
    await expect(page.getByTestId('edit-preferences-page')).not.toContainText(/Gate 1|backend-local|No model calls|Supabase|localStorage|provider payload/i)

    await page.getByTestId('new-edit-reference').click()
    await page.getByTestId('edit-reference-name').fill(referenceName)
    await page.getByTestId('edit-reference-description').fill('Learn evidence-first pacing and restrained maps. Never copy exact layouts, marks, fonts, or publisher identity.')
    await page.getByTestId('save-edit-reference').click()

    await expect(page.getByRole('heading', { name: `${referenceName} study` })).toBeVisible()
    await expect(page.getByText('Study evidence not complete')).toBeVisible()
    await expect(page.getByText('DNA not generated yet')).toBeVisible()
    await expect(page.getByText('QA not run')).toBeVisible()
    await expect(page.getByText('Study setup').first()).toBeVisible()

    const direction = 'Keep location and evidence legible. Use tension through pacing, not through copying branded compositions.'
    await page.getByTestId('edit-reference-study-message').fill(direction)
    await page.getByTestId('send-edit-reference-study-message').click()
    await expect(page.getByText(direction)).toBeVisible()
    await expect(page.getByText(/Add reference evidence when you are ready/)).toBeVisible()

    await page.reload()
    await expect(page.getByRole('heading', { name: `${referenceName} study` })).toBeVisible()
    await expect(page.getByText(direction)).toBeVisible()
    await expect(page.getByText('DNA not generated yet')).toBeVisible()

    await page.getByTestId('edit-preference-tab-applied-edits').click()
    await expect(page.getByTestId('applied-edits-panel')).toContainText('0 applications')
    await page.getByTestId('edit-preference-tab-safety-privacy').click()
    await expect(page.getByTestId('safety-privacy-panel')).toContainText('Creating or discussing a reference never starts production')
    await expect(page.getByTestId('safety-privacy-panel')).toContainText('never copied blindly')
  })

  test('preserves legacy defaults under the secondary workspace tab', async ({ page }) => {
    await gotoRoute(page, '/edit-preferences')
    await page.getByTestId('edit-preference-tab-workspace-defaults').click()
    await expect(page.getByTestId('workspace-defaults-panel')).toBeVisible()
    await expect(page.getByTestId('workspace-defaults-legacy-page')).toBeVisible()
    await expect(page.getByTestId('new-edit-preference-button')).toBeVisible()
  })

  test('keeps the study workspace usable at the compact desktop breakpoint', async ({ page }) => {
    await setViewport(page, 780, 900)
    await gotoRoute(page, '/preferences')
    await expect(page.getByTestId('edit-preference-tab-edit-references')).toBeVisible()
    await expect(page.getByTestId('new-edit-reference')).toBeVisible()
    await expectNoHorizontalOverflow(page)
  })

  test('keeps navigation, focus, and controls accessible on a 375px viewport', async ({ page }) => {
    await setViewport(page, 375, 812)
    await gotoRoute(page, '/preferences')
    await expectNoHorizontalOverflow(page)

    const skipLink = page.getByTestId('skip-to-main-content')
    await skipLink.focus()
    await expect(skipLink).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.locator('#app-main-content')).toBeFocused()

    const firstTab = page.getByTestId('edit-preference-tab-edit-references')
    await firstTab.focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('edit-preference-tab-workspace-defaults')).toBeFocused()
    await expect(page.getByTestId('edit-preference-tab-workspace-defaults')).toHaveAttribute('aria-selected', 'true')

    await page.getByTestId('edit-preference-tab-edit-references').click()
    const targetHeights = await Promise.all([
      page.getByTestId('edit-preference-tab-edit-references').evaluate((element) => element.getBoundingClientRect().height),
      page.getByTestId('new-edit-reference').evaluate((element) => element.getBoundingClientRect().height),
      page.getByRole('button', { name: 'Reload Edit References' }).evaluate((element) => element.getBoundingClientRect().height),
    ])
    expect(targetHeights.every((height) => height >= 44)).toBe(true)
  })
})
