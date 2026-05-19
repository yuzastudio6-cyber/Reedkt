import type {
  GeneratedAssetRecord,
  GeneratedAssetTimingMapRecord,
  GenerationProviderRecord,
  GenerationProviderType,
  GenerationRequestInputRecord,
  GenerationRequestRecord,
  LyriaPromptPlanRecord,
  MusicCueSheetItemRecord,
  SFXPromptPlanRecord,
} from '../../types'
import type { CreateGenerationRequestRequest } from '../contracts/generation-contracts'
import type { MockDatabase } from '../mock/mock-database'
import { createMockId, findMockRecord, insertMockRecord, nowIso } from '../mock/mock-database'
import { fail, ok, type ServiceResult } from '../service-result'

export interface CreateMockLyriaGenerationRequestInput {
  workspaceId: string
  projectId: string
  editPlanId: string
  creditReservationId: string
  musicCueId: string
  lyriaPromptPlanId: string
  prompt: string
  creditEstimateId?: string
  negativePrompt?: string
  durationSeconds?: number
  estimatedCredits?: number
  planApproved?: boolean
}

export interface CreateLyriaGenerationRequestFromPromptPlanInput {
  workspaceId: string
  projectId: string
  editPlanId: string
  creditReservationId: string
  promptPlan: LyriaPromptPlanRecord
  musicCue?: MusicCueSheetItemRecord
  creditEstimateId?: string
  estimatedCredits?: number
  planApproved?: boolean
}

export interface CreateMockSFXGenerationRequestInput {
  workspaceId: string
  projectId: string
  editPlanId: string
  creditReservationId: string
  sfxEventPlanId: string
  sfxPromptPlanId: string
  providerRouteId: string
  provider: string
  modelName: string
  prompt: string
  creditEstimateId?: string
  negativePrompt?: string
  durationSeconds?: number
  estimatedCredits?: number
  planApproved?: boolean
}

export interface CreateSFXGenerationRequestFromPromptPlanInput {
  workspaceId: string
  projectId: string
  editPlanId: string
  creditReservationId: string
  promptPlan: SFXPromptPlanRecord
  creditEstimateId?: string
  estimatedCredits?: number
  planApproved?: boolean
}

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

export function createMockLyriaGenerationRequest(
  db: MockDatabase,
  input: CreateMockLyriaGenerationRequestInput,
): ServiceResult<GenerationRequestRecord> {
  const editPlan = findMockRecord(db, 'editPlans', input.editPlanId)
  const reservation = findMockRecord(db, 'creditReservations', input.creditReservationId)

  if (editPlan && editPlan.status !== 'approved') {
    return fail('PLAN_NOT_APPROVED', 'Lyria generation request requires an approved edit plan.')
  }

  if (!editPlan && input.planApproved !== true) {
    return fail('PLAN_NOT_APPROVED', 'Lyria generation request requires explicit mock plan approval.')
  }

  if (!reservation || reservation.status !== 'reserved') {
    return fail('CREDITS_NOT_RESERVED', 'Lyria generation request requires reserved music credits.')
  }

  const request: GenerationRequestRecord = {
    id: createMockId('lyria-generation-request'),
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editPlanId: input.editPlanId,
    creditEstimateId: input.creditEstimateId,
    creditReservationId: input.creditReservationId,
    requestType: 'music_asset',
    providerType: 'google_cloud_worker',
    modelName: 'lyria-3-pro-preview',
    signatureSystem: 'none',
    generationType: 'music_asset',
    inputAssetIds: [],
    outputAssetType: 'generated_audio',
    transparentBackgroundRequired: false,
    wordLevelTimingRequired: false,
    durationSeconds: input.durationSeconds ?? 60,
    resolution: 'audio-only',
    prompt: input.prompt,
    negativePrompt: input.negativePrompt ?? 'Do not copy existing songs, melodies, lyrics, artists, or reference timing.',
    styleConstraints: {
      styleDnaOnly: true,
      noArtistNames: true,
      noCopiedLyrics: true,
      noRealProviderCall: true,
    },
    timingConstraints: {
      exactCueTimingCopied: false,
      cueRoleOnly: true,
    },
    outputRequirements: {
      assetType: 'music',
      assetFormat: 'wav',
      projectAsset: true,
      qaRequiredBeforePreview: true,
    },
    status: 'approved',
    qualityLevel: 'preview',
    creditEstimate: input.estimatedCredits ?? 18,
    estimatedCredits: input.estimatedCredits ?? 18,
    failureCategory: 'none',
    idempotencyKey: `mock-lyria-generation-${input.lyriaPromptPlanId}`,
    workerNotes: [
      'Mock-only Lyria Pro generation request.',
      'Future worker must enforce plan approval and credit reservation before generation.',
    ],
    providerRequestSummary: {
      provider: 'Lyria Pro',
      model: 'lyria-3-pro-preview',
      runtime: 'future Google Cloud worker',
    },
    requestPayload: {
      mockOnly: true,
      musicCueId: input.musicCueId,
      lyriaPromptPlanId: input.lyriaPromptPlanId,
    },
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: { mockOnly: true },
  }

  return ok(insertMockRecord(db, 'generationRequests', request))
}

export function createLyriaGenerationRequestFromPromptPlan(
  db: MockDatabase,
  input: CreateLyriaGenerationRequestFromPromptPlanInput,
): ServiceResult<GenerationRequestRecord> {
  const durationSeconds = input.musicCue?.timeRange
    ? Math.max(8, input.musicCue.timeRange.endSeconds - input.musicCue.timeRange.startSeconds)
    : undefined

  return createMockLyriaGenerationRequest(db, {
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editPlanId: input.editPlanId,
    creditReservationId: input.creditReservationId,
    musicCueId: input.musicCue?.id ?? input.promptPlan.cueSheetItemId,
    lyriaPromptPlanId: input.promptPlan.id,
    prompt: input.promptPlan.prompt,
    negativePrompt: input.promptPlan.negativePrompt,
    durationSeconds,
    creditEstimateId: input.creditEstimateId,
    estimatedCredits: input.estimatedCredits,
    planApproved: input.planApproved,
  })
}

export function createMockSFXGenerationRequest(
  db: MockDatabase,
  input: CreateMockSFXGenerationRequestInput,
): ServiceResult<GenerationRequestRecord> {
  const editPlan = findMockRecord(db, 'editPlans', input.editPlanId)
  const reservation = findMockRecord(db, 'creditReservations', input.creditReservationId)

  if (editPlan && editPlan.status !== 'approved') {
    return fail('PLAN_NOT_APPROVED', 'SFX generation request requires an approved edit plan.')
  }

  if (!editPlan && input.planApproved !== true) {
    return fail('PLAN_NOT_APPROVED', 'SFX generation request requires explicit mock plan approval.')
  }

  if (!reservation || reservation.status !== 'reserved') {
    return fail('CREDITS_NOT_RESERVED', 'SFX generation request requires reserved SFX credits.')
  }

  const request: GenerationRequestRecord = {
    id: createMockId('sfx-generation-request'),
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editPlanId: input.editPlanId,
    creditEstimateId: input.creditEstimateId,
    creditReservationId: input.creditReservationId,
    requestType: 'sfx_asset',
    providerType: 'google_cloud_worker',
    modelName: input.modelName,
    signatureSystem: 'none',
    generationType: 'sfx_asset',
    inputAssetIds: [],
    outputAssetType: 'generated_audio',
    transparentBackgroundRequired: false,
    wordLevelTimingRequired: false,
    durationSeconds: input.durationSeconds ?? 2.5,
    resolution: 'audio-only',
    prompt: input.prompt,
    negativePrompt: input.negativePrompt,
    styleConstraints: {
      provider: input.provider,
      noRealProviderCall: true,
      mockOnly: true,
    },
    timingConstraints: {
      trimAndHitAlignmentRequired: true,
      sfxEventPlanId: input.sfxEventPlanId,
    },
    outputRequirements: {
      assetType: 'sound_effect',
      assetFormat: 'wav',
      projectAsset: true,
      qaRequiredBeforePreview: true,
    },
    status: 'approved',
    qualityLevel: 'preview',
    creditEstimate: input.estimatedCredits ?? 6,
    estimatedCredits: input.estimatedCredits ?? 6,
    failureCategory: 'none',
    idempotencyKey: `mock-sfx-generation-${input.sfxPromptPlanId}`,
    workerNotes: [
      'Mock-only SFX generation request.',
      'Future worker must enforce edit plan approval and credit reservation before generation.',
    ],
    providerRequestSummary: {
      provider: input.provider,
      model: input.modelName,
      runtime: 'future Google Cloud SFX worker',
    },
    requestPayload: {
      mockOnly: true,
      sfxEventPlanId: input.sfxEventPlanId,
      sfxPromptPlanId: input.sfxPromptPlanId,
      providerRouteId: input.providerRouteId,
    },
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: { mockOnly: true },
  }

  return ok(insertMockRecord(db, 'generationRequests', request))
}

export function createSFXGenerationRequestFromPromptPlan(
  db: MockDatabase,
  input: CreateSFXGenerationRequestFromPromptPlanInput,
): ServiceResult<GenerationRequestRecord> {
  return createMockSFXGenerationRequest(db, {
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editPlanId: input.editPlanId,
    creditReservationId: input.creditReservationId,
    sfxEventPlanId: input.promptPlan.sfxEventPlanId,
    sfxPromptPlanId: input.promptPlan.id,
    providerRouteId: input.promptPlan.providerRouteId,
    provider: input.promptPlan.provider,
    modelName: input.promptPlan.modelName,
    prompt: input.promptPlan.prompt,
    negativePrompt: input.promptPlan.negativePrompt,
    durationSeconds: Math.max(input.promptPlan.durationToGenerateSeconds, input.promptPlan.durationNeededSeconds),
    creditEstimateId: input.creditEstimateId,
    estimatedCredits: input.estimatedCredits,
    planApproved: input.planApproved,
  })
}

export function createSFXProviderGenerationRequestFromPromptPlan(
  db: MockDatabase,
  input: CreateSFXGenerationRequestFromPromptPlanInput,
): ServiceResult<GenerationRequestRecord> {
  const result = createSFXGenerationRequestFromPromptPlan(db, input)

  if (!result.ok) return result

  result.data.providerRequestSummary = {
    ...result.data.providerRequestSummary,
    providerAdapterLayer: 'sfx_provider_adapter_mock_first',
    realProviderCall: false,
  }
  result.data.requestPayload = {
    ...result.data.requestPayload,
    sfxProviderAdapterLayer: true,
    realProviderCall: false,
  }
  result.data.workerNotes = [
    ...result.data.workerNotes,
    'RP-SFX-12 provider adapter request remains mock-first and fail-closed.',
  ]
  result.data.updatedAt = nowIso()

  return result
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

export function markLyriaGenerationQueued(
  db: MockDatabase,
  generationRequestId: string,
): ServiceResult<GenerationRequestRecord> {
  return updateGenerationRequestStatus(db, generationRequestId, 'queued')
}

export function markLyriaGenerationCompleted(
  db: MockDatabase,
  generationRequestId: string,
): ServiceResult<GenerationRequestRecord> {
  return updateGenerationRequestStatus(db, generationRequestId, 'completed')
}

export function markLyriaGenerationBlocked(
  db: MockDatabase,
  generationRequestId: string,
  message = 'Lyria generation blocked by mock worker validation.',
): ServiceResult<GenerationRequestRecord> {
  const request = findMockRecord(db, 'generationRequests', generationRequestId)

  if (!request) {
    return fail('GENERATION_REQUEST_NOT_FOUND', `Generation request ${generationRequestId} was not found.`)
  }

  request.status = 'failed'
  request.failureCategory = 'credit_not_reserved'
  request.failureMessage = message
  request.failedAt = nowIso()
  request.updatedAt = nowIso()

  return ok(request)
}

export function markSFXGenerationQueued(
  db: MockDatabase,
  generationRequestId: string,
): ServiceResult<GenerationRequestRecord> {
  return updateGenerationRequestStatus(db, generationRequestId, 'queued')
}

export function markSFXGenerationCompleted(
  db: MockDatabase,
  generationRequestId: string,
): ServiceResult<GenerationRequestRecord> {
  return updateGenerationRequestStatus(db, generationRequestId, 'completed')
}

export function markSFXGenerationBlocked(
  db: MockDatabase,
  generationRequestId: string,
  message = 'SFX generation blocked by mock worker validation.',
): ServiceResult<GenerationRequestRecord> {
  const request = findMockRecord(db, 'generationRequests', generationRequestId)

  if (!request) {
    return fail('GENERATION_REQUEST_NOT_FOUND', `Generation request ${generationRequestId} was not found.`)
  }

  request.status = 'failed'
  request.failureCategory = 'credit_not_reserved'
  request.failureMessage = message
  request.failedAt = nowIso()
  request.updatedAt = nowIso()

  return ok(request)
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
