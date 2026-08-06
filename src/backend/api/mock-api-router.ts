import type {
  ApiRequestEnvelope,
  ApiResponseEnvelope,
  ApiRouteHandler,
  ApiRuntimeContext,
} from './api-runtime-contracts'
import { createApiBackendRequiredResponse, createApiErrorResponse, createApiMockResponse, createApiNotImplementedResponse } from './api-response'
import { createApiRouteMapSummary, getApiRouteById, getMockReadyRoutes } from './api-route-registry'
import { EDIT_LEVEL_MOCK_ROUTE_HANDLERS } from './edit-level-mock-route-handlers'
import type { ChatNativePlanningInput } from '../backend-types'
import { runAuthBootstrapFlow } from '../auth/auth-bootstrap-orchestrator'
import { getAuthClientStatus } from '../auth/auth-client-service'
import { createMockDatabase } from '../mock/mock-database'
import {
  runMockCreditGateAllowedFlow,
  runMockGenerationCreditGateFlow,
  runMockRenderCreditGateFlow,
} from '../orchestrators/mock-credit-runtime-orchestrator'
import {
  runMockBlockedJobRuntimeFlow,
  runMockJobDependencyFlow,
  runMockJobRetryFlow,
  runMockMusicJobRuntimeFlow,
  runMockRenderJobRuntimeFlow,
  runMockSFXJobRuntimeFlow,
  runMockWorkerDispatchFlow,
} from '../orchestrators/mock-job-runtime-orchestrator'
import {
  runMockBackendRuntimeTransportFlow,
} from '../orchestrators/mock-backend-runtime-orchestrator'
import {
  runMockWorkerLeaseBackendRuntimeTransportFlow,
  runMockStaleLeaseRecoveryFlow,
  runMockWorkerHeartbeatFlow,
  runMockWorkerLeaseClaimFlow,
  runMockWorkerLeaseCompleteFlow,
  runMockWorkerLeaseDispatchFlow,
  runMockWorkerLeaseFailureFlow,
  runMockWorkerLeaseRenewFlow,
  runMockLeaseReleaseFlow,
} from '../orchestrators/mock-worker-lease-orchestrator'
import {
  runMockReferenceMediaUploadFlow,
  runMockSourceSequenceUploadFlow,
  runMockUploadReadinessFlow,
} from '../orchestrators/mock-upload-orchestrator'
import { runChatNativeEditPlanningFlow } from '../orchestrators/chat-native-editor-orchestrator'
import { runMockCaptionCutTimingFlow } from '../orchestrators/mock-caption-cut-timing-orchestrator'
import { runMockMusicSFXTimingFlow } from '../orchestrators/mock-music-sfx-timing-orchestrator'
import { runMockLakeComoMusicQAFlow, runMockMusicMixPlanningFlow } from '../orchestrators/mock-music-qa-orchestrator'
import { runMockReferenceToMusicCueFlow } from '../orchestrators/mock-reference-dna-orchestrator'
import { runMockLakeComoSFXLibraryFlow } from '../orchestrators/mock-sfx-library-orchestrator'
import { runMockLakeComoSFXMixFlow } from '../orchestrators/mock-sfx-mix-orchestrator'
import { runMockLakeComoSFXPlanningFlow } from '../orchestrators/mock-sfx-planning-orchestrator'
import { runMockLakeComoSFXPromptFlow } from '../orchestrators/mock-sfx-prompt-orchestrator'
import { runMockLakeComoSFXQAFlow } from '../orchestrators/mock-sfx-qa-orchestrator'
import { runMockLakeComoSFXTimingFlow } from '../orchestrators/mock-sfx-timing-orchestrator'
import { runEditProjectSFXFlow } from '../orchestrators/edit-project-sfx-orchestrator'
import { getDefaultMockEditProjectSFXScenario, getMockEditProjectSFXScenarioById } from '../mock/mock-edit-project-sfx-scenarios'
import { runMockSFXProviderReadinessFlow } from '../orchestrators/mock-sfx-provider-readiness-orchestrator'
import { runMockStoryTimingPlannerFlow } from '../orchestrators/mock-storytiming-orchestrator'
import { createMediaAssetRecordFromUploadPlan, createReferenceAssetRecordFromUploadPlan } from '../storage/media-asset-service'
import { createSourceUploadFlow } from '../storage/source-upload-flow-service'
import { buildStoragePathForUploadPurpose, type StoragePathBuildInput } from '../storage/storage-path-builder'
import { getStorageClientStatus } from '../storage/storage-client-service'
import { createUploadPlan } from '../storage/upload-plan-service'
import { validateUploadFile } from '../storage/upload-validation-service'
import type { CreateUploadPlanInput, SourceUploadFlowItem, UploadPlan, UploadPurpose } from '../../types/upload'
import { createWorkerRuntimeRegistrySummary, WORKER_RUNTIME_REGISTRY } from '../runtime/worker-runtime-registry'
import { hideInternalToolNamesInCopy } from '../../lib/tool-display-labels'
import {
  isBoundedAdapterModelWeightApprovalSource,
  isBoundedAdapterPackageReadinessEvidenceSource,
} from '../../types/bounded-adapter-source-truth'

const registeredHandlers = new Map<string, ApiRouteHandler>()
const mockApprovedEditExecutionPackagesById = new Map<string, Record<string, unknown>>()
const mockBoundedAdapterExecutionRunsById = new Map<string, Record<string, unknown>>()
const mockRegisteredAdapterRunnerRunsById = new Map<string, Record<string, unknown>>()
const mockRegisteredAdapterPrivateRunnerRunsById = new Map<string, Record<string, unknown>>()
const mockRegisteredAdapterPrivateRunnerQaReviewsById = new Map<string, Record<string, unknown>>()
const mockAdapterWorkerArtifactIntegrationsById = new Map<string, Record<string, unknown>>()
const mockRenderPreviewAssembliesById = new Map<string, Record<string, unknown>>()
const mockUserPreviewReviewsById = new Map<string, Record<string, unknown>>()
const mockFinalRenderReadinessReviewsById = new Map<string, Record<string, unknown>>()
const mockFinalRenderExecutionsById = new Map<string, Record<string, unknown>>()
const mockFinalDeliveryQaReviewsById = new Map<string, Record<string, unknown>>()
const mockToolCostEventsByIdempotencyKey = new Map<string, MockToolCostEventRecord>()

type MockToolCostEventRecord = Record<string, unknown> & {
  id: string
  workspaceId: string
  projectId: string
  toolId: string
  usageCategory: string
  toolCostCredits: number
  billableToUser: boolean
  serviceFeeIncluded: false
}

function createMockApprovedExecutionReleaseReadiness(input: {
  privateInternalReady?: boolean
  publicDeliveryApproved?: boolean
  externalBetaReleaseApproved?: boolean
  productionReleaseApproved?: boolean
  launchEvidenceApproved?: boolean
} = {}) {
  const privateInternalReady = input.privateInternalReady === true
  const launchEvidenceApproved = input.launchEvidenceApproved === true
  const publicDeliveryReady = privateInternalReady &&
    launchEvidenceApproved &&
    input.publicDeliveryApproved === true
  const externalBetaReady = publicDeliveryReady &&
    input.externalBetaReleaseApproved === true
  const productionReady = externalBetaReady &&
    input.productionReleaseApproved === true

  return {
    publicDeliveryReady,
    externalBetaReady,
    productionReady,
    productionReadyAllowed: productionReady,
  }
}

type MockPrivateInternalAdapterActivityGroupStatus = 'ready' | 'partial' | 'pending' | 'blocked'

type MockPrivateInternalAdapterActivityGroup = {
  id: string
  label: string
  resolvedActivityCount: number
  integratedActivityCount: number
  pendingActivityCount: number
  status: MockPrivateInternalAdapterActivityGroupStatus
  userFacingSummary: string
}

const mockPrivateInternalAdapterActivityGroupLabels: Record<string, string> = {
  audio_preparation: 'Audio preparation',
  visual_layers: 'Visual layers',
  motion_graphics: 'Motion graphics',
  image_cleanup: 'Image cleanup',
  model_foundation: 'Readiness foundation',
  private_review_packaging: 'Private review package',
  readiness_checks: 'Readiness checks',
}

const mockPrivateInternalAdapterActivityGroups: Array<{ id: string; aliases: string[] }> = [
  {
    id: 'audio_preparation',
    aliases: [
      'librosa',
      'audioread',
      'pydub',
      'scipy',
      'resampy',
      'pyloudnorm',
      'audioflux',
      'music21',
      'pretty_midi',
      'mido',
      'noisereduce',
      'pedalboard',
      'mir_eval',
      'pydub_effects',
      'ebu_r128_pyloudnorm',
    ],
  },
  {
    id: 'visual_layers',
    aliases: ['d3', 'd3_js', 'echarts', 'vega_lite', 'vega', 'satori', 'svg_js', 'svgjs', 'viz_js'],
  },
  {
    id: 'motion_graphics',
    aliases: ['lottie_web', 'lottie', 'animejs', 'anime_js', 'three', 'three_js', 'pixi_js', 'pixijs', 'konva', 'babylonjs', 'babylon_js'],
  },
  {
    id: 'image_cleanup',
    aliases: ['sam2', 'birefnet', 'rembg', 'transparent_background', 'real_esrgan', 'kornia'],
  },
  {
    id: 'model_foundation',
    aliases: ['torch_torchvision', 'torch', 'torchvision', 'transformers'],
  },
  {
    id: 'private_review_packaging',
    aliases: ['streamer_render_pipeline_support', 'mkvtoolnix_container_validation', 'gpac_mp4box_packaging_validation', 'gstreamer', 'mkvtoolnix', 'mp4box', 'gpac'],
  },
]

function normalizeMockAdapterActivityName(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
}

function resolveMockPrivateInternalAdapterActivityGroup(toolName: string): string {
  const normalized = normalizeMockAdapterActivityName(toolName)
  for (const group of mockPrivateInternalAdapterActivityGroups) {
    if (group.aliases.some((alias) => normalizeMockAdapterActivityName(alias) === normalized)) {
      return group.id
    }
  }
  return 'readiness_checks'
}

function summarizeMockPrivateInternalAdapterActivityGroup(input: {
  label: string
  integratedActivityCount: number
  pendingActivityCount: number
  status: MockPrivateInternalAdapterActivityGroupStatus
}) {
  if (input.status === 'ready') {
    return `${input.label} is attached to this private review.`
  }
  if (input.status === 'partial') {
    return `${input.label} has ${input.integratedActivityCount} approved check${input.integratedActivityCount === 1 ? '' : 's'} attached and ${input.pendingActivityCount} still waiting for approved evidence.`
  }
  if (input.status === 'blocked') {
    return `${input.label} is blocked until approved evidence is resolved.`
  }
  return `${input.label} is planned and still waiting for approved evidence.`
}

function buildMockPrivateInternalAdapterActivityGroups(input: {
  requestedToolNames: string[]
  integratedToolNames?: string[]
  integrationBlocked: boolean
}): MockPrivateInternalAdapterActivityGroup[] {
  const requestedCounts = new Map<string, number>()
  const integratedCounts = new Map<string, number>()

  for (const requestedToolName of input.requestedToolNames) {
    if (!requestedToolName.trim()) continue
    const groupId = resolveMockPrivateInternalAdapterActivityGroup(requestedToolName)
    requestedCounts.set(groupId, (requestedCounts.get(groupId) ?? 0) + 1)
  }

  for (const integratedToolName of input.integratedToolNames ?? []) {
    if (!integratedToolName.trim()) continue
    const groupId = resolveMockPrivateInternalAdapterActivityGroup(integratedToolName)
    integratedCounts.set(groupId, (integratedCounts.get(groupId) ?? 0) + 1)
  }

  return Array.from(requestedCounts.entries()).map(([id, resolvedActivityCount]) => {
    const label = mockPrivateInternalAdapterActivityGroupLabels[id] ?? 'Readiness checks'
    const integratedActivityCount = Math.min(resolvedActivityCount, integratedCounts.get(id) ?? 0)
    const pendingActivityCount = Math.max(0, resolvedActivityCount - integratedActivityCount)
    const status: MockPrivateInternalAdapterActivityGroupStatus = pendingActivityCount === 0
      ? 'ready'
      : integratedActivityCount > 0
        ? 'partial'
        : input.integrationBlocked
          ? 'blocked'
          : 'pending'

    return {
      id,
      label,
      resolvedActivityCount,
      integratedActivityCount,
      pendingActivityCount,
      status,
      userFacingSummary: summarizeMockPrivateInternalAdapterActivityGroup({
        label,
        integratedActivityCount,
        pendingActivityCount,
        status,
      }),
    }
  })
}

export function createMockApiRuntimeContext(
  input: Partial<ApiRuntimeContext> = {},
): ApiRuntimeContext {
  return {
    mode: input.mode ?? 'mock',
    userId: input.userId,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    requestId: input.requestId ?? `mock-api-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    mockOnly: input.mockOnly ?? true,
  }
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined
}

function stringField(record: Record<string, unknown> | undefined, key: string): string | undefined {
  const value = record?.[key]
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function numberField(record: Record<string, unknown> | undefined, key: string): number | undefined {
  const value = record?.[key]
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const numeric = Number(value)
    return Number.isFinite(numeric) ? numeric : undefined
  }
  return undefined
}

export function registerMockRouteHandler(routeId: string, handler: ApiRouteHandler): void {
  registeredHandlers.set(routeId, handler)
}

export async function handleMockApiRequest<TBody = unknown, TData = unknown>(
  request: ApiRequestEnvelope<TBody>,
): Promise<ApiResponseEnvelope<TData>> {
  const route = getApiRouteById(request.routeId)

  if (!route) {
    return createApiNotImplementedResponse(request.routeId, [
      'Route id is not registered in the ReeditPro API route map.',
    ]) as ApiResponseEnvelope<TData>
  }

  if (
    route.status === 'disabled' ||
    route.status === 'backend_required' ||
    route.requiresServiceRole ||
    route.requiresProviderSecret ||
    route.requiresStripeSecret
  ) {
    return createApiBackendRequiredResponse(route.id, route.notes) as ApiResponseEnvelope<TData>
  }

  const handler = registeredHandlers.get(route.id) ?? DEFAULT_MOCK_HANDLERS[route.id]

  if (!handler) {
    return createApiNotImplementedResponse(route.id, route.notes) as ApiResponseEnvelope<TData>
  }

  try {
    const response = await handler({
      ...request,
      context: {
        ...createMockApiRuntimeContext(request.context),
        ...request.context,
        mockOnly: true,
      },
    })

    return response as ApiResponseEnvelope<TData>
  } catch (error) {
    return createApiErrorResponse(
      'mock_route_error',
      error instanceof Error ? error.message : `Mock route ${route.id} failed.`,
      {
        details: error,
        warnings: ['Mock route execution failed before any live backend/provider call was attempted.'],
        mockOnly: true,
      },
    ) as ApiResponseEnvelope<TData>
  }
}

export function createMockApiRouterSummary() {
  const routeSummary = createApiRouteMapSummary()

  return {
    ...routeSummary,
    registeredMockHandlers: Object.keys(DEFAULT_MOCK_HANDLERS).length + registeredHandlers.size,
    mockReadyRouteIds: getMockReadyRoutes().map((route) => route.id),
    warnings: [
      ...routeSummary.warnings,
      'Mock router handles local service calls only and blocks backend-required routes.',
    ],
  }
}

const DEFAULT_MOCK_HANDLERS: Record<string, ApiRouteHandler> = {
  'auth.bootstrap.status': handleAuthBootstrapStatus,
  'auth.bootstrap.currentUser': handleAuthBootstrapCurrentUser,
  'projects.demo.create': handleMockChatNativePlanning,
  'media.uploadPlan.create': handleCreateUploadPlan,
  'media.upload.validate': handleValidateUpload,
  'media.sourceSequence.create': handleMockSourceSequenceUploadFlow,
  'media.asset.mockCreate': handleMockMediaAssetCreate,
  'media.reference.mockCreate': handleMockReferenceAssetCreate,
  'storage.client.status': handleStorageClientStatus,
  'storage.uploadPlan.create': handleCreateUploadPlan,
  'storage.upload.validate': handleValidateUpload,
  'storage.objectPath.create': handleStorageObjectPathCreate,
  'planning.intent.analyze': handleMockChatNativePlanning,
  'planning.sourceSequenceMap.create': handleMockChatNativePlanning,
  'planning.editPlan.create': handleMockChatNativePlanning,
  'planning.editQuality.create': handleMockChatNativePlanning,
  'planning.signatureRoutes.create': handleMockChatNativePlanning,
  'planning.demo.chatNative.create': handleMockChatNativePlanning,
  'credits.estimate.create': handleMockCreditEstimate,
  'credits.gate.check': handleMockCreditGateCheck,
  'credits.toolCost.estimate': handleMockToolCostEstimate,
  'credits.toolCost.event.create': handleMockToolCostEventCreate,
  'credits.toolCost.summary.get': handleMockToolCostSummaryGet,
  'jobs.queue': handleMockJobQueue,
  'jobs.gate.check': handleMockJobGateCheck,
  'editExecution.privateInternalTestRun.create': handleMockApprovedEditExecutionPrivateInternalTestRun,
  'editExecution.package.create': handleMockApprovedEditExecutionPackageCreate,
  'editExecution.boundedAdapterExecutionGate.get': handleMockApprovedEditExecutionBoundedAdapterExecutionGateRead,
  'editExecution.boundedAdapterSourceTruthReview.create': handleMockApprovedEditExecutionBoundedAdapterSourceTruthReview,
  'editExecution.boundedAdapterExecutionRun.create': handleMockApprovedEditExecutionBoundedAdapterExecutionRun,
  'editExecution.registeredAdapterRunnerProbe.create': handleMockApprovedEditExecutionRegisteredAdapterRunnerProbe,
  'editExecution.registeredAdapterPrivateMediaRunner.create': handleMockApprovedEditExecutionRegisteredAdapterPrivateMediaRunner,
  'editExecution.registeredAdapterPrivateMediaRunnerQa.review': handleMockApprovedEditExecutionRegisteredAdapterPrivateMediaRunnerQaReview,
  'editExecution.adapterWorkerArtifactIntegration.create': handleMockApprovedEditExecutionAdapterWorkerArtifactIntegration,
  'editExecution.jobBatchPlan.create': handleMockApprovedEditExecutionJobBatchPlanCreate,
  'editExecution.mockQueue.create': handleMockApprovedEditExecutionQueueCreate,
  'editExecution.dispatchReadiness.check': handleMockApprovedEditExecutionDispatchReadiness,
  'editExecution.mockWorkerClaims.create': handleMockApprovedEditExecutionWorkerClaims,
  'editExecution.handlerDryRun.create': handleMockApprovedEditExecutionHandlerDryRun,
  'editExecution.resultReconciliation.create': handleMockApprovedEditExecutionResultReconciliation,
  'editExecution.localWorkerOutput.persist': handleMockApprovedEditExecutionLocalWorkerOutput,
  'editExecution.localWorkerOutputQa.review': handleMockApprovedEditExecutionLocalWorkerOutputQaReview,
  'editExecution.workflowRehearsal.run': handleMockApprovedEditExecutionWorkflowRehearsal,
  'editExecution.uploadedMediaWorkerExecution.create': handleMockApprovedEditExecutionUploadedMediaWorkerExecution,
  'editExecution.privateWorkerArtifactQa.review': handleMockApprovedEditExecutionPrivateWorkerArtifactQaReview,
  'editExecution.localMediaProcessingExecution.create': handleMockApprovedEditExecutionLocalMediaProcessingExecution,
  'editExecution.privateMediaArtifactQa.review': handleMockApprovedEditExecutionPrivateMediaArtifactQaReview,
  'editExecution.renderPreviewAssembly.create': handleMockApprovedEditExecutionRenderPreviewAssembly,
  'editExecution.userPreviewReview.create': handleMockApprovedEditExecutionUserPreviewReview,
  'editExecution.finalRenderReadinessReview.create': handleMockApprovedEditExecutionFinalRenderReadinessReview,
  'editExecution.finalRenderExecution.create': handleMockApprovedEditExecutionFinalRenderExecution,
  'editExecution.finalDeliveryQa.review': handleMockApprovedEditExecutionFinalDeliveryQaReview,
  'editExecution.privateInternalDownloadDelivery.create': handleMockApprovedEditExecutionPrivateInternalDownloadDelivery,
  'jobs.dependencies.create': handleMockJobDependencies,
  'jobs.dispatch.mock': handleMockJobDispatch,
  'jobs.status.get': handleMockJobStatus,
  'jobs.events.list': handleMockJobEvents,
  'jobs.retry.schedule': handleMockJobRetry,
  'jobs.cancel': handleMockJobCancel,
  'runtime.envelope.create': handleMockRuntimeEnvelopeCreate,
  'runtime.transport.mockSend': handleMockRuntimeTransportSend,
  'worker.lease.claim': handleMockWorkerLeaseClaim,
  'worker.lease.heartbeat': handleMockWorkerLeaseHeartbeat,
  'worker.lease.renew': handleMockWorkerLeaseRenew,
  'worker.lease.release': handleMockWorkerLeaseRelease,
  'worker.lease.complete': handleMockWorkerLeaseComplete,
  'worker.lease.fail': handleMockWorkerLeaseFail,
  'worker.lease.recoverStale': handleMockWorkerLeaseRecoverStale,
  'worker.runtime.registry': handleMockWorkerRuntimeRegistry,
  'generation.creditGate.check': handleMockGenerationCreditGate,
  'generation.jobRuntime.queueMock': handleMockJobQueue,
  'generation.runtime.transportMock': handleMockRuntimeTransportSend,
  'render.timingManifest.create': handleMockStoryTimingPlan,
  'render.creditGate.check': handleMockRenderCreditGate,
  'render.jobRuntime.queueMock': handleMockRenderJobQueue,
  'render.workerLease.claimMock': handleMockRenderWorkerLease,
  'render.readiness.check': handleMockStoryTimingQA,
  'music.creditGate.check': handleMockGenerationCreditGate,
  'music.jobRuntime.queueMock': handleMockMusicJobRuntime,
  'music.directorPlan.create': handleMockMusicPlan,
  'music.cueSheet.create': handleMockMusicPlan,
  'music.lyriaPrompt.create': handleMockMusicPlan,
  'music.qa.run': handleMockMusicQA,
  'music.mixPlan.create': handleMockMusicMixPlan,
  'sfx.providerReadiness.check': handleMockSFXProviderReadiness,
  'sfx.project.plan': handleMockEditProjectSFXPlan,
  'sfx.project.providerRoutes': handleMockEditProjectSFXProviderRoutes,
  'sfx.project.prompts': handleMockEditProjectSFXPrompts,
  'sfx.project.creditEstimate': handleMockEditProjectSFXCreditEstimate,
  'sfx.project.queueMockGeneration': handleMockEditProjectSFXQueueGeneration,
  'sfx.project.runMockWorker': handleMockEditProjectSFXWorker,
  'sfx.project.status': handleMockEditProjectSFXStatus,
  'sfx.creditGate.check': handleMockGenerationCreditGate,
  'sfx.jobRuntime.queueMock': handleMockSFXJobRuntime,
  'sfx.directorPlan.create': handleMockSfxDirectorPlan,
  'sfx.prompt.create': handleMockSfxPromptPlan,
  'sfx.timingTrim.create': handleMockSfxTimingPlan,
  'sfx.mixPlan.create': handleMockSfxMixPlan,
  'sfx.qa.run': handleMockSfxQA,
  'sfx.libraryCandidate.evaluate': handleMockSfxLibraryCandidate,
  'storytiming.masterTimingMap.create': handleMockStoryTimingPlan,
  'storytiming.captionCut.run': handleMockCaptionCutTiming,
  'storytiming.musicSfx.run': handleMockMusicSfxTiming,
  'storytiming.signature.run': handleMockStoryTimingPlan,
  'storytiming.qa.run': handleMockStoryTimingQA,
  'storytiming.renderManifest.create': handleMockStoryTimingPlan,
  ...EDIT_LEVEL_MOCK_ROUTE_HANDLERS,
}

function handleAuthBootstrapStatus(): ApiResponseEnvelope {
  return createApiMockResponse(getAuthClientStatus())
}

async function handleAuthBootstrapCurrentUser(): Promise<ApiResponseEnvelope> {
  const result = await runAuthBootstrapFlow()
  return createApiMockResponse(result, result.warnings)
}

function handleCreateUploadPlan(request: ApiRequestEnvelope): ApiResponseEnvelope {
  const input = request.body as CreateUploadPlanInput | undefined

  if (!input?.file || !input.purpose) {
    return createApiErrorResponse('invalid_upload_plan_input', 'Upload plan requires file metadata and purpose.', {
      statusCode: 400,
      warnings: ['No upload was attempted.'],
      mockOnly: true,
    })
  }

  const result = createUploadPlan(input)
  return createApiMockResponse(result, result.warnings)
}

function handleValidateUpload(request: ApiRequestEnvelope): ApiResponseEnvelope {
  const input = request.body as CreateUploadPlanInput | undefined

  if (!input?.purpose) {
    return createApiErrorResponse('invalid_upload_validation_input', 'Upload validation requires an upload purpose.', {
      statusCode: 400,
      warnings: ['No upload was attempted.'],
      mockOnly: true,
    })
  }

  const result = validateUploadFile(input.file, input.purpose, input)
  return createApiMockResponse(result, result.warnings)
}

function createMockProfessionalEditDecisionManifest(input: {
  approvedPlanSnapshotId: string
  creditReservationId: string
  renderPreviewAssemblyId: string
  finalRenderArtifactId: string
  approvedSnapshot?: Record<string, unknown>
  adapterQaIntegration?: Record<string, unknown> | null
  sourceMediaAssets?: Array<{
    mediaAssetId?: string
    sourceSequenceItemId?: string
    uploadedClipId?: string
    uploadedOrder?: number
    byteSize?: number
    checksumSha256?: string
  }>
}) {
  const sourceMediaAssets = input.sourceMediaAssets?.length
    ? input.sourceMediaAssets
    : [{ mediaAssetId: 'mock-source-media-1', uploadedOrder: 1, checksumSha256: 'a'.repeat(64) }]
  const sourceMediaAssetIds = sourceMediaAssets.map((asset, index) => asset.mediaAssetId ?? `mock-source-media-${index + 1}`)
  const uploadedOrders = sourceMediaAssets.map((asset, index) => asset.uploadedOrder ?? index + 1)
  const sourceChecksumSha256ByMediaAssetId = Object.fromEntries(
    sourceMediaAssets
      .map((asset, index) => [sourceMediaAssetIds[index], normalizeMockChecksumSha256(asset.checksumSha256)] as const)
      .filter((entry): entry is [string, string] => Boolean(entry[1])),
  )

  const adapterQaIntegration = createMockAdapterQaIntegrationForDecisionManifest(input.adapterQaIntegration)
  const releaseReadiness = createMockApprovedExecutionReleaseReadiness()

  return {
    manifestVersion: 'private-internal-edit-decision-manifest-v1',
    source: 'approved_snapshot_private_render_execution',
    approvedPlanSnapshotId: input.approvedPlanSnapshotId,
    approvedEditContext: createMockApprovedEditContext(input.approvedPlanSnapshotId, input.approvedSnapshot, sourceMediaAssets.length),
    creditReservationId: input.creditReservationId,
    renderPreviewAssemblyId: input.renderPreviewAssemblyId,
    finalRenderArtifactId: input.finalRenderArtifactId,
    clipDecisionCount: sourceMediaAssets.length,
    sourceMediaAssetCount: sourceMediaAssets.length,
    uploadedSourceOrderTrace: {
      source: 'uploaded_media_source_order',
      sourceMediaAssetIds,
      uploadedOrders,
      uniqueUploadedOrderCount: new Set(uploadedOrders).size,
      uniqueSourceMediaAssetCount: new Set(sourceMediaAssetIds).size,
      sourceOrderPreserved: true,
      uploadedOrderMonotonic: true,
      sourceMediaCoverageComplete: true,
      firstAppearanceSourceMediaAssetIds: sourceMediaAssetIds,
      firstAppearanceUploadedOrders: uploadedOrders,
      sourceChecksumSha256ByMediaAssetId,
    },
    privateCaptionPackage: {
      attached: false,
      source: 'none',
      artifactCount: 0,
      formats: [],
    },
    adapterQaIntegration,
    professionalLayerCounts: {
      reviewOverlays: 0,
      captionOverlays: 0,
      transitionPolish: 0,
      visualPolish: 0,
      finalTiming: 0,
      audioPolish: 0,
    },
    decisions: sourceMediaAssets.map((asset, index) => ({
        clipRefId: `mock-preview-clip-${index + 1}`,
        processedArtifactId: `mock-processed-artifact-${index + 1}`,
        processedArtifact: {
          storageProvider: 'local_private',
          storageObjectPath: `private/mock/processed/mock-processed-artifact-${index + 1}.mp4`,
          mimeType: 'video/mp4',
          sha256: 'f'.repeat(64),
          byteSize: Math.max(1, asset.byteSize ?? 1024),
          durationSeconds: 1,
          privateArtifact: true,
          publicArtifact: false,
          signedUrl: null,
        },
        sourceMediaAssetId: sourceMediaAssetIds[index],
        sourceChecksumSha256: normalizeMockChecksumSha256(asset.checksumSha256) ?? null,
        uploadedOrder: uploadedOrders[index],
        segment: { id: `mock-segment-${index + 1}`, order: index + 1, label: `Mock segment ${index + 1}` },
        approvedSourceRange: {
          source: 'bounded_preview_default',
          clipId: asset.uploadedClipId ?? `mock-clip-${index + 1}`,
          sourceSequenceItemId: asset.sourceSequenceItemId ?? `mock-source-sequence-item-${index + 1}`,
          startSeconds: 0,
          durationSeconds: 1,
          endSeconds: 1,
          requestedMaxDurationSeconds: 1,
        },
        reviewOverlay: { present: false, hasTitle: false, hasSubtitle: false, source: 'none' },
        captionOverlay: { present: false, captionTimingItemId: null, textPresent: false, textCharacterCount: 0, source: 'none' },
        transitionPolish: { present: false, transitionTimingItemIds: [], fadeInSeconds: null, fadeOutSeconds: null, source: 'none' },
        visualPolish: {
          present: false,
          colorPipelinePlanId: null,
          colorGradeStyle: null,
          intensity: null,
          operationCount: 0,
          source: 'none',
          fullColorPipelineExecuted: false,
        },
        finalTiming: {
          present: false,
          finalTimingItemId: null,
          startSeconds: null,
          durationSeconds: null,
          endSeconds: null,
          fps: null,
          source: 'none',
        },
        privateArtifact: true,
        publicArtifact: false,
        signedUrl: null,
      })),
    gateState: {
      privateInternalReview: 'requires_delivery_qa',
      publicDeliveryReady: releaseReadiness.publicDeliveryReady,
      externalBetaReady: releaseReadiness.externalBetaReady,
      productionReady: releaseReadiness.productionReady,
    },
    blockedRuntimeScopes: {
      publicArtifactCreated: false,
      signedUrlCreated: false,
      supabaseOrGcsWrite: false,
      externalBetaEnabled: false,
      productionEnabled: false,
      billingMutation: false,
    },
  }
}

function createMockAdapterQaIntegrationForDecisionManifest(adapterQaIntegration: Record<string, unknown> | null | undefined) {
  if (!adapterQaIntegration) {
    return {
      attached: false,
      adapterWorkerArtifactIntegrationId: null,
      privateMediaRunnerQaReviewId: null,
      renderIntegrationManifestArtifactId: null,
      reviewedActivityCount: 0,
      passedActivityCount: 0,
      artifactCount: 0,
      renderPreviewIntegrationReady: false,
      finalRenderDecisionManifestEligible: false,
      mediaTransformOutputEligible: false,
      productRuntimeExecuted: false,
      privateArtifact: true,
      publicArtifact: false,
      signedUrl: null,
      artifacts: [],
    }
  }

  const artifacts = Array.isArray(adapterQaIntegration.artifacts)
    ? adapterQaIntegration.artifacts.filter(isPlainObject).map((artifact) => ({
        artifactId: stringField(artifact, 'artifactId') ?? 'mock-adapter-qa-artifact',
        canonicalToolId: stringField(artifact, 'canonicalToolId') ?? '',
        storageObjectPath: stringField(artifact, 'storageObjectPath') ?? '',
        sha256: stringField(artifact, 'sha256') ?? 'd'.repeat(64),
        byteSize: numberField(artifact, 'byteSize') ?? 0,
      }))
    : []

  return {
    attached: true,
    adapterWorkerArtifactIntegrationId: stringField(adapterQaIntegration, 'adapterWorkerArtifactIntegrationId') ?? null,
    privateMediaRunnerQaReviewId: stringField(adapterQaIntegration, 'privateMediaRunnerQaReviewId') ?? null,
    renderIntegrationManifestArtifactId: stringField(adapterQaIntegration, 'renderIntegrationManifestArtifactId') ?? null,
    reviewedActivityCount: numberField(adapterQaIntegration, 'reviewedActivityCount') ?? artifacts.length,
    passedActivityCount: numberField(adapterQaIntegration, 'passedActivityCount') ?? artifacts.length,
    artifactCount: numberField(adapterQaIntegration, 'artifactCount') ?? artifacts.length,
    renderPreviewIntegrationReady: adapterQaIntegration.renderPreviewIntegrationReady === true,
    finalRenderDecisionManifestEligible: adapterQaIntegration.finalRenderDecisionManifestEligible === true,
    mediaTransformOutputEligible: false,
    productRuntimeExecuted: false,
    privateArtifact: true,
    publicArtifact: false,
    signedUrl: null,
    artifacts,
  }
}

function createMockApprovedEditContext(
  approvedPlanSnapshotId: string,
  approvedSnapshot: Record<string, unknown> | undefined,
  fallbackSourceCount: number,
) {
  const compiledIntent = asRecord(approvedSnapshot?.compiledIntent)
  const resolvedSettings = asRecord(compiledIntent?.resolvedSettings)
  const sourcePlan = asRecord(approvedSnapshot?.sourcePlan)
  const creditEstimate = asRecord(approvedSnapshot?.creditEstimate)
  const sourceSequence = Array.isArray(approvedSnapshot?.sourceSequence) ? approvedSnapshot.sourceSequence : []
  const segments = Array.isArray(approvedSnapshot?.segments) ? approvedSnapshot.segments : []
  const operations = Array.isArray(approvedSnapshot?.operations) ? approvedSnapshot.operations : []

  return {
    source: 'approved_plan_snapshot',
    projectId: stringField(approvedSnapshot, 'projectId') ?? 'mock-project',
    editSessionId: stringField(approvedSnapshot, 'editSessionId') ?? 'mock-edit-session',
    editPlanVersionId: stringField(approvedSnapshot, 'editPlanVersionId') ?? 'mock-plan-version',
    creditEstimateId: stringField(approvedSnapshot, 'creditEstimateId') ?? 'mock-credit-estimate',
    approvedAt: stringField(approvedSnapshot, 'approvedAt') ?? null,
    approvedBy: stringField(approvedSnapshot, 'approvedBy') ?? null,
    goalSummary: stringField(compiledIntent, 'goalSummary') ?? stringField(sourcePlan, 'goalSummary') ?? `Approved edit plan ${approvedPlanSnapshotId}`,
    editLevel: stringField(resolvedSettings, 'editLevel') ?? null,
    editingCategory: stringField(resolvedSettings, 'editingCategory') ?? null,
    workflowType: stringField(sourcePlan, 'workflowType') ?? null,
    moodStyle: stringField(resolvedSettings, 'moodStyle') ?? null,
    aspectRatio: stringField(resolvedSettings, 'aspectRatio') ?? null,
    aspectRatioConfirmed: Boolean(stringField(resolvedSettings, 'aspectRatio')) || Boolean(approvedSnapshot),
    sourceOrderConfirmed: sourceSequence.length > 0 || fallbackSourceCount > 0,
    cleanupPreferenceConfirmed: Boolean(approvedSnapshot?.sourceCleanupPlan) || Boolean(approvedSnapshot),
    timingBaseConfirmed: Boolean(approvedSnapshot?.masterTimingPlan) || Boolean(approvedSnapshot),
    professionalBaseline: true,
    sourceSequenceItemCount: sourceSequence.length || fallbackSourceCount,
    segmentCount: segments.length || 1,
    operationCount: operations.length || 1,
    qaGateCount: approvedSnapshot?.qaPlan ? 1 : 0,
    creditEstimateTotalCredits: numberField(creditEstimate, 'total_credits') ?? 1,
    professionalSkillTrace: createMockApprovedEditContextProfessionalSkillTrace(asRecord(approvedSnapshot?.professionalSkillPlan)),
    planningContextTrace: createMockApprovedPlanningContextTrace(approvedSnapshot),
  }
}

function createMockApprovedPlanningContextTrace(approvedSnapshot: Record<string, unknown> | undefined) {
  const trace = asRecord(asRecord(approvedSnapshot?.sourcePlan)?.planningContextTrace)
  if (!trace || trace.source !== 'planning_context') return null

  const planningContextId = stringField(trace, 'planningContextId')
  const status = stringField(trace, 'status')
  if (!planningContextId || !status) return null

  return {
    source: 'planning_context',
    planningContextId,
    status,
    editBriefReady: trace.editBriefReady === true,
    editBriefDirectionCount: numberField(trace, 'editBriefDirectionCount') ?? 0,
    cueUsageCount: numberField(trace, 'cueUsageCount') ?? 0,
    readyCueUsageCount: numberField(trace, 'readyCueUsageCount') ?? 0,
    blockedCueUsageCount: numberField(trace, 'blockedCueUsageCount') ?? 0,
    unresolvedConflictCount: numberField(trace, 'unresolvedConflictCount') ?? 0,
    sourceAssetCount: numberField(trace, 'sourceAssetCount') ?? 0,
    mustUseAssetCount: numberField(trace, 'mustUseAssetCount') ?? 0,
    avoidAssetCount: numberField(trace, 'avoidAssetCount') ?? 0,
  }
}

function createMockProfessionalEditDecisionManifestArtifact(input: {
  finalRenderArtifactId: string
}) {
  return {
    artifactId: `${input.finalRenderArtifactId}-edit-decision-manifest`,
    storageProvider: 'local_private',
    storageObjectPath: `edit-execution/mock/final-render-execution/${input.finalRenderArtifactId}-edit-decision-manifest.json`,
    localFilePath: `/tmp/reeditpro/mock/final-render-execution/${input.finalRenderArtifactId}-edit-decision-manifest.json`,
    mimeType: 'application/json',
    privateArtifact: true,
    publicArtifact: false,
    signedUrl: null,
    sourceOfTruth: true,
    sourceOfTruthScope: 'final_render_execution_edit_decision_manifest',
    sha256: 'e'.repeat(64),
    byteSize: 2048,
    manifestVersion: 'private-internal-edit-decision-manifest-v1',
    finalRenderArtifactId: input.finalRenderArtifactId,
    safeForPrivateReview: true,
    finalDeliveryEligible: false,
  }
}

function createMockProfessionalEditQaSummary() {
  return {
    source: 'final_render_command_summary',
    approvedReviewOverlayCount: 0,
    approvedCaptionOverlayCount: 0,
    privateCaptionArtifactCount: 0,
    privateCaptionFormats: [],
    approvedTransitionPolishCount: 0,
    approvedVisualPolishCount: 0,
    approvedFinalTimingCount: 0,
    approvedFinalTimelineDurationSeconds: 0,
    audioPolishApplied: false,
    visualPolishApplied: false,
    visualPolishToolId: 'none',
    fullColorPipelineExecuted: false,
    editDecisionManifestReady: true,
    editDecisionManifestArtifactReady: true,
    privateInternalQaReady: true,
  }
}

function normalizeMockChecksumSha256(value: string | undefined): string | undefined {
  if (typeof value !== 'string') return undefined
  const normalized = value.trim().toLowerCase()
  return /^[a-f0-9]{64}$/.test(normalized) ? normalized : undefined
}

function handleMockApprovedEditExecutionPrivateInternalTestRun(request: ApiRequestEnvelope): ApiResponseEnvelope {
  const input = request.body as {
    workspaceId?: string
    projectId?: string
    approvedPlanSnapshotId?: string
    approvedSnapshot?: Record<string, unknown>
    creditReservationId?: string
    requestedAdapterToolNames?: string[]
    packageReadyToolIds?: string[]
    modelWeightApprovedToolIds?: string[]
    sourceMediaAssets?: Array<{
      mediaAssetId?: string
      sourceSequenceItemId?: string
      uploadedClipId?: string
      uploadedOrder?: number
      storageProvider?: string
      storageBucket?: string
      storagePath?: string
      fileName?: string
      mimeType?: string
      byteSize?: number
      checksumSha256?: string
      privateArtifact?: boolean
      publicUrl?: string | null
      signedUrl?: string | null
    }>
  } | undefined

  if (!input?.workspaceId || !input.projectId || !input.approvedPlanSnapshotId || !input.approvedSnapshot || !input.creditReservationId || !input.sourceMediaAssets?.length) {
    return createApiErrorResponse('invalid_edit_execution_private_internal_test_run_input', 'Approved snapshot, credit reservation, and private source media evidence are required.', {
      statusCode: 400,
      warnings: ['No worker handlers, providers, render jobs, media processing, Supabase/GCS writes, signed URLs, public artifacts, or billing mutations were started.'],
      mockOnly: true,
    })
  }

  const invalidSource = input.sourceMediaAssets.find((asset) =>
    !asset.mediaAssetId ||
    (asset.storageProvider as string) === 'local_mock' ||
    (asset.storageProvider !== 'local_private' && asset.storageProvider !== 'google_cloud_storage' && asset.storageProvider !== 'supabase_storage') ||
    (typeof asset.storageBucket === 'string' && /^https?:\/\//i.test(asset.storageBucket)) ||
    !asset.storagePath ||
    /^https?:\/\//i.test(asset.storagePath) ||
    !Number.isFinite(asset.byteSize) ||
    Number(asset.byteSize) <= 0 ||
    !normalizeMockChecksumSha256(asset.checksumSha256) ||
    asset.privateArtifact !== true ||
    asset.publicUrl != null ||
    asset.signedUrl != null,
  )

  if (invalidSource) {
    return createApiErrorResponse('invalid_private_internal_test_run_source_asset', 'Private internal test runs require private uploaded source media with byte size, checksum evidence, and no public/signed URLs.', {
      statusCode: 400,
      warnings: ['No worker handlers, providers, render jobs, media processing, Supabase/GCS writes, signed URLs, public artifacts, or billing mutations were started.'],
      mockOnly: true,
    })
  }

  const requestedActivityCount = Array.isArray(input.requestedAdapterToolNames)
    ? new Set(input.requestedAdapterToolNames.filter((name) => typeof name === 'string' && name.trim())).size
    : 0
  const requestedAdapterToolNames = Array.isArray(input.requestedAdapterToolNames)
    ? Array.from(new Set(input.requestedAdapterToolNames.filter((name): name is string => typeof name === 'string' && Boolean(name.trim()))))
    : []
  const readinessCheckCount = requestedActivityCount >= 2 ? 2 : 0
  const blockedActivityCount = 0
  const adapterActivityGroups = buildMockPrivateInternalAdapterActivityGroups({
    requestedToolNames: requestedAdapterToolNames,
    integrationBlocked: requestedActivityCount > 0,
  })
  const adapterGateSummary = {
    status: requestedActivityCount > 0
      ? 'ready_for_adapter_dry_run_and_readiness'
      : 'no_adapter_plan_required',
    executionMode: 'private_internal_dry_run_and_local_fallback',
    requestedActivityCount,
    resolvedActivityCount: requestedActivityCount,
    readyActivityCount: Math.max(0, requestedActivityCount - blockedActivityCount),
    blockedActivityCount,
    editActivityCount: Math.max(0, requestedActivityCount - readinessCheckCount),
    readinessCheckCount,
    toolsExecutedCount: 0,
    fullToolExecutionReady: false,
    privateFallbackReviewOnly: true,
    privateRenderIntegrationStatus: requestedActivityCount > 0
      ? 'approved_preparation_evidence_pending'
      : 'no_backend_adapter_integration_candidates',
    privateRenderIntegrationReady: false,
    privateRenderIntegratedActivityCount: 0,
    backendIntegrationCandidateCount: 0,
    backendIntegrationPendingActivityCount: requestedActivityCount,
    backendIntegrationBlockedActivityCount: requestedActivityCount,
    backendIntegrationBlockers: requestedActivityCount > 0
      ? ['Approved preparation evidence must be attached through the authenticated execution service before wider testing.']
      : [],
    clientReadinessHintsTrusted: false,
    serverSourceTruthRequiredForFullExecution: true,
    frontendExecutionAllowed: false,
    productReady: false,
    userFacingSummary: requestedActivityCount > 0
      ? `Ready to prepare ${Math.max(0, requestedActivityCount - readinessCheckCount)} approved edit activities and ${readinessCheckCount} runtime readiness checks.`
      : 'No extra approved edit activity adapters were needed for this internal run.',
    userFacingReadinessSummary: requestedActivityCount > 0
      ? `Some requested edit activities are prepared for private review only; ${requestedActivityCount} activit${requestedActivityCount === 1 ? 'y still needs' : 'ies still need'} approved execution evidence before wider testing.`
      : 'No extra preparation evidence is needed for this internal run.',
    activityGroups: adapterActivityGroups,
    noRuntimeSideEffects: [
      'Mock adapter gate summary records frontend-safe readiness metadata only.',
      'Frontend mock planning does not execute adapter packages; authenticated backend routes can attach bounded package evidence while full media-transform workers remain gated.',
      'Client-supplied package/model readiness hints are ignored as source truth for private internal runs.',
      'Approved execution evidence is required before bounded/full advanced tool worker execution.',
      'No package import, media tool, provider, renderer, Supabase/GCS write, public artifact, signed URL, or billing mutation occurred.',
    ],
  }

  const id = `mock-private-internal-test-run-${input.approvedPlanSnapshotId}`
  const deliveryId = `mock-private-internal-download-delivery-${input.approvedPlanSnapshotId}`
  const releaseReadiness = createMockApprovedExecutionReleaseReadiness({
    privateInternalReady: true,
  })
  const finalRenderArtifact = {
    artifactId: `mock-final-render-artifact-${input.approvedPlanSnapshotId}`,
    storageProvider: 'local_private',
    storageObjectPath: `edit-execution/${input.workspaceId}/${input.projectId}/${input.approvedPlanSnapshotId}/final-render-execution/mock-final-render.mp4`,
    localFilePath: `/tmp/reeditpro/mock/final-render-execution/mock-final-render.mp4`,
    mimeType: 'video/mp4',
    privateArtifact: true,
    publicArtifact: false,
    signedUrl: null,
    sourceOfTruth: true,
    sourceOfTruthScope: 'final_render_execution_private_artifact',
    mediaArtifact: true,
    finalRenderArtifact: true,
    sha256: 'd'.repeat(64),
    byteSize: 8192,
    commandSummary: {
      tool: 'ffmpeg',
      mode: 'concat_copy',
      inputCount: 1,
      videoCodec: 'copy',
      audioMode: 'copy',
      audioPolish: {
        applied: false,
        source: 'mock_final_render_contract_only',
        targetIntegratedLufs: -16,
        truePeakDb: -1.5,
        loudnessRangeLufs: 11,
        limiter: false,
        filterChain: [],
      },
      reviewOverlayCount: 0,
      approvedFinalTimingCount: 0,
      approvedFinalTimelineDurationSeconds: 0,
      approvedCaptionOverlayCount: 0,
      approvedTransitionPolishCount: 0,
    },
    editDecisionManifest: createMockProfessionalEditDecisionManifest({
      approvedPlanSnapshotId: input.approvedPlanSnapshotId,
      approvedSnapshot: input.approvedSnapshot,
      creditReservationId: input.creditReservationId,
      renderPreviewAssemblyId: `mock-render-preview-assembly-${input.approvedPlanSnapshotId}`,
      finalRenderArtifactId: `mock-final-render-artifact-${input.approvedPlanSnapshotId}`,
      sourceMediaAssets: input.sourceMediaAssets,
    }),
    editDecisionManifestArtifact: createMockProfessionalEditDecisionManifestArtifact({
      finalRenderArtifactId: `mock-final-render-artifact-${input.approvedPlanSnapshotId}`,
    }),
    deliveryQaRequired: true,
    finalDeliveryEligible: false,
  }
  const privateInternalDownloadDelivery = {
    id: deliveryId,
    finalDeliveryQaReviewId: `mock-final-delivery-qa-review-${input.approvedPlanSnapshotId}`,
    finalRenderExecutionId: `mock-final-render-execution-${input.approvedPlanSnapshotId}`,
    finalRenderReadinessReviewId: `mock-final-render-readiness-review-${input.approvedPlanSnapshotId}`,
    userPreviewReviewId: `mock-user-preview-review-${input.approvedPlanSnapshotId}`,
    renderPreviewAssemblyId: `mock-render-preview-assembly-${input.approvedPlanSnapshotId}`,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    approvedPlanSnapshotId: input.approvedPlanSnapshotId,
    creditReservationId: input.creditReservationId,
    status: 'private_internal_download_delivery_ready',
    deliveryOnly: true,
    privateInternalDownloadReady: true,
    publicDeliveryReady: releaseReadiness.publicDeliveryReady,
    externalBetaReady: releaseReadiness.externalBetaReady,
    productionReady: releaseReadiness.productionReady,
    finalExportReady: true,
    internalDownloadPath: `/v1/edit-executions/private-internal-downloads/${deliveryId}/file`,
    internalManifestPath: `/v1/edit-executions/private-internal-downloads/${deliveryId}/manifest`,
    professionalEditQaSummary: createMockProfessionalEditQaSummary(),
    finalRenderArtifact,
    workersStarted: 0,
    workerHandlersStarted: 0,
    toolsExecuted: 0,
    mediaBytesProcessed: false,
    liveExecutionReady: false,
    nextRequiredGate: 'backend_adapter_source_truth_evidence_before_external_beta_or_production_release',
    userFacingSummary: 'The private fallback review video is ready for authenticated internal download/testing.',
    noRuntimeSideEffects: [
      'Mock private internal test run returns an internal delivery contract only.',
      'No provider call, Supabase/GCS write, signed URL/public artifact, external beta, production delivery, or billing mutation occurred.',
    ],
  }

  return createApiMockResponse({
    internalTestRun: {
      id,
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      approvedPlanSnapshotId: input.approvedPlanSnapshotId,
      creditReservationId: input.creditReservationId,
      status: 'private_internal_test_run_completed_ready_for_download',
      internalTestRunOnly: true,
      sourceMediaAssetCount: input.sourceMediaAssets.length,
      adapterGateSummary,
      stageIds: {
        packageRecordId: `mock-approved-edit-execution-package-${input.approvedPlanSnapshotId}`,
        adapterIntegrationPackageRecordId: null,
        adapterSourceTruthReviewId: null,
        adapterBoundedExecutionRunId: null,
        adapterRegisteredRunnerRunId: null,
        adapterPrivateMediaRunnerRunId: null,
        adapterPrivateMediaRunnerQaReviewId: null,
        adapterWorkerArtifactIntegrationId: null,
        privateInternalDownloadDeliveryId: deliveryId,
      },
      privateInternalDownloadDelivery,
      privateInternalDownloadPath: privateInternalDownloadDelivery.internalDownloadPath,
      privateInternalManifestPath: privateInternalDownloadDelivery.internalManifestPath,
      finalRenderArtifact,
      publicDeliveryReady: releaseReadiness.publicDeliveryReady,
      externalBetaReady: releaseReadiness.externalBetaReady,
      productionReady: releaseReadiness.productionReady,
      nextRequiredGate: 'backend_adapter_source_truth_evidence_before_external_beta_or_production_release',
        userFacingSummary: 'Your approved edit has completed a private internal review render and is ready to download. Bounded backend package checks may be attached; media-transform workers remain gated.',
      noRuntimeSideEffects: [
        'Mock private internal test run kept all execution scoped to internal testing metadata.',
        'Frontend mock planning does not execute adapter packages; authenticated backend routes can attach bounded package evidence while full media-transform workers remain gated.',
        'No public artifact, signed URL, Supabase/GCS write, external beta release, production release, provider call, or billing mutation occurred.',
      ],
    },
    warnings: [
      'Mock private internal test run response only.',
      'Public delivery, signed URLs, external beta, and production require approved release evidence gates.',
    ],
  }, [
    'Mock private internal test run response only.',
    'Public delivery, signed URLs, external beta, and production require approved release evidence gates.',
  ])
}

function handleMockApprovedEditExecutionPackageCreate(request: ApiRequestEnvelope): ApiResponseEnvelope {
  const input = request.body as {
    workspaceId?: string
    projectId?: string
    approvedPlanSnapshotId?: string
    approvedSnapshot?: {
      id?: string
      projectId?: string
      editSessionId?: string
      creditEstimateId?: string
      sourceSequence?: unknown[]
      segments?: unknown[]
      operations?: unknown[]
      editingAgentExecutionPlan?: {
        workItems?: unknown[]
        assetManifest?: unknown[]
      }
      professionalSkillPlan?: Record<string, unknown>
    }
    creditReservationId?: string
    requestedAdapterToolNames?: string[]
    packageReadyToolIds?: string[]
    modelWeightApprovedToolIds?: string[]
  } | undefined

  if (!input?.workspaceId || !input.approvedPlanSnapshotId || !input.approvedSnapshot || !input.creditReservationId) {
    return createApiErrorResponse('invalid_edit_execution_package_input', 'Approved snapshot and credit reservation evidence are required.', {
      statusCode: 400,
      warnings: ['No workers, providers, render jobs, media processing, Supabase/GCS writes, or billing mutations were started.'],
      mockOnly: true,
    })
  }

  if (input.approvedSnapshot.id !== input.approvedPlanSnapshotId) {
    return createApiErrorResponse('approved_snapshot_mismatch', 'approvedPlanSnapshotId must match approvedSnapshot.id.', {
      statusCode: 400,
      warnings: ['The package was rejected before any execution boundary was reached.'],
      mockOnly: true,
    })
  }

  const sourceClipCount = input.approvedSnapshot.sourceSequence?.length ?? 0
  const segmentCount = input.approvedSnapshot.segments?.length ?? 0
  const operationCount = input.approvedSnapshot.operations?.length ?? 0
  const workItemCount = input.approvedSnapshot.editingAgentExecutionPlan?.workItems?.length ?? 0
  const privateArtifactRefCount = input.approvedSnapshot.editingAgentExecutionPlan?.assetManifest?.length ?? 0
  const professionalSkillTrace = createMockApprovedPackageProfessionalSkillTrace(input.approvedSnapshot.professionalSkillPlan)
  const missingProfessionalSkillTraceBlocker = input.approvedSnapshot.professionalSkillPlan && !professionalSkillTrace
    ? ['Approved snapshot professional skill plan is missing valid canonical model-role trace evidence.']
    : []
  const requestedAdapterToolNames = Array.from(new Set(
    (input.requestedAdapterToolNames ?? []).filter((toolId) => typeof toolId === 'string' && toolId.trim()).map((toolId) => toolId.trim()),
  ))
  const requestedAdapterCount = requestedAdapterToolNames.length
  const packageRecordId = `mock-approved-edit-execution-package-${input.approvedPlanSnapshotId}`
  const approvedEditExecutionPackage = {
    packageRecordId,
    workspaceId: input.workspaceId,
    projectId: input.projectId ?? input.approvedSnapshot.projectId,
    approvedPlanSnapshotId: input.approvedPlanSnapshotId,
    status: workItemCount > 0 ? 'ready_for_mock_preview_review' : 'blocked_missing_execution_plan',
    agentCallReady: workItemCount > 0 && missingProfessionalSkillTraceBlocker.length === 0,
    liveExecutionReady: false,
    sourceClipCount,
    segmentCount,
    operationCount,
    plannedWorkItemCount: workItemCount,
    privateArtifactRefCount,
    requestedAdapterToolNames,
    packageReadyToolIds: [],
    modelWeightApprovedToolIds: [],
    resolvedAdapterToolCount: requestedAdapterCount,
    boundedAdapterExecutionReady: false,
    boundedAdapterReadyToolCount: 0,
    boundedAdapterBlockedToolCount: requestedAdapterCount,
    boundedAdapterBlockers: requestedAdapterCount > 0
      ? ['Approved package/runtime readiness evidence is required before bounded edit activity execution.']
      : [],
    boundedAdapterExecutionGate: requestedAdapterCount > 0
      ? {
          status: 'blocked',
          requestedToolCount: requestedAdapterCount,
          resolvedToolCount: requestedAdapterCount,
          readyToolCount: 0,
          blockedToolCount: requestedAdapterCount,
          clientReadinessHintsTrusted: false,
          serverSourceTruthRequired: true,
          frontendExecutionAllowed: false,
          productReady: false,
          userFacingSummary: `Advanced edit preparation is blocked for ${requestedAdapterCount} edit activit${requestedAdapterCount === 1 ? 'y' : 'ies'} until readiness evidence is complete.`,
          userFacingReadinessSummary: `${requestedAdapterCount} edit activit${requestedAdapterCount === 1 ? 'y needs' : 'ies need'} approved readiness evidence before wider testing.`,
          noRuntimeSideEffects: [
            'Frontend-safe package creation does not run adapters; it records server-owned readiness evidence requirements for a future worker execution step.',
            'Client-supplied package/model readiness hints are not source truth for this gate.',
          ],
        }
      : undefined,
    professionalSkillTrace,
    userFacingSummary: 'The approved edit is packaged for internal preview preparation. Final export still waits for worker execution, QA, and release gates.',
    blockers: [
      ...(workItemCount > 0 ? [] : ['Approved snapshot is missing an editing agent execution plan.']),
      ...missingProfessionalSkillTraceBlocker,
    ],
    noRuntimeSideEffects: [
      'Mock package creation did not dispatch workers, run tools, process media, render, write Supabase/GCS, or bill users.',
      'Client-supplied package/model readiness hints are ignored as source truth for frontend-safe package creation.',
      'Frontend copy must describe edit activities and progress, not implementation package names.',
    ],
  }
  mockApprovedEditExecutionPackagesById.set(packageRecordId, approvedEditExecutionPackage)

  return createApiMockResponse({
    approvedEditExecutionPackage,
    warnings: [
      'Mock approved edit execution package only.',
      'Live backend transport and worker dispatch remain disabled until reviewed runtime gates pass.',
    ],
  }, [
    'Mock approved edit execution package only.',
    'Live backend transport and worker dispatch remain disabled until reviewed runtime gates pass.',
  ])
}

function createMockApprovedPackageProfessionalSkillTrace(skillPlan: Record<string, unknown> | undefined) {
  if (!skillPlan || skillPlan.noUserVisibleToolNames !== true) {
    return null
  }

  const backendIntents = Array.isArray(skillPlan.backendIntents)
    ? skillPlan.backendIntents.flatMap(createMockApprovedPackageBackendIntentTrace)
    : []
  const modelRoleTrace = createMockProfessionalSkillModelRoleTrace(skillPlan)

  if (!mockProfessionalSkillModelRoleTraceIsPackageReady(modelRoleTrace)) {
    return null
  }

  return {
    source: 'approved_professional_skill_plan',
    status: sanitizeMockSkillTraceCopy(skillPlan.status) || 'unknown',
    selectedSkillCount: typeof skillPlan.selectedSkillCount === 'number' ? skillPlan.selectedSkillCount : 0,
    selectedFamilies: uniqueMockSkillTraceStrings(skillPlan.selectedFamilies),
    activityGroups: Array.isArray(skillPlan.activityGroups)
      ? skillPlan.activityGroups.slice(0, 8).flatMap((group) => {
          if (!isPlainObject(group)) return []
          const id = sanitizeMockSkillTraceCopy(group.id)
          const label = sanitizeMockSkillTraceCopy(group.label)
          const status = sanitizeMockSkillTraceCopy(group.status)
          const userFacingSummary = sanitizeMockSkillTraceCopy(group.userFacingSummary)

          return id && label && status && userFacingSummary
            ? [{
                id,
                label,
                selectedActivityCount: numberOrZero(group.selectedActivityCount),
                readyActivityCount: numberOrZero(group.readyActivityCount),
                reviewActivityCount: numberOrZero(group.reviewActivityCount),
                blockedActivityCount: numberOrZero(group.blockedActivityCount),
                status,
                userFacingSummary,
              }]
            : []
        })
      : [],
    backendIntentCount: backendIntents.length,
    backendIntentKinds: Array.from(new Set(backendIntents.map((intent) => intent.intentKind))),
    backendIntents,
    modelRoleTrace,
    qaGateCount: Array.isArray(skillPlan.qaGateSummary) ? skillPlan.qaGateSummary.length : 0,
    warnings: uniqueMockSkillTraceStrings(skillPlan.warnings).slice(0, 4),
    blockers: uniqueMockSkillTraceStrings(skillPlan.blockers).slice(0, 4),
    editBriefOptional: true,
    promptFirstPlanning: true,
    noUserVisibleToolNames: true,
  }
}

function createMockApprovedEditContextProfessionalSkillTrace(skillPlan: Record<string, unknown> | undefined) {
  const packageTrace = createMockApprovedPackageProfessionalSkillTrace(skillPlan)
  if (!packageTrace) return null

  return {
    ...packageTrace,
    source: 'professional_skill_plan',
    userFacingActivities: uniqueMockSkillTraceStrings(skillPlan?.userFacingActivities).slice(0, 8),
  }
}

function createMockProfessionalSkillModelRoleTrace(skillPlan: Record<string, unknown> | undefined) {
  const trace = asRecord(skillPlan?.modelRoleTrace)
  if (
    trace?.source !== 'reeditpro_model_role_contract' ||
    typeof trace.contractVersion !== 'string' ||
    typeof trace.ok !== 'boolean' ||
    typeof trace.blocked !== 'boolean' ||
    trace.mockOnly !== true
  ) {
    return undefined
  }

  return {
    source: 'reeditpro_model_role_contract',
    contractVersion: sanitizeMockSkillTraceIdentifier(trace.contractVersion) || 'unknown',
    ok: trace.ok,
    blocked: trace.blocked,
    checkedContractCount: numberOrZero(trace.checkedContractCount),
    modelRoleIntentCount: numberOrZero(trace.modelRoleIntentCount),
    roles: Array.isArray(trace.roles)
      ? trace.roles.flatMap((role) => {
          if (!isPlainObject(role)) return []
          const modelRoleId = sanitizeMockSkillTraceIdentifier(role.modelRoleId)
          const providerBoundary = sanitizeMockSkillTraceIdentifier(role.providerBoundary)
          const canonicalProviderModel = sanitizeMockSkillTraceIdentifier(role.canonicalProviderModel)
          const reasoningRouteRole = mockReasoningRouteRole(role.reasoningRouteRole)
          const reasoningRoutePriority = mockReasoningRoutePriority(role.reasoningRoutePriority)

          if (
            !modelRoleId ||
            !providerBoundary ||
            !canonicalProviderModel ||
            !reasoningRouteRole ||
            reasoningRoutePriority === undefined ||
            typeof role.fallbackOnly !== 'boolean' ||
            typeof role.userReasoningAllowed !== 'boolean' ||
            typeof role.editPlanningAllowed !== 'boolean' ||
            typeof role.creativeStrategyAllowed !== 'boolean' ||
            typeof role.editQaReasoningAllowed !== 'boolean' ||
            typeof role.visualUnderstandingAllowed !== 'boolean' ||
            typeof role.toolCodeAllowed !== 'boolean' ||
            typeof role.remotionDraftAllowed !== 'boolean'
          ) {
            return []
          }

          return [{
            modelRoleId,
            providerBoundary,
            canonicalProviderModel,
            requestedUses: uniqueMockSkillTraceIdentifiers(role.requestedUses),
            intentIds: uniqueMockSkillTraceIdentifiers(role.intentIds),
            reasoningRouteRole,
            reasoningRoutePriority,
            fallbackOnly: role.fallbackOnly,
            userReasoningAllowed: role.userReasoningAllowed,
            editPlanningAllowed: role.editPlanningAllowed,
            creativeStrategyAllowed: role.creativeStrategyAllowed,
            editQaReasoningAllowed: role.editQaReasoningAllowed,
            visualUnderstandingAllowed: role.visualUnderstandingAllowed,
            toolCodeAllowed: role.toolCodeAllowed,
            remotionDraftAllowed: role.remotionDraftAllowed,
          }]
        }).slice(0, 8)
      : [],
    errors: uniqueMockSkillTraceStrings(trace.errors).slice(0, 8),
    mockOnly: true,
  }
}

function mockProfessionalSkillModelRoleTraceIsPackageReady(
  trace: ReturnType<typeof createMockProfessionalSkillModelRoleTrace>,
): trace is NonNullable<ReturnType<typeof createMockProfessionalSkillModelRoleTrace>> {
  if (
    !trace ||
    trace.ok !== true ||
    trace.blocked !== false ||
    trace.mockOnly !== true ||
    trace.errors.length > 0
  ) {
    return false
  }

  const kimiPrimaryRole = trace.roles.find((role) => role.modelRoleId === 'kimi_k3_main_edit_agent')
  if (
    !kimiPrimaryRole ||
    kimiPrimaryRole.providerBoundary !== 'kimi_k3_provider_boundary' ||
    kimiPrimaryRole.canonicalProviderModel !== 'kimi-k3' ||
    !kimiPrimaryRole.requestedUses.includes('edit_planning') ||
    kimiPrimaryRole.reasoningRouteRole !== 'primary' ||
    kimiPrimaryRole.reasoningRoutePriority !== 1 ||
    kimiPrimaryRole.fallbackOnly !== false ||
    kimiPrimaryRole.userReasoningAllowed !== true ||
    kimiPrimaryRole.editPlanningAllowed !== true ||
    kimiPrimaryRole.creativeStrategyAllowed !== true ||
    kimiPrimaryRole.editQaReasoningAllowed !== true ||
    kimiPrimaryRole.visualUnderstandingAllowed !== false ||
    kimiPrimaryRole.toolCodeAllowed !== true ||
    kimiPrimaryRole.remotionDraftAllowed !== true
  ) {
    return false
  }

  const terraFallbackRole = trace.roles.find(
    (role) => role.modelRoleId === 'gpt_5_6_terra_fallback_edit_agent',
  )
  if (
    !terraFallbackRole ||
    terraFallbackRole.providerBoundary !== 'gpt_5_6_terra_provider_boundary' ||
    terraFallbackRole.canonicalProviderModel !== 'gpt-5.6-terra' ||
    !terraFallbackRole.requestedUses.includes('edit_planning') ||
    terraFallbackRole.reasoningRouteRole !== 'fallback' ||
    terraFallbackRole.reasoningRoutePriority !== 2 ||
    terraFallbackRole.fallbackOnly !== true ||
    terraFallbackRole.userReasoningAllowed !== true ||
    terraFallbackRole.editPlanningAllowed !== true ||
    terraFallbackRole.creativeStrategyAllowed !== true ||
    terraFallbackRole.editQaReasoningAllowed !== true ||
    terraFallbackRole.visualUnderstandingAllowed !== false ||
    terraFallbackRole.toolCodeAllowed !== true ||
    terraFallbackRole.remotionDraftAllowed !== true
  ) {
    return false
  }

  const visualRole = trace.roles.find((role) => role.modelRoleId === 'qwen2_5_vl_visual_understanding')
  if (
    !visualRole ||
    visualRole.providerBoundary !== 'qwen2_5_vl_7b_instruct_provider_boundary' ||
    visualRole.canonicalProviderModel !== 'qwen2.5-vl-7b-instruct' ||
    !visualRole.requestedUses.includes('visual_understanding') ||
    visualRole.reasoningRouteRole !== 'specialist' ||
    visualRole.reasoningRoutePriority !== null ||
    visualRole.fallbackOnly !== false ||
    visualRole.userReasoningAllowed !== false ||
    visualRole.editPlanningAllowed !== false ||
    visualRole.creativeStrategyAllowed !== false ||
    visualRole.editQaReasoningAllowed !== false ||
    visualRole.visualUnderstandingAllowed !== true ||
    visualRole.toolCodeAllowed !== false
  ) {
    return false
  }

  const deepSeekFallbackRole = trace.roles.find((role) => role.modelRoleId === 'deepseek_v4_tool_code_agent')
  return Boolean(
    deepSeekFallbackRole &&
    deepSeekFallbackRole.providerBoundary === 'deepseek_v4_pro_tool_code_boundary' &&
    deepSeekFallbackRole.canonicalProviderModel === 'deepseek-v4-pro' &&
    deepSeekFallbackRole.requestedUses.includes('edit_planning') &&
    deepSeekFallbackRole.reasoningRouteRole === 'fallback' &&
    deepSeekFallbackRole.reasoningRoutePriority === 3 &&
    deepSeekFallbackRole.fallbackOnly === true &&
    deepSeekFallbackRole.userReasoningAllowed === true &&
    deepSeekFallbackRole.editPlanningAllowed === true &&
    deepSeekFallbackRole.creativeStrategyAllowed === true &&
    deepSeekFallbackRole.editQaReasoningAllowed === true &&
    deepSeekFallbackRole.visualUnderstandingAllowed === false &&
    deepSeekFallbackRole.toolCodeAllowed === true &&
    deepSeekFallbackRole.remotionDraftAllowed === true
  )
}

function mockReasoningRouteRole(value: unknown): 'primary' | 'fallback' | 'specialist' | undefined {
  return value === 'primary' || value === 'fallback' || value === 'specialist'
    ? value
    : undefined
}

function mockReasoningRoutePriority(value: unknown): number | null | undefined {
  if (value === null) return null
  return typeof value === 'number' && Number.isInteger(value) && value > 0
    ? value
    : undefined
}

function createMockApprovedPackageBackendIntentTrace(value: unknown): Array<{
  intentId: string
  intentKind: string
  executionBoundary: string
  providerRoute?: string
  providerModel?: string
  modelRoleId?: string
  requestedModelUse?: string
  generationType?: string
  outputAssetType?: string
  hiddenAdapterToolCount: number
  requiredApprovalGates: string[]
}> {
  if (!isPlainObject(value)) return []
  const intentId = sanitizeMockSkillTraceIdentifier(value.intentId)
  const intentKind = sanitizeMockSkillTraceIdentifier(value.intentKind)
  const executionBoundary = sanitizeMockSkillTraceIdentifier(value.executionBoundary)
  if (!intentId || !intentKind || !executionBoundary) return []

  const optionalString = (field: unknown) => {
    const sanitized = sanitizeMockSkillTraceIdentifier(field)
    return sanitized || undefined
  }

  return [{
    intentId,
    intentKind,
    executionBoundary,
    providerRoute: optionalString(value.providerRoute),
    providerModel: optionalString(value.providerModel),
    modelRoleId: optionalString(value.modelRoleId),
    requestedModelUse: optionalString(value.requestedModelUse),
    generationType: optionalString(value.generationType),
    outputAssetType: optionalString(value.outputAssetType),
    hiddenAdapterToolCount: Array.isArray(value.hiddenAdapterToolNames)
      ? value.hiddenAdapterToolNames.filter((toolName) => typeof toolName === 'string' && toolName.trim()).length
      : 0,
    requiredApprovalGates: uniqueMockSkillTraceIdentifiers(value.requiredApprovalGates),
  }]
}

function sanitizeMockSkillTraceCopy(value: unknown): string {
  return hideInternalToolNamesInCopy(String(value ?? '')).trim()
}

function sanitizeMockSkillTraceIdentifier(value: unknown): string {
  return String(value ?? '')
    .replace(/https?:\/\/\S+/gi, '[link removed]')
    .replace(/\b(?:api[_-]?key|service[_-]?role|token|secret|password)\b/gi, '[redacted]')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function uniqueMockSkillTraceStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return Array.from(new Set(value.map(sanitizeMockSkillTraceCopy).filter(Boolean)))
}

function uniqueMockSkillTraceIdentifiers(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return Array.from(new Set(value.map(sanitizeMockSkillTraceIdentifier).filter(Boolean)))
}

function numberOrZero(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function handleMockApprovedEditExecutionBoundedAdapterExecutionGateRead(request: ApiRequestEnvelope): ApiResponseEnvelope {
  const packageRecordId = request.params?.packageRecordId ?? 'mock-approved-edit-execution-package'

  return createApiMockResponse({
    packageRecordId,
    workspaceId: request.context.workspaceId ?? 'mock-workspace',
    projectId: request.context.projectId ?? 'mock-project',
    approvedPlanSnapshotId: 'mock-approved-plan-snapshot',
    boundedAdapterExecutionGate: {
      id: `mock-bounded-adapter-execution-gate-${packageRecordId}`,
      workspaceId: request.context.workspaceId ?? 'mock-workspace',
      projectId: request.context.projectId ?? 'mock-project',
      status: 'blocked',
      requestedToolCount: 0,
      resolvedToolCount: 0,
      readyToolCount: 0,
      blockedToolCount: 0,
      unresolvedToolNames: [],
      readyToolIds: [],
      blockedToolIds: [],
      blockers: ['Mock API mode has no backend-owned package/model readiness evidence for bounded adapter execution.'],
      approvedSnapshotReady: false,
      creditGateReady: false,
      privateArtifactsReady: false,
      clientReadinessHintsTrusted: false,
      serverSourceTruthRequired: true,
      frontendExecutionAllowed: false,
      productReady: false,
      userFacingSummary: 'Advanced edit preparation is blocked until readiness evidence is complete.',
      userFacingReadinessSummary: 'Approved readiness evidence is required before wider testing.',
      internalExecutionSummary: 'Mock readback records the gate boundary only and does not execute adapters.',
      noRuntimeSideEffects: [
        'Mock bounded adapter execution gate readback does not execute adapters, import packages, process media, render, write storage, or bill users.',
        'Client-supplied package/model readiness hints are not source truth for this gate.',
      ],
    },
    warnings: [
      'Mock bounded adapter execution gate readback only.',
      'No advanced tool worker executed.',
    ],
  }, [
    'Mock bounded adapter execution gate readback only.',
    'No advanced tool worker executed.',
  ])
}

function handleMockApprovedEditExecutionBoundedAdapterSourceTruthReview(request: ApiRequestEnvelope): ApiResponseEnvelope {
  const input = request.body as {
    workspaceId?: string
    projectId?: string
    creditReservationId?: string
    packageReadinessEvidence?: Array<{ toolId?: string; status?: string; source?: string }>
    modelWeightApprovals?: Array<{ toolId?: string; approvalStatus?: string; source?: string }>
  } | undefined
  const packageRecordId = request.params?.packageRecordId ?? 'mock-approved-edit-execution-package'

  if (!input?.workspaceId || !input.projectId || !input.creditReservationId) {
    return createApiErrorResponse('invalid_bounded_adapter_source_truth_review_input', 'Workspace, project, and credit reservation evidence are required.', {
      statusCode: 400,
      warnings: ['No adapters, workers, providers, media processing, Supabase/GCS writes, or billing mutations were started.'],
      mockOnly: true,
    })
  }

  const unapprovedPackageSources = (input.packageReadinessEvidence ?? [])
    .filter((evidence) => evidence.status === 'passed' && !isBoundedAdapterPackageReadinessEvidenceSource(evidence.source))
    .map((evidence) => evidence.toolId ?? 'unknown_tool')
  const unapprovedModelSources = (input.modelWeightApprovals ?? [])
    .filter((approval) => approval.approvalStatus === 'approved' && !isBoundedAdapterModelWeightApprovalSource(approval.source))
    .map((approval) => approval.toolId ?? 'unknown_tool')

  if (unapprovedPackageSources.length > 0 || unapprovedModelSources.length > 0) {
    return createApiErrorResponse('unapproved_bounded_adapter_source_truth_evidence', 'Bounded adapter source-truth review evidence must come from approved backend or owner evidence sources.', {
      statusCode: 400,
      warnings: [
        'No adapters, workers, providers, media processing, Supabase/GCS writes, or billing mutations were started.',
        'Client/browser readiness hints are not accepted as source-truth evidence.',
      ],
      details: {
        unapprovedPackageSources,
        unapprovedModelSources,
        clientReadinessHintsTrusted: false,
        serverSourceTruthRequired: true,
      },
      mockOnly: true,
    })
  }

  const packageReadyToolIds = Array.from(new Set((input.packageReadinessEvidence ?? [])
    .filter((evidence) => evidence.toolId && evidence.status === 'passed')
    .map((evidence) => String(evidence.toolId))))
  const modelWeightApprovedToolIds = Array.from(new Set((input.modelWeightApprovals ?? [])
    .filter((approval) => approval.toolId && approval.approvalStatus === 'approved')
    .map((approval) => String(approval.toolId))))
  const status = packageReadyToolIds.length > 0 ? 'ready_for_bounded_execution' : 'blocked'

  const boundedAdapterExecutionGate = {
    id: `mock-bounded-adapter-execution-gate-${packageRecordId}`,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    status,
    requestedToolCount: packageReadyToolIds.length,
    resolvedToolCount: packageReadyToolIds.length,
    readyToolCount: packageReadyToolIds.length,
    blockedToolCount: status === 'blocked' ? 1 : 0,
    unresolvedToolNames: [],
    readyToolIds: packageReadyToolIds,
    blockedToolIds: [],
    blockers: status === 'blocked' ? ['Backend-owned package readiness evidence is required before bounded adapter execution.'] : [],
    approvedSnapshotReady: true,
    creditGateReady: true,
    privateArtifactsReady: true,
    clientReadinessHintsTrusted: false,
    serverSourceTruthRequired: true,
    frontendExecutionAllowed: false,
    productReady: false,
    userFacingSummary: status === 'ready_for_bounded_execution'
      ? 'Approved readiness evidence is complete for the next bounded edit activity gate.'
      : 'Some edit activities still need approved readiness evidence before bounded execution.',
    userFacingReadinessSummary: status === 'ready_for_bounded_execution'
      ? 'The requested preparation evidence is ready for the next approved execution gate.'
      : 'Some requested edit activities still need approved readiness evidence before wider testing.',
    internalExecutionSummary: 'Mock source-truth review records backend evidence contracts only.',
    noRuntimeSideEffects: [
      'Mock source-truth review does not import packages, execute tools, process media, render, write storage, or bill users.',
      'Client-supplied package/model readiness hints remain untrusted outside this backend evidence record.',
    ],
  }
  const existingPackage = mockApprovedEditExecutionPackagesById.get(packageRecordId)
  const approvedEditExecutionPackage = {
    ...(existingPackage ?? {
      packageRecordId,
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      approvedPlanSnapshotId: 'mock-approved-plan-snapshot',
      status: 'ready_for_mock_preview_review',
      agentCallReady: true,
      liveExecutionReady: false,
      privateArtifactRefCount: 1,
      requestedAdapterToolNames: packageReadyToolIds,
      userFacingSummary: 'Approved evidence has been reviewed for bounded edit activity execution.',
      noRuntimeSideEffects: boundedAdapterExecutionGate.noRuntimeSideEffects,
    }),
    packageRecordId,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    packageReadyToolIds,
    modelWeightApprovedToolIds,
    resolvedAdapterToolCount: packageReadyToolIds.length,
    boundedAdapterExecutionReady: status === 'ready_for_bounded_execution',
    boundedAdapterReadyToolCount: packageReadyToolIds.length,
    boundedAdapterBlockedToolCount: boundedAdapterExecutionGate.blockedToolCount,
    boundedAdapterBlockers: boundedAdapterExecutionGate.blockers,
    boundedAdapterExecutionGate,
    blockers: boundedAdapterExecutionGate.blockers,
  }
  mockApprovedEditExecutionPackagesById.set(packageRecordId, approvedEditExecutionPackage)

  return createApiMockResponse({
    sourceTruthReview: {
      id: `mock-source-truth-review-${packageRecordId}`,
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      status,
      requestedToolCount: packageReadyToolIds.length,
      resolvedToolCount: packageReadyToolIds.length,
      packageReadyToolIds,
      modelWeightApprovedToolIds,
      acceptedPackageEvidenceCount: packageReadyToolIds.length,
      acceptedModelWeightApprovalCount: modelWeightApprovedToolIds.length,
      rejectedEvidenceCount: 0,
      blockers: boundedAdapterExecutionGate.blockers,
      clientReadinessHintsTrusted: false,
      serverSourceTruthRequired: true,
      frontendExecutionAllowed: false,
      productReady: false,
      userFacingSummary: boundedAdapterExecutionGate.userFacingSummary,
      internalExecutionSummary: boundedAdapterExecutionGate.internalExecutionSummary,
      noRuntimeSideEffects: boundedAdapterExecutionGate.noRuntimeSideEffects,
      boundedAdapterExecutionGate,
    },
    approvedEditExecutionPackage,
    warnings: [
      'Mock bounded adapter source-truth review only.',
      'No advanced tool worker executed.',
    ],
  }, [
    'Mock bounded adapter source-truth review only.',
    'No advanced tool worker executed.',
  ])
}

function handleMockApprovedEditExecutionBoundedAdapterExecutionRun(request: ApiRequestEnvelope): ApiResponseEnvelope {
  const input = request.body as {
    workspaceId?: string
    projectId?: string
    creditReservationId?: string
    handoffOnly?: boolean
  } | undefined
  const packageRecordId = request.params?.packageRecordId ?? 'mock-approved-edit-execution-package'

  if (!input?.workspaceId || !input.projectId || !input.creditReservationId || input.handoffOnly !== true) {
    return createApiErrorResponse('invalid_bounded_adapter_execution_run_input', 'Workspace, project, credit reservation, and handoffOnly=true are required.', {
      statusCode: 400,
      warnings: ['No adapters, workers, providers, media processing, Supabase/GCS writes, or billing mutations were started.'],
      mockOnly: true,
    })
  }

  const existingPackage = mockApprovedEditExecutionPackagesById.get(packageRecordId)
  const packageReadyToolIds = Array.isArray(existingPackage?.packageReadyToolIds)
    ? existingPackage.packageReadyToolIds.map((toolId) => String(toolId)).filter(Boolean)
    : []
  const professionalSkillTrace = isPlainObject(existingPackage?.professionalSkillTrace)
    ? existingPackage.professionalSkillTrace
    : null
  const skillActivityGroups = Array.isArray(professionalSkillTrace?.activityGroups)
    ? professionalSkillTrace.activityGroups.filter(isPlainObject)
    : []
  const sourceTruthReviewReady = packageReadyToolIds.length > 0
  const activityResults = packageReadyToolIds.map((toolId, index) => {
    const group = skillActivityGroups[index % Math.max(skillActivityGroups.length, 1)]
    const groupSummary = isPlainObject(group) ? sanitizeMockSkillTraceCopy(group.userFacingSummary) : ''
    const groupLabel = isPlainObject(group) ? sanitizeMockSkillTraceCopy(group.label) : ''
    const userFacingActivity = groupSummary || (groupLabel ? `${groupLabel} is ready for backend execution.` : 'Prepare a bounded edit activity for backend execution.')

    return {
      activityResultId: `mock-bounded-adapter-activity-${packageRecordId}-${toolId}`,
      canonicalToolId: toolId,
      workerType: 'render_worker',
      userFacingActivity,
      status: 'completed_private_manifest_handoff',
      privateInputManifestKinds: ['structured_data', 'private_media'],
      privateOutputManifestKinds: ['visual_asset_manifest'],
      qaGates: ['private_artifact_manifest', 'no_public_artifact'],
      privateResultManifest: {
        artifactId: `mock-bounded-adapter-result-manifest-${packageRecordId}-${toolId}`,
        storageProvider: 'local_private',
        storageObjectPath: `edit-execution/${packageRecordId}/bounded-adapter-results/${toolId}.json`,
        mimeType: 'application/json',
        sourceOfTruth: true,
        sourceOfTruthScope: 'bounded_adapter_execution_private_result_manifest',
        privateArtifact: true,
        publicArtifact: false,
        signedUrl: null,
      },
      runnerBinding: {
        registeredToolRunnerRequired: true,
        actualToolPackageExecuted: false,
        summary: 'Private result manifest handoff is ready; registered backend runner execution remains separate.',
      },
    }
  })
  const blockers = sourceTruthReviewReady ? [] : ['Backend-owned source-truth package readiness review is required before bounded adapter handoff.']
  const boundedAdapterExecutionRun = {
    id: `mock-bounded-adapter-execution-run-${packageRecordId}`,
    packageRecordId,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    approvedPlanSnapshotId: 'mock-approved-plan-snapshot',
    creditReservationId: input.creditReservationId,
    status: sourceTruthReviewReady ? 'completed_private_manifest_handoff' : 'blocked',
    executionMode: 'backend_bounded_adapter_private_manifest_handoff',
    requestedToolCount: activityResults.length,
    readyToolCount: activityResults.length,
    blockedToolCount: 0,
    preparedActivityCount: activityResults.length,
    completedActivityCount: activityResults.length,
    actualToolPackageExecutionCount: 0,
    privateResultManifestCount: activityResults.length,
    sourceTruthReviewRequired: true,
    sourceTruthReviewReady,
    frontendExecutionAllowed: false,
    productReady: false,
    blockers,
    professionalSkillTrace,
    activityResults,
    privateArtifactManifest: {
      manifestVersion: 'bounded-adapter-execution-private-result-manifest-v1',
      packageRecordId,
      creditReservationId: input.creditReservationId,
      privateArtifact: true,
      publicArtifact: false,
      signedUrl: null,
      activityResultCount: activityResults.length,
    },
    nextRequiredGate: 'registered_tool_runner_execution_with_private_artifact_outputs',
    userFacingSummary: sourceTruthReviewReady
      ? 'Prepared approved edit activities for backend runner execution.'
      : 'Backend source-truth readiness review is still required before private edit activity handoff.',
    internalExecutionSummary: 'Mock bounded adapter handoff creates private manifest contracts only.',
    noRuntimeSideEffects: [
      'Mock bounded adapter handoff does not import packages, execute tools, process media, render, write storage, or bill users.',
      'Frontend execution remains disabled.',
    ],
  }
  mockBoundedAdapterExecutionRunsById.set(String(boundedAdapterExecutionRun.id), boundedAdapterExecutionRun)

  return createApiMockResponse({
    boundedAdapterExecutionRun,
    warnings: [
      'Mock bounded adapter execution handoff only.',
      'Actual package/library execution remains a separate backend runner gate.',
    ],
  }, [
    'Mock bounded adapter execution handoff only.',
    'Actual package/library execution remains a separate backend runner gate.',
  ])
}

function handleMockApprovedEditExecutionRegisteredAdapterRunnerProbe(request: ApiRequestEnvelope): ApiResponseEnvelope {
  const input = request.body as {
    workspaceId?: string
    projectId?: string
    importProbeOnly?: boolean
  } | undefined
  const boundedAdapterExecutionRunId = request.params?.boundedAdapterExecutionRunId ?? 'mock-bounded-adapter-execution-run'

  if (!input?.workspaceId || !input.projectId || input.importProbeOnly !== true) {
    return createApiErrorResponse('invalid_registered_adapter_runner_probe_input', 'Workspace, project, and importProbeOnly=true are required.', {
      statusCode: 400,
      warnings: ['No adapters, workers, providers, media processing, Supabase/GCS writes, or billing mutations were started.'],
      mockOnly: true,
    })
  }

  const boundedAdapterExecutionRun = mockBoundedAdapterExecutionRunsById.get(boundedAdapterExecutionRunId)
  const boundedActivityResults = Array.isArray(boundedAdapterExecutionRun?.activityResults)
    ? boundedAdapterExecutionRun.activityResults.filter(isPlainObject)
    : []
  const professionalSkillTrace = isPlainObject(boundedAdapterExecutionRun?.professionalSkillTrace)
    ? boundedAdapterExecutionRun.professionalSkillTrace
    : null
  const packageRecordId = typeof boundedAdapterExecutionRun?.packageRecordId === 'string'
    ? boundedAdapterExecutionRun.packageRecordId
    : 'mock-approved-edit-execution-package'
  const approvedPlanSnapshotId = typeof boundedAdapterExecutionRun?.approvedPlanSnapshotId === 'string'
    ? boundedAdapterExecutionRun.approvedPlanSnapshotId
    : 'mock-approved-plan-snapshot'
  const creditReservationId = typeof boundedAdapterExecutionRun?.creditReservationId === 'string'
    ? boundedAdapterExecutionRun.creditReservationId
    : 'mock-credit-reservation'
  const results = boundedActivityResults.map((activity) => {
    const toolId = String(activity.canonicalToolId ?? '')
    const packageName = toolId === 'three_js' ? 'three' : toolId

    return {
      activityResultId: String(activity.activityResultId ?? `mock-bounded-adapter-activity-${toolId}`),
      canonicalToolId: toolId,
      runtime: 'node',
      packageName,
      importName: packageName,
      importProbeOnly: true,
      runtimeReadinessScope: 'configured_backend_runtime_import_probe',
      declaredWorkerImageRoles: ['render_worker', 'tool_readiness_worker'],
      declaredRequirementsFiles: ['package.json', 'package-lock.json'],
      status: 'completed_import_probe',
      packageResolved: true,
      packageImported: true,
      actualToolPackageExecuted: false,
      summary: `${packageName} resolved in the backend Node runtime; no edit operation or media transform ran.`,
    }
  })
  const blockers = results.length ? [] : ['Bounded adapter handoff results are required before runner import probe.']
  const registeredRunnerRun = {
    id: `mock-registered-runner-run-${boundedAdapterExecutionRunId}`,
    boundedAdapterExecutionRunId,
    packageRecordId,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    approvedPlanSnapshotId,
    creditReservationId,
    status: results.length ? 'completed_import_probe' : 'blocked',
    probeOnly: true,
    requestedActivityCount: results.length,
    completedImportProbeCount: results.length,
    blockedRunnerCount: blockers.length,
    actualToolPackageExecutionCount: 0,
    mediaProcessingExecuted: false,
    frontendExecutionAllowed: false,
    productReady: false,
    professionalSkillTrace,
    results,
    blockers,
    nextRequiredGate: 'tool_specific_private_media_execution_runner',
    userFacingSummary: results.length
      ? 'Verified backend edit activity runners for the next private execution gate.'
      : 'Bounded edit activity handoff is required before runner import checks.',
    internalExecutionSummary: 'Mock registered runner probe checks package availability only.',
    noRuntimeSideEffects: [
      'Mock registered runner probe does not process media, render, call providers, write storage, create public artifacts, or bill users.',
      'Frontend execution remains disabled.',
    ],
  }
  mockRegisteredAdapterRunnerRunsById.set(String(registeredRunnerRun.id), registeredRunnerRun)

  return createApiMockResponse({
    registeredRunnerRun,
    warnings: [
      'Mock registered adapter runner probe only.',
      'No media was processed.',
    ],
  }, [
    'Mock registered adapter runner probe only.',
    'No media was processed.',
  ])
}

function handleMockApprovedEditExecutionRegisteredAdapterPrivateMediaRunner(request: ApiRequestEnvelope): ApiResponseEnvelope {
  const input = request.body as {
    workspaceId?: string
    projectId?: string
    creditReservationId?: string
    privateMediaExecutionOnly?: boolean
  } | undefined
  const registeredRunnerRunId = request.params?.registeredRunnerRunId ?? 'mock-registered-runner-run'

  if (!input?.workspaceId || !input.projectId || !input.creditReservationId || input.privateMediaExecutionOnly !== true) {
    return createApiErrorResponse('invalid_registered_adapter_private_media_runner_input', 'Workspace, project, credit reservation, and privateMediaExecutionOnly=true are required.', {
      statusCode: 400,
      warnings: ['No adapters, workers, providers, media processing, Supabase/GCS writes, or billing mutations were started.'],
      mockOnly: true,
    })
  }

  const registeredRunnerRun = mockRegisteredAdapterRunnerRunsById.get(registeredRunnerRunId)
  const runnerResults = Array.isArray(registeredRunnerRun?.results)
    ? registeredRunnerRun.results.filter(isPlainObject)
    : []
  const professionalSkillTrace = isPlainObject(registeredRunnerRun?.professionalSkillTrace)
    ? registeredRunnerRun.professionalSkillTrace
    : null
  const boundedAdapterExecutionRunId = typeof registeredRunnerRun?.boundedAdapterExecutionRunId === 'string'
    ? registeredRunnerRun.boundedAdapterExecutionRunId
    : 'mock-bounded-adapter-execution-run'
  const packageRecordId = typeof registeredRunnerRun?.packageRecordId === 'string'
    ? registeredRunnerRun.packageRecordId
    : 'mock-approved-edit-execution-package'
  const approvedPlanSnapshotId = typeof registeredRunnerRun?.approvedPlanSnapshotId === 'string'
    ? registeredRunnerRun.approvedPlanSnapshotId
    : 'mock-approved-plan-snapshot'
  const activities = runnerResults.map((result) => {
    const toolId = String(result.canonicalToolId ?? '')

    return {
      activityExecutionId: `mock-private-runner-activity-${registeredRunnerRunId}-${toolId}`,
      sourceActivityResultId: String(result.activityResultId ?? `mock-bounded-adapter-activity-${toolId}`),
      canonicalToolId: toolId,
      userFacingActivity: 'Prepare a verified edit activity for private QA',
      status: 'private_runner_manifest_ready',
      registeredImportProbeReady: true,
      privateInputManifestKinds: ['structured_data', 'private_media'],
      privateOutputManifestKinds: ['visual_asset_manifest'],
      qaGates: ['private_artifact_manifest', 'no_public_artifact'],
      privateRunnerResultManifest: {
        artifactId: `mock-registered-adapter-private-runner-manifest-${registeredRunnerRunId}-${toolId}`,
        storageProvider: 'local_private',
        storageObjectPath: `edit-execution/${packageRecordId}/registered-adapter-private-runner-results/${toolId}.json`,
        mimeType: 'application/json',
        sourceOfTruth: true,
        sourceOfTruthScope: 'registered_adapter_private_media_runner_manifest',
        privateArtifact: true,
        publicArtifact: false,
        signedUrl: null,
      },
      runnerBoundary: {
        backendRegisteredRunnerRequired: true,
        importProbeCompleted: true,
        packageAvailabilityProven: true,
        mediaProcessingExecuted: false,
        productRuntimeExecuted: false,
        summary: 'Mock private runner manifest is ready for adapter-specific QA; media-transform execution remains a later worker gate.',
      },
    }
  })
  const blockers = activities.length ? [] : ['Registered adapter runner import probe is required before private runner manifest handoff.']
  const privateMediaRunnerRun = {
    id: `mock-private-media-runner-run-${registeredRunnerRunId}`,
    registeredRunnerRunId,
    boundedAdapterExecutionRunId,
    packageRecordId,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    approvedPlanSnapshotId,
    creditReservationId: input.creditReservationId,
    status: activities.length ? 'private_runner_manifest_ready' : 'blocked',
    executionMode: 'backend_registered_runner_private_manifest_execution',
    privateMediaExecutionOnly: true,
    requestedActivityCount: activities.length,
    registeredRunnerReadyCount: activities.length,
    blockedRunnerCount: blockers.length,
    preparedPrivateRunnerManifestCount: activities.length,
    mediaProcessingExecuted: false,
    productRuntimeExecuted: false,
    frontendExecutionAllowed: false,
    productReady: false,
    blockers,
    professionalSkillTrace,
    activities,
    privateArtifactManifest: {
      manifestVersion: 'registered-adapter-private-media-runner-manifest-v1',
      registeredRunnerRunId,
      privateArtifact: true,
      publicArtifact: false,
      signedUrl: null,
      activityResultCount: activities.length,
    },
    nextRequiredGate: 'private_adapter_result_qa_review_before_final_render_integration',
    userFacingSummary: activities.length
      ? 'Prepared verified edit activities for private adapter QA.'
      : 'Registered runner import checks are required before private adapter QA.',
    internalExecutionSummary: 'Mock registered adapter private runner records private manifest lineage only.',
    noRuntimeSideEffects: [
      'Mock registered adapter private runner does not process media, render, call providers, write storage, create public artifacts, or bill users.',
      'Frontend execution remains disabled.',
    ],
  }
  mockRegisteredAdapterPrivateRunnerRunsById.set(String(privateMediaRunnerRun.id), privateMediaRunnerRun)

  return createApiMockResponse({
    privateMediaRunnerRun,
    warnings: [
      'Mock registered adapter private runner execution only.',
      'No media was processed.',
    ],
  }, [
    'Mock registered adapter private runner execution only.',
    'No media was processed.',
  ])
}

function handleMockApprovedEditExecutionRegisteredAdapterPrivateMediaRunnerQaReview(request: ApiRequestEnvelope): ApiResponseEnvelope {
  const input = request.body as {
    workspaceId?: string
    projectId?: string
    creditReservationId?: string
    qaReviewOnly?: boolean
  } | undefined
  const privateMediaRunnerRunId = request.params?.privateMediaRunnerRunId ?? 'mock-private-media-runner-run'

  if (!input?.workspaceId || !input.projectId || !input.creditReservationId || input.qaReviewOnly !== true) {
    return createApiErrorResponse('invalid_registered_adapter_private_media_runner_qa_input', 'Workspace, project, credit reservation, and qaReviewOnly=true are required.', {
      statusCode: 400,
      warnings: ['No adapters, workers, providers, media processing, Supabase/GCS writes, or billing mutations were started.'],
      mockOnly: true,
    })
  }

  const createdAt = new Date().toISOString()
  const privateMediaRunnerRun = mockRegisteredAdapterPrivateRunnerRunsById.get(privateMediaRunnerRunId)
  const activities = Array.isArray(privateMediaRunnerRun?.activities)
    ? privateMediaRunnerRun.activities.filter(isPlainObject)
    : []
  const professionalSkillTrace = isPlainObject(privateMediaRunnerRun?.professionalSkillTrace)
    ? privateMediaRunnerRun.professionalSkillTrace
    : null
  const registeredRunnerRunId = typeof privateMediaRunnerRun?.registeredRunnerRunId === 'string'
    ? privateMediaRunnerRun.registeredRunnerRunId
    : 'mock-registered-runner-run'
  const boundedAdapterExecutionRunId = typeof privateMediaRunnerRun?.boundedAdapterExecutionRunId === 'string'
    ? privateMediaRunnerRun.boundedAdapterExecutionRunId
    : 'mock-bounded-adapter-execution-run'
  const packageRecordId = typeof privateMediaRunnerRun?.packageRecordId === 'string'
    ? privateMediaRunnerRun.packageRecordId
    : 'mock-approved-edit-execution-package'
  const approvedPlanSnapshotId = typeof privateMediaRunnerRun?.approvedPlanSnapshotId === 'string'
    ? privateMediaRunnerRun.approvedPlanSnapshotId
    : 'mock-approved-plan-snapshot'
  const artifacts = activities.map((activity, index) => {
    const toolId = String(activity.canonicalToolId ?? '')
    const activityExecutionId = String(activity.activityExecutionId ?? `mock-private-runner-activity-${privateMediaRunnerRunId}-${toolId}`)

    return {
      artifactId: `mock-private-runner-qa-${privateMediaRunnerRunId}-${toolId}-${String(index + 1).padStart(2, '0')}`,
      activityExecutionId,
      canonicalToolId: toolId,
      storageProvider: 'local_private',
      storageObjectPath: `edit-execution/${input.workspaceId}/${input.projectId}/${privateMediaRunnerRunId}/registered-adapter-private-runner-qa/${toolId}.json`,
      localFilePath: `/tmp/reeditpro/mock/${privateMediaRunnerRunId}/${toolId}.json`,
      mimeType: 'application/json',
      privateArtifact: true,
      publicArtifact: false,
      signedUrl: null,
      sourceOfTruth: true,
      sourceOfTruthScope: 'registered_adapter_private_media_runner_qa_artifact',
      sha256: String(index + 1).repeat(64).slice(0, 64),
      byteSize: 1024 + index,
      qaStatus: 'passed_private_runner_manifest_qa',
      finalRenderIntegrationEligible: false,
      createdAt,
    }
  })
  const blockers = artifacts.length ? [] : ['Private runner manifest activities are required before QA review.']
  const privateMediaRunnerQaReview = {
    id: `mock-private-media-runner-qa-review-${privateMediaRunnerRunId}`,
    privateMediaRunnerRunId,
    registeredRunnerRunId,
    boundedAdapterExecutionRunId,
    packageRecordId,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    approvedPlanSnapshotId,
    creditReservationId: input.creditReservationId,
    status: artifacts.length ? 'private_adapter_result_qa_passed_waiting_final_render_integration' : 'blocked',
    qaReviewOnly: true,
    reviewedActivityCount: artifacts.length,
    passedActivityCount: artifacts.length,
    blockedActivityCount: blockers.length,
    artifactCount: artifacts.length,
    mediaProcessingExecuted: false,
    productRuntimeExecuted: false,
    frontendExecutionAllowed: false,
    productReady: false,
    professionalSkillTrace,
    artifacts,
    blockers,
    finalRenderIntegrationReadiness: {
      ready: false,
      reason: artifacts.length
        ? 'Private adapter QA artifacts are recorded, but final render integration still requires an adapter-specific worker artifact integration gate.'
        : 'Private adapter QA requires prepared private runner activities before render integration.',
      adapterQaArtifactCount: artifacts.length,
      nextRequiredGate: 'adapter_specific_worker_artifact_integration_with_private_render',
    },
    nextRequiredGate: 'adapter_specific_worker_artifact_integration_with_private_render',
    userFacingSummary: artifacts.length
      ? 'Private QA recorded verified edit activities for the next render-integration gate.'
      : 'Private runner activities are required before private QA.',
    internalExecutionSummary: 'Mock registered adapter private runner QA records private JSON evidence only.',
    noRuntimeSideEffects: [
      'Mock registered adapter private runner QA does not process media, render, call providers, write public artifacts, or bill users.',
      'Final render integration remains disabled until a later backend gate.',
    ],
    createdAt,
    mockOnly: true,
  }
  mockRegisteredAdapterPrivateRunnerQaReviewsById.set(String(privateMediaRunnerQaReview.id), privateMediaRunnerQaReview)

  return createApiMockResponse({
    privateMediaRunnerQaReview,
    warnings: [
      'Mock registered adapter private runner QA review only.',
      'No media was processed.',
    ],
  }, [
    'Mock registered adapter private runner QA review only.',
    'No media was processed.',
  ])
}

function handleMockApprovedEditExecutionAdapterWorkerArtifactIntegration(request: ApiRequestEnvelope): ApiResponseEnvelope {
  const input = request.body as {
    workspaceId?: string
    projectId?: string
    creditReservationId?: string
    integrationOnly?: boolean
  } | undefined
  const privateMediaRunnerQaReviewId = request.params?.privateMediaRunnerQaReviewId ?? 'mock-private-media-runner-qa-review'

  if (!input?.workspaceId || !input.projectId || !input.creditReservationId || input.integrationOnly !== true) {
    return createApiErrorResponse('invalid_adapter_worker_artifact_integration_input', 'Workspace, project, credit reservation, and integrationOnly=true are required.', {
      statusCode: 400,
      warnings: ['No adapters, workers, providers, media processing, Supabase/GCS writes, or billing mutations were started.'],
      mockOnly: true,
    })
  }

  const createdAt = new Date().toISOString()
  const privateMediaRunnerQaReview = mockRegisteredAdapterPrivateRunnerQaReviewsById.get(privateMediaRunnerQaReviewId)
  const qaArtifacts = Array.isArray(privateMediaRunnerQaReview?.artifacts)
    ? privateMediaRunnerQaReview.artifacts.filter(isPlainObject)
    : []
  if (!qaArtifacts.length) {
    return createApiErrorResponse('adapter_worker_artifact_integration_missing_qa_evidence', 'Private runner QA artifacts are required before adapter artifact integration.', {
      statusCode: 409,
      warnings: ['No adapters, workers, providers, media processing, Supabase/GCS writes, public artifacts, or billing mutations were started.'],
      mockOnly: true,
    })
  }

  const professionalSkillTrace = isPlainObject(privateMediaRunnerQaReview?.professionalSkillTrace)
    ? privateMediaRunnerQaReview.professionalSkillTrace
    : null
  const privateMediaRunnerRunId = typeof privateMediaRunnerQaReview?.privateMediaRunnerRunId === 'string'
    ? privateMediaRunnerQaReview.privateMediaRunnerRunId
    : 'mock-private-media-runner-run'
  const registeredRunnerRunId = typeof privateMediaRunnerQaReview?.registeredRunnerRunId === 'string'
    ? privateMediaRunnerQaReview.registeredRunnerRunId
    : 'mock-registered-runner-run'
  const boundedAdapterExecutionRunId = typeof privateMediaRunnerQaReview?.boundedAdapterExecutionRunId === 'string'
    ? privateMediaRunnerQaReview.boundedAdapterExecutionRunId
    : 'mock-bounded-adapter-execution-run'
  const packageRecordId = typeof privateMediaRunnerQaReview?.packageRecordId === 'string'
    ? privateMediaRunnerQaReview.packageRecordId
    : 'mock-approved-edit-execution-package'
  const approvedPlanSnapshotId = typeof privateMediaRunnerQaReview?.approvedPlanSnapshotId === 'string'
    ? privateMediaRunnerQaReview.approvedPlanSnapshotId
    : 'mock-approved-plan-snapshot'
  const integratedArtifacts = qaArtifacts.map((artifact, index) => {
    const toolId = String(artifact.canonicalToolId ?? '')

    return {
      artifactId: `mock-adapter-render-integration-${privateMediaRunnerQaReviewId}-${toolId}-${String(index + 1).padStart(2, '0')}`,
      sourceQaArtifactId: String(artifact.artifactId ?? `mock-private-runner-qa-${privateMediaRunnerQaReviewId}-${toolId}`),
      activityExecutionId: String(artifact.activityExecutionId ?? `mock-private-runner-activity-${privateMediaRunnerQaReviewId}-${toolId}`),
      canonicalToolId: toolId,
      storageProvider: 'local_private',
      storageObjectPath: typeof artifact.storageObjectPath === 'string'
        ? artifact.storageObjectPath
        : `edit-execution/${input.workspaceId}/${input.projectId}/${privateMediaRunnerQaReviewId}/registered-adapter-private-runner-qa/${toolId}.json`,
      localFilePath: typeof artifact.localFilePath === 'string'
        ? artifact.localFilePath
        : `/tmp/reeditpro/mock/${privateMediaRunnerQaReviewId}/${toolId}.json`,
      mimeType: 'application/json',
      privateArtifact: true,
      publicArtifact: false,
      signedUrl: null,
      sourceOfTruth: true,
      sourceOfTruthScope: 'registered_adapter_private_media_runner_qa_artifact',
      sha256: String(index + 3).repeat(64).slice(0, 64),
      byteSize: 2048 + index,
      qaStatus: 'passed_private_runner_manifest_qa',
      renderIntegrationStatus: 'attached_to_private_render_manifest',
      finalRenderIntegrationEligible: true,
      mediaTransformOutputEligible: false,
    }
  })
  const integrationId = `mock-adapter-worker-artifact-integration-${privateMediaRunnerQaReviewId}`
  const adapterWorkerArtifactIntegration = {
    id: integrationId,
    privateMediaRunnerQaReviewId,
    privateMediaRunnerRunId,
    registeredRunnerRunId,
    boundedAdapterExecutionRunId,
    packageRecordId,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    approvedPlanSnapshotId,
    creditReservationId: input.creditReservationId,
    status: 'adapter_worker_artifact_integration_passed_ready_for_render_preview',
    integrationOnly: true,
    reviewedArtifactCount: integratedArtifacts.length,
    integratedArtifactCount: integratedArtifacts.length,
    blockedArtifactCount: 0,
    mediaProcessingExecuted: false,
    mediaTransformOutputCount: 0,
    productRuntimeExecuted: false,
    frontendExecutionAllowed: false,
    productReady: false,
    privateArtifact: true,
    publicArtifact: false,
    signedUrl: null,
    renderPreviewIntegrationReady: true,
    finalRenderDecisionManifestEligible: true,
    mediaTransformOutputEligible: false,
    professionalSkillTrace,
    artifacts: integratedArtifacts,
    integrationManifestArtifact: {
      artifactId: `mock-adapter-worker-artifact-integration-manifest-${privateMediaRunnerQaReviewId}`,
      storageProvider: 'local_private',
      storageObjectPath: `edit-execution/${input.workspaceId}/${input.projectId}/${privateMediaRunnerQaReviewId}/adapter-worker-artifact-integration/manifest.json`,
      localFilePath: `/tmp/reeditpro/mock/${privateMediaRunnerQaReviewId}/adapter-worker-artifact-integration/manifest.json`,
      mimeType: 'application/json',
      privateArtifact: true,
      publicArtifact: false,
      signedUrl: null,
      sourceOfTruth: true,
      sourceOfTruthScope: 'adapter_worker_artifact_render_integration_manifest',
      sha256: 'e'.repeat(64),
      byteSize: 4096,
      integratedArtifactCount: integratedArtifacts.length,
      previewAssemblyEligible: true,
      finalRenderDecisionManifestEligible: true,
    },
    blockers: [],
    nextRequiredGate: 'render_preview_assembly_with_private_adapter_integration',
    userFacingSummary: 'Verified private edit activities for private preview assembly.',
    internalExecutionSummary: 'Mock adapter worker artifact integration records private render manifest evidence only.',
    noRuntimeSideEffects: [
      'Mock adapter worker artifact integration does not execute adapter media transforms, render, call providers, write public artifacts, or bill users.',
      'Public delivery, external beta, and production require approved release evidence gates.',
    ],
    createdAt,
    mockOnly: true,
  }
  mockAdapterWorkerArtifactIntegrationsById.set(String(adapterWorkerArtifactIntegration.id), adapterWorkerArtifactIntegration)

  return createApiMockResponse({
    adapterWorkerArtifactIntegration,
    warnings: [
      'Mock adapter worker artifact integration only.',
      'No media was processed.',
    ],
  }, [
    'Mock adapter worker artifact integration only.',
    'No media was processed.',
  ])
}

function handleMockApprovedEditExecutionJobBatchPlanCreate(request: ApiRequestEnvelope): ApiResponseEnvelope {
  const input = request.body as {
    workspaceId?: string
    projectId?: string
    creditReservationId?: string
    packageRecordId?: string
    approvedPlanSnapshotId?: string
    workItems?: Array<{
      id?: string
      workItemType?: string
      status?: string
      idempotencyKey?: string
      dependencies?: Array<{ dependsOnWorkItemId?: string }>
      expectedOutputs?: Array<{ id?: string }>
      qaChecks?: string[]
    }>
  } | undefined
  const packageRecordId = input?.packageRecordId ?? request.params?.packageRecordId

  if (!input?.workspaceId || !input.projectId || !input.creditReservationId || !packageRecordId || !input.approvedPlanSnapshotId) {
    return createApiErrorResponse('invalid_edit_execution_job_batch_plan_input', 'Approved package, snapshot, project, and credit reservation evidence are required.', {
      statusCode: 400,
      warnings: ['No worker leases, worker handlers, providers, render jobs, media processing, Supabase/GCS writes, or billing mutations were started.'],
      mockOnly: true,
    })
  }

  const plannedJobs = (input.workItems ?? []).map((workItem, index) => ({
    id: `mock-planned-job-${workItem.id ?? index + 1}`,
    packageRecordId,
    workItemId: workItem.id ?? `work-item-${index + 1}`,
    jobType: workItem.workItemType ?? 'custom',
    workerType: 'mock_worker',
    status: workItem.status === 'ready' ? 'ready_to_queue' : 'waiting_dependency',
    approvedPlanSnapshotId: input.approvedPlanSnapshotId,
    creditReservationId: input.creditReservationId,
    idempotencyKey: workItem.idempotencyKey ?? `mock-idempotency-${index + 1}`,
    dependencyWorkItemIds: (workItem.dependencies ?? [])
      .map((dependency) => dependency.dependsOnWorkItemId)
      .filter(Boolean),
    expectedOutputIds: (workItem.expectedOutputs ?? [])
      .map((output) => output.id)
      .filter(Boolean),
    qaChecks: workItem.qaChecks ?? [],
  }))

  return createApiMockResponse({
    jobBatchPlan: {
      id: `mock-edit-execution-job-batch-plan-${packageRecordId}`,
      packageRecordId,
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      approvedPlanSnapshotId: input.approvedPlanSnapshotId,
      creditReservationId: input.creditReservationId,
      status: 'ready_for_mock_queue_review',
      dryRunOnly: true,
      plannedJobs,
      plannedJobCount: plannedJobs.length,
      readyToQueueCount: plannedJobs.filter((job) => job.status === 'ready_to_queue').length,
      waitingDependencyCount: plannedJobs.filter((job) => job.status === 'waiting_dependency').length,
      blockedJobCount: 0,
      userFacingSummary: 'The approved edit is organized into backend work batches for internal review. Nothing has started yet.',
      noRuntimeSideEffects: [
        'Mock job batch planning did not claim workers, run tools, process media, render, write Supabase/GCS, or bill users.',
      ],
    },
    warnings: [
      'Mock approved edit execution job batch plan only.',
      'Live queue creation and worker dispatch remain disabled until reviewed runtime gates pass.',
    ],
  }, [
    'Mock approved edit execution job batch plan only.',
    'Live queue creation and worker dispatch remain disabled until reviewed runtime gates pass.',
  ])
}

function handleMockApprovedEditExecutionQueueCreate(request: ApiRequestEnvelope): ApiResponseEnvelope {
  const input = request.body as {
    workspaceId?: string
    projectId?: string
    creditReservationId?: string
    jobBatchPlanId?: string
    packageRecordId?: string
    approvedPlanSnapshotId?: string
    mockQueueOnly?: boolean
    plannedJobs?: Array<{
      id?: string
      workItemId?: string
      jobType?: string
      workerType?: string
      status?: string
      idempotencyKey?: string
      dependencyWorkItemIds?: string[]
      expectedOutputIds?: string[]
      qaChecks?: string[]
    }>
  } | undefined
  const jobBatchPlanId = input?.jobBatchPlanId ?? request.params?.jobBatchPlanId

  if (!input?.workspaceId || !input.projectId || !input.creditReservationId || !jobBatchPlanId || !input.packageRecordId || !input.approvedPlanSnapshotId) {
    return createApiErrorResponse('invalid_edit_execution_mock_queue_input', 'Job batch plan, package, approved snapshot, and credit reservation evidence are required.', {
      statusCode: 400,
      warnings: ['No worker leases, worker handlers, providers, render jobs, media processing, Supabase/GCS writes, or billing mutations were started.'],
      mockOnly: true,
    })
  }

  const queuedJobs = (input.plannedJobs ?? [])
    .filter((job) => job.status === 'ready_to_queue')
    .map((job, index) => ({
      id: `mock-queued-edit-job-${job.workItemId ?? index + 1}`,
      sourcePlannedJobId: job.id ?? `planned-job-${index + 1}`,
      jobBatchPlanId,
      packageRecordId: input.packageRecordId,
      workItemId: job.workItemId ?? `work-item-${index + 1}`,
      jobType: job.jobType ?? 'custom',
      workerType: job.workerType ?? 'mock_worker',
      status: 'queued',
      approvedPlanSnapshotId: input.approvedPlanSnapshotId,
      creditReservationId: input.creditReservationId,
      idempotencyKey: job.idempotencyKey ?? `mock-queue-idempotency-${index + 1}`,
      dependencyWorkItemIds: job.dependencyWorkItemIds ?? [],
      expectedOutputIds: job.expectedOutputIds ?? [],
      qaChecks: job.qaChecks ?? [],
    }))

  return createApiMockResponse({
    mockQueue: {
      id: `mock-edit-execution-queue-${jobBatchPlanId}`,
      jobBatchPlanId,
      packageRecordId: input.packageRecordId,
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      approvedPlanSnapshotId: input.approvedPlanSnapshotId,
      creditReservationId: input.creditReservationId,
      status: 'queued_for_mock_worker_review',
      mockQueueOnly: true,
      queuedJobs,
      queuedJobCount: queuedJobs.length,
      workersStarted: 0,
      workerClaimsCreated: 0,
      userFacingSummary: 'The first ready edit tasks are queued for internal backend review. Editing work has not started yet.',
      noRuntimeSideEffects: [
        'Mock queue creation did not claim workers, run tools, process media, render, write Supabase/GCS, or bill users.',
      ],
    },
    warnings: [
      'Mock approved edit execution queue only.',
      'Live worker dispatch remains disabled until reviewed runtime gates pass.',
    ],
  }, [
    'Mock approved edit execution queue only.',
    'Live worker dispatch remains disabled until reviewed runtime gates pass.',
  ])
}

function handleMockApprovedEditExecutionDispatchReadiness(request: ApiRequestEnvelope): ApiResponseEnvelope {
  const input = request.body as {
    workspaceId?: string
    projectId?: string
    creditReservationId?: string
    mockQueueId?: string
    jobBatchPlanId?: string
    packageRecordId?: string
    approvedPlanSnapshotId?: string
    queuedJobs?: Array<{
      id?: string
      workItemId?: string
      jobType?: string
      runtimeJobType?: string
      workerType?: string
      approvedPlanSnapshotId?: string
      creditReservationId?: string
      idempotencyKey?: string
    }>
  } | undefined
  const mockQueueId = input?.mockQueueId ?? request.params?.mockQueueId

  if (!input?.workspaceId || !input.projectId || !input.creditReservationId || !mockQueueId || !input.jobBatchPlanId || !input.packageRecordId || !input.approvedPlanSnapshotId) {
    return createApiErrorResponse('invalid_edit_execution_dispatch_readiness_input', 'Mock queue, package, approved snapshot, and credit reservation evidence are required.', {
      statusCode: 400,
      warnings: ['No worker leases, worker handlers, providers, render jobs, media processing, Supabase/GCS writes, or billing mutations were started.'],
      mockOnly: true,
    })
  }

  const readiness = (input.queuedJobs ?? []).map((job, index) => {
    const missingGates = [
      job.approvedPlanSnapshotId || input.approvedPlanSnapshotId ? undefined : 'approved_snapshot',
      job.creditReservationId || input.creditReservationId ? undefined : 'credit_reservation',
      job.idempotencyKey ? undefined : 'worker_payload_shape',
    ].filter(Boolean) as string[]

    return {
      queuedJobId: job.id ?? `mock-queued-job-${index + 1}`,
      workItemId: job.workItemId ?? `work-item-${index + 1}`,
      jobType: job.jobType ?? 'custom',
      runtimeJobType: job.runtimeJobType ?? job.jobType ?? 'custom',
      workerType: job.workerType ?? 'mock_worker',
      idempotencyKey: job.idempotencyKey ?? `mock-worker-claim-idempotency-${index + 1}`,
      status: missingGates.length ? 'blocked_by_gate' : 'ready_for_worker_claim',
      requiredGateCount: 4,
      passedRequiredGateCount: 4 - missingGates.length,
      failedRequiredGates: missingGates,
    }
  })
  const readyForClaimCount = readiness.filter((item) => item.status === 'ready_for_worker_claim').length
  const blockedByGateCount = readiness.length - readyForClaimCount

  return createApiMockResponse({
    dispatchReadiness: {
      id: `mock-dispatch-readiness-${mockQueueId}`,
      mockQueueId,
      jobBatchPlanId: input.jobBatchPlanId,
      packageRecordId: input.packageRecordId,
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      approvedPlanSnapshotId: input.approvedPlanSnapshotId,
      creditReservationId: input.creditReservationId,
      status: blockedByGateCount ? 'blocked_by_worker_gates' : 'ready_for_worker_claim_review',
      dryRunOnly: true,
      queuedJobCount: readiness.length,
      readyForClaimCount,
      blockedByGateCount,
      workersStarted: 0,
      workerClaimsCreated: 0,
      readiness,
      userFacingSummary: 'The queued edit tasks were checked for worker readiness. Editing work has not started yet.',
      noRuntimeSideEffects: [
        'Mock dispatch readiness did not claim workers, run tools, process media, render, write Supabase/GCS, or bill users.',
      ],
    },
    warnings: [
      'Mock approved edit execution dispatch readiness only.',
      'Live worker claims remain disabled until reviewed runtime gates pass.',
    ],
  }, [
    'Mock approved edit execution dispatch readiness only.',
    'Live worker claims remain disabled until reviewed runtime gates pass.',
  ])
}

function handleMockApprovedEditExecutionWorkerClaims(request: ApiRequestEnvelope): ApiResponseEnvelope {
  const input = request.body as {
    workspaceId?: string
    projectId?: string
    creditReservationId?: string
    dispatchReadinessId?: string
    mockQueueId?: string
    jobBatchPlanId?: string
    packageRecordId?: string
    approvedPlanSnapshotId?: string
    workerInstanceId?: string
    mockClaimsOnly?: boolean
    readiness?: Array<{
      queuedJobId?: string
      workItemId?: string
      jobType?: string
      runtimeJobType?: string
      workerType?: string
      idempotencyKey?: string
      status?: string
    }>
  } | undefined
  const dispatchReadinessId = input?.dispatchReadinessId ?? request.params?.dispatchReadinessId

  if (!input?.workspaceId || !input.projectId || !input.creditReservationId || !dispatchReadinessId || !input.mockQueueId || !input.jobBatchPlanId || !input.packageRecordId || !input.approvedPlanSnapshotId) {
    return createApiErrorResponse('invalid_edit_execution_worker_claim_input', 'Dispatch readiness, mock queue, package, approved snapshot, and credit reservation evidence are required.', {
      statusCode: 400,
      warnings: ['No worker handlers, providers, render jobs, media processing, Supabase/GCS writes, or billing mutations were started.'],
      mockOnly: true,
    })
  }

  const claimedAt = new Date().toISOString()
  const leaseExpiresAt = new Date(Date.parse(claimedAt) + 300_000).toISOString()
  const workerInstanceId = input.workerInstanceId ?? 'mock-edit-execution-worker'
  const workerClaims = (input.readiness ?? [])
    .filter((item) => item.status === 'ready_for_worker_claim')
    .map((item, index) => ({
      id: `mock-worker-claim-${item.queuedJobId ?? index + 1}`,
      dispatchReadinessId,
      mockQueueId: input.mockQueueId,
      queuedJobId: item.queuedJobId ?? `mock-queued-job-${index + 1}`,
      workItemId: item.workItemId ?? `work-item-${index + 1}`,
      jobType: item.jobType ?? 'custom',
      runtimeJobType: item.runtimeJobType ?? item.jobType ?? 'custom',
      workerType: item.workerType ?? 'mock_worker',
      workerInstanceId,
      claimStatus: 'claimed_mock_only',
      attemptNumber: 1,
      approvedPlanSnapshotId: input.approvedPlanSnapshotId,
      creditReservationId: input.creditReservationId,
      idempotencyKey: item.idempotencyKey ?? `mock-worker-claim-idempotency-${index + 1}`,
      leaseExpiresAt,
      claimedAt,
      mockOnly: true,
    }))

  return createApiMockResponse({
    mockWorkerClaims: {
      id: `mock-worker-claims-${dispatchReadinessId}`,
      dispatchReadinessId,
      mockQueueId: input.mockQueueId,
      jobBatchPlanId: input.jobBatchPlanId,
      packageRecordId: input.packageRecordId,
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      approvedPlanSnapshotId: input.approvedPlanSnapshotId,
      creditReservationId: input.creditReservationId,
      status: 'claimed_for_mock_worker_review',
      mockClaimsOnly: true,
      claimCount: workerClaims.length,
      workersStarted: 0,
      workerHandlersStarted: 0,
      toolsExecuted: 0,
      workerClaims,
      userFacingSummary: 'The edit tasks are reserved for internal worker review. Editing work has not started yet.',
      noRuntimeSideEffects: [
        'Mock worker claim creation did not start handlers, run tools, process media, render, write Supabase/GCS, or bill users.',
      ],
    },
    warnings: [
      'Mock approved edit execution worker claims only.',
      'Live worker handlers remain disabled until reviewed runtime gates pass.',
    ],
  }, [
    'Mock approved edit execution worker claims only.',
    'Live worker handlers remain disabled until reviewed runtime gates pass.',
  ])
}

function handleMockApprovedEditExecutionHandlerDryRun(request: ApiRequestEnvelope): ApiResponseEnvelope {
  const input = request.body as {
    workspaceId?: string
    projectId?: string
    creditReservationId?: string
    mockWorkerClaimsId?: string
    dispatchReadinessId?: string
    mockQueueId?: string
    jobBatchPlanId?: string
    packageRecordId?: string
    approvedPlanSnapshotId?: string
    handlerDryRunOnly?: boolean
    workerClaims?: Array<{
      id?: string
      queuedJobId?: string
      workItemId?: string
      runtimeJobType?: string
      workerType?: string
      approvedPlanSnapshotId?: string
      creditReservationId?: string
      idempotencyKey?: string
      expectedOutputIds?: string[]
      qaChecks?: string[]
    }>
  } | undefined
  const mockWorkerClaimsId = input?.mockWorkerClaimsId ?? request.params?.mockWorkerClaimsId

  if (!input?.workspaceId || !input.projectId || !input.creditReservationId || !mockWorkerClaimsId || !input.dispatchReadinessId || !input.mockQueueId || !input.jobBatchPlanId || !input.packageRecordId || !input.approvedPlanSnapshotId) {
    return createApiErrorResponse('invalid_edit_execution_handler_dry_run_input', 'Mock worker claims, package, approved snapshot, and credit reservation evidence are required.', {
      statusCode: 400,
      warnings: ['No worker handlers, providers, render jobs, media processing, Supabase/GCS writes, or billing mutations were started.'],
      mockOnly: true,
    })
  }

  const completedAt = new Date().toISOString()
  const workResults = (input.workerClaims ?? []).map((claim, index) => {
    const workItemId = claim.workItemId ?? `work-item-${index + 1}`
    const expectedOutputIds = claim.expectedOutputIds?.length ? claim.expectedOutputIds : [`${workItemId}-status-output`]
    const resultArtifactRefs = expectedOutputIds.map((outputId) => ({
      artifactId: `dry-run-artifact-${workItemId}-${outputId}`,
      outputId,
      workItemId,
      storageProvider: 'local_mock',
      storageObjectPath: `mock/edit-execution/${input.packageRecordId}/${workItemId}/${outputId}.json`,
      privateArtifact: true,
      sourceOfTruth: false,
      qaStatus: 'not_checked',
    }))

    return {
      id: `mock-handler-dry-run-result-${workItemId}`,
      mockWorkerClaimsId,
      workerClaimId: claim.id ?? `mock-worker-claim-${index + 1}`,
      queuedJobId: claim.queuedJobId ?? `mock-queued-job-${index + 1}`,
      workItemId,
      runtimeJobType: claim.runtimeJobType ?? 'custom',
      workerType: claim.workerType ?? 'mock_worker',
      status: 'dry_run_completed_mock_only',
      approvedPlanSnapshotId: claim.approvedPlanSnapshotId ?? input.approvedPlanSnapshotId,
      creditReservationId: claim.creditReservationId ?? input.creditReservationId,
      idempotencyKey: claim.idempotencyKey ?? `mock-handler-dry-run-idempotency-${index + 1}`,
      billableToUser: false,
      failureCategory: null,
      expectedOutputIds,
      resultArtifactRefs,
      qaChecks: claim.qaChecks ?? [],
      completedAt,
      mockOnly: true,
    }
  })
  const assetManifestUpdates = workResults.flatMap((result) => result.resultArtifactRefs)
  const qaHandoffRecords = workResults.map((result) => ({
    id: `mock-handler-qa-handoff-${result.workItemId}`,
    workItemId: result.workItemId,
    workerClaimId: result.workerClaimId,
    qaStatus: 'qa_pending_after_dry_run',
    qaChecks: result.qaChecks.length ? result.qaChecks : ['Future QA must verify the real output before final render/export.'],
    blocksFinalRender: true,
    reason: 'Dry-run metadata is not a real output artifact, so final render remains blocked until real worker output exists and QA passes.',
  }))

  return createApiMockResponse({
    handlerDryRun: {
      id: `mock-handler-dry-run-${mockWorkerClaimsId}`,
      mockWorkerClaimsId,
      dispatchReadinessId: input.dispatchReadinessId,
      mockQueueId: input.mockQueueId,
      jobBatchPlanId: input.jobBatchPlanId,
      packageRecordId: input.packageRecordId,
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      approvedPlanSnapshotId: input.approvedPlanSnapshotId,
      creditReservationId: input.creditReservationId,
      status: 'dry_run_completed_ready_for_result_reconciliation',
      handlerDryRunOnly: true,
      claimCount: input.workerClaims?.length ?? 0,
      workResultCount: workResults.length,
      manifestUpdateCount: assetManifestUpdates.length,
      qaHandoffCount: qaHandoffRecords.length,
      workersStarted: 0,
      workerHandlersStarted: 0,
      toolsExecuted: 0,
      mediaArtifactsCreated: 0,
      liveExecutionReady: false,
      finalExportReady: false,
      workResults,
      assetManifestUpdates,
      qaHandoffRecords,
      blockers: [
        'Real worker handlers have not executed.',
        'Dry-run artifact references are not source-of-truth media outputs.',
        'QA handoff records are pending real artifact review.',
        'Final render/export remains blocked.',
      ],
      userFacingSummary: 'The edit work has a safe internal result rehearsal. Real editing, QA, and export still need backend worker execution.',
      noRuntimeSideEffects: [
        'Mock handler dry-run did not start handlers, run tools, process media, render, write Supabase/GCS, or bill users.',
      ],
    },
    warnings: [
      'Mock approved edit execution handler dry-run only.',
      'Live worker handlers and real artifact output remain disabled until reviewed runtime gates pass.',
    ],
  }, [
    'Mock approved edit execution handler dry-run only.',
    'Live worker handlers and real artifact output remain disabled until reviewed runtime gates pass.',
  ])
}

function handleMockApprovedEditExecutionResultReconciliation(request: ApiRequestEnvelope): ApiResponseEnvelope {
  const input = request.body as {
    workspaceId?: string
    projectId?: string
    creditReservationId?: string
    handlerDryRunId?: string
    mockWorkerClaimsId?: string
    dispatchReadinessId?: string
    mockQueueId?: string
    jobBatchPlanId?: string
    packageRecordId?: string
    approvedPlanSnapshotId?: string
    reconcileDryRunOnly?: boolean
    workResultCount?: number
    assetManifestUpdates?: Array<{
      artifactId?: string
      outputId?: string
      workItemId?: string
      storageProvider?: string
      storageObjectPath?: string
      privateArtifact?: boolean
      sourceOfTruth?: boolean
    }>
    qaHandoffRecords?: Array<{
      id?: string
      workItemId?: string
      workerClaimId?: string
      reason?: string
    }>
  } | undefined
  const handlerDryRunId = input?.handlerDryRunId ?? request.params?.handlerDryRunId

  if (!input?.workspaceId || !input.projectId || !input.creditReservationId || !handlerDryRunId || !input.mockWorkerClaimsId || !input.dispatchReadinessId || !input.mockQueueId || !input.jobBatchPlanId || !input.packageRecordId || !input.approvedPlanSnapshotId) {
    return createApiErrorResponse('invalid_edit_execution_result_reconciliation_input', 'Handler dry-run, package, approved snapshot, and credit reservation evidence are required.', {
      statusCode: 400,
      warnings: ['No worker handlers, providers, render jobs, media processing, Supabase/GCS writes, or billing mutations were started.'],
      mockOnly: true,
    })
  }

  const reconciledManifestItems = (input.assetManifestUpdates ?? []).map((artifact, index) => ({
    artifactId: artifact.artifactId ?? `dry-run-artifact-${index + 1}`,
    outputId: artifact.outputId ?? `dry-run-output-${index + 1}`,
    workItemId: artifact.workItemId ?? `work-item-${index + 1}`,
    storageProvider: 'local_mock',
    storageObjectPath: artifact.storageObjectPath ?? `mock/edit-execution/${input.packageRecordId}/work-item-${index + 1}/dry-run-output-${index + 1}.json`,
    privateArtifact: true,
    sourceOfTruth: false,
    mergeStatus: 'blocked_dry_run_placeholder',
    reconciliationDecision: 'await_real_worker_artifact',
    qaStatus: 'blocked_pending_real_artifact',
    finalRenderEligible: false,
    reason: 'Dry-run placeholder refs prove shape only; they cannot be merged as final source-of-truth media artifacts.',
  }))
  const reconciledQAGates = (input.qaHandoffRecords ?? []).map((record, index) => ({
    id: `mock-result-reconciliation-qa-gate-${record.workItemId ?? index + 1}`,
    workItemId: record.workItemId ?? `work-item-${index + 1}`,
    workerClaimId: record.workerClaimId ?? `mock-worker-claim-${index + 1}`,
    qaStatus: 'blocked_pending_real_artifact',
    blocksFinalRender: true,
    requiredBeforeFinalExport: true,
    reason: record.reason ?? 'Final render waits for real artifact QA.',
  }))
  const blockingWorkItemIds = Array.from(new Set([
    ...reconciledManifestItems.map((item) => item.workItemId),
    ...reconciledQAGates.map((gate) => gate.workItemId),
  ]))
  const dryRunArtifactIds = reconciledManifestItems.map((item) => item.artifactId)

  return createApiMockResponse({
    resultReconciliation: {
      id: `mock-result-reconciliation-${handlerDryRunId}`,
      handlerDryRunId,
      mockWorkerClaimsId: input.mockWorkerClaimsId,
      dispatchReadinessId: input.dispatchReadinessId,
      mockQueueId: input.mockQueueId,
      jobBatchPlanId: input.jobBatchPlanId,
      packageRecordId: input.packageRecordId,
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      approvedPlanSnapshotId: input.approvedPlanSnapshotId,
      creditReservationId: input.creditReservationId,
      status: 'reconciled_dry_run_waiting_real_worker_outputs',
      reconcileDryRunOnly: true,
      workResultCount: input.workResultCount ?? reconciledQAGates.length,
      manifestItemCount: reconciledManifestItems.length,
      qaGateCount: reconciledQAGates.length,
      sourceOfTruthArtifactCount: 0,
      finalRenderReady: false,
      previewReviewReady: false,
      liveExecutionReady: false,
      reconciledManifestItems,
      reconciledQAGates,
      finalRenderReadiness: {
        ready: false,
        reason: 'Final render waits for real private worker artifacts, source-of-truth manifest merge, QA pass records, and render/export readiness.',
        blockingWorkItemIds,
        qaPendingArtifactIds: dryRunArtifactIds,
        dryRunArtifactIds,
        sourceOfTruthArtifactCount: 0,
      },
      nextRequiredGate: 'real_worker_handler_execution_with_private_artifact_persistence',
      blockers: [
        'Dry-run placeholders are not source-of-truth media artifacts.',
        'Real worker handler execution has not produced private artifact refs.',
        'QA gates are blocked pending real artifacts.',
        'Preview review and final export remain blocked.',
      ],
      userFacingSummary: 'The edit pipeline has reconciled the internal dry-run. Real editing output, QA, and final export are still waiting on backend worker execution.',
      noRuntimeSideEffects: [
        'Mock result reconciliation did not start handlers, run tools, process media, render, write Supabase/GCS, or bill users.',
      ],
    },
    warnings: [
      'Mock approved edit execution result reconciliation only.',
      'Dry-run refs remain blocked from final render until real private artifacts and QA records exist.',
    ],
  }, [
    'Mock approved edit execution result reconciliation only.',
    'Dry-run refs remain blocked from final render until real private artifacts and QA records exist.',
  ])
}

function handleMockApprovedEditExecutionLocalWorkerOutput(request: ApiRequestEnvelope): ApiResponseEnvelope {
  const input = request.body as {
    workspaceId?: string
    projectId?: string
    creditReservationId?: string
    resultReconciliationId?: string
    handlerDryRunId?: string
    mockWorkerClaimsId?: string
    dispatchReadinessId?: string
    mockQueueId?: string
    jobBatchPlanId?: string
    packageRecordId?: string
    approvedPlanSnapshotId?: string
    localOutputOnly?: boolean
    workResultCount?: number
    reconciledManifestItems?: Array<{
      artifactId?: string
      outputId?: string
      workItemId?: string
    }>
  } | undefined
  const resultReconciliationId = input?.resultReconciliationId ?? request.params?.resultReconciliationId

  if (!input?.workspaceId || !input.projectId || !input.creditReservationId || !resultReconciliationId || !input.handlerDryRunId || !input.mockWorkerClaimsId || !input.dispatchReadinessId || !input.mockQueueId || !input.jobBatchPlanId || !input.packageRecordId || !input.approvedPlanSnapshotId) {
    return createApiErrorResponse('invalid_edit_execution_local_worker_output_input', 'Result reconciliation, package, approved snapshot, and credit reservation evidence are required.', {
      statusCode: 400,
      warnings: ['No worker handlers, providers, render jobs, media processing, Supabase/GCS writes, or billing mutations were started.'],
      mockOnly: true,
    })
  }

  const createdAt = new Date().toISOString()
  const persistedArtifacts = (input.reconciledManifestItems ?? []).map((artifact, index) => {
    const sourceArtifactId = artifact.artifactId ?? `dry-run-artifact-${index + 1}`
    const artifactId = `local-output-${sourceArtifactId}`
    return {
      artifactId,
      sourceArtifactId,
      outputId: artifact.outputId ?? `dry-run-output-${index + 1}`,
      workItemId: artifact.workItemId ?? `work-item-${index + 1}`,
      storageProvider: 'local_private',
      storageObjectPath: `edit-execution/${input.workspaceId}/${input.projectId}/${resultReconciliationId}/${artifactId}.json`,
      localFilePath: `/tmp/reeditpro/mock/${artifactId}.json`,
      privateArtifact: true,
      publicArtifact: false,
      signedUrl: null,
      sourceOfTruth: true,
      sourceOfTruthScope: 'local_worker_output_metadata_only',
      mediaArtifact: false,
      sha256: 'mock-local-worker-output-sha256',
      byteSize: 512,
      qaStatus: 'qa_pending_local_output_review',
      finalRenderEligible: false,
      previewReviewEligible: true,
      createdAt,
    }
  })
  const qaHandoffRecords = persistedArtifacts.map((artifact, index) => ({
    id: `mock-local-worker-output-qa-${index + 1}`,
    workItemId: artifact.workItemId,
    artifactId: artifact.artifactId,
    qaStatus: 'qa_pending_local_output_review',
    blocksFinalRender: true,
    requiredBeforeFinalExport: true,
    reason: 'Local worker output metadata exists, but media/tool output QA has not passed.',
  }))

  return createApiMockResponse({
    localWorkerOutput: {
      id: `mock-local-worker-output-${resultReconciliationId}`,
      resultReconciliationId,
      handlerDryRunId: input.handlerDryRunId,
      mockWorkerClaimsId: input.mockWorkerClaimsId,
      dispatchReadinessId: input.dispatchReadinessId,
      mockQueueId: input.mockQueueId,
      jobBatchPlanId: input.jobBatchPlanId,
      packageRecordId: input.packageRecordId,
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      approvedPlanSnapshotId: input.approvedPlanSnapshotId,
      creditReservationId: input.creditReservationId,
      status: 'local_worker_outputs_persisted_waiting_qa',
      localOutputOnly: true,
      workResultCount: input.workResultCount ?? persistedArtifacts.length,
      persistedArtifactCount: persistedArtifacts.length,
      sourceOfTruthArtifactCount: persistedArtifacts.length,
      mediaArtifactCount: 0,
      qaPendingCount: qaHandoffRecords.length,
      workersStarted: 0,
      workerHandlersStarted: 0,
      toolsExecuted: 0,
      liveExecutionReady: false,
      internalResultReviewReady: true,
      previewReviewReady: true,
      renderPreviewReady: false,
      finalRenderReady: false,
      persistedArtifacts,
      qaHandoffRecords,
      finalRenderReadiness: {
        ready: false,
        reason: 'Private local output metadata exists for internal review, but final render waits for real media/tool artifacts, QA pass records, and render/export readiness.',
        qaPendingArtifactIds: persistedArtifacts.map((artifact) => artifact.artifactId),
        sourceOfTruthArtifactCount: persistedArtifacts.length,
        mediaArtifactCount: 0,
      },
      nextRequiredGate: 'local_worker_output_qa_review',
      blockers: [
        'Local worker outputs are metadata-only records, not processed media artifacts.',
        'Tool/media worker execution has not produced QA-passed media outputs.',
        'Final render/export remains blocked until real artifacts and QA pass.',
      ],
      userFacingSummary: 'The edit has private internal output records ready for review. Final video export still waits for real media/tool processing and QA.',
      noRuntimeSideEffects: [
        'Mock local worker output persistence did not run tools, process media, render, write Supabase/GCS, create signed URLs, or bill users.',
      ],
    },
    warnings: [
      'Mock approved edit execution local worker output only.',
      'Local output records are metadata-only and do not authorize final render/export.',
    ],
  }, [
    'Mock approved edit execution local worker output only.',
    'Local output records are metadata-only and do not authorize final render/export.',
  ])
}

function handleMockApprovedEditExecutionLocalWorkerOutputQaReview(request: ApiRequestEnvelope): ApiResponseEnvelope {
  const input = request.body as {
    workspaceId?: string
    projectId?: string
    creditReservationId?: string
    localWorkerOutputId?: string
    localOutputQaReviewId?: string
    resultReconciliationId?: string
    handlerDryRunId?: string
    packageRecordId?: string
    approvedPlanSnapshotId?: string
    qaReviewOnly?: boolean
    persistedArtifacts?: Array<{
      artifactId?: string
      workItemId?: string
      privateArtifact?: boolean
      publicArtifact?: boolean
      signedUrl?: string | null
      sourceOfTruth?: boolean
      sourceOfTruthScope?: string
      mediaArtifact?: boolean
      sha256?: string
      byteSize?: number
      finalRenderEligible?: boolean
    }>
  } | undefined
  const localWorkerOutputId = input?.localWorkerOutputId ?? request.params?.localWorkerOutputId

  if (!input?.workspaceId || !input.projectId || !input.creditReservationId || !localWorkerOutputId || !input.resultReconciliationId || !input.handlerDryRunId || !input.packageRecordId || !input.approvedPlanSnapshotId) {
    return createApiErrorResponse('invalid_edit_execution_local_worker_output_qa_review_input', 'Local worker output, package, approved snapshot, and credit reservation evidence are required.', {
      statusCode: 400,
      warnings: ['No worker handlers, providers, render jobs, media processing, Supabase/GCS writes, or billing mutations were started.'],
      mockOnly: true,
    })
  }

  const persistedArtifacts = input.persistedArtifacts?.length
    ? input.persistedArtifacts
    : [{ artifactId: `mock-artifact-${localWorkerOutputId}`, workItemId: 'mock-work-item' }]
  const qaResults = persistedArtifacts.map((artifact, index) => ({
    id: `mock-local-output-qa-result-${index + 1}`,
    artifactId: artifact.artifactId ?? `mock-artifact-${index + 1}`,
    workItemId: artifact.workItemId ?? `mock-work-item-${index + 1}`,
    qaStatus: 'passed_metadata_integrity_only',
    metadataIntegrityPassed: true,
    mediaQaRequired: true,
    finalRenderEligible: false,
    blocksFinalRender: true,
    requiredBeforeFinalExport: true,
    checks: [
      { check: 'private_metadata_record', passed: artifact.privateArtifact !== false, message: 'Artifact is stored as a private local metadata record.' },
      { check: 'checksum_present', passed: artifact.sha256 ? /^[a-f0-9]{64}$/i.test(artifact.sha256) : true, message: 'Artifact includes checksum and byte-size evidence.' },
      { check: 'no_signed_url', passed: artifact.signedUrl == null, message: 'Artifact does not expose signed URLs.' },
      { check: 'no_public_artifact', passed: artifact.publicArtifact !== true, message: 'Artifact is not marked public.' },
      { check: 'metadata_only_scope', passed: artifact.sourceOfTruthScope ? artifact.sourceOfTruthScope === 'local_worker_output_metadata_only' : true, message: 'Artifact is source-of-truth metadata only.' },
      { check: 'no_media_bytes_claim', passed: artifact.mediaArtifact !== true && artifact.finalRenderEligible !== true, message: 'Artifact does not claim media bytes or final-render eligibility.' },
    ],
    reason: 'Metadata integrity passed. Media artifact production and media QA are still required before render/export.',
  }))
  const artifactIds = qaResults.map((result) => result.artifactId)

  return createApiMockResponse({
    localWorkerOutputQaReview: {
      id: `mock-local-output-qa-review-${localWorkerOutputId}`,
      localWorkerOutputId,
      resultReconciliationId: input.resultReconciliationId,
      handlerDryRunId: input.handlerDryRunId,
      packageRecordId: input.packageRecordId,
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      approvedPlanSnapshotId: input.approvedPlanSnapshotId,
      creditReservationId: input.creditReservationId,
      status: 'local_worker_output_qa_passed_waiting_uploaded_media_worker_execution',
      qaReviewOnly: true,
      reviewedArtifactCount: qaResults.length,
      passedArtifactCount: qaResults.length,
      blockedArtifactCount: 0,
      sourceOfTruthArtifactCount: qaResults.length,
      mediaArtifactCount: 0,
      workersStarted: 0,
      workerHandlersStarted: 0,
      toolsExecuted: 0,
      liveExecutionReady: false,
      internalResultReviewReady: true,
      previewReviewReady: true,
      renderPreviewReady: false,
      finalRenderReady: false,
      qaResults,
      finalRenderReadiness: {
        ready: false,
        reason: 'Local worker output metadata QA passed, but final render still waits for uploaded-media worker execution, private media artifacts, media QA, and render/export readiness.',
        metadataQaPassedArtifactIds: artifactIds,
        mediaQaRequiredArtifactIds: artifactIds,
        sourceOfTruthArtifactCount: qaResults.length,
        mediaArtifactCount: 0,
      },
      nextRequiredGate: 'uploaded_media_worker_execution_with_private_artifact_outputs',
      blockers: [
        'No uploaded user media has been processed by backend worker handlers.',
        'No private media artifacts or media QA pass records exist yet.',
        'Final render/export remains blocked until uploaded-media worker execution and QA pass.',
      ],
      userFacingSummary: 'The internal worker-output metadata passed review. Real uploaded-media editing still needs backend worker execution before preview or export.',
      noRuntimeSideEffects: [
        'Mock local worker output QA reviewed metadata only and did not run tools, process media, render, write Supabase/GCS, create signed URLs, or bill users.',
      ],
    },
    warnings: [
      'Mock approved edit execution local worker output QA only.',
      'Metadata QA does not authorize media output, render preview, final export, or product delivery.',
    ],
  }, [
    'Mock approved edit execution local worker output QA only.',
    'Metadata QA does not authorize media output, render preview, final export, or product delivery.',
  ])
}

function handleMockApprovedEditExecutionWorkflowRehearsal(request: ApiRequestEnvelope): ApiResponseEnvelope {
  const input = request.body as {
    workspaceId?: string
    projectId?: string
    creditReservationId?: string
    localWorkerOutputId?: string
    localOutputQaReviewId?: string
    resultReconciliationId?: string
    handlerDryRunId?: string
    packageRecordId?: string
    approvedPlanSnapshotId?: string
    scenarioId?: string
    rehearsalOnly?: boolean
  } | undefined
  const localWorkerOutputId = input?.localWorkerOutputId ?? request.params?.localWorkerOutputId

  if (!input?.workspaceId || !input.projectId || !input.creditReservationId || !localWorkerOutputId || !input.resultReconciliationId || !input.handlerDryRunId || !input.packageRecordId || !input.approvedPlanSnapshotId) {
    return createApiErrorResponse('invalid_edit_execution_workflow_rehearsal_input', 'Local worker output, package, approved snapshot, and credit reservation evidence are required.', {
      statusCode: 400,
      warnings: ['No worker handlers, providers, render jobs, media processing, Supabase/GCS writes, or billing mutations were started.'],
      mockOnly: true,
    })
  }

  const scenarioId = input.scenarioId ?? 'talking-head-clean-edit'
  const localOutputQaStatus = input.localOutputQaReviewId ? 'passed_metadata_integrity_only' : 'pending'
  const releaseReadiness = createMockApprovedExecutionReleaseReadiness()

  return createApiMockResponse({
    workflowRehearsal: {
      id: `mock-workflow-rehearsal-${localWorkerOutputId}`,
      localWorkerOutputId,
      resultReconciliationId: input.resultReconciliationId,
      handlerDryRunId: input.handlerDryRunId,
      packageRecordId: input.packageRecordId,
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      approvedPlanSnapshotId: input.approvedPlanSnapshotId,
      creditReservationId: input.creditReservationId,
      status: 'production_workflow_rehearsed_waiting_uploaded_media_worker_execution',
      rehearsalOnly: true,
      workflowMode: 'dry_run',
      scenarioId,
      stageCount: 8,
      completedStageCount: 7,
      blockedStageCount: 1,
      warningStageCount: 0,
      workflowStages: [
        'media_foundation',
        'speech_caption_execution',
        'smart_cut_timeline_execution',
        'audio_execution',
        'color_execution',
        'mask_background_execution',
        'enhancement_slowmotion_execution',
        'final_render_export_execution',
      ],
      artifactCount: 12,
      privateArtifactCount: 12,
      qaGateCount: 10,
      qaBlockedCount: 1,
      finalDeliveryAllowed: false,
      productionReadyAllowed: releaseReadiness.productionReadyAllowed,
      liveExecutionReady: false,
      renderPreviewReady: false,
      finalRenderReady: false,
      localOutputQaStatus,
      report: {
        reportId: `mock-workflow-report-${localWorkerOutputId}`,
        scenarioId,
        mode: 'dry_run',
        status: 'blocked',
        artifactSummary: {
          totalArtifacts: 12,
          privateArtifactCount: 12,
          sourceImmutable: true,
          signedUrlRejectedCount: 0,
        },
        qaSummary: {
          total: 10,
          blocked: 1,
          finalDeliveryAllowed: false,
        },
        fallbackSummary: {
          qaBypassDetected: false,
        },
        readinessSummary: {
          productionReadyAllowed: releaseReadiness.productionReadyAllowed,
        },
        blockers: ['Real uploaded-media worker execution has not run.'],
        warnings: ['Mock workflow rehearsal only.'],
        nextActions: ['Run uploaded-media worker execution with private artifact outputs.'],
      },
      nextRequiredGate: 'uploaded_media_worker_execution_with_private_artifact_outputs',
      blockers: [
        'Production workflow rehearsal uses dry-run/generated fixture evidence, not uploaded user media.',
        ...(localOutputQaStatus === 'pending' ? ['Local worker output QA is still pending.'] : []),
        'Real worker handlers have not processed uploaded media into private artifacts.',
        'Final render/export remains blocked until real private artifacts and QA pass.',
      ],
      userFacingSummary: 'The edit workflow has been rehearsed end to end with internal dry-run stages. Real uploaded-media editing still needs approved private worker execution.',
      noRuntimeSideEffects: [
        'Mock workflow rehearsal did not process uploaded media, run tools, render, write Supabase/GCS, create signed URLs, or bill users.',
      ],
    },
    warnings: [
      'Mock approved edit production workflow rehearsal only.',
      'Uploaded-media worker execution remains the next required gate.',
    ],
  }, [
    'Mock approved edit production workflow rehearsal only.',
    'Uploaded-media worker execution remains the next required gate.',
  ])
}

function handleMockApprovedEditExecutionUploadedMediaWorkerExecution(request: ApiRequestEnvelope): ApiResponseEnvelope {
  const input = request.body as {
    workspaceId?: string
    projectId?: string
    creditReservationId?: string
    workflowRehearsalId?: string
    localWorkerOutputId?: string
    localWorkerOutputQaReviewId?: string
    approvedPlanSnapshotId?: string
    uploadedMediaExecutionOnly?: boolean
    sourceMediaAssets?: Array<{
      mediaAssetId?: string
      sourceSequenceItemId?: string
      uploadedClipId?: string
      uploadedOrder?: number
      storageProvider?: string
      storageBucket?: string
      storagePath?: string
      fileName?: string
      mimeType?: string
      byteSize?: number
      checksumSha256?: string
      privateArtifact?: boolean
      publicUrl?: string | null
      signedUrl?: string | null
    }>
  } | undefined
  const workflowRehearsalId = input?.workflowRehearsalId ?? request.params?.workflowRehearsalId

  if (!input?.workspaceId || !input.projectId || !input.creditReservationId || !workflowRehearsalId || !input.localWorkerOutputId || !input.localWorkerOutputQaReviewId || !input.sourceMediaAssets?.length) {
    return createApiErrorResponse('invalid_edit_execution_uploaded_media_worker_execution_input', 'Workflow rehearsal, local output QA, uploaded source media, and credit reservation evidence are required.', {
      statusCode: 400,
      warnings: ['No worker handlers, providers, render jobs, media processing, Supabase/GCS writes, or billing mutations were started.'],
      mockOnly: true,
    })
  }

  const invalidSource = input.sourceMediaAssets.find((asset) =>
    !asset.mediaAssetId ||
    !asset.storagePath ||
    /^https?:\/\//i.test(asset.storagePath) ||
    !asset.checksumSha256 ||
    !/^[a-f0-9]{64}$/i.test(asset.checksumSha256) ||
    asset.privateArtifact === false ||
    asset.publicUrl != null ||
    asset.signedUrl != null,
  )

  if (invalidSource) {
    return createApiErrorResponse('invalid_uploaded_media_source_asset', 'Uploaded source media references must be private, checksumed, and free of signed/public URLs.', {
      statusCode: 400,
      warnings: ['Uploaded-media worker execution was rejected before any worker, media, storage, or billing side effect.'],
      mockOnly: true,
    })
  }

  const sortedSourceAssets = input.sourceMediaAssets
    .slice()
    .sort((left, right) => (left.uploadedOrder ?? 0) - (right.uploadedOrder ?? 0))
  const privateWorkerArtifacts = sortedSourceAssets.map((sourceAsset, index) => ({
    artifactId: `mock-uploaded-worker-output-${sourceAsset.mediaAssetId ?? index + 1}`,
    sourceMediaAssetId: sourceAsset.mediaAssetId ?? `source-media-${index + 1}`,
    sourceSequenceItemId: sourceAsset.sourceSequenceItemId,
    uploadedClipId: sourceAsset.uploadedClipId,
    uploadedOrder: sourceAsset.uploadedOrder ?? index + 1,
    outputId: `mock-uploaded-media-output-${index + 1}`,
    workItemId: `mock-uploaded-media-work-item-${index + 1}`,
    storageProvider: 'local_private',
    storageObjectPath: `edit-execution/${input.workspaceId}/${input.projectId}/${workflowRehearsalId}/uploaded-media-worker-execution/mock-uploaded-worker-output-${index + 1}.json`,
    localFilePath: `/tmp/reeditpro/mock/uploaded-media-worker-execution/mock-uploaded-worker-output-${index + 1}.json`,
    privateArtifact: true,
    publicArtifact: false,
    signedUrl: null,
    sourceOfTruth: true,
    sourceOfTruthScope: 'uploaded_media_worker_execution_metadata_only',
    mediaArtifact: false,
    workerOutputArtifact: true,
    sourceMediaBound: true,
    sha256: 'a'.repeat(64),
    byteSize: 512,
    qaStatus: 'qa_pending_private_worker_artifact_review',
    finalRenderEligible: false,
    previewReviewEligible: true,
  }))
  const artifactIds = privateWorkerArtifacts.map((artifact) => artifact.artifactId)

  return createApiMockResponse({
    uploadedMediaWorkerExecution: {
      id: `mock-uploaded-media-worker-execution-${workflowRehearsalId}`,
      workflowRehearsalId,
      localWorkerOutputId: input.localWorkerOutputId,
      localWorkerOutputQaReviewId: input.localWorkerOutputQaReviewId,
      resultReconciliationId: `mock-result-reconciliation-${workflowRehearsalId}`,
      handlerDryRunId: `mock-handler-dry-run-${workflowRehearsalId}`,
      packageRecordId: `mock-package-${workflowRehearsalId}`,
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      approvedPlanSnapshotId: input.approvedPlanSnapshotId ?? `mock-approved-snapshot-${workflowRehearsalId}`,
      creditReservationId: input.creditReservationId,
      status: 'uploaded_media_worker_execution_metadata_persisted_waiting_private_artifact_qa',
      uploadedMediaExecutionOnly: true,
      workerExecutionMode: 'metadata_only_no_media_processing',
      sourceMediaAssetCount: sortedSourceAssets.length,
      privateWorkerArtifactCount: privateWorkerArtifacts.length,
      sourceBoundArtifactCount: privateWorkerArtifacts.length,
      mediaArtifactCount: 0,
      qaPendingCount: privateWorkerArtifacts.length,
      workersStarted: 0,
      workerHandlersStarted: 0,
      toolsExecuted: 0,
      mediaBytesProcessed: false,
      liveExecutionReady: false,
      internalResultReviewReady: true,
      previewReviewReady: true,
      renderPreviewReady: false,
      finalRenderReady: false,
      sourceMediaAssets: sortedSourceAssets,
      privateWorkerArtifacts,
      qaHandoffRecords: privateWorkerArtifacts.map((artifact, index) => ({
        id: `mock-uploaded-media-worker-artifact-qa-${index + 1}`,
        artifactId: artifact.artifactId,
        sourceMediaAssetId: artifact.sourceMediaAssetId,
        workItemId: artifact.workItemId,
        qaStatus: 'qa_pending_private_worker_artifact_review',
        blocksFinalRender: true,
        requiredBeforeFinalExport: true,
        reason: 'Uploaded source media is bound to private worker-output metadata, but real media processing and artifact QA have not passed.',
      })),
      finalRenderReadiness: {
        ready: false,
        reason: 'Uploaded media is source-bound to private worker-output metadata, but final render waits for real media processing, private media artifacts, artifact QA, and render/export readiness.',
        qaPendingArtifactIds: artifactIds,
        sourceMediaAssetCount: sortedSourceAssets.length,
        privateWorkerArtifactCount: privateWorkerArtifacts.length,
        mediaArtifactCount: 0,
      },
      nextRequiredGate: 'private_worker_artifact_qa_review',
      blockers: [
        'This gate created private worker-output metadata only; no uploaded media bytes were decoded or transformed.',
        'Private media artifacts and artifact QA pass records do not exist yet.',
        'Final render/export remains blocked until real processing, media QA, and render readiness pass.',
      ],
      userFacingSummary: 'The edit now has uploaded source media bound to private internal worker-output records. Real processing and QA are still required before preview or export.',
      noRuntimeSideEffects: [
        'Mock uploaded-media worker execution did not run workers, tools, media processing, render, write Supabase/GCS, create signed URLs, or bill users.',
      ],
    },
    warnings: [
      'Mock uploaded-media worker execution metadata only.',
      'No media bytes were decoded, transformed, rendered, uploaded, or delivered.',
    ],
  }, [
    'Mock uploaded-media worker execution metadata only.',
    'No media bytes were decoded, transformed, rendered, uploaded, or delivered.',
  ])
}

function handleMockApprovedEditExecutionPrivateWorkerArtifactQaReview(request: ApiRequestEnvelope): ApiResponseEnvelope {
  const input = request.body as {
    workspaceId?: string
    projectId?: string
    creditReservationId?: string
    uploadedMediaWorkerExecutionId?: string
    qaReviewOnly?: boolean
  } | undefined
  const uploadedMediaWorkerExecutionId = input?.uploadedMediaWorkerExecutionId ?? request.params?.uploadedMediaWorkerExecutionId

  if (!input?.workspaceId || !input.projectId || !input.creditReservationId || !uploadedMediaWorkerExecutionId) {
    return createApiErrorResponse('invalid_edit_execution_private_worker_artifact_qa_input', 'Uploaded-media worker execution and credit reservation evidence are required.', {
      statusCode: 400,
      warnings: ['No worker handlers, providers, render jobs, media processing, Supabase/GCS writes, or billing mutations were started.'],
      mockOnly: true,
    })
  }

  const artifactCount = 1
  const qaResults = Array.from({ length: artifactCount }, (_, index) => ({
    id: `mock-private-worker-artifact-qa-result-${index + 1}`,
    artifactId: `mock-uploaded-worker-output-${index + 1}`,
    sourceMediaAssetId: `mock-source-media-${index + 1}`,
    workItemId: `mock-uploaded-media-work-item-${index + 1}`,
    qaStatus: 'passed_private_worker_artifact_metadata_only',
    metadataIntegrityPassed: true,
    sourceMediaBound: true,
    mediaQaRequired: true,
    finalRenderEligible: false,
    blocksFinalRender: true,
    requiredBeforeFinalExport: true,
    checks: [
      { check: 'private_worker_output_metadata', passed: true, message: 'Artifact is stored as private worker-output metadata.' },
      { check: 'source_media_bound', passed: true, message: 'Artifact is bound to an uploaded source media reference.' },
      { check: 'checksum_present', passed: true, message: 'Artifact includes checksum and byte-size evidence.' },
      { check: 'no_signed_url', passed: true, message: 'Artifact does not expose signed URLs or public URL paths.' },
      { check: 'no_public_artifact', passed: true, message: 'Artifact is not marked public.' },
      { check: 'metadata_only_scope', passed: true, message: 'Artifact is source-of-truth metadata only.' },
      { check: 'no_media_bytes_claim', passed: true, message: 'Artifact does not claim processed media bytes.' },
      { check: 'not_final_render_eligible', passed: true, message: 'Artifact is not eligible for final render/export.' },
    ],
    reason: 'Private metadata integrity passed. Real media processing and media QA are still required before preview/export.',
  }))
  const passedArtifactIds = qaResults.map((result) => result.artifactId)

  return createApiMockResponse({
    privateWorkerArtifactQaReview: {
      id: `mock-private-worker-artifact-qa-review-${uploadedMediaWorkerExecutionId}`,
      uploadedMediaWorkerExecutionId,
      workflowRehearsalId: `mock-workflow-rehearsal-${uploadedMediaWorkerExecutionId}`,
      localWorkerOutputId: `mock-local-worker-output-${uploadedMediaWorkerExecutionId}`,
      localWorkerOutputQaReviewId: `mock-local-worker-output-qa-${uploadedMediaWorkerExecutionId}`,
      resultReconciliationId: `mock-result-reconciliation-${uploadedMediaWorkerExecutionId}`,
      handlerDryRunId: `mock-handler-dry-run-${uploadedMediaWorkerExecutionId}`,
      packageRecordId: `mock-package-${uploadedMediaWorkerExecutionId}`,
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      approvedPlanSnapshotId: `mock-approved-snapshot-${uploadedMediaWorkerExecutionId}`,
      creditReservationId: input.creditReservationId,
      status: 'private_worker_artifact_qa_passed_waiting_real_media_processing',
      qaReviewOnly: true,
      reviewedArtifactCount: qaResults.length,
      passedArtifactCount: qaResults.length,
      blockedArtifactCount: 0,
      sourceBoundArtifactCount: qaResults.length,
      mediaArtifactCount: 0,
      workersStarted: 0,
      workerHandlersStarted: 0,
      toolsExecuted: 0,
      mediaBytesProcessed: false,
      liveExecutionReady: false,
      internalResultReviewReady: true,
      previewReviewReady: true,
      renderPreviewReady: false,
      finalRenderReady: false,
      qaResults,
      finalRenderReadiness: {
        ready: false,
        reason: 'Private worker artifact metadata QA passed, but preview/export still waits for real media processing, private media artifacts, media QA, and render readiness.',
        metadataQaPassedArtifactIds: passedArtifactIds,
        mediaQaRequiredArtifactIds: passedArtifactIds,
        sourceBoundArtifactCount: qaResults.length,
        mediaArtifactCount: 0,
      },
      nextRequiredGate: 'real_media_processing_worker_execution_with_private_media_artifacts',
      blockers: [
        'No uploaded media bytes have been decoded, transformed, or rendered by real worker handlers.',
        'No private processed media artifacts or media QA pass records exist yet.',
        'Preview/export remains blocked until real media processing, media QA, and render readiness pass.',
      ],
      userFacingSummary: 'Internal edit artifact records passed review. The system still needs real private media processing before it can show a preview or export.',
      noRuntimeSideEffects: [
        'Mock private worker artifact QA did not run workers, tools, media processing, render, write Supabase/GCS, create signed URLs, or bill users.',
      ],
    },
    warnings: [
      'Mock private worker artifact QA metadata review only.',
      'No media bytes were decoded, transformed, rendered, uploaded, or delivered.',
    ],
  }, [
    'Mock private worker artifact QA metadata review only.',
    'No media bytes were decoded, transformed, rendered, uploaded, or delivered.',
  ])
}

function handleMockApprovedEditExecutionLocalMediaProcessingExecution(request: ApiRequestEnvelope): ApiResponseEnvelope {
  const input = request.body as {
    workspaceId?: string
    projectId?: string
    creditReservationId?: string
    privateWorkerArtifactQaReviewId?: string
    processingExecutionOnly?: boolean
    processingMode?: string
    maxDurationSeconds?: number
    targetWidth?: number
    targetHeight?: number
    fps?: number
  } | undefined
  const privateWorkerArtifactQaReviewId = input?.privateWorkerArtifactQaReviewId ?? request.params?.privateWorkerArtifactQaReviewId

  if (!input?.workspaceId || !input.projectId || !input.creditReservationId || !privateWorkerArtifactQaReviewId) {
    return createApiErrorResponse('invalid_edit_execution_local_media_processing_input', 'Private worker artifact QA review and credit reservation evidence are required.', {
      statusCode: 400,
      warnings: ['No worker handlers, providers, render jobs, media processing, Supabase/GCS writes, or billing mutations were started.'],
      mockOnly: true,
    })
  }

  const processingMode = input.processingMode === 'private_internal_review_render'
    ? 'private_internal_review_render'
    : 'bounded_preview_render'
  const maxDurationSeconds = input.maxDurationSeconds ?? (processingMode === 'private_internal_review_render' ? 30 : 2)
  const targetWidth = input.targetWidth ?? (processingMode === 'private_internal_review_render' ? 960 : 320)
  const targetHeight = input.targetHeight ?? (processingMode === 'private_internal_review_render' ? 540 : 180)
  const fps = input.fps ?? (processingMode === 'private_internal_review_render' ? 24 : 15)
  const mockAudioExecutionReview = {
    id: `mock-private-audio-execution-${privateWorkerArtifactQaReviewId}`,
    sourceMediaAssetId: `mock-source-media-${privateWorkerArtifactQaReviewId}`,
    sourceArtifactId: `mock-uploaded-worker-output-${privateWorkerArtifactQaReviewId}`,
    processedArtifactId: `mock-processed-media-${privateWorkerArtifactQaReviewId}`,
    mode: 'local_dev',
    status: 'partial',
    sourceAudioArtifactId: `mock-uploaded-worker-output-${privateWorkerArtifactQaReviewId}`,
    toolExecutionPlanId: `mock-private-audio-execution-plan-${privateWorkerArtifactQaReviewId}`,
    loudnessStatus: 'planned',
    normalizationStatus: 'planned',
    cleanedAudioArtifactReady: true,
    soundSyncArtifactReady: true,
    artifactCount: 3,
    qaGateCount: 4,
    blockingQaGateCount: 0,
    warningQaGateCount: 1,
    skippedReasonCount: 0,
    warningCount: 1,
    blocksPreview: false,
    blocksFinalExport: true,
    finalMuxAllowed: false,
    publicArtifact: false,
    signedUrl: null,
    productRuntimeExecuted: false,
    frontendExecutionAllowed: false,
    artifacts: [],
    qaGates: [],
    skippedReasons: [],
    warnings: ['Mock private audio QA evidence only; browser mock routes do not execute media tools.'],
  }
  const processedArtifacts = [{
    artifactId: `mock-processed-media-${privateWorkerArtifactQaReviewId}`,
    sourceArtifactId: `mock-uploaded-worker-output-${privateWorkerArtifactQaReviewId}`,
    sourceMediaAssetId: `mock-source-media-${privateWorkerArtifactQaReviewId}`,
    uploadedOrder: 1,
    workItemId: `mock-uploaded-media-work-item-${privateWorkerArtifactQaReviewId}`,
    outputId: `mock-uploaded-media-output-${privateWorkerArtifactQaReviewId}`,
    storageProvider: 'local_private',
    storageObjectPath: `edit-execution/${input.workspaceId}/${input.projectId}/${privateWorkerArtifactQaReviewId}/local-media-processing/mock-processed-media.mp4`,
    localFilePath: `/tmp/reeditpro/mock/local-media-processing/mock-processed-media.mp4`,
    privateArtifact: true,
    publicArtifact: false,
    signedUrl: null,
    sourceOfTruth: true,
    sourceOfTruthScope: 'local_media_processing_execution_private_artifact',
    mediaArtifact: true,
    processedMediaArtifact: true,
    sourceMediaBound: true,
    mimeType: 'video/mp4',
    sha256: 'b'.repeat(64),
    byteSize: 2048,
    durationSeconds: maxDurationSeconds,
    processingMode,
    audioExecutionReview: mockAudioExecutionReview,
    approvedSourceRange: {
      source: 'bounded_preview_default',
      clipId: `mock-source-clip-${privateWorkerArtifactQaReviewId}`,
      sourceSequenceItemId: `mock-source-sequence-${privateWorkerArtifactQaReviewId}`,
      startSeconds: 0,
      durationSeconds: maxDurationSeconds,
      endSeconds: maxDurationSeconds,
      requestedMaxDurationSeconds: maxDurationSeconds,
      reason: processingMode === 'private_internal_review_render'
        ? 'Mock local media processing uses the private internal review render default.'
        : 'Mock local media processing uses the bounded preview default.',
    },
    commandSummary: {
      tool: 'ffmpeg',
      maxDurationSeconds,
      startSeconds: 0,
      videoCodec: 'mpeg4',
      audioMode: 'copy_or_transcode',
      audioSource: 'generated_silence',
      fitMode: 'contain',
      filters: [
        `scale=${targetWidth}:${targetHeight}:force_original_aspect_ratio=decrease,pad=${targetWidth}:${targetHeight}:(ow-iw)/2:(oh-ih)/2:color=0x101010`,
        `fps=${fps}`,
        'setsar=1',
      ],
    },
    qaStatus: 'qa_pending_private_media_artifact_review',
    previewReviewEligible: true,
    finalRenderEligible: false,
  }]
  const processedArtifactIds = processedArtifacts.map((artifact) => artifact.artifactId)

  return createApiMockResponse({
    localMediaProcessingExecution: {
      id: `mock-local-media-processing-execution-${privateWorkerArtifactQaReviewId}`,
      privateWorkerArtifactQaReviewId,
      uploadedMediaWorkerExecutionId: `mock-uploaded-media-worker-execution-${privateWorkerArtifactQaReviewId}`,
      workflowRehearsalId: `mock-workflow-rehearsal-${privateWorkerArtifactQaReviewId}`,
      localWorkerOutputId: `mock-local-worker-output-${privateWorkerArtifactQaReviewId}`,
      localWorkerOutputQaReviewId: `mock-local-worker-output-qa-${privateWorkerArtifactQaReviewId}`,
      resultReconciliationId: `mock-result-reconciliation-${privateWorkerArtifactQaReviewId}`,
      handlerDryRunId: `mock-handler-dry-run-${privateWorkerArtifactQaReviewId}`,
      packageRecordId: `mock-package-${privateWorkerArtifactQaReviewId}`,
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      approvedPlanSnapshotId: `mock-approved-snapshot-${privateWorkerArtifactQaReviewId}`,
      creditReservationId: input.creditReservationId,
      status: 'local_media_processing_execution_completed_waiting_private_media_artifact_qa',
      processingExecutionOnly: true,
      processingMode,
      sourceMediaAssetCount: 1,
      inputArtifactCount: processedArtifacts.length,
      processedArtifactCount: processedArtifacts.length,
      privateMediaArtifactCount: processedArtifacts.length,
      mediaArtifactCount: processedArtifacts.length,
      workersStarted: 0,
      workerHandlersStarted: 1,
      toolsExecuted: 1,
      mediaBytesProcessed: true,
      liveExecutionReady: false,
      internalResultReviewReady: true,
      previewReviewReady: true,
      renderPreviewReady: false,
      finalRenderReady: false,
      processedArtifacts,
      audioExecutionReviewCount: processedArtifacts.length,
      audioExecutionQaGateCount: processedArtifacts.length * mockAudioExecutionReview.qaGateCount,
      audioExecutionBlockingQaGateCount: 0,
      finalRenderReadiness: {
        ready: false,
        reason: 'Private processed media artifacts now exist, but preview/export waits for private media artifact QA, render preview assembly, and final export readiness.',
        processedArtifactIds,
        mediaQaRequiredArtifactIds: processedArtifactIds,
        privateMediaArtifactCount: processedArtifacts.length,
      },
      nextRequiredGate: 'private_media_artifact_qa_review',
      blockers: [
        'Private media artifact QA has not passed yet.',
        'Render preview assembly has not run.',
        'Final render/export remains blocked until media QA, render readiness, and final QA pass.',
      ],
      userFacingSummary: 'The uploaded media has been processed into private internal preview artifacts. The system still needs QA before showing a preview or export.',
      noRuntimeSideEffects: [
        'Mock local media processing route mirrors the private artifact contract without browser-side media execution.',
        'No provider call, Supabase/GCS write, signed URL/public artifact, final export, external beta, production delivery, or billing mutation occurred.',
      ],
    },
    warnings: [
      'Mock local media processing contract response only.',
      'Browser-safe mock routes do not execute media tools.',
    ],
  }, [
    'Mock local media processing contract response only.',
    'Browser-safe mock routes do not execute media tools.',
  ])
}

function handleMockApprovedEditExecutionPrivateMediaArtifactQaReview(request: ApiRequestEnvelope): ApiResponseEnvelope {
  const input = request.body as {
    workspaceId?: string
    projectId?: string
    creditReservationId?: string
    localMediaProcessingExecutionId?: string
    qaReviewOnly?: boolean
  } | undefined
  const localMediaProcessingExecutionId = input?.localMediaProcessingExecutionId ?? request.params?.localMediaProcessingExecutionId

  if (!input?.workspaceId || !input.projectId || !input.creditReservationId || !localMediaProcessingExecutionId) {
    return createApiErrorResponse('invalid_edit_execution_private_media_artifact_qa_input', 'Local media processing execution and credit reservation evidence are required.', {
      statusCode: 400,
      warnings: ['No worker handlers, providers, render jobs, media processing, Supabase/GCS writes, or billing mutations were started.'],
      mockOnly: true,
    })
  }

  const qaResults = [{
    id: `mock-private-media-artifact-qa-result-${localMediaProcessingExecutionId}`,
    artifactId: `mock-processed-media-${localMediaProcessingExecutionId}`,
    sourceMediaAssetId: `mock-source-media-${localMediaProcessingExecutionId}`,
    workItemId: `mock-uploaded-media-work-item-${localMediaProcessingExecutionId}`,
    qaStatus: 'passed_private_media_artifact_qa',
    mediaArtifactQaPassed: true,
    sourceMediaBound: true,
    previewReviewEligible: true,
    finalRenderEligible: false,
    blocksFinalRender: true,
    requiredBeforePreviewAssembly: true,
    requiredBeforeFinalExport: true,
    checks: [
      { check: 'private_processed_media_artifact', passed: true, message: 'Artifact is a private local processed media artifact.' },
      { check: 'source_media_bound', passed: true, message: 'Artifact remains bound to an uploaded source media reference.' },
      { check: 'checksum_present', passed: true, message: 'Artifact includes checksum and byte-size evidence.' },
      { check: 'local_file_exists', passed: true, message: 'Artifact exists as a local private file and its size matches metadata.' },
      { check: 'no_signed_url', passed: true, message: 'Artifact does not expose signed URLs or public URL paths.' },
      { check: 'no_public_artifact', passed: true, message: 'Artifact is not marked public.' },
      { check: 'media_artifact_scope', passed: true, message: 'Artifact is source-of-truth private media from local processing.' },
      { check: 'bounded_processing_policy', passed: true, message: 'Artifact was produced by the bounded preview processing policy.' },
      { check: 'not_final_render_eligible', passed: true, message: 'Artifact is not eligible for final render/export until later gates pass.' },
    ],
    reason: 'Private media artifact QA passed. Render preview assembly is now the next gate.',
  }]
  const passedArtifactIds = qaResults.map((result) => result.artifactId)

  return createApiMockResponse({
    privateMediaArtifactQaReview: {
      id: `mock-private-media-artifact-qa-review-${localMediaProcessingExecutionId}`,
      localMediaProcessingExecutionId,
      privateWorkerArtifactQaReviewId: `mock-private-worker-artifact-qa-review-${localMediaProcessingExecutionId}`,
      uploadedMediaWorkerExecutionId: `mock-uploaded-media-worker-execution-${localMediaProcessingExecutionId}`,
      workflowRehearsalId: `mock-workflow-rehearsal-${localMediaProcessingExecutionId}`,
      localWorkerOutputId: `mock-local-worker-output-${localMediaProcessingExecutionId}`,
      localWorkerOutputQaReviewId: `mock-local-worker-output-qa-${localMediaProcessingExecutionId}`,
      resultReconciliationId: `mock-result-reconciliation-${localMediaProcessingExecutionId}`,
      handlerDryRunId: `mock-handler-dry-run-${localMediaProcessingExecutionId}`,
      packageRecordId: `mock-package-${localMediaProcessingExecutionId}`,
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      approvedPlanSnapshotId: `mock-approved-snapshot-${localMediaProcessingExecutionId}`,
      creditReservationId: input.creditReservationId,
      status: 'private_media_artifact_qa_passed_waiting_render_preview_assembly',
      qaReviewOnly: true,
      reviewedArtifactCount: qaResults.length,
      passedArtifactCount: qaResults.length,
      blockedArtifactCount: 0,
      privateMediaArtifactCount: qaResults.length,
      mediaArtifactCount: qaResults.length,
      workersStarted: 0,
      workerHandlersStarted: 0,
      toolsExecuted: 0,
      mediaBytesProcessed: false,
      liveExecutionReady: false,
      internalResultReviewReady: true,
      previewReviewReady: true,
      renderPreviewReady: false,
      finalRenderReady: false,
      qaResults,
      finalRenderReadiness: {
        ready: false,
        reason: 'Private media artifact QA passed, but preview/export waits for render preview assembly, user review, and final export readiness.',
        mediaQaPassedArtifactIds: passedArtifactIds,
        renderPreviewAssemblyRequiredArtifactIds: passedArtifactIds,
        privateMediaArtifactCount: qaResults.length,
      },
      nextRequiredGate: 'render_preview_assembly',
      blockers: [
        'Render preview assembly has not run yet.',
        'User preview review has not passed yet.',
        'Final render/export remains blocked until render readiness and final QA pass.',
      ],
      userFacingSummary: 'The private processed media passed internal QA. The system can now assemble a private preview for review.',
      noRuntimeSideEffects: [
        'Mock private media artifact QA inspected existing local private artifact metadata only.',
        'No media processing, provider call, Supabase/GCS write, signed URL/public artifact, final export, or billing mutation occurred.',
      ],
    },
    warnings: [
      'Mock private media artifact QA response only.',
      'Render preview assembly and final export remain separate gates.',
    ],
  }, [
    'Mock private media artifact QA response only.',
    'Render preview assembly and final export remain separate gates.',
  ])
}

function handleMockApprovedEditExecutionRenderPreviewAssembly(request: ApiRequestEnvelope): ApiResponseEnvelope {
  const input = request.body as {
    workspaceId?: string
    projectId?: string
    creditReservationId?: string
    privateMediaArtifactQaReviewId?: string
    adapterWorkerArtifactIntegrationId?: string
    privateMediaRunnerQaReviewId?: string
    assemblyOnly?: boolean
  } | undefined
  const privateMediaArtifactQaReviewId = input?.privateMediaArtifactQaReviewId ?? request.params?.privateMediaArtifactQaReviewId

  if (!input?.workspaceId || !input.projectId || !input.creditReservationId || !privateMediaArtifactQaReviewId) {
    return createApiErrorResponse('invalid_edit_execution_render_preview_assembly_input', 'Private media artifact QA review and credit reservation evidence are required.', {
      statusCode: 400,
      warnings: ['No worker handlers, providers, render jobs, media processing, Supabase/GCS writes, or billing mutations were started.'],
      mockOnly: true,
    })
  }

  const previewClips = [{
    clipRefId: `mock-preview-clip-${privateMediaArtifactQaReviewId}`,
    processedArtifactId: `mock-processed-media-${privateMediaArtifactQaReviewId}`,
    sourceMediaAssetId: `mock-source-media-${privateMediaArtifactQaReviewId}`,
    uploadedOrder: 1,
    assemblySource: 'uploaded_source_order',
    workItemId: `mock-uploaded-media-work-item-${privateMediaArtifactQaReviewId}`,
    storageProvider: 'local_private',
    storageObjectPath: `edit-execution/${input.workspaceId}/${input.projectId}/${privateMediaArtifactQaReviewId}/local-media-processing/mock-processed-media.mp4`,
    localFilePath: `/tmp/reeditpro/mock/local-media-processing/mock-processed-media.mp4`,
    mimeType: 'video/mp4',
    sha256: 'b'.repeat(64),
    byteSize: 2048,
    durationSeconds: 2,
    approvedSourceRange: {
      source: 'bounded_preview_default',
      clipId: `mock-source-clip-${privateMediaArtifactQaReviewId}`,
      sourceSequenceItemId: `mock-source-sequence-${privateMediaArtifactQaReviewId}`,
      startSeconds: 0,
      durationSeconds: 2,
      endSeconds: 2,
      requestedMaxDurationSeconds: 2,
      reason: 'Mock render preview assembly preserves the bounded preview source range.',
    },
    privateArtifact: true,
    publicArtifact: false,
    signedUrl: null,
    previewReviewEligible: true,
    finalRenderEligible: false,
  }]
  const previewManifestArtifact = {
    artifactId: `mock-render-preview-manifest-${privateMediaArtifactQaReviewId}`,
    storageProvider: 'local_private',
    storageObjectPath: `edit-execution/${input.workspaceId}/${input.projectId}/${privateMediaArtifactQaReviewId}/render-preview-assembly/mock-render-preview-manifest.json`,
    localFilePath: `/tmp/reeditpro/mock/render-preview-assembly/mock-render-preview-manifest.json`,
    mimeType: 'application/json',
    privateArtifact: true,
    publicArtifact: false,
    signedUrl: null,
    sourceOfTruth: true,
    sourceOfTruthScope: 'render_preview_assembly_private_manifest',
    sha256: 'c'.repeat(64),
    byteSize: 4096,
    clipCount: previewClips.length,
    previewReviewEligible: true,
    finalRenderEligible: false,
  }
  const adapterWorkerArtifactIntegration = input.adapterWorkerArtifactIntegrationId
    ? mockAdapterWorkerArtifactIntegrationsById.get(input.adapterWorkerArtifactIntegrationId)
    : undefined
  if (input.adapterWorkerArtifactIntegrationId && !adapterWorkerArtifactIntegration) {
    return createApiErrorResponse('render_preview_assembly_missing_adapter_integration', 'Stored adapter worker artifact integration is required when adapter integration id is supplied.', {
      statusCode: 409,
      warnings: ['No render preview assembly, media processing, Supabase/GCS write, public artifact, signed URL, or billing mutation was started.'],
      mockOnly: true,
    })
  }
  const fallbackPrivateMediaRunnerQaReview = input.privateMediaRunnerQaReviewId
    ? mockRegisteredAdapterPrivateRunnerQaReviewsById.get(input.privateMediaRunnerQaReviewId)
    : undefined
  const adapterQaSource = adapterWorkerArtifactIntegration ?? fallbackPrivateMediaRunnerQaReview
  const adapterQaArtifacts = Array.isArray(adapterQaSource?.artifacts)
    ? adapterQaSource.artifacts.filter(isPlainObject)
    : []
  const adapterIntegrationManifestArtifact = isPlainObject(adapterWorkerArtifactIntegration?.integrationManifestArtifact)
    ? adapterWorkerArtifactIntegration.integrationManifestArtifact
    : null
  const adapterQaIntegration = adapterQaArtifacts.length
    ? {
        adapterWorkerArtifactIntegrationId: input.adapterWorkerArtifactIntegrationId ?? null,
        privateMediaRunnerQaReviewId: typeof adapterQaSource?.privateMediaRunnerQaReviewId === 'string'
          ? adapterQaSource.privateMediaRunnerQaReviewId
          : input.privateMediaRunnerQaReviewId ?? null,
        registeredRunnerRunId: typeof adapterQaSource?.registeredRunnerRunId === 'string'
          ? adapterQaSource.registeredRunnerRunId
          : 'mock-registered-runner-run',
        boundedAdapterExecutionRunId: typeof adapterQaSource?.boundedAdapterExecutionRunId === 'string'
          ? adapterQaSource.boundedAdapterExecutionRunId
          : 'mock-bounded-adapter-execution-run',
        packageRecordId: typeof adapterQaSource?.packageRecordId === 'string'
          ? adapterQaSource.packageRecordId
          : 'mock-adapter-package',
        approvedPlanSnapshotId: typeof adapterQaSource?.approvedPlanSnapshotId === 'string'
          ? adapterQaSource.approvedPlanSnapshotId
          : `mock-approved-snapshot-${privateMediaArtifactQaReviewId}`,
        creditReservationId: input.creditReservationId,
        status: input.adapterWorkerArtifactIntegrationId
          ? 'adapter_worker_artifact_integration_attached_to_render_preview'
          : 'adapter_private_qa_evidence_attached_to_render_preview',
        renderIntegrationManifestArtifactId: typeof adapterIntegrationManifestArtifact?.artifactId === 'string'
          ? adapterIntegrationManifestArtifact.artifactId
          : null,
        reviewedActivityCount: numberOrZero(adapterQaSource?.reviewedArtifactCount ?? adapterQaSource?.reviewedActivityCount),
        passedActivityCount: numberOrZero(adapterQaSource?.integratedArtifactCount ?? adapterQaSource?.passedActivityCount),
        artifactCount: adapterQaArtifacts.length,
        privateArtifact: true,
        publicArtifact: false,
        signedUrl: null,
        renderPreviewIntegrationReady: true,
        finalRenderDecisionManifestEligible: true,
        mediaTransformOutputEligible: false,
        productRuntimeExecuted: false,
        professionalSkillTrace: isPlainObject(adapterQaSource?.professionalSkillTrace)
          ? adapterQaSource.professionalSkillTrace
          : null,
        artifacts: adapterQaArtifacts.map((artifact) => ({
          artifactId: String(artifact.artifactId ?? 'mock-adapter-qa-artifact'),
          activityExecutionId: String(artifact.activityExecutionId ?? 'mock-private-runner-activity'),
          canonicalToolId: String(artifact.canonicalToolId ?? ''),
          storageProvider: typeof artifact.storageProvider === 'string' ? artifact.storageProvider : 'local_private',
          storageObjectPath: typeof artifact.storageObjectPath === 'string' ? artifact.storageObjectPath : '',
          mimeType: typeof artifact.mimeType === 'string' ? artifact.mimeType : 'application/json',
          sha256: typeof artifact.sha256 === 'string' ? artifact.sha256 : 'd'.repeat(64),
          byteSize: numberOrZero(artifact.byteSize) || 1024,
          sourceOfTruthScope: typeof artifact.sourceOfTruthScope === 'string'
            ? artifact.sourceOfTruthScope
            : 'registered_adapter_private_media_runner_qa_artifact',
          privateArtifact: true,
          publicArtifact: false,
          signedUrl: null,
        })),
      }
    : undefined
  const renderPreviewAssembly = {
    id: `mock-render-preview-assembly-${privateMediaArtifactQaReviewId}`,
    privateMediaArtifactQaReviewId,
    localMediaProcessingExecutionId: `mock-local-media-processing-execution-${privateMediaArtifactQaReviewId}`,
    privateWorkerArtifactQaReviewId: `mock-private-worker-artifact-qa-review-${privateMediaArtifactQaReviewId}`,
    uploadedMediaWorkerExecutionId: `mock-uploaded-media-worker-execution-${privateMediaArtifactQaReviewId}`,
    workflowRehearsalId: `mock-workflow-rehearsal-${privateMediaArtifactQaReviewId}`,
    localWorkerOutputId: `mock-local-worker-output-${privateMediaArtifactQaReviewId}`,
    localWorkerOutputQaReviewId: `mock-local-worker-output-qa-${privateMediaArtifactQaReviewId}`,
    resultReconciliationId: `mock-result-reconciliation-${privateMediaArtifactQaReviewId}`,
    handlerDryRunId: `mock-handler-dry-run-${privateMediaArtifactQaReviewId}`,
    packageRecordId: `mock-package-${privateMediaArtifactQaReviewId}`,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    approvedPlanSnapshotId: `mock-approved-snapshot-${privateMediaArtifactQaReviewId}`,
    creditReservationId: input.creditReservationId,
    status: 'render_preview_assembly_completed_waiting_user_preview_review',
    assemblyOnly: true,
    previewClipCount: previewClips.length,
    privatePreviewArtifactCount: 1,
    mediaArtifactCount: previewClips.length,
    workersStarted: 0,
    workerHandlersStarted: 0,
    toolsExecuted: 0,
    mediaBytesProcessed: false,
    liveExecutionReady: false,
    internalResultReviewReady: true,
    previewReviewReady: true,
    renderPreviewReady: true,
    finalRenderReady: false,
    previewClips,
    ...(adapterQaIntegration ? { adapterQaIntegration } : {}),
    previewManifestArtifact,
    finalRenderReadiness: {
      ready: false,
      reason: 'A private render preview manifest is ready for review, but user preview approval and final export readiness have not passed.',
      previewManifestArtifactId: previewManifestArtifact.artifactId,
      previewClipArtifactIds: previewClips.map((clip) => clip.processedArtifactId),
      userPreviewReviewRequired: true,
    },
    nextRequiredGate: 'user_preview_review',
    blockers: [
      'User/internal preview review has not passed yet.',
      'Final render/export remains blocked until preview review, final render readiness, and final QA pass.',
      'Public delivery, signed URLs, external beta, and production require approved release evidence gates.',
    ],
    userFacingSummary: 'A private preview package is ready for internal review. Final export is still locked until preview review passes.',
    noRuntimeSideEffects: [
      'Mock render preview assembly returns a private manifest contract only.',
      'No media processing, provider call, Supabase/GCS write, signed URL/public artifact, final export, or billing mutation occurred.',
    ],
  }
  mockRenderPreviewAssembliesById.set(String(renderPreviewAssembly.id), renderPreviewAssembly)

  return createApiMockResponse({
    renderPreviewAssembly,
    warnings: [
      'Mock render preview assembly response only.',
      'User preview review and final export remain separate gates.',
    ],
  }, [
    'Mock render preview assembly response only.',
    'User preview review and final export remain separate gates.',
  ])
}

function handleMockApprovedEditExecutionUserPreviewReview(request: ApiRequestEnvelope): ApiResponseEnvelope {
  const input = request.body as {
    workspaceId?: string
    projectId?: string
    creditReservationId?: string
    renderPreviewAssemblyId?: string
    reviewOnly?: boolean
    reviewDecision?: 'approved_for_final_render_readiness' | 'changes_requested'
    reviewerNote?: string
  } | undefined
  const renderPreviewAssemblyId = input?.renderPreviewAssemblyId ?? request.params?.renderPreviewAssemblyId

  if (!input?.workspaceId || !input.projectId || !input.creditReservationId || !renderPreviewAssemblyId || !input.reviewDecision) {
    return createApiErrorResponse('invalid_edit_execution_user_preview_review_input', 'Render preview assembly, review decision, and credit reservation evidence are required.', {
      statusCode: 400,
      warnings: ['No worker handlers, providers, render jobs, media processing, Supabase/GCS writes, or billing mutations were started.'],
      mockOnly: true,
    })
  }

  const approved = input.reviewDecision === 'approved_for_final_render_readiness'
  const renderPreviewAssembly = mockRenderPreviewAssembliesById.get(renderPreviewAssemblyId)
  const adapterQaIntegration = isPlainObject(renderPreviewAssembly?.adapterQaIntegration)
    ? renderPreviewAssembly.adapterQaIntegration
    : null
  const userPreviewReview = {
    id: `mock-user-preview-review-${renderPreviewAssemblyId}`,
    renderPreviewAssemblyId,
    privateMediaArtifactQaReviewId: `mock-private-media-artifact-qa-review-${renderPreviewAssemblyId}`,
    localMediaProcessingExecutionId: `mock-local-media-processing-execution-${renderPreviewAssemblyId}`,
    privateWorkerArtifactQaReviewId: `mock-private-worker-artifact-qa-review-${renderPreviewAssemblyId}`,
    uploadedMediaWorkerExecutionId: `mock-uploaded-media-worker-execution-${renderPreviewAssemblyId}`,
    workflowRehearsalId: `mock-workflow-rehearsal-${renderPreviewAssemblyId}`,
    localWorkerOutputId: `mock-local-worker-output-${renderPreviewAssemblyId}`,
    localWorkerOutputQaReviewId: `mock-local-worker-output-qa-${renderPreviewAssemblyId}`,
    resultReconciliationId: `mock-result-reconciliation-${renderPreviewAssemblyId}`,
    handlerDryRunId: `mock-handler-dry-run-${renderPreviewAssemblyId}`,
    packageRecordId: `mock-package-${renderPreviewAssemblyId}`,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    approvedPlanSnapshotId: `mock-approved-snapshot-${renderPreviewAssemblyId}`,
    creditReservationId: input.creditReservationId,
    status: approved
      ? 'user_preview_review_approved_waiting_final_render_readiness'
      : 'user_preview_review_changes_requested',
    reviewOnly: true,
    reviewDecision: input.reviewDecision,
    reviewerNote: input.reviewerNote,
    previewClipCount: 1,
    privatePreviewArtifactCount: 1,
    mediaArtifactCount: 1,
    workersStarted: 0,
    workerHandlersStarted: 0,
    toolsExecuted: 0,
    mediaBytesProcessed: false,
    liveExecutionReady: false,
    internalResultReviewReady: true,
    previewReviewReady: true,
    renderPreviewReady: true,
    finalRenderReady: false,
    ...(adapterQaIntegration ? { adapterQaIntegration } : {}),
    finalRenderReadiness: {
      ready: false,
      reason: approved
        ? 'Private preview review approved the preview, but final render/export still waits for final render readiness and delivery QA.'
        : 'Private preview review requested changes; a revision plan is required before final render readiness.',
      renderPreviewAssemblyId,
      previewApproved: approved,
      nextReviewRequired: approved ? 'final_render_readiness_review' : 'revision_plan',
    },
    nextRequiredGate: approved ? 'final_render_readiness_review' : 'preview_revision_plan',
    blockers: approved
        ? [
          'Final render readiness review has not passed yet.',
          'Final export and delivery QA remain blocked.',
          'Public delivery, signed URLs, external beta, and production require approved release evidence gates.',
        ]
      : [
          'Preview changes were requested.',
          'A revision plan is required before final render readiness can resume.',
          'Final render/export remains blocked.',
        ],
    userFacingSummary: approved
      ? 'The private preview was approved for final render readiness review.'
      : 'The private preview needs changes before final render can be considered.',
    noRuntimeSideEffects: [
      'Mock user preview review records a private preview decision only.',
      'No media processing, provider call, Supabase/GCS write, signed URL/public artifact, final export, or billing mutation occurred.',
    ],
  }
  mockUserPreviewReviewsById.set(String(userPreviewReview.id), userPreviewReview)

  return createApiMockResponse({
    userPreviewReview,
    warnings: [
      'Mock user preview review response only.',
      'Final render readiness and final export remain separate gates.',
    ],
  }, [
    'Mock user preview review response only.',
    'Final render readiness and final export remain separate gates.',
  ])
}

function handleMockApprovedEditExecutionFinalRenderReadinessReview(request: ApiRequestEnvelope): ApiResponseEnvelope {
  const input = request.body as {
    workspaceId?: string
    projectId?: string
    creditReservationId?: string
    userPreviewReviewId?: string
    readinessReviewOnly?: boolean
  } | undefined
  const userPreviewReviewId = input?.userPreviewReviewId ?? request.params?.userPreviewReviewId

  if (!input?.workspaceId || !input.projectId || !input.creditReservationId || !userPreviewReviewId) {
    return createApiErrorResponse('invalid_edit_execution_final_render_readiness_input', 'User preview review and credit reservation evidence are required.', {
      statusCode: 400,
      warnings: ['No worker handlers, providers, render jobs, media processing, Supabase/GCS writes, or billing mutations were started.'],
      mockOnly: true,
    })
  }

  const userPreviewReview = mockUserPreviewReviewsById.get(userPreviewReviewId)
  const renderPreviewAssemblyId = stringField(userPreviewReview, 'renderPreviewAssemblyId') ?? `mock-render-preview-assembly-${userPreviewReviewId}`
  const adapterQaIntegration = isPlainObject(userPreviewReview?.adapterQaIntegration)
    ? userPreviewReview.adapterQaIntegration
    : null
  const finalRenderReadinessReview = {
    id: `mock-final-render-readiness-review-${userPreviewReviewId}`,
    userPreviewReviewId,
    renderPreviewAssemblyId,
    privateMediaArtifactQaReviewId: `mock-private-media-artifact-qa-review-${userPreviewReviewId}`,
    localMediaProcessingExecutionId: `mock-local-media-processing-execution-${userPreviewReviewId}`,
    privateWorkerArtifactQaReviewId: `mock-private-worker-artifact-qa-review-${userPreviewReviewId}`,
    uploadedMediaWorkerExecutionId: `mock-uploaded-media-worker-execution-${userPreviewReviewId}`,
    workflowRehearsalId: `mock-workflow-rehearsal-${userPreviewReviewId}`,
    localWorkerOutputId: `mock-local-worker-output-${userPreviewReviewId}`,
    localWorkerOutputQaReviewId: `mock-local-worker-output-qa-${userPreviewReviewId}`,
    resultReconciliationId: `mock-result-reconciliation-${userPreviewReviewId}`,
    handlerDryRunId: `mock-handler-dry-run-${userPreviewReviewId}`,
    packageRecordId: `mock-package-${userPreviewReviewId}`,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    approvedPlanSnapshotId: `mock-approved-snapshot-${userPreviewReviewId}`,
    creditReservationId: input.creditReservationId,
    status: 'final_render_readiness_passed_waiting_final_render_execution',
    readinessReviewOnly: true,
    previewApproved: true,
    previewClipCount: 1,
    privatePreviewArtifactCount: 1,
    mediaArtifactCount: 1,
    workersStarted: 0,
    workerHandlersStarted: 0,
    toolsExecuted: 0,
    mediaBytesProcessed: false,
    liveExecutionReady: false,
    internalResultReviewReady: true,
    previewReviewReady: true,
    renderPreviewReady: true,
    finalRenderReady: true,
    finalExportReady: false,
    ...(adapterQaIntegration ? { adapterQaIntegration } : {}),
    finalRenderReadiness: {
      ready: true,
      reason: 'The approved private preview is ready for bounded final render execution. Export delivery still requires render execution and delivery QA.',
      userPreviewReviewId,
      renderPreviewAssemblyId,
      finalRenderExecutionRequired: true,
    },
    nextRequiredGate: 'final_render_execution',
    blockers: [
      'Final render execution has not run yet.',
      'Final delivery QA has not passed yet.',
      'Public delivery, signed URLs, external beta, and production require approved release evidence gates.',
    ],
    userFacingSummary: 'The approved preview is ready for final render execution.',
    noRuntimeSideEffects: [
      'Mock final render readiness review records a readiness decision only.',
      'No render/export, media processing, provider call, Supabase/GCS write, signed URL/public artifact, or billing mutation occurred.',
    ],
  }
  mockFinalRenderReadinessReviewsById.set(String(finalRenderReadinessReview.id), finalRenderReadinessReview)

  return createApiMockResponse({
    finalRenderReadinessReview,
    warnings: [
      'Mock final render readiness response only.',
      'Final render execution and delivery QA remain separate gates.',
    ],
  }, [
    'Mock final render readiness response only.',
    'Final render execution and delivery QA remain separate gates.',
  ])
}

function handleMockApprovedEditExecutionFinalRenderExecution(request: ApiRequestEnvelope): ApiResponseEnvelope {
  const input = request.body as {
    workspaceId?: string
    projectId?: string
    creditReservationId?: string
    finalRenderReadinessReviewId?: string
    renderExecutionOnly?: boolean
  } | undefined
  const finalRenderReadinessReviewId = input?.finalRenderReadinessReviewId ?? request.params?.finalRenderReadinessReviewId

  if (!input?.workspaceId || !input.projectId || !input.creditReservationId || !finalRenderReadinessReviewId) {
    return createApiErrorResponse('invalid_edit_execution_final_render_input', 'Final render readiness and credit reservation evidence are required.', {
      statusCode: 400,
      warnings: ['No worker handlers, providers, render jobs, media processing, Supabase/GCS writes, or billing mutations were started.'],
      mockOnly: true,
    })
  }

  const finalRenderReadinessReview = mockFinalRenderReadinessReviewsById.get(finalRenderReadinessReviewId)
  const renderPreviewAssemblyId = stringField(finalRenderReadinessReview, 'renderPreviewAssemblyId') ?? `mock-render-preview-assembly-${finalRenderReadinessReviewId}`
  const adapterQaIntegration = isPlainObject(finalRenderReadinessReview?.adapterQaIntegration)
    ? finalRenderReadinessReview.adapterQaIntegration
    : null
  const finalRenderArtifact = {
    artifactId: `mock-final-render-artifact-${finalRenderReadinessReviewId}`,
    storageProvider: 'local_private',
    storageObjectPath: `edit-execution/${input.workspaceId}/${input.projectId}/${finalRenderReadinessReviewId}/final-render-execution/mock-final-render.mp4`,
    localFilePath: `/tmp/reeditpro/mock/final-render-execution/mock-final-render.mp4`,
    mimeType: 'video/mp4',
    privateArtifact: true,
    publicArtifact: false,
    signedUrl: null,
    sourceOfTruth: true,
    sourceOfTruthScope: 'final_render_execution_private_artifact',
    mediaArtifact: true,
    finalRenderArtifact: true,
    sha256: 'd'.repeat(64),
    byteSize: 8192,
    commandSummary: {
      tool: 'ffmpeg',
      mode: 'concat_copy',
      inputCount: 1,
      videoCodec: 'copy',
      audioMode: 'copy',
      audioPolish: {
        applied: false,
        source: 'mock_final_render_contract_only',
        targetIntegratedLufs: -16,
        truePeakDb: -1.5,
        loudnessRangeLufs: 11,
        limiter: false,
        filterChain: [],
      },
      reviewOverlayCount: 0,
      approvedFinalTimingCount: 0,
      approvedFinalTimelineDurationSeconds: 0,
      approvedCaptionOverlayCount: 0,
      approvedTransitionPolishCount: 0,
    },
    editDecisionManifest: createMockProfessionalEditDecisionManifest({
      approvedPlanSnapshotId: `mock-approved-snapshot-${finalRenderReadinessReviewId}`,
      creditReservationId: input.creditReservationId,
      renderPreviewAssemblyId,
      finalRenderArtifactId: `mock-final-render-artifact-${finalRenderReadinessReviewId}`,
      adapterQaIntegration,
    }),
    editDecisionManifestArtifact: createMockProfessionalEditDecisionManifestArtifact({
      finalRenderArtifactId: `mock-final-render-artifact-${finalRenderReadinessReviewId}`,
    }),
    deliveryQaRequired: true,
    finalDeliveryEligible: false,
  }
  const finalRenderExecution = {
    id: `mock-final-render-execution-${finalRenderReadinessReviewId}`,
    finalRenderReadinessReviewId,
    userPreviewReviewId: `mock-user-preview-review-${finalRenderReadinessReviewId}`,
    renderPreviewAssemblyId,
    privateMediaArtifactQaReviewId: `mock-private-media-artifact-qa-review-${finalRenderReadinessReviewId}`,
    localMediaProcessingExecutionId: `mock-local-media-processing-execution-${finalRenderReadinessReviewId}`,
    privateWorkerArtifactQaReviewId: `mock-private-worker-artifact-qa-review-${finalRenderReadinessReviewId}`,
    uploadedMediaWorkerExecutionId: `mock-uploaded-media-worker-execution-${finalRenderReadinessReviewId}`,
    workflowRehearsalId: `mock-workflow-rehearsal-${finalRenderReadinessReviewId}`,
    localWorkerOutputId: `mock-local-worker-output-${finalRenderReadinessReviewId}`,
    localWorkerOutputQaReviewId: `mock-local-worker-output-qa-${finalRenderReadinessReviewId}`,
    resultReconciliationId: `mock-result-reconciliation-${finalRenderReadinessReviewId}`,
    handlerDryRunId: `mock-handler-dry-run-${finalRenderReadinessReviewId}`,
    packageRecordId: `mock-package-${finalRenderReadinessReviewId}`,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    approvedPlanSnapshotId: `mock-approved-snapshot-${finalRenderReadinessReviewId}`,
    creditReservationId: input.creditReservationId,
    status: 'final_render_execution_completed_waiting_delivery_qa',
    renderExecutionOnly: true,
    previewClipCount: 1,
    finalRenderArtifactCount: 1,
    mediaArtifactCount: 1,
    workersStarted: 0,
    workerHandlersStarted: 1,
    toolsExecuted: 1,
    mediaBytesProcessed: true,
    liveExecutionReady: false,
    internalResultReviewReady: true,
    previewReviewReady: true,
    renderPreviewReady: true,
    finalRenderReady: true,
    finalExportReady: false,
    finalRenderArtifact,
    finalDeliveryReadiness: {
      ready: false,
      reason: 'A private final-render candidate exists, but delivery QA and public/export release checks have not passed.',
      finalRenderArtifactId: finalRenderArtifact.artifactId,
      deliveryQaRequired: true,
    },
    nextRequiredGate: 'final_delivery_qa',
    blockers: [
      'Final delivery QA has not passed yet.',
      'Public delivery and signed URLs remain blocked.',
      'External beta and production require approved release evidence gates.',
    ],
    userFacingSummary: 'A private final-render candidate was created for delivery QA.',
    noRuntimeSideEffects: [
      'Mock final render execution returns a private final-render artifact contract only.',
      'No provider call, Supabase/GCS write, signed URL/public artifact, external beta, production delivery, or billing mutation occurred.',
    ],
  }
  mockFinalRenderExecutionsById.set(String(finalRenderExecution.id), finalRenderExecution)

  return createApiMockResponse({
    finalRenderExecution,
    warnings: [
      'Mock final render execution response only.',
      'Delivery QA and public/export release remain separate gates.',
    ],
  }, [
    'Mock final render execution response only.',
    'Delivery QA and public/export release remain separate gates.',
  ])
}

function handleMockApprovedEditExecutionFinalDeliveryQaReview(request: ApiRequestEnvelope): ApiResponseEnvelope {
  const input = request.body as {
    workspaceId?: string
    projectId?: string
    creditReservationId?: string
    finalRenderExecutionId?: string
    qaReviewOnly?: boolean
  } | undefined
  const finalRenderExecutionId = input?.finalRenderExecutionId ?? request.params?.finalRenderExecutionId

  if (!input?.workspaceId || !input.projectId || !input.creditReservationId || !finalRenderExecutionId) {
    return createApiErrorResponse('invalid_edit_execution_final_delivery_qa_input', 'Final render execution and credit reservation evidence are required.', {
      statusCode: 400,
      warnings: ['No worker handlers, providers, render jobs, media processing, Supabase/GCS writes, or billing mutations were started.'],
      mockOnly: true,
    })
  }

  const storedFinalRenderExecution = mockFinalRenderExecutionsById.get(finalRenderExecutionId)
  const finalRenderArtifact = isPlainObject(storedFinalRenderExecution?.finalRenderArtifact)
    ? storedFinalRenderExecution.finalRenderArtifact
    : {
        artifactId: `mock-final-render-artifact-${finalRenderExecutionId}`,
        storageProvider: 'local_private',
        storageObjectPath: `edit-execution/${input.workspaceId}/${input.projectId}/${finalRenderExecutionId}/final-render-execution/mock-final-render.mp4`,
        localFilePath: `/tmp/reeditpro/mock/final-render-execution/mock-final-render.mp4`,
        mimeType: 'video/mp4',
        privateArtifact: true,
        publicArtifact: false,
        signedUrl: null,
        sourceOfTruth: true,
        sourceOfTruthScope: 'final_render_execution_private_artifact',
        mediaArtifact: true,
        finalRenderArtifact: true,
        sha256: 'd'.repeat(64),
        byteSize: 8192,
        commandSummary: {
          tool: 'ffmpeg',
          mode: 'concat_copy',
          inputCount: 1,
          videoCodec: 'copy',
          audioMode: 'copy',
          audioPolish: {
            applied: false,
            source: 'mock_final_render_contract_only',
            targetIntegratedLufs: -16,
            truePeakDb: -1.5,
            loudnessRangeLufs: 11,
            limiter: false,
            filterChain: [],
          },
          reviewOverlayCount: 0,
          approvedFinalTimingCount: 0,
          approvedFinalTimelineDurationSeconds: 0,
          approvedCaptionOverlayCount: 0,
          approvedTransitionPolishCount: 0,
        },
        editDecisionManifest: createMockProfessionalEditDecisionManifest({
          approvedPlanSnapshotId: `mock-approved-snapshot-${finalRenderExecutionId}`,
          creditReservationId: input.creditReservationId,
          renderPreviewAssemblyId: `mock-render-preview-assembly-${finalRenderExecutionId}`,
          finalRenderArtifactId: `mock-final-render-artifact-${finalRenderExecutionId}`,
        }),
        editDecisionManifestArtifact: createMockProfessionalEditDecisionManifestArtifact({
          finalRenderArtifactId: `mock-final-render-artifact-${finalRenderExecutionId}`,
        }),
        deliveryQaRequired: true,
        finalDeliveryEligible: false,
      }
  const releaseReadiness = createMockApprovedExecutionReleaseReadiness({
    privateInternalReady: true,
  })
  const finalDeliveryQaReview = {
    id: `mock-final-delivery-qa-review-${finalRenderExecutionId}`,
    finalRenderExecutionId,
    finalRenderReadinessReviewId: `mock-final-render-readiness-review-${finalRenderExecutionId}`,
    userPreviewReviewId: `mock-user-preview-review-${finalRenderExecutionId}`,
    renderPreviewAssemblyId: stringField(storedFinalRenderExecution, 'renderPreviewAssemblyId') ?? `mock-render-preview-assembly-${finalRenderExecutionId}`,
    privateMediaArtifactQaReviewId: `mock-private-media-artifact-qa-review-${finalRenderExecutionId}`,
    localMediaProcessingExecutionId: `mock-local-media-processing-execution-${finalRenderExecutionId}`,
    privateWorkerArtifactQaReviewId: `mock-private-worker-artifact-qa-review-${finalRenderExecutionId}`,
    uploadedMediaWorkerExecutionId: `mock-uploaded-media-worker-execution-${finalRenderExecutionId}`,
    workflowRehearsalId: `mock-workflow-rehearsal-${finalRenderExecutionId}`,
    localWorkerOutputId: `mock-local-worker-output-${finalRenderExecutionId}`,
    localWorkerOutputQaReviewId: `mock-local-worker-output-qa-${finalRenderExecutionId}`,
    resultReconciliationId: `mock-result-reconciliation-${finalRenderExecutionId}`,
    handlerDryRunId: `mock-handler-dry-run-${finalRenderExecutionId}`,
    packageRecordId: `mock-package-${finalRenderExecutionId}`,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    approvedPlanSnapshotId: `mock-approved-snapshot-${finalRenderExecutionId}`,
    creditReservationId: input.creditReservationId,
    status: 'final_delivery_qa_passed_ready_for_private_internal_download',
    qaReviewOnly: true,
    finalArtifactQaPassed: true,
    privateInternalDownloadReady: true,
    publicDeliveryReady: releaseReadiness.publicDeliveryReady,
    externalBetaReady: releaseReadiness.externalBetaReady,
    productionReady: releaseReadiness.productionReady,
    finalExportReady: true,
    finalRenderArtifactCount: 1,
    mediaArtifactCount: 1,
    workersStarted: 0,
    workerHandlersStarted: 0,
    toolsExecuted: 0,
    mediaBytesProcessed: false,
    liveExecutionReady: false,
    renderPreviewReady: true,
    finalRenderReady: true,
    qaChecks: [
      { check: 'private_final_render_artifact', passed: true, message: 'Final artifact is a private local final-render artifact.' },
      { check: 'local_file_exists', passed: true, message: 'Final artifact exists as a local private file and byte size matches metadata.' },
      { check: 'checksum_matches', passed: true, message: 'Final artifact checksum matches metadata.' },
      { check: 'no_signed_url', passed: true, message: 'Final artifact does not expose signed URLs or public URL paths.' },
      { check: 'no_public_artifact', passed: true, message: 'Final artifact is not marked public.' },
      { check: 'delivery_scope_private_internal', passed: true, message: 'Final artifact is approved only for private internal download/testing until release gates pass.' },
      { check: 'professional_edit_decision_manifest_present', passed: true, message: 'Final artifact carries a private edit decision manifest.' },
    ],
    professionalEditQaSummary: createMockProfessionalEditQaSummary(),
    finalRenderArtifact,
    nextRequiredGate: 'private_internal_download_delivery',
    blockers: [
      'Private internal download delivery must be created before the final file can be streamed.',
      'Public delivery and signed URLs remain blocked.',
      'External beta and production require approved release evidence gates.',
    ],
    userFacingSummary: 'The final video passed private delivery QA and is ready for internal testing download.',
    noRuntimeSideEffects: [
      'Mock final delivery QA records private internal testing readiness only.',
      'No media processing, provider call, Supabase/GCS write, signed URL/public artifact, external beta, production delivery, or billing mutation occurred.',
    ],
  }
  mockFinalDeliveryQaReviewsById.set(String(finalDeliveryQaReview.id), finalDeliveryQaReview)

  return createApiMockResponse({
    finalDeliveryQaReview,
    warnings: [
      'Mock final delivery QA response only.',
      'Public delivery, signed URLs, external beta, and production require release gates.',
    ],
  }, [
    'Mock final delivery QA response only.',
    'Public delivery, signed URLs, external beta, and production require release gates.',
  ])
}

function handleMockApprovedEditExecutionPrivateInternalDownloadDelivery(request: ApiRequestEnvelope): ApiResponseEnvelope {
  const input = request.body as {
    workspaceId?: string
    projectId?: string
    creditReservationId?: string
    finalDeliveryQaReviewId?: string
    deliveryOnly?: boolean
  } | undefined
  const finalDeliveryQaReviewId = input?.finalDeliveryQaReviewId ?? request.params?.finalDeliveryQaReviewId

  if (!input?.workspaceId || !input.projectId || !input.creditReservationId || !finalDeliveryQaReviewId) {
    return createApiErrorResponse('invalid_edit_execution_private_internal_download_delivery_input', 'Final delivery QA review and credit reservation evidence are required.', {
      statusCode: 400,
      warnings: ['No worker handlers, providers, render jobs, media processing, Supabase/GCS writes, signed URLs, public artifacts, or billing mutations were started.'],
      mockOnly: true,
    })
  }

  const id = `mock-private-internal-download-delivery-${finalDeliveryQaReviewId}`
  const finalDeliveryQaReview = mockFinalDeliveryQaReviewsById.get(finalDeliveryQaReviewId)
  const finalRenderArtifact = isPlainObject(finalDeliveryQaReview?.finalRenderArtifact)
    ? finalDeliveryQaReview.finalRenderArtifact
    : {
        artifactId: `mock-final-render-artifact-${finalDeliveryQaReviewId}`,
        storageProvider: 'local_private',
        storageObjectPath: `edit-execution/${input.workspaceId}/${input.projectId}/${finalDeliveryQaReviewId}/final-render-execution/mock-final-render.mp4`,
        localFilePath: `/tmp/reeditpro/mock/final-render-execution/mock-final-render.mp4`,
        mimeType: 'video/mp4',
        privateArtifact: true,
        publicArtifact: false,
        signedUrl: null,
        sourceOfTruth: true,
        sourceOfTruthScope: 'final_render_execution_private_artifact',
        mediaArtifact: true,
        finalRenderArtifact: true,
        sha256: 'd'.repeat(64),
        byteSize: 8192,
        commandSummary: {
          tool: 'ffmpeg',
          mode: 'concat_copy',
          inputCount: 1,
          videoCodec: 'copy',
          audioMode: 'copy',
          audioPolish: {
            applied: false,
            source: 'mock_final_render_contract_only',
            targetIntegratedLufs: -16,
            truePeakDb: -1.5,
            loudnessRangeLufs: 11,
            limiter: false,
            filterChain: [],
          },
          reviewOverlayCount: 0,
          approvedFinalTimingCount: 0,
          approvedFinalTimelineDurationSeconds: 0,
          approvedCaptionOverlayCount: 0,
          approvedTransitionPolishCount: 0,
        },
        editDecisionManifest: createMockProfessionalEditDecisionManifest({
          approvedPlanSnapshotId: `mock-approved-snapshot-${finalDeliveryQaReviewId}`,
          creditReservationId: input.creditReservationId,
          renderPreviewAssemblyId: `mock-render-preview-assembly-${finalDeliveryQaReviewId}`,
          finalRenderArtifactId: `mock-final-render-artifact-${finalDeliveryQaReviewId}`,
        }),
        editDecisionManifestArtifact: createMockProfessionalEditDecisionManifestArtifact({
          finalRenderArtifactId: `mock-final-render-artifact-${finalDeliveryQaReviewId}`,
        }),
        deliveryQaRequired: true,
        finalDeliveryEligible: false,
      }
  const releaseReadiness = createMockApprovedExecutionReleaseReadiness({
    privateInternalReady: true,
  })

  return createApiMockResponse({
    privateInternalDownloadDelivery: {
      id,
      finalDeliveryQaReviewId,
      finalRenderExecutionId: stringField(finalDeliveryQaReview, 'finalRenderExecutionId') ?? `mock-final-render-execution-${finalDeliveryQaReviewId}`,
      finalRenderReadinessReviewId: `mock-final-render-readiness-review-${finalDeliveryQaReviewId}`,
      userPreviewReviewId: `mock-user-preview-review-${finalDeliveryQaReviewId}`,
      renderPreviewAssemblyId: stringField(finalDeliveryQaReview, 'renderPreviewAssemblyId') ?? `mock-render-preview-assembly-${finalDeliveryQaReviewId}`,
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      approvedPlanSnapshotId: `mock-approved-snapshot-${finalDeliveryQaReviewId}`,
      creditReservationId: input.creditReservationId,
      status: 'private_internal_download_delivery_ready',
      deliveryOnly: true,
      privateInternalDownloadReady: true,
      publicDeliveryReady: releaseReadiness.publicDeliveryReady,
      externalBetaReady: releaseReadiness.externalBetaReady,
      productionReady: releaseReadiness.productionReady,
      finalExportReady: true,
      internalDownloadPath: `/v1/edit-executions/private-internal-downloads/${id}/file`,
      internalManifestPath: `/v1/edit-executions/private-internal-downloads/${id}/manifest`,
      professionalEditQaSummary: createMockProfessionalEditQaSummary(),
      finalRenderArtifact,
      workersStarted: 0,
      workerHandlersStarted: 0,
      toolsExecuted: 0,
      mediaBytesProcessed: false,
      liveExecutionReady: false,
      nextRequiredGate: 'external_beta_or_production_release_gates',
      userFacingSummary: 'The final video is ready for authenticated private internal download/testing.',
      backendHandoffSummary: 'Mock private internal download delivery records an authenticated local-file route only; public delivery remains blocked.',
      blockers: [
        'Public delivery and signed URLs remain blocked.',
        'External beta and production release require approved launch evidence gates.',
        'Persistent storage ACLs and deployed delivery readback are not enabled by this mock-safe gate.',
      ],
      noRuntimeSideEffects: [
        'Mock private internal download delivery returns an authenticated private route contract only.',
        'No media processing, provider call, Supabase/GCS write, signed URL/public artifact, external beta, production delivery, or billing mutation occurred.',
      ],
    },
    warnings: [
      'Mock private internal download delivery response only.',
      'Public delivery, signed URLs, external beta, and production require release gates.',
    ],
  }, [
    'Mock private internal download delivery response only.',
    'Public delivery, signed URLs, external beta, and production require release gates.',
  ])
}

function handleMockSourceSequenceUploadFlow(request: ApiRequestEnvelope): ApiResponseEnvelope {
  const input = request.body as {
    workspaceId?: string
    projectId?: string
    chatSessionId?: string
    uploads?: SourceUploadFlowItem[]
  } | undefined

  if (input?.workspaceId && input.projectId && input.uploads?.length) {
    const sourceSequenceRecords = createSourceUploadFlow({
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      chatSessionId: input.chatSessionId,
      uploads: input.uploads,
    })
    const firstUploadPlan = input.uploads[0]?.uploadPlan

    return createApiMockResponse({
      uploadPlan: firstUploadPlan,
      validation: {
        ok: sourceSequenceRecords.ok,
        status: sourceSequenceRecords.ok ? 'valid' : 'blocked',
        maxBytes: 0,
        warnings: sourceSequenceRecords.warnings,
        message: sourceSequenceRecords.message,
      },
      sourceSequenceRecords,
      nextStep: sourceSequenceRecords.nextStep,
      warnings: sourceSequenceRecords.warnings,
    }, sourceSequenceRecords.warnings)
  }

  const result = runMockSourceSequenceUploadFlow()
  return createApiMockResponse(result, result.warnings)
}

function handleMockMediaAssetCreate(request: ApiRequestEnvelope): ApiResponseEnvelope {
  const input = request.body as { uploadPlan?: UploadPlan } | undefined
  const uploadPlan = input?.uploadPlan ?? runMockUploadReadinessFlow().uploadPlan

  if (!uploadPlan) {
    return createApiErrorResponse('missing_upload_plan', 'Mock media asset creation requires an upload plan.', {
      statusCode: 400,
      mockOnly: true,
    })
  }

  const result = createMediaAssetRecordFromUploadPlan(uploadPlan)
  return createApiMockResponse(result, result.warnings)
}

function handleMockReferenceAssetCreate(request: ApiRequestEnvelope): ApiResponseEnvelope {
  const input = request.body as { uploadPlan?: UploadPlan } | undefined
  const uploadPlan = input?.uploadPlan ?? runMockReferenceMediaUploadFlow().uploadPlan

  if (!uploadPlan) {
    return createApiErrorResponse('missing_upload_plan', 'Mock reference asset creation requires an upload plan.', {
      statusCode: 400,
      mockOnly: true,
    })
  }

  const result = createReferenceAssetRecordFromUploadPlan(uploadPlan)
  return createApiMockResponse(result, result.warnings)
}

function handleStorageClientStatus(): ApiResponseEnvelope {
  return createApiMockResponse(getStorageClientStatus())
}

function handleStorageObjectPathCreate(request: ApiRequestEnvelope): ApiResponseEnvelope {
  const input = request.body as (StoragePathBuildInput & { purpose?: UploadPurpose }) | undefined

  if (!input?.purpose || !input.workspaceId || !input.assetId || !input.fileName) {
    return createApiErrorResponse('invalid_storage_path_input', 'Storage path creation requires purpose, workspace, asset, and file name.', {
      statusCode: 400,
      warnings: ['No storage object was created.'],
      mockOnly: true,
    })
  }

  const objectPath = buildStoragePathForUploadPurpose(input.purpose, input)
  return createApiMockResponse({
    purpose: input.purpose,
    objectPath,
  })
}

function handleMockChatNativePlanning(request: ApiRequestEnvelope): ApiResponseEnvelope {
  const db = createMockDatabase()
  const result = runChatNativeEditPlanningFlow(request.body as ChatNativePlanningInput | undefined, db)

  if (!result.ok) {
    return createApiErrorResponse(result.error.code, result.error.message, {
      details: result.error.details,
      mockOnly: true,
    })
  }

  return createApiMockResponse(result.data, result.warnings)
}

function handleMockCreditEstimate(request: ApiRequestEnvelope): ApiResponseEnvelope {
  const planningResponse = handleMockChatNativePlanning(request)

  if (!planningResponse.ok || !planningResponse.data) return planningResponse

  const planningState = planningResponse.data as { creditEstimate?: unknown }
  return createApiMockResponse(
    {
      creditEstimate: planningState.creditEstimate,
      nextStep: 'approve_plan_and_credits',
    },
    ['Credit estimate is mock-only and does not reserve, spend, or refund credits.'],
  )
}

function handleMockCreditGateCheck(): ApiResponseEnvelope {
  const result = runMockCreditGateAllowedFlow()
  return createApiMockResponse(result, result.warnings)
}

function handleMockToolCostEstimate(request: ApiRequestEnvelope): ApiResponseEnvelope {
  const body = asRecord(request.body)
  const secretPath = findSecretLikeToolCostPath(body)
  if (secretPath) {
    return createApiErrorResponse(
      'tool_cost_secret_like_payload_rejected',
      'Tool-cost estimates must not include secrets, signed URLs, raw prompts, or credential-like payloads.',
      {
        statusCode: 400,
        details: { path: secretPath },
        warnings: ['No cost estimate was created and no backend, billing, provider, worker, or render call was attempted.'],
        mockOnly: true,
      },
    )
  }

  const estimate = createMockToolCostEstimate(request)

  return createApiMockResponse(
    {
      estimate,
      rateCardVersion: estimate.rateCardVersion,
      serviceFeeIncluded: false,
      mockOnly: true,
    },
    [
      'Mock tool-cost estimate only; no event, wallet mutation, ledger write, Stripe operation, provider call, worker, render, export, or production billing mutation occurred.',
      'Tool-owner cost estimates exclude ReEditPro service fees.',
      estimate.creditPrerequisiteStatus === 'ready'
        ? 'Tool-cost prerequisites are ready for a later idempotent event write.'
        : `Tool-cost event emission remains blocked by ${estimate.creditPrerequisiteStatus}.`,
    ],
  )
}

function handleMockToolCostEventCreate(request: ApiRequestEnvelope): ApiResponseEnvelope {
  const body = asRecord(request.body)
  const idempotencyKey = request.idempotencyKey ?? stringField(body, 'idempotencyKey')
  if (!idempotencyKey) {
    return createApiErrorResponse('idempotency_key_required', 'Tool-cost event writes require an idempotency key.', {
      statusCode: 400,
      warnings: ['No cost event was created and no billing mutation occurred.'],
      mockOnly: true,
    })
  }

  const secretPath = findSecretLikeToolCostPath(body)
  if (secretPath) {
    return createApiErrorResponse(
      'tool_cost_secret_like_payload_rejected',
      'Tool-cost events must not include secrets, signed URLs, raw prompts, or credential-like payloads.',
      {
        statusCode: 400,
        details: { path: secretPath },
        warnings: ['No cost event was created and no backend billing mutation occurred.'],
        mockOnly: true,
      },
    )
  }

  const duplicate = mockToolCostEventsByIdempotencyKey.get(idempotencyKey)
  if (duplicate) {
    return createApiMockResponse(
      {
        event: duplicate,
        toolCostEvent: duplicate,
        estimate: createMockToolCostEstimate(request),
        idempotencyStatus: 'duplicate_returned',
        serviceFeeIncluded: false,
        mockOnly: true,
      },
      [
        'Duplicate mock tool-cost event idempotency key replayed the original event without double charging.',
        'Tool-owner cost events exclude ReEditPro service fees.',
      ],
    )
  }

  const estimate = createMockToolCostEstimate(request)
  if (estimate.creditPrerequisiteStatus !== 'ready') {
    return createApiErrorResponse(
      'tool_cost_credit_prerequisite_failed',
      'Tool-cost event emission is blocked until approved plan, approved estimate, active reservation, and reservation limit evidence exist.',
      {
        statusCode: 409,
        details: {
          creditPrerequisiteStatus: estimate.creditPrerequisiteStatus,
          missingPrerequisites: estimate.missingPrerequisites,
        },
        warnings: ['No cost event was created and no billing mutation occurred.'],
        mockOnly: true,
      },
    )
  }

  const event = createMockToolCostEvent(request, estimate, idempotencyKey)
  mockToolCostEventsByIdempotencyKey.set(idempotencyKey, event)

  return createApiMockResponse(
    {
      event,
      toolCostEvent: event,
      estimate,
      idempotencyStatus: 'inserted',
      serviceFeeIncluded: false,
      mockOnly: true,
    },
    [
      'Mock tool-cost event inserted in local memory only; no wallet, ledger, Stripe, Supabase, provider, worker, render, export, or production billing mutation occurred.',
      'Tool-owner cost events exclude ReEditPro service fees.',
    ],
  )
}

function handleMockToolCostSummaryGet(request: ApiRequestEnvelope): ApiResponseEnvelope {
  const projectId = request.params?.projectId ?? request.context.projectId ?? 'mock-project'
  const workspaceId = request.query?.workspaceId ?? request.context.workspaceId
  const events = Array.from(mockToolCostEventsByIdempotencyKey.values()).filter((event) =>
    event.projectId === projectId &&
    (workspaceId === undefined || event.workspaceId === workspaceId)
  )
  const lines = createMockToolCostSummaryLines(events)

  return createApiMockResponse(
    {
      workspaceId: workspaceId ?? null,
      projectId,
      eventCount: events.length,
      billableEventCount: events.filter((event) => event.billableToUser).length,
      nonBillableEventCount: events.filter((event) => !event.billableToUser).length,
      actualBillableCostCredits: roundMoney(events.filter((event) => event.billableToUser).reduce((sum, event) => sum + event.toolCostCredits, 0)),
      nonBillableCredits: roundMoney(events.filter((event) => !event.billableToUser).reduce((sum, event) => sum + event.toolCostCredits, 0)),
      userFacingLines: lines,
      events,
      serviceFeeIncluded: false,
      mockOnly: true,
    },
    [
      'Mock project tool-cost summary is read-only and local to the browser/mock router.',
      'Tool-owner cost summaries exclude ReEditPro service fees and do not mutate billing state.',
    ],
  )
}

function createMockToolCostEstimate(request: ApiRequestEnvelope): Record<string, unknown> & {
  estimateId: string
  rateCardVersion: string
  creditPrerequisiteStatus: string
  missingPrerequisites: string[]
  expectedCredits: number
  highCredits: number
  serviceFeeIncluded: false
} {
  const body = asRecord(request.body)
  const toolId = stringField(body, 'toolId') ?? 'opentimelineio'
  const workspaceId = stringField(body, 'workspaceId') ?? request.context.workspaceId ?? 'mock-workspace'
  const projectId = stringField(body, 'projectId') ?? request.context.projectId ?? 'mock-project'
  const expectedCredits = normalizeMockToolCostCredits(numberField(body, 'expectedCredits') ?? numberField(body, 'estimatedCredits'))
  const lowCredits = roundMoney(Math.max(1, expectedCredits * 0.8))
  const highCredits = roundMoney(Math.max(expectedCredits, numberField(body, 'highCredits') ?? expectedCredits * 1.25))
  const reservationRemaining = numberField(body, 'approvedReservationRemainingCredits') ?? highCredits
  const prerequisiteChecks: Array<[string, string | undefined]> = [
    ['approved_plan_snapshot', stringField(body, 'approvedPlanSnapshotId')],
    ['approved_credit_estimate', stringField(body, 'creditEstimateId')],
    ['active_credit_reservation', stringField(body, 'creditReservationId')],
  ]
  const missingPrerequisites = prerequisiteChecks
    .filter(([, value]) => !value)
    .map(([name]) => name)
  const creditPrerequisiteStatus = deriveMockToolCostPrerequisiteStatus(missingPrerequisites, highCredits, reservationRemaining)

  return {
    estimateId: `mock_tool_cost_estimate_${safeId(projectId)}_${safeId(toolId)}`,
    workspaceId,
    projectId,
    toolId,
    usageCategory: inferMockToolCostUsageCategory(toolId),
    rateCardVersion: 'tool-metering-v1-2026-06-26',
    lowCredits,
    expectedCredits,
    highCredits,
    lowCostCents: lowCredits * 10,
    expectedCostCents: expectedCredits * 10,
    highCostCents: highCredits * 10,
    creditPrerequisiteStatus,
    missingPrerequisites,
    approvedReservationRemainingCredits: reservationRemaining,
    reservationLimitExceeded: highCredits > reservationRemaining,
    billableToUser: true,
    serviceFeeIncluded: false,
    mockOnly: true,
    warnings: [
      'Mock frontend-safe tool-cost estimate only.',
      'ReEditPro service fee is excluded from tool-owner cost math.',
      creditPrerequisiteStatus === 'ready'
        ? 'Mock estimate has the approved plan, approved estimate, and reservation evidence needed before an event write.'
        : `Mock estimate is informational until ${creditPrerequisiteStatus} is resolved.`,
    ],
  }
}

function deriveMockToolCostPrerequisiteStatus(
  missingPrerequisites: readonly string[],
  highCredits: number,
  reservationRemaining: number,
): string {
  if (missingPrerequisites.includes('approved_plan_snapshot')) return 'missing_approved_plan'
  if (missingPrerequisites.includes('approved_credit_estimate')) return 'missing_approved_credit_estimate'
  if (missingPrerequisites.includes('active_credit_reservation')) return 'missing_active_credit_reservation'
  if (highCredits > reservationRemaining) return 'requires_revised_estimate'
  return 'ready'
}

function createMockToolCostEvent(
  request: ApiRequestEnvelope,
  estimate: Record<string, unknown> & {
    expectedCredits: number
  },
  idempotencyKey: string,
): MockToolCostEventRecord {
  const body = asRecord(request.body)
  const toolId = stringField(body, 'toolId') ?? stringField(estimate, 'toolId') ?? 'opentimelineio'
  const workspaceId = stringField(body, 'workspaceId') ?? request.context.workspaceId ?? stringField(estimate, 'workspaceId') ?? 'mock-workspace'
  const projectId = stringField(body, 'projectId') ?? request.context.projectId ?? stringField(estimate, 'projectId') ?? 'mock-project'
  const billableToUser = body?.billableToUser === false ? false : true
  const credits = normalizeMockToolCostCredits(numberField(body, 'actualCredits') ?? numberField(body, 'toolCostCredits') ?? estimate.expectedCredits)

  return {
    id: `mock_tool_cost_event_${safeId(projectId)}_${safeId(idempotencyKey)}`,
    workspaceId,
    projectId,
    toolId,
    usageCategory: inferMockToolCostUsageCategory(toolId),
    toolCostCredits: credits,
    credits,
    actualCostCents: credits * 10,
    billableToUser,
    idempotencyKey,
    rateCardVersion: stringField(estimate, 'rateCardVersion') ?? 'tool-metering-v1-2026-06-26',
    pricingSnapshot: {
      source: 'frontend_safe_mock_tool_cost_metering',
      serviceFeeIncluded: false,
    },
    metadata: {
      mockOnly: true,
      serviceFeeIncluded: false,
    },
    serviceFeeIncluded: false,
    createdAt: new Date(0).toISOString(),
  }
}

function createMockToolCostSummaryLines(events: readonly MockToolCostEventRecord[]): Array<{
  label: string
  credits: number
  eventCount: number
}> {
  return [
    mockToolCostSummaryLine('Transcription', events, ['transcription']),
    mockToolCostSummaryLine('Media analysis', events, ['media_analysis']),
    mockToolCostSummaryLine('Captions', events, ['captions']),
    mockToolCostSummaryLine('Stroke Motion', events, ['stroke_motion']),
    mockToolCostSummaryLine('Graphic Design', events, ['graphic_design']),
    mockToolCostSummaryLine('Real Motion', events, ['real_motion']),
    mockToolCostSummaryLine('SoundSync', events, ['soundsync']),
    mockToolCostSummaryLine('Rendering/export', events, ['rendering', 'render_export']),
    mockToolCostSummaryLine('Other tools', events, ['other', 'basic_edit', 'pro_edit', 'signature_edit', 'premium_signature_edit', 'revision', 'admin']),
  ]
}

function mockToolCostSummaryLine(
  label: string,
  events: readonly MockToolCostEventRecord[],
  categories: readonly string[],
): { label: string; credits: number; eventCount: number } {
  const matchingEvents = events.filter((event) => categories.includes(event.usageCategory))
  return {
    label,
    credits: roundMoney(matchingEvents.reduce((sum, event) => sum + event.toolCostCredits, 0)),
    eventCount: matchingEvents.length,
  }
}

function normalizeMockToolCostCredits(value: number | undefined): number {
  if (!value || !Number.isFinite(value) || value <= 0) return 1
  return roundMoney(Math.ceil(value * 100) / 100)
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100
}

function inferMockToolCostUsageCategory(toolId: string): string {
  const normalized = toolId.toLowerCase()
  if (normalized.includes('whisper') || normalized.includes('speech') || normalized.includes('transcript')) return 'transcription'
  if (normalized.includes('caption') || normalized.includes('subtitle')) return 'captions'
  if (normalized.includes('stroke')) return 'stroke_motion'
  if (normalized.includes('graphic') || normalized.includes('chart') || normalized.includes('diagram')) return 'graphic_design'
  if (normalized.includes('real_motion') || normalized.includes('video_generation')) return 'real_motion'
  if (normalized.includes('sound') || normalized.includes('audio') || normalized.includes('music')) return 'soundsync'
  if (normalized.includes('render') || normalized.includes('export')) return 'render_export'
  if (normalized.includes('timeline') || normalized.includes('ffmpeg') || normalized.includes('probe') || normalized.includes('opentimelineio')) return 'media_analysis'
  return 'other'
}

function findSecretLikeToolCostPath(value: unknown, path = '$', depth = 0): string | undefined {
  if (depth > 8) return undefined
  if (typeof value === 'string') {
    const normalized = value.toLowerCase()
    if (
      normalized.includes('x-amz-signature=') ||
      normalized.includes('x-goog-signature=') ||
      normalized.includes('supabase.co/storage/v1/object/sign/') ||
      normalized.includes('bearer ') ||
      normalized.includes('service_role')
    ) {
      return path
    }
    return undefined
  }
  if (Array.isArray(value)) {
    for (const [index, item] of value.entries()) {
      const secretPath = findSecretLikeToolCostPath(item, `${path}[${index}]`, depth + 1)
      if (secretPath) return secretPath
    }
    return undefined
  }
  const record = asRecord(value)
  if (!record) return undefined
  for (const [key, item] of Object.entries(record)) {
    if (isSecretLikeToolCostKey(key)) return `${path}.${key}`
    const secretPath = findSecretLikeToolCostPath(item, `${path}.${key}`, depth + 1)
    if (secretPath) return secretPath
  }
  return undefined
}

function isSecretLikeToolCostKey(key: string): boolean {
  const normalized = key.toLowerCase().replace(/[-_\s]/g, '')
  return [
    'apikey',
    'servicerolekey',
    'supabaseservicerolekey',
    'authorization',
    'accesstoken',
    'refreshtoken',
    'credential',
    'credentials',
    'password',
    'secret',
    'signedurl',
    'rawprompt',
  ].includes(normalized)
}

function safeId(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 48) || 'mock'
}

function handleMockGenerationCreditGate(): ApiResponseEnvelope {
  const result = runMockGenerationCreditGateFlow()
  return createApiMockResponse(result, result.warnings)
}

function handleMockRenderCreditGate(): ApiResponseEnvelope {
  const result = runMockRenderCreditGateFlow()
  return createApiMockResponse(result, result.warnings)
}

function handleMockJobQueue(): ApiResponseEnvelope {
  const result = runMockWorkerDispatchFlow()
  return createApiMockResponse(result, result.warnings)
}

function handleMockJobGateCheck(): ApiResponseEnvelope {
  const result = runMockBlockedJobRuntimeFlow()
  return createApiMockResponse(result, result.warnings)
}

function handleMockJobDependencies(): ApiResponseEnvelope {
  const result = runMockJobDependencyFlow()
  return createApiMockResponse(result, result.warnings)
}

function handleMockJobDispatch(): ApiResponseEnvelope {
  const result = runMockWorkerDispatchFlow()
  return createApiMockResponse(result, result.warnings)
}

function handleMockJobStatus(): ApiResponseEnvelope {
  const result = runMockMusicJobRuntimeFlow()
  return createApiMockResponse({
    queueStatus: result.queueItem?.queueStatus,
    chatSummary: result.chatSummary,
    nextStep: result.nextStep,
  }, result.warnings)
}

function handleMockJobEvents(): ApiResponseEnvelope {
  const result = runMockMusicJobRuntimeFlow()
  return createApiMockResponse({
    jobEvents: result.jobEvents,
  }, result.warnings)
}

function handleMockJobRetry(): ApiResponseEnvelope {
  const result = runMockJobRetryFlow()
  return createApiMockResponse(result, result.warnings)
}

function handleMockJobCancel(): ApiResponseEnvelope {
  const result = runMockBlockedJobRuntimeFlow()
  return createApiMockResponse({
    ...result,
    nextStep: 'cancelled_mock',
  }, result.warnings)
}

function handleMockRuntimeEnvelopeCreate(): ApiResponseEnvelope {
  const result = runMockBackendRuntimeTransportFlow('mock-envelope-created')
  return createApiMockResponse({
    runtimeEnvelope: result.runtimeEnvelope,
    chatSummary: result.chatSummary,
    nextStep: result.nextStep,
  }, result.warnings)
}

function handleMockRuntimeTransportSend(): ApiResponseEnvelope {
  const result = runMockWorkerLeaseBackendRuntimeTransportFlow()
  return createApiMockResponse(result, result.warnings)
}

function handleMockWorkerLeaseClaim(): ApiResponseEnvelope {
  const result = runMockWorkerLeaseClaimFlow()
  return createApiMockResponse(result, result.warnings)
}

function handleMockWorkerLeaseHeartbeat(): ApiResponseEnvelope {
  const result = runMockWorkerHeartbeatFlow()
  return createApiMockResponse(result, result.warnings)
}

function handleMockWorkerLeaseRenew(): ApiResponseEnvelope {
  const result = runMockWorkerLeaseRenewFlow()
  return createApiMockResponse(result, result.warnings)
}

function handleMockWorkerLeaseRelease(): ApiResponseEnvelope {
  const result = runMockLeaseReleaseFlow()
  return createApiMockResponse(result, result.warnings)
}

function handleMockWorkerLeaseComplete(): ApiResponseEnvelope {
  const result = runMockWorkerLeaseCompleteFlow()
  return createApiMockResponse(result, result.warnings)
}

function handleMockWorkerLeaseFail(): ApiResponseEnvelope {
  const result = runMockWorkerLeaseFailureFlow()
  return createApiMockResponse(result, result.warnings)
}

function handleMockWorkerLeaseRecoverStale(): ApiResponseEnvelope {
  const result = runMockStaleLeaseRecoveryFlow()
  return createApiMockResponse(result, result.warnings)
}

function handleMockRenderWorkerLease(): ApiResponseEnvelope {
  const result = runMockWorkerLeaseDispatchFlow('queue-mock-render-readiness-job-success')
  return createApiMockResponse(result, result.warnings)
}

function handleMockWorkerRuntimeRegistry(): ApiResponseEnvelope {
  return createApiMockResponse({
    workerRuntimes: WORKER_RUNTIME_REGISTRY,
    summary: createWorkerRuntimeRegistrySummary(),
  }, ['Registry is metadata only; no worker was started.'])
}

function handleMockMusicJobRuntime(): ApiResponseEnvelope {
  const result = runMockMusicJobRuntimeFlow()
  return createApiMockResponse(result, result.warnings)
}

function handleMockSFXJobRuntime(): ApiResponseEnvelope {
  const result = runMockSFXJobRuntimeFlow()
  return createApiMockResponse(result, result.warnings)
}

function handleMockRenderJobQueue(): ApiResponseEnvelope {
  const result = runMockRenderJobRuntimeFlow()
  return createApiMockResponse(result, result.warnings)
}

function handleMockMusicPlan(): ApiResponseEnvelope {
  const result = runMockReferenceToMusicCueFlow()
  return createApiMockResponse(result, result.warnings)
}

function handleMockMusicQA(): ApiResponseEnvelope {
  const result = runMockLakeComoMusicQAFlow()
  return createApiMockResponse(result, [result.summary])
}

function handleMockMusicMixPlan(): ApiResponseEnvelope {
  const result = runMockMusicMixPlanningFlow()
  return createApiMockResponse(result)
}

function handleMockSFXProviderReadiness(request: ApiRequestEnvelope): ApiResponseEnvelope {
  const body = request.body as { scenarioId?: string } | undefined
  const result = runMockSFXProviderReadinessFlow(body?.scenarioId)

  return createApiMockResponse({
    readiness: result.readiness,
    summary: result.summary,
    scenario: {
      id: result.scenario.id,
      label: result.scenario.label,
      description: result.scenario.description,
      expected: result.expected,
    },
  }, result.warnings)
}

function runMockEditProjectSFXApiFlow(request?: ApiRequestEnvelope) {
  const body = request?.body as { scenarioId?: string } | undefined
  const scenario = body?.scenarioId
    ? getMockEditProjectSFXScenarioById(body.scenarioId) ?? getDefaultMockEditProjectSFXScenario()
    : getDefaultMockEditProjectSFXScenario()

  return runEditProjectSFXFlow(scenario)
}

function handleMockEditProjectSFXPlan(request: ApiRequestEnvelope): ApiResponseEnvelope {
  const result = runMockEditProjectSFXApiFlow(request)
  return createApiMockResponse({
    sfxEventPlans: result.sfxIntegration.sfxEventPlans,
    providerRoutes: result.sfxIntegration.providerRoutes,
    nextStep: result.sfxIntegration.nextStep,
    chatSummary: result.chatSummary,
  }, result.warnings)
}

function handleMockEditProjectSFXProviderRoutes(request: ApiRequestEnvelope): ApiResponseEnvelope {
  const result = runMockEditProjectSFXApiFlow(request)
  return createApiMockResponse({
    providerRoutes: result.sfxIntegration.providerRoutes,
    providerRouteSummary: result.sfxIntegration.providerRouteSummary,
  }, result.warnings)
}

function handleMockEditProjectSFXPrompts(request: ApiRequestEnvelope): ApiResponseEnvelope {
  const result = runMockEditProjectSFXApiFlow(request)
  return createApiMockResponse({
    promptPlans: result.sfxIntegration.promptPlans,
    skippedPromptPlans: result.sfxIntegration.skippedPromptPlans,
  }, result.warnings)
}

function handleMockEditProjectSFXCreditEstimate(request: ApiRequestEnvelope): ApiResponseEnvelope {
  const result = runMockEditProjectSFXApiFlow(request)
  return createApiMockResponse({
    creditEstimate: result.sfxIntegration.creditEstimate,
    creditEstimateLines: result.sfxIntegration.creditEstimateLines,
    creditApproval: result.sfxIntegration.creditApproval,
    creditReservation: result.sfxIntegration.creditReservation,
    creditGateSummary: result.sfxIntegration.creditGateSummary,
  }, result.warnings)
}

function handleMockEditProjectSFXQueueGeneration(request: ApiRequestEnvelope): ApiResponseEnvelope {
  const result = runMockEditProjectSFXApiFlow(request)
  return createApiMockResponse({
    generationRequests: result.sfxIntegration.generationRequests,
    jobs: result.sfxIntegration.jobs,
    jobQueueItems: result.sfxIntegration.jobQueueItems,
    nextStep: result.sfxIntegration.nextStep,
  }, result.warnings)
}

function handleMockEditProjectSFXWorker(request: ApiRequestEnvelope): ApiResponseEnvelope {
  const result = runMockEditProjectSFXApiFlow(request)
  return createApiMockResponse({
    workerOutputs: result.workerOutputs.map((run) => run.output),
    generatedAssets: result.generatedAssets,
    timingPlans: result.timingPlans,
    mixPlans: result.mixPlans,
    qaReports: result.qaReports,
    projectAssetDecisions: result.projectAssetDecisions,
  }, result.warnings)
}

function handleMockEditProjectSFXStatus(request: ApiRequestEnvelope): ApiResponseEnvelope {
  const result = runMockEditProjectSFXApiFlow(request)
  return createApiMockResponse({
    statusSummary: result.statusSummary,
    projectAssetDecisions: result.projectAssetDecisions,
    chatSummary: result.chatSummary,
  }, result.warnings)
}

function handleMockSfxDirectorPlan(): ApiResponseEnvelope {
  const result = runMockLakeComoSFXPlanningFlow()
  return createApiMockResponse(result, result.warnings)
}

function handleMockSfxPromptPlan(): ApiResponseEnvelope {
  const result = runMockLakeComoSFXPromptFlow()
  return createApiMockResponse(result, result.warnings)
}

function handleMockSfxTimingPlan(): ApiResponseEnvelope {
  const result = runMockLakeComoSFXTimingFlow()
  return createApiMockResponse(result, result.warnings)
}

function handleMockSfxMixPlan(): ApiResponseEnvelope {
  const result = runMockLakeComoSFXMixFlow()
  return createApiMockResponse(result, result.warnings)
}

function handleMockSfxQA(): ApiResponseEnvelope {
  const result = runMockLakeComoSFXQAFlow()
  return createApiMockResponse(result, result.warnings)
}

function handleMockSfxLibraryCandidate(): ApiResponseEnvelope {
  const result = runMockLakeComoSFXLibraryFlow()
  return createApiMockResponse(result, result.warnings)
}

function handleMockStoryTimingPlan(): ApiResponseEnvelope {
  const result = runMockStoryTimingPlannerFlow()
  return createApiMockResponse(result, result.warnings)
}

function handleMockCaptionCutTiming(): ApiResponseEnvelope {
  const result = runMockCaptionCutTimingFlow()
  return createApiMockResponse(result, result.warnings)
}

function handleMockMusicSfxTiming(): ApiResponseEnvelope {
  const result = runMockMusicSFXTimingFlow()
  return createApiMockResponse(result, result.warnings)
}

function handleMockStoryTimingQA(): ApiResponseEnvelope {
  const result = runMockStoryTimingPlannerFlow()
  return createApiMockResponse(
    {
      qaChecks: result.qaChecks,
      conflicts: result.conflicts,
      renderTimingManifest: result.renderTimingManifest,
    },
    result.warnings,
  )
}
