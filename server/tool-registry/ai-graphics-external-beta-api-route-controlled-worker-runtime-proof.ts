import type {
  AiGraphicsCanonicalToolId,
} from './ai-graphics-tool-call-readiness'
import type {
  AiGraphicsExternalBetaApiRouteWorkerArtifactToolRouteAdmission,
  AiGraphicsExternalBetaApiRouteWorkerArtifactToolRouteAdmissionCandidate,
} from './ai-graphics-external-beta-api-route-worker-artifact-tool-route-admission'
import type {
  AiGraphicsExternalBetaPerToolRuntimeProof,
  AiGraphicsExternalBetaPerToolRuntimeProofRecord,
} from './ai-graphics-external-beta-per-tool-runtime-proof'

export const AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_CONTROLLED_WORKER_RUNTIME_PROOF_DECISION =
  'ai_graphics_external_beta_api_route_controlled_worker_runtime_proof_prepared_with_runtime_blocks'

export type AiGraphicsExternalBetaApiRouteControlledWorkerRuntimeProofStatus =
  | 'missing_external_beta_api_route_worker_artifact_tool_route_admission'
  | 'external_beta_api_route_worker_artifact_tool_route_admission_rejected'
  | 'missing_external_beta_per_tool_runtime_proof'
  | 'external_beta_per_tool_runtime_proof_rejected'
  | 'missing_external_beta_controlled_worker_runtime_proof_controls'
  | 'external_beta_api_route_controlled_worker_runtime_proof_ready_runtime_still_blocked'

export interface AiGraphicsExternalBetaApiRouteControlledWorkerRuntimeProofInput {
  sourceArtifactToolRouteAdmissionPacket?:
    AiGraphicsExternalBetaApiRouteWorkerArtifactToolRouteAdmission
  sourcePerToolRuntimeProofPacket?: AiGraphicsExternalBetaPerToolRuntimeProof
  externalBetaControlledWorkerRuntimeProofPolicyRef?: string
  externalBetaWorkerLeasePolicyRef?: string
  externalBetaWorkerDispatchBlockPolicyRef?: string
  externalBetaPrivateArtifactWriteBlockPolicyRef?: string
  externalBetaRuntimeResultCapturePolicyRef?: string
  externalBetaToolExecutionBlockPolicyRef?: string
  externalBetaGpuOnDemandPolicyRef?: string
  externalBetaCostGuardrailRef?: string
  externalBetaQaGatePolicyRef?: string
  externalBetaTelemetryRef?: string
  externalBetaRollbackPlanRef?: string
}

export interface AiGraphicsExternalBetaApiRouteControlledWorkerRuntimeProofCandidate {
  proofId: 'ai_graphics_external_beta_api_route_controlled_worker_runtime_proof'
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
  runtimeProofSource: string
  runtimeProofStatus: string
  controlledWorkerRuntimeProofPreparedWithProvidedEvidence: true
  sourceArtifactToolRouteAdmissionAccepted: boolean
  sourcePerToolRuntimeProofAccepted: boolean
  sourcePerToolRuntimeProofCoversRequestedTool: boolean
  gpuRuntimeStartAllowedForAcceptedExternalBetaJob: boolean
  gpuRuntimeShouldStartNow: false
  workerLeaseCreationApprovedNow: false
  workerDispatchApprovedNow: false
  toolExecutionApprovedNow: false
  privateArtifactWriteApprovedNow: false
  routeExecutionApprovedNow: false
  providerRuntimePerformedNow: false
  publicArtifactCreatedNow: false
  signedUrlCreatedNow: false
}

export interface AiGraphicsExternalBetaApiRouteControlledWorkerRuntimeProof {
  decision:
    typeof AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_CONTROLLED_WORKER_RUNTIME_PROOF_DECISION
  status: AiGraphicsExternalBetaApiRouteControlledWorkerRuntimeProofStatus
  requestedToolId: AiGraphicsCanonicalToolId | null
  capabilityId: string | null
  sourceArtifactToolRouteAdmissionAccepted: boolean
  sourcePerToolRuntimeProofAccepted: boolean
  sourcePerToolRuntimeProofCoversRequestedTool: boolean
  missingControlledWorkerRuntimeProofControls: string[]
  controlledWorkerRuntimeProofPreparedWithProvidedEvidence: boolean
  controlledWorkerRuntimeProofPreparedRequestsWithProvidedEvidence: 0 | 1
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  gpuRuntimeTargetedTools: 8
  sourceRuntimeProofAcceptedWithProvidedEvidenceTools: number
  externalBetaReadyNowTools: 0
  productionReadyNowTools: 0
  gpuRuntimeShouldStartNow: false
  controlledWorkerRuntimeProofCandidate:
    AiGraphicsExternalBetaApiRouteControlledWorkerRuntimeProofCandidate | null
  evidence: {
    controlledWorkerRuntimeProofPolicyRef: string | null
    workerLeasePolicyRef: string | null
    workerDispatchBlockPolicyRef: string | null
    privateArtifactWriteBlockPolicyRef: string | null
    runtimeResultCapturePolicyRef: string | null
    toolExecutionBlockPolicyRef: string | null
    gpuOnDemandPolicyRef: string | null
    costGuardrailRef: string | null
    qaGatePolicyRef: string | null
    telemetryRef: string | null
    rollbackPlanRef: string | null
    sourceArtifactToolRouteAdmissionStatus: string | null
    sourcePerToolRuntimeProofDecision: string | null
    requiredExecutionEnvironment: 'private_non_production_external_beta'
    requiredWorkerRuntimeProofMode: 'controlled_worker_runtime_proof_only'
    savedArtifactToolRouteAdmissionRequired: true
    savedPerToolRuntimeProofRequired: true
  }
  policy: {
    validatesSavedProofPacketsOnly: true
    controlledWorkerRuntimeProofOnlyNoLeaseCreation: true
    controlledWorkerRuntimeProofOnlyNoWorkerDispatch: true
    controlledWorkerRuntimeProofOnlyNoToolExecution: true
    controlledWorkerRuntimeProofOnlyNoPrivateArtifactWrite: true
    controlledWorkerRuntimeProofOnlyNoRouteExecution: true
    noProviderRuntimeByControlledProof: true
    noBrowserWebglCanvasRuntimeByControlledProof: true
    noGpuRuntimeStartByControlledProof: true
    publicArtifactsRejected: true
    signedUrlsRejected: true
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    nextGateRequiresExplicitLiveWorkerRuntimeSmokeAuthorization: true
  }
  booleans: {
    externalBetaApiRouteControlledWorkerRuntimeProofPrepared: true
    sourceArtifactToolRouteAdmissionAccepted: boolean
    sourcePerToolRuntimeProofAccepted: boolean
    sourcePerToolRuntimeProofCoversRequestedTool: boolean
    controlledWorkerRuntimeProofControlsAccepted: boolean
    controlledWorkerRuntimeProofPreparedWithProvidedEvidence: boolean
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    all8GpuToolsTargetGpuRuntime: true
    all21PerToolRuntimeProofsAcceptedWithProvidedEvidence: boolean
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
    controlledWorkerRuntimeProofApprovedNow: false
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
  'external-beta-admission://',
  'external-beta-controlled-runtime://',
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

function sourceAdmissionAccepted(
  packet?: AiGraphicsExternalBetaApiRouteWorkerArtifactToolRouteAdmission,
): boolean {
  return Boolean(packet) &&
    packet?.decision ===
      'ai_graphics_external_beta_api_route_worker_artifact_tool_route_admission_prepared_with_runtime_blocks' &&
    packet.status ===
      'external_beta_api_route_worker_artifact_tool_route_admission_ready_runtime_still_blocked' &&
    packet.artifactToolRouteAdmissionPreparedWithProvidedEvidence === true &&
    packet.artifactToolRouteAdmissionPreparedRequestsWithProvidedEvidence === 1 &&
    packet.admissionCandidate !== null &&
    packet.sourceHandoffAccepted === true &&
    packet.sourcePrivateArtifactManifestAccepted === true &&
    packet.sourceToolRouteRuntimeProofAccepted === true &&
    packet.privateArtifactManifestCoversRequestedTool === true &&
    packet.toolRouteRuntimeProofCoversRequestedTool === true &&
    packet.sourcePrivateArtifactRecordsReadyWithProvidedEvidence === 21 &&
    packet.sourceToolRouteRecordsReadyWithProvidedEvidence === 21 &&
    packet.gpuRuntimeShouldStartNow === false &&
    packet.externalBetaReadyNowTools === 0 &&
    packet.productionReadyNowTools === 0 &&
    packet.booleans.agentCanExecuteToolsNow === false &&
    packet.booleans.routeExecutionApprovedNow === false &&
    packet.booleans.workerDispatchApprovedNow === false &&
    packet.booleans.toolExecutionApprovedNow === false &&
    packet.booleans.privateArtifactWriteApprovedNow === false &&
    packet.booleans.gpuRuntimeShouldStartNow === false &&
    packet.booleans.externalBetaReadyNow === false &&
    packet.booleans.productionReadyNow === false
}

function sourcePerToolRuntimeProofAccepted(
  packet?: AiGraphicsExternalBetaPerToolRuntimeProof,
): boolean {
  return Boolean(packet) &&
    packet?.sourceDecision === 'ai_graphics_external_beta_per_tool_runtime_proof_prepared_with_gpu_blocks' &&
    packet.decision === 'external_beta_per_tool_runtime_proof_ready_with_runtime_blocks' &&
    packet.sourceToolRouteRuntimeProofAccepted === true &&
    packet.sourceToolRouteRuntimeProofBridgeAccepted === true &&
    packet.sourceExternalBetaNativeGpuProofCollectionAccepted === true &&
    packet.runtimeProofRecordsPrepared === 21 &&
    packet.runtimeProofAcceptedWithProvidedEvidenceTools === 21 &&
    packet.sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence === 21 &&
    packet.sourceServiceRoleQueueSmokeAuthorizationAcceptedWithProvidedEvidence === 21 &&
    packet.jsRuntimeProofAcceptedWithProvidedEvidenceTools === 13 &&
    packet.nativeGpuRuntimeProofAcceptedWithProvidedEvidenceTools === 8 &&
    packet.blockedPendingNativeGpuRuntimeProofTools === 0 &&
    packet.records.length === 21 &&
    packet.records.every((record) => (
      record.runtimeProofAcceptedWithProvidedEvidence === true &&
      record.runtimeProofStatus === 'runtime_proof_accepted_with_provided_evidence' &&
      record.routeRuntimeProofAccepted === true &&
      record.sourceRuntimeQueueServiceProofBridgeAccepted === true &&
      record.sourceServiceRoleQueueSmokeAuthorizationAccepted === true &&
      record.routeExecutionApprovedNow === false &&
      record.workerDispatchApprovedNow === false &&
      record.toolExecutionApprovedNow === false &&
      record.gpuRuntimeShouldStartNow === false &&
      record.publicArtifactAllowed === false &&
      record.signedUrlAllowed === false
    )) &&
    packet.externalBetaReadyNowTools === 0 &&
    packet.productionReadyNowTools === 0 &&
    packet.booleans.sourceToolRouteRuntimeProofAccepted === true &&
    packet.booleans.sourceRuntimeQueueServiceProofBridgeAccepted === true &&
    packet.booleans.sourceServiceRoleQueueSmokeAuthorizationAccepted === true &&
    packet.booleans.all13JsRuntimeProofsAccepted === true &&
    packet.booleans.all8NativeGpuRuntimeProofsAccepted === true &&
    packet.booleans.agentCanExecuteToolsNow === false &&
    packet.booleans.workerDispatchApprovedNow === false &&
    packet.booleans.toolExecutionApprovedNow === false &&
    packet.booleans.gpuRuntimeShouldStartNow === false &&
    packet.booleans.externalBetaReadyNow === false &&
    packet.booleans.productionReadyNow === false
}

function recordForTool(
  packet: AiGraphicsExternalBetaPerToolRuntimeProof | undefined,
  toolId: AiGraphicsCanonicalToolId | null,
): AiGraphicsExternalBetaPerToolRuntimeProofRecord | undefined {
  if (!toolId) return undefined
  return packet?.records?.find((record) => record.toolId === toolId)
}

function runtimeProofCoversRequestedTool(input: {
  proofAccepted: boolean
  admissionCandidate?: AiGraphicsExternalBetaApiRouteWorkerArtifactToolRouteAdmissionCandidate | null
  runtimeRecord?: AiGraphicsExternalBetaPerToolRuntimeProofRecord
}): boolean {
  const candidate = input.admissionCandidate
  const record = input.runtimeRecord
  return input.proofAccepted &&
    Boolean(candidate) &&
    Boolean(record) &&
    record?.toolId === candidate?.toolId &&
    record?.runtimeProofAcceptedWithProvidedEvidence === true &&
    record?.runtimeProofStatus === 'runtime_proof_accepted_with_provided_evidence' &&
    record?.routeExecutionApprovedNow === false &&
    record?.workerDispatchApprovedNow === false &&
    record?.toolExecutionApprovedNow === false &&
    record?.gpuRuntimeShouldStartNow === false &&
    record?.publicArtifactAllowed === false &&
    record?.signedUrlAllowed === false
}

function missingControls(
  input: AiGraphicsExternalBetaApiRouteControlledWorkerRuntimeProofInput,
): string[] {
  return [
    !isSafePrivateRef(input.externalBetaControlledWorkerRuntimeProofPolicyRef)
      ? 'external beta controlled worker runtime proof policy ref is missing or not private'
      : undefined,
    !isSafePrivateRef(input.externalBetaWorkerLeasePolicyRef)
      ? 'external beta worker lease policy ref is missing or not private'
      : undefined,
    !isSafePrivateRef(input.externalBetaWorkerDispatchBlockPolicyRef)
      ? 'external beta worker dispatch block policy ref is missing or not private'
      : undefined,
    !isSafePrivateRef(input.externalBetaPrivateArtifactWriteBlockPolicyRef)
      ? 'external beta private artifact write block policy ref is missing or not private'
      : undefined,
    !isSafePrivateRef(input.externalBetaRuntimeResultCapturePolicyRef)
      ? 'external beta runtime result capture policy ref is missing or not private'
      : undefined,
    !isSafePrivateRef(input.externalBetaToolExecutionBlockPolicyRef)
      ? 'external beta tool execution block policy ref is missing or not private'
      : undefined,
    !isSafePrivateRef(input.externalBetaGpuOnDemandPolicyRef)
      ? 'external beta GPU on-demand policy ref is missing or not private'
      : undefined,
    !isSafePrivateRef(input.externalBetaCostGuardrailRef)
      ? 'external beta cost guardrail ref is missing or not private'
      : undefined,
    !isSafePrivateRef(input.externalBetaQaGatePolicyRef)
      ? 'external beta QA gate policy ref is missing or not private'
      : undefined,
    !isSafePrivateRef(input.externalBetaTelemetryRef)
      ? 'external beta telemetry ref is missing or not private'
      : undefined,
    !isSafePrivateRef(input.externalBetaRollbackPlanRef)
      ? 'external beta rollback plan ref is missing or not private'
      : undefined,
  ].filter((reason): reason is string => Boolean(reason))
}

function buildCandidate(input: {
  admissionAccepted: boolean
  perToolAccepted: boolean
  runtimeProofCovers: boolean
  admissionCandidate?: AiGraphicsExternalBetaApiRouteWorkerArtifactToolRouteAdmissionCandidate | null
  runtimeRecord?: AiGraphicsExternalBetaPerToolRuntimeProofRecord
}): AiGraphicsExternalBetaApiRouteControlledWorkerRuntimeProofCandidate | null {
  const candidate = input.admissionCandidate
  const record = input.runtimeRecord
  if (
    !candidate ||
    !record ||
    !input.admissionAccepted ||
    !input.perToolAccepted ||
    !input.runtimeProofCovers
  ) {
    return null
  }
  return {
    proofId: 'ai_graphics_external_beta_api_route_controlled_worker_runtime_proof',
    toolId: candidate.toolId,
    capabilityId: candidate.capabilityId,
    routePath: candidate.routePath,
    routeId: candidate.routeId,
    queueName: candidate.queueName,
    queueJobType: candidate.queueJobType,
    approvedPlanSnapshotId: candidate.approvedPlanSnapshotId,
    creditReservationId: candidate.creditReservationId,
    idempotencyKey: candidate.idempotencyKey,
    runtimeTarget: candidate.runtimeTarget,
    workerType: candidate.workerType,
    gpuRequiredForRuntime: candidate.gpuRequiredForRuntime,
    privateInputManifestRef: candidate.privateInputManifestRef,
    privateOutputManifestRef: candidate.privateOutputManifestRef,
    privateTelemetryRef: candidate.privateTelemetryRef,
    privateLeaseAuditRef: candidate.privateLeaseAuditRef,
    modelWeightOrCacheManifestRef: candidate.modelWeightOrCacheManifestRef,
    runtimeProofSource: record.runtimeProofSource,
    runtimeProofStatus: record.runtimeProofStatus,
    controlledWorkerRuntimeProofPreparedWithProvidedEvidence: true,
    sourceArtifactToolRouteAdmissionAccepted: input.admissionAccepted,
    sourcePerToolRuntimeProofAccepted: input.perToolAccepted,
    sourcePerToolRuntimeProofCoversRequestedTool: input.runtimeProofCovers,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob:
      candidate.gpuRuntimeStartAllowedForAcceptedExternalBetaJob,
    gpuRuntimeShouldStartNow: false,
    workerLeaseCreationApprovedNow: false,
    workerDispatchApprovedNow: false,
    toolExecutionApprovedNow: false,
    privateArtifactWriteApprovedNow: false,
    routeExecutionApprovedNow: false,
    providerRuntimePerformedNow: false,
    publicArtifactCreatedNow: false,
    signedUrlCreatedNow: false,
  }
}

function statusFromInput(input: {
  hasAdmission: boolean
  admissionAccepted: boolean
  hasPerToolProof: boolean
  perToolAccepted: boolean
  controlsAccepted: boolean
}): AiGraphicsExternalBetaApiRouteControlledWorkerRuntimeProofStatus {
  if (!input.hasAdmission) {
    return 'missing_external_beta_api_route_worker_artifact_tool_route_admission'
  }
  if (!input.admissionAccepted) {
    return 'external_beta_api_route_worker_artifact_tool_route_admission_rejected'
  }
  if (!input.hasPerToolProof) return 'missing_external_beta_per_tool_runtime_proof'
  if (!input.perToolAccepted) return 'external_beta_per_tool_runtime_proof_rejected'
  return input.controlsAccepted
    ? 'external_beta_api_route_controlled_worker_runtime_proof_ready_runtime_still_blocked'
    : 'missing_external_beta_controlled_worker_runtime_proof_controls'
}

export function evaluateAiGraphicsExternalBetaApiRouteControlledWorkerRuntimeProof(
  input: AiGraphicsExternalBetaApiRouteControlledWorkerRuntimeProofInput = {},
): AiGraphicsExternalBetaApiRouteControlledWorkerRuntimeProof {
  const admissionPacket = input.sourceArtifactToolRouteAdmissionPacket
  const perToolPacket = input.sourcePerToolRuntimeProofPacket
  const admissionAccepted = sourceAdmissionAccepted(admissionPacket)
  const perToolAccepted = sourcePerToolRuntimeProofAccepted(perToolPacket)
  const requestedToolId = admissionPacket?.requestedToolId ?? null
  const capabilityId = admissionPacket?.capabilityId ?? null
  const runtimeRecord = recordForTool(perToolPacket, requestedToolId)
  const runtimeProofCovers = runtimeProofCoversRequestedTool({
    proofAccepted: perToolAccepted,
    admissionCandidate: admissionPacket?.admissionCandidate,
    runtimeRecord,
  })
  const controls = missingControls(input)
  const controlsAccepted = controls.length === 0
  const proofReady =
    admissionAccepted && perToolAccepted && runtimeProofCovers && controlsAccepted
  const candidate = buildCandidate({
    admissionAccepted,
    perToolAccepted,
    runtimeProofCovers,
    admissionCandidate: admissionPacket?.admissionCandidate,
    runtimeRecord,
  })
  return {
    decision:
      AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_CONTROLLED_WORKER_RUNTIME_PROOF_DECISION,
    status: statusFromInput({
      hasAdmission: Boolean(admissionPacket),
      admissionAccepted,
      hasPerToolProof: Boolean(perToolPacket),
      perToolAccepted,
      controlsAccepted,
    }),
    requestedToolId,
    capabilityId,
    sourceArtifactToolRouteAdmissionAccepted: admissionAccepted,
    sourcePerToolRuntimeProofAccepted: perToolAccepted,
    sourcePerToolRuntimeProofCoversRequestedTool: runtimeProofCovers,
    missingControlledWorkerRuntimeProofControls: controls,
    controlledWorkerRuntimeProofPreparedWithProvidedEvidence: proofReady,
    controlledWorkerRuntimeProofPreparedRequestsWithProvidedEvidence:
      proofReady ? 1 : 0,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    gpuRuntimeTargetedTools: 8,
    sourceRuntimeProofAcceptedWithProvidedEvidenceTools:
      perToolAccepted ? perToolPacket?.runtimeProofAcceptedWithProvidedEvidenceTools ?? 0 : 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    gpuRuntimeShouldStartNow: false,
    controlledWorkerRuntimeProofCandidate: candidate,
    evidence: {
      controlledWorkerRuntimeProofPolicyRef:
        input.externalBetaControlledWorkerRuntimeProofPolicyRef ?? null,
      workerLeasePolicyRef: input.externalBetaWorkerLeasePolicyRef ?? null,
      workerDispatchBlockPolicyRef:
        input.externalBetaWorkerDispatchBlockPolicyRef ?? null,
      privateArtifactWriteBlockPolicyRef:
        input.externalBetaPrivateArtifactWriteBlockPolicyRef ?? null,
      runtimeResultCapturePolicyRef:
        input.externalBetaRuntimeResultCapturePolicyRef ?? null,
      toolExecutionBlockPolicyRef:
        input.externalBetaToolExecutionBlockPolicyRef ?? null,
      gpuOnDemandPolicyRef: input.externalBetaGpuOnDemandPolicyRef ?? null,
      costGuardrailRef: input.externalBetaCostGuardrailRef ?? null,
      qaGatePolicyRef: input.externalBetaQaGatePolicyRef ?? null,
      telemetryRef: input.externalBetaTelemetryRef ?? null,
      rollbackPlanRef: input.externalBetaRollbackPlanRef ?? null,
      sourceArtifactToolRouteAdmissionStatus: admissionPacket?.status ?? null,
      sourcePerToolRuntimeProofDecision: perToolPacket?.decision ?? null,
      requiredExecutionEnvironment: 'private_non_production_external_beta',
      requiredWorkerRuntimeProofMode: 'controlled_worker_runtime_proof_only',
      savedArtifactToolRouteAdmissionRequired: true,
      savedPerToolRuntimeProofRequired: true,
    },
    policy: {
      validatesSavedProofPacketsOnly: true,
      controlledWorkerRuntimeProofOnlyNoLeaseCreation: true,
      controlledWorkerRuntimeProofOnlyNoWorkerDispatch: true,
      controlledWorkerRuntimeProofOnlyNoToolExecution: true,
      controlledWorkerRuntimeProofOnlyNoPrivateArtifactWrite: true,
      controlledWorkerRuntimeProofOnlyNoRouteExecution: true,
      noProviderRuntimeByControlledProof: true,
      noBrowserWebglCanvasRuntimeByControlledProof: true,
      noGpuRuntimeStartByControlledProof: true,
      publicArtifactsRejected: true,
      signedUrlsRejected: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      nextGateRequiresExplicitLiveWorkerRuntimeSmokeAuthorization: true,
    },
    booleans: {
      externalBetaApiRouteControlledWorkerRuntimeProofPrepared: true,
      sourceArtifactToolRouteAdmissionAccepted: admissionAccepted,
      sourcePerToolRuntimeProofAccepted: perToolAccepted,
      sourcePerToolRuntimeProofCoversRequestedTool: runtimeProofCovers,
      controlledWorkerRuntimeProofControlsAccepted: controlsAccepted,
      controlledWorkerRuntimeProofPreparedWithProvidedEvidence: proofReady,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all8GpuToolsTargetGpuRuntime: true,
      all21PerToolRuntimeProofsAcceptedWithProvidedEvidence:
        (perToolPacket?.runtimeProofAcceptedWithProvidedEvidenceTools ?? 0) === 21,
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
      controlledWorkerRuntimeProofApprovedNow: false,
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
