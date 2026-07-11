import { expect, test } from '@playwright/test'
import { expectCardAttachedToAssistantMessage, expectChatCardsFitUnderComposer, expectChatRhythmStable, expectComposerFadeLayer, expectCompactComposerSurface, expectFloatingComposerAligned, expectLastContentReachableAboveComposer, expectMessageLabelsNotOvercrowded, expectNoCardHorizontalOverflow, expectNoExcessiveVerticalGaps, expectNoHorizontalOverflow, setViewport } from './helpers/layout'
import {
  clickWhenReady,
  createPlanFromUploadedEditorSources,
  completeEditorSetup,
  expandVisibleEditorDetailsAndExpectNoInternalToolNames,
  expectNoInternalToolNamesInEditor,
  gotoEditor,
  openMusicFlow,
  openSFXFlow,
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

  test('keeps developer-level planning details free of internal tool names', async ({ page }) => {
    await gotoEditor(page, '/editor?developerControls=1')
    await clickWhenReady(page.getByRole('button', { name: /Planning details/i }))
    await clickWhenReady(page.getByRole('button', { name: /Developer/i }))
    await uploadEditorSourceFile(page)
    await createPlanFromUploadedEditorSources(page)

    await expect(page.getByText(/Editing capability readiness/i).first()).toBeVisible({ timeout: 15000 })
    await expandVisibleEditorDetailsAndExpectNoInternalToolNames(page)
    await expectNoHorizontalOverflow(page)
    await expectFloatingComposerAligned(page)
    await expectCompactComposerSurface(page)
    await expectChatCardsFitUnderComposer(page)
    await expectNoCardHorizontalOverflow(page)
  })

  test('opens SFX descriptor flow and keeps advanced details bounded', async ({ page }) => {
    await completeEditorSetup(page)
    await openSFXFlow(page)

    const detailsSummary = page.getByText('SFX planning details', { exact: true })
    await expect(detailsSummary).toBeVisible()
    await detailsSummary.click()
    await expect(page.getByText(/No sound preparation starts here/i)).toBeVisible()
    await expectNoInternalToolNamesInEditor(page)
    await expectLastContentReachableAboveComposer(page, detailsSummary, 'SFX planning details summary')
    await expectNoHorizontalOverflow(page)
    await expectFloatingComposerAligned(page)
    await expectCompactComposerSurface(page)
    await expectChatCardsFitUnderComposer(page)
    await expectChatRhythmStable(page)
    await expectCardAttachedToAssistantMessage(page)
    await expectNoExcessiveVerticalGaps(page)
    await expectNoCardHorizontalOverflow(page)
  })

  test('opens Music descriptor flow and keeps cue details bounded', async ({ page }) => {
    await completeEditorSetup(page)
    await openMusicFlow(page)

    const musicDetailsSummary = page.locator('summary').filter({ hasText: 'Music cue details' })
    await expect(musicDetailsSummary).toBeVisible()
    await musicDetailsSummary.click()
    await expect(page.getByText(/Detailed cue cards stay optional/i)).toBeVisible()
    await expectNoInternalToolNamesInEditor(page)
    await expectLastContentReachableAboveComposer(page, musicDetailsSummary, 'Music cue details summary')
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
