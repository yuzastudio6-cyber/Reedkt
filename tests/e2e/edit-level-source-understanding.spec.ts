import { expect, test } from '@playwright/test'
import { openEditorEditLevelSetup } from './helpers/edit-level'
import { expectNoHorizontalOverflow, setViewport } from './helpers/layout'

test.describe('RP-EDITLEVEL-06 source understanding router UI', () => {
  test.beforeEach(async ({ page }) => {
    await setViewport(page, 1440)
  })

  test('updates source understanding summaries by selected Edit Level', async ({ page }) => {
    await openEditorEditLevelSetup(page)

    await expect(page.getByTestId('edit-level-source-understanding-summary')).toContainText(/Premium source understanding depth/i)
    await expect(page.getByTestId('edit-level-source-understanding-summary')).toContainText(/key moments \+ marker windows/i)
    await expect(page.getByTestId('edit-level-marker-context-policy')).toContainText(/10s before \/ 10s after/i)

    await page.getByTestId('edit-level-card-normal').click()
    await expect(page.getByTestId('edit-level-source-understanding-summary')).toContainText(/Normal source understanding depth/i)
    await expect(page.getByTestId('edit-level-source-understanding-summary')).toContainText(/metadata \+ targeted context/i)
    await expect(page.getByTestId('edit-level-marker-context-policy')).toContainText(/5s before \/ 5s after/i)

    await page.getByTestId('edit-level-card-premium').click()
    await expect(page.getByTestId('edit-level-source-understanding-summary')).toContainText(/Premium source understanding depth/i)
    await expect(page.getByTestId('edit-level-source-understanding-summary')).toContainText(/key moments \+ marker windows/i)

    await page.getByTestId('edit-level-card-ultra_premium').click()
    await expect(page.getByTestId('edit-level-source-understanding-summary')).toContainText(/Ultra Premium source understanding depth/i)
    await expect(page.getByTestId('edit-level-source-understanding-summary')).toContainText(/scene-level context/i)
    await expect(page.getByTestId('edit-level-marker-context-policy')).toContainText(/15s before \/ 15s after/i)

    await page.getByTestId('edit-level-source-layer-list').locator('summary').click()
    await expect(page.getByTestId('edit-level-source-layer-list')).toContainText(/Future-gated/i)
    await expect(page.getByTestId('edit-level-source-layer-list')).toContainText(/Visual understanding segments/i)
    await expect(page.getByTestId('edit-level-source-fallback-notice')).toContainText(/No AI planning/i)
    await expect(page.getByTestId('edit-level-source-understanding-summary')).not.toContainText(/Qwen|DeepSeek|backend required|external service required/i)
    await expect(page.getByTestId('edit-level-source-layer-list')).not.toContainText(/Qwen|DeepSeek|backend required|external service required/i)
    await expect(page.getByTestId('edit-level-source-fallback-notice')).not.toContainText(/Qwen|DeepSeek|backend required|external service required/i)
    await expect(page.getByTestId('generation-progress-card')).toHaveCount(0)
    await expect(page.getByText(/credits used|credits deducted|spent credits|render started|export started/i)).toHaveCount(0)
    await expectNoHorizontalOverflow(page)
  })
})
