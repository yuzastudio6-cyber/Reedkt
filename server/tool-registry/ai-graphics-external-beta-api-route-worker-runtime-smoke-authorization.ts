import type {
  AiGraphicsCanonicalToolId,
} from './ai-graphics-tool-call-readiness'
import type {
  AiGraphicsExternalBetaApiRouteControlledWorkerRuntimeProof,
  AiGraphicsExternalBetaApiRouteControlledWorkerRuntimeProofCandidate,
} from './ai-graphics-external-beta-api-route-controlled-worker-runtime-proof'
import type {
  AiGraphicsExternalBetaLiveEnqueueAuthorization,
} from './ai-graphics-external-beta-live-enqueue-authorization'

export const AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_WORKER_RUNTIME_SMOKE_AUTHORIZATION_DECISION =
  'ai_graphics_external_beta_api_route_worker_runtime_smoke_authorization_prepared_with_runtime_blocks'

export type AiGraphicsExternalBetaApiRouteWorkerRuntimeSmokeAuthorizationStatus =
  | 'missing_external_beta_api_route_controlled_worker_runtime_proof'
  | 'external_beta_api_route_controlled_worker_runtime_proof_rejected'
  | 'missing_external_beta_live_enqueue_authorization'
  | 'external_beta_live_enqueue_authorization_rejected'
  | 'missing_external_beta_worker_runtime_smoke_authorization_controls'
  | 'external_beta_api_route_worker_runtime_smoke_authorization_ready_runtime_still_blocked'

export interface AiGraphicsExternalBetaApiRouteWorkerRuntimeSmokeAuthorizationInput {
  sourceControlledWorkerRuntimeProofPacket?:
    AiGraphicsExternalBetaApiRouteControlledWorkerRuntimeProof
  sourceLiveEnqueueAuthorizationPacket?: AiGraphicsExternalBetaLiveEnqueueAuthorization
  externalBetaWorkerRuntimeSmokeOperatorConfirmationRef?: string
  externalBetaWorkerRuntimeSmokeEnvironmentRef?: string
  externalBetaWorkerRuntimeSmokeRunbookRef?: string
  externalBetaWorkerRuntimeSmokeLeaseTtlPolicyRef?: string
  externalBetaWorkerRuntimeSmokeClaimIsolationRef?: string
  externalBetaWorkerRuntimeSmokePrivateArtifactSandboxRef?: string
  externalBetaWorkerRuntimeSmokeResultCaptureRef?: string
  externalBetaWorkerRuntimeSmokeGpuOnDemandPolicyRef?: string
  externalBetaWorkerRuntimeSmokeCostGuardrailRef?: string
  externalBetaWorkerRuntimeSmokeQaGateRef?: string
  externalBetaWorkerRuntimeSmokeTelemetryRef?: string
  externalBetaWorkerRuntimeSmokeRollbackPlanRef?: string
}

export interface AiGraphicsExternalBetaApiRouteWorkerRuntimeSmokeAuthorizationCandidate {
  authorizationId: 'ai_graphics_external_beta_api_route_worker_runtime_smoke_authorization'
  toolId: AiGraphicsCanonicalToolId
  capabilityId: string
  routePath: '/api/ai-graphics/external-beta/tool-call'
  routeId: string
  queueName: string
  queueJobType: 'ai_graphics_tool_runtime'
  approvedPlanSnapshotId: string
  creditReservationId: string
  idempotencyKey: string
  runtimeTarget: string
  workerType: string
  gpuRequiredForRuntime: boolean
  privateInputManifestRef: string
  privateOutputManifestRef: string
  privateTelemetryRef: string
  privateLeaseAuditRef: string
  modelWeightOrCacheManifestRef: string | null
  sourceControlledWorkerRuntimeProofAccepted: boolean
  sourceLiveEnqueueAuthorizationAccepted: boolean
  workerRuntimeSmokeAuthorizationPreparedWithProvidedEvidence: true
  operatorConfirmationRef: string
  nonProductionEnvironmentRef: string
  runbookRef: string
  leaseTtlPolicyRef: string
  claimIsolationRef: string
  privateArtifactSandboxRef: string
  resultCaptureRef: string
  gpuOnDemandPolicyRef: string
  costGuardrailRef: string
  qaGateRef: string
  telemetryRef: string
  rollbackPlanRef: string
  gpuRuntimeStartAllowedForAcceptedExternalBetaJob: boolean
  gpuRuntimeShouldStartNow: false
  liveWorkerRuntimeSmokeAuthorizedNow: false
  liveWorkerLeaseCreationApprovedNow: false
  workerDispatchApprovedNow: false
  toolExecutionApprovedNow: false
  privateArtifactWriteApprovedNow: false
  routeExecutionApprovedNow: false
  publicArtifactCreatedNow: false
  signedUrlCreatedNow: false
}

export interface AiGraphicsExternalBetaApiRouteWorkerRuntimeSmokeAuthorization {
  decision:
    typeof AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_WORKER_RUNTIME_SMOKE_AUTHORIZATION_DECISION
  status: AiGraphicsExternalBetaApiRouteWorkerRuntimeSmokeAuthorizationStatus
  requestedToolId: AiGraphicsCanonicalToolId | null
  capabilityId: string | null
  sourceControlledWorkerRuntimeProofAccepted: boolean
  sourceLiveEnqueueAuthorizationAccepted: boolean
  sourceControlledWorkerRuntimeProofCoversRequestedTool: boolean
  missingWorkerRuntimeSmokeAuthorizationControls: string[]
  workerRuntimeSmokeAuthorizationPreparedWithProvidedEvidence: boolean
  workerRuntimeSmokeAuthorizationPreparedRequestsWithProvidedEvidence: 0 | 1
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  gpuRuntimeTargetedTools: 8
  sourceLiveEnqueueAuthorizationRecordedToolsWithProvidedEvidence: number
  externalBetaReadyNowTools: 0
  productionReadyNowTools: 0
  gpuRuntimeShouldStartNow: false
  authorizationCandidate:
    AiGraphicsExternalBetaApiRouteWorkerRuntimeSmokeAuthorizationCandidate | null
  evidence: {
    operatorConfirmationRef: string | null
    nonProductionEnvironmentRef: string | null
    runbookRef: string | null
    leaseTtlPolicyRef: string | null
    claimIsolationRef: string | null
    privateArtifactSandboxRef: string | null
    resultCaptureRef: string | null
    gpuOnDemandPolicyRef: string | null
    costGuardrailRef: string | null
    qaGateRef: string | null
    telemetryRef: string | null
    rollbackPlanRef: string | null
    requiredEnvironment: 'private_non_production_external_beta'
    requiredSmokeMode: 'operator_authorized_worker_runtime_smoke_metadata_only'
    controlledWorkerRuntimeProofRequired: true
    liveEnqueueAuthorizationRequired: true
  }
  policy: {
    validatesSavedProofPacketsOnly: true
    operatorConfirmationRequiredBeforeFutureLiveSmoke: true
    workerRuntimeSmokeAuthorizationOnlyNoLeaseCreation: true
    workerRuntimeSmokeAuthorizationOnlyNoWorkerDispatch: true
    workerRuntimeSmokeAuthorizationOnlyNoToolExecution: true
    workerRuntimeSmokeAuthorizationOnlyNoPrivateArtifactWrite: true
    workerRuntimeSmokeAuthorizationOnlyNoRouteExecution: true
    noProviderRuntimeByAuthorization: true
    noBrowserWebglCanvasRuntimeByAuthorization: true
    noGpuRuntimeStartByAuthorization: true
    publicArtifactsRejected: true
    signedUrlsRejected: true
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    nextGateRequiresOperatorRunLiveWorkerRuntimeSmokeAndResultPacket: true
  }
  booleans: {
    externalBetaApiRouteWorkerRuntimeSmokeAuthorizationPrepared: true
    sourceControlledWorkerRuntimeProofAccepted: boolean
    sourceLiveEnqueueAuthorizationAccepted: boolean
    sourceControlledWorkerRuntimeProofCoversRequestedTool: boolean
    workerRuntimeSmokeAuthorizationControlsAccepted: boolean
    workerRuntimeSmokeAuthorizationPreparedWithProvidedEvidence: boolean
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    all8GpuToolsTargetGpuRuntime: true
    liveEnqueueAuthorizationRecordedForAll21Tools: boolean
    operatorConfirmationRefAccepted: boolean
    privateInputArtifactsRequired: true
    privateOutputArtifactsRequired: true
    privateTelemetryRequired: true
    privateLeaseAuditRequired: true
    publicArtifactRefsRejected: true
    signedUrlRefsRejected: true
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    gpuStartsOnlyForApprovedWorkerOrToolCall: true
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob: boolean
    gpuRuntimeShouldStartNow: false
    agentCanSelectForPlanning: true
    agentCanExecuteToolsNow: false
    externalBetaCallableNow: false
    liveWorkerRuntimeSmokeAuthorizedNow: false
    workerRuntimeSmokeExecutedNow: false
    apiRouteExecutionApprovedNow: false
    routeExecutionApprovedNow: false
    workerExecutionApprovedNow: false
    workerQueueApprovedNow: false
    backendQueueSubmissionApprovedNow: false
    liveQueueWriteApprovedNow: false
    privateArtifactWriteApprovedNow: false
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
    privateArtifactWritePerformed: false
    serviceRoleQueueSmokePerformed: false
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

const acceptedPrivateRefNamespaces = [
  'private://',
  'reeditpro-private://',
  'backend://',
  'backend-evidence://',
  'external-beta-evidence://',
  'external-beta-runtime://',
  'external-beta-controlled-runtime://',
  'external-beta-worker-runtime-smoke://',
]

const forbiddenRefPatterns = [
  'http://',
  'https://',
  'signed-url://',
  'public://',
  'gs://',
  'gcs://',
]

function hasValue(value?: string | null): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

function isSafePrivateRef(value?: string | null): boolean {
  if (!hasValue(value)) return false
  const ref = String(value).trim()
  if (forbiddenRefPatterns.some((pattern) => ref.startsWith(pattern))) return false
  const acceptedPrefix = acceptedPrivateRefNamespaces.find((prefix) => ref.startsWith(prefix))
  if (!acceptedPrefix) return false
  const suffix = ref.slice(acceptedPrefix.length)
  return suffix.length > 0 && /^[a-z0-9_.:/-]+$/i.test(suffix)
}

function controlledProofAccepted(
  packet?: AiGraphicsExternalBetaApiRouteControlledWorkerRuntimeProof,
): boolean {
  return Boolean(packet) &&
    packet?.decision ===
      'ai_graphics_external_beta_api_route_controlled_worker_runtime_proof_prepared_with_runtime_blocks' &&
    packet.status ===
      'external_beta_api_route_controlled_worker_runtime_proof_ready_runtime_still_blocked' &&
    packet.controlledWorkerRuntimeProofPreparedWithProvidedEvidence === true &&
    packet.controlledWorkerRuntimeProofPreparedRequestsWithProvidedEvidence === 1 &&
    packet.controlledWorkerRuntimeProofCandidate !== null &&
    packet.sourceArtifactToolRouteAdmissionAccepted === true &&
    packet.sourcePerToolRuntimeProofAccepted === true &&
    packet.sourcePerToolRuntimeProofCoversRequestedTool === true &&
    packet.sourceRuntimeProofAcceptedWithProvidedEvidenceTools === 21 &&
    packet.gpuRuntimeTargetedTools === 8 &&
    packet.gpuRuntimeShouldStartNow === false &&
    packet.externalBetaReadyNowTools === 0 &&
    packet.productionReadyNowTools === 0 &&
    packet.booleans.agentCanExecuteToolsNow === false &&
    packet.booleans.workerLeaseCreationApprovedNow === false &&
    packet.booleans.workerDispatchApprovedNow === false &&
    packet.booleans.toolExecutionApprovedNow === false &&
    packet.booleans.privateArtifactWriteApprovedNow === false &&
    packet.booleans.routeExecutionApprovedNow === false &&
    packet.booleans.gpuRuntimeShouldStartNow === false
}

function liveEnqueueAccepted(
  packet?: AiGraphicsExternalBetaLiveEnqueueAuthorization,
): boolean {
  return Boolean(packet) &&
    packet?.decision === 'ai_graphics_external_beta_live_enqueue_authorization_prepared_with_runtime_blocks' &&
    packet.status === 'external_beta_live_enqueue_authorization_recorded_runtime_still_blocked' &&
    packet.liveEnqueueAuthorizationRecordedToolsWithProvidedEvidence === 21 &&
    packet.gpuRuntimeTargetedTools === 8 &&
    packet.gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools === 8 &&
    packet.liveQueueWritesApprovedNowTools === 0 &&
    packet.liveQueueWritesPerformedNowTools === 0 &&
    packet.workerDispatchApprovedNowTools === 0 &&
    packet.toolExecutionApprovedNowTools === 0 &&
    packet.externalBetaReadyNowTools === 0 &&
    packet.productionReadyNowTools === 0 &&
    packet.booleans.liveEnqueueAuthorizationRecordAccepted === true &&
    packet.booleans.all21LiveEnqueueAuthorizationScopesRecordedWithProvidedEvidence === true &&
    packet.booleans.agentCanExecuteToolsNow === false &&
    packet.booleans.liveQueueWriteApprovedNow === false &&
    packet.booleans.workerDispatchApprovedNow === false &&
    packet.booleans.toolExecutionApprovedNow === false &&
    packet.booleans.gpuRuntimeShouldStartNow === false
}

function missingControls(
  input: AiGraphicsExternalBetaApiRouteWorkerRuntimeSmokeAuthorizationInput,
): string[] {
  return [
    !isSafePrivateRef(input.externalBetaWorkerRuntimeSmokeOperatorConfirmationRef)
      ? 'external beta worker runtime smoke operator confirmation ref is missing or not private'
      : undefined,
    !isSafePrivateRef(input.externalBetaWorkerRuntimeSmokeEnvironmentRef)
      ? 'external beta worker runtime smoke environment ref is missing or not private'
      : undefined,
    !isSafePrivateRef(input.externalBetaWorkerRuntimeSmokeRunbookRef)
      ? 'external beta worker runtime smoke runbook ref is missing or not private'
      : undefined,
    !isSafePrivateRef(input.externalBetaWorkerRuntimeSmokeLeaseTtlPolicyRef)
      ? 'external beta worker runtime smoke lease TTL policy ref is missing or not private'
      : undefined,
    !isSafePrivateRef(input.externalBetaWorkerRuntimeSmokeClaimIsolationRef)
      ? 'external beta worker runtime smoke claim isolation ref is missing or not private'
      : undefined,
    !isSafePrivateRef(input.externalBetaWorkerRuntimeSmokePrivateArtifactSandboxRef)
      ? 'external beta worker runtime smoke private artifact sandbox ref is missing or not private'
      : undefined,
    !isSafePrivateRef(input.externalBetaWorkerRuntimeSmokeResultCaptureRef)
      ? 'external beta worker runtime smoke result capture ref is missing or not private'
      : undefined,
    !isSafePrivateRef(input.externalBetaWorkerRuntimeSmokeGpuOnDemandPolicyRef)
      ? 'external beta worker runtime smoke GPU on-demand policy ref is missing or not private'
      : undefined,
    !isSafePrivateRef(input.externalBetaWorkerRuntimeSmokeCostGuardrailRef)
      ? 'external beta worker runtime smoke cost guardrail ref is missing or not private'
      : undefined,
    !isSafePrivateRef(input.externalBetaWorkerRuntimeSmokeQaGateRef)
      ? 'external beta worker runtime smoke QA gate ref is missing or not private'
      : undefined,
    !isSafePrivateRef(input.externalBetaWorkerRuntimeSmokeTelemetryRef)
      ? 'external beta worker runtime smoke telemetry ref is missing or not private'
      : undefined,
    !isSafePrivateRef(input.externalBetaWorkerRuntimeSmokeRollbackPlanRef)
      ? 'external beta worker runtime smoke rollback plan ref is missing or not private'
      : undefined,
  ].filter((reason): reason is string => Boolean(reason))
}

function statusFromInput(input: {
  hasControlledProof: boolean
  controlledProofAccepted: boolean
  hasLiveEnqueue: boolean
  liveEnqueueAccepted: boolean
  controlsAccepted: boolean
}): AiGraphicsExternalBetaApiRouteWorkerRuntimeSmokeAuthorizationStatus {
  if (!input.hasControlledProof) {
    return 'missing_external_beta_api_route_controlled_worker_runtime_proof'
  }
  if (!input.controlledProofAccepted) {
    return 'external_beta_api_route_controlled_worker_runtime_proof_rejected'
  }
  if (!input.hasLiveEnqueue) return 'missing_external_beta_live_enqueue_authorization'
  if (!input.liveEnqueueAccepted) return 'external_beta_live_enqueue_authorization_rejected'
  return input.controlsAccepted
    ? 'external_beta_api_route_worker_runtime_smoke_authorization_ready_runtime_still_blocked'
    : 'missing_external_beta_worker_runtime_smoke_authorization_controls'
}

function buildCandidate(
  proofCandidate: AiGraphicsExternalBetaApiRouteControlledWorkerRuntimeProofCandidate,
  input: AiGraphicsExternalBetaApiRouteWorkerRuntimeSmokeAuthorizationInput,
): AiGraphicsExternalBetaApiRouteWorkerRuntimeSmokeAuthorizationCandidate {
  return {
    authorizationId: 'ai_graphics_external_beta_api_route_worker_runtime_smoke_authorization',
    toolId: proofCandidate.toolId,
    capabilityId: proofCandidate.capabilityId,
    routePath: proofCandidate.routePath,
    routeId: proofCandidate.routeId,
    queueName: proofCandidate.queueName,
    queueJobType: proofCandidate.queueJobType,
    approvedPlanSnapshotId: proofCandidate.approvedPlanSnapshotId,
    creditReservationId: proofCandidate.creditReservationId,
    idempotencyKey: `${proofCandidate.idempotencyKey}:worker-runtime-smoke-authorization`,
    runtimeTarget: proofCandidate.runtimeTarget,
    workerType: proofCandidate.workerType,
    gpuRequiredForRuntime: proofCandidate.gpuRequiredForRuntime,
    privateInputManifestRef: proofCandidate.privateInputManifestRef,
    privateOutputManifestRef: proofCandidate.privateOutputManifestRef,
    privateTelemetryRef: proofCandidate.privateTelemetryRef,
    privateLeaseAuditRef: proofCandidate.privateLeaseAuditRef,
    modelWeightOrCacheManifestRef: proofCandidate.modelWeightOrCacheManifestRef,
    sourceControlledWorkerRuntimeProofAccepted: true,
    sourceLiveEnqueueAuthorizationAccepted: true,
    workerRuntimeSmokeAuthorizationPreparedWithProvidedEvidence: true,
    operatorConfirmationRef: input.externalBetaWorkerRuntimeSmokeOperatorConfirmationRef ?? '',
    nonProductionEnvironmentRef: input.externalBetaWorkerRuntimeSmokeEnvironmentRef ?? '',
    runbookRef: input.externalBetaWorkerRuntimeSmokeRunbookRef ?? '',
    leaseTtlPolicyRef: input.externalBetaWorkerRuntimeSmokeLeaseTtlPolicyRef ?? '',
    claimIsolationRef: input.externalBetaWorkerRuntimeSmokeClaimIsolationRef ?? '',
    privateArtifactSandboxRef:
      input.externalBetaWorkerRuntimeSmokePrivateArtifactSandboxRef ?? '',
    resultCaptureRef: input.externalBetaWorkerRuntimeSmokeResultCaptureRef ?? '',
    gpuOnDemandPolicyRef: input.externalBetaWorkerRuntimeSmokeGpuOnDemandPolicyRef ?? '',
    costGuardrailRef: input.externalBetaWorkerRuntimeSmokeCostGuardrailRef ?? '',
    qaGateRef: input.externalBetaWorkerRuntimeSmokeQaGateRef ?? '',
    telemetryRef: input.externalBetaWorkerRuntimeSmokeTelemetryRef ?? '',
    rollbackPlanRef: input.externalBetaWorkerRuntimeSmokeRollbackPlanRef ?? '',
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob:
      proofCandidate.gpuRuntimeStartAllowedForAcceptedExternalBetaJob,
    gpuRuntimeShouldStartNow: false,
    liveWorkerRuntimeSmokeAuthorizedNow: false,
    liveWorkerLeaseCreationApprovedNow: false,
    workerDispatchApprovedNow: false,
    toolExecutionApprovedNow: false,
    privateArtifactWriteApprovedNow: false,
    routeExecutionApprovedNow: false,
    publicArtifactCreatedNow: false,
    signedUrlCreatedNow: false,
  }
}

export function evaluateAiGraphicsExternalBetaApiRouteWorkerRuntimeSmokeAuthorization(
  input: AiGraphicsExternalBetaApiRouteWorkerRuntimeSmokeAuthorizationInput = {},
): AiGraphicsExternalBetaApiRouteWorkerRuntimeSmokeAuthorization {
  const controlledAccepted =
    controlledProofAccepted(input.sourceControlledWorkerRuntimeProofPacket)
  const liveAccepted = liveEnqueueAccepted(input.sourceLiveEnqueueAuthorizationPacket)
  const missing = controlledAccepted && liveAccepted ? missingControls(input) : []
  const controlsAccepted = missing.length === 0
  const status = statusFromInput({
    hasControlledProof: Boolean(input.sourceControlledWorkerRuntimeProofPacket),
    controlledProofAccepted: controlledAccepted,
    hasLiveEnqueue: Boolean(input.sourceLiveEnqueueAuthorizationPacket),
    liveEnqueueAccepted: liveAccepted,
    controlsAccepted,
  })
  const proofCandidate =
    input.sourceControlledWorkerRuntimeProofPacket?.controlledWorkerRuntimeProofCandidate ?? null
  const prepared = status ===
    'external_beta_api_route_worker_runtime_smoke_authorization_ready_runtime_still_blocked'
  const candidate = prepared && proofCandidate
    ? buildCandidate(proofCandidate, input)
    : null

  return {
    decision:
      AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_WORKER_RUNTIME_SMOKE_AUTHORIZATION_DECISION,
    status,
    requestedToolId: proofCandidate?.toolId ?? null,
    capabilityId: proofCandidate?.capabilityId ?? null,
    sourceControlledWorkerRuntimeProofAccepted: controlledAccepted,
    sourceLiveEnqueueAuthorizationAccepted: liveAccepted,
    sourceControlledWorkerRuntimeProofCoversRequestedTool:
      controlledAccepted &&
      input.sourceControlledWorkerRuntimeProofPacket
        ?.sourcePerToolRuntimeProofCoversRequestedTool === true,
    missingWorkerRuntimeSmokeAuthorizationControls: missing,
    workerRuntimeSmokeAuthorizationPreparedWithProvidedEvidence: prepared,
    workerRuntimeSmokeAuthorizationPreparedRequestsWithProvidedEvidence:
      prepared ? 1 : 0,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    gpuRuntimeTargetedTools: 8,
    sourceLiveEnqueueAuthorizationRecordedToolsWithProvidedEvidence: liveAccepted
      ? input.sourceLiveEnqueueAuthorizationPacket
        ?.liveEnqueueAuthorizationRecordedToolsWithProvidedEvidence ?? 0
      : 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    gpuRuntimeShouldStartNow: false,
    authorizationCandidate: candidate,
    evidence: {
      operatorConfirmationRef:
        input.externalBetaWorkerRuntimeSmokeOperatorConfirmationRef ?? null,
      nonProductionEnvironmentRef:
        input.externalBetaWorkerRuntimeSmokeEnvironmentRef ?? null,
      runbookRef: input.externalBetaWorkerRuntimeSmokeRunbookRef ?? null,
      leaseTtlPolicyRef:
        input.externalBetaWorkerRuntimeSmokeLeaseTtlPolicyRef ?? null,
      claimIsolationRef:
        input.externalBetaWorkerRuntimeSmokeClaimIsolationRef ?? null,
      privateArtifactSandboxRef:
        input.externalBetaWorkerRuntimeSmokePrivateArtifactSandboxRef ?? null,
      resultCaptureRef:
        input.externalBetaWorkerRuntimeSmokeResultCaptureRef ?? null,
      gpuOnDemandPolicyRef:
        input.externalBetaWorkerRuntimeSmokeGpuOnDemandPolicyRef ?? null,
      costGuardrailRef:
        input.externalBetaWorkerRuntimeSmokeCostGuardrailRef ?? null,
      qaGateRef: input.externalBetaWorkerRuntimeSmokeQaGateRef ?? null,
      telemetryRef: input.externalBetaWorkerRuntimeSmokeTelemetryRef ?? null,
      rollbackPlanRef:
        input.externalBetaWorkerRuntimeSmokeRollbackPlanRef ?? null,
      requiredEnvironment: 'private_non_production_external_beta',
      requiredSmokeMode: 'operator_authorized_worker_runtime_smoke_metadata_only',
      controlledWorkerRuntimeProofRequired: true,
      liveEnqueueAuthorizationRequired: true,
    },
    policy: {
      validatesSavedProofPacketsOnly: true,
      operatorConfirmationRequiredBeforeFutureLiveSmoke: true,
      workerRuntimeSmokeAuthorizationOnlyNoLeaseCreation: true,
      workerRuntimeSmokeAuthorizationOnlyNoWorkerDispatch: true,
      workerRuntimeSmokeAuthorizationOnlyNoToolExecution: true,
      workerRuntimeSmokeAuthorizationOnlyNoPrivateArtifactWrite: true,
      workerRuntimeSmokeAuthorizationOnlyNoRouteExecution: true,
      noProviderRuntimeByAuthorization: true,
      noBrowserWebglCanvasRuntimeByAuthorization: true,
      noGpuRuntimeStartByAuthorization: true,
      publicArtifactsRejected: true,
      signedUrlsRejected: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      nextGateRequiresOperatorRunLiveWorkerRuntimeSmokeAndResultPacket: true,
    },
    booleans: {
      externalBetaApiRouteWorkerRuntimeSmokeAuthorizationPrepared: true,
      sourceControlledWorkerRuntimeProofAccepted: controlledAccepted,
      sourceLiveEnqueueAuthorizationAccepted: liveAccepted,
      sourceControlledWorkerRuntimeProofCoversRequestedTool:
        controlledAccepted &&
        input.sourceControlledWorkerRuntimeProofPacket
          ?.sourcePerToolRuntimeProofCoversRequestedTool === true,
      workerRuntimeSmokeAuthorizationControlsAccepted: controlsAccepted,
      workerRuntimeSmokeAuthorizationPreparedWithProvidedEvidence: prepared,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all8GpuToolsTargetGpuRuntime: true,
      liveEnqueueAuthorizationRecordedForAll21Tools:
        liveAccepted &&
        input.sourceLiveEnqueueAuthorizationPacket
          ?.liveEnqueueAuthorizationRecordedToolsWithProvidedEvidence === 21,
      operatorConfirmationRefAccepted:
        isSafePrivateRef(input.externalBetaWorkerRuntimeSmokeOperatorConfirmationRef),
      privateInputArtifactsRequired: true,
      privateOutputArtifactsRequired: true,
      privateTelemetryRequired: true,
      privateLeaseAuditRequired: true,
      publicArtifactRefsRejected: true,
      signedUrlRefsRejected: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForApprovedWorkerOrToolCall: true,
      gpuRuntimeStartAllowedForAcceptedExternalBetaJob:
        candidate?.gpuRuntimeStartAllowedForAcceptedExternalBetaJob ?? false,
      gpuRuntimeShouldStartNow: false,
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: false,
      externalBetaCallableNow: false,
      liveWorkerRuntimeSmokeAuthorizedNow: false,
      workerRuntimeSmokeExecutedNow: false,
      apiRouteExecutionApprovedNow: false,
      routeExecutionApprovedNow: false,
      workerExecutionApprovedNow: false,
      workerQueueApprovedNow: false,
      backendQueueSubmissionApprovedNow: false,
      liveQueueWriteApprovedNow: false,
      privateArtifactWriteApprovedNow: false,
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
      privateArtifactWritePerformed: false,
      serviceRoleQueueSmokePerformed: false,
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
