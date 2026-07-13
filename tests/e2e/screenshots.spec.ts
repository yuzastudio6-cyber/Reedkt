import { expect, test, type Page } from '@playwright/test'
import { captureDocScreenshot } from './helpers/screenshots'
import { installActiveProductRouteFixture, missingNamedEditPath } from './helpers/active-product'
import { clickWhenReady, completeEditorSetup, completeRequiredEditorSetupBeforeFootagePrep, gotoEditor, gotoRoute, openMusicFlow, openSFXFlow, openTimeline, uploadEditorGateSourceVideo, uploadEditorSourceFile, viewportWidths } from './helpers/routes'
import { expectCardAttachedToAssistantMessage, expectCardWithinComposerRail, expectChatRhythmStable, expectLastContentReachableAboveComposer, expectMessageLabelsNotOvercrowded, expectNoExcessiveVerticalGaps, setViewport } from './helpers/layout'

const screenshotDir = 'docs/ui-ux-screenshots/active-product-redesign-2026-07-10'

// These screenshots are docs review artifacts, not pixel-diff snapshots.
test.describe('Active product redesign screenshot QA artifacts', () => {
  test('captures editor default viewport set', async ({ page }) => {
    for (const width of viewportWidths) {
      await setViewport(page, width)
      await gotoEditor(page)
      await page.getByTestId('source-sequence-card').scrollIntoViewIfNeeded()
      await expectCardWithinComposerRail(page, page.getByTestId('source-sequence-card'), 'source sequence card')
      await expectChatRhythmStable(page)
      await expectMessageLabelsNotOvercrowded(page)
      await expectNoExcessiveVerticalGaps(page)
      await captureDocScreenshot(page, `${screenshotDir}/editor-copy-source-${width}.png`)
    }
  })

  test('captures practical editor states at 1440px', async ({ page }) => {
    test.setTimeout(120_000)
    await setViewport(page, 1440)
    await gotoEditor(page)
    await expectChatRhythmStable(page)
    await expectCardAttachedToAssistantMessage(page)
    await captureDocScreenshot(page, `${screenshotDir}/editor-copy-default-1440.png`)

    await page.getByTestId('chat-composer-textarea').focus()
    await captureDocScreenshot(page, `${screenshotDir}/editor-copy-composer-focus-1440.png`)

    await page.getByTestId('source-sequence-card').scrollIntoViewIfNeeded()
    await expectCardWithinComposerRail(page, page.getByTestId('source-sequence-card'), 'source sequence card')
    await expectLastContentReachableAboveComposer(page, page.getByTestId('source-sequence-card').getByRole('button', { name: /Add clip|Add mock clip/i }), 'source add clip action')
    await captureDocScreenshot(page, `${screenshotDir}/editor-copy-source-1440.png`)
    await clickAndCaptureUtility(page)

    await gotoEditor(page)
    await uploadEditorSourceFile(page, 'screenshot-reference-source.mp4')
    await completeRequiredEditorSetupBeforeFootagePrep(page)
    await page.getByTestId('reference-card').scrollIntoViewIfNeeded()
    await expectCardWithinComposerRail(page, page.getByTestId('reference-card'), 'reference card')
    await expectChatRhythmStable(page)
    await expectCardAttachedToAssistantMessage(page)
    await captureDocScreenshot(page, `${screenshotDir}/editor-copy-reference-1440.png`)

    await completeEditorSetup(page)
    await page.getByTestId('plan-review-card').scrollIntoViewIfNeeded()
    await expectCardWithinComposerRail(page, page.getByTestId('plan-review-card'), 'plan review card')
    await expectLastContentReachableAboveComposer(page, page.getByTestId('plan-review-approve'), 'plan review approve action')
    await captureDocScreenshot(page, `${screenshotDir}/editor-copy-plan-review-1440.png`)

    await clickWhenReady(page.getByTestId('plan-review-approve'))
    await expect(page.getByTestId('generation-progress-card')).toBeVisible()
    // The local private-review path can complete quickly. Capture immediately so the
    // transient progress state remains a truthful review artifact instead of duplicating
    // the ready-state screenshot.
    await captureDocScreenshot(page, `${screenshotDir}/editor-copy-progress-1440.png`, {
      movePointer: false,
      settleMs: 0,
    })
    await expect(page.getByTestId('preview-ready-card')).toBeVisible({ timeout: 8_000 })
    await captureDocScreenshot(page, `${screenshotDir}/editor-copy-preview-ready-1440.png`)

    await openTimeline(page)
    await captureDocScreenshot(page, `${screenshotDir}/editor-copy-timeline-1440.png`)

    await completeEditorSetup(page, '/editor?qaApprovalFailure=1')
    await clickWhenReady(page.getByTestId('plan-review-approve'))
    await expect(page.getByTestId('approval-error-message')).toBeVisible()
    await captureDocScreenshot(page, `${screenshotDir}/editor-copy-error-1440.png`)
  })

  test('captures expanded soundflow states at 1440px', async ({ page }) => {
    await setViewport(page, 1440)
    await completeEditorSetup(page)
    await openSFXFlow(page)
    await expectChatRhythmStable(page)
    await expectCardAttachedToAssistantMessage(page)
    await captureDocScreenshot(page, `${screenshotDir}/editor-copy-sfx-1440.png`)

    await completeEditorSetup(page)
    await openMusicFlow(page)
    await expectChatRhythmStable(page)
    await expectCardAttachedToAssistantMessage(page)
    await captureDocScreenshot(page, `${screenshotDir}/editor-copy-music-1440.png`)
  })

  test('captures selected non-editor routes at 1280px', async ({ page }) => {
    await setViewport(page, 1280)

    await page.goto('/')
    await expect(page.getByRole('heading', { name: /ChatGPT for video editing/i })).toBeVisible()
    await captureDocScreenshot(page, `${screenshotDir}/landing-1280.png`)

    for (const width of [1024, 720]) {
      await setViewport(page, width)
      await page.goto('/')
      await expect(page.getByRole('heading', { name: /ChatGPT for video editing/i })).toBeVisible()
      await captureDocScreenshot(page, `${screenshotDir}/landing-${width}.png`)
    }

    await setViewport(page, 1280)

    await page.goto('/sign-in')
    await expect(page.locator('.auth-entry-card').first()).toBeVisible()
    await expect(page.locator('.auth-entry-brand')).toBeVisible()
    await captureDocScreenshot(page, `${screenshotDir}/sign-in-1280.png`)

    const appRoutes = [
      { path: '/dashboard', screenshotName: 'home' },
      { path: '/projects', screenshotName: 'projects' },
      { path: '/projects/new', screenshotName: 'create-project' },
      { path: '/preferences', screenshotName: 'preferences' },
    ] as const

    for (const route of appRoutes) {
      await gotoRoute(page, route.path)
      await expect(page.locator('body')).toBeVisible()
      await captureDocScreenshot(page, `${screenshotDir}/${route.screenshotName}-1280.png`)
    }

    await installActiveProductRouteFixture(page, 'home-returning')
    await gotoRoute(page, '/dashboard')
    await expect(page.getByTestId('testing-home-latest-edit')).toBeVisible()
    await captureDocScreenshot(page, `${screenshotDir}/home-returning-1280.png`)

    await gotoRoute(page, '/projects')
    await expect(page.locator('.projects-card')).toHaveCount(1)
    await captureDocScreenshot(page, `${screenshotDir}/projects-populated-1280.png`)
  })

  test('captures the Create Project to named-edit handoff at 1280px', async ({ page }) => {
    await setViewport(page, 1280)
    await gotoRoute(page, '/projects/new')
    await page.getByLabel('Project name').fill('Summer launch campaign')
    await clickWhenReady(page.getByRole('button', { name: /^Create project$/i }))
    await expect(page.getByRole('heading', { level: 1, name: 'Summer launch campaign' })).toBeVisible()
    await clickWhenReady(page.getByRole('button', { name: /^New edit$/i }).first())
    await expect(page.getByRole('dialog', { name: 'Name this edit' })).toBeVisible()
    await captureDocScreenshot(page, `${screenshotDir}/project-new-edit-dialog-1280.png`)
  })

  test('captures active project and named-edit route states at 1280px', async ({ page }) => {
    const fixture = await installActiveProductRouteFixture(page, 'screenshots')
    await setViewport(page, 1280)

    await gotoRoute(page, fixture.projectPath)
    await expect(page.getByRole('heading', { level: 1, name: fixture.project.name })).toBeVisible()
    await expect(page.getByTestId('project-edit-list')).toContainText(fixture.edit.editName ?? '')
    await captureDocScreenshot(page, `${screenshotDir}/project-detail-1280.png`)

    await gotoRoute(page, fixture.editPath)
    await expect(page.getByTestId('edit-upload-gate')).toBeVisible()
    await expect(page.getByTestId('editor-header')).toContainText(fixture.edit.editName ?? '')
    await captureDocScreenshot(page, `${screenshotDir}/named-edit-upload-gate-1280.png`)

    await uploadEditorGateSourceVideo(page, 'named-edit-screenshot-source.mp4')
    await expect(page.getByTestId('edit-preview-rail')).toBeVisible()
    await captureDocScreenshot(page, `${screenshotDir}/named-edit-chat-ready-1280.png`)

    await completeRequiredEditorSetupBeforeFootagePrep(page)
    await clickWhenReady(page.getByRole('button', { name: /Prepare source/i }).first())
    await clickWhenReady(page.getByTestId('editor-header-edit-brief'))
    await expect(page.getByTestId('edit-brief-panel')).toBeVisible()
    await captureDocScreenshot(page, `${screenshotDir}/named-edit-brief-1280.png`)

    await clickWhenReady(page.getByTestId('current-edit-preferences-trigger'))
    await expect(page.getByTestId('current-edit-preferences-form')).toBeVisible()
    await captureDocScreenshot(page, `${screenshotDir}/named-edit-preferences-1280.png`)
    await clickWhenReady(page.getByTestId('edit-workspace-view-chat'))

    await clickWhenReady(page.getByRole('button', { name: /Create edit plan/i }).first())
    await expect(page.getByTestId('plan-review-card')).toBeInViewport()
    await captureDocScreenshot(page, `${screenshotDir}/named-edit-plan-review-1280.png`)

    await clickWhenReady(page.getByTestId('plan-review-approve'))
    const privateReview = page.getByTestId('private-review')
    await expect(privateReview).toBeVisible({ timeout: 8_000 })
    await page.getByTestId('chat-thread').evaluate((thread) => {
      const review = thread.querySelector<HTMLElement>('[data-testid="private-review"]')
      if (!review) return
      const threadBox = thread.getBoundingClientRect()
      const reviewBox = review.getBoundingClientRect()
      thread.scrollTop += reviewBox.top - threadBox.top - 16
    })
    await page.evaluate(() => window.scrollTo(0, 0))
    await captureDocScreenshot(page, `${screenshotDir}/named-edit-private-review-1280.png`)

    await gotoRoute(page, missingNamedEditPath('screenshots'))
    await expect(page.getByTestId('named-edit-route-not-found')).toBeVisible()
    await captureDocScreenshot(page, `${screenshotDir}/named-edit-recovery-error-1280.png`)
  })
})

async function clickAndCaptureUtility(page: Page) {
  // Internal scenario controls are intentionally hidden from the default editor.
  await gotoEditor(page, '/editor?demo=1')
  await clickWhenReady(page.getByTestId('editor-utility-strip').getByRole('button', { name: /Scenario library/i }))
  await expect(page.getByTestId('editor-utility-panel')).toBeVisible()
  await captureDocScreenshot(page, `${screenshotDir}/editor-copy-utility-expanded-1440.png`)
}
