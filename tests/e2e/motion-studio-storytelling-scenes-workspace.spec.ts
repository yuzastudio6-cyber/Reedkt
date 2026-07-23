import { expect, test, type Route } from '@playwright/test'

import type {
  MotionStudioPreviewWorkspaceDto,
  MotionStudioProductionDto,
  MotionStudioSceneArtifactSummaryDto,
  MotionStudioSceneWorkspaceDto,
  MotionStudioTimelineProposalDto,
} from '../../src/types/motion-studio'
import { installActiveProductRouteFixture } from './helpers/active-product'
import { expectNoHorizontalOverflow, setViewport } from './helpers/layout'
import { expectNoGenerationBeforeApproval, gotoRoute } from './helpers/routes'

const apiOrigin = 'http://127.0.0.1:8791'
const productionId = '91919191-9191-4191-8191-919191919191'

test.describe('Storytelling Scene Board', () => {
  test.skip(process.env.MOTION_STUDIO_E2E !== 'true', 'Run with playwright.motion-studio.config.ts so the frontend-safe HTTP boundary is explicit.')

  test('creates one exact scene draft from a clean, progressively disclosed composer', async ({ page }) => {
    const fixture = await installActiveProductRouteFixture(page, 'scene-board-create', { category: 'storytelling', productWorkflow: 'motion_studio.storytelling' })
    const production = createProduction(fixture.project.id, fixture.edit.editSessionId)
    let workspace = createSceneWorkspace()
    let sceneRequest: Record<string, unknown> | undefined
    let generationReads = 0
    let layeredReads = 0
    let releaseInitialRead: (() => void) | undefined
    const initialReadGate = new Promise<void>((resolve) => { releaseInitialRead = resolve })

    await page.route(`${apiOrigin}/v1/**`, async (route) => {
      const url = route.request().url()
      if (isProductionRoute(url)) return fulfillData(route, { production })
      if (isSceneWorkspaceRoute(url) && route.request().method() === 'GET') {
        await initialReadGate
        return fulfillData(route, { sceneWorkspace: workspace })
      }
      if (isPreviewWorkspaceRoute(url)) return fulfillData(route, { previewWorkspace: emptyPreviewWorkspace() })
      if (isSceneDraftRoute(url) && route.request().method() === 'POST') {
        sceneRequest = route.request().postDataJSON() as Record<string, unknown>
        workspace = createSceneWorkspace({ withDocument: true })
        return fulfillData(route, { sceneWorkspace: workspace }, 201)
      }
      if (isGenerationWorkspaceRoute(url)) generationReads += 1
      if (isLayeredWorkspaceRoute(url)) layeredReads += 1
      return unexpectedRoute(route)
    })

    await setViewport(page, 1280)
    await gotoRoute(page, `${fixture.editPath}?surface=scenes`)
    await expect(page.getByTestId('storytelling-scenes-state-loading')).toBeVisible()
    releaseInitialRead?.()
    await expect(page.getByTestId('storytelling-scenes-workspace')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Build the first scene' })).toBeVisible()
    await expect(page.getByText('Timing and construction', { exact: true })).toBeVisible()
    await expect(page.getByLabel('Starts at')).not.toBeVisible()

    await page.getByTestId('storytelling-scene-title').fill('The evidence changes the timeline')
    await page.getByTestId('storytelling-scene-purpose').fill('Reveal why one date changes the investigation and move the viewer from doubt to clarity.')
    const createButton = page.getByTestId('storytelling-create-scene')
    await expect(createButton).toBeEnabled()
    const buttonBox = await createButton.boundingBox()
    expect(buttonBox?.height ?? 0).toBeGreaterThanOrEqual(44)
    await createButton.click()

    await expect(page.getByText('“The evidence changes the timeline” is now on the Scene Board as a new draft.')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'The evidence changes the timeline' })).toBeVisible()
    await expect(page.getByText('Reveal why one date changes the investigation and move the viewer from doubt to clarity.')).toBeVisible()
    expect(sceneRequest).toMatchObject({
      approvedSnapshotId: snapshotId,
      title: 'The evidence changes the timeline',
      semanticPurpose: 'Reveal why one date changes the investigation and move the viewer from doubt to clarity.',
      productionMode: 'hybrid_directed',
      startAnchorId: 'opening-beat',
      endAnchorId: 'consequence-beat',
      layerType: 'image',
      assetIds: [],
      zIndex: 10,
      motionLanguageVersionId,
      narrativeFunctionVersionId,
    })
    expect(generationReads).toBe(0)
    expect(layeredReads).toBe(0)
    await expectNoGenerationBeforeApproval(page)
    await expectNoHorizontalOverflow(page)
  })

  test('reviews scene meaning first, then prepares a non-applying timeline proposal', async ({ page }) => {
    const fixture = await installActiveProductRouteFixture(page, 'scene-board-review', { category: 'storytelling', productWorkflow: 'motion_studio.storytelling' })
    const production = createProduction(fixture.project.id, fixture.edit.editSessionId)
    let workspace = createSceneWorkspace({ withDocument: true })
    let proposalRequest: Record<string, unknown> | undefined

    await page.route(`${apiOrigin}/v1/**`, async (route) => {
      const url = route.request().url()
      if (isProductionRoute(url)) return fulfillData(route, { production })
      if (isSceneWorkspaceRoute(url)) return fulfillData(route, { sceneWorkspace: workspace })
      if (isPreviewWorkspaceRoute(url)) return fulfillData(route, { previewWorkspace: emptyPreviewWorkspace() })
      if (isTimelineProposalRoute(url) && route.request().method() === 'POST') {
        proposalRequest = route.request().postDataJSON() as Record<string, unknown>
        workspace = createSceneWorkspace({ withDocument: true, withProposal: true })
        return fulfillData(route, { proposal: workspace.proposals[0], sceneWorkspace: workspace }, 201)
      }
      return unexpectedRoute(route)
    })

    await page.emulateMedia({ reducedMotion: 'reduce' })
    await gotoRoute(page, `${fixture.editPath}?surface=scenes`)
    await expect(page.getByRole('heading', { name: 'Your Scene Board' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'The evidence changes the timeline' })).toBeVisible()
    await expect(page.getByText('00:00–00:04')).toBeVisible()
    await expect(page.getByText("Director's Hybrid")).toBeVisible()
    await expect(page.getByText('Image, Exact text')).toBeVisible()
    await expect(page.getByText('Not prepared')).toBeVisible()

    const details = page.getByText('Scene details', { exact: true })
    await details.focus()
    await expect(details).toBeFocused()
    await details.press('Enter')
    await expect(page.getByText('Version 1 · Draft')).toBeVisible()
    await expect(page.getByText('2 shots')).toBeVisible()
    await expect(page.getByText('2 layers')).toBeVisible()
    await expect(page.getByText('Exact text required')).toBeVisible()

    await page.getByRole('button', { name: 'Prepare for Timeline' }).click()
    await expect(page.getByText('Timeline update ready').first()).toBeVisible()
    await expect(page.getByText('Ready for Timeline review; nothing has been applied.')).toBeVisible()
    expect(proposalRequest).toMatchObject({
      approvedSnapshotId: snapshotId,
      sceneDocumentArtifactId,
      sceneDocumentVersionId,
      sceneDocumentContentDigest: '8'.repeat(64),
      targetTimelineManifestId: 'timeline-manifest-accepted-v1',
    })

    for (const width of [375, 768, 1024, 1440]) {
      await setViewport(page, width, width === 375 ? 812 : 900)
      await expect(page.getByTestId('storytelling-scenes-workspace')).toBeVisible()
      await expectNoHorizontalOverflow(page)
    }
    await expect(page.locator('body')).not.toContainText(/approvedSnapshotId|contentDigest|providerApiKey|signedUrl|internal cost/i)
    await expectNoGenerationBeforeApproval(page)
  })

  test('keeps failures distinct from blocked and locked scene states', async ({ page }) => {
    const fixture = await installActiveProductRouteFixture(page, 'scene-board-recovery', { category: 'storytelling', productWorkflow: 'motion_studio.storytelling' })
    const production = createProduction(fixture.project.id, fixture.edit.editSessionId)
    let sceneReads = 0
    let scenario: 'recover' | 'denied' | 'locked' = 'recover'

    await page.route(`${apiOrigin}/v1/**`, async (route) => {
      const url = route.request().url()
      if (isProductionRoute(url)) return fulfillData(route, { production })
      if (isPreviewWorkspaceRoute(url)) return fulfillData(route, { previewWorkspace: emptyPreviewWorkspace() })
      if (isSceneWorkspaceRoute(url)) {
        sceneReads += 1
        if (scenario === 'denied') return fulfillError(route, 403, 'WORKSPACE_ACCESS_DENIED', 'This named edit is not available in the current workspace.')
        if (scenario === 'locked') return fulfillData(route, { sceneWorkspace: createSceneWorkspace({ withDocument: true, documentState: 'locked' }) })
        if (sceneReads === 1) return fulfillError(
          route,
          503,
          'SCENE_WORKSPACE_UNAVAILABLE',
          `/v1/motion-studio/productions/${productionId}/scene-workspace`,
        )
        return fulfillData(route, { sceneWorkspace: blockedSceneWorkspace() })
      }
      return unexpectedRoute(route)
    })

    await gotoRoute(page, `${fixture.editPath}?surface=scenes`)
    await expect(page.getByTestId('storytelling-scenes-state-failure')).toBeVisible()
    await expect(page.getByText('The Scene Board is temporarily unavailable. Your scene work is still preserved. Try again.')).toBeVisible()
    await expect(page.locator('body')).not.toContainText('/v1/motion-studio')
    await page.getByRole('button', { name: 'Try again' }).click()
    await expect(page.getByRole('heading', { name: 'Scenes are not ready yet' })).toBeVisible()
    await expect(page.getByText('Approve the current plan before creating scenes.')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Continue in Chat' })).toBeVisible()

    scenario = 'denied'
    await page.reload()
    await expect(page.getByTestId('storytelling-scenes-state-permission-denied')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Try again' })).toHaveCount(0)

    scenario = 'locked'
    await page.reload()
    await expect(page.getByText('Locked').first()).toBeVisible()
    await page.getByText('Scene details', { exact: true }).click()
    await expect(page.getByText('Version 1 · Locked')).toBeVisible()
    await expect(page.getByText(/does not generate media, spend credits, render, or apply timeline changes/i)).toBeVisible()
    await expectNoGenerationBeforeApproval(page)
  })

  test('keeps scene continuity compact, reviewable, stale-safe, and approval-neutral', async ({ page }) => {
    const fixture = await installActiveProductRouteFixture(page, 'scene-board-continuity', { category: 'storytelling', productWorkflow: 'motion_studio.storytelling' })
    const production = createProduction(fixture.project.id, fixture.edit.editSessionId)
    let continuityState: NonNullable<MotionStudioSceneArtifactSummaryDto['storyContinuityReview']>['state'] = 'ready_for_review'
    let withProposal = false

    await page.route(`${apiOrigin}/v1/**`, async (route) => {
      const url = route.request().url()
      if (isProductionRoute(url)) return fulfillData(route, { production })
      if (isSceneWorkspaceRoute(url)) return fulfillData(route, {
        sceneWorkspace: createSceneWorkspace({ withDocument: true, withProposal, continuityState }),
      })
      if (isPreviewWorkspaceRoute(url)) return fulfillData(route, { previewWorkspace: emptyPreviewWorkspace() })
      return unexpectedRoute(route)
    })

    await page.emulateMedia({ reducedMotion: 'reduce' })
    await gotoRoute(page, `${fixture.editPath}?surface=scenes`)
    const review = page.getByTestId('storytelling-scene-continuity-review')
    await expect(review).toHaveAttribute('data-state', 'ready_for_review')
    await expect(review.getByText('Story flow · Ready for review')).toBeVisible()
    await expect(review.getByText('Opening flow is ready to review')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Prepare for Timeline' })).toBeEnabled()

    const details = page.getByText('Scene details', { exact: true })
    await details.focus()
    await details.press('Enter')
    await expect(page.getByText('Opening', { exact: true })).toBeVisible()
    await expect(page.getByText('Route line', { exact: true })).toBeVisible()
    await expect(page.getByText('1 reveal beat')).toBeVisible()
    await expect(page.getByText('1 story transition')).toBeVisible()
    await expect(page.getByText('1 rhythm beat')).toBeVisible()

    continuityState = 'needs_review'
    await page.reload()
    await expect(review).toHaveAttribute('data-state', 'needs_review')
    await expect(review.getByText('Needs review')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Prepare for Timeline' })).toBeDisabled()

    continuityState = 'stale'
    withProposal = true
    await page.reload()
    await expect(review).toHaveAttribute('data-state', 'stale')
    await expect(review.getByText('New plan required')).toBeVisible()
    await expect(page.getByText('Timeline update ready')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Prepare for Timeline' })).toBeDisabled()

    continuityState = 'approved_locked'
    withProposal = false
    await page.reload()
    await expect(review).toHaveAttribute('data-state', 'approved_locked')
    await expect(review.getByText('Approved and locked')).toBeVisible()
    await expect(review.getByText('Request a scene-flow revision in Chat')).toBeVisible()
    await expect(page.getByRole('button', { name: /approve story|approve flow/i })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Prepare for Timeline' })).toBeEnabled()

    continuityState = 'not_ready'
    await page.reload()
    await expect(review).toHaveAttribute('data-state', 'not_ready')
    await expect(review.getByText('Not bound')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Prepare for Timeline' })).toBeDisabled()

    for (const width of [375, 768, 1024, 1440]) {
      await setViewport(page, width, width === 375 ? 812 : 900)
      await expect(review).toBeVisible()
      await expectNoHorizontalOverflow(page)
    }
    await expect(page.locator('body')).not.toContainText(
      /artifactId|versionId|contentDigest|provider|jobId|leaseId|internal cost/i,
    )
    await expectNoGenerationBeforeApproval(page)
  })
})

const snapshotId = '22222222-2222-4222-8222-222222222222'
const motionLanguageArtifactId = 'bbbbbbb1-2222-4222-8222-222222222222'
const motionLanguageVersionId = 'bbbbbbb2-2222-4222-8222-222222222222'
const narrativeFunctionArtifactId = 'ccccccc1-2222-4222-8222-222222222222'
const narrativeFunctionVersionId = 'ccccccc2-2222-4222-8222-222222222222'
const sceneDocumentArtifactId = 'aaaaaaa8-1111-4111-8111-111111111111'
const sceneDocumentVersionId = 'aaaaaaa9-1111-4111-8111-111111111111'

function createProduction(projectId: string, editSessionId: string): MotionStudioProductionDto {
  return {
    id: productionId,
    projectId,
    editSessionId,
    moduleId: 'storytelling',
    moduleCatalogVersion: 'motion-studio-module-catalog-v1',
    stageProfileId: 'motion-studio-storytelling-stage-profile-v1',
    status: 'draft',
    currentStage: 'scene_board',
    workspaceMode: 'guided',
    defaultProductionMode: 'hybrid_directed',
    userFacingStrategy: "Director's Hybrid",
    recordVersion: 1,
    createdAt: '2026-07-20T05:00:00.000Z',
    updatedAt: '2026-07-20T05:00:00.000Z',
    localCandidateOnly: true,
  }
}

function createSceneWorkspace(options: {
  withDocument?: boolean
  withProposal?: boolean
  documentState?: MotionStudioSceneArtifactSummaryDto['state']
  continuityState?: NonNullable<MotionStudioSceneArtifactSummaryDto['storyContinuityReview']>['state']
} = {}): MotionStudioSceneWorkspaceDto {
  const document: MotionStudioSceneArtifactSummaryDto = {
    artifactId: sceneDocumentArtifactId,
    kind: 'scene_document',
    version: versionReference(sceneDocumentArtifactId, sceneDocumentVersionId, '8'),
    state: options.documentState ?? 'draft',
    label: 'The evidence changes the timeline',
    sceneId: 'aaaaaaa1-1111-4111-8111-111111111111',
    sceneTitle: 'The evidence changes the timeline',
    semanticPurpose: 'Reveal why one date changes the investigation and move the viewer from doubt to clarity.',
    productionMode: 'hybrid_directed',
    timing: { startAnchorId: 'opening-beat', endAnchorId: 'consequence-beat' },
    shotCount: 2,
    layerTypes: ['image', 'text'],
    layerCount: 2,
    assetCount: 1,
    keyframeCount: 3,
    exactTextRequired: true,
    exactDataRequired: false,
    ...(options.continuityState
      ? { storyContinuityReview: sceneContinuityReview(options.continuityState) }
      : {}),
  }
  const proposal = createProposal(document)
  return {
    productionId,
    artifacts: [
      {
        artifactId: motionLanguageArtifactId,
        kind: 'motion_language',
        version: versionReference(motionLanguageArtifactId, motionLanguageVersionId, 'b'),
        state: 'approved',
        label: 'Editorial evidence motion',
      },
      {
        artifactId: narrativeFunctionArtifactId,
        kind: 'narrative_function',
        version: versionReference(narrativeFunctionArtifactId, narrativeFunctionVersionId, 'c'),
        state: 'approved',
        label: 'Reveal decisive evidence',
      },
      ...(options.withDocument ? [document] : []),
    ],
    proposals: options.withProposal ? [proposal] : [],
    latestApprovedSnapshot: {
      id: snapshotId,
      targetTimelineManifestId: 'timeline-manifest-accepted-v1',
      timingAuthorityDigest: 'a'.repeat(64),
      frameRate: 30,
      timingAnchors: [
        { id: 'opening-beat', frame: 0 },
        { id: 'evidence-beat', frame: 60 },
        { id: 'consequence-beat', frame: 120 },
      ],
    },
    readiness: {
      canAuthor: true,
      canCompile: Boolean(options.withDocument),
      blockers: options.withDocument ? [] : ['Create a SceneDocument before compiling a timeline proposal.'],
    },
    localCandidateOnly: true,
  }
}

function sceneContinuityReview(
  state: NonNullable<MotionStudioSceneArtifactSummaryDto['storyContinuityReview']>['state'],
): NonNullable<MotionStudioSceneArtifactSummaryDto['storyContinuityReview']> {
  const notReady = state === 'not_ready'
  const copy = state === 'ready_for_review'
    ? {
        statusLabel: 'Ready for review',
        title: 'Opening flow is ready to review',
        summary: 'This scene carries the current story arc, through-line, reveal, transition, and rhythm authority.',
        nextAction: { kind: 'review_scene' as const, label: 'Review this scene flow' },
      }
    : state === 'needs_review'
      ? {
          statusLabel: 'Needs review',
          title: 'Opening flow needs attention',
          summary: 'Review this scene against the current story before preparing further Timeline or preview work.',
          nextAction: { kind: 'review_scene' as const, label: 'Review this scene flow' },
        }
      : state === 'approved_locked'
        ? {
            statusLabel: 'Approved and locked',
            title: 'Opening flow is locked',
            summary: 'This scene continuity is preserved with the approved plan. Revisions return through Chat and require a new plan.',
            nextAction: { kind: 'request_revision_in_chat' as const, label: 'Request a scene-flow revision in Chat' },
          }
        : state === 'stale'
          ? {
              statusLabel: 'New plan required',
              title: 'Scene flow no longer matches the current story',
              summary: 'The prior scene flow remains preserved, but the story, script, motion direction, timing, or approved plan changed.',
              nextAction: { kind: 'continue_replanning' as const, label: 'Continue replanning in Chat' },
            }
          : {
              statusLabel: 'Not bound',
              title: 'Bind this scene to the current story flow',
              summary: 'The current story flow is ready, but this scene does not yet carry its arc role and transitions.',
              nextAction: { kind: 'continue_in_chat' as const, label: 'Continue shaping the scene in Chat' },
            }
  return {
    schemaVersion: 'motion-studio.storytelling-scene-continuity-review.v1',
    state,
    ...copy,
    ...(!notReady
      ? {
          arcRole: 'opening' as const,
          arcRoleLabel: 'Opening',
          throughLineMode: 'recurring_motif' as const,
          throughLineLabel: 'Route line',
        }
      : {}),
    throughLineAppearanceCount: notReady ? 0 : 1,
    revealBeatCount: notReady ? 0 : 1,
    transitionCount: notReady ? 0 : 1,
    rhythmBeatCount: notReady ? 0 : 1,
    unresolvedUncertaintyCount: 0,
    reviewRequired: state === 'ready_for_review' || state === 'needs_review',
    planReviewIsSoleApprovalAuthority: true,
    approvedLocked: state === 'approved_locked',
    priorApprovedVersionPreserved: true,
    approvedSnapshotMutationAllowed: false,
    readOnly: true,
    runtimeExecutionAuthorized: false,
    localCandidateOnly: true,
    notice: 'This read-only scene-flow status cannot approve a plan, generate media, use credits, apply a timeline change, render, export, or deliver.',
  }
}

function blockedSceneWorkspace(): MotionStudioSceneWorkspaceDto {
  return {
    productionId,
    artifacts: [],
    proposals: [],
    readiness: {
      canAuthor: false,
      canCompile: false,
      blockers: [
        'An approved plan snapshot is required before scene authoring.',
        'An exact Motion Language version is required.',
        'An exact Narrative Function version is required.',
      ],
    },
    localCandidateOnly: true,
  }
}

function createProposal(document: MotionStudioSceneArtifactSummaryDto): MotionStudioTimelineProposalDto {
  return {
    id: 'ddddddd1-3333-4333-8333-333333333333',
    productionId,
    approvedSnapshotId: snapshotId,
    sourceSceneDocument: document.version,
    targetTimelineManifestId: 'timeline-manifest-accepted-v1',
    compilerId: 'motion-studio-scene-compiler',
    compilerVersion: 'ms-scene-compiler-v1',
    inputDigest: 'd'.repeat(64),
    outputDigest: 'e'.repeat(64),
    operations: [{
      id: 'timeline-operation-1',
      kind: 'upsert_layer',
      targetCollection: 'overlayLayers',
      layer: {
        id: 'scene-layer-1',
        layerType: 'image',
        timelineRange: { startSeconds: 0, endSeconds: 4, startFrame: 0, endFrame: 120 },
        artifactIds: [],
        metadata: {
          source: 'motion_studio_scene_proposal',
          proposalOnly: true,
          sceneDocumentVersionId: document.version.versionId,
          sceneDocumentDigest: document.version.contentDigest,
        },
      },
    }],
    warnings: [],
    status: 'proposed',
    createdAt: '2026-07-20T05:05:00.000Z',
    localCandidateOnly: true,
  }
}

function emptyPreviewWorkspace(): MotionStudioPreviewWorkspaceDto {
  return { productionId, bindings: [], localCandidateOnly: true }
}

function versionReference(artifactId: string, versionId: string, digestCharacter: string) {
  return { artifactId, versionId, versionNumber: 1, contentDigest: digestCharacter.repeat(64) }
}

function isProductionRoute(url: string): boolean {
  return /\/v1\/projects\/[^/]+\/edit-sessions\/[^/]+\/motion-studio$/u.test(new URL(url).pathname)
}

function isSceneWorkspaceRoute(url: string): boolean {
  return /\/v1\/motion-studio\/productions\/[^/]+\/scene-workspace$/u.test(new URL(url).pathname)
}

function isSceneDraftRoute(url: string): boolean {
  return /\/v1\/motion-studio\/productions\/[^/]+\/scene-drafts$/u.test(new URL(url).pathname)
}

function isTimelineProposalRoute(url: string): boolean {
  return /\/v1\/motion-studio\/productions\/[^/]+\/timeline-proposals$/u.test(new URL(url).pathname)
}

function isPreviewWorkspaceRoute(url: string): boolean {
  return /\/v1\/motion-studio\/productions\/[^/]+\/preview-workspace$/u.test(new URL(url).pathname)
}

function isGenerationWorkspaceRoute(url: string): boolean {
  return /\/v1\/motion-studio\/productions\/[^/]+\/generation-workspace$/u.test(new URL(url).pathname)
}

function isLayeredWorkspaceRoute(url: string): boolean {
  return /\/v1\/motion-studio\/productions\/[^/]+\/layered-workspace$/u.test(new URL(url).pathname)
}

async function fulfillData(route: Route, data: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify({ ok: true, statusCode: status, data, warnings: [], mockOnly: false }),
  })
}

async function fulfillError(route: Route, status: number, code: string, message: string) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify({ ok: false, statusCode: status, error: { code, message }, warnings: [], mockOnly: false }),
  })
}

async function unexpectedRoute(route: Route) {
  await fulfillError(route, 404, 'UNEXPECTED_TEST_ROUTE', route.request().url())
}
