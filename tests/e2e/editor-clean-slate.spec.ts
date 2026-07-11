import { expect, test, type Page } from '@playwright/test'
import {
  clickWhenReady,
  completeRequiredEditorSetupBeforeFootagePrep,
  expectNoGenerationBeforeApproval,
  findPlanReview,
  gotoRoute,
  uploadEditorGateSourceVideo,
} from './helpers/routes'
import { expectFloatingComposerAligned, expectNoHorizontalOverflow } from './helpers/layout'

async function createNamedEdit(page: Page, suffix: string) {
  await gotoRoute(page, '/projects/new')
  await page.getByLabel(/Project name/i).fill(`Clean chat ${suffix} ${Date.now()}`)
  await clickWhenReady(page.getByRole('button', { name: /^Create project$/i }).first())
  await expect(page).toHaveURL(/\/projects\/[^/]+$/)
  await clickWhenReady(page.getByRole('button', { name: /^New edit$/i }).first())
  await page.getByLabel(/Edit name/i).fill(`Clean chat ${suffix}`)
  await clickWhenReady(page.getByRole('button', { name: /^Create edit$/i }).first())
  await expect(page).toHaveURL(/\/projects\/[^/]+\/edits\/[^?]+\?/)
  await expect(page.getByTestId('edit-upload-gate')).toBeVisible()
}

test.describe('clean named-edit chat', () => {
  test('uses one active decision instead of a chat card wall', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await createNamedEdit(page, 'source')
    await uploadEditorGateSourceVideo(page, 'clean-chat-source.mp4')

    const stage = page.getByTestId('editor-stage')
    await expect(stage).toHaveAttribute('data-editor-stage', 'source')
    await expect(page.getByTestId('source-summary')).toBeVisible()
    await expect(page.getByTestId('source-summary')).toContainText('clean-chat-source.mp4')
    await expect(page.locator('.chat-native-message-with-cards')).toHaveCount(0)
    await expect(page.getByTestId('edit-workspace-progress-card')).toHaveCount(0)
    await expect(page.getByTestId('source-sequence-card')).toHaveCount(0)
    await expect(page.getByTestId('compiled-intent-card')).toHaveCount(0)
    await expect(page.getByTestId('timeline-open-trigger')).toHaveCount(0)
    await expectNoGenerationBeforeApproval(page)
    await expectNoHorizontalOverflow(page)
    await expectFloatingComposerAligned(page)
  })

  test('reaches one approval checkpoint and starts review only after approval', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await createNamedEdit(page, 'approval')
    await uploadEditorGateSourceVideo(page, 'clean-chat-approval.mp4')

    await page.getByTestId('chat-composer-textarea').fill('Create a concise founder update with calm pacing and a clear closing point.')
    await clickWhenReady(page.getByTestId('chat-composer-send'))
    await completeRequiredEditorSetupBeforeFootagePrep(page)

    await expect(page.getByTestId('editor-stage')).toHaveAttribute('data-editor-stage', 'planning')
    await clickWhenReady(page.getByRole('button', { name: /^Prepare source$/i }))
    await expect(page.getByTestId('planning-preparation')).toContainText(/Ready to create the plan/i)
    await clickWhenReady(page.getByRole('button', { name: /^Create edit plan$/i }))

    const checkpoint = await findPlanReview(page)
    await expect(checkpoint).toContainText(/What I understood/i)
    await expect(checkpoint).toContainText(/estimated credits/i)
    await expect(page.getByTestId('editor-stage')).toHaveAttribute('data-editor-stage', 'plan_review')
    await expect(page.getByTestId('plan-approval-checkpoint')).toHaveCount(1)
    await expectNoGenerationBeforeApproval(page)

    await clickWhenReady(page.getByTestId('plan-review-approve'))
    await expect(page.getByTestId('private-review')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByTestId('editor-stage')).toHaveAttribute('data-editor-stage', 'private_review')
    await expect(page.getByTestId('private-review')).toContainText(/Review the edit/i)
    await expect(page.getByTestId('plan-approval-checkpoint')).toHaveCount(0)
    await expect(page.locator('.chat-native-message-with-cards')).toHaveCount(0)
    await expectNoHorizontalOverflow(page)
    await expectFloatingComposerAligned(page)
  })
})
