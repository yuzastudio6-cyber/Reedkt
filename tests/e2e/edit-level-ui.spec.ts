import { expect, test } from '@playwright/test'
import { openEditorEditLevelSetup } from './helpers/edit-level'
import { expectNoHorizontalOverflow, setViewport } from './helpers/layout'

test.describe('RP-EDITLEVEL-04 UI cards and recommendation', () => {
  test.beforeEach(async ({ page }) => {
    await setViewport(page, 1440)
  })

  test('shows selectable Edit Level cards inside the editor setup flow', async ({ page }) => {
    await openEditorEditLevelSetup(page)

    await expect(page.getByTestId('edit-level-recommendation-banner')).toContainText(/Recommended:/i)
    await expect(page.getByTestId('edit-level-card-normal')).toContainText(/Clean professional edit/i)
    await expect(page.getByTestId('edit-level-card-premium')).toContainText(/Enhanced creative edit/i)
    await expect(page.getByTestId('edit-level-card-ultra_premium')).toContainText(/Studio-level creative treatment/i)
    await expect(page.getByTestId('edit-level-credit-estimate-notice')).toContainText(/No credits reserved/i)
    await expect(page.getByTestId('edit-level-boundary-notice')).toContainText(/does not start AI preparation/i)
    await expect(page.getByTestId('edit-level-boundary-notice')).toContainText(/media processing, render\/export, or credit spend/i)
    await expect(page.getByTestId('edit-level-boundary-notice')).toContainText(/remain approval-gated/i)

    await page.getByTestId('edit-level-card-premium').click()
    await expect(page.getByTestId('edit-level-selected-summary')).toContainText(/Premium/i)
    await expect(page.getByTestId('edit-level-save-state')).toContainText(/saved|saving|mock edit level api\/client/i)

    await page.getByTestId('edit-level-card-ultra_premium').click()
    await expect(page.getByTestId('edit-level-selected-summary')).toContainText(/Ultra Premium/i)
    await expect(page.getByTestId('generation-progress-card')).toHaveCount(0)
    await expect(page.getByText(/credits used|credits deducted|spent credits/i)).toHaveCount(0)
    await expectNoHorizontalOverflow(page)
  })

  test('shows public Edit Level selection in the existing editor setup card', async ({ page }) => {
    await openEditorEditLevelSetup(page)

    await expect(page.getByTestId('edit-level-inline-card')).toContainText(/Normal/i)
    await expect(page.getByTestId('edit-level-inline-card')).toContainText(/Premium/i)
    await expect(page.getByTestId('edit-level-inline-card')).toContainText(/Ultra Premium/i)
    await expect(page.getByTestId('edit-level-save-state')).toContainText(/saved|saving|mock edit level api\/client/i)

    await page.getByTestId('edit-level-card-ultra_premium').click()
    await expect(page.getByTestId('edit-level-selected-summary')).toContainText(/Ultra Premium/i)
    await expect(page.getByTestId('edit-level-credit-estimate-notice')).toContainText(/No credits reserved/i)
    await expect(page.getByTestId('generation-progress-card')).toHaveCount(0)
    await expectNoHorizontalOverflow(page)
  })
})
