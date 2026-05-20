import type {
  ApiRequestEnvelope,
  ApiResponseEnvelope,
  ApiRouteHandler,
  ApiRuntimeContext,
} from './api-runtime-contracts'
import { createApiBackendRequiredResponse, createApiErrorResponse, createApiMockResponse, createApiNotImplementedResponse } from './api-response'
import { createApiRouteMapSummary, getApiRouteById, getMockReadyRoutes } from './api-route-registry'
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
import { runMockStoryTimingPlannerFlow } from '../orchestrators/mock-storytiming-orchestrator'
import { createMediaAssetRecordFromUploadPlan, createReferenceAssetRecordFromUploadPlan } from '../storage/media-asset-service'
import { buildStoragePathForUploadPurpose, type StoragePathBuildInput } from '../storage/storage-path-builder'
import { getStorageClientStatus } from '../storage/storage-client-service'
import { createUploadPlan } from '../storage/upload-plan-service'
import { validateUploadFile } from '../storage/upload-validation-service'
import type { CreateUploadPlanInput, UploadPlan, UploadPurpose } from '../../types/upload'
import { createWorkerRuntimeRegistrySummary, WORKER_RUNTIME_REGISTRY } from '../runtime/worker-runtime-registry'

const registeredHandlers = new Map<string, ApiRouteHandler>()

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
  'jobs.queue': handleMockJobQueue,
  'jobs.gate.check': handleMockJobGateCheck,
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

function handleMockSourceSequenceUploadFlow(): ApiResponseEnvelope {
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
