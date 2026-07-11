import { expect, test } from '@playwright/test'
import { expectNoHorizontalOverflow, setViewport } from './helpers/layout'

test.describe('Public website UI', () => {
  for (const width of [720, 1024, 1280]) {
    test(`keeps the chat-first landing hierarchy clear at ${width}px`, async ({ page }) => {
      await setViewport(page, width)
      await page.goto('/')

      await expect(page.getByRole('heading', { level: 1, name: 'ChatGPT for video editing.' })).toBeVisible()
      await expect(page.getByLabel('ReeditPro chat editor preview')).toBeVisible()
      await expect(page.getByRole('link', { name: 'Start with chat' }).first()).toHaveAttribute('href', '/projects/new')
      await expect(page.locator('.marketing-product-demo .badge')).toHaveCount(0)
      await expect(page.locator('.marketing-signature-list article')).toHaveCount(3)

      await page.getByRole('link', { name: 'See how it works' }).click()
      await expect(page).toHaveURL(/#workflow$/)
      await expect(page.getByRole('heading', { name: /From raw clips to a review-ready edit/i })).toBeInViewport()
      await expectNoHorizontalOverflow(page)
    })
  }

  test('keeps sign-in calm, focused, and free of marketing badge noise', async ({ page }) => {
    await setViewport(page, 720)
    await page.goto('/sign-in')

    await expect(page.getByRole('heading', { level: 1, name: 'Pick up exactly where you left off.' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Continue to ReeditPro' })).toBeVisible()
    await expect(page.getByTestId('local-test-sign-in')).toBeVisible()
    await expect(page.locator('.auth-page .badge')).toHaveCount(0)
    await expectNoHorizontalOverflow(page)
  })
})
