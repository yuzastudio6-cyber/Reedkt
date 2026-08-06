import { expect, test, type Route } from '@playwright/test'

import type {
  MotionStudioPreviewWorkspaceDto,
  MotionStudioProductionDto,
  MotionStudioSceneWorkspaceDto,
  MotionStudioTimelineProposalDto,
  MotionStudioVersionReference,
} from '../../src/types/motion-studio'
import {
  installActiveProductRouteFixture,
  type ActiveProductRouteFixture,
} from './helpers/active-product'
import { expectNoHorizontalOverflow, setViewport } from './helpers/layout'
import { expectNoGenerationBeforeApproval, gotoRoute } from './helpers/routes'

const apiOrigin = 'http://127.0.0.1:8791'
const productionId = '91919191-9191-4191-8191-919191919191'

test.describe('Storytelling Timeline workspace', () => {
  test.skip(process.env.MOTION_STUDIO_E2E !== 'true', 'Run with playwright.motion-studio.config.ts so the frontend-safe HTTP boundary is explicit.')

  test('shows delayed loading and an honest empty state without creating or applying work', async ({ page }) => {
    const fixture = await installActiveProductRouteFixture(page, 'storytelling-timeline-empty', { category: 'storytelling', productWorkflow: 'motion_studio.storytelling' })
    const production = createProduction(fixture)
    const sceneWorkspace = createSceneWorkspace(production.id, { approvedTiming: false })
    let sceneReads = 0
    let writes = 0
    let releaseSceneRead: () => void = () => undefined
    const sceneReadGate = new Promise<void>((resolve) => { releaseSceneRead = resolve })

    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.route(`${apiOrigin}/v1/**`, async (route) => {
      const request = route.request()
      if (request.method() !== 'GET') writes += 1
      if (isProductionRoute(request.url())) return fulfillData(route, { production })
      if (isSceneWorkspaceRoute(request.url())) {
        sceneReads += 1
        if (sceneReads === 1) await sceneReadGate
        return fulfillData(route, { sceneWorkspace })
      }
      if (isPreviewWorkspaceRoute(request.url())) return fulfillData(route, { previewWorkspace: emptyPreview(production.id) })
      return unexpectedRoute(route)
    })

    await gotoRoute(page, `${fixture.editPath}?surface=timeline`)
    const loading = page.getByTestId('storytelling-timeline-state-loading')
    await expect(loading).toBeVisible()
    expect(await loading.locator('svg').evaluate((element) => getComputedStyle(element).animationName)).toBe('none')
    releaseSceneRead()
    await expect(page.getByTestId('storytelling-timeline-state-empty')).toBeVisible()
    await expect(page.getByText('Timeline waits for approved timing')).toBeVisible()
    await expect(page.getByText('Timeline is read-only here. It cannot apply layers, move timing, render, export, or approve this story.')).toBeVisible()
    await expectNoGenerationBeforeApproval(page)
    expect(writes).toBe(0)
  })

  test('presents only exact current proposals with frame-first timing and progressive detail', async ({ page }) => {
    const fixture = await installActiveProductRouteFixture(page, 'storytelling-timeline-ready', { category: 'storytelling', productWorkflow: 'motion_studio.storytelling' })
    const production = createProduction(fixture)
    const sceneWorkspace = createSceneWorkspace(production.id, { withCurrentProposal: true, withPreviousProposal: true })
    let writes = 0

    await page.route(`${apiOrigin}/v1/**`, async (route) => {
      const request = route.request()
      if (request.method() !== 'GET') writes += 1
      if (isProductionRoute(request.url())) return fulfillData(route, { production })
      if (isSceneWorkspaceRoute(request.url())) return fulfillData(route, { sceneWorkspace })
      if (isPreviewWorkspaceRoute(request.url())) return fulfillData(route, { previewWorkspace: emptyPreview(production.id) })
      return unexpectedRoute(route)
    })

    await gotoRoute(page, `${fixture.editPath}?surface=timeline`)
    const workspace = page.getByTestId('storytelling-timeline-state-ready')
    await expect(workspace).toBeVisible()
    await expect(page.getByText('Frame-accurate timing is ready to inspect')).toBeVisible()
    await expect(page.getByText('30 fps')).toBeVisible()
    const currentProposal = page.getByRole('list', { name: 'Current timeline proposals' }).getByRole('listitem').first()
    await expect(currentProposal.getByText('Frames 0–180', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('4 planned layers')).toBeVisible()
    await expect(page.getByText('1 earlier proposal retained for traceability.')).toBeVisible()
    await expect(page.getByText('Proposal only')).toBeVisible()

    const details = workspace.getByText('Inspect layer timing')
    await expect(details).toBeVisible()
    await details.click()
    await expect(page.getByText('Visual layer 1')).toBeVisible()
    await expect(page.getByText('Caption layer 2')).toBeVisible()
    await expect(page.getByText('Audio layer 3')).toBeVisible()
    await expect(page.getByText('Mask layer 4')).toBeVisible()

    await expect(workspace).not.toContainText(/91919191|22222222|timeline-manifest|compiler|digest|provider|database|worker|customer credits/i)
    for (const width of [375, 768, 1024, 1440]) {
      await setViewport(page, width, 900)
      await expectNoHorizontalOverflow(page)
    }

    await page.reload()
    await expect(page.getByTestId('storytelling-timeline-state-ready')).toBeVisible()
    await page.getByRole('button', { name: 'Review timing in Chat' }).click()
    await expect(page).toHaveURL(fixture.editPath)
    await expect(page.getByTestId('chat-composer-textarea')).toBeVisible()
    expect(writes).toBe(0)
  })

  test('keeps display-only seconds visibly blocked and rejects invalid execution frames', async ({ page }) => {
    const fixture = await installActiveProductRouteFixture(page, 'storytelling-timeline-frame-authority', { category: 'storytelling', productWorkflow: 'motion_studio.storytelling' })
    const production = createProduction(fixture)
    const sceneWorkspace = createSceneWorkspace(production.id, { withCurrentProposal: true })
    let servedWorkspace = withoutFrames(sceneWorkspace)

    await page.route(`${apiOrigin}/v1/**`, async (route) => {
      const request = route.request()
      if (isProductionRoute(request.url())) return fulfillData(route, { production })
      if (isSceneWorkspaceRoute(request.url())) return fulfillData(route, { sceneWorkspace: servedWorkspace })
      if (isPreviewWorkspaceRoute(request.url())) return fulfillData(route, { previewWorkspace: emptyPreview(production.id) })
      return unexpectedRoute(route)
    })

    await gotoRoute(page, `${fixture.editPath}?surface=timeline`)
    await expect(page.getByText('Timeline proposal needs frame authority')).toBeVisible()
    await page.getByText('Inspect layer timing').click()
    await expect(page.getByText(/0\.00s–2\.00s display timing; frames pending/)).toBeVisible()

    servedWorkspace = withInvalidFrames(sceneWorkspace)
    await page.reload()
    await expect(page.getByTestId('storytelling-timeline-state-failure')).toBeVisible()
    await expect(page.getByText('Timeline proposal could not be verified')).toBeVisible()
    await expect(page.getByText('Nothing was applied or changed.')).toBeVisible()
  })

  test('keeps access, conflict, and recoverable failures distinct', async ({ page }) => {
    const fixture = await installActiveProductRouteFixture(page, 'storytelling-timeline-errors', { category: 'storytelling', productWorkflow: 'motion_studio.storytelling' })
    const production = createProduction(fixture)
    let sceneStatus = 403
    let writes = 0

    await page.route(`${apiOrigin}/v1/**`, async (route) => {
      const request = route.request()
      if (request.method() !== 'GET') writes += 1
      if (isProductionRoute(request.url())) return fulfillData(route, { production })
      if (isSceneWorkspaceRoute(request.url())) {
        if (sceneStatus === 200) return fulfillData(route, { sceneWorkspace: createSceneWorkspace(production.id) })
        return fulfillError(route, sceneStatus, errorCode(sceneStatus))
      }
      if (isPreviewWorkspaceRoute(request.url())) return fulfillData(route, { previewWorkspace: emptyPreview(production.id) })
      return unexpectedRoute(route)
    })

    await gotoRoute(page, `${fixture.editPath}?surface=timeline`)
    await expect(page.getByTestId('storytelling-timeline-state-permission_denied')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Try again' })).toHaveCount(0)

    sceneStatus = 409
    await page.reload()
    await expect(page.getByTestId('storytelling-timeline-state-conflict')).toBeVisible()

    sceneStatus = 500
    await page.reload()
    await expect(page.getByTestId('storytelling-timeline-state-failure')).toBeVisible()
    sceneStatus = 200
    await page.getByRole('button', { name: 'Try again' }).click()
    await expect(page.getByTestId('storytelling-timeline-state-empty')).toBeVisible()
    expect(writes).toBe(0)
  })
})

function createProduction(fixture: ActiveProductRouteFixture): MotionStudioProductionDto {
  return {
    id: productionId,
    projectId: fixture.project.id,
    editSessionId: fixture.edit.editSessionId,
    moduleId: 'storytelling',
    moduleCatalogVersion: 'motion-studio-module-catalog-v1',
    stageProfileId: 'motion-studio-storytelling-stage-profile-v1',
    status: 'draft',
    currentStage: 'scene_board',
    workspaceMode: 'guided',
    defaultProductionMode: 'hybrid_directed',
    userFacingStrategy: "Director's Hybrid",
    recordVersion: 1,
    createdAt: '2026-07-19T13:00:00.000Z',
    updatedAt: '2026-07-19T13:00:00.000Z',
    localCandidateOnly: true,
  }
}

function createSceneWorkspace(
  targetProductionId: string,
  options: { approvedTiming?: boolean; withCurrentProposal?: boolean; withPreviousProposal?: boolean } = {},
): MotionStudioSceneWorkspaceDto {
  const document = sceneDocumentVersion()
  const currentProposal = createProposal(targetProductionId, document, '22222222-2222-4222-8222-222222222222')
  const previousProposal = {
    ...currentProposal,
    id: 'ddddddd2-3333-4333-8333-333333333333',
    approvedSnapshotId: '33333333-3333-4333-8333-333333333333',
    createdAt: '2026-07-18T11:00:00.000Z',
  }
  return {
    productionId: targetProductionId,
    artifacts: options.withCurrentProposal ? [{
      artifactId: document.artifactId,
      kind: 'scene_document',
      version: document,
      state: 'approved',
      label: 'Opening operation scene',
      sceneId: 'aaaaaaa1-1111-4111-8111-111111111111',
    }] : [],
    proposals: [
      ...(options.withCurrentProposal ? [currentProposal] : []),
      ...(options.withPreviousProposal ? [previousProposal] : []),
    ],
    ...(options.approvedTiming === false ? {} : { latestApprovedSnapshot: {
      id: '22222222-2222-4222-8222-222222222222',
      targetTimelineManifestId: 'timeline-manifest-accepted-v1',
      timingAuthorityDigest: 'a'.repeat(64),
      frameRate: 30,
      timingAnchors: [
        { id: 'scene-start', frame: 0 },
        { id: 'visual-end', frame: 60 },
        { id: 'caption-end', frame: 120 },
        { id: 'scene-end', frame: 180 },
      ],
    } }),
    readiness: {
      canAuthor: true,
      canCompile: Boolean(options.withCurrentProposal),
      blockers: options.withCurrentProposal ? [] : ['Approve one SceneDocument before compiling its timeline proposal.'],
    },
    localCandidateOnly: true,
  }
}

function createProposal(
  targetProductionId: string,
  document: MotionStudioVersionReference,
  approvedSnapshotId: string,
): MotionStudioTimelineProposalDto {
  const collections = ['overlayLayers', 'captionLayers', 'audioLayers', 'maskLayers'] as const
  const frameRanges = [[0, 60], [60, 120], [120, 180], [0, 180]] as const
  return {
    id: 'ddddddd1-3333-4333-8333-333333333333',
    productionId: targetProductionId,
    approvedSnapshotId,
    sourceSceneDocument: document,
    targetTimelineManifestId: 'timeline-manifest-accepted-v1',
    compilerId: 'motion-studio-scene-compiler',
    compilerVersion: 'ms-scene-compiler-v1',
    inputDigest: 'd'.repeat(64),
    outputDigest: 'e'.repeat(64),
    operations: collections.map((targetCollection, index) => {
      const [startFrame, endFrame] = frameRanges[index]!
      return {
        id: `timeline-operation-${index + 1}`,
        kind: 'upsert_layer' as const,
        targetCollection,
        layer: {
          id: `scene-layer-${index + 1}`,
          layerType: targetCollection === 'captionLayers' ? 'caption' : targetCollection === 'audioLayers' ? 'audio' : 'image',
          timelineRange: { startSeconds: startFrame / 30, endSeconds: endFrame / 30, startFrame, endFrame },
          artifactIds: index === 0 ? ['private-scene-asset-1'] : [],
          metadata: {
            source: 'motion_studio_scene_proposal',
            proposalOnly: true,
            sceneDocumentVersionId: document.versionId,
            sceneDocumentDigest: document.contentDigest,
          },
        },
      }
    }),
    warnings: ['Confirm the final caption read time during review.'],
    status: 'proposed',
    createdAt: '2026-07-19T14:00:00.000Z',
    localCandidateOnly: true,
  }
}

function sceneDocumentVersion(): MotionStudioVersionReference {
  return {
    artifactId: 'aaaaaaa8-1111-4111-8111-111111111111',
    versionId: 'aaaaaaa9-1111-4111-8111-111111111111',
    versionNumber: 3,
    contentDigest: '8'.repeat(64),
  }
}

function emptyPreview(targetProductionId: string): MotionStudioPreviewWorkspaceDto {
  return { productionId: targetProductionId, bindings: [], localCandidateOnly: true }
}

function withoutFrames(workspace: MotionStudioSceneWorkspaceDto): MotionStudioSceneWorkspaceDto {
  return {
    ...workspace,
    proposals: workspace.proposals.map((proposal) => ({
      ...proposal,
      operations: proposal.operations.map((operation) => ({
        ...operation,
        layer: {
          ...operation.layer,
          timelineRange: {
            startSeconds: operation.layer.timelineRange.startSeconds,
            endSeconds: operation.layer.timelineRange.endSeconds,
          },
        },
      })),
    })),
  }
}

function withInvalidFrames(workspace: MotionStudioSceneWorkspaceDto): MotionStudioSceneWorkspaceDto {
  const proposal = workspace.proposals[0]!
  const operation = proposal.operations[0]!
  return {
    ...workspace,
    proposals: [{
      ...proposal,
      operations: [{
        ...operation,
        layer: {
          ...operation.layer,
          timelineRange: { ...operation.layer.timelineRange, startFrame: 60, endFrame: 30 },
        },
      }, ...proposal.operations.slice(1)],
    }],
  }
}

function isProductionRoute(url: string): boolean {
  return /\/v1\/projects\/[^/]+\/edit-sessions\/[^/]+\/motion-studio$/u.test(new URL(url).pathname)
}

function isSceneWorkspaceRoute(url: string): boolean {
  return /\/v1\/motion-studio\/productions\/[^/]+\/scene-workspace$/u.test(new URL(url).pathname)
}

function isPreviewWorkspaceRoute(url: string): boolean {
  return /\/v1\/motion-studio\/productions\/[^/]+\/preview-workspace$/u.test(new URL(url).pathname)
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

function errorCode(status: number): string {
  if (status === 403) return 'MOTION_STUDIO_ACCESS_DENIED'
  if (status === 409) return 'MOTION_STUDIO_VERSION_CONFLICT'
  return 'MOTION_STUDIO_INTERNAL_ERROR'
}
