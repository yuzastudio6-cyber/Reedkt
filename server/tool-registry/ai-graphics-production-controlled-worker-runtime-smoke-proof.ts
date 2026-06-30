import {
  acceptedAiGraphicsProductionControlledWorkerRuntimeSmokeAuthorization,
  evaluateAiGraphicsProductionControlledWorkerRuntimeSmokeAuthorization,
  type AiGraphicsProductionControlledWorkerRuntimeSmokeAuthorization,
  type AiGraphicsProductionControlledWorkerRuntimeSmokeAuthorizationInput,
} from './ai-graphics-production-controlled-worker-runtime-smoke-authorization'
import {
  getAiGraphicsToolCallReadiness,
  type AiGraphicsCanonicalToolId,
} from './ai-graphics-tool-call-readiness'
import type {
  ProductionRegistryWorkerType,
  ProductionToolId,
} from './production-tool-types'
import {
  buildWorkerIdempotencyKey,
  createProductionWorkerRuntimeState,
  dispatchProductionWorkerJob,
  type ProductionWorkerEventType,
  type ProductionWorkerJobPayload,
  type ProductionWorkerRuntimeType,
} from '../workers/production'

export const AI_GRAPHICS_PRODUCTION_CONTROLLED_WORKER_RUNTIME_SMOKE_PROOF_DECISION =
  'ai_graphics_production_controlled_worker_runtime_smoke_proof_dry_run_completed_with_runtime_blocks'

export type AiGraphicsProductionControlledWorkerRuntimeSmokeProofStatus =
  | 'planning_metadata_selected'
  | 'missing_production_controlled_worker_runtime_smoke_authorization'
  | 'production_controlled_worker_runtime_smoke_authorization_rejected'
  | 'awaiting_production_controlled_worker_runtime_smoke_proof_controls'
  | 'production_controlled_worker_runtime_smoke_dry_run_completed_no_tool_execution'
  | 'production_controlled_worker_runtime_smoke_dry_run_failed'

export interface AiGraphicsProductionControlledWorkerRuntimeSmokeProofInput
  extends AiGraphicsProductionControlledWorkerRuntimeSmokeAuthorizationInput {
  sourceProductionControlledWorkerRuntimeSmokeAuthorizationPacket?:
    AiGraphicsProductionControlledWorkerRuntimeSmokeAuthorization
  productionControlledWorkerRuntimeSmokeProofRef?: string
  productionControlledWorkerRuntimeSmokeTelemetryRef?: string
  productionControlledWorkerRuntimeSmokeLeaseLifecycleAuditRef?: string
  productionControlledWorkerRuntimeSmokeRouteOutputAuditRef?: string
  productionControlledWorkerRuntimeSmokePrivateArtifactWriteBlockRef?: string
  productionControlledWorkerRuntimeSmokeGpuLifecycleAuditRef?: string
  productionControlledWorkerRuntimeSmokeCleanupRef?: string
  productionControlledWorkerRuntimeSmokeWorkerInstanceRef?: string
}

export interface AiGraphicsProductionControlledWorkerRuntimeSmokeProofRecord {
  proofId: 'ai_graphics_production_controlled_worker_runtime_smoke_proof'
  toolId: AiGraphicsCanonicalToolId
  productionToolId: ProductionToolId
  capabilityId: string
  workerType: ProductionRegistryWorkerType
  runtimeTarget: string
  jobId: string
  executionMode: 'dry_run'
  sourceAuthorizationAccepted: boolean
  sourceAuthorizationRequiredDryRun: true
  dispatcherEvaluated: boolean
  dispatcherStatus: 'completed' | 'blocked' | 'failed' | string
  gateHardBlockCount: number
  allGatesPassed: boolean
  eventNames: ProductionWorkerEventType[]
  inMemoryLeaseCreated: boolean
  inMemoryLeaseReleased: boolean
  inMemoryLeaseCount: number
  liveWorkerLeaseCreatedNow: false
  liveWorkerDispatchPerformedNow: false
  routeOutputCreated: boolean
  routeOutputFutureHandler: string | null
  aiGraphicsToolCallHandoffResultCreated: boolean
  toolRunResultsCreated: 0
  artifactRecordsCreated: 0
  qualityGateResultsCreated: 0
  fallbackDecisionsCreated: 0
  gpuRuntimeStartAllowedForAcceptedDryRunWorkerJob: boolean
  gpuRuntimeShouldStartNow: false
  gpuRuntimePerformedNow: false
  toolExecutionPerformedNow: false
  privateArtifactWritePerformedNow: false
  publicArtifactCreatedNow: false
  signedUrlCreatedNow: false
  runtimeSmokeProofCompletedWithProvidedEvidence: boolean
}

export interface AiGraphicsProductionControlledWorkerRuntimeSmokeProof {
  decision:
    typeof AI_GRAPHICS_PRODUCTION_CONTROLLED_WORKER_RUNTIME_SMOKE_PROOF_DECISION
  sourceProductionControlledWorkerRuntimeSmokeAuthorizationDecision: string | null
  status: AiGraphicsProductionControlledWorkerRuntimeSmokeProofStatus
  capabilityId: string
  requestedToolId: AiGraphicsCanonicalToolId | null
  sourceProductionControlledWorkerRuntimeSmokeAuthorizationAccepted: boolean
  productionControlledWorkerRuntimeSmokeProofControlsAccepted: boolean
  productionControlledWorkerRuntimeSmokeProofCompletedWithProvidedEvidence: boolean
  missingProofControls: string[]
  rejectionReasons: string[]
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  gpuRuntimeTargetedTools: 8
  productionControlledToolCallReadyNowTools: 21 | 0
  runtimeReadyForOnDemandProductionToolCallTools: 0
  externalBetaReadyNowTools: 0
  productionReadyNowTools: 0
  inMemoryWorkerLeasesCreated: 0 | 1
  inMemoryWorkerLeasesReleased: 0 | 1
  liveWorkerLeasesCreatedNow: 0
  liveWorkerDispatchesNow: 0
  liveToolExecutionsNow: 0
  gpuRuntimeShouldStartNow: false
  runtimeSmokeProofRecord:
    AiGraphicsProductionControlledWorkerRuntimeSmokeProofRecord | null
  policy: {
    sourceRuntimeSmokeAuthorizationRequired: true
    privateProofRefsRequired: true
    nonProductionDryRunOnly: true
    dispatcherMayCreateInMemoryLeaseOnly: true
    noLiveWorkerLeaseCreationByProof: true
    noLiveWorkerDispatchByProof: true
    noToolExecutionByProof: true
    noProviderRuntimeByProof: true
    noBrowserWebglCanvasRuntimeByProof: true
    noGpuRuntimeStartByProof: true
    noPrivateArtifactWriteByProof: true
    publicArtifactsRejected: true
    signedUrlsRejected: true
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    nextGateRequiresPrivateArtifactToolRouteProofPacket: true
  }
  booleans: {
    productionControlledWorkerRuntimeSmokeProofPrepared: true
    sourceProductionControlledWorkerRuntimeSmokeAuthorizationAccepted: boolean
    productionControlledWorkerRuntimeSmokeProofControlsAccepted: boolean
    productionControlledWorkerRuntimeSmokeProofCompletedWithProvidedEvidence: boolean
    productionWorkerDispatcherDryRunExercised: boolean
    dryRunWorkerModeAllowed: boolean
    allWorkerGatesPassed: boolean
    inMemoryWorkerLeaseCreated: boolean
    inMemoryWorkerLeaseReleased: boolean
    aiGraphicsToolCallHandoffRouteOutputCreated: boolean
    allToolRunResultsEmpty: boolean
    allArtifactRecordsEmpty: boolean
    allQualityGateResultsEmpty: boolean
    allFallbackDecisionsEmpty: boolean
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    all8GpuToolsTargetGpuRuntime: true
    productionControlledToolCallReadyNow: boolean
    runtimeReadyForOnDemandProductionToolCall: false
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    gpuStartsOnlyForApprovedWorkerOrToolCall: true
    futureSmokeUsedPrivateNonProductionDryRun: boolean
    gpuRuntimeStartAllowedForAcceptedDryRunWorkerJob: boolean
    gpuRuntimeShouldStartNow: false
    agentCanSelectForPlanning: true
    agentCanExecuteToolsNow: false
    directAgentToolExecutionApprovedNow: false
    routeExecutionApprovedNow: false
    workerExecutionApprovedNow: false
    workerQueueApprovedNow: false
    workerLeaseCreationApprovedNow: false
    workerDispatchApprovedNow: false
    productionWorkerDispatchApprovedNow: false
    nonProductionWorkerRuntimeSmokeAuthorizedNow: false
    serviceRoleQueueTransactionApprovedNow: false
    liveQueueWriteApprovedNow: false
    privateArtifactWriteApprovedNow: false
    toolExecutionApprovedNow: false
    providerRuntimeApprovedNow: false
    browserWebglCanvasRuntimeApprovedNow: false
    gpuRuntimeApprovedNow: false
    runtimeReadyNow: false
    internalBetaReadyNow: false
    externalBetaReadyNow: false
    productionReadyNow: false
    dependencyInstallPerformed: false
    packageLockMutationPerformed: false
    toolExecutionPerformed: false
    workerExecutionPerformed: false
    workerEnqueuePerformed: false
    workerDispatchPerformed: false
    routeExecutionPerformed: false
    backendQueueSubmissionPerformed: false
    serviceRoleTransactionPerformed: false
    supabaseMutationPerformed: false
    workerLeaseCreated: false
    providerRuntimePerformed: false
    browserWebglCanvasRuntimePerformed: false
    gpuRuntimePerformed: false
    gpuRuntimeShouldStartNowPerformed: false
    modelWeightsDownloaded: false
    modelWeightsLoaded: false
    mediaProcessingPerformed: false
    gcsUploadPerformed: false
    publicArtifactCreated: false
    signedUrlCreated: false
  }
}

function hasValue(value?: string): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isPrivateEvidenceRef(value: string | undefined): boolean {
  if (!hasValue(value)) return false
  const normalized = value.trim().toLowerCase()
  if (
    normalized.startsWith('http://') ||
    normalized.startsWith('https://') ||
    normalized.startsWith('gs://') ||
    normalized.startsWith('gcs://') ||
    normalized.startsWith('s3://') ||
    normalized.includes('signed-url') ||
    normalized.includes('public-artifact') ||
    normalized.includes('/public/')
  ) {
    return false
  }
  return normalized.startsWith('private://') ||
    normalized.startsWith('backend://') ||
    normalized.startsWith('production-evidence://')
}

function missingProofControls(
  input: AiGraphicsProductionControlledWorkerRuntimeSmokeProofInput,
): string[] {
  return [
    !isPrivateEvidenceRef(input.productionControlledWorkerRuntimeSmokeProofRef)
      ? 'productionControlledWorkerRuntimeSmokeProofRef: private/backend production evidence ref is required'
      : undefined,
    !isPrivateEvidenceRef(input.productionControlledWorkerRuntimeSmokeTelemetryRef)
      ? 'productionControlledWorkerRuntimeSmokeTelemetryRef: private/backend production evidence ref is required'
      : undefined,
    !isPrivateEvidenceRef(input.productionControlledWorkerRuntimeSmokeLeaseLifecycleAuditRef)
      ? 'productionControlledWorkerRuntimeSmokeLeaseLifecycleAuditRef: private/backend production evidence ref is required'
      : undefined,
    !isPrivateEvidenceRef(input.productionControlledWorkerRuntimeSmokeRouteOutputAuditRef)
      ? 'productionControlledWorkerRuntimeSmokeRouteOutputAuditRef: private/backend production evidence ref is required'
      : undefined,
    !isPrivateEvidenceRef(input.productionControlledWorkerRuntimeSmokePrivateArtifactWriteBlockRef)
      ? 'productionControlledWorkerRuntimeSmokePrivateArtifactWriteBlockRef: private/backend production evidence ref is required'
      : undefined,
    !isPrivateEvidenceRef(input.productionControlledWorkerRuntimeSmokeGpuLifecycleAuditRef)
      ? 'productionControlledWorkerRuntimeSmokeGpuLifecycleAuditRef: private/backend production evidence ref is required'
      : undefined,
    !isPrivateEvidenceRef(input.productionControlledWorkerRuntimeSmokeCleanupRef)
      ? 'productionControlledWorkerRuntimeSmokeCleanupRef: private/backend production evidence ref is required'
      : undefined,
  ].filter((reason): reason is string => Boolean(reason))
}

function statusFromInput(input: {
  hasSource: boolean
  sourceAccepted: boolean
  controlsAccepted: boolean
  proofCompleted: boolean
  proofAttempted: boolean
}): AiGraphicsProductionControlledWorkerRuntimeSmokeProofStatus {
  if (!input.hasSource) {
    return 'missing_production_controlled_worker_runtime_smoke_authorization'
  }
  if (!input.sourceAccepted) {
    return 'production_controlled_worker_runtime_smoke_authorization_rejected'
  }
  if (!input.controlsAccepted) {
    return 'awaiting_production_controlled_worker_runtime_smoke_proof_controls'
  }
  if (input.proofCompleted) {
    return 'production_controlled_worker_runtime_smoke_dry_run_completed_no_tool_execution'
  }
  return input.proofAttempted
    ? 'production_controlled_worker_runtime_smoke_dry_run_failed'
    : 'awaiting_production_controlled_worker_runtime_smoke_proof_controls'
}

function isKnownCanonicalToolId(toolId: string | null): toolId is AiGraphicsCanonicalToolId {
  return typeof toolId === 'string' && Boolean(getAiGraphicsToolCallReadiness(toolId))
}

function isProductionWorkerRuntimeType(
  workerType: ProductionRegistryWorkerType | 'none',
): workerType is ProductionWorkerRuntimeType {
  return workerType === 'cpu_analysis_worker' ||
    workerType === 'gpu_ai_worker' ||
    workerType === 'render_worker' ||
    workerType === 'qa_worker' ||
    workerType === 'tool_readiness_worker'
}

function buildDryRunPayload(input: {
  toolId: AiGraphicsCanonicalToolId
  capabilityId: string
  workerType: ProductionWorkerRuntimeType
  runtimeTarget: string
  sourceJobId: string
}): ProductionWorkerJobPayload | null {
  const readiness = getAiGraphicsToolCallReadiness(input.toolId)
  if (
    !readiness?.productionToolId ||
    !isProductionWorkerRuntimeType(readiness.productionWorkerType)
  ) {
    return null
  }
  const productionToolId = readiness.productionToolId
  const workerType = readiness.productionWorkerType
  const toolExecutionPlanId =
    `tool-execution-plan-ai-graphics-runtime-smoke-${input.toolId}`
  const payload: ProductionWorkerJobPayload = {
    jobId: `${input.sourceJobId}:runtime-smoke-dry-run`,
    workspaceId: 'workspace-ai-graphics-production-runtime-smoke',
    projectId: 'project-ai-graphics-production-runtime-smoke',
    approvedSnapshotId: 'approved-snapshot-ai-graphics-production-runtime-smoke',
    editPlanId: 'edit-plan-ai-graphics-production-runtime-smoke',
    toolExecutionPlanId,
    workerType,
    executionMode: 'dry_run',
    idempotencyKey: 'pending',
    attempt: 1,
    maxAttempts: 1,
    requestedToolIds: [productionToolId],
    requestedRecipeIds: [`ai_graphics_${input.capabilityId}_runtime_smoke`],
    storageReferenceIds: [
      `private_artifact_manifest_${input.toolId}_input`,
      `private_artifact_manifest_${input.toolId}_output`,
      `private_telemetry_${input.toolId}`,
    ],
    creditReservationId: 'credit-reservation-ai-graphics-production-runtime-smoke',
    requiredQualityGateIds: [`qa-ai-graphics-runtime-smoke-${input.toolId}`],
    createdAt: '2026-06-30T00:00:00.000Z',
    metadata: {
      aiGraphicsCanonicalToolId: input.toolId,
      aiGraphicsCapabilityIds: [input.capabilityId],
      aiGraphicsRuntimeTarget: readiness.runtimeTarget,
      aiGraphicsRuntimeActivationPolicy: {
        onDemandOnly: true,
        noIdleGpuRuntimeApproved: true,
        startsOnlyForApprovedWorkerOrToolCall: true,
        cpuFallbackAllowedForHeavyTools: false,
      },
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      startsOnlyForApprovedWorkerOrToolCall: true,
      cpuFallbackAllowedForHeavyTools: false,
      gpuRuntimeShouldStartNow: false,
      aiGraphicsToolCallHandoff: {
        mode: 'metadata_dry_run',
        planningOnly: true,
        agentCanExecuteToolsNow: false,
        canonicalToolId: input.toolId,
        productionToolId,
        runtimeTarget: readiness.runtimeTarget,
        capabilityIds: [input.capabilityId],
      },
    },
  }
  payload.idempotencyKey = buildWorkerIdempotencyKey(payload)
  return payload
}

async function buildProofRecord(input: {
  source: AiGraphicsProductionControlledWorkerRuntimeSmokeAuthorization
  controlsAccepted: boolean
  workerInstanceRef?: string
}): Promise<AiGraphicsProductionControlledWorkerRuntimeSmokeProofRecord | null> {
  const candidate = input.source.runtimeSmokeAuthorizationCandidate
  if (!candidate || !input.controlsAccepted || !isKnownCanonicalToolId(candidate.toolId)) {
    return null
  }
  const payload = buildDryRunPayload({
    toolId: candidate.toolId,
    capabilityId: candidate.capabilityId,
    workerType: candidate.workerType as ProductionWorkerRuntimeType,
    runtimeTarget: candidate.runtimeTarget,
    sourceJobId: candidate.jobId,
  })
  if (!payload) return null

  const state = createProductionWorkerRuntimeState()
  const result = await dispatchProductionWorkerJob({
    payload,
    state,
    workerInstanceId:
      input.workerInstanceRef?.trim() || 'production-ai-graphics-runtime-smoke',
  })
  const gateHardBlockCount = result.gateChecks.filter((gate) => gate.hardBlock).length
  const eventNames = result.events.map((event) => event.eventName)
  const releasedLeases = state.leases.filter((lease) => lease.leaseStatus === 'released')
  const routeOutput = result.output
  const handoff = routeOutput?.aiGraphicsToolCallHandoffResult
  const completed =
    result.status === 'completed' &&
    gateHardBlockCount === 0 &&
    state.leases.length === 1 &&
    releasedLeases.length === 1 &&
    routeOutput?.futureHandler === (
      candidate.workerType === 'gpu_ai_worker'
        ? 'ai_graphics_gpu_model_tool_call_handoff'
        : candidate.workerType === 'render_worker'
          ? 'ai_graphics_render_tool_call_handoff'
          : 'ai_graphics_cpu_static_tool_call_handoff'
    ) &&
    Boolean(handoff) &&
    result.toolRunResults.length === 0 &&
    result.artifactRecords.length === 0 &&
    result.qualityGateResults.length === 0 &&
    result.fallbackDecisions.length === 0
  const readiness = getAiGraphicsToolCallReadiness(candidate.toolId)

  return {
    proofId: 'ai_graphics_production_controlled_worker_runtime_smoke_proof',
    toolId: candidate.toolId,
    productionToolId: readiness?.productionToolId as ProductionToolId,
    capabilityId: candidate.capabilityId,
    workerType: candidate.workerType as ProductionRegistryWorkerType,
    runtimeTarget: candidate.runtimeTarget,
    jobId: payload.jobId,
    executionMode: 'dry_run',
    sourceAuthorizationAccepted: true,
    sourceAuthorizationRequiredDryRun: true,
    dispatcherEvaluated: true,
    dispatcherStatus: result.status,
    gateHardBlockCount,
    allGatesPassed: gateHardBlockCount === 0,
    eventNames,
    inMemoryLeaseCreated: state.leases.length === 1,
    inMemoryLeaseReleased: releasedLeases.length === 1,
    inMemoryLeaseCount: state.leases.length,
    liveWorkerLeaseCreatedNow: false,
    liveWorkerDispatchPerformedNow: false,
    routeOutputCreated: Boolean(routeOutput),
    routeOutputFutureHandler: routeOutput?.futureHandler ?? null,
    aiGraphicsToolCallHandoffResultCreated: Boolean(handoff),
    toolRunResultsCreated: result.toolRunResults.length as 0,
    artifactRecordsCreated: result.artifactRecords.length as 0,
    qualityGateResultsCreated: result.qualityGateResults.length as 0,
    fallbackDecisionsCreated: result.fallbackDecisions.length as 0,
    gpuRuntimeStartAllowedForAcceptedDryRunWorkerJob:
      candidate.gpuRuntimeStartAllowedForAcceptedDryRunWorkerJob,
    gpuRuntimeShouldStartNow: false,
    gpuRuntimePerformedNow: false,
    toolExecutionPerformedNow: false,
    privateArtifactWritePerformedNow: false,
    publicArtifactCreatedNow: false,
    signedUrlCreatedNow: false,
    runtimeSmokeProofCompletedWithProvidedEvidence: completed,
  }
}

export function acceptedAiGraphicsProductionControlledWorkerRuntimeSmokeProof(
  packet: AiGraphicsProductionControlledWorkerRuntimeSmokeProof | undefined,
): packet is AiGraphicsProductionControlledWorkerRuntimeSmokeProof {
  return Boolean(
    packet &&
      packet.decision ===
        AI_GRAPHICS_PRODUCTION_CONTROLLED_WORKER_RUNTIME_SMOKE_PROOF_DECISION &&
      packet.status ===
        'production_controlled_worker_runtime_smoke_dry_run_completed_no_tool_execution' &&
      packet.sourceProductionControlledWorkerRuntimeSmokeAuthorizationAccepted === true &&
      packet.productionControlledWorkerRuntimeSmokeProofCompletedWithProvidedEvidence === true &&
      packet.runtimeSmokeProofRecord?.dispatcherStatus === 'completed' &&
      packet.runtimeSmokeProofRecord.inMemoryLeaseCreated === true &&
      packet.runtimeSmokeProofRecord.inMemoryLeaseReleased === true &&
      packet.runtimeSmokeProofRecord.toolRunResultsCreated === 0 &&
      packet.runtimeSmokeProofRecord.artifactRecordsCreated === 0 &&
      packet.runtimeSmokeProofRecord.qualityGateResultsCreated === 0 &&
      packet.inMemoryWorkerLeasesCreated === 1 &&
      packet.inMemoryWorkerLeasesReleased === 1 &&
      packet.liveWorkerLeasesCreatedNow === 0 &&
      packet.liveWorkerDispatchesNow === 0 &&
      packet.liveToolExecutionsNow === 0 &&
      packet.gpuRuntimeShouldStartNow === false &&
      packet.booleans.agentCanExecuteToolsNow === false &&
      packet.booleans.workerExecutionApprovedNow === false &&
      packet.booleans.toolExecutionApprovedNow === false &&
      packet.booleans.gpuRuntimeApprovedNow === false &&
      packet.booleans.runtimeReadyNow === false &&
      packet.booleans.externalBetaReadyNow === false &&
      packet.booleans.productionReadyNow === false,
  )
}

export async function evaluateAiGraphicsProductionControlledWorkerRuntimeSmokeProof(
  input: AiGraphicsProductionControlledWorkerRuntimeSmokeProofInput = {},
): Promise<AiGraphicsProductionControlledWorkerRuntimeSmokeProof> {
  const source =
    input.sourceProductionControlledWorkerRuntimeSmokeAuthorizationPacket ??
    await evaluateAiGraphicsProductionControlledWorkerRuntimeSmokeAuthorization(input)
  const sourceAccepted =
    acceptedAiGraphicsProductionControlledWorkerRuntimeSmokeAuthorization(source)
  const missingControls = sourceAccepted ? missingProofControls(input) : []
  const controlsAccepted = sourceAccepted && missingControls.length === 0
  const record = await buildProofRecord({
    source,
    controlsAccepted,
    workerInstanceRef: input.productionControlledWorkerRuntimeSmokeWorkerInstanceRef,
  })
  const proofCompleted = record?.runtimeSmokeProofCompletedWithProvidedEvidence === true
  const status = statusFromInput({
    hasSource: Boolean(input.sourceProductionControlledWorkerRuntimeSmokeAuthorizationPacket),
    sourceAccepted,
    controlsAccepted,
    proofCompleted,
    proofAttempted: controlsAccepted,
  })
  const rejectionReasons = [
    !input.sourceProductionControlledWorkerRuntimeSmokeAuthorizationPacket
      ? 'source production controlled worker runtime smoke authorization packet is missing'
      : undefined,
    input.sourceProductionControlledWorkerRuntimeSmokeAuthorizationPacket && !sourceAccepted
      ? 'source production controlled worker runtime smoke authorization packet is not accepted'
      : undefined,
    ...missingControls,
    controlsAccepted && !proofCompleted
      ? 'production controlled worker runtime smoke dry-run did not complete with the required no-execution evidence'
      : undefined,
  ].filter((reason): reason is string => Boolean(reason))

  return {
    decision:
      AI_GRAPHICS_PRODUCTION_CONTROLLED_WORKER_RUNTIME_SMOKE_PROOF_DECISION,
    sourceProductionControlledWorkerRuntimeSmokeAuthorizationDecision:
      source.decision ?? null,
    status,
    capabilityId: source.capabilityId,
    requestedToolId: isKnownCanonicalToolId(source.requestedToolId)
      ? source.requestedToolId
      : null,
    sourceProductionControlledWorkerRuntimeSmokeAuthorizationAccepted:
      sourceAccepted,
    productionControlledWorkerRuntimeSmokeProofControlsAccepted: controlsAccepted,
    productionControlledWorkerRuntimeSmokeProofCompletedWithProvidedEvidence:
      proofCompleted,
    missingProofControls: missingControls,
    rejectionReasons,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    gpuRuntimeTargetedTools: 8,
    productionControlledToolCallReadyNowTools: sourceAccepted ? 21 : 0,
    runtimeReadyForOnDemandProductionToolCallTools: 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    inMemoryWorkerLeasesCreated: record?.inMemoryLeaseCreated === true ? 1 : 0,
    inMemoryWorkerLeasesReleased: record?.inMemoryLeaseReleased === true ? 1 : 0,
    liveWorkerLeasesCreatedNow: 0,
    liveWorkerDispatchesNow: 0,
    liveToolExecutionsNow: 0,
    gpuRuntimeShouldStartNow: false,
    runtimeSmokeProofRecord: record,
    policy: {
      sourceRuntimeSmokeAuthorizationRequired: true,
      privateProofRefsRequired: true,
      nonProductionDryRunOnly: true,
      dispatcherMayCreateInMemoryLeaseOnly: true,
      noLiveWorkerLeaseCreationByProof: true,
      noLiveWorkerDispatchByProof: true,
      noToolExecutionByProof: true,
      noProviderRuntimeByProof: true,
      noBrowserWebglCanvasRuntimeByProof: true,
      noGpuRuntimeStartByProof: true,
      noPrivateArtifactWriteByProof: true,
      publicArtifactsRejected: true,
      signedUrlsRejected: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      nextGateRequiresPrivateArtifactToolRouteProofPacket: true,
    },
    booleans: {
      productionControlledWorkerRuntimeSmokeProofPrepared: true,
      sourceProductionControlledWorkerRuntimeSmokeAuthorizationAccepted:
        sourceAccepted,
      productionControlledWorkerRuntimeSmokeProofControlsAccepted:
        controlsAccepted,
      productionControlledWorkerRuntimeSmokeProofCompletedWithProvidedEvidence:
        proofCompleted,
      productionWorkerDispatcherDryRunExercised:
        record?.dispatcherEvaluated === true,
      dryRunWorkerModeAllowed: record?.executionMode === 'dry_run',
      allWorkerGatesPassed: record?.allGatesPassed === true,
      inMemoryWorkerLeaseCreated: record?.inMemoryLeaseCreated === true,
      inMemoryWorkerLeaseReleased: record?.inMemoryLeaseReleased === true,
      aiGraphicsToolCallHandoffRouteOutputCreated:
        record?.aiGraphicsToolCallHandoffResultCreated === true,
      allToolRunResultsEmpty: record?.toolRunResultsCreated === 0,
      allArtifactRecordsEmpty: record?.artifactRecordsCreated === 0,
      allQualityGateResultsEmpty: record?.qualityGateResultsCreated === 0,
      allFallbackDecisionsEmpty: record?.fallbackDecisionsCreated === 0,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all8GpuToolsTargetGpuRuntime: true,
      productionControlledToolCallReadyNow: sourceAccepted,
      runtimeReadyForOnDemandProductionToolCall: false,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForApprovedWorkerOrToolCall: true,
      futureSmokeUsedPrivateNonProductionDryRun: record?.executionMode === 'dry_run',
      gpuRuntimeStartAllowedForAcceptedDryRunWorkerJob:
        record?.gpuRuntimeStartAllowedForAcceptedDryRunWorkerJob ?? false,
      gpuRuntimeShouldStartNow: false,
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: false,
      directAgentToolExecutionApprovedNow: false,
      routeExecutionApprovedNow: false,
      workerExecutionApprovedNow: false,
      workerQueueApprovedNow: false,
      workerLeaseCreationApprovedNow: false,
      workerDispatchApprovedNow: false,
      productionWorkerDispatchApprovedNow: false,
      nonProductionWorkerRuntimeSmokeAuthorizedNow: false,
      serviceRoleQueueTransactionApprovedNow: false,
      liveQueueWriteApprovedNow: false,
      privateArtifactWriteApprovedNow: false,
      toolExecutionApprovedNow: false,
      providerRuntimeApprovedNow: false,
      browserWebglCanvasRuntimeApprovedNow: false,
      gpuRuntimeApprovedNow: false,
      runtimeReadyNow: false,
      internalBetaReadyNow: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
      dependencyInstallPerformed: false,
      packageLockMutationPerformed: false,
      toolExecutionPerformed: false,
      workerExecutionPerformed: false,
      workerEnqueuePerformed: false,
      workerDispatchPerformed: false,
      routeExecutionPerformed: false,
      backendQueueSubmissionPerformed: false,
      serviceRoleTransactionPerformed: false,
      supabaseMutationPerformed: false,
      workerLeaseCreated: false,
      providerRuntimePerformed: false,
      browserWebglCanvasRuntimePerformed: false,
      gpuRuntimePerformed: false,
      gpuRuntimeShouldStartNowPerformed: false,
      modelWeightsDownloaded: false,
      modelWeightsLoaded: false,
      mediaProcessingPerformed: false,
      gcsUploadPerformed: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
    },
  }
}
