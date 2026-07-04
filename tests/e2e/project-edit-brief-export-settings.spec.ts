import { expect, test } from '@playwright/test'
import { expectNoHorizontalOverflow, setViewport } from './helpers/layout'
import { gotoRoute } from './helpers/routes'

const briefPath = '/projects/mock-project-edit-chat-foundation/edits/edit-session-youtube-wide/brief'

test.describe('Project Edit Brief export settings', () => {
  test('recommends and saves session-level mock export settings without runtime effects', async ({ page }) => {
    await setViewport(page, 1440)
    await gotoRoute(page, briefPath)

    await expect(page.getByTestId('project-edit-brief-workspace')).toBeVisible()
    const panel = page.getByTestId('project-edit-brief-export-settings')
    await expect(panel).toBeVisible()
    await expect(panel).toContainText('Session output settings')
    await expect(panel).toContainText('1920x1080')
    await expect(panel.getByTestId('project-edit-brief-export-settings-boundary')).toContainText('session-level')
    await expect(panel.getByTestId('project-edit-brief-export-settings-boundary')).toContainText('No render/export started')

    await panel.getByTestId('project-edit-brief-export-preset-select').selectOption('instagram_reel_1080x1920')
    await expect(panel).toContainText('1080x1920')
    await panel.getByTestId('project-edit-brief-export-width-input').fill('1080')
    await panel.getByTestId('project-edit-brief-export-height-input').fill('1920')
    await panel.getByTestId('project-edit-brief-export-frame-rate-select').selectOption('30')
    await panel.getByTestId('project-edit-brief-export-caption-safe-area-checkbox').uncheck()
    await panel.getByTestId('project-edit-brief-export-caption-safe-area-checkbox').check()
    await panel.getByTestId('project-edit-brief-export-settings-save-button').click()

    await expect(panel.getByTestId('project-edit-brief-export-settings-status')).toContainText('No render/export started')
    await expect(page.getByTestId('project-edit-brief-status')).toContainText('No render/export started')
    await expect(panel).toContainText('User Override Mock')

    await expect(page.getByTestId('generation-progress-card')).toHaveCount(0)
    await expect(page.getByTestId('preview-ready-card')).toHaveCount(0)
    await expect(page.getByText(/render job created|export job created|credit reserved|provider call made|ffprobe|media processing started|upload started/i)).toHaveCount(0)
    await expectNoHorizontalOverflow(page)
  })
})
