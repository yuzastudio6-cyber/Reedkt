import type {
  GeneratedAssetRecord,
  GeneratedAssetTimingMapRecord,
  GenerationProviderRecord,
  GenerationProviderType,
  GenerationRequestInputRecord,
  GenerationRequestRecord,
} from '../../types'
import type { CreateGenerationRequestRequest } from '../contracts/generation-contracts'
import type { MockDatabase } from '../mock/mock-database'
import { createMockId, findMockRecord, insertMockRecord, nowIso } from '../mock/mock-database'
import { fail, ok, type ServiceResult } from '../service-result'

export function createGenerationProviderPlaceholder(
  db: MockDatabase,
  providerType: GenerationProviderType = 'svg_renderer',
): ServiceResult<GenerationProviderRecord> {
  const provider: GenerationProviderRecord = {
    id: createMockId('generation-provider'),
    providerKey: `${providerType}_placeholder`,
    name: `${providerType} placeholder`,
    providerType,
    runtimeType: 'local_mock',
    displayName: `${providerType} placeholder`,
    active: true,
    supportsVideo: providerType === 'remotion' || providerType === 'google_cloud_worker',
    supportsImage: true,
    supportsAudio: false,
    supportsTransparentBackground: true,
    supportsSvg: providerType === 'svg_renderer',
    supportsLottie: providerType === 'lottie_renderer',
    supportsRemotion: providerType === 'remotion',
    supportsWordLevelTiming: true,
    supportsStyleReference: false,
    gpuRequired: false,
    supportedSignatureSystems: ['stroke_motion', 'graphic_design', 'none'],
    supportedGenerationTypes: ['stroke_motion_animation', 'json_spec'],
    defaultCreditMultiplier: 1,
    costMultiplier: 1,
    providerPayload: {
      noRealProviderCall: true,
      secretReferenceOnly: true,
    },
    notes: ['Provider placeholder stores no keys, URLs, or credentials.'],
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: { mockOnly: true },
  }

  return ok(insertMockRecord(db, 'generationProviders', provider))
}

export function createGenerationRequest(
  db: MockDatabase,
  input: CreateGenerationRequestRequest,
): ServiceResult<GenerationRequestRecord> {
  const editPlan = findMockRecord(db, 'editPlans', input.editPlanId)
  const reservation = input.creditReservationId
    ? findMockRecord(db, 'creditReservations', input.creditReservationId)
    : undefined

  if (!editPlan || editPlan.status !== 'approved') {
    return fail('PLAN_NOT_APPROVED', 'Generation request requires an approved edit plan.')
  }

  if (!reservation || reservation.status !== 'reserved') {
    return fail('CREDITS_NOT_RESERVED', 'Generation request requires reserved credits.')
  }

  if (!db.generationProviders[0]) {
    createGenerationProviderPlaceholder(db, 'svg_renderer')
  }

  const provider = db.generationProviders[0]

  const generationRequest: GenerationRequestRecord = {
    id: createMockId('generation-request'),
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editPlanId: input.editPlanId,
    creditEstimateId: input.creditEstimateId,
    creditReservationId: input.creditReservationId,
    strokeMotionPlanId: input.strokeMotionPlanId,
    providerId: provider?.id,
    requestType: 'stroke_motion_animation',
    providerType: provider?.providerType ?? 'svg_renderer',
    modelName: 'local_mock_svg_renderer',
    signatureSystem: input.strokeMotionPlanId ? 'stroke_motion' : 'none',
    generationType: 'stroke_motion_animation',
    inputAssetIds: [],
    outputAssetType: 'generated_overlay',
    transparentBackgroundRequired: true,
    wordLevelTimingRequired: true,
    durationSeconds: 8,
    width: 1080,
    height: 1920,
    frameRate: 30,
    resolution: '1080x1920',
    prompt: 'Mock generation request. No provider call is made.',
    styleConstraints: {
      deterministicRendererPreferred: true,
      transparentOverlay: true,
    },
    timingConstraints: {
      wordLevelTimingRequired: true,
    },
    outputRequirements: {
      usableForRender: true,
    },
    status: 'approved',
    qualityLevel: 'preview',
    creditEstimate: 12,
    estimatedCredits: 12,
    failureCategory: 'none',
    idempotencyKey: `mock-generation-${input.editPlanId}`,
    workerNotes: ['Provider abstraction is mock-only and not hard-coded to one real model.'],
    providerRequestSummary: { provider: provider?.providerKey ?? 'svg_renderer_placeholder' },
    requestPayload: { mockOnly: true },
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: { noRealProviderCall: true },
  }

  return ok(insertMockRecord(db, 'generationRequests', generationRequest))
}

export function createGenerationRequestInputs(
  db: MockDatabase,
  generationRequestId: string,
): ServiceResult<GenerationRequestInputRecord[]> {
  const request = findMockRecord(db, 'generationRequests', generationRequestId)

  if (!request) {
    return fail('GENERATION_REQUEST_NOT_FOUND', `Generation request ${generationRequestId} was not found.`)
  }

  const inputs: GenerationRequestInputRecord[] = [
    {
      id: createMockId('generation-input'),
      generationRequestId,
      workspaceId: request.workspaceId,
      projectId: request.projectId,
      inputRole: request.strokeMotionPlanId ? 'stroke_motion_plan' : 'prompt_context',
      strokeMotionPlanId: request.strokeMotionPlanId,
      inputText: request.prompt,
      inputPayload: { mockOnly: true },
      createdAt: nowIso(),
      updatedAt: nowIso(),
      metadata: { mockOnly: true },
    },
  ]

  inputs.forEach((input) => insertMockRecord(db, 'generationRequestInputs', input))
  return ok(inputs)
}

export function markGenerationQueued(
  db: MockDatabase,
  generationRequestId: string,
): ServiceResult<GenerationRequestRecord> {
  return updateGenerationRequestStatus(db, generationRequestId, 'queued')
}

export function markGenerationCompleted(
  db: MockDatabase,
  generationRequestId: string,
): ServiceResult<GenerationRequestRecord> {
  return updateGenerationRequestStatus(db, generationRequestId, 'completed')
}

export function createGeneratedAsset(
  db: MockDatabase,
  generationRequestId: string,
): ServiceResult<GeneratedAssetRecord> {
  const request = findMockRecord(db, 'generationRequests', generationRequestId)

  if (!request || request.status !== 'completed') {
    return fail('GENERATION_REQUEST_NOT_FOUND', 'Completed generation request is required before creating a generated asset.')
  }

  const asset: GeneratedAssetRecord = {
    id: createMockId('generated-asset'),
    workspaceId: request.workspaceId,
    projectId: request.projectId,
    generationRequestId,
    assetType: 'stroke_motion_overlay',
    assetStatus: 'ready',
    assetFormat: 'svg',
    qualityLevel: 'preview',
    signatureSystem: request.signatureSystem,
    status: 'ready',
    fileName: 'mock-stroke-motion-overlay.svg',
    displayName: 'Mock Stroke Motion overlay',
    storageProvider: 'local_mock',
    storagePath: 'mock://generated/stroke-motion-overlay.svg',
    publicUrl: 'mock://generated/stroke-motion-overlay.svg',
    durationSeconds: request.durationSeconds,
    width: request.width,
    height: request.height,
    frameRate: request.frameRate,
    transparentBackground: true,
    wordLevelTiming: true,
    usableForRender: true,
    qualityNotes: ['Generated asset is intermediate, not a final render.'],
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: { mockOnly: true },
  }

  return ok(insertMockRecord(db, 'generatedAssets', asset))
}

export function createGeneratedAssetTimingMap(
  db: MockDatabase,
  generatedAssetId: string,
): ServiceResult<GeneratedAssetTimingMapRecord> {
  const asset = findMockRecord(db, 'generatedAssets', generatedAssetId)

  if (!asset) {
    return fail('GENERATED_ASSET_NOT_FOUND', `Generated asset ${generatedAssetId} was not found.`)
  }

  const timingMap: GeneratedAssetTimingMapRecord = {
    id: createMockId('generated-asset-timing-map'),
    generatedAssetId,
    workspaceId: asset.workspaceId ?? 'mock-workspace-reeditpro',
    projectId: asset.projectId,
    editPlanId: db.generationRequests.find((request) => request.id === asset.generationRequestId)?.editPlanId,
    strokeMotionPlanId: db.generationRequests.find((request) => request.id === asset.generationRequestId)?.strokeMotionPlanId,
    startTimeSeconds: 0,
    endTimeSeconds: asset.durationSeconds ?? 8,
    timelineOffsetSeconds: 0,
    timingPayload: {
      wordLevelTiming: asset.wordLevelTiming ?? false,
      transparentOverlay: asset.transparentBackground,
    },
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: { mockOnly: true },
  }

  return ok(insertMockRecord(db, 'generatedAssetTimingMaps', timingMap))
}

function updateGenerationRequestStatus(
  db: MockDatabase,
  generationRequestId: string,
  status: GenerationRequestRecord['status'],
): ServiceResult<GenerationRequestRecord> {
  const request = findMockRecord(db, 'generationRequests', generationRequestId)

  if (!request) {
    return fail('GENERATION_REQUEST_NOT_FOUND', `Generation request ${generationRequestId} was not found.`)
  }

  request.status = status
  request.updatedAt = nowIso()

  if (status === 'queued') {
    request.queuedAt = nowIso()
  }

  if (status === 'completed') {
    request.completedAt = nowIso()
  }

  return ok(request)
}
