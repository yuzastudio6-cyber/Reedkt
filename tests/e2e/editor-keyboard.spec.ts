import { expect, test } from '@playwright/test'
import { installActiveProductRouteFixture } from './helpers/active-product'
import {
  expectCompactComposerSurface,
  expectDetailsSummaryKeyboardToggle,
  expectFloatingComposerAligned,
  expectFocusedControl,
  expectIconButtonsHaveAccessibleTitles,
  expectNoCardHorizontalOverflow,
  expectNoHorizontalOverflow,
  setViewport,
} from './helpers/layout'
import {
  completeEditorSetup,
  completeRequiredEditorSetupBeforeFootagePrep,
  expectNoGenerationBeforeApproval,
  findPlanReview,
  gotoEditor,
  gotoRoute,
  openMusicFlow,
  openSFXFlow,
  openTimeline,
  uploadEditorSourceFile,
} from './helpers/routes'

test.describe('editor keyboard and interaction polish QA', () => {
  test.beforeEach(async ({ page }) => {
    await setViewport(page, 1440)
  })

  test('keeps compact composer controls labelled, focusable, and keyboard-send safe', async ({ page }) => {
    await gotoEditor(page)

    const composer = page.getByTestId('chat-composer')
    const textarea = page.getByTestId('chat-composer-textarea')

    await expectIconButtonsHaveAccessibleTitles(composer, 'composer controls')
    await expectFocusedControl(page, page.getByTestId('chat-composer-attach'), 'composer add clip control')
    await expectFocusedControl(page, page.getByTestId('chat-composer-reference'), 'composer reference control')
    await expectFocusedControl(page, textarea, 'composer textarea')

    await textarea.fill('Line one')
    await textarea.press('Shift+Enter')
    await expect(textarea, 'Shift+Enter should preserve textarea newline behavior').toHaveValue('Line one\n')

    const keyboardMessage = 'Keyboard send should revise the plan without starting generation.'
    await textarea.fill(keyboardMessage)
    await expectFocusedControl(page, page.getByTestId('chat-composer-send'), 'composer send control')
    await textarea.focus()
    await textarea.press('Control+Enter')

    await expect(page.locator('article[data-message-type="user_message"]').filter({ hasText: keyboardMessage })).toBeVisible()
    await expectNoGenerationBeforeApproval(page)
    await expectCompactComposerSurface(page)
    await expectFloatingComposerAligned(page)
    await expectNoHorizontalOverflow(page)
  })

  test('keeps the active named-edit upload gate keyboard reachable', async ({ page }) => {
    const fixture = await installActiveProductRouteFixture(page, 'keyboard-upload-gate')
    await gotoRoute(page, fixture.editPath)

    const uploadAction = page.getByRole('button', { name: /Choose source video/i })
    await expect(page.getByTestId('edit-upload-gate')).toBeVisible()
    await expectFocusedControl(page, uploadAction, 'named-edit upload action')
    await expect(page.getByTestId('chat-composer-textarea')).toBeDisabled()
    await expectNoHorizontalOverflow(page)
  })

  test('keeps source and reference controls keyboard reachable with clear focus treatment', async ({ page }) => {
    await gotoEditor(page)

    const sourceCard = page.getByTestId('source-sequence-card')
    await expect(sourceCard).toBeVisible()
    await expectIconButtonsHaveAccessibleTitles(sourceCard, 'source sequence controls')
    await expectFocusedControl(page, sourceCard.getByRole('button', { name: /Add clip|Add mock clip/i }), 'source add clip action')
    await expectFocusedControl(page, sourceCard.getByLabel(/Source role/i).first(), 'source role select')
    await expectFocusedControl(page, sourceCard.getByLabel(/Notes for ReeditPro/i).first(), 'source note field')
    await expectFocusedControl(page, sourceCard.locator('.source-clip-flags').getByLabel(/Important/i).first(), 'source important flag')

    const moveLater = sourceCard.getByRole('button', { name: /Move .* later in source order/i }).first()
    if (await moveLater.isEnabled()) {
      await expectFocusedControl(page, moveLater, 'source move later action')
    }

    await uploadEditorSourceFile(page, 'keyboard-reference-source.mp4')
    await completeRequiredEditorSetupBeforeFootagePrep(page)
    const referenceCard = page.getByTestId('reference-card')
    await referenceCard.scrollIntoViewIfNeeded()
    await expect(referenceCard).toBeVisible()
    await expectFocusedControl(page, referenceCard.getByLabel(/Reference URL/i), 'reference URL field')
    await expectFocusedControl(page, referenceCard.getByRole('button', { name: /Pacing/i }), 'reference pacing focus chip')
    await expectFocusedControl(page, referenceCard.getByRole('button', { name: /Skip reference/i }), 'reference skip action')

    await expectNoHorizontalOverflow(page)
    await expectNoCardHorizontalOverflow(page)
  })

  test('keeps approval, timeline, and soundflow disclosures keyboard safe', async ({ page }) => {
    await completeEditorSetup(page)
    await findPlanReview(page)
    await expectNoGenerationBeforeApproval(page)
    await expectFocusedControl(page, page.getByTestId('plan-review-approve'), 'plan review approve action')

    await openTimeline(page)
    const timelineDrawer = page.getByTestId('timeline-drawer')
    await expectIconButtonsHaveAccessibleTitles(timelineDrawer, 'timeline drawer controls')
    await expectFocusedControl(page, page.getByTestId('timeline-close'), 'timeline close action')
    await page.getByTestId('timeline-close').press('Enter')
    await expect(timelineDrawer).toHaveCount(0)

    await completeEditorSetup(page)
    await openSFXFlow(page)
    const sfxSummary = page.locator('summary').filter({ hasText: 'SFX planning details' })
    await expectDetailsSummaryKeyboardToggle(page, sfxSummary, 'SFX planning details')
    await expect(page.getByText(/No sound preparation starts here/i)).toBeVisible()

    await completeEditorSetup(page)
    await openMusicFlow(page)
    const musicSummary = page.locator('summary').filter({ hasText: 'Music cue details' })
    await expectDetailsSummaryKeyboardToggle(page, musicSummary, 'Music cue details')
    await expect(page.getByText(/Detailed cue cards stay optional/i)).toBeVisible()

    await expectFloatingComposerAligned(page)
    await expectCompactComposerSurface(page)
    await expectNoHorizontalOverflow(page)
    await expectNoCardHorizontalOverflow(page)
  })
})
