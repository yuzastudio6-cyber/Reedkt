import { expect, test } from '@playwright/test'
import { expectNoHorizontalOverflow, setViewport } from './helpers/layout'
import { gotoRoute } from './helpers/routes'

test.describe('Project start to edit workspace flow', () => {
  test('keeps the retired editor route out of app navigation', async ({ page }) => {
    await setViewport(page, 1440)

    await gotoRoute(page, '/dashboard')
    await expect(page.locator('a[href="/editor"]')).toHaveCount(0)
    await expect(page.getByRole('link', { name: /Open AI chat editor/i })).toHaveCount(0)
    await expect(page.getByRole('link', { name: /Create project/i }).first()).toBeVisible()
    await expect(page.getByTestId('home-current-project')).toContainText('Continue from the clean project workspace')
    await expect(page.getByTestId('home-current-project')).not.toContainText('Founder story launch cut')

    await gotoRoute(page, '/projects')
    await expect(page.locator('a[href="/editor"]')).toHaveCount(0)
    await expect(page.getByRole('link', { name: /Open AI chat editor/i })).toHaveCount(0)
    await expect(page.getByTestId('projects-clean-header')).toContainText('Create or open a project')
    await expect(page.getByTestId('projects-clean-list')).not.toContainText('Source video test')
    await expect(page.getByRole('link', { name: /Open sample project/i })).toHaveCount(0)

    await gotoRoute(page, '/editor')
    await expect(page).toHaveURL(/\/projects\/new$/)
    await expect(page.getByRole('heading', { name: /Start with the project/i })).toBeVisible()
  })

  test('keeps project creation as the only clean start point before edit upload', async ({ page }) => {
    await setViewport(page, 1440)
    await gotoRoute(page, '/projects/new')

    await expect(page.getByTestId('project-create-flow')).toContainText('Start with the project')
    await expect(page.getByTestId('project-create-flow')).toContainText('Create an edit next')
    await expect(page.getByTestId('project-create-flow')).toContainText('Upload inside the edit')
    await expect(page.getByRole('link', { name: /Start Edit Chat/i })).toHaveCount(0)
    await expect(page.getByText(/Start with a video category|Local video review comes in Brief|Create mock Edit Chat/i)).toHaveCount(0)

    await expect(page.getByText(/provider call made|worker created|render started|credit reserved|upload started|file bytes read/i)).toHaveCount(0)
    await expectNoHorizontalOverflow(page)
  })

  test('routes edit aliases into the clean edit workspace', async ({ page }) => {
    await setViewport(page, 1440)
    await gotoRoute(page, '/projects/mock-project-edit-chat-foundation/edits/edit-session-youtube-wide/chat')

    await expect(page.getByTestId('project-edit-brief-workspace')).toBeVisible()
    await expect(page.getByTestId('edit-session-route-tabs')).toHaveCount(0)
    await expect(page.getByTestId('edit-session-chat-input')).toHaveCount(0)
    await expect(page.getByText(/Upload the source video for this edit/i)).toBeVisible()
    await expectNoHorizontalOverflow(page)
  })

  test('requires an explicit output frame before creating an edit', async ({ page }) => {
    await setViewport(page, 1440)
    await gotoRoute(page, '/projects/mock-project-edit-chat-foundation')

    await page.getByRole('button', { name: /\+ New edit/i }).click()
    await expect(page.getByTestId('new-edit-session-create-panel')).toBeVisible()
    await expect(page.getByTestId('new-edit-aspect-9:16')).toHaveAttribute('aria-pressed', 'false')
    await expect(page.getByTestId('new-edit-platform-instagram_reel')).toHaveAttribute('aria-pressed', 'false')
    await expect(page.getByText(/ReEditPro does not silently pick a final canvas/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /^Create edit$/i })).toBeDisabled()

    await page.getByTestId('new-edit-aspect-16:9').click()
    await expect(page.getByRole('button', { name: /^Create edit$/i })).toBeDisabled()

    await page.getByTestId('new-edit-platform-youtube_standard').click()
    await expect(page.getByRole('button', { name: /^Create edit$/i })).toBeEnabled()
    await expectNoHorizontalOverflow(page)
  })
})
