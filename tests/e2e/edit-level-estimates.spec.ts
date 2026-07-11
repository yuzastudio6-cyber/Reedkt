import { expect, test } from '@playwright/test'
import { openEditorEditLevelSetup } from './helpers/edit-level'
import { expectNoHorizontalOverflow, setViewport } from './helpers/layout'

test.describe('RP-EDITLEVEL-09 estimate policy UI', () => {
  test.beforeEach(async ({ page }) => {
    await setViewport(page, 1440)
  })

  test('updates estimate summaries by selected Edit Level', async ({ page }) => {
    await openEditorEditLevelSetup(page)

    await expect(page.getByTestId('edit-level-estimate-summary')).toContainText(/Premium estimate policy/i)
    await expect(page.getByTestId('edit-level-estimate-summary')).toContainText(/45-90 minutes/i)
    await expect(page.getByTestId('edit-level-estimate-summary')).toContainText(/2\.0x/i)
    await expect(page.getByTestId('edit-level-credit-estimate-notice')).toContainText(/No credits reserved/i)
    await expect(page.getByTestId('edit-level-estimate-boundary-notice')).toContainText(/Estimate only - no credits are reserved and no render starts/i)

    await page.getByTestId('edit-level-card-normal').click()
    await expect(page.getByTestId('edit-level-estimate-summary')).toContainText(/Normal estimate policy/i)
    await expect(page.getByTestId('edit-level-estimate-summary')).toContainText(/20-45 minutes/i)
    await expect(page.getByTestId('edit-level-estimate-summary')).toContainText(/1\.0x/i)

    await page.getByTestId('edit-level-card-premium').click()
    await expect(page.getByTestId('edit-level-estimate-summary')).toContainText(/Premium estimate policy/i)
    await expect(page.getByTestId('edit-level-estimate-summary')).toContainText(/45-90 minutes/i)

    await page.getByTestId('edit-level-card-ultra_premium').click()
    await expect(page.getByTestId('edit-level-estimate-summary')).toContainText(/Ultra Premium estimate policy/i)
    await expect(page.getByTestId('edit-level-estimate-summary')).toContainText(/90-180 minutes/i)
    await expect(page.getByTestId('edit-level-estimate-summary')).toContainText(/4\.0x/i)
    await expect(page.getByTestId('edit-level-render-budget-notice')).toContainText(/Render passes future: 3/i)
    await expect(page.getByTestId('edit-level-revision-budget-notice')).toContainText(/Revision budget future: 3/i)

    await page.getByTestId('edit-level-estimate-item-list').locator('summary').click()
    await expect(page.getByTestId('edit-level-estimate-item-list')).toContainText(/Future-gated budget/i)
    await expect(page.getByTestId('edit-level-estimate-item-list')).toContainText(/Needs product value/i)
    await expect(page.getByTestId('edit-level-estimate-item-list')).toContainText(/Degraded capability/i)
    await expect(page.getByTestId('edit-level-estimate-boundary-notice')).toContainText(/no credits are reserved/i)
    await expect(page.getByTestId('edit-level-estimate-boundary-notice')).toContainText(/no render starts/i)
    await expect(page.getByTestId('generation-progress-card')).toHaveCount(0)
    await expect(page.getByText(/credits deducted|spent credits|render started|export started|generation progress/i)).toHaveCount(0)
    await expectNoHorizontalOverflow(page)
  })
})
