import { expect, test } from '@playwright/test'
import { expectNoHorizontalOverflow, setViewport } from './helpers/layout'

test.describe('Public website UI', () => {
  for (const width of [375, 720, 1024, 1280]) {
    test(`keeps the chat-first landing hierarchy clear at ${width}px`, async ({ page }) => {
      await setViewport(page, width)
      await page.goto('/')

      await expect(page.getByRole('heading', { level: 1, name: 'ChatGPT for video editing.' })).toBeVisible()
      await expect(page.getByLabel('ReeditPro chat editor preview')).toBeVisible()
      await expect(page.getByRole('link', { name: 'Start with chat' }).first()).toHaveAttribute('href', '/projects/new')
      await expect(page.locator('.marketing-product-demo .badge')).toHaveCount(0)
      await expect(page.locator('.marketing-signature-list article')).toHaveCount(3)

      const heroColumns = await page.locator('.marketing-hero').evaluate((element) => {
        const style = getComputedStyle(element)
        return {
          count: style.gridTemplateColumns.trim().split(/\s+/).length,
          display: style.display,
        }
      })
      expect(heroColumns.display).toBe('grid')
      expect(heroColumns.count).toBe(width === 1280 ? 2 : 1)

      const demo = page.locator('.marketing-product-demo')
      expect(await demo.evaluate((element) => getComputedStyle(element).overflow)).toBe('hidden')
      expect(await demo.evaluate((element) => getComputedStyle(element).borderTopWidth)).toBe('1px')

      const demoColumnCount = await page.locator('.marketing-demo-layout').evaluate(
        (element) => getComputedStyle(element).gridTemplateColumns.trim().split(/\s+/).length,
      )
      expect(demoColumnCount).toBe(width <= 720 ? 1 : 2)

      const trustColumnCount = await page.locator('.marketing-trust-rail').evaluate(
        (element) => getComputedStyle(element).gridTemplateColumns.trim().split(/\s+/).length,
      )
      expect(trustColumnCount).toBe(width <= 720 ? 1 : 3)

      if (width <= 720) {
        expect(await page.locator('.marketing-nav').evaluate((element) => getComputedStyle(element).flexDirection)).toBe('row')
        expect(await page.locator('.marketing-nav nav').evaluate((element) => getComputedStyle(element).order)).toBe('3')
      }

      await page.getByRole('link', { name: 'See how it works' }).click()
      await expect(page).toHaveURL(/#workflow$/)
      await expect(page.getByRole('heading', { name: /From raw clips to a review-ready edit/i })).toBeInViewport()
      await expectNoHorizontalOverflow(page)
    })
  }

  test('offers a quiet keyboard skip route into the landing content', async ({ page }) => {
    await page.goto('/')

    const skipLink = page.getByRole('link', { name: 'Skip to main content' })
    await expect(skipLink).toHaveAttribute('href', '#main-content')
    await expect(page.locator('main#main-content')).toHaveCount(1)

    await page.keyboard.press('Tab')
    await expect(skipLink).toBeFocused()
    await expect.poll(async () => (await skipLink.boundingBox())?.y ?? -1).toBeGreaterThanOrEqual(0)
  })

  test('stays operable in compact landscape with reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await setViewport(page, 844, 390)
    await page.goto('/')

    await expect(page.getByRole('heading', { level: 1, name: 'ChatGPT for video editing.' })).toBeVisible()
    expect(await page.locator('html').evaluate((element) => getComputedStyle(element).scrollBehavior)).toBe('auto')
    await expectNoHorizontalOverflow(page)

    await page.getByRole('link', { name: 'See how it works' }).click()
    await expect(page).toHaveURL(/#workflow$/)
    await expect(page.getByRole('heading', { name: /From raw clips to a review-ready edit/i })).toBeInViewport()
  })

  test('keeps sign-in calm, focused, and free of marketing badge noise', async ({ page }) => {
    await setViewport(page, 720)
    await page.goto('/sign-in')

    await expect(page.getByRole('heading', { level: 1, name: 'Pick up exactly where you left off.' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Continue to ReeditPro' })).toBeVisible()
    await expect(page.getByTestId('local-test-sign-in')).toBeVisible()
    await expect(page.locator('.auth-page .badge')).toHaveCount(0)
    expect(
      await page.locator('.auth-layout').evaluate((element) => getComputedStyle(element).gridTemplateColumns.trim().split(/\s+/).length),
    ).toBe(1)
    await expectNoHorizontalOverflow(page)
  })
})
