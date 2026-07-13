import { expect, test, type Page } from '@playwright/test'
import {
  buildLocalProjectHandoffStorageKey,
  type LocalInternalProjectHandoff,
} from '../../src/lib/local-project-handoff'
import {
  buildLocalProjectStorageKey,
  type LocalProjectRecord,
} from '../../src/lib/local-projects'
import { createProjectPersistenceScopeFingerprint } from '../../src/lib/project-persistence-scope'
import { expectFloatingComposerAligned, expectNoHorizontalOverflow } from './helpers/layout'
import {
  clickWhenReady,
  completeRequiredEditorSetupBeforeFootagePrep,
  expectNoGenerationBeforeApproval,
  expectNoInternalToolNamesInEditor,
  gotoRoute,
} from './helpers/routes'

const scope = {
  authMode: 'local_test' as const,
  userId: 'local-test-user',
  workspaceId: 'workspace-internal-testing',
}

test.describe('canonical journey named-edit UI bridge', () => {
  test('saves exact planning inputs and keeps approval locked when richer work has no exact graph', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    const fixture = await installSourceReadyNamedEdit(page, 'canonical-plan-save')
    const handoffRequests: Array<Record<string, unknown>> = []
    let candidateRequestCount = 0

    await page.route('**/v1/projects/*/edit-sessions/*/canonical-journey?*', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        status: 404,
        body: JSON.stringify({
          ok: false,
          error: { code: 'PLAN_NOT_APPROVED', message: 'No workflow yet.' },
          warnings: [],
        }),
      })
    })
    await page.route('**/v1/projects/*/edit-sessions/*/canonical-planning-handoff', async (route) => {
      const body = route.request().postDataJSON() as Record<string, unknown>
      handoffRequests.push(body)
      await route.fulfill({
        contentType: 'application/json',
        status: 200,
        body: JSON.stringify({
          ok: true,
          data: {
            canonicalPlanningHandoff: canonicalPlanningHandoffFixture(
              fixture.project.id,
              fixture.edit.editSessionId,
            ),
          },
          warnings: [],
        }),
      })
    })
    await page.route('**/v1/projects/*/edit-sessions/*/canonical-planning-handoffs/*/publication-requests', async (route) => {
      candidateRequestCount += 1
      await route.abort()
    })

    await gotoRoute(page, fixture.editPath)
    await page.getByTestId('chat-composer-textarea').fill(
      'Create a polished founder update with clean captions, restrained color, and clear audio.',
    )
    await clickWhenReady(page.getByTestId('chat-composer-send'))
    await completeRequiredEditorSetupBeforeFootagePrep(page)
    await clickWhenReady(page.getByRole('button', { name: /^Prepare source$/i }))
    await clickWhenReady(page.getByRole('button', { name: /^Create edit plan$/i }))

    const planReview = page.getByTestId('plan-review-card')
    await expect(planReview).toBeVisible()
    await expect.poll(() => handoffRequests.length).toBe(1)
    const saveStatus = page.getByTestId('canonical-planning-save-handoff-saved-waiting-for-compiler')
    await expect(saveStatus).toBeVisible()
    await expect(saveStatus).toContainText('Planning inputs saved')
    await expect(saveStatus).toContainText('Saving never approves credits or starts editing')
    await expect(saveStatus).not.toContainText(/\/v1\/|[a-f0-9]{64}|handoff|candidate|ffmpeg|ffprobe|libass|remotion|provider|filesystem|credential/i)

    const requestBody = JSON.stringify(handoffRequests[0])
    expect(requestBody).not.toMatch(/storagePath|private\/source|signedUrl|publicUrl|sourceBytes|bytesBase64/)
    expect(requestBody).toContain(fixture.edit.sourceMediaAssets![0]!.sourceSequenceItemId!)
    expect(requestBody).toContain(fixture.edit.sourceMediaAssets![0]!.mediaAssetId)
    expect(requestBody).toContain(fixture.edit.sourceMediaAssets![0]!.checksumSha256!)
    expect(candidateRequestCount).toBe(0)

    const approve = page.getByTestId('plan-review-approve')
    await expect(approve).toBeDisabled()
    await expect(approve).toHaveText('Waiting for saved plan')
    await expectNoGenerationBeforeApproval(page)
    await expectNoInternalToolNamesInEditor(page)
    await expectNoHorizontalOverflow(page)
    await expectFloatingComposerAligned(page)
  })

  test('discards a late plan-save result after the named-edit identity changes', async ({ page }) => {
    const firstFixture = createSourceReadyNamedEdit('late-save-route-a')
    const secondFixture = createSourceReadyNamedEdit('late-save-route-b')
    await installSourceReadyNamedEditFixtures(page, [firstFixture, secondFixture])
    let handoffRequestCount = 0
    let releaseHandoff!: () => void
    const handoffGate = new Promise<void>((resolve) => {
      releaseHandoff = resolve
    })

    await page.route('**/v1/projects/*/edit-sessions/*/canonical-journey?*', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        status: 404,
        body: JSON.stringify({
          ok: false,
          error: { code: 'PLAN_NOT_APPROVED', message: 'No workflow yet.' },
          warnings: [],
        }),
      })
    })
    await page.route('**/v1/projects/*/edit-sessions/*/canonical-planning-handoff', async (route) => {
      handoffRequestCount += 1
      await handoffGate
      await route.fulfill({
        contentType: 'application/json',
        status: 200,
        body: JSON.stringify({
          ok: true,
          data: {
            canonicalPlanningHandoff: canonicalPlanningHandoffFixture(
              firstFixture.project.id,
              firstFixture.edit.editSessionId,
            ),
          },
          warnings: [],
        }),
      })
    })

    await gotoRoute(page, firstFixture.editPath)
    await completeRequiredEditorSetupBeforeFootagePrep(page)
    await clickWhenReady(page.getByRole('button', { name: /^Prepare source$/i }))
    await clickWhenReady(page.getByRole('button', { name: /^Create edit plan$/i }))
    await expect.poll(() => handoffRequestCount).toBe(1)
    await expect(page.getByTestId('canonical-planning-save-saving')).toBeVisible()

    await page.evaluate((path) => {
      window.history.pushState({}, '', path)
      window.dispatchEvent(new PopStateEvent('popstate'))
    }, secondFixture.editPath)
    await expect(page).toHaveURL(new RegExp(secondFixture.edit.editSessionId))
    await expect(page.getByRole('heading', { level: 1, name: secondFixture.edit.editName })).toBeVisible()
    await expect(page.locator('[data-testid^="canonical-planning-save-"]')).toHaveCount(0)

    releaseHandoff()
    await page.waitForTimeout(100)
    await expect(page.locator('[data-testid^="canonical-planning-save-"]')).toHaveCount(0)
    await expectNoGenerationBeforeApproval(page)
  })

  test('shows loading, bounded execution progress, and an accessible manual refresh', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    const fixture = await installSourceReadyNamedEdit(page, 'execution-progress')
    let requestCount = 0
    let seenAuthorization = ''
    let releaseFirstResponse!: () => void
    const firstResponseGate = new Promise<void>((resolve) => {
      releaseFirstResponse = resolve
    })

    await page.route('**/v1/projects/*/edit-sessions/*/canonical-journey?*', async (route) => {
      requestCount += 1
      seenAuthorization = await route.request().headerValue('authorization') ?? ''
      if (requestCount === 1) await firstResponseGate
      await route.fulfill({
        contentType: 'application/json',
        status: 200,
        body: JSON.stringify({
          ok: true,
          data: { canonicalEditJourney: executionJourney(fixture.project.id, fixture.edit.editSessionId) },
          warnings: [],
        }),
      })
    })

    await gotoRoute(page, '/dashboard')
    await page.goto(fixture.editPath, { waitUntil: 'domcontentloaded' })
    await expect.poll(() => requestCount).toBe(1)
    await expect(page.getByTestId('canonical-journey-status-loading')).toBeVisible()
    releaseFirstResponse()

    const status = page.getByTestId('canonical-journey-status')
    await expect(status).toBeVisible()
    await expect(status).toHaveAttribute('data-journey-stage', 'execution_in_progress')
    await expect(status).toContainText('Preparing private review')
    await expect(status).toContainText('2 of 4 preparation steps are complete')
    await expect(status).toContainText('does not start editing, spend credits, or publish the video')
    await expect(status).not.toContainText(/\/v1\/|[a-f0-9]{64}|packageRecordId|snapshotId|provider|filesystem|credential/i)

    const progress = status.getByRole('progressbar')
    await expect(progress).toHaveAttribute('aria-valuemin', '0')
    await expect(progress).toHaveAttribute('aria-valuenow', '2')
    await expect(progress).toHaveAttribute('aria-valuemax', '4')

    const refresh = status.getByRole('button', { name: 'Refresh saved workflow status' })
    await expect(refresh).toHaveAttribute('title', 'Refresh saved workflow status')
    await refresh.click()
    await expect.poll(() => requestCount).toBeGreaterThan(1)
    expect(seenAuthorization).toBe('Bearer canonical-journey-playwright-token')

    await expectNoGenerationBeforeApproval(page)
    await expectNoInternalToolNamesInEditor(page)
    await expectNoHorizontalOverflow(page)
    await expectFloatingComposerAligned(page)
  })

  test('fails closed on foreign workflow identity without exposing a retry loop', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 900 })
    const fixture = await installSourceReadyNamedEdit(page, 'foreign-identity')

    await page.route('**/v1/projects/*/edit-sessions/*/canonical-journey?*', async (route) => {
      const journey = executionJourney(fixture.project.id, fixture.edit.editSessionId)
      ;(journey.identity as Record<string, unknown>).workspaceId = 'workspace-foreign'
      await route.fulfill({
        contentType: 'application/json',
        status: 200,
        body: JSON.stringify({
          ok: true,
          data: { canonicalEditJourney: journey },
          warnings: [],
        }),
      })
    })

    await gotoRoute(page, fixture.editPath)
    const rejected = page.getByTestId('canonical-journey-status-invalid-response')
    await expect(rejected).toBeVisible()
    await expect(rejected).toContainText('Saved workflow needs verification')
    await expect(rejected).toContainText('No editing, credit, or publishing action started')
    await expect(rejected.getByRole('button', { name: /Retry saved workflow status/i })).toHaveCount(0)
    await expectNoGenerationBeforeApproval(page)
    await expectNoHorizontalOverflow(page)
    await expectFloatingComposerAligned(page)
  })

  test('clears the prior recovered status when the named-edit identity changes', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    const firstFixture = createSourceReadyNamedEdit('identity-route-a')
    const secondFixture = createSourceReadyNamedEdit('identity-route-b')
    await installSourceReadyNamedEditFixtures(page, [firstFixture, secondFixture])
    let secondRequestCount = 0
    let releaseSecondResponse!: () => void
    const secondResponseGate = new Promise<void>((resolve) => {
      releaseSecondResponse = resolve
    })

    await page.route('**/v1/projects/*/edit-sessions/*/canonical-journey?*', async (route) => {
      const isSecondEdit = route.request().url().includes(secondFixture.edit.editSessionId)
      const fixture = isSecondEdit ? secondFixture : firstFixture
      const journey = executionJourney(fixture.project.id, fixture.edit.editSessionId)
      if (isSecondEdit) {
        secondRequestCount += 1
        journey.workGraphProgress.completedJobCount = 1
        journey.workGraphProgress.pendingJobCount = 3
        journey.workGraphProgress.requiredIncompleteJobCount = 3
        await secondResponseGate
      }
      await route.fulfill({
        contentType: 'application/json',
        status: 200,
        body: JSON.stringify({
          ok: true,
          data: { canonicalEditJourney: journey },
          warnings: [],
        }),
      })
    })

    await gotoRoute(page, firstFixture.editPath)
    const status = page.getByTestId('canonical-journey-status')
    await expect(status).toContainText('2 of 4 preparation steps are complete')

    await page.evaluate((path) => {
      window.history.pushState({}, '', path)
      window.dispatchEvent(new PopStateEvent('popstate'))
    }, secondFixture.editPath)
    await expect.poll(() => secondRequestCount).toBe(1)
    await expect(page.getByTestId('canonical-journey-status-loading')).toBeVisible()
    await expect(status).toHaveCount(0)

    releaseSecondResponse()
    await expect(page.getByTestId('canonical-journey-status')).toContainText('1 of 4 preparation steps are complete')
    await expectNoGenerationBeforeApproval(page)
  })
})

async function installSourceReadyNamedEdit(page: Page, label: string) {
  const fixture = createSourceReadyNamedEdit(label)
  await installSourceReadyNamedEditFixtures(page, [fixture])
  return fixture
}

function createSourceReadyNamedEdit(label: string) {
  const normalized = label.replace(/[^a-z0-9]+/gi, '-').toLowerCase()
  const projectId = `canonical-project-${normalized}`
  const editSessionId = `canonical-edit-${normalized}`
  const now = '2026-07-13T12:00:00.000Z'
  const project: LocalProjectRecord = {
    id: projectId,
    workspaceId: scope.workspaceId,
    name: `Canonical journey ${label}`,
    category: 'storytelling',
    createdAt: now,
    updatedAt: now,
    persistence: 'browser_scoped_project_registry',
  }
  const editPath = `/projects/${projectId}/edits/${editSessionId}`
  const edit: LocalInternalProjectHandoff = {
    id: editSessionId,
    workspaceId: scope.workspaceId,
    projectId,
    editSessionId,
    projectName: project.name,
    editName: `Workflow state ${label}`,
    category: project.category,
    editorPath: editPath,
    stage: 'source_uploaded',
    sourceFileCount: 1,
    sourceMediaAssets: [{
      mediaAssetId: `media-${normalized}`,
      sourceSequenceItemId: `sequence-${normalized}`,
      uploadedClipId: `clip-${normalized}`,
      uploadedOrder: 1,
      storageProvider: 'local_private',
      storageBucket: 'source-media',
      storagePath: `private/source/${normalized}.mp4`,
      fileName: `${normalized}.mp4`,
      mimeType: 'video/mp4',
      byteSize: 4096,
      checksumSha256: 'a'.repeat(64),
      sourceMetadata: {
        probeStatus: 'probed',
        source: 'local_ffprobe',
        durationSeconds: 2,
        width: 720,
        height: 1280,
        videoCodec: 'h264',
        audioCodec: 'aac',
        formatName: 'mov,mp4,m4a,3gp,3g2,mj2',
        streamCount: 2,
        hasVideo: true,
        hasAudio: true,
      },
      privateArtifact: true,
      publicUrl: null,
      signedUrl: null,
    }],
    createdAt: now,
    updatedAt: now,
    persistence: 'browser_local_internal_testing',
  }
  return { edit, editPath, project }
}

async function installSourceReadyNamedEditFixtures(
  page: Page,
  fixtures: ReturnType<typeof createSourceReadyNamedEdit>[],
) {
  const now = '2026-07-13T12:00:00.000Z'
  const scopeFingerprint = createProjectPersistenceScopeFingerprint(scope)

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
      handoffs: input.edits,
      savedAt: input.now,
    }))
  }, {
    edits: fixtures.map((fixture) => fixture.edit),
    handoffStorageKey: buildLocalProjectHandoffStorageKey(scope),
    now,
    projects: fixtures.map((fixture) => fixture.project),
    projectStorageKey: buildLocalProjectStorageKey(scope),
    scope,
    scopeFingerprint,
  })
}

function executionJourney(projectId: string, editSessionId: string) {
  return {
    schemaVersion: 'canonical-edit-journey-recovery-v1',
    source: 'canonical_edit_journey_service',
    identity: {
      workspaceId: scope.workspaceId,
      projectId,
      editSessionId,
    },
    stage: 'execution_in_progress',
    nextAction: {
      code: 'run_private_work_graph',
      actor: 'internal_service',
      method: 'POST',
      routeTemplate: '/v1/edit-executions/packages/package-canonical-ui/private-internal-work-graph-runs',
    },
    planningHandoff: {
      handoffId: 'handoff-canonical-ui',
      handoffHash: 'b'.repeat(64),
      canonicalPlanComponentsHash: 'c'.repeat(64),
      publicationStatus: 'published',
    },
    publicationRequest: {
      candidateId: 'candidate-canonical-ui',
      candidateHash: 'd'.repeat(64),
      publicationRequestHash: 'e'.repeat(64),
      publicationStatus: 'published',
    },
    plan: {
      planId: 'plan-canonical-ui',
      planVersion: 2,
      status: 'approved',
      planHash: '1'.repeat(64),
      estimateId: 'estimate-canonical-ui',
      estimateStatus: 'approved',
      estimateHash: '2'.repeat(64),
      approvedMaximumCredits: 72,
      workItemCount: 4,
    },
    approval: {
      approvalId: 'approval-canonical-ui',
      snapshotId: 'snapshot-canonical-ui',
      snapshotHash: '3'.repeat(64),
      reservationId: 'reservation-canonical-ui',
      reservationStatus: 'reserved',
      reservedCredits: 72,
      jobCount: 4,
      readyJobCount: 1,
      blockedJobCount: 3,
    },
    execution: {
      packageRecordId: 'package-canonical-ui',
      packageHash: '4'.repeat(64),
      snapshotId: 'snapshot-canonical-ui',
      purpose: 'private_internal_execution_handoff',
    },
    workGraphProgress: {
      packageRecordId: 'package-canonical-ui',
      approvedPlanSnapshotId: 'snapshot-canonical-ui',
      checkpointHash: '5'.repeat(64),
      checkpointSequence: 2,
      status: 'advancing_private_test_work_graph',
      runFinished: false,
      updatedAt: '2026-07-13T12:00:00.000Z',
      totalJobCount: 4,
      completedJobCount: 2,
      capabilityBlockedJobCount: 0,
      dependencyBlockedJobCount: 0,
      pendingJobCount: 2,
      requiredIncompleteJobCount: 2,
      allRequiredJobsCompleted: false,
      nextRequiredGate: 'canonical_private_work_graph_advancement',
    },
    permissions: {
      inspectionOnly: true,
      rawPlanInputsReturned: false,
      filesystemPathReturned: false,
      credentialReturned: false,
      snapshotMutation: false,
      creditMutation: false,
      toolExecution: false,
      providerCall: false,
      render: false,
    },
    testOnly: true,
  }
}

function canonicalPlanningHandoffFixture(projectId: string, editSessionId: string) {
  return {
    schemaVersion: 'canonical-planning-handoff-response-v1',
    source: 'canonical_planning_handoff_service',
    identity: {
      workspaceId: scope.workspaceId,
      projectId,
      editSessionId,
    },
    canonicalPlanComponentsHash: 'c'.repeat(64),
    sourceBindingManifestCandidate: {},
    sourceMediaAuthority: {},
    planningInputAuthority: {},
    resolvedPlanningInputAuthority: {},
    readiness: {
      finalizedSourceMediaVerified: true,
      exactEditPreferencesVerified: true,
      preferenceApplicationVerified: true,
      editBriefVerified: true,
      outputFrameAndCleanupVerified: true,
      readyForCanonicalPlanPublication: true,
    },
    handoffHash: 'b'.repeat(64),
    handoffId: 'canonical-ui-plan-handoff',
    persistence: {
      privateLocal: true,
      tenantScoped: true,
      createOnly: true,
      checksumProtected: true,
      contentAddressed: true,
      distributed: false,
      productionAuthority: false,
    },
    noPlanPublished: true,
    noSnapshotCreated: true,
    noCreditReservation: true,
    noToolExecution: true,
    noProviderCall: true,
    noRender: true,
    testOnly: true,
  }
}
