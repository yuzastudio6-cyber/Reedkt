import { expect, test } from '@playwright/test'
import { expectNoHorizontalOverflow, setViewport } from './helpers/layout'
import { clickWhenReady, gotoEditor } from './helpers/routes'

test.describe('RP-EDITLEVEL-04 UI cards and recommendation', () => {
  test.beforeEach(async ({ page }) => {
    await setViewport(page, 1440)
  })

  test('shows selectable Edit Level cards on the new project setup page', async ({ page }) => {
    await page.goto('/projects/new')

    await expect(page.getByTestId('project-edit-level-setup')).toBeVisible()
    await expect(page.getByTestId('edit-level-recommendation-banner')).toContainText(/Recommended:/i)
    await expect(page.getByTestId('edit-level-card-normal')).toContainText(/Clean professional edit/i)
    await expect(page.getByTestId('edit-level-card-premium')).toContainText(/Enhanced creative edit/i)
    await expect(page.getByTestId('edit-level-card-ultra_premium')).toContainText(/Studio-level creative treatment/i)
    await expect(page.getByTestId('edit-level-credit-estimate-notice')).toContainText(/No credits reserved/i)
    await expect(page.getByTestId('edit-level-boundary-notice')).toContainText(/does not call Qwen 3.7/i)

    await page.getByTestId('edit-level-card-premium').click()
    await expect(page.getByTestId('edit-level-selected-summary')).toContainText(/Premium/i)
    await expect(page.getByTestId('project-edit-level-save-state')).toContainText(/saved|saving|mock edit level api\/client/i)

    await page.getByTestId('edit-level-card-ultra_premium').click()
    await expect(page.getByTestId('edit-level-selected-summary')).toContainText(/Ultra Premium/i)
    await expect(page.getByTestId('generation-progress-card')).toHaveCount(0)
    await expect(page.getByText(/credits used|credits deducted|spent credits/i)).toHaveCount(0)
    await expectNoHorizontalOverflow(page)
  })

  test('shows public Edit Level selection in the existing editor setup card', async ({ page }) => {
    await gotoEditor(page)

    await clickWhenReady(page.getByRole('button', { name: /Confirm source order|Use this as the full source video/i }).first())
    await clickWhenReady(page.getByRole('button', { name: /Confirm output frame/i }).first())
    await clickWhenReady(page.getByRole('button', { name: /Confirm (Preserve natural|Light cleanup|Balanced cleanup|Tight retention|Aggressive|Documentary faithful|Tutorial complete|Custom)/i }).first())
    await page.getByTestId('edit-level-inline-card').scrollIntoViewIfNeeded()

    await expect(page.getByTestId('edit-level-inline-card')).toContainText(/Normal/i)
    await expect(page.getByTestId('edit-level-inline-card')).toContainText(/Premium/i)
    await expect(page.getByTestId('edit-level-inline-card')).toContainText(/Ultra Premium/i)
    await expect(page.getByTestId('edit-level-inline-card')).toContainText(/Selection saves through the mock Edit Level API\/client/i)

    await page.getByTestId('edit-level-card-ultra_premium').click()
    await expect(page.getByTestId('edit-level-selected-summary')).toContainText(/Ultra Premium/i)
    await expect(page.getByTestId('edit-level-credit-estimate-notice')).toContainText(/No credits reserved/i)
    await expect(page.getByTestId('generation-progress-card')).toHaveCount(0)
    await expectNoHorizontalOverflow(page)
  })
})
