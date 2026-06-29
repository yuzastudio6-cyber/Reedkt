import {
  AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_QUEUE_SMOKE_PROOF_DECISION,
  type AiGraphicsExternalBetaApiRouteQueueSmokeProof,
} from './ai-graphics-external-beta-api-route-queue-smoke-proof'
import {
  AI_GRAPHICS_EXTERNAL_BETA_WORKER_DISPATCH_SMOKE_PROOF_DECISION,
  type AiGraphicsExternalBetaWorkerDispatchSmokeProof,
} from './ai-graphics-external-beta-worker-dispatch-smoke-proof'

export const AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_WORKER_DISPATCH_HANDOFF_PROOF_DECISION =
  'ai_graphics_external_beta_api_route_worker_dispatch_handoff_proof_prepared_with_runtime_blocks'

export type AiGraphicsExternalBetaApiRouteWorkerDispatchHandoffProofStatus =
  | 'missing_external_beta_api_route_queue_smoke_proof'
  | 'external_beta_api_route_queue_smoke_proof_rejected'
  | 'missing_external_beta_worker_dispatch_smoke_proof'
  | 'external_beta_worker_dispatch_smoke_proof_rejected'
  | 'missing_external_beta_route_worker_dispatch_handoff_controls'
  | 'external_beta_api_route_worker_dispatch_handoff_proof_ready_runtime_still_blocked'

export interface AiGraphicsExternalBetaApiRouteWorkerDispatchHandoffProofInput {
  sourceExternalBetaApiRouteQueueSmokeProofPacket?:
    AiGraphicsExternalBetaApiRouteQueueSmokeProof
  sourceExternalBetaWorkerDispatchSmokeProofPacket?:
    AiGraphicsExternalBetaWorkerDispatchSmokeProof
  externalBetaRouteWorkerDispatchHandoffPolicyRef?: string
  externalBetaWorkerLeasePolicyRef?: string
  externalBetaWorkerDispatchPolicyRef?: string
  externalBetaWorkerIdempotencyPolicyRef?: string
  externalBetaGpuOnDemandPolicyRef?: string
  externalBetaPrivateArtifactPolicyRef?: string
  externalBetaTelemetryRef?: string
  externalBetaRollbackPlanRef?: string
}

export interface AiGraphicsExternalBetaApiRouteWorkerDispatchHandoffCandidate {
  handoffId: 'ai_graphics_external_beta_api_route_worker_dispatch_handoff_proof'
  toolId: string
  capabilityId: string
  routePath: '/api/ai-graphics/external-beta/tool-call'
  queueName: string
  queueJobType: 'ai_graphics_tool_runtime'
  approvedPlanSnapshotId: string
  creditReservationId: string
  privateArtifactManifestRef: string
  idempotencyKey: string
  runtimeTarget: string
  workerType: string
  gpuRequiredForRuntime: boolean
  sourceApiRouteQueueSmokeProofAccepted: boolean
  sourceWorkerDispatchSmokeProofAccepted: boolean
  sourceWorkerDispatchSmokeProofCoversTool: boolean
  apiRouteWorkerDispatchHandoffPreparedWithProvidedEvidence: true
  gpuRuntimeStartAllowedForAcceptedExternalBetaJob: boolean
  gpuRuntimeShouldStartNow: false
  liveWorkerLeaseCreatedNow: false
  liveWorkerDispatchPerformedNow: false
  toolExecutionPerformedNow: false
  providerRuntimePerformedNow: false
  publicArtifactCreatedNow: false
  signedUrlCreatedNow: false
}

export interface AiGraphicsExternalBetaApiRouteWorkerDispatchHandoffProof {
  decision:
    typeof AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_WORKER_DISPATCH_HANDOFF_PROOF_DECISION
  sourceExternalBetaApiRouteQueueSmokeProofDecision:
    typeof AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_QUEUE_SMOKE_PROOF_DECISION | null
  sourceExternalBetaWorkerDispatchSmokeProofDecision:
    typeof AI_GRAPHICS_EXTERNAL_BETA_WORKER_DISPATCH_SMOKE_PROOF_DECISION | null
  status: AiGraphicsExternalBetaApiRouteWorkerDispatchHandoffProofStatus
  requestedToolId: string | null
  capabilityId: string | null
  sourceApiRouteQueueSmokeProofAccepted: boolean
  sourceWorkerDispatchSmokeProofAccepted: boolean
  missingHandoffControls: string[]
  apiRouteWorkerDispatchHandoffPreparedWithProvidedEvidence: boolean
  apiRouteWorkerDispatchHandoffPreparedRequestsWithProvidedEvidence: 0 | 1
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  gpuRuntimeTargetedTools: 8
  sourceWorkerDispatchSmokeProofAcceptedToolsWithProvidedEvidence: number
  sourceRouteQueueSmokeRowsAcceptedWithProvidedEvidence: number
  sourceRouteQueueRowsPersistedAfterCleanup: 0
  sourceWorkerDispatchSmokeInMemoryLeasesAcceptedWithProvidedEvidence: number
  liveWorkerLeasesCreatedNow: 0
  liveWorkerDispatchesNow: 0
  liveToolExecutionsNow: 0
  externalBetaReadyNowTools: 0
  productionReadyNowTools: 0
  gpuRuntimeShouldStartNow: false
  handoffCandidate: AiGraphicsExternalBetaApiRouteWorkerDispatchHandoffCandidate | null
  evidence: {
    routeWorkerDispatchHandoffPolicyRef: string | null
    workerLeasePolicyRef: string | null
    workerDispatchPolicyRef: string | null
    workerIdempotencyPolicyRef: string | null
    gpuOnDemandPolicyRef: string | null
    privateArtifactPolicyRef: string | null
    telemetryRef: string | null
    rollbackPlanRef: string | null
    sourceRouteQueueSmokeProofStatus: string | null
    sourceWorkerDispatchSmokeProofStatus: string | null
    requiredExecutionEnvironment: 'private_non_production_external_beta'
    requiredWorkerMode: 'mock_dispatch_proof_only'
    savedRouteQueueSmokeProofRequired: true
    savedWorkerDispatchSmokeProofRequired: true
  }
  policy: {
    validatesSavedProofPacketsOnly: true
    noLiveWorkerLeaseByHandoffProof: true
    noLiveWorkerDispatchByHandoffProof: true
    noToolExecutionByHandoffProof: true
    noProviderRuntimeByHandoffProof: true
    noBrowserWebglCanvasRuntimeByHandoffProof: true
    noGpuRuntimeStartByHandoffProof: true
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    nextGateRequiresPrivateArtifactAndToolRouteRuntimeProof: true
  }
  booleans: {
    externalBetaApiRouteWorkerDispatchHandoffProofPrepared: true
    sourceExternalBetaApiRouteQueueSmokeProofAccepted: boolean
    sourceExternalBetaWorkerDispatchSmokeProofAccepted: boolean
    sourceWorkerDispatchSmokeProofCoversRequestedTool: boolean
    apiRouteWorkerDispatchHandoffPreparedWithProvidedEvidence: boolean
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    all8GpuToolsTargetGpuRuntime: true
    routeQueueSmokeCleanupVerifiedWithProvidedEvidence: boolean
    workerDispatchSmokeInMemoryLeasesAcceptedWithProvidedEvidence: boolean
    workerDispatchSmokeNoToolExecutionAcceptedWithProvidedEvidence: boolean
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    gpuStartsOnlyForApprovedWorkerOrToolCall: true
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob: boolean
    gpuRuntimeShouldStartNow: false
    agentCanSelectForPlanning: true
    agentCanExecuteToolsNow: false
    externalBetaCallableNow: false
    apiRouteQueueSmokeApprovedNow: false
    apiRouteMountedNow: false
    apiRouteExecutionApprovedNow: false
    apiRouteExecutionPerformed: false
    routeExecutionApprovedNow: false
    workerExecutionApprovedNow: false
    workerQueueApprovedNow: false
    backendQueueSubmissionApprovedNow: false
    serviceRoleQueueTransactionApprovedNow: false
    liveQueueWriteApprovedNow: false
    liveQueueWritePerformed: false
    workerLeaseCreationApprovedNow: false
    workerDispatchApprovedNow: false
    productionWorkerDispatchApprovedNow: false
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
    routeExecutionPerformed: false
    backendQueueSubmissionPerformed: false
    serviceRoleQueueSmokePerformed: false
    serviceRoleTransactionPerformed: false
    supabaseMutationPerformed: false
    workerLeaseCreated: false
    workerDispatchPerformed: false
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

function hasValue(value?: string | null): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

function hasPrivateEvidenceRef(value?: string | null): boolean {
  if (!hasValue(value)) return false
  const normalized = value?.trim().toLowerCase() ?? ''
  if (
    normalized.includes('signed-url') ||
    normalized.includes('public-artifact') ||
    normalized.includes('/public/')
  ) {
    return false
  }
  return normalized.startsWith('private://') ||
    normalized.startsWith('backend://') ||
    normalized.startsWith('external-beta-runtime://') ||
    normalized.startsWith('external-beta-evidence://') ||
    normalized.startsWith('external-beta-route-worker-dispatch://')
}

function routeQueueSmokeProofAccepted(
  packet?: AiGraphicsExternalBetaApiRouteQueueSmokeProof,
): boolean {
  return Boolean(packet) &&
    packet?.decision === AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_QUEUE_SMOKE_PROOF_DECISION &&
    packet.status ===
      'external_beta_api_route_queue_smoke_proof_accepted_with_runtime_blocks' &&
    packet.proofAcceptedWithProvidedEvidence === true &&
    packet.apiRouteQueueSmokeProofAcceptedRequestsWithProvidedEvidence === 1 &&
    packet.liveQueueRowsAcceptedWithProvidedEvidence === 1 &&
    packet.liveQueueRowsPersistedAfterCleanup === 0 &&
    packet.liveWorkerClaimsAcceptedWithProvidedEvidence === 0 &&
    packet.liveWorkerDispatchesAcceptedWithProvidedEvidence === 0 &&
    packet.liveToolExecutionsAcceptedWithProvidedEvidence === 0 &&
    packet.totalAiGraphicsTools === 21 &&
    packet.totalProductFacingCapabilities === 12 &&
    packet.gpuRuntimeTargetedTools === 8 &&
    packet.sourceAuthorizationCandidate !== null &&
    packet.savedApiRouteQueueSmokeResult !== null &&
    packet.sourceAuthorizationCandidate?.toolId === packet.savedApiRouteQueueSmokeResult?.toolId &&
    packet.externalBetaReadyNowTools === 0 &&
    packet.productionReadyNowTools === 0 &&
    packet.booleans.all21ToolsCovered === true &&
    packet.booleans.all12CapabilitiesCovered === true &&
    packet.booleans.all8GpuToolsTargetGpuRuntime === true &&
    packet.booleans.gpuRuntimeOnDemandOnly === true &&
    packet.booleans.noIdleGpuRuntimeApproved === true &&
    packet.booleans.gpuRuntimeShouldStartNow === false &&
    packet.booleans.apiRouteExecutionPerformed === false &&
    packet.booleans.liveQueueWritePerformed === false &&
    packet.booleans.workerDispatchPerformed === false &&
    packet.booleans.toolExecutionPerformed === false &&
    packet.booleans.externalBetaReadyNow === false &&
    packet.booleans.productionReadyNow === false
}

function workerDispatchSmokeProofAccepted(
  packet?: AiGraphicsExternalBetaWorkerDispatchSmokeProof,
): boolean {
  return Boolean(packet) &&
    packet?.sourceDecision === AI_GRAPHICS_EXTERNAL_BETA_WORKER_DISPATCH_SMOKE_PROOF_DECISION &&
    packet.decision ===
      'external_beta_worker_dispatch_smoke_proof_accepted_with_runtime_blocks' &&
    packet.proofAcceptedWithProvidedEvidence === true &&
    packet.counts.workerDispatchSmokeProofAcceptedToolsWithProvidedEvidence === 21 &&
    packet.counts.sourceSmokeJobsCompletedWithProvidedEvidence === 21 &&
    packet.counts.sourceCapabilityScenariosCompletedWithProvidedEvidence === 12 &&
    packet.counts.sourceInMemoryLeaseRecordsCreated === 21 &&
    packet.counts.sourceInMemoryLeaseRecordsReleased === 21 &&
    packet.counts.sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence === 21 &&
    packet.counts.sourceServiceRoleQueueSmokeAuthorizationAcceptedWithProvidedEvidence === 21 &&
    packet.counts.sourceLiveWorkerLeasesCreatedNow === 0 &&
    packet.counts.sourceLiveWorkerDispatchesNow === 0 &&
    packet.counts.sourceLiveToolExecutionsNow === 0 &&
    packet.counts.externalBetaReadyNowTools === 0 &&
    packet.counts.productionReadyNowTools === 0 &&
    packet.acceptedTools.length === 21 &&
    packet.acceptedGpuTools.length === 8 &&
    packet.booleans.all21ToolsCovered === true &&
    packet.booleans.all12CapabilitiesCovered === true &&
    packet.booleans.all8GpuToolsTargetGpuRuntime === true &&
    packet.booleans.allInMemoryLeasesCreatedWithProvidedEvidence === true &&
    packet.booleans.allInMemoryLeasesReleasedWithProvidedEvidence === true &&
    packet.booleans.allToolRunResultsEmpty === true &&
    packet.booleans.allArtifactRecordsEmpty === true &&
    packet.booleans.allQualityGateResultsEmpty === true &&
    packet.booleans.gpuRuntimeOnDemandOnly === true &&
    packet.booleans.noIdleGpuRuntimeApproved === true &&
    packet.booleans.gpuRuntimeShouldStartNow === false &&
    packet.booleans.workerDispatchPerformed === false &&
    packet.booleans.toolExecutionPerformed === false &&
    packet.booleans.externalBetaReadyNow === false &&
    packet.booleans.productionReadyNow === false
}

function missingHandoffControls(
  input: AiGraphicsExternalBetaApiRouteWorkerDispatchHandoffProofInput,
): string[] {
  return [
    !hasPrivateEvidenceRef(input.externalBetaRouteWorkerDispatchHandoffPolicyRef)
      ? 'external beta route worker dispatch handoff policy ref is missing or not private'
      : undefined,
    !hasPrivateEvidenceRef(input.externalBetaWorkerLeasePolicyRef)
      ? 'external beta worker lease policy ref is missing or not private'
      : undefined,
    !hasPrivateEvidenceRef(input.externalBetaWorkerDispatchPolicyRef)
      ? 'external beta worker dispatch policy ref is missing or not private'
      : undefined,
    !hasPrivateEvidenceRef(input.externalBetaWorkerIdempotencyPolicyRef)
      ? 'external beta worker idempotency policy ref is missing or not private'
      : undefined,
    !hasPrivateEvidenceRef(input.externalBetaGpuOnDemandPolicyRef)
      ? 'external beta GPU on-demand policy ref is missing or not private'
      : undefined,
    !hasPrivateEvidenceRef(input.externalBetaPrivateArtifactPolicyRef)
      ? 'external beta private artifact policy ref is missing or not private'
      : undefined,
    !hasPrivateEvidenceRef(input.externalBetaTelemetryRef)
      ? 'external beta telemetry ref is missing or not private'
      : undefined,
    !hasPrivateEvidenceRef(input.externalBetaRollbackPlanRef)
      ? 'external beta rollback plan ref is missing or not private'
      : undefined,
  ].filter((reason): reason is string => Boolean(reason))
}

function buildHandoffCandidate(input: {
  routeAccepted: boolean
  workerAccepted: boolean
  workerCoversTool: boolean
  sourceRoute?: AiGraphicsExternalBetaApiRouteQueueSmokeProof
}): AiGraphicsExternalBetaApiRouteWorkerDispatchHandoffCandidate | null {
  const sourceCandidate = input.sourceRoute?.sourceAuthorizationCandidate
  if (!input.routeAccepted || !input.workerAccepted || !input.workerCoversTool || !sourceCandidate) {
    return null
  }
  return {
    handoffId: 'ai_graphics_external_beta_api_route_worker_dispatch_handoff_proof',
    toolId: sourceCandidate.toolId,
    capabilityId: sourceCandidate.capabilityId,
    routePath: sourceCandidate.routePath,
    queueName: sourceCandidate.queueName,
    queueJobType: sourceCandidate.queueJobType,
    approvedPlanSnapshotId: sourceCandidate.approvedPlanSnapshotId,
    creditReservationId: sourceCandidate.creditReservationId,
    privateArtifactManifestRef: sourceCandidate.privateArtifactManifestRef,
    idempotencyKey: sourceCandidate.idempotencyKey,
    runtimeTarget: sourceCandidate.runtimeTarget,
    workerType: sourceCandidate.workerType,
    gpuRequiredForRuntime: sourceCandidate.gpuRequiredForRuntime,
    sourceApiRouteQueueSmokeProofAccepted: input.routeAccepted,
    sourceWorkerDispatchSmokeProofAccepted: input.workerAccepted,
    sourceWorkerDispatchSmokeProofCoversTool: input.workerCoversTool,
    apiRouteWorkerDispatchHandoffPreparedWithProvidedEvidence: true,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob:
      sourceCandidate.gpuRuntimeStartAllowedForAcceptedExternalBetaJob,
    gpuRuntimeShouldStartNow: false,
    liveWorkerLeaseCreatedNow: false,
    liveWorkerDispatchPerformedNow: false,
    toolExecutionPerformedNow: false,
    providerRuntimePerformedNow: false,
    publicArtifactCreatedNow: false,
    signedUrlCreatedNow: false,
  }
}

export function evaluateAiGraphicsExternalBetaApiRouteWorkerDispatchHandoffProof(
  input: AiGraphicsExternalBetaApiRouteWorkerDispatchHandoffProofInput = {},
): AiGraphicsExternalBetaApiRouteWorkerDispatchHandoffProof {
  const routePacket =
    input.sourceExternalBetaApiRouteQueueSmokeProofPacket
  const workerPacket =
    input.sourceExternalBetaWorkerDispatchSmokeProofPacket
  const routeAccepted = routeQueueSmokeProofAccepted(routePacket)
  const workerAccepted = workerDispatchSmokeProofAccepted(workerPacket)
  const requestedToolId =
    routePacket?.sourceAuthorizationCandidate?.toolId ??
    routePacket?.requestedToolId ??
    null
  const capabilityId =
    routePacket?.sourceAuthorizationCandidate?.capabilityId ??
    routePacket?.capabilityId ??
    null
  const workerCoversTool =
    Boolean(requestedToolId) &&
    workerAccepted &&
    workerPacket?.acceptedTools.includes(requestedToolId as never) === true
  const controls = missingHandoffControls(input)
  const handoffReady =
    routeAccepted && workerAccepted && workerCoversTool && controls.length === 0
  const handoffCandidate = buildHandoffCandidate({
    routeAccepted,
    workerAccepted,
    workerCoversTool,
    sourceRoute: routePacket,
  })
  const status: AiGraphicsExternalBetaApiRouteWorkerDispatchHandoffProofStatus =
    !routePacket
      ? 'missing_external_beta_api_route_queue_smoke_proof'
      : !routeAccepted
        ? 'external_beta_api_route_queue_smoke_proof_rejected'
        : !workerPacket
          ? 'missing_external_beta_worker_dispatch_smoke_proof'
          : !workerAccepted || !workerCoversTool
            ? 'external_beta_worker_dispatch_smoke_proof_rejected'
            : controls.length > 0
              ? 'missing_external_beta_route_worker_dispatch_handoff_controls'
              : 'external_beta_api_route_worker_dispatch_handoff_proof_ready_runtime_still_blocked'

  return {
    decision:
      AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_WORKER_DISPATCH_HANDOFF_PROOF_DECISION,
    sourceExternalBetaApiRouteQueueSmokeProofDecision:
      routePacket?.decision ?? null,
    sourceExternalBetaWorkerDispatchSmokeProofDecision:
      workerPacket?.sourceDecision ?? null,
    status,
    requestedToolId,
    capabilityId,
    sourceApiRouteQueueSmokeProofAccepted: routeAccepted,
    sourceWorkerDispatchSmokeProofAccepted: workerAccepted,
    missingHandoffControls: controls,
    apiRouteWorkerDispatchHandoffPreparedWithProvidedEvidence: handoffReady,
    apiRouteWorkerDispatchHandoffPreparedRequestsWithProvidedEvidence:
      handoffReady ? 1 : 0,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    gpuRuntimeTargetedTools: 8,
    sourceWorkerDispatchSmokeProofAcceptedToolsWithProvidedEvidence:
      workerAccepted
        ? workerPacket?.counts.workerDispatchSmokeProofAcceptedToolsWithProvidedEvidence ?? 0
        : 0,
    sourceRouteQueueSmokeRowsAcceptedWithProvidedEvidence:
      routeAccepted ? 1 : 0,
    sourceRouteQueueRowsPersistedAfterCleanup: 0,
    sourceWorkerDispatchSmokeInMemoryLeasesAcceptedWithProvidedEvidence:
      workerAccepted ? workerPacket?.counts.sourceInMemoryLeaseRecordsCreated ?? 0 : 0,
    liveWorkerLeasesCreatedNow: 0,
    liveWorkerDispatchesNow: 0,
    liveToolExecutionsNow: 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    gpuRuntimeShouldStartNow: false,
    handoffCandidate,
    evidence: {
      routeWorkerDispatchHandoffPolicyRef:
        input.externalBetaRouteWorkerDispatchHandoffPolicyRef ?? null,
      workerLeasePolicyRef: input.externalBetaWorkerLeasePolicyRef ?? null,
      workerDispatchPolicyRef: input.externalBetaWorkerDispatchPolicyRef ?? null,
      workerIdempotencyPolicyRef:
        input.externalBetaWorkerIdempotencyPolicyRef ?? null,
      gpuOnDemandPolicyRef: input.externalBetaGpuOnDemandPolicyRef ?? null,
      privateArtifactPolicyRef:
        input.externalBetaPrivateArtifactPolicyRef ?? null,
      telemetryRef: input.externalBetaTelemetryRef ?? null,
      rollbackPlanRef: input.externalBetaRollbackPlanRef ?? null,
      sourceRouteQueueSmokeProofStatus: routePacket?.status ?? null,
      sourceWorkerDispatchSmokeProofStatus: workerPacket?.decision ?? null,
      requiredExecutionEnvironment: 'private_non_production_external_beta',
      requiredWorkerMode: 'mock_dispatch_proof_only',
      savedRouteQueueSmokeProofRequired: true,
      savedWorkerDispatchSmokeProofRequired: true,
    },
    policy: {
      validatesSavedProofPacketsOnly: true,
      noLiveWorkerLeaseByHandoffProof: true,
      noLiveWorkerDispatchByHandoffProof: true,
      noToolExecutionByHandoffProof: true,
      noProviderRuntimeByHandoffProof: true,
      noBrowserWebglCanvasRuntimeByHandoffProof: true,
      noGpuRuntimeStartByHandoffProof: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      nextGateRequiresPrivateArtifactAndToolRouteRuntimeProof: true,
    },
    booleans: {
      externalBetaApiRouteWorkerDispatchHandoffProofPrepared: true,
      sourceExternalBetaApiRouteQueueSmokeProofAccepted: routeAccepted,
      sourceExternalBetaWorkerDispatchSmokeProofAccepted: workerAccepted,
      sourceWorkerDispatchSmokeProofCoversRequestedTool: workerCoversTool,
      apiRouteWorkerDispatchHandoffPreparedWithProvidedEvidence: handoffReady,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all8GpuToolsTargetGpuRuntime: true,
      routeQueueSmokeCleanupVerifiedWithProvidedEvidence: routeAccepted,
      workerDispatchSmokeInMemoryLeasesAcceptedWithProvidedEvidence:
        workerAccepted,
      workerDispatchSmokeNoToolExecutionAcceptedWithProvidedEvidence:
        workerAccepted,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForApprovedWorkerOrToolCall: true,
      gpuRuntimeStartAllowedForAcceptedExternalBetaJob:
        handoffCandidate?.gpuRuntimeStartAllowedForAcceptedExternalBetaJob ?? false,
      gpuRuntimeShouldStartNow: false,
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: false,
      externalBetaCallableNow: false,
      apiRouteQueueSmokeApprovedNow: false,
      apiRouteMountedNow: false,
      apiRouteExecutionApprovedNow: false,
      apiRouteExecutionPerformed: false,
      routeExecutionApprovedNow: false,
      workerExecutionApprovedNow: false,
      workerQueueApprovedNow: false,
      backendQueueSubmissionApprovedNow: false,
      serviceRoleQueueTransactionApprovedNow: false,
      liveQueueWriteApprovedNow: false,
      liveQueueWritePerformed: false,
      workerLeaseCreationApprovedNow: false,
      workerDispatchApprovedNow: false,
      productionWorkerDispatchApprovedNow: false,
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
      routeExecutionPerformed: false,
      backendQueueSubmissionPerformed: false,
      serviceRoleQueueSmokePerformed: false,
      serviceRoleTransactionPerformed: false,
      supabaseMutationPerformed: false,
      workerLeaseCreated: false,
      workerDispatchPerformed: false,
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
