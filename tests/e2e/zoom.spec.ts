import { expect, test } from '@playwright/test'
import { installActiveProductRouteFixture } from './helpers/active-product'
import { applyChromiumPageScale, expectCardAttachedToAssistantMessage, expectChatCardsFitUnderComposer, expectChatRhythmStable, expectComposerFadeLayer, expectCompactComposerSurface, expectFloatingComposerAligned, expectNoCardHorizontalOverflow, expectNoExcessiveVerticalGaps, expectNoHorizontalOverflow, setViewport } from './helpers/layout'
import { captureDocScreenshot } from './helpers/screenshots'
import { gotoEditor, gotoRoute } from './helpers/routes'

const screenshotDir = 'docs/ui-ux-screenshots/active-product-redesign-2026-07-10'

test.describe('practical 125 percent zoom QA', () => {
  test('uses 1024px as a 1280-at-125-percent layout proxy', async ({ page }) => {
    await setViewport(page, 1024)
    await gotoEditor(page)
    await expectNoHorizontalOverflow(page)
    await expectComposerFadeLayer(page)
    await expectFloatingComposerAligned(page)
    await expectCompactComposerSurface(page)
    await expectChatCardsFitUnderComposer(page)
    await expectChatRhythmStable(page)
    await expectCardAttachedToAssistantMessage(page)
    await expectNoExcessiveVerticalGaps(page)
    await expectNoCardHorizontalOverflow(page)
    await captureDocScreenshot(page, `${screenshotDir}/editor-zoom-125.png`)
  })

  test('attempts Chromium page scale at 125 percent without requiring support', async ({ page }) => {
    // Page-scale support is useful for regression coverage, but it should not be sold as perfect zoom parity.
    await setViewport(page, 1280)
    await gotoEditor(page)

    const pageScaleApplied = await applyChromiumPageScale(page, 1.25)
    test.info().annotations.push({
      type: 'zoom-method',
      description: pageScaleApplied
        ? 'Chromium Emulation.setPageScaleFactor applied at 1.25.'
        : 'Chromium page scale was unavailable; 1024px proxy remains the layout zoom check.',
    })

    await expectNoHorizontalOverflow(page)
    await expectComposerFadeLayer(page)
    await expectFloatingComposerAligned(page)
    await expectCompactComposerSurface(page)
    await expectChatCardsFitUnderComposer(page)
    await expectChatRhythmStable(page)
    await expectCardAttachedToAssistantMessage(page)
    await expectNoExcessiveVerticalGaps(page)
    await expectNoCardHorizontalOverflow(page)

    if (pageScaleApplied) {
      await captureDocScreenshot(page, `${screenshotDir}/editor-page-scale-125.png`)
    }
  })

  test('keeps the active named-edit upload gate safe at the 1024px zoom proxy', async ({ page }) => {
    const fixture = await installActiveProductRouteFixture(page, 'zoom-125')
    await setViewport(page, 1024)
    await gotoRoute(page, fixture.editPath)

    await expect(page.getByTestId('edit-upload-gate')).toBeVisible()
    await expect(page.getByTestId('editor-header')).toContainText(fixture.edit.editName ?? '')
    await expectNoHorizontalOverflow(page)
    await captureDocScreenshot(page, `${screenshotDir}/named-edit-upload-gate-zoom-125.png`)
  })
})
