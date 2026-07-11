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
    await expect(page.getByText('QA not run').first()).toBeVisible()
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

  test('saves evidence, studies it truthfully, and restores findings after reload', async ({ page }) => {
    const referenceName = `Evidence study ${Date.now()}`
    await gotoRoute(page, '/preferences')
    await page.getByTestId('new-edit-reference').click()
    await page.getByTestId('edit-reference-name').fill(referenceName)
    await page.getByTestId('edit-reference-description').fill('Preserve restrained editorial judgment without copying reference-specific details.')
    await page.getByTestId('save-edit-reference').click()

    await page.getByTestId('add-edit-reference-evidence').click()
    await expect(page.getByTestId('edit-reference-evidence-form')).toBeVisible()
    await page.getByTestId('edit-reference-evidence-title').fill('Measured documentary direction')
    await page.getByTestId('edit-reference-evidence-summary').fill('Use measured pacing, clear evidence cards, readable captions, and original compositions. Never copy a logo, exact layout, or creator identity.')
    await page.getByTestId('save-edit-reference-evidence').click()

    await expect(page.getByTestId('edit-reference-evidence-list')).toContainText('Measured documentary direction')
    await expect(page.getByText('Study the saved evidence', { exact: true })).toBeVisible()
    await page.getByTestId('run-edit-reference-evidence-study').click()

    await expect(page.getByTestId('edit-reference-study-findings')).toContainText('Latest study findings')
    await expect(page.getByTestId('edit-reference-study-findings')).toContainText('Saved evidence is framed as transferable editing judgment')
    await expect(page.getByText('evidence ready').first()).toBeVisible()
    await expect(page.getByText('DNA not generated yet')).toBeVisible()
    await expect(page.getByText('QA not run').first()).toBeVisible()
    await expect(page.getByTestId('edit-reference-dna-action')).toContainText('Evidence is ready for Preference DNA')
    await page.getByTestId('generate-edit-reference-dna').click()
    await expect(page.getByTestId('edit-reference-dna-review')).toContainText('Preference DNA version 1')
    await expect(page.getByTestId('edit-reference-dna-review')).toContainText('evidence-linked rules')
    await expect(page.getByTestId('edit-reference-dna-review')).toContainText('Do-not-copy Rules')
    await expect(page.getByText('Version 1 · review required')).toBeVisible()
    await expect(page.getByText('QA not run').first()).toBeVisible()

    await page.reload()
    await expect(page.getByRole('heading', { name: `${referenceName} study` })).toBeVisible()
    await expect(page.getByTestId('edit-reference-evidence-list')).toContainText('Measured documentary direction')
    await expect(page.getByTestId('edit-reference-study-findings')).toContainText('Latest study findings')
    await expect(page.getByText('Transferability checked')).toBeVisible()
    await expect(page.getByTestId('edit-reference-dna-review')).toContainText('Preference DNA version 1')
    await expect(page.getByText('Review Preference DNA')).toBeVisible()

    await page.getByTestId('add-edit-reference-evidence').click()
    await page.getByTestId('edit-reference-evidence-title').fill('Measured documentary direction v2')
    await page.getByTestId('edit-reference-evidence-summary').fill('Use a more deliberate pace, original evidence compositions, and readable labels designed for the target edit.')
    await page.getByTestId('edit-reference-evidence-correction').selectOption({ label: 'Measured documentary direction' })
    await page.getByTestId('save-edit-reference-evidence').click()
    await expect(page.getByTestId('edit-reference-dna-review')).toHaveCount(0)
    await expect(page.getByText('Version 1 · superseded')).toBeVisible()
    await page.getByTestId('run-edit-reference-evidence-study').click()
    await expect(page.getByTestId('edit-reference-dna-action')).toBeVisible()
    await page.getByTestId('generate-edit-reference-dna').click()
    await expect(page.getByTestId('edit-reference-dna-review')).toContainText('Preference DNA version 2')

    await page.reload()
    await expect(page.getByTestId('edit-reference-dna-review')).toContainText('Preference DNA version 2')
    await expect(page.getByText('Version 2 · review required')).toBeVisible()
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
