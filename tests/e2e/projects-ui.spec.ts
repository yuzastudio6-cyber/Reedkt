import { expect, test } from '@playwright/test'
import { installActiveProductRouteFixture } from './helpers/active-product'
import { expectNoHorizontalOverflow, setViewport } from './helpers/layout'
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

    const createWorkspace = page.locator('.project-create-workspace')
    const createForm = page.locator('.project-create-form')
    const createContext = page.getByRole('complementary', { name: 'What happens next' })
    const createActions = page.locator('.project-create-actions')
    expect(await createWorkspace.evaluate((element) => getComputedStyle(element).display)).toBe('grid')
    expect(
      await createWorkspace.evaluate((element) => getComputedStyle(element).gridTemplateColumns.trim().split(/\s+/).length),
    ).toBe(2)
    expect(await createForm.evaluate((element) => getComputedStyle(element).display)).toBe('grid')
    expect(await createContext.evaluate((element) => getComputedStyle(element).borderLeftWidth)).toBe('1px')
    expect(await createActions.evaluate((element) => getComputedStyle(element).display)).toBe('flex')

    await setViewport(page, 700)
    expect(
      await createWorkspace.evaluate((element) => getComputedStyle(element).gridTemplateColumns.trim().split(/\s+/).length),
    ).toBe(1)
    expect(await createContext.evaluate((element) => getComputedStyle(element).borderLeftWidth)).toBe('0px')
    expect(await createContext.evaluate((element) => getComputedStyle(element).borderTopWidth)).toBe('1px')
    expect(await createActions.evaluate((element) => getComputedStyle(element).flexDirection)).toBe('column')
    await expectNoHorizontalOverflow(page)
    await setViewport(page, 1440)

    await clickWhenReady(page.getByRole('button', { name: /^Create project$/i }))
    await expect(page.getByRole('alert')).toContainText('Name the project before creating it.')
    await expect(page).toHaveURL(/\/projects\/new$/)

    await page.getByLabel('Editing context').selectOption('business_brand')
    await expect(page.getByRole('complementary', { name: 'What happens next' })).toContainText('Business / Brand')
    await expect(page.getByRole('complementary', { name: 'What happens next' })).toContainText('Product, service, offer')

    const projectName = `Focused project setup ${Date.now()}`
    await page.getByLabel('Project name').fill(projectName)
    await clickWhenReady(page.getByRole('button', { name: /^Create project$/i }))
    await expect(page).toHaveURL(/\/projects\/[^/]+$/)
    await expect(page.getByRole('heading', { level: 1, name: projectName })).toBeVisible()
    await clickWhenReady(page.getByRole('button', { name: /^New edit$/i }).first())
    const newEditDialog = page.getByRole('dialog', { name: 'Name this edit' })
    await expect(newEditDialog).toBeVisible()
    await expect(page.getByLabel('Edit name')).toBeFocused()
    expect(await newEditDialog.evaluate((element) => getComputedStyle(element).position)).toBe('fixed')
    expect(await newEditDialog.evaluate((element) => getComputedStyle(element).display)).toBe('flex')
    expect(await newEditDialog.locator('.clean-modal-panel').evaluate((element) => getComputedStyle(element).display)).toBe('grid')
    await setViewport(page, 480)
    expect(
      await newEditDialog.locator('.clean-create-actions').evaluate((element) => getComputedStyle(element).gridTemplateColumns.trim().split(/\s+/).length),
    ).toBe(1)
    await expectNoHorizontalOverflow(page)
  })
})
