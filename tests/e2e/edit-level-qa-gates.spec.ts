import { expect, test } from '@playwright/test'
import { openEditorEditLevelSetup } from './helpers/edit-level'
import { expectNoHorizontalOverflow, setViewport } from './helpers/layout'

test.describe('RP-EDITLEVEL-08 QA gate UI', () => {
  test.beforeEach(async ({ page }) => {
    await setViewport(page, 1440)
  })

  test('updates QA gate summaries by selected Edit Level', async ({ page }) => {
    await openEditorEditLevelSetup(page)

    await expect(page.getByTestId('edit-level-qa-gate-summary')).toContainText(/Premium QA policy/i)
    await expect(page.getByTestId('edit-level-qa-gate-summary')).toContainText(/stronger creative QA/i)
    await expect(page.getByTestId('edit-level-qa-readiness-card')).toContainText(/ready with warnings/i)

    await page.getByTestId('edit-level-card-normal').click()
    await expect(page.getByTestId('edit-level-qa-gate-summary')).toContainText(/Normal QA policy/i)
    await expect(page.getByTestId('edit-level-qa-gate-summary')).toContainText(/baseline QA/i)
    await expect(page.getByTestId('edit-level-qa-readiness-card')).toContainText(/ready for mock planning/i)

    await page.getByTestId('edit-level-card-premium').click()
    await expect(page.getByTestId('edit-level-qa-gate-summary')).toContainText(/Premium QA policy/i)
    await expect(page.getByTestId('edit-level-qa-gate-summary')).toContainText(/stronger creative QA/i)

    await page.getByTestId('edit-level-card-ultra_premium').click()
    await expect(page.getByTestId('edit-level-qa-gate-summary')).toContainText(/Ultra Premium QA policy/i)
    await expect(page.getByTestId('edit-level-qa-gate-summary')).toContainText(/studio-level strict QA/i)
    await expect(page.getByTestId('edit-level-qa-readiness-card')).toContainText(/blocked by future runtime gate/i)

    await page.getByTestId('edit-level-qa-gate-list').locator('summary').click()
    await expect(page.getByTestId('edit-level-qa-gate-list')).toContainText(/Future render \/ revision \/ credit/i)
    await expect(page.getByTestId('edit-level-qa-gate-list')).toContainText(/Render readiness future/i)
    await expect(page.getByTestId('edit-level-qa-gate-list')).toContainText(/Credit gate future/i)
    await expect(page.getByTestId('edit-level-qa-fallback-notice')).toContainText(/Premium-safe QA/i)
    await expect(page.getByTestId('edit-level-qa-fallback-notice')).toContainText(/No AI planning/i)
    await expect(page.getByTestId('edit-level-qa-gate-summary')).not.toContainText(/Qwen|DeepSeek|backend required|external service required/i)
    await expect(page.getByTestId('edit-level-qa-readiness-card')).not.toContainText(/Qwen|DeepSeek|backend required|external service required/i)
    await expect(page.getByTestId('edit-level-qa-gate-list')).not.toContainText(/Qwen|DeepSeek|backend required|external service required/i)
    await expect(page.getByTestId('edit-level-qa-fallback-notice')).not.toContainText(/Qwen|DeepSeek|backend required|external service required/i)
    await expect(page.getByTestId('generation-progress-card')).toHaveCount(0)
    await expect(page.getByText(/credits deducted|spent credits|render started|export started|generation progress/i)).toHaveCount(0)
    await expectNoHorizontalOverflow(page)
  })
})
