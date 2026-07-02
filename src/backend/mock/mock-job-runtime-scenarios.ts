import type { GeneratedAssetRecord, GenerationRequestRecord, RenderTimingManifestRecord } from '../../types'
import type { JobBlockReason, JobWorkerKind } from '../../types/job-runtime'
import {
  getMockCreditRuntimeScenarioById,
  prepareMockCreditRuntimeScenario,
  type PreparedMockCreditRuntimeScenario,
} from './mock-credit-runtime-scenarios'
import { createMockId, insertMockRecord, nowIso, type MockDatabase } from './mock-database'

export type MockJobRuntimeScenarioId =
  | 'queue-mock-music-job-success'
  | 'queue-mock-sfx-job-success'
  | 'queue-mock-render-readiness-job-success'
  | 'blocked-edit-plan-not-approved'
  | 'blocked-credit-reservation-missing'
  | 'blocked-generation-request-missing'
  | 'blocked-provider-disabled'
  | 'blocked-timing-manifest-not-ready'
  | 'blocked-required-generated-asset-missing'
  | 'music-dependency-chain-ready'
  | 'sfx-dependency-chain-ready'
  | 'render-dependency-chain-blocked'
  | 'worker-dispatch-succeeds-mock'
  | 'worker-dispatch-not-implemented'
  | 'job-fails-retry-scheduled'
  | 'retry-limit-reached'
  | 'failed-job-releases-credit-reservation'
  | 'completed-job-spends-reserved-credits'
  | 'chat-summary-blocked-job'
  | 'chat-summary-completed-job'

export interface MockJobRuntimeScenario {
  id: MockJobRuntimeScenarioId
  label: string
  workerKind: JobWorkerKind
  creditScenarioId?: Parameters<typeof getMockCreditRuntimeScenarioById>[0]
  requiresGenerationRequest: boolean
  createGenerationRequest: boolean
  requiresProvider: boolean
  providerRuntimeMode: 'mock' | 'backend_required' | 'disabled'
  requiresTimingReadiness: boolean
  createReadyTimingManifest: boolean
  requiresRequiredAssets: boolean
  createRequiredAsset: boolean
  dispatch: boolean
  retryAttemptCount?: number
  expectedBlockReason?: JobBlockReason
}

export interface PreparedMockJobRuntimeScenario {
  scenario: MockJobRuntimeScenario
  credit: PreparedMockCreditRuntimeScenario
  db: MockDatabase
  generationRequest?: GenerationRequestRecord
  renderTimingManifest?: RenderTimingManifestRecord
  requiredAssetId?: string
}

export const mockJobRuntimeScenarios: MockJobRuntimeScenario[] = [
  scenario('queue-mock-music-job-success', 'Queue mock music job successfully.', 'music_generation', { createGenerationRequest: true, dispatch: true }),
  scenario('queue-mock-sfx-job-success', 'Queue mock SFX job successfully.', 'sfx_generation', { createGenerationRequest: true }),
  scenario('queue-mock-render-readiness-job-success', 'Queue mock render readiness job successfully.', 'render_preview', { requiresGenerationRequest: false, requiresProvider: false, requiresTimingReadiness: true, createReadyTimingManifest: true, requiresRequiredAssets: true, createRequiredAsset: true }),
  scenario('blocked-edit-plan-not-approved', 'Job blocked because edit plan is not approved.', 'video_generation', { creditScenarioId: 'missing-edit-plan-approval-blocked', expectedBlockReason: 'edit_plan_not_approved' }),
  scenario('blocked-credit-reservation-missing', 'Job blocked because credit reservation is missing.', 'video_generation', { creditScenarioId: 'reservation-missing-blocked', createGenerationRequest: true, expectedBlockReason: 'credit_reservation_missing' }),
  scenario('blocked-generation-request-missing', 'Job blocked because generation request is missing.', 'video_generation', { createGenerationRequest: false, expectedBlockReason: 'generation_request_missing' }),
  scenario('blocked-provider-disabled', 'Job blocked because provider route is disabled.', 'video_generation', { createGenerationRequest: true, providerRuntimeMode: 'disabled', expectedBlockReason: 'provider_disabled' }),
  scenario('blocked-timing-manifest-not-ready', 'Job blocked because render timing manifest is not ready.', 'render_preview', { requiresGenerationRequest: false, requiresProvider: false, requiresTimingReadiness: true, createReadyTimingManifest: false, expectedBlockReason: 'timing_not_ready' }),
  scenario('blocked-required-generated-asset-missing', 'Job blocked because a required generated asset is missing.', 'render_preview', { requiresGenerationRequest: false, requiresProvider: false, requiresRequiredAssets: true, createRequiredAsset: false, expectedBlockReason: 'required_asset_missing' }),
  scenario('music-dependency-chain-ready', 'Music dependency chain ready.', 'music_generation', { createGenerationRequest: true }),
  scenario('sfx-dependency-chain-ready', 'SFX dependency chain ready.', 'sfx_generation', { createGenerationRequest: true }),
  scenario('render-dependency-chain-blocked', 'Render dependency chain blocked.', 'render_preview', { requiresGenerationRequest: false, requiresProvider: false, requiresTimingReadiness: true, createReadyTimingManifest: false, expectedBlockReason: 'timing_not_ready' }),
  scenario('worker-dispatch-succeeds-mock', 'Worker dispatch succeeds in mock mode.', 'music_generation', { createGenerationRequest: true, dispatch: true }),
  scenario('worker-dispatch-not-implemented', 'Worker dispatch is not implemented for custom worker.', 'custom', { requiresGenerationRequest: false, requiresProvider: false, dispatch: true }),
  scenario('job-fails-retry-scheduled', 'Job fails and retry is scheduled.', 'sfx_generation', { createGenerationRequest: true, retryAttemptCount: 1 }),
  scenario('retry-limit-reached', 'Retry limit reached.', 'sfx_generation', { createGenerationRequest: true, retryAttemptCount: 3 }),
  scenario('failed-job-releases-credit-reservation', 'Failed job releases credit reservation.', 'video_generation', { createGenerationRequest: true }),
  scenario('completed-job-spends-reserved-credits', 'Completed job spends reserved credits mock.', 'video_generation', { createGenerationRequest: true }),
  scenario('chat-summary-blocked-job', 'Chat summary for blocked job.', 'video_generation', { creditScenarioId: 'reservation-missing-blocked', expectedBlockReason: 'credit_reservation_missing' }),
  scenario('chat-summary-completed-job', 'Chat summary for completed job.', 'render_preview', { requiresGenerationRequest: false, requiresProvider: false, requiresTimingReadiness: true, createReadyTimingManifest: true, requiresRequiredAssets: true, createRequiredAsset: true }),
]

export function getMockJobRuntimeScenarioById(
  id: MockJobRuntimeScenarioId,
): MockJobRuntimeScenario | undefined {
  return mockJobRuntimeScenarios.find((candidate) => candidate.id === id)
}

export function getDefaultMockJobRuntimeScenario(): MockJobRuntimeScenario {
  return mockJobRuntimeScenarios[0]
}

export function prepareMockJobRuntimeScenario(
  scenarioInput: MockJobRuntimeScenario = getDefaultMockJobRuntimeScenario(),
): PreparedMockJobRuntimeScenario {
  const creditScenario = scenarioInput.creditScenarioId
    ? getMockCreditRuntimeScenarioById(scenarioInput.creditScenarioId)
    : getMockCreditRuntimeScenarioById('approved-plan-approved-estimate-reservation-allowed')

  if (!creditScenario) {
    throw new Error(`Missing credit scenario for ${scenarioInput.id}.`)
  }

  const credit = prepareMockCreditRuntimeScenario(creditScenario)
  const db = credit.db
  const generationRequest = scenarioInput.createGenerationRequest
    ? createMockGenerationRequest(db, credit)
    : undefined
  const requiredAssetId = scenarioInput.requiresRequiredAssets && scenarioInput.createRequiredAsset
    ? createMockGeneratedAsset(db, credit, generationRequest?.id).id
    : scenarioInput.requiresRequiredAssets
      ? 'mock-missing-required-asset'
      : undefined
  const renderTimingManifest = scenarioInput.requiresTimingReadiness
    ? createMockRenderTimingManifest(db, credit, scenarioInput.createReadyTimingManifest)
    : undefined

  return {
    scenario: scenarioInput,
    credit,
    db,
    generationRequest,
    renderTimingManifest,
    requiredAssetId,
  }
}

function scenario(
  id: MockJobRuntimeScenarioId,
  label: string,
  workerKind: JobWorkerKind,
  overrides: Partial<MockJobRuntimeScenario> = {},
): MockJobRuntimeScenario {
  return {
    id,
    label,
    workerKind,
    requiresGenerationRequest: true,
    createGenerationRequest: false,
    requiresProvider: workerKind !== 'render_preview' && workerKind !== 'qa' && workerKind !== 'custom',
    providerRuntimeMode: 'mock',
    requiresTimingReadiness: false,
    createReadyTimingManifest: false,
    requiresRequiredAssets: false,
    createRequiredAsset: false,
    dispatch: false,
    ...overrides,
  }
}

function createMockGenerationRequest(
  db: MockDatabase,
  credit: PreparedMockCreditRuntimeScenario,
): GenerationRequestRecord {
  return insertMockRecord(db, 'generationRequests', {
    id: createMockId('job-runtime-generation-request'),
    workspaceId: credit.gateInput.workspaceId,
    projectId: credit.gateInput.projectId,
    editPlanId: credit.editPlan?.id ?? 'mock-edit-plan',
    creditEstimateId: credit.creditEstimate?.id,
    creditReservationId: credit.reservation?.id,
    providerType: 'external_ai_provider',
    signatureSystem: 'none',
    generationType: 'other',
    outputAssetType: 'generated_overlay',
    inputAssetIds: [],
    transparentBackgroundRequired: false,
    resolution: '720p',
    prompt: 'Mock job runtime generation request.',
    styleConstraints: [],
    timingConstraints: [],
    status: 'approved',
    creditEstimate: credit.gateInput.estimatedCredits,
    estimatedCredits: credit.gateInput.estimatedCredits,
    workerNotes: ['Mock request only; no provider call.'],
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: { mockOnly: true },
  } as GenerationRequestRecord)
}

function createMockGeneratedAsset(
  db: MockDatabase,
  credit: PreparedMockCreditRuntimeScenario,
  generationRequestId?: string,
): GeneratedAssetRecord {
  return insertMockRecord(db, 'generatedAssets', {
    id: createMockId('job-runtime-generated-asset'),
    workspaceId: credit.gateInput.workspaceId,
    projectId: credit.gateInput.projectId,
    generationRequestId,
    assetType: 'video',
    assetStatus: 'ready',
    assetFormat: 'mp4',
    signatureSystem: 'none',
    status: 'ready',
    fileName: 'mock-required-asset.mp4',
    displayName: 'Mock required generated asset',
    storageProvider: 'mock',
    storagePath: 'mock://job-runtime/required-asset.mp4',
    transparentBackground: false,
    usableForRender: true,
    qualityNotes: ['Mock asset for dependency readiness only.'],
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: { mockOnly: true },
  })
}

function createMockRenderTimingManifest(
  db: MockDatabase,
  credit: PreparedMockCreditRuntimeScenario,
  ready: boolean,
): RenderTimingManifestRecord {
  return insertMockRecord(db, 'renderTimingManifests', {
    id: createMockId('job-runtime-render-manifest'),
    masterTimingMapId: 'mock-master-timing-map',
    projectId: credit.gateInput.projectId,
    editPlanId: credit.editPlan?.id ?? 'mock-edit-plan',
    status: ready ? 'ready_for_worker' : 'draft',
    durationSeconds: 30,
    frameRate: 30,
    tracks: [],
    events: [],
    dependencies: [],
    conflictsResolved: ready ? ['mock-conflict-resolved'] : [],
    readyForRender: ready,
    workerNotes: ready
      ? ['Mock render manifest ready for worker.']
      : ['Mock render manifest still has blocking timing work.'],
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: { mockOnly: true },
  })
}
