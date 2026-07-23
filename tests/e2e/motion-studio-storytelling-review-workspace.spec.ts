import { expect, test, type Page, type Route } from '@playwright/test'

import {
  buildLocalProjectHandoffStorageKey,
  createLocalSourceSetFingerprint,
  type LocalInternalProjectHandoff,
} from '../../src/lib/local-project-handoff'
import type {
  MotionStudioProductionDto,
  MotionStudioWorkGraphDto,
} from '../../src/types/motion-studio'
import {
  activeProductLocalTestScope,
  installActiveProductRouteFixture,
  type ActiveProductRouteFixture,
} from './helpers/active-product'
import { expectNoHorizontalOverflow, setViewport } from './helpers/layout'
import { expectNoGenerationBeforeApproval, gotoRoute } from './helpers/routes'

const apiOrigin = 'http://127.0.0.1:8791'
const productionId = '95959595-9595-4595-8595-959595959595'
const snapshotId = '96969696-9696-4696-8696-969696969696'

test.describe('Storytelling Review workspace', () => {
  test.skip(process.env.MOTION_STUDIO_E2E !== 'true', 'Run with playwright.motion-studio.config.ts so the frontend-safe HTTP boundary is explicit.')

  test('shows delayed loading and an honest pre-approval empty state without writes', async ({ page }) => {
    const fixture = await installActiveProductRouteFixture(page, 'storytelling-review-empty', { category: 'storytelling', productWorkflow: 'motion_studio.storytelling' })
    const production = createProduction(fixture, { currentStage: 'director_brief', status: 'draft' })
    let writes = 0
    let releaseProductionRead: () => void = () => undefined
    const productionGate = new Promise<void>((resolve) => { releaseProductionRead = resolve })

    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.route(`${apiOrigin}/v1/**`, async (route) => {
      if (route.request().method() !== 'GET') writes += 1
      if (!isProductionRoute(route.request().url())) return unexpectedRoute(route)
      await productionGate
      return fulfillData(route, { production })
    })

    await gotoRoute(page, `${fixture.editPath}?surface=review`)
    const loading = page.getByText('Checking this story')
    await expect(loading).toBeVisible()
    const loadingIcon = loading.locator('xpath=ancestor::div[contains(@class,"focalState")]').locator('svg')
    await expect(loadingIcon).toBeVisible()
    expect(await loadingIcon.evaluate((element) => getComputedStyle(element).animationName)).toBe('none')
    releaseProductionRead()

    const workspace = page.getByTestId('storytelling-review-state-empty')
    await expect(workspace).toBeVisible()
    await expect(page.getByText('Nothing is waiting for review')).toBeVisible()
    await expect(page.getByText('Waiting for approval', { exact: true })).toBeVisible()
    await expect(page.getByText('No decision', { exact: true })).toBeVisible()
    await expectNoGenerationBeforeApproval(page)
    await expectNoHorizontalOverflow(page)
    expect(writes).toBe(0)
  })

  test('shows one verified current decision and returns to the exact named-edit Chat', async ({ page }) => {
    const fixture = await installActiveProductRouteFixture(page, 'storytelling-review-ready', { category: 'storytelling', productWorkflow: 'motion_studio.storytelling' })
    await seedReviewHandoff(page, fixture, {
      stage: 'private_review_verified',
    })
    const production = createProduction(fixture, { currentStage: 'fine_cut', status: 'awaiting_review' })
    let writes = 0

    await page.route(`${apiOrigin}/v1/**`, async (route) => {
      if (route.request().method() !== 'GET') writes += 1
      if (isProductionRoute(route.request().url())) return fulfillData(route, { production })
      return unexpectedRoute(route)
    })

    await gotoRoute(page, `${fixture.editPath}?surface=review`)
    const workspace = page.getByTestId('storytelling-review-state-ready')
    await expect(workspace).toBeVisible()
    await expect(page.getByText('A Storytelling decision needs your review')).toBeVisible()
    await expect(page.getByText('Attached', { exact: true })).toBeVisible()
    await expect(page.getByText('Verified and playable', { exact: true })).toBeVisible()
    await expect(page.getByText('Waiting for your decision', { exact: true })).toBeVisible()
    await expect(workspace).not.toContainText(/95959595|96969696|manifest|artifact|provider|database|worker|internal cost|customer credits/i)

    const boundary = page.getByText('How review works', { exact: true })
    await boundary.focus()
    await expect(boundary).toBeFocused()
    await boundary.press('Enter')
    await expect(page.getByText('Playback, approval, and change requests use the canonical private review controls for this exact named edit.')).toBeVisible()

    for (const width of [375, 768, 1024, 1440]) {
      await setViewport(page, width, 900)
      await expectNoHorizontalOverflow(page)
    }

    await page.reload()
    await expect(page.getByTestId('storytelling-review-state-ready')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Review in Chat' })).toHaveCount(0)
    await page.getByTestId('storytelling-workspace-chat').click()
    await expect(page).toHaveURL(fixture.editPath)
    await expect(page.getByTestId('chat-composer-textarea')).toBeVisible()
    await expect(page.getByTestId('editor-page')).toHaveCount(0)
    expect(writes).toBe(0)
  })

  test('keeps an accepted review locked and does not duplicate approval controls', async ({ page }) => {
    const fixture = await installActiveProductRouteFixture(page, 'storytelling-review-approved', { category: 'storytelling', productWorkflow: 'motion_studio.storytelling' })
    await seedReviewHandoff(page, fixture, {
      decision: 'accepted_for_internal_testing',
      stage: 'private_review_accepted',
    })
    const production = createProduction(fixture, { currentStage: 'fine_cut', status: 'awaiting_review' })
    let writes = 0

    await page.route(`${apiOrigin}/v1/**`, async (route) => {
      if (route.request().method() !== 'GET') writes += 1
      if (isProductionRoute(route.request().url())) return fulfillData(route, { production })
      return unexpectedRoute(route)
    })

    await gotoRoute(page, `${fixture.editPath}?surface=review`)
    const workspace = page.getByTestId('storytelling-review-state-approved')
    await expect(workspace).toBeVisible()
    await expect(page.getByText('This private review is locked')).toBeVisible()
    await expect(page.getByText('Approved and locked', { exact: true })).toBeVisible()
    await expect(page.getByText('Sharing, export, delivery, and billing are still closed.')).toBeVisible()
    await expect(page.getByRole('button', { name: /Approve edit|Request changes/i })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'View approved review in Chat' })).toHaveCount(0)
    expect(writes).toBe(0)
  })

  test('preserves a long change request and routes revision work back through Chat', async ({ page }) => {
    const fixture = await installActiveProductRouteFixture(page, 'storytelling-review-changes', { category: 'storytelling', productWorkflow: 'motion_studio.storytelling' })
    const note = 'Slow the opening map reveal, preserve the cited chronology, and keep the narrator restrained. '.repeat(7).trim()
    await seedReviewHandoff(page, fixture, {
      decision: 'changes_requested',
      note,
      stage: 'revision_requested',
    })
    const production = createProduction(fixture, { currentStage: 'fine_cut', status: 'planning' })
    let writes = 0

    await page.route(`${apiOrigin}/v1/**`, async (route) => {
      if (route.request().method() !== 'GET') writes += 1
      if (isProductionRoute(route.request().url())) return fulfillData(route, { production })
      return unexpectedRoute(route)
    })

    await gotoRoute(page, `${fixture.editPath}?surface=review`)
    const workspace = page.getByTestId('storytelling-review-state-changes_requested')
    await expect(workspace).toBeVisible()
    await expect(page.getByText('The next pass needs a fresh plan')).toBeVisible()
    await expect(page.getByTestId('storytelling-review-note')).toContainText('Slow the opening map reveal')
    await expect(page.getByText('Changes requested', { exact: true }).last()).toBeVisible()
    await setViewport(page, 375, 900)
    await expectNoHorizontalOverflow(page)
    await page.getByRole('button', { name: 'Continue with Director' }).click()
    await expect(page).toHaveURL(fixture.editPath)
    await expect(page.getByTestId('chat-composer-textarea')).toBeVisible()
    await expect(page.getByTestId('editor-page')).toHaveCount(0)
    expect(writes).toBe(0)
  })

  test('distinguishes durable preparation blockers from transport failure and retry recovery', async ({ page }) => {
    const fixture = await installActiveProductRouteFixture(page, 'storytelling-review-recovery', { category: 'storytelling', productWorkflow: 'motion_studio.storytelling' })
    await seedReviewHandoff(page, fixture, { stage: 'plan_approved', verified: false })
    const blockedProduction = createProduction(fixture, { currentStage: 'fine_cut', status: 'producing' })
    const emptyProduction = createProduction(fixture, { currentStage: 'director_brief', status: 'draft' })
    const workGraph = createBlockedWorkGraph(blockedProduction.id)
    let scenario: 'blocked' | 'failure' | 'ready' = 'blocked'
    let writes = 0

    await page.route(`${apiOrigin}/v1/**`, async (route) => {
      if (route.request().method() !== 'GET') writes += 1
      if (isProductionRoute(route.request().url())) {
        if (scenario === 'failure') return fulfillError(route, 503, 'MOTION_STUDIO_UNAVAILABLE')
        return fulfillData(route, { production: scenario === 'blocked' ? blockedProduction : emptyProduction })
      }
      if (isWorkGraphRoute(route.request().url()) && scenario === 'blocked') return fulfillData(route, { workGraph })
      return unexpectedRoute(route)
    })

    await gotoRoute(page, `${fixture.editPath}?surface=review`)
    await expect(page.getByTestId('storytelling-review-state-blocked')).toBeVisible()
    await expect(page.getByText('Preparation needs attention')).toBeVisible()
    await expect(page.getByTestId('storytelling-review-state-blocked').getByText('Needs attention', { exact: true })).toBeVisible()

    scenario = 'failure'
    await page.reload()
    await expect(page.getByText('The story workspace could not be loaded')).toBeVisible()
    await expect(page.getByTestId('storytelling-review-state-empty')).toHaveCount(0)
    const failureBox = await page.getByTestId('storytelling-workspace-unavailable').boundingBox()
    expect(failureBox?.width ?? Number.POSITIVE_INFINITY).toBeLessThanOrEqual(900)

    scenario = 'ready'
    await page.getByRole('button', { name: 'Try again' }).click()
    await expect(page.getByTestId('storytelling-review-state-preparing')).toBeVisible()
    await expect(page.getByText('No decision is ready yet')).toBeVisible()
    expect(writes).toBe(0)
  })
})

function createProduction(
  fixture: ActiveProductRouteFixture,
  patch: Pick<MotionStudioProductionDto, 'currentStage' | 'status'>,
): MotionStudioProductionDto {
  return {
    id: productionId,
    projectId: fixture.project.id,
    editSessionId: fixture.edit.editSessionId,
    moduleId: 'storytelling',
    moduleCatalogVersion: 'motion-studio-module-catalog-v1',
    stageProfileId: 'motion-studio-storytelling-stage-profile-v1',
    status: patch.status,
    currentStage: patch.currentStage,
    workspaceMode: 'guided',
    defaultProductionMode: 'hybrid_directed',
    userFacingStrategy: "Director's Hybrid",
    recordVersion: 1,
    createdAt: '2026-07-19T13:00:00.000Z',
    updatedAt: '2026-07-19T13:00:00.000Z',
    localCandidateOnly: true,
  }
}

function createBlockedWorkGraph(targetProductionId: string): MotionStudioWorkGraphDto {
  return {
    productionId: targetProductionId,
    approvedSnapshotId: snapshotId,
    costEstimateId: 'review-estimate-1',
    status: 'incurring',
    jobs: [{
      id: 'review-job-1',
      productionId: targetProductionId,
      approvedSnapshotId: snapshotId,
      approvedWorkItemId: 'review-work-item-1',
      workItemKey: 'fine-cut-review',
      sequenceNumber: 1,
      workItemType: 'prepare_private_review',
      required: true,
      status: 'blocked',
      attemptCount: 1,
      maxAttempts: 1,
      runAfter: '2026-07-19T13:00:00.000Z',
      upstreamJobIds: [],
    }],
    dependencies: [],
    localCandidateOnly: true,
  }
}

async function seedReviewHandoff(
  page: Page,
  fixture: ActiveProductRouteFixture,
  options: {
    stage: LocalInternalProjectHandoff['stage']
    decision?: 'accepted_for_internal_testing' | 'changes_requested'
    note?: string
    verified?: boolean
  },
) {
  const sourceAsset = createSourceAsset(fixture.edit.editSessionId)
  const sourceSetFingerprint = createLocalSourceSetFingerprint([sourceAsset])
  const verified = options.verified !== false
  const privateReview: LocalInternalProjectHandoff['privateReview'] = verified ? {
    manifestVerified: true,
    sourceSetFingerprint,
    privateInternalDownloadPath: '/v1/edit-executions/private-internal-downloads/review-record/file',
    privateInternalManifestPath: '/v1/edit-executions/private-internal-downloads/review-record/manifest',
    finalRenderArtifactId: 'review-artifact-1',
    editDecisionManifestVerification: createManifestVerification(fixture.project.id, fixture.edit.editSessionId),
    reviewVideoMetadata: {
      playable: true,
      durationSeconds: 30,
      width: 1280,
      height: 720,
      verifiedAt: '2026-07-19T13:10:00.000Z',
    },
    ...(options.decision ? { reviewDecision: options.decision } : {}),
    ...(options.note ? { reviewNote: options.note } : {}),
    updatedAt: '2026-07-19T13:10:00.000Z',
  } : undefined
  await page.addInitScript((input) => {
    const raw = window.localStorage.getItem(input.key)
    if (!raw) return
    const envelope = JSON.parse(raw) as { handoffs?: LocalInternalProjectHandoff[] }
    const edit = envelope.handoffs?.find((candidate) => candidate.editSessionId === input.editSessionId)
    if (!edit) return
    edit.stage = input.stage
    edit.sourceFileCount = 1
    edit.sourceMediaAssets = [input.sourceAsset]
    edit.sourceSetFingerprint = input.sourceSetFingerprint
    edit.approvedSnapshotId = input.approvedSnapshotId
    edit.approvedCreditReservationId = 'review-reservation-1'
    edit.privateReview = input.privateReview
    edit.updatedAt = '2026-07-19T13:10:00.000Z'
    window.localStorage.setItem(input.key, JSON.stringify(envelope))
  }, {
    approvedSnapshotId: snapshotId,
    editSessionId: fixture.edit.editSessionId,
    key: buildLocalProjectHandoffStorageKey(activeProductLocalTestScope),
    privateReview,
    sourceAsset,
    sourceSetFingerprint,
    stage: options.stage,
  })
}

function createManifestVerification(projectId: string, editSessionId: string) {
  return {
    manifestVersion: 'private-internal-edit-decision-manifest-v1' as const,
    approvedPlanSnapshotId: snapshotId,
    renderPreviewAssemblyId: 'review-assembly-1',
    creditReservationId: 'review-reservation-1',
    finalRenderArtifactId: 'review-artifact-1',
    approvedEditContextReady: true,
    approvedEditContext: {
      projectId,
      editSessionId,
      goalSummary: 'Create a concise documentary story.',
      editLevel: 'pro',
      editingCategory: 'storytelling',
      aspectRatio: '16:9',
      creditEstimateTotalCredits: 40,
      segmentCount: 3,
      operationCount: 5,
      professionalSkillTrace: null,
      planningContextTrace: null,
    },
    sourceMediaAssetCount: 1,
    clipDecisionCount: 1,
    sourceOrderPreserved: true,
    uploadedOrderMonotonic: true,
    sourceMediaCoverageComplete: true,
    sourceChecksumCoverageComplete: true,
    sourceStorageIdentityCoverageComplete: true,
    processedPrivateArtifactTraceComplete: true,
    processedArtifactCount: 1,
    processedArtifactIds: ['review-artifact-1'],
    firstAppearanceSourceMediaAssetIds: ['review-source-asset'],
    firstAppearanceUploadedOrders: [1],
    privateCaptionPackageAttached: true,
    professionalLayerCounts: {
      reviewOverlays: 1,
      captionOverlays: 1,
      transitionPolish: 0,
      visualPolish: 1,
      finalTiming: 1,
      audioPolish: 1,
    },
    verifiedAt: '2026-07-19T13:10:00.000Z',
  }
}

function createSourceAsset(id: string): NonNullable<LocalInternalProjectHandoff['sourceMediaAssets']>[number] {
  return {
    mediaAssetId: `review-source-${id}`,
    sourceSequenceItemId: `review-sequence-${id}`,
    uploadedClipId: `review-clip-${id}`,
    uploadedOrder: 1,
    storageProvider: 'local_private',
    storageBucket: 'source-media',
    storagePath: `private/source/${id}.mp4`,
    fileName: `${id}.mp4`,
    mimeType: 'video/mp4',
    byteSize: 4096,
    checksumSha256: 'a'.repeat(64),
    privateArtifact: true,
    publicUrl: null,
    signedUrl: null,
  }
}

function isProductionRoute(url: string): boolean {
  return /\/v1\/projects\/[^/]+\/edit-sessions\/[^/]+\/motion-studio$/u.test(new URL(url).pathname)
}

function isWorkGraphRoute(url: string): boolean {
  return /\/v1\/motion-studio\/productions\/[^/]+\/work-graph$/u.test(new URL(url).pathname)
}

async function fulfillData(route: Route, data: unknown) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ ok: true, statusCode: 200, data, warnings: [], mockOnly: false }),
  })
}

async function fulfillError(route: Route, status: number, code: string) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify({ ok: false, statusCode: status, error: { code, message: code }, warnings: [], mockOnly: false }),
  })
}

async function unexpectedRoute(route: Route) {
  await fulfillError(route, 404, 'UNEXPECTED_TEST_ROUTE')
}
