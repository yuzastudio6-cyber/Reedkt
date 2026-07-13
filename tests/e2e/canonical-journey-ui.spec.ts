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
import { expectNoGenerationBeforeApproval, expectNoInternalToolNamesInEditor, gotoRoute } from './helpers/routes'

const scope = {
  authMode: 'local_test' as const,
  userId: 'local-test-user',
  workspaceId: 'workspace-internal-testing',
}

test.describe('canonical journey named-edit UI bridge', () => {
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
