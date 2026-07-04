import { expect, test } from '@playwright/test'
import { expectNoHorizontalOverflow, setViewport } from './helpers/layout'
import { gotoRoute } from './helpers/routes'

const briefPath = '/projects/mock-project-edit-chat-foundation/edits/edit-session-youtube-wide/brief'
const needsAssetBriefPath = '/projects/mock-project-edit-chat-foundation/edits/edit-session-social-feed/brief'

test.describe('Project Edit Brief marker attachments', () => {
  test('adds and removes metadata-only marker attachments without runtime effects', async ({ page }) => {
    await setViewport(page, 1440)
    await gotoRoute(page, briefPath)

    await expect(page.getByTestId('project-edit-brief-workspace')).toBeVisible()
    await page.getByTestId('project-edit-brief-marker-pill-marker-calm-soundtrack').click()
    await expect(page.getByTestId('project-edit-brief-marker-drawer')).toBeVisible()
    const attachmentPanel = page.getByTestId('project-edit-brief-attachment-panel')
    await expect(attachmentPanel).toBeVisible()
    await expect(attachmentPanel.getByTestId('project-edit-brief-attachment-boundary')).toContainText('metadata-only')

    await attachmentPanel.getByTestId('project-edit-brief-attachment-add-button').click()
    await expect(attachmentPanel.getByTestId('project-edit-brief-attachment-form')).toBeVisible()
    await expect(attachmentPanel.locator('input[type="file"]')).toBeDisabled()
    await attachmentPanel.getByTestId('project-edit-brief-attachment-kind-picker').selectOption('broll_video')
    await attachmentPanel.getByTestId('project-edit-brief-attachment-label-input').fill('rp08-city-broll-metadata.mp4')
    await attachmentPanel.getByTestId('project-edit-brief-attachment-notes-input').fill('Metadata-only B-roll reference. No upload.')
    await attachmentPanel.getByTestId('project-edit-brief-attachment-save-button').click()

    await expect(page.getByTestId('project-edit-brief-status')).toContainText('Attachment saved')
    await expect(attachmentPanel.getByTestId('project-edit-brief-attachment-chips')).toContainText('rp08-city-broll-metadata.mp4')
    await expect(attachmentPanel.getByTestId('project-edit-brief-attachment-detail')).toContainText('No upload')
    await expect(page.getByTestId('project-edit-brief-marker-chat-intent')).toContainText('project-edit-brief-attachment')

    await attachmentPanel.getByTestId('project-edit-brief-attachment-add-button').click()
    await attachmentPanel.getByTestId('project-edit-brief-attachment-kind-picker').selectOption('reference_url_metadata_only')
    await attachmentPanel.getByTestId('project-edit-brief-attachment-label-input').fill('reference URL metadata')
    await attachmentPanel.getByTestId('project-edit-brief-attachment-url-input').fill('https://example.com/private/reference-video')
    await attachmentPanel.getByTestId('project-edit-brief-attachment-save-button').click()

    await expect(attachmentPanel.getByTestId('project-edit-brief-attachment-chips')).toContainText('reference URL metadata')
    await expect(attachmentPanel.getByTestId('project-edit-brief-attachment-detail')).toContainText('https://example.com/...')
    await expect(attachmentPanel.getByTestId('project-edit-brief-attachment-boundary')).toContainText('external URL fetch')

    await attachmentPanel.getByTestId('project-edit-brief-attachment-add-button').click()
    await attachmentPanel.getByTestId('project-edit-brief-attachment-kind-picker').selectOption('sfx')
    await attachmentPanel.getByTestId('project-edit-brief-attachment-label-input').fill('soft-whoosh-metadata.wav')
    await attachmentPanel.getByTestId('project-edit-brief-attachment-save-button').click()
    await expect(attachmentPanel.getByTestId('project-edit-brief-attachment-detail')).toContainText('sound runtime')

    await attachmentPanel.getByTestId('project-edit-brief-attachment-remove-button').click()
    await expect(page.getByTestId('project-edit-brief-status')).toContainText('Attachment metadata removed')
    await expect(attachmentPanel.getByTestId('project-edit-brief-attachment-chips')).not.toContainText('soft-whoosh-metadata.wav')

    await expect(page.getByTestId('generation-progress-card')).toHaveCount(0)
    await expect(page.getByTestId('preview-ready-card')).toHaveCount(0)
    await expect(page.getByText(/sound runtime started|credit reserved|render started|provider call made|upload started|progress started/i)).toHaveCount(0)
    await expectNoHorizontalOverflow(page)
  })

  test('resolves missing B-roll asset metadata back to draft without planner execution', async ({ page }) => {
    await setViewport(page, 1440)
    await gotoRoute(page, needsAssetBriefPath)

    await expect(page.getByTestId('project-edit-brief-workspace')).toBeVisible()
    await page.getByTestId('project-edit-brief-marker-pill-marker-broll-needed').click()
    await expect(page.getByTestId('project-edit-brief-marker-drawer')).toBeVisible()
    await expect(page.getByTestId('project-edit-brief-marker-status-controls')).toHaveValue('needs_asset')

    const attachmentPanel = page.getByTestId('project-edit-brief-attachment-panel')
    await attachmentPanel.getByTestId('project-edit-brief-attachment-add-button').click()
    await attachmentPanel.getByTestId('project-edit-brief-attachment-kind-picker').selectOption('broll_video')
    await attachmentPanel.getByTestId('project-edit-brief-attachment-label-input').fill('rp08-cafe-exterior-metadata.mp4')
    await attachmentPanel.getByTestId('project-edit-brief-attachment-notes-input').fill('Metadata-only cafe exterior reference. No upload or media processing.')
    await attachmentPanel.getByTestId('project-edit-brief-attachment-save-button').click()

    await expect(attachmentPanel.getByTestId('project-edit-brief-attachment-status')).toContainText('Missing asset is resolved to draft')
    await expect(attachmentPanel.getByTestId('project-edit-brief-attachment-status')).toContainText('confirm this marker before preparing plan hints')
    await expect(page.getByTestId('project-edit-brief-status')).toContainText('Missing asset is resolved to draft')
    await expect(page.getByTestId('project-edit-brief-marker-status-controls')).toHaveValue('draft')
    await expect(attachmentPanel.getByTestId('project-edit-brief-attachment-chips')).toContainText('rp08-cafe-exterior-metadata.mp4')
    await expect(page.getByText(/planner executed|edit plan created|render job created|credit reserved|media processing started|upload started|file bytes read/i)).toHaveCount(0)
    await expectNoHorizontalOverflow(page)
  })
})
