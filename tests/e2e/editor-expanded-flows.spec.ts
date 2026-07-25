import { expect, test } from '@playwright/test'
import { expectCardAttachedToAssistantMessage, expectChatCardsFitUnderComposer, expectChatRhythmStable, expectComposerFadeLayer, expectCompactComposerSurface, expectFloatingComposerAligned, expectLastContentReachableAboveComposer, expectMessageLabelsNotOvercrowded, expectNoCardHorizontalOverflow, expectNoExcessiveVerticalGaps, expectNoHorizontalOverflow, setViewport } from './helpers/layout'
import {
  clickWhenReady,
  createPlanFromUploadedEditorSources,
  completeEditorSetup,
  expandVisibleEditorDetailsAndExpectNoInternalToolNames,
  expectNoInternalToolNamesInEditor,
  gotoEditor,
  uploadEditorSourceFile,
} from './helpers/routes'

test.describe('editor expanded flow QA', () => {
  test.beforeEach(async ({ page }) => {
    await setViewport(page, 1440)
  })

  test('expands editor detail cards without taking over the layout', async ({ page }) => {
    await completeEditorSetup(page)

    await expandVisibleEditorDetailsAndExpectNoInternalToolNames(page)
    await expectNoHorizontalOverflow(page)
    await page.getByTestId('editor-chat-canvas').scrollIntoViewIfNeeded()
    await expectComposerFadeLayer(page)
    await expectFloatingComposerAligned(page)
    await expectCompactComposerSurface(page)
    await expectChatCardsFitUnderComposer(page)
    await expectChatRhythmStable(page)
    await expectMessageLabelsNotOvercrowded(page)
    await expectNoExcessiveVerticalGaps(page)
    await expectNoCardHorizontalOverflow(page)
  })

  test('keeps expanded planning details free of internal tool names', async ({ page }) => {
    await completeEditorSetup(page)

    await expandVisibleEditorDetailsAndExpectNoInternalToolNames(page)
    await expectNoHorizontalOverflow(page)
    await expectFloatingComposerAligned(page)
    await expectCompactComposerSurface(page)
    await expectChatCardsFitUnderComposer(page)
    await expectChatRhythmStable(page)
    await expectNoCardHorizontalOverflow(page)
  })

  test('keeps the clean named-edit plan free of internal tool names when developer query input is present', async ({ page }) => {
    await gotoEditor(page, '/editor?developerControls=1')
    await clickWhenReady(page.getByRole('button', { name: /Planning details/i }))
    await clickWhenReady(page.getByRole('button', { name: /Developer/i }))
    await uploadEditorSourceFile(page)
    await createPlanFromUploadedEditorSources(page)

    await expect(page.getByTestId('plan-review-card')).toBeVisible()
    await expect(page.getByText(/Editing capability readiness/i)).toHaveCount(0)
    await expandVisibleEditorDetailsAndExpectNoInternalToolNames(page)
    await expectNoHorizontalOverflow(page)
    await expectFloatingComposerAligned(page)
    await expectCompactComposerSurface(page)
    await expectChatCardsFitUnderComposer(page)
    await expectNoCardHorizontalOverflow(page)
  })

  test('keeps retired standalone SFX controls out of the clean plan review', async ({ page }) => {
    await completeEditorSetup(page)

    const planReview = page.getByTestId('plan-review-card')
    await expect(planReview).toBeVisible()
    await expect(page.getByRole('button', { name: /Plan sound effects/i })).toHaveCount(0)
    await expectNoInternalToolNamesInEditor(page)
    await expectLastContentReachableAboveComposer(page, page.getByTestId('plan-review-approve'), 'plan approval action')
    await expectNoHorizontalOverflow(page)
    await expectFloatingComposerAligned(page)
    await expectCompactComposerSurface(page)
    await expectChatCardsFitUnderComposer(page)
    await expectChatRhythmStable(page)
    await expectCardAttachedToAssistantMessage(page)
    await expectNoExcessiveVerticalGaps(page)
    await expectNoCardHorizontalOverflow(page)
  })

  test('keeps retired standalone music controls out of the clean plan review', async ({ page }) => {
    await completeEditorSetup(page)

    const planReview = page.getByTestId('plan-review-card')
    await expect(planReview).toBeVisible()
    await expect(page.getByRole('button', { name: /^Plan music$/i })).toHaveCount(0)
    await expectNoInternalToolNamesInEditor(page)
    await expectLastContentReachableAboveComposer(page, page.getByTestId('plan-review-approve'), 'plan approval action')
    await expectNoHorizontalOverflow(page)
    await expectFloatingComposerAligned(page)
    await expectCompactComposerSurface(page)
    await expectChatCardsFitUnderComposer(page)
    await expectChatRhythmStable(page)
    await expectCardAttachedToAssistantMessage(page)
    await expectNoExcessiveVerticalGaps(page)
    await expectNoCardHorizontalOverflow(page)
  })
})
