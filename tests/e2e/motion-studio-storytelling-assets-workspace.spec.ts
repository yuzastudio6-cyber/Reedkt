import { expect, test, type Route } from '@playwright/test'

import type {
  MotionStudioGenerationBindingDto,
  MotionStudioGenerationWorkspaceDto,
  MotionStudioLayeredAssemblyDto,
  MotionStudioLayeredCutoutArtifactDto,
  MotionStudioLayeredWorkspaceDto,
  MotionStudioLiveGenerationWorkspaceDto,
  MotionStudioPreviewBindingDto,
  MotionStudioPreviewWorkspaceDto,
  MotionStudioProductionDto,
  MotionStudioSceneWorkspaceDto,
  MotionStudioVersionReference,
} from '../../src/types/motion-studio'
import {
  installActiveProductRouteFixture,
  type ActiveProductRouteFixture,
} from './helpers/active-product'
import { expectNoHorizontalOverflow, setViewport } from './helpers/layout'
import { expectNoGenerationBeforeApproval, gotoRoute } from './helpers/routes'

const apiOrigin = 'http://127.0.0.1:8791'
const productionId = '92929292-9292-4292-8292-929292929292'
const snapshotId = '22222222-2222-4222-8222-222222222222'
const document = versionReference(
  'aaaaaaa8-1111-4111-8111-111111111111',
  'aaaaaaa9-1111-4111-8111-111111111111',
  '8',
  3,
)
const proposalId = 'ddddddd1-3333-4333-8333-333333333333'
const proposalDigest = 'e'.repeat(64)

test.describe('Storytelling Assets workspace', () => {
  test.skip(process.env.MOTION_STUDIO_E2E !== 'true', 'Run with playwright.motion-studio.config.ts so the frontend-safe HTTP boundary is explicit.')

  test('shows delayed loading and an honest pre-approval empty state without mutations', async ({ page }) => {
    const fixture = await installActiveProductRouteFixture(page, 'storytelling-assets-empty', { category: 'storytelling', productWorkflow: 'motion_studio.storytelling' })
    const production = createProduction(fixture)
    let writes = 0
    let releaseSceneRead: () => void = () => undefined
    const sceneGate = new Promise<void>((resolve) => { releaseSceneRead = resolve })
    let sceneReads = 0
    let holdSceneRead = false

    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.route(`${apiOrigin}/v1/**`, async (route) => {
      const request = route.request()
      if (request.method() !== 'GET') writes += 1
      if (isProductionRoute(request.url())) return fulfillData(route, { production })
      if (isSceneWorkspaceRoute(request.url())) {
        sceneReads += 1
        if (holdSceneRead && sceneReads === 1) await sceneGate
        return fulfillData(route, { sceneWorkspace: createSceneWorkspace(production.id, false) })
      }
      if (isPreviewWorkspaceRoute(request.url())) return fulfillData(route, { previewWorkspace: emptyPreview(production.id) })
      if (isLayeredWorkspaceRoute(request.url())) return fulfillData(route, { layeredWorkspace: emptyLayered(production.id) })
      if (isGenerationWorkspaceRoute(request.url())) return fulfillData(route, { generationWorkspace: emptyGeneration(production.id) })
      if (isLiveGenerationWorkspaceRoute(request.url())) return fulfillData(route, { liveGenerationWorkspace: emptyLive(production.id) })
      return unexpectedRoute(route)
    })

    await gotoRoute(page, `${fixture.editPath}?surface=assets`)
    await expect(page.getByTestId('storytelling-assets-state-empty')).toBeVisible()
    sceneReads = 0
    holdSceneRead = true
    await page.reload()
    const loading = page.getByTestId('storytelling-assets-state-loading')
    await expect(loading).toBeVisible()
    expect(await loading.locator('svg').evaluate((element) => getComputedStyle(element).animationName)).toBe('none')
    releaseSceneRead()
    await expect(page.getByTestId('storytelling-assets-state-empty')).toBeVisible()
    await expect(page.getByText('Assets wait for an approved story plan')).toBeVisible()
    await expect(page.getByText('Assets are read-only here. This view cannot generate, replace, approve, apply, render, export, or deliver media.')).toBeVisible()
    await expectNoGenerationBeforeApproval(page)
    expect(writes).toBe(0)
  })

  test('shows only exact current visual records with truthful rights, readiness, and retained history', async ({ page }) => {
    const fixture = await installActiveProductRouteFixture(page, 'storytelling-assets-ready', { category: 'storytelling', productWorkflow: 'motion_studio.storytelling' })
    const production = createProduction(fixture)
    const sceneWorkspace = createSceneWorkspace(production.id, true)
    const currentPreview = createPreviewBinding(production.id, true)
    const previousPreview = createPreviewBinding(production.id, false)
    const layeredAssembly = createLayeredAssembly(production.id)
    const generationBinding = createGenerationBinding(production.id)
    let writes = 0

    await page.route(`${apiOrigin}/v1/**`, async (route) => {
      const request = route.request()
      if (request.method() !== 'GET') writes += 1
      if (isProductionRoute(request.url())) return fulfillData(route, { production })
      if (isSceneWorkspaceRoute(request.url())) return fulfillData(route, { sceneWorkspace })
      if (isPreviewWorkspaceRoute(request.url())) return fulfillData(route, { previewWorkspace: {
        productionId: production.id,
        bindings: [currentPreview, previousPreview],
        localCandidateOnly: true,
      } satisfies MotionStudioPreviewWorkspaceDto })
      if (isLayeredWorkspaceRoute(request.url())) return fulfillData(route, { layeredWorkspace: {
        productionId: production.id,
        assemblies: [layeredAssembly],
        localCandidateOnly: true,
      } satisfies MotionStudioLayeredWorkspaceDto })
      if (isGenerationWorkspaceRoute(request.url())) return fulfillData(route, { generationWorkspace: {
        productionId: production.id,
        bindings: [generationBinding],
        realProviderExecutionAuthorized: false,
        localCandidateOnly: true,
      } satisfies MotionStudioGenerationWorkspaceDto })
      if (isLiveGenerationWorkspaceRoute(request.url())) return fulfillData(route, { liveGenerationWorkspace: createUnscopedLiveRecord(production.id) })
      return unexpectedRoute(route)
    })

    await gotoRoute(page, `${fixture.editPath}?surface=assets`)
    const workspace = page.getByTestId('storytelling-assets-state-ready')
    await expect(workspace).toBeVisible()
    await expect(page.getByText('Current visual records need attention')).toBeVisible()
    await expect(page.getByRole('list', { name: 'Current Storytelling assets' }).getByRole('listitem')).toHaveCount(3)
    await expect(page.getByText('Verified review file', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('License review required', { exact: true })).toBeVisible()
    await expect(page.getByText('Test evidence only', { exact: true })).toBeVisible()
    await expect(page.getByText('1 earlier asset record retained outside the current approved story version.')).toBeVisible()
    await expect(page.getByText('1 retained media record omitted because its approved story version is not included in the browser-safe record.')).toBeVisible()

    const previewRow = page.getByTestId('storytelling-asset-preview')
    await expect(previewRow.getByText('Private scene preview · plan version 3')).toBeVisible()
    const details = previewRow.locator('summary')
    await details.focus()
    await expect(details).toBeFocused()
    await details.press('Enter')
    await expect(previewRow.getByText('MP4 · 640×360')).toBeVisible()
    await expect(previewRow.getByText('120 frames at 30 fps')).toBeVisible()

    await expect(workspace).not.toContainText(/92929292|22222222|timeline-manifest|digest|provider|database|worker|customer credits|internal cost/i)
    for (const width of [375, 768, 1024, 1440]) {
      await setViewport(page, width, 900)
      await expectNoHorizontalOverflow(page)
    }

    await page.reload()
    await expect(page.getByTestId('storytelling-assets-state-ready')).toBeVisible()
    await page.getByRole('button', { name: 'Review assets in Chat' }).click()
    await expect(page).toHaveURL(fixture.editPath)
    await expect(page.getByTestId('chat-composer-textarea')).toBeVisible()
    expect(writes).toBe(0)
  })

  test('fails closed when a current asset does not match the approved proposal', async ({ page }) => {
    const fixture = await installActiveProductRouteFixture(page, 'storytelling-assets-lineage', { category: 'storytelling', productWorkflow: 'motion_studio.storytelling' })
    const production = createProduction(fixture)
    const mismatchedPreview = {
      ...createPreviewBinding(production.id, true),
      timelineProposalOutputDigest: 'f'.repeat(64),
    }

    await page.route(`${apiOrigin}/v1/**`, async (route) => {
      const request = route.request()
      if (isProductionRoute(request.url())) return fulfillData(route, { production })
      if (isSceneWorkspaceRoute(request.url())) return fulfillData(route, { sceneWorkspace: createSceneWorkspace(production.id, true) })
      if (isPreviewWorkspaceRoute(request.url())) return fulfillData(route, { previewWorkspace: {
        productionId: production.id,
        bindings: [mismatchedPreview],
        localCandidateOnly: true,
      } })
      if (isLayeredWorkspaceRoute(request.url())) return fulfillData(route, { layeredWorkspace: emptyLayered(production.id) })
      if (isGenerationWorkspaceRoute(request.url())) return fulfillData(route, { generationWorkspace: emptyGeneration(production.id) })
      if (isLiveGenerationWorkspaceRoute(request.url())) return fulfillData(route, { liveGenerationWorkspace: emptyLive(production.id) })
      return unexpectedRoute(route)
    })

    await gotoRoute(page, `${fixture.editPath}?surface=assets`)
    await expect(page.getByTestId('storytelling-assets-state-failure')).toBeVisible()
    await expect(page.getByText('Current asset lineage could not be verified')).toBeVisible()
    await expect(page.getByText('Nothing was accepted, replaced, or changed.')).toBeVisible()
    await expect(page.getByRole('list', { name: 'Current Storytelling assets' })).toHaveCount(0)
  })

  test('keeps access, conflict, recoverable failure, and partial results distinct', async ({ page }) => {
    const fixture = await installActiveProductRouteFixture(page, 'storytelling-assets-errors', { category: 'storytelling', productWorkflow: 'motion_studio.storytelling' })
    const production = createProduction(fixture)
    let sceneStatus = 403
    let generationStatus = 200
    let writes = 0

    await page.route(`${apiOrigin}/v1/**`, async (route) => {
      const request = route.request()
      if (request.method() !== 'GET') writes += 1
      if (isProductionRoute(request.url())) return fulfillData(route, { production })
      if (isSceneWorkspaceRoute(request.url())) {
        if (sceneStatus === 200) return fulfillData(route, { sceneWorkspace: createSceneWorkspace(production.id, true) })
        return fulfillError(route, sceneStatus, errorCode(sceneStatus))
      }
      if (isPreviewWorkspaceRoute(request.url())) return fulfillData(route, { previewWorkspace: {
        productionId: production.id,
        bindings: [createPreviewBinding(production.id, true)],
        localCandidateOnly: true,
      } })
      if (isLayeredWorkspaceRoute(request.url())) return fulfillData(route, { layeredWorkspace: emptyLayered(production.id) })
      if (isGenerationWorkspaceRoute(request.url())) {
        if (generationStatus === 200) return fulfillData(route, { generationWorkspace: emptyGeneration(production.id) })
        return fulfillError(route, generationStatus, errorCode(generationStatus))
      }
      if (isLiveGenerationWorkspaceRoute(request.url())) return fulfillData(route, { liveGenerationWorkspace: emptyLive(production.id) })
      return unexpectedRoute(route)
    })

    await gotoRoute(page, `${fixture.editPath}?surface=assets`)
    await expect(page.getByTestId('storytelling-assets-state-permission_denied')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Try again' })).toHaveCount(0)

    sceneStatus = 409
    await page.reload()
    await expect(page.getByTestId('storytelling-assets-state-conflict')).toBeVisible()

    sceneStatus = 500
    await page.reload()
    await expect(page.getByTestId('storytelling-assets-state-failure')).toBeVisible()

    sceneStatus = 200
    generationStatus = 500
    await page.getByRole('button', { name: 'Try again' }).click()
    await expect(page.getByTestId('storytelling-assets-state-ready')).toBeVisible()
    await expect(page.getByText(/generated visuals could not be confirmed/)).toBeVisible()
    await expect(page.getByTestId('storytelling-asset-preview')).toBeVisible()
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

function createSceneWorkspace(targetProductionId: string, approved: boolean): MotionStudioSceneWorkspaceDto {
  const proposal = {
    id: proposalId,
    productionId: targetProductionId,
    approvedSnapshotId: snapshotId,
    sourceSceneDocument: document,
    targetTimelineManifestId: 'timeline-manifest-accepted-v1',
    compilerId: 'motion-studio-scene-compiler' as const,
    compilerVersion: 'ms-scene-compiler-v1',
    inputDigest: 'd'.repeat(64),
    outputDigest: proposalDigest,
    operations: [{
      id: 'timeline-operation-1',
      kind: 'upsert_layer' as const,
      targetCollection: 'overlayLayers' as const,
      layer: {
        id: 'scene-layer-1',
        layerType: 'image',
        timelineRange: { startSeconds: 0, endSeconds: 4, startFrame: 0, endFrame: 120 },
        artifactIds: ['private-scene-asset-1'],
        metadata: {
          source: 'motion_studio_scene_proposal',
          proposalOnly: true,
          sceneDocumentVersionId: document.versionId,
          sceneDocumentDigest: document.contentDigest,
        },
      },
    }],
    warnings: [],
    status: 'proposed' as const,
    createdAt: '2026-07-19T14:00:00.000Z',
    localCandidateOnly: true as const,
  }
  return {
    productionId: targetProductionId,
    artifacts: approved ? [{
      artifactId: document.artifactId,
      kind: 'scene_document',
      version: document,
      state: 'approved',
      label: 'Opening operation scene',
      sceneId: 'aaaaaaa1-1111-4111-8111-111111111111',
    }] : [],
    proposals: approved ? [proposal] : [],
    ...(approved ? { latestApprovedSnapshot: {
      id: snapshotId,
      targetTimelineManifestId: 'timeline-manifest-accepted-v1',
      timingAuthorityDigest: 'a'.repeat(64),
      frameRate: 30,
      timingAnchors: [{ id: 'scene-start', frame: 0 }, { id: 'scene-end', frame: 120 }],
    } } : {}),
    readiness: { canAuthor: true, canCompile: approved, blockers: approved ? [] : ['Approve the story plan first.'] },
    localCandidateOnly: true,
  }
}

function createPreviewBinding(targetProductionId: string, current: boolean): MotionStudioPreviewBindingDto {
  const id = current ? '88888888-8888-4888-8888-888888888888' : '88888889-8888-4888-8888-888888888888'
  const jobId = current ? '77777777-7777-4777-8777-777777777777' : '77777778-7777-4777-8777-777777777777'
  const attemptId = current ? '99999999-9999-4999-8999-999999999999' : '99999998-9999-4999-8999-999999999999'
  return {
    id,
    productionId: targetProductionId,
    approvedSnapshotId: current ? snapshotId : '33333333-3333-4333-8333-333333333333',
    sceneDocument: document,
    timelineProposalId: proposalId,
    timelineProposalOutputDigest: proposalDigest,
    jobId,
    approvedWorkItemId: current ? '55555555-5555-4555-8555-555555555555' : '55555556-5555-4555-8555-555555555555',
    compositionProfileId: 'motion_studio_scene_preview_v1',
    width: 640,
    height: 360,
    fpsNumerator: 30,
    fpsDenominator: 1,
    durationFrames: 120,
    sceneStartFrame: 0,
    sceneEndFrame: 120,
    status: 'ready',
    currentAttemptId: attemptId,
    artifact: {
      id: current ? 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' : 'aaaaaaab-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      bindingId: id,
      jobId,
      attemptId,
      sha256: current ? '0'.repeat(64) : '1'.repeat(64),
      byteLength: 4_096,
      mimeType: 'video/mp4',
      codec: 'h264',
      pixelFormat: 'yuv420p',
      colorSpace: 'bt709',
      width: 640,
      height: 360,
      fpsNumerator: 30,
      fpsDenominator: 1,
      durationFrames: 120,
      sceneStartFrame: 0,
      sceneEndFrame: 120,
      frameEvidence: [
        { frame: 0, sha256: '2'.repeat(64) },
        { frame: 59, sha256: '3'.repeat(64) },
        { frame: 119, sha256: '4'.repeat(64) },
      ],
      runtimeIdentityDigest: '5'.repeat(64),
      attestationDigest: '6'.repeat(64),
      qaEvidenceDigest: '7'.repeat(64),
      createdAt: '2026-07-19T14:10:00.000Z',
      localCandidateOnly: true,
    },
    createdAt: '2026-07-19T14:08:00.000Z',
    localCandidateOnly: true,
  }
}

function createGenerationBinding(targetProductionId: string): MotionStudioGenerationBindingDto {
  const bindingId = 'a2000001-0000-4000-8000-000000000001'
  const operationId = 'a3000001-0000-4000-8000-000000000001'
  const jobId = 'a1000001-0000-4000-8000-000000000001'
  return {
    id: bindingId,
    productionId: targetProductionId,
    approvedSnapshotId: snapshotId,
    sceneDocument: document,
    timelineProposalId: proposalId,
    timelineProposalOutputDigest: proposalDigest,
    jobId,
    jobStatus: 'succeeded',
    mediaKind: 'still_image',
    shotSpec: {
      schemaVersion: 'motion-studio-generation-shot-spec-v1',
      productionId: targetProductionId,
      approvedSnapshotId: snapshotId,
      sceneId: 'aaaaaaa1-1111-4111-8111-111111111111',
      semanticPurpose: 'Prepare one bounded local still for protocol review.',
      mediaKind: 'still_image',
      timingAuthority: {
        masterTimingPlanVersionId: 'master-timing-plan-assets-v1',
        confirmedFrameId: 'confirmed-frame-assets-v1',
        timingAuthorityDigest: 'a'.repeat(64),
        frameRate: 30,
        width: 1_024,
        height: 1_024,
        aspectRatio: '1:1',
        durationFrames: 120,
        timebase: '1/30',
      },
      sceneRange: { startFrame: 0, endFrame: 120 },
      visualDirection: 'A restrained editorial field for local protocol conformance only.',
      primaryAction: 'Hold one exact draft frame.',
      cameraBehavior: 'Static and bounded.',
      continuityProfileId: 'continuity-assets-v1',
      references: [],
      output: { quality: 'draft', imageFormat: 'png' },
      deterministicOverlayPolicy: {
        exactTextInProviderMediaAllowed: false,
        captionsInProviderMediaAllowed: false,
        chartsInProviderMediaAllowed: false,
        mapsInProviderMediaAllowed: false,
        statisticsInProviderMediaAllowed: false,
        logosInProviderMediaAllowed: false,
        finalCanvasOwnedByRemotion: true,
      },
      exclusions: ['No exact text or data inside generated media.'],
      qaRequirements: ['checksum', 'media_facts', 'safety'],
      simulatorPolicy: {
        allowed: true,
        outputIsProviderGenerated: false,
        finalAssetEligible: false,
        qualityCalibrationMeasured: false,
      },
    },
    shotSpecDigest: '6'.repeat(64),
    routePolicy: {
      policyId: 'motion_studio_generation_route_policy_v1',
      modelTier: 'basic',
      mediaKind: 'still_image',
      candidates: [{
        providerRoute: 'gpt_image_2',
        routeRole: 'primary',
        supportedMediaKind: 'still_image',
        allowedTiers: ['basic', 'pro', 'premium'],
        finalFallbackOnly: false,
        capabilityReason: 'Registered still route for a bounded local protocol fixture.',
      }],
      automaticFallbackAllowed: false,
      newApprovalRequiredForFallback: true,
      exactTextDataAndLogosRemainDeterministic: true,
    },
    routePolicyDigest: '7'.repeat(64),
    providerOperation: {
      id: operationId,
      bindingId,
      jobId,
      attemptId: 'a1000003-0000-4000-8000-000000000001',
      providerRoute: 'gpt_image_2',
      providerAdapterId: 'motion_studio_protocol_simulator_v1',
      providerModelVersion: 'local-protocol-fixture',
      executionClass: 'protocol_simulator',
      status: 'completed',
      requestDigest: '4'.repeat(64),
      lastEventType: 'operation_completed',
      lastEventAt: '2026-07-19T14:15:00.000Z',
      pollCount: 1,
      signatureVerifiedEventCount: 1,
      providerCostIncurred: false,
      createdAt: '2026-07-19T14:12:00.000Z',
      updatedAt: '2026-07-19T14:15:00.000Z',
    },
    candidate: {
      id: 'a5000001-0000-4000-8000-000000000001',
      bindingId,
      providerOperationId: operationId,
      media: {
        assetId: 'a4000001-0000-4000-8000-000000000001',
        assetVersionId: 'a4000002-0000-4000-8000-000000000001',
        versionNumber: 1,
        mediaKind: 'still_image',
        mimeType: 'image/png',
        sha256: '9'.repeat(64),
        byteLength: 2_048,
        width: 1_024,
        height: 1_024,
        qaStatus: 'passed',
        finalAssetEligible: false,
        protocolSimulatorOnly: true,
        createdAt: '2026-07-19T14:16:00.000Z',
      },
      qaEvidenceDigest: '5'.repeat(64),
      safetyStatus: 'passed',
      reviewStatus: 'review_needed',
      referenceAdherenceMeasured: false,
      visualQualityMeasured: false,
      finalAssetEligible: false,
      protocolSimulatorOnly: true,
      createdAt: '2026-07-19T14:16:00.000Z',
    },
    createdAt: '2026-07-19T14:11:00.000Z',
    protocolSimulatorOnly: true,
    localCandidateOnly: true,
  }
}

function createLayeredAssembly(targetProductionId: string): MotionStudioLayeredAssemblyDto {
  const assemblyId = '93000001-0000-4000-8000-000000000001'
  const cutoutJobId = '91000001-0000-4000-8000-000000000001'
  const renderJobId = '92000001-0000-4000-8000-000000000001'
  const bindingId = '94000001-0000-4000-8000-000000000001'
  const cutout = createCutout(assemblyId, cutoutJobId)
  return {
    id: assemblyId,
    productionId: targetProductionId,
    approvedSnapshotId: snapshotId,
    sceneDocument: document,
    timelineProposalId: proposalId,
    timelineProposalOutputDigest: proposalDigest,
    cutoutJobId,
    renderJobId,
    layerManifest: {
      schemaVersion: 'motion-studio-layer-manifest-v1',
      compositionProfileId: 'motion_studio_native_layered_scene_v1',
      depthModel: 'semantic_planes_v1',
      sceneId: 'aaaaaaa1-1111-4111-8111-111111111111',
      semanticPurpose: 'Orient the viewer before the operation begins.',
      headline: 'Orient the viewer before the operation begins.',
      caption: 'Review · Orient the viewer before the operation begins.',
      timingAuthority: {
        masterTimingPlanVersionId: 'master-timing-plan-assets-v1',
        confirmedFrameId: 'confirmed-frame-assets-v1',
        timingAuthorityDigest: 'a'.repeat(64),
        frameRate: 30,
        width: 640,
        height: 360,
        aspectRatio: '16:9',
        durationFrames: 120,
        timebase: '1/30',
      },
      sceneRange: { startFrame: 0, endFrame: 120 },
      planes: [
        { planeId: 'background-plane', role: 'background', zIndex: 0, sourceKind: 'remotion_native', motionToken: 'ambient_drift', editablePropertyKeys: ['design.background_token'] },
        { planeId: 'headline-plane', role: 'headline', zIndex: 10, sourceKind: 'remotion_native', motionToken: 'headline_reveal', editablePropertyKeys: ['scene.semantic_purpose'] },
        { planeId: 'subject-plane', role: 'subject', zIndex: 20, sourceKind: 'approved_cutout_slot', motionToken: 'subject_parallax', editablePropertyKeys: ['asset.subject_cutout'] },
        { planeId: 'caption-plane', role: 'caption', zIndex: 30, sourceKind: 'remotion_native', motionToken: 'caption_hold', editablePropertyKeys: ['scene.caption_copy'] },
      ],
      design: {
        panelBackground: '#0F172A',
        panelHighlight: '#16213E',
        headlineColor: '#E0F2FE',
        accentColor: '#FF4D8D',
        captionColor: '#F8FAFC',
      },
      safeZones: { horizontalPercent: 8, verticalPercent: 8, captionBottomPercent: 9 },
      maskPolicy: {
        sourceFixtureId: 'server_owned_rembg_portrait_v1',
        maskRisk: 'low_fixture_only',
        contactObjectPresent: false,
        captionAboveMask: true,
        callerMediaAllowed: false,
        automaticDepthModelUsed: false,
        productionLicenseReviewRequired: true,
      },
      fallbackPolicy: {
        automaticFallbackAllowed: false,
        aiVideoFallbackAllowed: false,
        approvedAlternative: 'new_approval_required_for_full_panel_native_graphics',
      },
      revisionPolicy: {
        immutableAssembly: true,
        newSceneDocumentVersionRequired: true,
        freeFormLayerJsonAllowed: false,
      },
    },
    layerManifestDigest: 'f'.repeat(64),
    cutoutStatus: 'succeeded',
    renderStatus: 'succeeded',
    cutout,
    renderBinding: {
      id: bindingId,
      productionId: targetProductionId,
      approvedSnapshotId: snapshotId,
      sceneDocument: document,
      timelineProposalId: proposalId,
      timelineProposalOutputDigest: proposalDigest,
      jobId: renderJobId,
      approvedWorkItemId: '92000002-0000-4000-8000-000000000001',
      compositionProfileId: 'motion_studio_native_layered_scene_v1',
      layeredAssemblyId: assemblyId,
      width: 640,
      height: 360,
      fpsNumerator: 30,
      fpsDenominator: 1,
      durationFrames: 120,
      sceneStartFrame: 0,
      sceneEndFrame: 120,
      status: 'ready',
      currentAttemptId: '95000001-0000-4000-8000-000000000001',
      artifact: createLayeredPreview(bindingId, renderJobId),
      createdAt: '2026-07-19T14:20:00.000Z',
      localCandidateOnly: true,
    },
    createdAt: '2026-07-19T14:18:00.000Z',
    fixtureOnly: true,
    localCandidateOnly: true,
  }
}

function createCutout(assemblyId: string, jobId: string): MotionStudioLayeredCutoutArtifactDto {
  return {
    id: '96000001-0000-4000-8000-000000000001',
    assemblyId,
    jobId,
    attemptId: '97000001-0000-4000-8000-000000000001',
    sha256: '6'.repeat(64),
    byteLength: 3_231,
    mimeType: 'image/png',
    width: 128,
    height: 128,
    alphaMinimum: 0,
    alphaMaximum: 255,
    alphaUniqueValueCount: 160,
    foregroundAlphaMean: 226.802912,
    backgroundAlphaMean: 2.492606,
    subjectCoverageVerified: true,
    modelId: 'u2netp',
    modelSha256: '7'.repeat(64),
    executionDurationMilliseconds: 812,
    qaEvidenceDigest: '8'.repeat(64),
    createdAt: '2026-07-19T14:21:00.000Z',
    fixtureOnly: true,
    productionLicenseReviewRequired: true,
    localCandidateOnly: true,
  }
}

function createLayeredPreview(bindingId: string, jobId: string): NonNullable<MotionStudioPreviewBindingDto['artifact']> {
  return {
    id: '98000001-0000-4000-8000-000000000001',
    bindingId,
    jobId,
    attemptId: '95000001-0000-4000-8000-000000000001',
    sha256: '9'.repeat(64),
    byteLength: 4_096,
    mimeType: 'video/mp4',
    codec: 'h264',
    pixelFormat: 'yuv420p',
    colorSpace: 'bt709',
    width: 640,
    height: 360,
    fpsNumerator: 30,
    fpsDenominator: 1,
    durationFrames: 120,
    sceneStartFrame: 0,
    sceneEndFrame: 120,
    frameEvidence: [
      { frame: 0, sha256: 'a'.repeat(64) },
      { frame: 59, sha256: 'b'.repeat(64) },
      { frame: 119, sha256: 'c'.repeat(64) },
    ],
    runtimeIdentityDigest: 'd'.repeat(64),
    attestationDigest: 'e'.repeat(64),
    qaEvidenceDigest: 'f'.repeat(64),
    createdAt: '2026-07-19T14:22:00.000Z',
    localCandidateOnly: true,
  }
}

function createUnscopedLiveRecord(targetProductionId: string): MotionStudioLiveGenerationWorkspaceDto {
  return {
    productionId: targetProductionId,
    evidenceClass: 'real_provider',
    persistenceClass: 'local_canonical_evidence',
    operations: [{
      operationKind: 'gpt_image_generation',
      state: 'approved',
      callCount: 1,
      reconciliationRequired: false,
      manualActionRequired: false,
      updatedAt: '2026-07-19T14:30:00.000Z',
      candidate: {
        candidateId: 'b5000001-0000-4000-8000-000000000001',
        assetVersionId: 'b4000001-0000-4000-8000-000000000001',
        mediaKind: 'still_image',
        mimeType: 'image/png',
        sha256: '1'.repeat(64),
        byteLength: 4_096,
        width: 1_280,
        height: 720,
        technicalQaStatus: 'passed',
        technicalQaEvidenceDigest: '2'.repeat(64),
        automatedSafetyStatus: 'passed',
        review: { decision: 'approved', reviewedAt: '2026-07-19T14:30:00.000Z' },
        finalAssetEligible: true,
        privateProjectAsset: true,
      },
      fallbackState: 'not_applicable',
    }],
    realProviderEvidence: true,
    simulatorOnly: false,
    browserProviderTransportAllowed: false,
    internalCostExposed: false,
  }
}

function emptyPreview(targetProductionId: string): MotionStudioPreviewWorkspaceDto {
  return { productionId: targetProductionId, bindings: [], localCandidateOnly: true }
}

function emptyGeneration(targetProductionId: string): MotionStudioGenerationWorkspaceDto {
  return { productionId: targetProductionId, bindings: [], realProviderExecutionAuthorized: false, localCandidateOnly: true }
}

function emptyLayered(targetProductionId: string): MotionStudioLayeredWorkspaceDto {
  return { productionId: targetProductionId, assemblies: [], localCandidateOnly: true }
}

function emptyLive(targetProductionId: string): MotionStudioLiveGenerationWorkspaceDto {
  return {
    productionId: targetProductionId,
    evidenceClass: 'real_provider',
    persistenceClass: 'local_canonical_evidence',
    operations: [],
    realProviderEvidence: true,
    simulatorOnly: false,
    browserProviderTransportAllowed: false,
    internalCostExposed: false,
  }
}

function versionReference(artifactId: string, versionId: string, digestCharacter: string, versionNumber = 1): MotionStudioVersionReference {
  return { artifactId, versionId, versionNumber, contentDigest: digestCharacter.repeat(64) }
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

function isGenerationWorkspaceRoute(url: string): boolean {
  return /\/v1\/motion-studio\/productions\/[^/]+\/generation-workspace$/u.test(new URL(url).pathname)
}

function isLiveGenerationWorkspaceRoute(url: string): boolean {
  return /\/v1\/motion-studio\/productions\/[^/]+\/live-generation-workspace$/u.test(new URL(url).pathname)
}

function isLayeredWorkspaceRoute(url: string): boolean {
  return /\/v1\/motion-studio\/productions\/[^/]+\/layered-workspace$/u.test(new URL(url).pathname)
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
