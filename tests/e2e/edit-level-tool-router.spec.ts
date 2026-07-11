import { expect, test } from '@playwright/test'
import { openEditorEditLevelSetup } from './helpers/edit-level'
import { expectNoHorizontalOverflow, setViewport } from './helpers/layout'

test.describe('RP-EDITLEVEL-05 tool capability router UI', () => {
  test.beforeEach(async ({ page }) => {
    await setViewport(page, 1440)
  })

  test('updates tool capability summaries by selected Edit Level', async ({ page }) => {
    await openEditorEditLevelSetup(page)

    await expect(page.getByTestId('edit-level-tool-capability-summary')).toContainText(/Premium capability plan/i)
    await expect(page.getByTestId('edit-level-tool-capability-summary')).toContainText(/Future-gated/i)
    await expect(page.getByTestId('edit-level-tool-fallback-notice')).toContainText(/Fallbacks/i)

    await page.getByTestId('edit-level-card-normal').click()
    await expect(page.getByTestId('edit-level-tool-capability-summary')).toContainText(/Normal capability plan/i)
    await expect(page.getByTestId('edit-level-tool-capability-summary')).toContainText(/Standard reasoning/i)

    await page.getByTestId('edit-level-card-premium').click()
    await expect(page.getByTestId('edit-level-tool-capability-summary')).toContainText(/Premium capability plan/i)
    await expect(page.getByTestId('edit-level-tool-capability-summary')).toContainText(/Key moments/i)

    await page.getByTestId('edit-level-card-ultra_premium').click()
    await expect(page.getByTestId('edit-level-tool-capability-summary')).toContainText(/Ultra Premium capability plan/i)
    await expect(page.getByTestId('edit-level-tool-capability-summary')).toContainText(/Scene-level visual understanding/i)

    await page.getByTestId('edit-level-tool-capability-list').locator('summary').click()
    await expect(page.getByTestId('edit-level-tool-capability-list')).toContainText(/Future-gated/i)
    await expect(page.getByTestId('edit-level-tool-capability-list')).toContainText(/Render approved processing steps/i)
    await expect(page.getByTestId('edit-level-tool-capability-list')).not.toContainText(/Render worker/i)
    await expect(page.getByTestId('edit-level-tool-capability-list')).toContainText(/Credit gate/i)
    await expect(page.getByTestId('edit-level-credit-estimate-notice')).toContainText(/No credits reserved/i)
    await expect(page.getByTestId('generation-progress-card')).toHaveCount(0)
    await expect(page.getByText(/credits used|credits deducted|spent credits|render started|export started/i)).toHaveCount(0)
    await expectNoHorizontalOverflow(page)
  })
})
