import { expect, test } from '@playwright/test'
import {
  installActiveProductRouteFixture,
  installProductWorkflowSeparationFixture,
} from './helpers/active-product'
import { expectNoHorizontalOverflow, setViewport } from './helpers/layout'
import { clickWhenReady, gotoRoute } from './helpers/routes'

test.describe('Projects and Project Home UI', () => {
  test('keeps project discovery searchable, state-filtered, and calm', async ({ page }) => {
    const fixture = await installActiveProductRouteFixture(page, 'projects-ui')
    await gotoRoute(page, '/projects')

    await expect(page.getByRole('heading', { level: 1, name: 'Projects' })).toBeVisible()
    const sidebar = page.getByRole('navigation', { name: /desktop app navigation/i })
    await expect(sidebar.getByRole('link', { name: 'Projects' })).toHaveAttribute('aria-current', 'page')
    await expect(sidebar.getByRole('link', { name: 'Edit Videos' })).not.toHaveAttribute('aria-current', 'page')
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

  test('keeps normal Edit Chat separate from Motion Studio Storytelling', async ({ page }) => {
    const fixture = await installProductWorkflowSeparationFixture(page, 'workflow-separation')

    await gotoRoute(page, '/projects')
    await expect(page.getByText('Normal Storytelling Project')).toBeVisible()
    await expect(page.getByText('Legacy Prefix Video Project')).toBeVisible()
    await expect(page.getByText('Motion Storytelling Project')).toBeVisible()

    await gotoRoute(page, `/projects/${fixture.motionEdit.projectId}`)
    const motionEditCard = page.locator('.project-edit-card').filter({
      hasText: fixture.motionEdit.editName ?? '',
    })
    await expect(motionEditCard).toBeVisible()
    await expect(motionEditCard.getByRole('link')).toHaveAttribute('href', fixture.motionEdit.editorPath)

    await gotoRoute(page, '/edit-videos')

    await expect(page.getByRole('heading', { level: 1, name: 'Edit Videos' })).toBeVisible()
    await expect(page.getByText(fixture.normalEdit.editName ?? '')).toBeVisible()
    await expect(page.getByText(fixture.legacyPrefixEdit.editName ?? '')).toBeVisible()
    await expect(page.getByText(fixture.motionEdit.editName ?? '')).toHaveCount(0)
    await expect(page.getByText('Normal Storytelling Project')).toBeVisible()
    await expect(page.getByText('Legacy Prefix Video Project')).toBeVisible()
    await expect(page.getByText('Motion Storytelling Project')).toHaveCount(0)

    const normalEditCard = page.getByTestId('video-edit-card').filter({
      hasText: fixture.normalEdit.editName ?? '',
    })
    await normalEditCard.getByRole('link', { name: 'Open Edit Chat' }).click()
    await expect(page).toHaveURL(new RegExp(`${fixture.normalEdit.editorPath}(?:\\?.*)?$`))
    await expect(page.getByTestId('editor-page')).toBeVisible()
    await expect(page.getByTestId('editor-header')).toContainText(fixture.normalEdit.editName ?? '')
    await expect(page.getByRole('navigation', { name: /desktop app navigation/i })
      .getByRole('link', { name: 'Edit Videos' })).toHaveAttribute('aria-current', 'page')
    await expect(page).not.toHaveURL(/\/motion-studio(?:\/|$)/)

    await gotoRoute(page, '/edit-videos')
    const legacyPrefixCard = page.getByTestId('video-edit-card').filter({
      hasText: fixture.legacyPrefixEdit.editName ?? '',
    })
    await expect(legacyPrefixCard).toBeVisible()
    await legacyPrefixCard.getByRole('link', { name: 'Open Edit Chat' }).click()
    await expect(page).toHaveURL(new RegExp(
      `/projects/${fixture.legacyPrefixEdit.projectId}/edits/${fixture.legacyPrefixEdit.editSessionId}(?:\\?.*)?$`,
    ))
    await expect(page.getByTestId('editor-page')).toBeVisible()
    await expect(page).not.toHaveURL(/\/motion-studio(?:\/|$)/)
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
    await expect(page.getByRole('button', { name: 'New video edit' })).toBeVisible()
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
    await clickWhenReady(page.getByRole('button', { name: /^New video edit$/i }).first())
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
