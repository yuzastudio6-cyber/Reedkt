import { expect, test } from '@playwright/test'
import { expectNoHorizontalOverflow, setViewport } from './helpers/layout'
import { gotoRoute } from './helpers/routes'

test.describe('Project start to Edit Chat flow', () => {
  test('routes category start into Project Home New Edit and then Brief without opening the legacy editor', async ({ page }) => {
    await setViewport(page, 1440)
    await gotoRoute(page, '/projects/new')

    await expect(page.getByRole('heading', { name: /Start with a video category/i })).toBeVisible()
    await expect(page.getByText(/Local video review comes in Brief/i)).toBeVisible()

    await page.getByRole('link', { name: /Start Edit Chat/i }).first().click()
    await expect(page).toHaveURL(/\/projects\/mock-project-edit-chat-foundation\?newEdit=1&category=/)
    await expect(page).not.toHaveURL(/\/editor/)

    await expect(page.getByTestId('project-edit-session-home')).toBeVisible()
    await expect(page.getByTestId('new-edit-session-create-panel')).toBeVisible()
    await expect(page.getByTestId('new-edit-session-create-panel')).toContainText('Mock/local only')
    await expect(page.getByTestId('new-edit-session-create-panel')).toContainText('No upload')
    await expect(page.getByTestId('new-edit-session-create-panel')).toContainText('No credits')

    await page.getByTestId('new-edit-name-input').fill('Internal testing edit flow')
    await page.getByTestId('new-edit-source-label-0').fill('Local test video')
    await page.getByTestId('new-edit-source-notes-0').fill('Use the Brief tab to select a browser-local source video before planning.')
    await page.getByRole('button', { name: /^Create mock Edit Chat$/i }).click()

    await expect(page.getByTestId('new-edit-success-message')).toContainText('Internal testing edit flow was created')
    await page.getByTestId('new-edit-success-message').getByRole('link', { name: /Open Edit Chat/i }).click()

    await expect(page).toHaveURL(/\/projects\/mock-project-edit-chat-foundation\/edits\/[^/]+$/)
    await expect(page.getByTestId('edit-session-chat-page')).toBeVisible()
    await expect(page.getByTestId('edit-session-route-tab-brief')).toBeVisible()
    await page.getByTestId('edit-session-route-tab-brief').click()

    await expect(page).toHaveURL(/\/projects\/mock-project-edit-chat-foundation\/edits\/[^/]+\/brief$/)
    await expect(page.getByTestId('project-edit-brief-workspace')).toBeVisible()
    await expect(page.getByTestId('project-edit-brief-boundary')).toContainText('Edit Brief is optional')
    await expect(page.getByTestId('project-source-video-picker-boundary')).toContainText('Durable uploads and media workers arrive after storage/runtime gates')

    await expect(page.getByText(/provider call made|worker created|render started|credit reserved|upload started|file bytes read/i)).toHaveCount(0)
    await expectNoHorizontalOverflow(page)
  })
})
