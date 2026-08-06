import { expect, test } from '@playwright/test'
import { gotoEditor } from './helpers/routes'
import { expectNoHorizontalOverflow, setViewport } from './helpers/layout'

test.describe('internal capability policy', () => {
  test.beforeEach(async ({ page }) => {
    await setViewport(page, 1440)
  })

  test('does not expose an Edit Level selector during internal testing', async ({ page }) => {
    await gotoEditor(page)

    await expect(page.getByTestId('edit-level-inline-card')).toHaveCount(0)
    await expect(page.getByTestId('edit-level-recommendation-banner')).toHaveCount(0)
    await expect(page.getByTestId('edit-level-card-normal')).toHaveCount(0)
    await expect(page.getByTestId('edit-level-card-premium')).toHaveCount(0)
    await expect(page.getByTestId('edit-level-card-ultra_premium')).toHaveCount(0)
    await expect(page.getByRole('button', {
      name: /Use (Normal|Premium|Ultra Premium)|Use this level/i,
    })).toHaveCount(0)
    await expect(page.getByText(/Choose (an )?Edit Level/i)).toHaveCount(0)
    await expectNoHorizontalOverflow(page)
  })
})
