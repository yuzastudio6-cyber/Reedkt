import { expect, test, type Route } from '@playwright/test'

import { validEmptyStoryWorkspaceDto } from '../../src/lib/motion-studio/contracts'
import type { MotionStudioProductionDto, MotionStudioStoryWorkspaceDto } from '../../src/types/motion-studio'
import { installActiveProductRouteFixture } from './helpers/active-product'
import { expectNoHorizontalOverflow, setViewport } from './helpers/layout'
import { expectNoGenerationBeforeApproval, gotoRoute } from './helpers/routes'

const apiOrigin = 'http://127.0.0.1:8791'

test.describe('Storytelling contextual workspace navigation', () => {
  test.skip(process.env.MOTION_STUDIO_E2E !== 'true', 'Run with playwright.motion-studio.config.ts so the frontend-safe HTTP boundary is explicit.')

  test('keeps Chat default and opens one exact Storytelling workspace at a time', async ({ page }) => {
    const fixture = await installActiveProductRouteFixture(page, 'storytelling-workspace-navigation', { category: 'storytelling', productWorkflow: 'motion_studio.storytelling' })
    const production = createProduction(fixture.project.id, fixture.edit.editSessionId)
    const storyWorkspace = createEmptyStoryWorkspace(production, fixture.project.id, fixture.edit.editSessionId)
    let productionReads = 0
    let productionCreates = 0

    await page.route(`${apiOrigin}/v1/**`, async (route) => {
      if (isProductionRoute(route.request().url())) {
        if (route.request().method() === 'POST') {
          productionCreates += 1
          return fulfillError(route, 409, 'PRODUCTION_ALREADY_EXISTS')
        }
        productionReads += 1
        return fulfillData(route, { production })
      }
      if (isStoryWorkspaceRoute(route.request().url())) return fulfillData(route, { storyWorkspace })
      return unexpectedRoute(route)
    })

    await setViewport(page, 1440)
    await gotoRoute(page, fixture.editPath)

    const navigation = page.getByRole('navigation', { name: 'Storytelling workspaces' })
    await expect(navigation).toBeVisible()
    await expect(page.getByTestId('editor-header')).toContainText(fixture.edit.editName ?? fixture.project.name)
    await expect(page.getByTestId('editor-header').getByTestId('storytelling-workspace-switcher')).toBeVisible()
    await expect(page.getByTestId('current-edit-preferences-trigger')).toHaveCount(0)
    await expect(page.getByTestId('editor-header')).not.toContainText('Estimate pending')
    await expect(page.getByTestId('storytelling-workspace-chat')).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByTestId('edit-workspace-view-chat')).toHaveCount(0)
    await expect(page.getByTestId('chat-composer-textarea')).toBeVisible()
    expect(new URL(page.url()).searchParams.get('studio')).toBeNull()

    await page.getByTestId('storytelling-workspace-story').click()
    await expect(page).toHaveURL(`${fixture.editPath}?surface=story`)
    await expect(page.getByRole('heading', { exact: true, name: 'Story' })).toBeVisible()
    await expect(page.getByTestId('storytelling-story-state-empty')).toBeVisible()
    await expect(page.getByTestId('chat-composer-textarea')).not.toBeVisible()
    expect(productionCreates).toBe(0)

    await page.reload()
    await expect(page.getByRole('heading', { exact: true, name: 'Story' })).toBeVisible()
    await expect(page.getByTestId('storytelling-workspace-story')).toHaveAttribute('aria-selected', 'true')

    await page.getByTestId('storytelling-workspace-scenes').click()
    await expect(page).toHaveURL(`${fixture.editPath}?surface=scenes`)
    await expect(page.getByRole('heading', { name: 'Scenes & storyboard' })).toBeVisible()

    await page.getByTestId('storytelling-workspace-preview').click()
    await expect(page.getByRole('heading', { exact: true, name: 'Preview' })).toBeVisible()
    await page.goBack()
    await expect(page).toHaveURL(`${fixture.editPath}?surface=scenes`)
    await expect(page.getByRole('heading', { name: 'Scenes & storyboard' })).toBeVisible()
    await page.goForward()
    await expect(page.getByRole('heading', { exact: true, name: 'Preview' })).toBeVisible()

    await page.getByTestId('storytelling-workspace-more').click()
    await page.getByRole('menuitem', { name: 'Timeline' }).click()
    await expect(page).toHaveURL(`${fixture.editPath}?surface=timeline`)
    await expect(page.getByRole('heading', { exact: true, name: 'Timeline' })).toBeVisible()
    await expect(page.getByTestId('storytelling-workspace-more')).toContainText('Timeline')

    await page.getByTestId('storytelling-workspace-chat').click()
    await expect(page).toHaveURL(fixture.editPath)
    await expect(page.getByTestId('chat-composer-textarea')).toBeVisible()

    await gotoRoute(page, `${fixture.editPath}?view=preferences`)
    await expect(page.getByTestId('storytelling-workspace-switcher')).toBeVisible()
    await expect(page.getByTestId('storytelling-workspace-chat')).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByTestId('edit-workspace-view-chat')).toHaveCount(0)
    await expect(page.getByTestId('current-edit-preferences-workspace')).toHaveCount(0)
    await expectNoGenerationBeforeApproval(page)
    await expectNoHorizontalOverflow(page)
    expect(productionReads).toBeGreaterThan(0)
    expect(productionCreates).toBe(0)
  })

  test('fails closed on a missing production in Chat and non-Chat surfaces without a route-side create', async ({ page }) => {
    const fixture = await installActiveProductRouteFixture(page, 'storytelling-workspace-prepare', { category: 'storytelling', productWorkflow: 'motion_studio.storytelling' })
    let createCount = 0
    let readCount = 0

    await page.route(`${apiOrigin}/v1/**`, async (route) => {
      const request = route.request()
      if (isProductionRoute(request.url())) {
        if (request.method() === 'POST') {
          createCount += 1
        } else {
          readCount += 1
        }
        return fulfillError(route, 404, 'MOTION_STUDIO_NOT_FOUND', 'No private Storytelling production exists yet.')
      }
      return unexpectedRoute(route)
    })

    await setViewport(page, 1280)
    await gotoRoute(page, fixture.editPath)
    await expect(page.getByTestId('storytelling-workspace-entry-not-found')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Storytelling project not found' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Start Storytelling' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Back to Storytelling' })).toBeVisible()

    await gotoRoute(page, `${fixture.editPath}?surface=story`)
    await expect(page.getByTestId('storytelling-workspace-entry-not-found')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Storytelling project not found' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Prepare workspace' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Back to Storytelling' })).toBeVisible()
    expect(readCount).toBeGreaterThanOrEqual(2)
    expect(createCount).toBe(0)
    await expectNoGenerationBeforeApproval(page)
    await expectNoHorizontalOverflow(page)
  })

  test('is keyboard complete, reduced-motion safe, and cannot be enabled by query spoofing', async ({ page }) => {
    const fixture = await installActiveProductRouteFixture(page, 'storytelling-workspace-keyboard', { category: 'storytelling', productWorkflow: 'motion_studio.storytelling' })
    const production = createProduction(fixture.project.id, fixture.edit.editSessionId)
    const storyWorkspace = createEmptyStoryWorkspace(production, fixture.project.id, fixture.edit.editSessionId)
    await page.route(`${apiOrigin}/v1/**`, (route) => {
      if (isProductionRoute(route.request().url())) return fulfillData(route, { production })
      if (isStoryWorkspaceRoute(route.request().url())) return fulfillData(route, { storyWorkspace })
      return unexpectedRoute(route)
    })
    await page.emulateMedia({ reducedMotion: 'reduce' })

    for (const width of [375, 768, 1024, 1280, 1440, 1728, 1920]) {
      await setViewport(page, width, width === 375 ? 812 : 900)
      await gotoRoute(page, fixture.editPath)
      await expect(page.getByRole('tab', { name: 'Chat' })).toBeVisible()
      await expect(page.getByRole('tab', { name: 'Scenes' })).toBeVisible()
      for (const tabName of ['Chat', 'Story', 'Scenes', 'Preview', 'Review']) {
        const tabBounds = await page.getByRole('tab', { exact: true, name: tabName }).boundingBox()
        expect(tabBounds?.width).toBeGreaterThanOrEqual(44)
        expect(tabBounds?.height).toBeGreaterThanOrEqual(44)
      }
      const primaryTablistOverflow = await page.getByRole('tablist', { name: 'Primary Storytelling workspaces' })
        .evaluate((element) => element.scrollWidth - element.clientWidth)
      expect(primaryTablistOverflow).toBeLessThanOrEqual(0)
      const moreBounds = await page.getByTestId('storytelling-workspace-more').boundingBox()
      expect(moreBounds?.width).toBeGreaterThanOrEqual(44)
      expect(moreBounds?.height).toBeGreaterThanOrEqual(44)
      const reviewBounds = await page.getByRole('tab', { exact: true, name: 'Review' }).boundingBox()
      expect(reviewBounds?.x).toBeDefined()
      expect(reviewBounds!.x + reviewBounds!.width).toBeLessThanOrEqual(moreBounds!.x)
      for (const controlId of [
        'chat-composer-attach',
        'chat-composer-reference',
        'chat-composer-send',
      ]) {
        const controlBounds = await page.getByTestId(controlId).boundingBox()
        expect(controlBounds?.width).toBeGreaterThanOrEqual(44)
        expect(controlBounds?.height).toBeGreaterThanOrEqual(44)
      }
      const signOutBounds = await page.getByRole('button', { name: 'Sign out' }).boundingBox()
      expect(signOutBounds?.height).toBeGreaterThanOrEqual(44)
      const chatTab = page.getByTestId('storytelling-workspace-chat')
      await chatTab.focus()
      await chatTab.press('ArrowRight')
      await expect(page.getByTestId('storytelling-workspace-story')).toBeFocused()
      await expect(page).toHaveURL(`${fixture.editPath}?surface=story`)
      await expectNoHorizontalOverflow(page)
    }

    await page.getByTestId('storytelling-workspace-more').focus()
    await page.getByTestId('storytelling-workspace-more').press('ArrowDown')
    await expect(page.getByRole('menu', { name: 'Advanced Storytelling workspaces' })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: 'Timeline' })).toBeFocused()
    await page.getByRole('menuitem', { name: 'Timeline' }).press('ArrowDown')
    await expect(page.getByRole('menuitem', { name: 'Assets' })).toBeFocused()
    await page.getByRole('menuitem', { name: 'Assets' }).press('End')
    await expect(page.getByRole('menuitem', { name: 'Sources' })).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('menu', { name: 'Advanced Storytelling workspaces' })).toHaveCount(0)
    await expect(page.getByTestId('storytelling-workspace-more')).toBeFocused()

    const duration = await page.getByTestId('storytelling-workspace-story')
      .evaluate((element) => getComputedStyle(element).transitionDuration)
    expect(['0s', '0.001s', '1e-05s']).toContain(duration)

    const normalFixture = await installActiveProductRouteFixture(page, 'storytelling-workspace-spoof', { category: 'lifestyle' })
    await gotoRoute(page, `${normalFixture.editPath}?surface=scenes&category=storytelling`)
    await expect(page.getByTestId('storytelling-workspace-switcher')).toHaveCount(0)
    await expect(page.getByTestId('edit-upload-gate')).toBeVisible()
  })

  test('rejects the retired nested route instead of merging normal Edit Chat with Director Chat', async ({ page }) => {
    const storytellingFixture = await installActiveProductRouteFixture(page, 'storytelling-workspace-compatibility', { category: 'storytelling', productWorkflow: 'motion_studio.storytelling' })
    await page.route(`${apiOrigin}/v1/**`, (route) => fulfillError(route, 404, 'MOTION_STUDIO_NOT_FOUND'))

    const historicalStorytellingPath = `/projects/${storytellingFixture.project.id}/edits/${storytellingFixture.edit.editSessionId}/motion-studio`
    await page.goto(historicalStorytellingPath)
    await expect(page).toHaveURL('/')
    await expect(page.getByTestId('storytelling-workspace-switcher')).toHaveCount(0)
    await expect(page.getByTestId('editor-page')).toHaveCount(0)

    const normalFixture = await installActiveProductRouteFixture(page, 'storytelling-workspace-compatibility-normal', {
      category: 'storytelling',
      productWorkflow: 'video_edit',
    })
    await page.goto(`${normalFixture.editPath}/motion-studio`)
    await expect(page).toHaveURL('/')
    await expect(page.getByTestId('storytelling-workspace-switcher')).toHaveCount(0)
    await expect(page.getByTestId('editor-page')).toHaveCount(0)
  })
})

function createProduction(projectId: string, editSessionId: string): MotionStudioProductionDto {
  return {
    id: '91919191-9191-4191-8191-919191919191',
    projectId,
    editSessionId,
    moduleId: 'storytelling',
    moduleCatalogVersion: 'motion-studio-module-catalog-v1',
    stageProfileId: 'motion-studio-storytelling-stage-profile-v1',
    status: 'draft',
    currentStage: 'director_brief',
    workspaceMode: 'guided',
    defaultProductionMode: 'hybrid_directed',
    userFacingStrategy: "Director's Hybrid",
    recordVersion: 1,
    createdAt: '2026-07-19T13:00:00.000Z',
    updatedAt: '2026-07-19T13:00:00.000Z',
    localCandidateOnly: true,
  }
}

function createEmptyStoryWorkspace(
  production: MotionStudioProductionDto,
  projectId: string,
  editSessionId: string,
): MotionStudioStoryWorkspaceDto {
  return {
    ...structuredClone(validEmptyStoryWorkspaceDto),
    productionId: production.id,
    projectId,
    editSessionId,
  }
}

function isProductionRoute(url: string): boolean {
  return /\/v1\/projects\/[^/]+\/edit-sessions\/[^/]+\/motion-studio$/u.test(new URL(url).pathname)
}

function isStoryWorkspaceRoute(url: string): boolean {
  return /\/v1\/motion-studio\/productions\/[^/]+\/story-workspace$/u.test(new URL(url).pathname)
}

async function fulfillData(route: Route, data: unknown) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ ok: true, statusCode: 200, data, warnings: [], mockOnly: false }),
  })
}

async function fulfillError(route: Route, status: number, code: string, message = code) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify({ ok: false, statusCode: status, error: { code, message }, warnings: [], mockOnly: false }),
  })
}

async function unexpectedRoute(route: Route) {
  await fulfillError(route, 404, 'UNEXPECTED_TEST_ROUTE', route.request().url())
}
