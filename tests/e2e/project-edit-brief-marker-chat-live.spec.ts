import { expect, test } from '@playwright/test'
import { expectNoHorizontalOverflow, setViewport } from './helpers/layout'
import { gotoRoute } from './helpers/routes'

const briefPath = '/projects/mock-project-edit-chat-foundation/edits/edit-session-youtube-wide/brief'

test.describe('Project Edit Brief Marker Chat live Qwen beta', () => {
  test.skip(process.env.PLAYWRIGHT_QWEN_LIVE !== 'true', 'Live Qwen beta Playwright requires PLAYWRIGHT_QWEN_LIVE=true, a running beta API server, and Secret Manager/provider config.')
  test.setTimeout(90_000)

  test('routes Marker Chat through backend Qwen 3.7 Max without exposing secrets or starting execution', async ({ page }) => {
    await setViewport(page, 1440)
    await gotoRoute(page, briefPath)

    await expect(page.getByTestId('project-edit-brief-workspace')).toBeVisible()
    await page.getByTestId('project-edit-brief-marker-pill-marker-calm-soundtrack').click()
    await expect(page.getByTestId('project-edit-brief-marker-chat-panel')).toBeVisible()
    await expect(page.getByTestId('project-edit-brief-marker-chat-boundary')).toContainText('backend server route')
    await expect(page.getByTestId('project-edit-brief-marker-chat-runtime')).toContainText('Qwen 3.7 Max beta route configured')
    await expect(page.getByTestId('project-edit-brief-marker-chat-readiness')).toContainText('Qwen 3.7 Max beta ready', { timeout: 45_000 })

    await page.getByTestId('project-edit-brief-marker-chat-textarea').fill('Add city B-roll here but keep the speaker audio.')
    await page.getByTestId('project-edit-brief-marker-chat-send').click()

    await expect(page.getByTestId('project-edit-brief-marker-chat-status')).toContainText('Qwen 3.7 Max understood this marker', { timeout: 60_000 })
    await expect(page.getByTestId('project-edit-brief-marker-chat-list')).toContainText('Add city B-roll here')
    await expect(page.getByTestId('project-edit-brief-marker-chat-intent')).toBeVisible()
    await expect(page.getByText(/api key|secret manager value|authorization header|raw provider payload|service account/i)).toHaveCount(0)
    await expect(page.getByText(/render started|worker started|credit reserved|planner executed|edit plan created/i)).toHaveCount(0)
    await expectNoHorizontalOverflow(page)
  })
})
