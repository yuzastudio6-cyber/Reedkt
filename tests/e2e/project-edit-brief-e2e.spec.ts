import { expect, test } from '@playwright/test'
import { expectNoHorizontalOverflow, setViewport } from './helpers/layout'
import { gotoRoute } from './helpers/routes'

const projectHomePath = '/projects/mock-project-edit-chat-foundation'
const youtubeEditPath = `${projectHomePath}/edits/edit-session-youtube-wide`
const youtubeChatPath = `${youtubeEditPath}/chat`
const markerTitle = 'RP12 E2E marker'

test.describe('Project Edit Brief E2E internal testing path', () => {
  test('covers Brief shell, marker flow, chat, attachments, export settings, QA, and plan hints safely', async ({ page }) => {
    await setViewport(page, 1440)
    await gotoRoute(page, projectHomePath)

    await expect(page.getByTestId('project-edit-session-home')).toBeVisible()
    await page.getByRole('button', { name: /Founder Story YouTube Cut/i }).click()
    await expect(page.getByTestId('project-edit-session-detail-panel')).toContainText('Founder Story YouTube Cut')
    await page.getByTestId('project-edit-session-detail-panel').getByRole('link', { name: 'Open edit' }).click()

    await expect(page).toHaveURL(new RegExp(`${youtubeEditPath}$`))
    await page.getByRole('link', { name: 'Open Edit Chat' }).click()
    await expect(page).toHaveURL(new RegExp(`${youtubeChatPath}$`))
    await expect(page.getByTestId('edit-session-chat-page')).toBeVisible()
    await expect(page.getByTestId('edit-session-route-tabs')).toContainText('Brief')
    await page.getByTestId('edit-session-route-tab-brief').click()
    await expect(page).toHaveURL(new RegExp(`${youtubeEditPath}/brief$`))

    await expect(page.getByTestId('project-edit-brief-workspace')).toBeVisible()
    await expect(page.getByTestId('project-edit-brief-boundary')).toContainText('Edit Brief is optional')
    await expect(page.getByTestId('project-edit-brief-video-shell')).toBeVisible()
    await expect(page.getByTestId('project-edit-brief-marker-lane')).toBeVisible()

    await page.getByRole('button', { name: /Add Marker/i }).click()
    await expect(page.getByTestId('project-edit-brief-marker-drawer')).toBeVisible()
    await page.getByTestId('project-edit-brief-marker-type-picker').selectOption('broll')
    await page.getByTestId('project-edit-brief-marker-priority-picker').selectOption('must_follow')
    await page.getByTestId('project-edit-brief-marker-title-input').fill(markerTitle)
    await page.getByTestId('project-edit-brief-marker-note-input').fill('Add mock/local B-roll cutaway here for the RP-EDITBRIEF-12 E2E path.')
    await page.getByRole('button', { name: /Save marker/i }).click()

    await expect(page.getByTestId('project-edit-brief-status')).toContainText('Marker created in mock/local metadata')
    await expect(page.getByRole('button', { name: new RegExp(markerTitle) })).toBeVisible()
    await page.getByRole('button', { name: new RegExp(markerTitle) }).click()
    await expect(page.getByTestId('project-edit-brief-marker-drawer')).toContainText('Edit Marker')
    await page.getByTestId('project-edit-brief-marker-note-input').fill('Updated RP12 E2E marker note with confirmed B-roll intent.')
    await page.getByRole('button', { name: /Save update/i }).click()
    await expect(page.getByTestId('project-edit-brief-status')).toContainText('Marker update saved in mock/local metadata')
    await page.getByRole('button', { name: /Confirm marker/i }).click()
    await expect(page.getByTestId('project-edit-brief-status')).toContainText('Marker confirmed in mock/local metadata')

    const markerChat = page.getByTestId('project-edit-brief-marker-chat-panel')
    await expect(markerChat.getByTestId('project-edit-brief-marker-chat-boundary')).toContainText('Marker Chat is mock/local')
    await markerChat.getByTestId('project-edit-brief-marker-chat-textarea').fill('Use this attached B-roll clip here and keep original audio.')
    await markerChat.getByTestId('project-edit-brief-marker-chat-send').click()
    await expect(markerChat.getByTestId('project-edit-brief-marker-chat-status')).toContainText('Marker Chat saved scoped message')
    await expect(markerChat.getByTestId('project-edit-brief-marker-chat-list')).toContainText('Use this attached B-roll clip here')
    await expect(markerChat.getByTestId('project-edit-brief-marker-chat-intent')).toContainText(/add broll|insert broll/i)
    await expect(page.getByTestId('edit-session-message-list')).toHaveCount(0)

    const attachmentPanel = page.getByTestId('project-edit-brief-attachment-panel')
    await expect(attachmentPanel.getByTestId('project-edit-brief-attachment-boundary')).toContainText('metadata-only')
    await attachmentPanel.getByTestId('project-edit-brief-attachment-add-button').click()
    await expect(attachmentPanel.locator('input[type="file"]')).toBeDisabled()
    await attachmentPanel.getByTestId('project-edit-brief-attachment-kind-picker').selectOption('broll_video')
    await attachmentPanel.getByTestId('project-edit-brief-attachment-label-input').fill('rp12-broll-metadata.mp4')
    await attachmentPanel.getByTestId('project-edit-brief-attachment-notes-input').fill('Metadata-only B-roll reference. No upload or file bytes.')
    await attachmentPanel.getByTestId('project-edit-brief-attachment-save-button').click()
    await expect(page.getByTestId('project-edit-brief-status')).toContainText('Attachment saved')
    await expect(attachmentPanel.getByTestId('project-edit-brief-attachment-chips')).toContainText('rp12-broll-metadata.mp4')

    const exportPanel = page.getByTestId('project-edit-brief-export-settings')
    await expect(exportPanel.getByTestId('project-edit-brief-export-settings-boundary')).toContainText('No render/export started')
    await exportPanel.getByTestId('project-edit-brief-export-preset-select').selectOption('youtube_standard_1920x1080')
    await exportPanel.getByTestId('project-edit-brief-export-caption-safe-area-checkbox').check()
    await exportPanel.getByTestId('project-edit-brief-export-settings-save-button').click()
    await expect(exportPanel.getByTestId('project-edit-brief-export-settings-status')).toContainText('No render/export started')

    const qaSummary = page.getByTestId('project-edit-brief-qa-summary')
    await qaSummary.getByTestId('project-edit-brief-run-qa-button').click()
    await expect(qaSummary.getByTestId('project-edit-brief-qa-status')).toContainText('Brief QA complete')
    await expect(qaSummary.getByTestId('project-edit-brief-qa-boundary')).toContainText('does not call Qwen')

    const planPanel = page.getByTestId('project-edit-brief-plan-bridge')
    await expect(planPanel).toContainText('Brief Plan Hints')
    await planPanel.getByTestId('project-edit-brief-plan-prepare-button').click()
    await expect(planPanel.getByTestId('project-edit-brief-plan-status')).toContainText('Prepared')
    await expect(planPanel.getByTestId('project-edit-brief-plan-instruction-list')).toBeVisible()
    await expect(planPanel.getByTestId('project-edit-brief-plan-application-log')).toContainText('Prepared')
    await expect(planPanel.getByTestId('project-edit-brief-plan-boundary')).toContainText('mock/local structured instructions only')

    await page.getByTestId('edit-session-route-tab-chat').click()
    await expect(page).toHaveURL(new RegExp(`${youtubeChatPath}$`))
    await expect(page.getByTestId('edit-session-chat-input')).toBeVisible()

    await expect(page.getByText(/Run planner|Generate final edit|Render edit|Spend credits/i)).toHaveCount(0)
    await expect(page.getByText(/planner executed|edit plan created|provider call made|render job created|credit reserved|media processing started|upload started|file bytes read|external url fetched/i)).toHaveCount(0)
    await expect(page.getByTestId('generation-progress-card')).toHaveCount(0)
    await expect(page.getByTestId('preview-ready-card')).toHaveCount(0)
    await expectNoHorizontalOverflow(page)
  })
})
