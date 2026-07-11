import { expect, test } from '@playwright/test'
import { installActiveProductRouteFixture } from './helpers/active-product'
import { expectNoHorizontalOverflow } from './helpers/layout'
import { clickWhenReady, gotoRoute } from './helpers/routes'

test.describe('Projects and Project Home UI', () => {
  test('keeps project discovery searchable, state-filtered, and calm', async ({ page }) => {
    const fixture = await installActiveProductRouteFixture(page, 'projects-ui')
    await gotoRoute(page, '/projects')

    await expect(page.getByRole('heading', { level: 1, name: 'Projects' })).toBeVisible()
    const projectCard = page.locator('.projects-card').filter({ hasText: fixture.project.name })
    await expect(projectCard).toBeVisible()
    await expect(projectCard.getByText('Ready for upload')).toBeVisible()
    await expect(page.getByText('1 of 1 project')).toBeVisible()

    const search = page.getByRole('searchbox', { name: 'Search projects' })
    await search.fill('does not exist')
    await expect(page.getByRole('heading', { name: 'No projects match.' })).toBeVisible()
    await page.getByRole('button', { name: 'Clear filters' }).click()
    await expect(search).toHaveValue('')
    await expect(projectCard).toBeVisible()

    const completeFilter = page.getByRole('button', { name: 'Complete' })
    await completeFilter.click()
    await expect(completeFilter).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByRole('heading', { name: 'No projects match.' })).toBeVisible()

    const attentionFilter = page.getByRole('button', { name: 'Needs action' })
    await attentionFilter.click()
    await expect(attentionFilter).toHaveAttribute('aria-pressed', 'true')
    await expect(projectCard).toBeVisible()
    await expectNoHorizontalOverflow(page)
  })

  test('makes the latest project edit the focal next-action surface', async ({ page }) => {
    const fixture = await installActiveProductRouteFixture(page, 'project-home-ui')
    await gotoRoute(page, fixture.projectPath)

    await expect(page.getByRole('heading', { level: 1, name: fixture.project.name })).toBeVisible()
    await expect(page.getByRole('link', { name: 'All projects' })).toBeVisible()
    await expect(page.getByRole('region', { name: 'Defaults for new edits' })).toBeVisible()

    const editCard = page.locator('.project-edit-card.is-featured')
    await expect(editCard).toHaveCount(1)
    await expect(editCard).toContainText(fixture.edit.editName ?? '')
    await expect(editCard.getByText('Source needed')).toBeVisible()
    await expect(editCard.getByRole('link', { name: 'Upload source' })).toBeVisible()
    await expect(page.locator('.badge')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'New edit' })).toBeVisible()
    await expectNoHorizontalOverflow(page)
  })

  test('keeps new-project setup focused, validated, and project-first', async ({ page }) => {
    await gotoRoute(page, '/projects/new')

    await expect(page.getByRole('heading', { level: 1, name: 'New project' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'What are you working on?' })).toBeVisible()
    await expect(page.getByLabel('Project name')).toBeFocused()
    await expect(page.locator('.badge')).toHaveCount(0)

    await clickWhenReady(page.getByRole('button', { name: /^Create project$/i }))
    await expect(page.getByRole('alert')).toContainText('Name the project before creating it.')
    await expect(page).toHaveURL(/\/projects\/new$/)

    await page.getByLabel('Editing context').selectOption('business_brand')
    await expect(page.getByRole('complementary', { name: 'What happens next' })).toContainText('Business / Brand')
    await expect(page.getByRole('complementary', { name: 'What happens next' })).toContainText('Product, offer, SaaS')

    const projectName = `Focused project setup ${Date.now()}`
    await page.getByLabel('Project name').fill(projectName)
    await clickWhenReady(page.getByRole('button', { name: /^Create project$/i }))
    await expect(page).toHaveURL(/\/projects\/[^/]+$/)
    await expect(page.getByRole('heading', { level: 1, name: projectName })).toBeVisible()
    await expectNoHorizontalOverflow(page)
  })
})
