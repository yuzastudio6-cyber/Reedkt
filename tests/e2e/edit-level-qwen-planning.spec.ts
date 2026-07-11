import { expect, test } from '@playwright/test'
import { openEditorEditLevelSetup } from './helpers/edit-level'
import { expectNoHorizontalOverflow, setViewport } from './helpers/layout'

test.describe('RP-EDITLEVEL-07 AI planning profile UI', () => {
  test.beforeEach(async ({ page }) => {
    await setViewport(page, 1440)
  })

  test('updates AI planning summaries by selected Edit Level without exposing model names', async ({ page }) => {
    await openEditorEditLevelSetup(page)

    await expect(page.getByTestId('edit-level-qwen-planning-summary')).toContainText(/Premium AI planning depth/i)
    await expect(page.getByTestId('edit-level-qwen-planning-summary')).toContainText(/deep creative reasoning/i)
    await expect(page.getByTestId('edit-level-qwen-planning-summary')).toContainText(/two pass/i)

    await page.getByTestId('edit-level-card-normal').click()
    await expect(page.getByTestId('edit-level-qwen-planning-summary')).toContainText(/Normal AI planning depth/i)
    await expect(page.getByTestId('edit-level-qwen-planning-summary')).toContainText(/standard reasoning/i)
    await expect(page.getByTestId('edit-level-qwen-planning-summary')).toContainText(/single pass/i)

    await page.getByTestId('edit-level-card-premium').click()
    await expect(page.getByTestId('edit-level-qwen-planning-summary')).toContainText(/Premium AI planning depth/i)
    await expect(page.getByTestId('edit-level-qwen-planning-summary')).toContainText(/deep creative reasoning/i)

    await page.getByTestId('edit-level-card-ultra_premium').click()
    await expect(page.getByTestId('edit-level-qwen-planning-summary')).toContainText(/Ultra Premium AI planning depth/i)
    await expect(page.getByTestId('edit-level-qwen-planning-summary')).toContainText(/studio multi-pass reasoning/i)
    await expect(page.getByTestId('edit-level-qwen-planning-summary')).toContainText(/studio multi pass/i)

    await page.getByTestId('edit-level-qwen-dimension-list').locator('summary').click()
    await expect(page.getByTestId('edit-level-qwen-dimension-list')).toContainText(/Future-gated/i)
    await expect(page.getByTestId('edit-level-qwen-dimension-list')).toContainText(/Visual summary usage/i)
    await expect(page.getByTestId('edit-level-qwen-fallback-notice')).toContainText(/no AI planning call/i)
    await expect(page.getByTestId('edit-level-qwen-usage-notice')).toContainText(/Estimate only/i)
    await expect(page.getByTestId('edit-level-qwen-usage-notice')).toContainText(/no credit reservation/i)
    await expect(page.getByTestId('edit-level-qwen-planning-summary')).not.toContainText(/Qwen|DeepSeek|backend required|external service required/i)
    await expect(page.getByTestId('edit-level-qwen-dimension-list')).not.toContainText(/Qwen|DeepSeek|backend required|external service required/i)
    await expect(page.getByTestId('edit-level-qwen-fallback-notice')).not.toContainText(/Qwen|DeepSeek|backend required|external service required/i)
    await expect(page.getByTestId('edit-level-qwen-usage-notice')).not.toContainText(/Qwen|DeepSeek|backend required|external service required/i)
    await expect(page.getByTestId('generation-progress-card')).toHaveCount(0)
    await expect(page.getByText(/credits used|credits deducted|spent credits|render started|export started/i)).toHaveCount(0)
    await expectNoHorizontalOverflow(page)
  })
})
