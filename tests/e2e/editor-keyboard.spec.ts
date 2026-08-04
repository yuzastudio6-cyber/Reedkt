import { expect, test } from '@playwright/test'
import { installActiveProductRouteFixture } from './helpers/active-product'
import {
  expectCompactComposerSurface,
  expectFloatingComposerAligned,
  expectFocusedControl,
  expectIconButtonsHaveAccessibleTitles,
  expectNoCardHorizontalOverflow,
  expectNoHorizontalOverflow,
  setViewport,
} from './helpers/layout'
import {
  clickWhenReady,
  completeEditorSetup,
  expectNoGenerationBeforeApproval,
  findPlanReview,
  gotoEditor,
  gotoRoute,
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

  test('keeps source controls keyboard reachable without unavailable reference controls', async ({ page }) => {
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
    await clickWhenReady(page.getByRole('button', { name: /Use this source|Confirm order/i }))
    await clickWhenReady(page.getByTestId('output-frame-control').getByRole('radio', { name: /9:16/i }))
    await clickWhenReady(page.getByRole('button', { name: /Confirm frame/i }))
    await clickWhenReady(page.getByRole('button', { name: /Confirm cleanup/i }))
    await expect(page.getByTestId('edit-level-inline-card')).toHaveCount(0)
    await expect(page.getByRole('button', { name: /Use (Normal|Premium|Ultra Premium)/i })).toHaveCount(0)
    await clickWhenReady(page.getByRole('button', { name: /Confirm direction/i }))
    await expect(page.getByTestId('reference-control')).toHaveCount(0)
    await expect(page.getByTestId('planning-preparation')).toBeVisible()

    await expectNoHorizontalOverflow(page)
    await expectNoCardHorizontalOverflow(page)
  })

  test('keeps the clean approval checkpoint keyboard safe without retired side workflows', async ({ page }) => {
    await completeEditorSetup(page)
    await findPlanReview(page)
    await expectNoGenerationBeforeApproval(page)
    await expectFocusedControl(page, page.getByTestId('plan-review-approve'), 'plan review approve action')
    await expect(page.getByTestId('timeline-open-trigger')).toHaveCount(0)
    await expect(page.getByRole('button', { name: /Plan sound effects/i })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /^Plan music$/i })).toHaveCount(0)
    await expectFocusedControl(page, page.getByTestId('editor-header-edit-brief'), 'Edit Brief header action')

    await expectFloatingComposerAligned(page)
    await expectCompactComposerSurface(page)
    await expectNoHorizontalOverflow(page)
    await expectNoCardHorizontalOverflow(page)
  })
})
