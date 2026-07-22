import { expect, test } from '@playwright/test'
import { installActiveProductRouteFixture } from './helpers/active-product'
import { expectNoHorizontalOverflow, setViewport } from './helpers/layout'
import { expectNoGenerationBeforeApproval, gotoRoute } from './helpers/routes'

test.describe('Project start to edit workspace flow', () => {
  test('keeps the retired editor route out of app navigation', async ({ page }) => {
    await setViewport(page, 1440)

    await gotoRoute(page, '/dashboard')
    await expect(page.locator('a[href="/editor"]')).toHaveCount(0)
    await expect(page.getByRole('link', { name: /Open AI chat editor/i })).toHaveCount(0)
    await expect(page.getByRole('link', { name: /Create project/i }).first()).toBeVisible()
    await expect(page.getByRole('heading', { level: 1, name: 'Home' })).toBeVisible()
    await expect(page.getByRole('heading', { name: /Create your first project/i })).toBeVisible()
    await expect(page.getByText('Founder story launch cut')).toHaveCount(0)

    await gotoRoute(page, '/projects')
    await expect(page.locator('a[href="/editor"]')).toHaveCount(0)
    await expect(page.getByRole('link', { name: /Open AI chat editor/i })).toHaveCount(0)
    await expect(page.getByRole('heading', { level: 1, name: 'Edit Videos' })).toBeVisible()
    await expect(page.getByRole('link', { name: /New project/i }).first()).toBeVisible()
    await expect(page.getByText('Source video test')).toHaveCount(0)
    await expect(page.getByRole('link', { name: /Open sample project/i })).toHaveCount(0)

    await gotoRoute(page, '/editor')
    await expect(page).toHaveURL(/\/editor$/)
    await expect(page.getByTestId('editor-page')).toBeVisible()
  })

  test('keeps project creation as the only clean start point before edit upload', async ({ page }) => {
    await setViewport(page, 1440)
    await gotoRoute(page, '/projects/new')

    await expect(page.getByTestId('project-create-flow')).toContainText('What are you working on?')
    await expect(page.getByTestId('project-create-flow')).toContainText('Create a named edit')
    await expect(page.getByTestId('project-create-flow')).toContainText('Add source video')
    await expect(page.getByTestId('project-create-flow')).toContainText('Shape the plan')
    await expect(page.getByRole('link', { name: /Start Edit Chat/i })).toHaveCount(0)
    await expect(page.getByText(/Start with a video category|Local video review comes in Brief|Create mock Edit Chat/i)).toHaveCount(0)

    await expect(page.getByText(/provider call made|worker created|render started|credit reserved|upload started|file bytes read/i)).toHaveCount(0)
    await expectNoHorizontalOverflow(page)
  })

  test('opens the exact scoped edit in the clean edit workspace', async ({ page }) => {
    await setViewport(page, 1440)
    const fixture = await installActiveProductRouteFixture(page, 'project-start-exact-edit')
    await gotoRoute(page, fixture.editPath)

    await expect(page.getByTestId('editor-page')).toBeVisible()
    await expect(page.getByTestId('edit-upload-gate')).toBeVisible()
    await expect(page.getByTestId('edit-session-route-tabs')).toHaveCount(0)
    await expect(page.getByTestId('edit-session-chat-input')).toHaveCount(0)
    await expect(page.getByTestId('editor-header')).toContainText(fixture.edit.editName ?? '')
    await expectNoHorizontalOverflow(page)
  })

  test('creates a named edit without starting upload, planning, credits, or generation', async ({ page }) => {
    await setViewport(page, 1440)
    await gotoRoute(page, '/projects/new')
    await page.getByLabel('Project name').fill(`Project handoff ${Date.now()}`)
    await page.getByRole('button', { name: /^Create project$/i }).click()
    await expect(page).toHaveURL(/\/projects\/[^/]+$/)

    await page.getByRole('button', { name: /^New edit$/i }).first().click()
    const dialog = page.getByRole('dialog', { name: 'Name this edit' })
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText('Uses your saved edit preferences, then opens upload.')
    await expect(dialog).not.toContainText(/upload started|plan created|credits? (reserved|spent)|generation started/i)
    await page.getByLabel('Edit name').fill('Current architecture handoff')
    await dialog.getByRole('button', { name: /^Create edit$/i }).click()

    await expect(page).toHaveURL(/\/projects\/[^/]+\/edits\/[^/?]+/)
    await expect(page.getByTestId('edit-upload-gate')).toBeVisible()
    await expect(page.getByTestId('editor-header')).toContainText('Current architecture handoff')
    await expectNoGenerationBeforeApproval(page)
    await expectNoHorizontalOverflow(page)
  })
})
