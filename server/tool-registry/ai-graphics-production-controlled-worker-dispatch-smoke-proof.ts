import {
  acceptedAiGraphicsProductionControlledDispatchAuthorizationProof,
  evaluateAiGraphicsProductionControlledDispatchAuthorizationProof,
  type AiGraphicsProductionControlledDispatchAuthorizationProof,
  type AiGraphicsProductionControlledDispatchAuthorizationProofInput,
} from './ai-graphics-production-controlled-dispatch-authorization-proof'
import {
  createProductionWorkerRuntimeState,
  dispatchProductionWorkerJob,
  type ProductionWorkerEventType,
} from '../workers/production'

export const AI_GRAPHICS_PRODUCTION_CONTROLLED_WORKER_DISPATCH_SMOKE_PROOF_DECISION =
  'ai_graphics_production_controlled_worker_dispatch_smoke_proof_blocked_before_runtime'

export type AiGraphicsProductionControlledWorkerDispatchSmokeProofStatus =
  | 'planning_metadata_selected'
  | 'missing_production_controlled_dispatch_authorization_proof'
  | 'production_controlled_dispatch_authorization_proof_rejected'
  | 'awaiting_production_controlled_worker_dispatch_smoke_controls'
  | 'production_controlled_worker_dispatch_smoke_blocked_by_worker_mode'

export interface AiGraphicsProductionControlledWorkerDispatchSmokeProofInput
  extends AiGraphicsProductionControlledDispatchAuthorizationProofInput {
  sourceProductionControlledDispatchAuthorizationProofPacket?:
    AiGraphicsProductionControlledDispatchAuthorizationProof
  productionControlledWorkerDispatchSmokeRef?: string
  productionControlledWorkerDispatchSmokeTelemetryRef?: string
  productionControlledWorkerDispatchSmokeLeaseAuditRef?: string
  productionControlledWorkerDispatchSmokeBlockedDispatchAuditRef?: string
  productionControlledWorkerDispatchSmokeCleanupRef?: string
  productionControlledWorkerDispatchSmokeWorkerInstanceRef?: string
}

export interface AiGraphicsProductionControlledWorkerDispatchSmokeRecord {
  smokeId: 'ai_graphics_production_controlled_worker_dispatch_smoke_proof'
  toolId: string
  capabilityId: string
  workerType: string
  runtimeTarget: string
  jobId: string
  sourceAuthorizationAccepted: boolean
  sourceWorkerModeGateBlocksDispatch: boolean
  payloadShapeValid: boolean
  dispatcherEvaluated: boolean
  dispatcherStatus: 'blocked'
  workerModeGateStatus: 'blocked'
  hardGateBlockCount: number
  eventNames: ProductionWorkerEventType[]
  blockedBeforeLease: boolean
  blockedBeforeRouteOutput: boolean
  inMemoryLeaseCreated: false
  inMemoryLeaseReleased: false
  toolRunResultsCreated: 0
  artifactRecordsCreated: 0
  qualityGateResultsCreated: 0
  gpuRuntimeShouldStartNow: false
  workerDispatchSmokeCompletedWithProvidedEvidence: boolean
  liveWorkerLeaseCreatedNow: false
  liveWorkerDispatchPerformedNow: false
  toolExecutionPerformedNow: false
}

export interface AiGraphicsProductionControlledWorkerDispatchSmokeProof {
  decision:
    typeof AI_GRAPHICS_PRODUCTION_CONTROLLED_WORKER_DISPATCH_SMOKE_PROOF_DECISION
  sourceProductionControlledDispatchAuthorizationProofDecision: string | null
  status: AiGraphicsProductionControlledWorkerDispatchSmokeProofStatus
  capabilityId: string
  requestedToolId: string | null
  executionRequested: boolean
  sourceProductionControlledDispatchAuthorizationProofAccepted: boolean
  productionControlledWorkerDispatchSmokeControlsAccepted: boolean
  productionControlledWorkerDispatchSmokeCompletedWithProvidedEvidence: boolean
  missingSmokeControls: string[]
  rejectionReasons: string[]
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  gpuRuntimeTargetedTools: 8
  productionControlledToolCallReadyNowTools: 0 | 21
  runtimeReadyForOnDemandProductionToolCallTools: 0
  productionReadyNowTools: 0
  liveWorkerLeasesCreatedNow: 0
  liveWorkerDispatchesNow: 0
  liveToolExecutionsNow: 0
  gpuRuntimeShouldStartNow: false
  controlledWorkerDispatchSmokeRecord:
    AiGraphicsProductionControlledWorkerDispatchSmokeRecord | null
  policy: {
    sideEffectFreeDispatcherSmoke: true
    sourceControlledDispatchAuthorizationRequired: true
    privateSmokeRefsRequired: true
    productionBlockedWorkerModeRequired: true
    blockedBeforeLeaseRequired: true
    blockedBeforeRuntimeRequired: true
    noToolExecutionBySmoke: true
    noProviderRuntimeBySmoke: true
    noBrowserWebglCanvasRuntimeBySmoke: true
    noGpuRuntimeStartBySmoke: true
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
  }
  booleans: {
    productionControlledWorkerDispatchSmokeProofPrepared: true
    sourceProductionControlledDispatchAuthorizationProofAccepted: boolean
    productionControlledWorkerDispatchSmokeControlsAccepted: boolean
    productionControlledWorkerDispatchSmokeCompletedWithProvidedEvidence: boolean
    productionWorkerDispatcherBoundaryExercised: boolean
    workerModeGateBlockedDispatch: boolean
    blockedBeforeWorkerLease: boolean
    blockedBeforeRouteOutput: boolean
    allToolRunResultsEmpty: boolean
    allArtifactRecordsEmpty: boolean
    allQualityGateResultsEmpty: boolean
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    all8GpuToolsTargetGpuRuntime: true
    productionControlledToolCallReadyNow: boolean
    runtimeReadyForOnDemandProductionToolCall: false
    productionRouteReadyNow: boolean
    productionWorkerPathReadyNow: boolean
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    gpuStartsOnlyForApprovedWorkerOrToolCall: true
    agentCanSelectForPlanning: true
    agentCanExecuteToolsNow: false
    directAgentToolExecutionApprovedNow: false
    routeExecutionApprovedNow: false
    workerExecutionApprovedNow: false
    workerQueueApprovedNow: false
    workerLeaseCreationApprovedNow: false
    productionWorkerDispatchApprovedNow: false
    serviceRoleQueueTransactionApprovedNow: false
    liveQueueWriteApprovedNow: false
    toolExecutionApprovedNow: false
    providerRuntimeApprovedNow: false
    browserWebglCanvasRuntimeApprovedNow: false
    gpuRuntimeApprovedNow: false
    gpuRuntimeShouldStartNow: false
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
    modelWeightsDownloaded: false
    modelWeightsLoaded: false
    mediaProcessingPerformed: false
    gcsUploadPerformed: false
    publicArtifactCreated: false
    signedUrlCreated: false
  }
}

function hasValue(value?: string): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

function isPrivateEvidenceRef(value: string | undefined): boolean {
  if (!hasValue(value)) return false
  const normalized = value.trim().toLowerCase()
  if (
    normalized.startsWith('http://') ||
    normalized.startsWith('https://') ||
    normalized.startsWith('gs://') ||
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

function missingSmokeControls(
  input: AiGraphicsProductionControlledWorkerDispatchSmokeProofInput,
): string[] {
  return [
    !isPrivateEvidenceRef(input.productionControlledWorkerDispatchSmokeRef)
      ? 'productionControlledWorkerDispatchSmokeRef: private/backend production evidence ref is required'
      : undefined,
    !isPrivateEvidenceRef(input.productionControlledWorkerDispatchSmokeTelemetryRef)
      ? 'productionControlledWorkerDispatchSmokeTelemetryRef: private/backend production evidence ref is required'
      : undefined,
    !isPrivateEvidenceRef(input.productionControlledWorkerDispatchSmokeLeaseAuditRef)
      ? 'productionControlledWorkerDispatchSmokeLeaseAuditRef: private/backend production evidence ref is required'
      : undefined,
    !isPrivateEvidenceRef(input.productionControlledWorkerDispatchSmokeBlockedDispatchAuditRef)
      ? 'productionControlledWorkerDispatchSmokeBlockedDispatchAuditRef: private/backend production evidence ref is required'
      : undefined,
    !isPrivateEvidenceRef(input.productionControlledWorkerDispatchSmokeCleanupRef)
      ? 'productionControlledWorkerDispatchSmokeCleanupRef: private/backend production evidence ref is required'
      : undefined,
    !isPrivateEvidenceRef(input.productionControlledWorkerDispatchSmokeWorkerInstanceRef)
      ? 'productionControlledWorkerDispatchSmokeWorkerInstanceRef: private/backend production evidence ref is required'
      : undefined,
  ].filter((reason): reason is string => Boolean(reason))
}

function statusFromInput(input: {
  executionRequested: boolean
  hasSource: boolean
  sourceAccepted: boolean
  controlsAccepted: boolean
  smokeCompleted: boolean
}): AiGraphicsProductionControlledWorkerDispatchSmokeProofStatus {
  if (!input.executionRequested) return 'planning_metadata_selected'
  if (!input.hasSource) {
    return 'missing_production_controlled_dispatch_authorization_proof'
  }
  if (!input.sourceAccepted) {
    return 'production_controlled_dispatch_authorization_proof_rejected'
  }
  if (!input.controlsAccepted) {
    return 'awaiting_production_controlled_worker_dispatch_smoke_controls'
  }
  return input.smokeCompleted
    ? 'production_controlled_worker_dispatch_smoke_blocked_by_worker_mode'
    : 'awaiting_production_controlled_worker_dispatch_smoke_controls'
}

async function buildSmokeRecord(input: {
  source: AiGraphicsProductionControlledDispatchAuthorizationProof
  controlsAccepted: boolean
  workerInstanceRef: string | undefined
}): Promise<AiGraphicsProductionControlledWorkerDispatchSmokeRecord | null> {
  const sourceEnvelope = input.source.sourceServiceRoleQueueTransactionDryProofEnvelope
  const candidate = input.source.controlledDispatchAuthorizationCandidate
  if (!sourceEnvelope || !candidate || !input.controlsAccepted) return null

  const state = createProductionWorkerRuntimeState()
  const result = await dispatchProductionWorkerJob({
    payload: sourceEnvelope.jobRowCandidate.payload,
    state,
    workerInstanceId:
      input.workerInstanceRef?.trim() || 'production-ai-graphics-dispatch-smoke',
  })
  const eventNames = result.events.map((event) => event.eventName)
  const workerModeGate = result.gateChecks.find((gate) => gate.gateName === 'worker_mode')
  const hardGateBlockCount = result.gateChecks.filter((gate) => gate.hardBlock).length
  const blockedBeforeLease = state.leases.length === 0 && !eventNames.includes('job_claimed')
  const blockedBeforeRouteOutput = result.output === undefined
  const toolRunResultsCreated = result.toolRunResults.length as 0
  const artifactRecordsCreated = result.artifactRecords.length as 0
  const qualityGateResultsCreated = result.qualityGateResults.length as 0
  const completed =
    result.status === 'blocked' &&
    workerModeGate?.status === 'blocked' &&
    hardGateBlockCount === 1 &&
    blockedBeforeLease &&
    blockedBeforeRouteOutput &&
    result.toolRunResults.length === 0 &&
    result.artifactRecords.length === 0 &&
    result.qualityGateResults.length === 0

  return {
    smokeId: 'ai_graphics_production_controlled_worker_dispatch_smoke_proof',
    toolId: candidate.toolId,
    capabilityId: candidate.capabilityId,
    workerType: candidate.workerType,
    runtimeTarget: candidate.runtimeTarget,
    jobId: candidate.jobId,
    sourceAuthorizationAccepted: true,
    sourceWorkerModeGateBlocksDispatch:
      candidate.sourceWorkerModeGateBlocksDispatch,
    payloadShapeValid: Boolean(
      sourceEnvelope.jobRowCandidate.payload.idempotencyKey &&
        sourceEnvelope.jobRowCandidate.payload.executionMode === 'production_blocked' &&
        sourceEnvelope.jobRowCandidate.payload.metadata?.aiGraphicsCanonicalToolId ===
          candidate.toolId &&
        sourceEnvelope.jobRowCandidate.payload.metadata?.gpuRuntimeShouldStartNow === false,
    ),
    dispatcherEvaluated: true,
    dispatcherStatus: 'blocked',
    workerModeGateStatus: 'blocked',
    hardGateBlockCount,
    eventNames,
    blockedBeforeLease,
    blockedBeforeRouteOutput,
    inMemoryLeaseCreated: false,
    inMemoryLeaseReleased: false,
    toolRunResultsCreated,
    artifactRecordsCreated,
    qualityGateResultsCreated,
    gpuRuntimeShouldStartNow: false,
    workerDispatchSmokeCompletedWithProvidedEvidence: completed,
    liveWorkerLeaseCreatedNow: false,
    liveWorkerDispatchPerformedNow: false,
    toolExecutionPerformedNow: false,
  }
}

export function acceptedAiGraphicsProductionControlledWorkerDispatchSmokeProof(
  packet: AiGraphicsProductionControlledWorkerDispatchSmokeProof | undefined,
): packet is AiGraphicsProductionControlledWorkerDispatchSmokeProof {
  return Boolean(
    packet &&
      packet.decision ===
        AI_GRAPHICS_PRODUCTION_CONTROLLED_WORKER_DISPATCH_SMOKE_PROOF_DECISION &&
      packet.status ===
        'production_controlled_worker_dispatch_smoke_blocked_by_worker_mode' &&
      packet.sourceProductionControlledDispatchAuthorizationProofAccepted === true &&
      packet.productionControlledWorkerDispatchSmokeCompletedWithProvidedEvidence === true &&
      packet.controlledWorkerDispatchSmokeRecord?.workerModeGateStatus === 'blocked' &&
      packet.controlledWorkerDispatchSmokeRecord.blockedBeforeLease === true &&
      packet.controlledWorkerDispatchSmokeRecord.blockedBeforeRouteOutput === true &&
      packet.liveWorkerLeasesCreatedNow === 0 &&
      packet.liveWorkerDispatchesNow === 0 &&
      packet.liveToolExecutionsNow === 0 &&
      packet.gpuRuntimeShouldStartNow === false &&
      packet.booleans.workerLeaseCreated === false &&
      packet.booleans.workerDispatchPerformed === false &&
      packet.booleans.toolExecutionPerformed === false &&
      packet.booleans.runtimeReadyNow === false &&
      packet.booleans.productionReadyNow === false,
  )
}

export async function evaluateAiGraphicsProductionControlledWorkerDispatchSmokeProof(
  input: AiGraphicsProductionControlledWorkerDispatchSmokeProofInput = {},
): Promise<AiGraphicsProductionControlledWorkerDispatchSmokeProof> {
  const source =
    input.sourceProductionControlledDispatchAuthorizationProofPacket ??
    evaluateAiGraphicsProductionControlledDispatchAuthorizationProof(input)
  const executionRequested =
    input.executionRequested === true || source.executionRequested === true
  const sourceAccepted =
    acceptedAiGraphicsProductionControlledDispatchAuthorizationProof(source)
  const missingControls =
    executionRequested && sourceAccepted ? missingSmokeControls(input) : []
  const controlsAccepted = executionRequested && sourceAccepted && missingControls.length === 0
  const record = await buildSmokeRecord({
    source,
    controlsAccepted,
    workerInstanceRef: input.productionControlledWorkerDispatchSmokeWorkerInstanceRef,
  })
  const smokeCompleted = record?.workerDispatchSmokeCompletedWithProvidedEvidence === true
  const rejectionReasons = [
    executionRequested && !input.sourceProductionControlledDispatchAuthorizationProofPacket
      ? 'source production controlled dispatch authorization proof packet is missing'
      : undefined,
    executionRequested &&
      input.sourceProductionControlledDispatchAuthorizationProofPacket &&
      !sourceAccepted
      ? 'source production controlled dispatch authorization proof packet is not accepted'
      : undefined,
    ...missingControls,
    controlsAccepted && !smokeCompleted
      ? 'production controlled worker dispatch smoke did not block before runtime'
      : undefined,
  ].filter((reason): reason is string => Boolean(reason))

  return {
    decision: AI_GRAPHICS_PRODUCTION_CONTROLLED_WORKER_DISPATCH_SMOKE_PROOF_DECISION,
    sourceProductionControlledDispatchAuthorizationProofDecision:
      source.decision ?? null,
    status: statusFromInput({
      executionRequested,
      hasSource: Boolean(input.sourceProductionControlledDispatchAuthorizationProofPacket),
      sourceAccepted,
      controlsAccepted,
      smokeCompleted,
    }),
    capabilityId: source.capabilityId,
    requestedToolId: source.requestedToolId,
    executionRequested,
    sourceProductionControlledDispatchAuthorizationProofAccepted: sourceAccepted,
    productionControlledWorkerDispatchSmokeControlsAccepted: controlsAccepted,
    productionControlledWorkerDispatchSmokeCompletedWithProvidedEvidence:
      smokeCompleted,
    missingSmokeControls: missingControls,
    rejectionReasons,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    gpuRuntimeTargetedTools: 8,
    productionControlledToolCallReadyNowTools: sourceAccepted ? 21 : 0,
    runtimeReadyForOnDemandProductionToolCallTools: 0,
    productionReadyNowTools: 0,
    liveWorkerLeasesCreatedNow: 0,
    liveWorkerDispatchesNow: 0,
    liveToolExecutionsNow: 0,
    gpuRuntimeShouldStartNow: false,
    controlledWorkerDispatchSmokeRecord: record,
    policy: {
      sideEffectFreeDispatcherSmoke: true,
      sourceControlledDispatchAuthorizationRequired: true,
      privateSmokeRefsRequired: true,
      productionBlockedWorkerModeRequired: true,
      blockedBeforeLeaseRequired: true,
      blockedBeforeRuntimeRequired: true,
      noToolExecutionBySmoke: true,
      noProviderRuntimeBySmoke: true,
      noBrowserWebglCanvasRuntimeBySmoke: true,
      noGpuRuntimeStartBySmoke: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
    },
    booleans: {
      productionControlledWorkerDispatchSmokeProofPrepared: true,
      sourceProductionControlledDispatchAuthorizationProofAccepted: sourceAccepted,
      productionControlledWorkerDispatchSmokeControlsAccepted: controlsAccepted,
      productionControlledWorkerDispatchSmokeCompletedWithProvidedEvidence:
        smokeCompleted,
      productionWorkerDispatcherBoundaryExercised:
        record?.dispatcherEvaluated === true,
      workerModeGateBlockedDispatch:
        record?.workerModeGateStatus === 'blocked',
      blockedBeforeWorkerLease: record?.blockedBeforeLease === true,
      blockedBeforeRouteOutput: record?.blockedBeforeRouteOutput === true,
      allToolRunResultsEmpty: record?.toolRunResultsCreated === 0,
      allArtifactRecordsEmpty: record?.artifactRecordsCreated === 0,
      allQualityGateResultsEmpty: record?.qualityGateResultsCreated === 0,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all8GpuToolsTargetGpuRuntime: true,
      productionControlledToolCallReadyNow: sourceAccepted,
      runtimeReadyForOnDemandProductionToolCall: false,
      productionRouteReadyNow: sourceAccepted,
      productionWorkerPathReadyNow: sourceAccepted,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForApprovedWorkerOrToolCall: true,
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: false,
      directAgentToolExecutionApprovedNow: false,
      routeExecutionApprovedNow: false,
      workerExecutionApprovedNow: false,
      workerQueueApprovedNow: false,
      workerLeaseCreationApprovedNow: false,
      productionWorkerDispatchApprovedNow: false,
      serviceRoleQueueTransactionApprovedNow: false,
      liveQueueWriteApprovedNow: false,
      toolExecutionApprovedNow: false,
      providerRuntimeApprovedNow: false,
      browserWebglCanvasRuntimeApprovedNow: false,
      gpuRuntimeApprovedNow: false,
      gpuRuntimeShouldStartNow: false,
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
      modelWeightsDownloaded: false,
      modelWeightsLoaded: false,
      mediaProcessingPerformed: false,
      gcsUploadPerformed: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
    },
  }
}
