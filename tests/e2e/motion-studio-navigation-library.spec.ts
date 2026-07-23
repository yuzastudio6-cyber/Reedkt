import { expect, test, type Page, type Route } from '@playwright/test'

import {
  buildLocalProjectHandoffStorageKey,
  createLocalInternalProjectHandoff,
  type LocalInternalProjectHandoff,
} from '../../src/lib/local-project-handoff'
import {
  buildLocalProjectStorageKey,
  createLocalProjectRecord,
  type LocalProjectRecord,
} from '../../src/lib/local-projects'
import { createProjectPersistenceScopeFingerprint } from '../../src/lib/project-persistence-scope'
import {
  buildStorytellingLibraryCreateJournalStorageKey,
  STORYTELLING_CREATE_JOURNAL_VERSION,
} from '../../src/lib/motion-studio/storytelling/library-create'
import { activeProductLocalTestScope } from './helpers/active-product'
import { expectNoHorizontalOverflow, setViewport } from './helpers/layout'
import { expectNoGenerationBeforeApproval, gotoRoute } from './helpers/routes'
import type { MotionStudioProductionDto } from '../../src/types/motion-studio'

const projectStorageKey = buildLocalProjectStorageKey(activeProductLocalTestScope)
const handoffStorageKey = buildLocalProjectHandoffStorageKey(activeProductLocalTestScope)
const pendingCreateStorageKey = buildStorytellingLibraryCreateJournalStorageKey(activeProductLocalTestScope)
const apiOrigin = 'http://127.0.0.1:8791'

test.describe('Motion Studio native sidebar and Storytelling library', () => {
  test.beforeEach(async ({ page }) => {
    await page.route(`${apiOrigin}/v1/internal-edit-states**`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, data: { internalEditStates: [] }, warnings: [] }),
      })
    })
    await page.route(
      `${apiOrigin}/v1/projects/*/edit-sessions/*/motion-studio`,
      async (route) => {
        const match = /^\/v1\/projects\/([^/]+)\/edit-sessions\/([^/]+)\/motion-studio$/u
          .exec(new URL(route.request().url()).pathname)
        if (!match) return route.abort()
        const production = storytellingProduction(
          decodeURIComponent(match[1]),
          decodeURIComponent(match[2]),
        )
        await route.fulfill({
          status: route.request().method() === 'POST' ? 201 : 200,
          contentType: 'application/json',
          body: JSON.stringify({ ok: true, data: { production }, warnings: [] }),
        })
      },
    )
  })

  test('opens Motion Studio from the shared sidebar and keeps Storytelling inside it', async ({ page }) => {
    await setViewport(page, 1440)
    await gotoRoute(page, '/dashboard')

    const motionStudioLink = page.getByRole('link', { name: 'Motion Studio' })
    await expect(motionStudioLink).toHaveAttribute('href', '/motion-studio')
    await motionStudioLink.click()

    await expect(page).toHaveURL('/motion-studio')
    await expect(motionStudioLink).toHaveAttribute('aria-current', 'page')
    await expect(page.getByRole('heading', { level: 1, name: 'Motion Studio' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Choose a workflow' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Storytelling' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Logo Animation' })).toHaveCount(0)
    await expect(page.getByRole('heading', { name: 'Intro & Outro' })).toHaveCount(0)
    await expect(page.getByText('Coming later')).toHaveCount(0)

    await page.getByRole('button', { name: 'Open Storytelling' }).click()
    await expect(page).toHaveURL('/motion-studio/storytelling')
    await expect(motionStudioLink).toHaveAttribute('aria-current', 'page')
    await expect(page.getByRole('heading', { level: 1, name: 'Motion Studio' })).toHaveCount(0)
    await expect(page.getByRole('heading', { level: 1, name: 'Storytelling' })).toBeVisible()
    await expect(page.getByRole('heading', { level: 2, name: 'No stories yet' })).toBeVisible()
    const emptyStateBox = await page.getByTestId('motion-studio-library-empty').boundingBox()
    expect(emptyStateBox?.width ?? Number.POSITIVE_INFINITY).toBeLessThanOrEqual(900)
    await expectNoHorizontalOverflow(page)
  })

  test('shows Storytelling work from every project and resumes the dedicated Director Chat', async ({ page }) => {
    const fixture = await installStorytellingLibraryFixture(page)
    await setViewport(page, 1440)
    await gotoRoute(page, '/motion-studio/storytelling')

    const library = page.getByTestId('motion-studio-storytelling-library')
    await expect(library).toBeVisible()
    await expect(library).toContainText('2 stories')
    await expect(library.getByRole('heading', { level: 2, name: fixture.first.editName })).toBeVisible()
    await expect(library.getByRole('heading', { level: 2, name: fixture.second.editName })).toBeVisible()
    await expect(library).toContainText(fixture.first.projectName)
    await expect(library).toContainText(fixture.second.projectName)

    await page
      .getByTestId(`motion-studio-story-${fixture.second.editSessionId}`)
      .getByRole('button', { name: 'Continue in Director Chat' })
      .click()

    await expect.poll(() => new URL(page.url()).pathname).toBe(fixture.second.editorPath)
    expect(new URL(page.url()).searchParams.get('projectId')).toBeNull()
    expect(new URL(page.url()).searchParams.get('editSessionId')).toBeNull()
    await expect(page.getByRole('heading', { level: 1, name: fixture.second.editName })).toBeVisible({ timeout: 30_000 })
    await expect(page.getByTestId('storytelling-workspace-switcher')).toBeVisible()
    await expect(page.getByTestId('current-edit-preferences-trigger')).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'Back to Storytelling library' })).toHaveAttribute(
      'href',
      '/motion-studio/storytelling',
    )
    await expectNoGenerationBeforeApproval(page)
  })

  test('redirects an explicit Motion edit only after the exact production tuple is reverified', async ({ page }) => {
    const fixture = await installStorytellingLibraryFixture(page)
    let productionReadCount = 0
    let productionCreateCount = 0
    page.on('request', (request) => {
      const pathname = new URL(request.url()).pathname
      if (pathname !== `/v1/projects/${fixture.first.projectId}/edit-sessions/${fixture.first.editSessionId}/motion-studio`) {
        return
      }
      if (request.method() === 'GET') productionReadCount += 1
      if (request.method() === 'POST') productionCreateCount += 1
    })

    await gotoRoute(
      page,
      `/projects/${fixture.first.projectId}/edits/${fixture.first.editSessionId}`,
    )

    await expect.poll(() => new URL(page.url()).pathname).toBe(fixture.first.editorPath)
    await expect(page.getByRole('heading', { level: 1, name: fixture.first.editName })).toBeVisible()
    expect(productionReadCount).toBeGreaterThanOrEqual(1)
    expect(productionCreateCount).toBe(0)
  })

  test('fails closed without recreating a missing production from the normal named-edit route', async ({ page }) => {
    const fixture = await installStorytellingLibraryFixture(page)
    let productionCreateCount = 0
    const productionPath = `${apiOrigin}/v1/projects/${fixture.first.projectId}/edit-sessions/${fixture.first.editSessionId}/motion-studio`
    await page.route(productionPath, async (route) => {
      if (route.request().method() === 'POST') productionCreateCount += 1
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: false,
          error: { code: 'MOTION_PRODUCTION_NOT_FOUND', message: 'The exact Storytelling production was not found.' },
          warnings: [],
        }),
      })
    })

    await gotoRoute(
      page,
      `/projects/${fixture.first.projectId}/edits/${fixture.first.editSessionId}`,
    )

    await expect(page.getByTestId('storytelling-route-verification-not-found')).toBeVisible()
    await expect(page.getByText('No normal Edit Chat, replacement production, planning, generation, or credit action was started.')).toBeVisible()
    await expect(page.getByTestId('editor-page')).toHaveCount(0)
    expect(new URL(page.url()).pathname).toBe(
      `/projects/${fixture.first.projectId}/edits/${fixture.first.editSessionId}`,
    )
    expect(productionCreateCount).toBe(0)
  })

  test('keeps a prefix-only retained edit in normal Edit Chat and out of Storytelling', async ({ page }) => {
    const project = projectRecord(
      'legacy-prefix-normal-project',
      'Prefix-only normal project',
      '2026-07-18T12:00:00.000Z',
    )
    const editSessionId = 'storytelling-edit-prefix-only-normal'
    const legacyPrefixEdit: LocalInternalProjectHandoff = {
      id: editSessionId,
      workspaceId: activeProductLocalTestScope.workspaceId,
      projectId: project.id,
      editSessionId,
      projectName: project.name,
      editName: 'Prefix-only normal edit',
      category: 'storytelling',
      editorPath: `/motion-studio/storytelling/projects/${project.id}/edits/${editSessionId}`,
      stage: 'created',
      sourceFileCount: 0,
      createdAt: '2026-07-18T12:00:00.000Z',
      updatedAt: '2026-07-18T12:00:00.000Z',
      persistence: 'browser_local_internal_testing',
    }
    let productionRequestCount = 0
    page.on('request', (request) => {
      if (new URL(request.url()).pathname.includes(`/edit-sessions/${editSessionId}/motion-studio`)) {
        productionRequestCount += 1
      }
    })
    await installLibraryStorage(page, [project], [legacyPrefixEdit])

    await gotoRoute(page, '/motion-studio/storytelling')
    await expect(page.getByRole('heading', { level: 2, name: 'No stories yet' })).toBeVisible()
    await expect(page.getByText(legacyPrefixEdit.editName ?? '')).toHaveCount(0)

    await gotoRoute(page, `/projects/${project.id}/edits/${editSessionId}`)
    await expect(page.getByTestId('editor-page')).toBeVisible()
    await expect(page.getByTestId('editor-header')).toContainText(legacyPrefixEdit.editName ?? '')
    await expect(page).not.toHaveURL(/\/motion-studio(?:\/|$)/)
    expect(productionRequestCount).toBe(0)
  })

  test('creates one canonical project and named edit, then opens its Storytelling Director Chat', async ({ page }) => {
    const projectId = 'project-storytelling-create-smoke'
    await page.route(`${apiOrigin}/v1/projects`, async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          data: {
            project: {
              id: projectId,
              name: 'The hidden operation',
              workspaceId: activeProductLocalTestScope.workspaceId,
              createdByUserId: activeProductLocalTestScope.userId,
            },
          },
          warnings: [],
        }),
      })
    })
    await page.route(`${apiOrigin}/v1/projects/${projectId}/internal-edit-state`, async (route) => {
      const body = route.request().postDataJSON() as { handoff: LocalInternalProjectHandoff }
      await fulfillInternalEditState(route, projectId, body.handoff)
    })
    await installEmptyLibraryFixture(page)
    await setViewport(page, 1280)
    await gotoRoute(page, '/motion-studio/storytelling')

    await expect(page.getByTestId('motion-studio-library-empty')).toBeVisible()
    await page.getByRole('button', { name: 'Create storytelling' }).click()
    const storyName = 'The hidden operation'
    await page.getByRole('textbox', { name: 'Story name' }).fill(storyName)
    await page.getByRole('button', { name: 'Create and open Director Chat' }).click()

    await expect.poll(() => new URL(page.url()).pathname).toMatch(
      new RegExp(`/motion-studio/storytelling/projects/${projectId}/edits/[^/?]+$`),
    )
    await expect(page.getByRole('heading', { level: 1, name: storyName })).toBeVisible()
    await expect(page.getByTestId('storytelling-director-start')).toBeVisible()
    await expect(page.getByTestId('storytelling-workspace-switcher')).toBeVisible()

    const stored = await page.evaluate(({ handoffKey, projectKey }) => {
      const projects = JSON.parse(window.localStorage.getItem(projectKey) ?? '{}') as {
        projects?: LocalProjectRecord[]
      }
      const handoffs = JSON.parse(window.localStorage.getItem(handoffKey) ?? '{}') as {
        handoffs?: LocalInternalProjectHandoff[]
      }
      return {
        handoff: handoffs.handoffs?.find((item) => item.editName === 'The hidden operation'),
        project: projects.projects?.find((item) => item.name === 'The hidden operation'),
      }
    }, { handoffKey: handoffStorageKey, projectKey: projectStorageKey })

    expect(stored.project).toMatchObject({ category: 'storytelling', name: storyName })
    expect(stored.handoff).toMatchObject({
      category: 'storytelling',
      editName: storyName,
      productWorkflow: 'motion_studio.storytelling',
      projectId: stored.project?.id,
      projectName: storyName,
      stage: 'created',
    })
    expect(stored.handoff?.setup?.preferenceDefaultsApplied).toBe(true)
    await expectNoGenerationBeforeApproval(page)
    await expectNoHorizontalOverflow(page)
  })

  test('publishes no browser edit before backend readback and retries the exact Project/Edit tuple', async ({ page }) => {
    const projectId = 'project-storytelling-durable-smoke'
    let projectCreateCalls = 0
    const projectIdempotencyKeys: string[] = []
    const handoffBodies: Array<{ handoff: LocalInternalProjectHandoff }> = []

    await page.route(`${apiOrigin}/v1/projects`, async (route) => {
      projectCreateCalls += 1
      projectIdempotencyKeys.push(route.request().headers()['idempotency-key'] ?? '')
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          data: {
            project: {
              id: projectId,
              name: 'Durable retry story',
              workspaceId: activeProductLocalTestScope.workspaceId,
              createdByUserId: activeProductLocalTestScope.userId,
            },
          },
          warnings: [],
        }),
      })
    })
    await page.route(`${apiOrigin}/v1/projects/${projectId}/internal-edit-state`, async (route) => {
      const body = route.request().postDataJSON() as { handoff: LocalInternalProjectHandoff }
      handoffBodies.push(body)
      if (handoffBodies.length === 1) {
        await route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({
            ok: false,
            error: { code: 'INJECTED_RECOVERY_FAILURE', message: 'Account recovery save was interrupted.' },
            warnings: [],
          }),
        })
        return
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          data: {
            internalEditState: {
              userId: activeProductLocalTestScope.userId,
              workspaceId: activeProductLocalTestScope.workspaceId,
              projectId,
              editSessionId: body.handoff.editSessionId,
              handoff: body.handoff,
              updatedAt: body.handoff.updatedAt,
            },
          },
          warnings: [],
        }),
      })
    })

    await installEmptyLibraryFixture(page)
    await gotoRoute(page, '/motion-studio/storytelling')
    await page.getByRole('button', { name: 'Create storytelling' }).click()
    await page.getByRole('textbox', { name: 'Story name' }).fill('Durable retry story')
    await page.getByRole('button', { name: 'Create and open Director Chat' }).click()

    await expect(page.getByRole('alert')).toContainText('Account recovery save was interrupted.')
    await expect(page).toHaveURL('/motion-studio/storytelling')
    const afterFailure = await readStorytellingBrowserRecords(page, 'Durable retry story')
    expect(afterFailure).toEqual({ project: undefined, handoff: undefined })
    expect(projectCreateCalls).toBe(1)
    expect(handoffBodies).toHaveLength(1)

    await page.reload()
    const pendingCreate = page.getByTestId('motion-studio-library-pending-create')
    await expect(pendingCreate).toContainText('Finish creating “Durable retry story”')
    await expect(page.getByRole('heading', { level: 2, name: 'No stories yet' })).toHaveCount(0)
    await pendingCreate.getByRole('button', { name: 'Resume creation' }).click()
    const expectedEditorPathname = new URL(
      handoffBodies[0]!.handoff.editorPath,
      'http://127.0.0.1',
    ).pathname
    await expect.poll(() => new URL(page.url()).pathname).toBe(expectedEditorPathname)
    expect(projectCreateCalls).toBe(2)
    expect(projectIdempotencyKeys[0]).toBeTruthy()
    expect(projectIdempotencyKeys[1]).toBe(projectIdempotencyKeys[0])
    expect(handoffBodies).toHaveLength(2)
    expect(handoffBodies[1]!.handoff).toEqual(handoffBodies[0]!.handoff)

    const afterRecovery = await readStorytellingBrowserRecords(page, 'Durable retry story')
    expect(afterRecovery.project).toMatchObject({ id: projectId, category: 'storytelling' })
    expect(afterRecovery.handoff).toEqual(handoffBodies[0]!.handoff)
    await expectNoGenerationBeforeApproval(page)
  })

  test('revalidates a retained local-only create when the backend becomes available', async ({ page }) => {
    const storyName = 'Backend became available'
    const createIntentId = 'intent-stale-local-journal-smoke'
    const backendProjectId = 'project-stale-local-journal-smoke'
    const journal = createLocalOnlyStorytellingCreateJournal(storyName, createIntentId)
    let projectCreateCalls = 0
    let persistedHandoff: LocalInternalProjectHandoff | undefined

    await page.route(`${apiOrigin}/v1/projects`, async (route) => {
      projectCreateCalls += 1
      expect(route.request().headers()['idempotency-key']).toContain(createIntentId)
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          data: {
            project: {
              id: backendProjectId,
              name: storyName,
              workspaceId: activeProductLocalTestScope.workspaceId,
              createdByUserId: activeProductLocalTestScope.userId,
            },
          },
          warnings: [],
        }),
      })
    })
    await page.route(`${apiOrigin}/v1/projects/${backendProjectId}/internal-edit-state`, async (route) => {
      const body = route.request().postDataJSON() as { handoff: LocalInternalProjectHandoff }
      persistedHandoff = body.handoff
      await fulfillInternalEditState(route, backendProjectId, body.handoff)
    })

    await installEmptyLibraryFixture(page)
    await installStorytellingCreateJournal(page, journal)
    await gotoRoute(page, '/motion-studio/storytelling')
    await expect(page.getByTestId('motion-studio-library-pending-create')).toContainText(storyName)
    await page.getByRole('button', { name: 'Resume creation' }).click()

    await expect.poll(() => new URL(page.url()).pathname).toBe(
      `/motion-studio/storytelling/projects/${backendProjectId}/edits/${journal.attempt.handoff.editSessionId}`,
    )
    expect(projectCreateCalls).toBe(1)
    expect(persistedHandoff).toMatchObject({
      projectId: backendProjectId,
      editSessionId: journal.attempt.handoff.editSessionId,
      category: 'storytelling',
    })
    const stored = await readStorytellingBrowserRecords(page, storyName)
    expect(stored.project).toMatchObject({ id: backendProjectId, category: 'storytelling' })
    expect(stored.handoff).toMatchObject({ projectId: backendProjectId })
    await expect.poll(() => page.evaluate((key) => window.localStorage.getItem(key), pendingCreateStorageKey)).toBeNull()
  })

  test('fails closed on an unknown project response and retries the same create intent', async ({ page }) => {
    const projectId = 'project-storytelling-unknown-retry-smoke'
    let projectCreateCalls = 0
    const idempotencyKeys: string[] = []

    await page.route(`${apiOrigin}/v1/projects`, async (route) => {
      projectCreateCalls += 1
      idempotencyKeys.push(route.request().headers()['idempotency-key'] ?? '')
      if (projectCreateCalls === 1) {
        await route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({
            ok: false,
            error: { code: 'UNKNOWN_PROJECT_OUTCOME', message: 'The response was lost.' },
            warnings: [],
          }),
        })
        return
      }
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          data: {
            project: {
              id: projectId,
              name: 'Unknown outcome story',
              workspaceId: activeProductLocalTestScope.workspaceId,
              createdByUserId: activeProductLocalTestScope.userId,
            },
          },
          warnings: [],
        }),
      })
    })
    await page.route(`${apiOrigin}/v1/projects/${projectId}/internal-edit-state`, async (route) => {
      const body = route.request().postDataJSON() as { handoff: LocalInternalProjectHandoff }
      await fulfillInternalEditState(route, projectId, body.handoff)
    })

    await installEmptyLibraryFixture(page)
    await gotoRoute(page, '/motion-studio/storytelling')
    await page.getByRole('button', { name: 'Create storytelling' }).click()
    await page.getByRole('textbox', { name: 'Story name' }).fill('Unknown outcome story')
    await page.getByRole('button', { name: 'Create and open Director Chat' }).click()

    await expect(page.getByRole('alert')).toContainText('could not be confirmed')
    await expect(page).toHaveURL('/motion-studio/storytelling')
    await expect.poll(() => readStorytellingBrowserRecords(page, 'Unknown outcome story')).toEqual({
      project: undefined,
      handoff: undefined,
    })

    await page.getByRole('button', { name: 'Create and open Director Chat' }).click()
    await expect.poll(() => new URL(page.url()).pathname).toMatch(
      new RegExp(`/motion-studio/storytelling/projects/${projectId}/edits/[^/?]+$`),
    )
    expect(projectCreateCalls).toBe(2)
    expect(idempotencyKeys[0]).toBeTruthy()
    expect(idempotencyKeys[1]).toBe(idempotencyKeys[0])
    await expectNoGenerationBeforeApproval(page)
  })

  test('blocks a tampered create journal without publishing or starting another story', async ({ page }) => {
    const projectId = 'project-storytelling-tampered-journal-smoke'
    let projectCreateCalls = 0
    let handoffPersistCalls = 0

    await page.route(`${apiOrigin}/v1/projects`, async (route) => {
      projectCreateCalls += 1
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          data: {
            project: {
              id: projectId,
              name: 'Tampered journal story',
              workspaceId: activeProductLocalTestScope.workspaceId,
              createdByUserId: activeProductLocalTestScope.userId,
            },
          },
          warnings: [],
        }),
      })
    })
    await page.route(`${apiOrigin}/v1/projects/${projectId}/internal-edit-state`, async (route) => {
      handoffPersistCalls += 1
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: false,
          error: { code: 'INJECTED_RECOVERY_FAILURE', message: 'Account recovery save was interrupted.' },
          warnings: [],
        }),
      })
    })

    await installEmptyLibraryFixture(page)
    await gotoRoute(page, '/motion-studio/storytelling')
    await page.getByRole('button', { name: 'Create storytelling' }).click()
    await page.getByRole('textbox', { name: 'Story name' }).fill('Tampered journal story')
    await page.getByRole('button', { name: 'Create and open Director Chat' }).click()
    await expect(page.getByRole('alert')).toContainText('Account recovery save was interrupted.')

    await page.evaluate((key) => {
      const envelope = JSON.parse(window.localStorage.getItem(key) ?? '{}') as {
        attempt?: { handoff?: { setup?: Record<string, unknown> } }
      }
      if (!envelope.attempt?.handoff) throw new Error('Expected a retained handoff journal fixture.')
      envelope.attempt.handoff.setup = {
        ...envelope.attempt.handoff.setup,
        callerAssertedApproval: true,
      }
      window.localStorage.setItem(key, JSON.stringify(envelope))
    }, pendingCreateStorageKey)
    await page.reload()

    await expect(page.getByTestId('motion-studio-library-pending-create-blocked')).toContainText(
      'Story creation recovery is blocked',
    )
    await expect(page.getByRole('button', { name: 'Resume creation' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Create storytelling' })).toHaveCount(0)
    await expect.poll(() => readStorytellingBrowserRecords(page, 'Tampered journal story')).toEqual({
      project: undefined,
      handoff: undefined,
    })
    expect(projectCreateCalls).toBe(1)
    expect(handoffPersistCalls).toBe(1)
  })

  test('discards malformed local recovery data and restores keyboard focus without deleting account work', async ({ page }) => {
    await installEmptyLibraryFixture(page)
    await page.addInitScript((key) => {
      window.localStorage.setItem(key, JSON.stringify({
        schemaVersion: 'motion-studio-storytelling-create-journal-v0',
        savedAt: '2026-07-21T12:00:00.000Z',
      }))
    }, pendingCreateStorageKey)
    await gotoRoute(page, '/motion-studio/storytelling')

    const blocked = page.getByTestId('motion-studio-library-pending-create-blocked')
    await expect(blocked).toContainText('could not be verified')
    const discard = blocked.getByRole('button', { name: 'Discard invalid recovery data' })
    await discard.focus()
    await discard.press('Enter')

    await expect.poll(() => page.evaluate((key) => window.localStorage.getItem(key), pendingCreateStorageKey)).toBeNull()
    await expect(page.getByRole('heading', { level: 1, name: 'Storytelling' })).toBeFocused()
    await expect(page.getByTestId('motion-studio-library-empty')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Create storytelling' })).toBeVisible()
  })

  test('lets access denial purge and replace a retained pending create without exposing its name', async ({ page }) => {
    const storyName = 'Private pending title'
    const journal = createLocalOnlyStorytellingCreateJournal(storyName, 'intent-access-denied-journal-smoke')
    await page.route(`${apiOrigin}/v1/internal-edit-states**`, async (route) => {
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: false,
          error: { code: 'WORKSPACE_ACCESS_DENIED', message: 'Workspace access was denied.' },
          warnings: [],
        }),
      })
    })
    await installEmptyLibraryFixture(page)
    await installStorytellingCreateJournal(page, journal)
    await gotoRoute(page, '/motion-studio/storytelling')

    await expect(page.getByTestId('motion-studio-library-access-denied')).toBeVisible()
    await expect(page.getByText(storyName)).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Resume creation' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Create storytelling' })).toHaveCount(0)
    await expect.poll(() => page.evaluate((key) => window.localStorage.getItem(key), pendingCreateStorageKey)).toBeNull()
  })

  test('does not publish a pending story after its Storytelling workspace unmounts', async ({ page }) => {
    const projectId = 'project-storytelling-unmount-smoke'
    let allowRecovery = false
    let persistenceCompleted = false
    let releasePersistence!: () => void
    const persistenceGate = new Promise<void>((resolve) => {
      releasePersistence = resolve
    })
    const persistedHandoffs: LocalInternalProjectHandoff[] = []

    await page.route(`${apiOrigin}/v1/internal-edit-states**`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          data: {
            internalEditStates: allowRecovery
              ? persistedHandoffs.map((handoff) => ({
                  userId: activeProductLocalTestScope.userId,
                  workspaceId: activeProductLocalTestScope.workspaceId,
                  projectId: handoff.projectId,
                  editSessionId: handoff.editSessionId,
                  handoff,
                  updatedAt: handoff.updatedAt,
                }))
              : [],
          },
          warnings: [],
        }),
      })
    })

    await page.route(`${apiOrigin}/v1/projects`, async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          data: {
            project: {
              id: projectId,
              name: 'Unmounted story',
              workspaceId: activeProductLocalTestScope.workspaceId,
              createdByUserId: activeProductLocalTestScope.userId,
            },
          },
          warnings: [],
        }),
      })
      persistenceCompleted = true
    })
    await page.route(`${apiOrigin}/v1/projects/${projectId}/internal-edit-state`, async (route) => {
      const body = route.request().postDataJSON() as { handoff: LocalInternalProjectHandoff }
      persistedHandoffs.push(body.handoff)
      await persistenceGate
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          data: {
            internalEditState: {
              userId: activeProductLocalTestScope.userId,
              workspaceId: activeProductLocalTestScope.workspaceId,
              projectId,
              editSessionId: body.handoff.editSessionId,
              handoff: body.handoff,
              updatedAt: body.handoff.updatedAt,
            },
          },
          warnings: [],
        }),
      })
    })

    await installEmptyLibraryFixture(page)
    await gotoRoute(page, '/motion-studio/storytelling')
    await page.getByRole('button', { name: 'Create storytelling' }).click()
    await page.getByRole('textbox', { name: 'Story name' }).fill('Unmounted story')
    await page.getByRole('button', { name: 'Create and open Director Chat' }).click()
    await expect.poll(() => persistedHandoffs.length).toBe(1)

    await page.getByRole('link', { name: 'Home' }).click({ force: true })
    await expect(page).toHaveURL('/dashboard')
    await expect(page.getByTestId('testing-home-hero')).toBeVisible()
    await expect(page.getByTestId('motion-studio-storytelling-library')).toHaveCount(0)
    releasePersistence()
    await expect.poll(() => persistenceCompleted).toBe(true)

    await expect.poll(async () => readStorytellingBrowserRecords(page, 'Unmounted story')).toEqual({
      project: undefined,
      handoff: undefined,
    })
    await expect.poll(() => page.evaluate((key) => Boolean(window.localStorage.getItem(key)), pendingCreateStorageKey)).toBe(true)

    allowRecovery = true
    await gotoRoute(page, '/motion-studio/storytelling')
    await expect(page.getByTestId(`motion-studio-story-${persistedHandoffs[0]!.editSessionId}`)).toBeVisible()
    await expect(page.getByTestId('motion-studio-library-pending-create')).toHaveCount(0)
    await expect.poll(() => page.evaluate((key) => window.localStorage.getItem(key), pendingCreateStorageKey)).toBeNull()
    const recovered = await readStorytellingBrowserRecords(page, 'Unmounted story')
    expect(recovered.project).toMatchObject({ id: projectId, category: 'storytelling' })
    expect(recovered.handoff).toEqual(persistedHandoffs[0])
  })

  test('is keyboard reachable, reduced-motion safe, and overflow-free at supported responsive widths', async ({ page }) => {
    const fixture = await installStorytellingLibraryFixture(page)
    await page.emulateMedia({ reducedMotion: 'reduce' })

    for (const width of [375, 640, 768, 1024, 1440]) {
      await setViewport(page, width, width === 375 ? 812 : 900)
      await gotoRoute(page, '/motion-studio')
      const open = page.getByRole('button', { name: 'Open Storytelling' })
      await open.focus()
      await open.press('Enter')
      await expect(page).toHaveURL('/motion-studio/storytelling')
      await expect(page.getByRole('heading', { name: fixture.first.editName })).toBeVisible()
      await expectNoHorizontalOverflow(page)

      if (width === 640) {
        const row = page.getByTestId(`motion-studio-story-${fixture.first.editSessionId}`)
        const titleBox = await row.getByRole('heading', { name: fixture.first.editName }).boundingBox()
        const actionBox = await row.getByRole('button', { name: 'Continue in Director Chat' }).boundingBox()
        expect(titleBox?.width ?? 0).toBeGreaterThan(200)
        expect(actionBox?.y ?? 0).toBeGreaterThan((titleBox?.y ?? 0) + (titleBox?.height ?? 0))
      }

      const back = page.getByRole('button', { name: 'All workflows' })
      const backBox = await back.boundingBox()
      expect(backBox?.height ?? 0).toBeGreaterThanOrEqual(44)
      expect(backBox?.width ?? Number.POSITIVE_INFINITY).toBeLessThanOrEqual(220)
      await back.focus()
      await back.press('Enter')
      await expect(page).toHaveURL('/motion-studio')
      await expect(open).toBeVisible()
    }

    const duration = await page.getByTestId('motion-studio-home')
      .evaluate((element) => getComputedStyle(element).transitionDuration)
    expect(['0s', '0.001s', '1e-05s']).toContain(duration)
  })
})

async function installStorytellingLibraryFixture(page: Page): Promise<{
  first: LocalInternalProjectHandoff
  second: LocalInternalProjectHandoff
}> {
  const firstProject = projectRecord('motion-story-one', 'Operation Northstar', '2026-07-18T10:00:00.000Z')
  const secondProject = projectRecord('motion-story-two', 'The Archive', '2026-07-18T11:00:00.000Z')
  const first = handoffRecord(firstProject, 'edit-story-one', 'Operation Northstar', '2026-07-18T10:30:00.000Z')
  const second = handoffRecord(secondProject, 'edit-story-two', 'Inside the archive', '2026-07-18T11:30:00.000Z')
  await page.route(`${apiOrigin}/v1/internal-edit-states**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        data: {
          internalEditStates: [first, second].map((handoff) => ({
            userId: activeProductLocalTestScope.userId,
            workspaceId: activeProductLocalTestScope.workspaceId,
            projectId: handoff.projectId,
            editSessionId: handoff.editSessionId,
            handoff,
            updatedAt: handoff.updatedAt,
          })),
        },
        warnings: [],
      }),
    })
  })
  await installLibraryStorage(page, [firstProject, secondProject], [first, second])
  return { first, second }
}

async function readStorytellingBrowserRecords(page: Page, name: string) {
  return page.evaluate(({ handoffKey, projectKey, storyName }) => {
    const projects = JSON.parse(window.localStorage.getItem(projectKey) ?? '{}') as {
      projects?: LocalProjectRecord[]
    }
    const handoffs = JSON.parse(window.localStorage.getItem(handoffKey) ?? '{}') as {
      handoffs?: LocalInternalProjectHandoff[]
    }
    return {
      project: projects.projects?.find((item) => item.name === storyName),
      handoff: handoffs.handoffs?.find((item) => item.editName === storyName),
    }
  }, {
    handoffKey: handoffStorageKey,
    projectKey: projectStorageKey,
    storyName: name,
  })
}

function createLocalOnlyStorytellingCreateJournal(name: string, createIntentId: string) {
  const now = new Date('2026-07-21T12:00:00.000Z')
  const scopeFingerprint = createProjectPersistenceScopeFingerprint(activeProductLocalTestScope)
  const project = createLocalProjectRecord({
    category: 'storytelling',
    name,
    projectId: `local-project-${createIntentId}`,
    workspaceId: activeProductLocalTestScope.workspaceId,
    now,
  })
  const handoff = createLocalInternalProjectHandoff({
    category: 'storytelling',
    editName: name,
    editSessionId: `storytelling-edit-${createIntentId}`,
    productWorkflow: 'motion_studio.storytelling',
    projectId: project.id,
    projectName: project.name,
    workspaceId: activeProductLocalTestScope.workspaceId,
    now,
  })
  return {
    schemaVersion: STORYTELLING_CREATE_JOURNAL_VERSION,
    scopeFingerprint,
    attempt: {
      createIntentId,
      normalizedName: name,
      scopeFingerprint,
      backendProjectResolution: 'not_configured' as const,
      project,
      handoff,
    },
    savedAt: now.toISOString(),
  }
}

async function installStorytellingCreateJournal(
  page: Page,
  journal: ReturnType<typeof createLocalOnlyStorytellingCreateJournal>,
) {
  await page.addInitScript(({ key, value }) => {
    window.localStorage.setItem(key, JSON.stringify(value))
  }, { key: pendingCreateStorageKey, value: journal })
}

async function fulfillInternalEditState(
  route: Route,
  projectId: string,
  handoff: LocalInternalProjectHandoff,
) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      ok: true,
      data: {
        internalEditState: {
          userId: activeProductLocalTestScope.userId,
          workspaceId: activeProductLocalTestScope.workspaceId,
          projectId,
          editSessionId: handoff.editSessionId,
          handoff,
          updatedAt: handoff.updatedAt,
        },
      },
      warnings: [],
    }),
  })
}

async function installEmptyLibraryFixture(page: Page) {
  await installLibraryStorage(page, [], [])
}

async function installLibraryStorage(
  page: Page,
  projects: readonly LocalProjectRecord[],
  handoffs: readonly LocalInternalProjectHandoff[],
) {
  const now = '2026-07-18T12:00:00.000Z'
  const scopeFingerprint = createProjectPersistenceScopeFingerprint(activeProductLocalTestScope)
  await page.addInitScript((input) => {
    window.localStorage.setItem(input.projectStorageKey, JSON.stringify({
      recordVersion: 2,
      scope: input.scope,
      scopeFingerprint: input.scopeFingerprint,
      projects: input.projects,
      savedAt: input.now,
    }))
    window.localStorage.setItem(input.handoffStorageKey, JSON.stringify({
      recordVersion: 2,
      scope: input.scope,
      scopeFingerprint: input.scopeFingerprint,
      handoffs: input.handoffs,
      savedAt: input.now,
    }))
  }, {
    handoffs,
    handoffStorageKey,
    now,
    projects,
    projectStorageKey,
    scope: activeProductLocalTestScope,
    scopeFingerprint,
  })
}

function projectRecord(id: string, name: string, updatedAt: string): LocalProjectRecord {
  return {
    id,
    workspaceId: activeProductLocalTestScope.workspaceId,
    name,
    category: 'storytelling',
    createdAt: updatedAt,
    updatedAt,
    persistence: 'browser_scoped_project_registry',
  }
}

function handoffRecord(
  project: LocalProjectRecord,
  editSessionId: string,
  editName: string,
  updatedAt: string,
): LocalInternalProjectHandoff {
  return {
    id: editSessionId,
    workspaceId: activeProductLocalTestScope.workspaceId,
    projectId: project.id,
    editSessionId,
    projectName: project.name,
    editName,
    category: 'storytelling',
    productWorkflow: 'motion_studio.storytelling',
    editorPath: `/motion-studio/storytelling/projects/${project.id}/edits/${editSessionId}`,
    stage: 'created',
    sourceFileCount: 0,
    createdAt: updatedAt,
    updatedAt,
    persistence: 'browser_local_internal_testing',
  }
}

function storytellingProduction(
  projectId: string,
  editSessionId: string,
): MotionStudioProductionDto {
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
    createdAt: '2026-07-18T12:00:00.000Z',
    updatedAt: '2026-07-18T12:00:00.000Z',
    localCandidateOnly: true,
  }
}
