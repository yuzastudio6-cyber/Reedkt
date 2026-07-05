import { expect, test } from '@playwright/test'
import { expectNoHorizontalOverflow, setViewport } from './helpers/layout'
import { gotoRoute } from './helpers/routes'

const briefPath = '/projects/mock-project-edit-chat-foundation/edits/edit-session-youtube-wide/brief'

test.describe('Project Edit Brief Marker Chat', () => {
  test('captures marker-scoped chat, intent, clarification, and AI-off behavior', async ({ page }) => {
    await setViewport(page, 1440)
    await gotoRoute(page, briefPath)

    await expect(page.getByTestId('project-edit-brief-workspace')).toBeVisible()
    await page.getByTestId('project-edit-brief-marker-pill-marker-calm-soundtrack').click()
    await expect(page.getByTestId('project-edit-brief-marker-chat-panel')).toBeVisible()
    await expect(page.getByTestId('project-edit-brief-marker-chat-boundary')).toContainText('Marker Chat is mock/local')
    await expect(page.getByTestId('project-edit-brief-marker-chat-boundary')).toContainText('Qwen 3.7 Max')
    await expect(page.getByTestId('project-edit-brief-marker-chat-runtime')).toContainText('Local fallback active')
    await expect(page.getByTestId('project-edit-brief-marker-chat-readiness')).toContainText('local fallback active')
    await expect(page.getByTestId('project-edit-brief-marker-chat-readiness')).toContainText('no provider call')

    await page.getByTestId('project-edit-brief-marker-chat-textarea').fill('Use this attached B-roll clip here and keep original audio')
    await page.getByTestId('project-edit-brief-marker-chat-send').click()
    await expect(page.getByTestId('project-edit-brief-marker-chat-status')).toContainText('Marker Chat saved scoped message')
    await expect(page.getByTestId('project-edit-brief-marker-chat-list')).toContainText('Use this attached B-roll clip here')
    await expect(page.getByTestId('project-edit-brief-marker-chat-list')).toContainText('Understood')
    await expect(page.getByTestId('project-edit-brief-marker-chat-intent')).toContainText('add broll')
    await expect(page.getByTestId('project-edit-brief-marker-chat-intent')).toContainText('insert broll')
    await expect(page.getByTestId('project-edit-brief-marker-chat-intent')).toContainText('keep original audio')
    await expect(page.getByTestId('project-edit-brief-marker-chat-confirmation')).toContainText('Understood')

    await page.getByTestId('project-edit-brief-marker-ai-mode-picker').selectOption('ask_clarifying_questions')
    await page.getByRole('button', { name: /Save update/i }).click()
    await expect(page.getByTestId('project-edit-brief-status')).toContainText('Marker update saved')
    await page.getByTestId('project-edit-brief-marker-chat-textarea').fill('Make this better')
    await page.getByTestId('project-edit-brief-marker-chat-send').click()
    await expect(page.getByTestId('project-edit-brief-marker-chat-list')).toContainText('What should this marker focus on')
    await expect(page.getByTestId('project-edit-brief-marker-chat-intent')).toContainText('needs clarification')

    await page.getByTestId('project-edit-brief-marker-ai-mode-picker').selectOption('off')
    await page.getByRole('button', { name: /Save update/i }).click()
    const assistantCount = await page.locator('.project-edit-brief-marker-chat-bubble--assistant').count()
    await page.getByTestId('project-edit-brief-marker-chat-textarea').fill('Add captions here')
    await page.getByTestId('project-edit-brief-marker-chat-send').click()
    await expect(page.getByTestId('project-edit-brief-marker-chat-list')).toContainText('Add captions here')
    await expect(page.locator('.project-edit-brief-marker-chat-bubble--assistant')).toHaveCount(assistantCount)

    await page.getByTestId('edit-session-route-tab-chat').click()
    await expect(page.getByTestId('edit-session-chat-page')).toBeVisible()
    await expect(page.getByTestId('edit-session-chat-page')).not.toContainText('Use this attached B-roll clip here')
    await expect(page.getByTestId('generation-progress-card')).toHaveCount(0)
    await expect(page.getByTestId('preview-ready-card')).toHaveCount(0)
    await expect(page.getByText(/credit reserved|render started|provider call made|upload started/i)).toHaveCount(0)
    await expectNoHorizontalOverflow(page)
  })
})
