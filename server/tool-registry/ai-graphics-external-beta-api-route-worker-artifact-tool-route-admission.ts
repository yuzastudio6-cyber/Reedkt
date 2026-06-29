import {
  AI_GRAPHICS_CANONICAL_TOOL_IDS,
  AI_GRAPHICS_TOOL_CALL_CAPABILITY_IDS,
  listAiGraphicsToolCallReadiness,
  type AiGraphicsCanonicalToolId,
} from './ai-graphics-tool-call-readiness'
import type {
  AiGraphicsExternalBetaApiRouteWorkerDispatchHandoffProof,
  AiGraphicsExternalBetaApiRouteWorkerDispatchHandoffCandidate,
} from './ai-graphics-external-beta-api-route-worker-dispatch-handoff-proof'
import type {
  AiGraphicsExternalBetaPrivateArtifactManifest,
  AiGraphicsExternalBetaPrivateArtifactRecord,
} from './ai-graphics-external-beta-private-artifact-manifest'
import type {
  AiGraphicsExternalBetaToolRouteRuntimeProof,
  AiGraphicsExternalBetaToolRouteRuntimeProofRecord,
} from './ai-graphics-external-beta-tool-route-runtime-proof'

export const AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_WORKER_ARTIFACT_TOOL_ROUTE_ADMISSION_DECISION =
  'ai_graphics_external_beta_api_route_worker_artifact_tool_route_admission_prepared_with_runtime_blocks'

export type AiGraphicsExternalBetaApiRouteWorkerArtifactToolRouteAdmissionStatus =
  | 'missing_external_beta_api_route_worker_dispatch_handoff_proof'
  | 'external_beta_api_route_worker_dispatch_handoff_proof_rejected'
  | 'missing_external_beta_private_artifact_manifest'
  | 'external_beta_private_artifact_manifest_rejected'
  | 'missing_external_beta_tool_route_runtime_proof'
  | 'external_beta_tool_route_runtime_proof_rejected'
  | 'missing_external_beta_artifact_tool_route_admission_controls'
  | 'external_beta_api_route_worker_artifact_tool_route_admission_ready_runtime_still_blocked'

export interface AiGraphicsExternalBetaApiRouteWorkerArtifactToolRouteAdmissionInput {
  sourceApiRouteWorkerDispatchHandoffProofPacket?:
    AiGraphicsExternalBetaApiRouteWorkerDispatchHandoffProof
  sourcePrivateArtifactManifestPacket?: AiGraphicsExternalBetaPrivateArtifactManifest
  sourceToolRouteRuntimeProofPacket?: AiGraphicsExternalBetaToolRouteRuntimeProof
  externalBetaArtifactToolRouteAdmissionPolicyRef?: string
  externalBetaPrivateArtifactWritePolicyRef?: string
  externalBetaPrivateArtifactRetentionPolicyRef?: string
  externalBetaToolRouteAdmissionPolicyRef?: string
  externalBetaToolRouteExecutionBlockPolicyRef?: string
  externalBetaApprovedSnapshotBindingRef?: string
  externalBetaCreditReservationBindingRef?: string
  externalBetaGpuOnDemandPolicyRef?: string
  externalBetaTelemetryRef?: string
  externalBetaRollbackPlanRef?: string
}

export interface AiGraphicsExternalBetaApiRouteWorkerArtifactToolRouteAdmissionCandidate {
  admissionId: 'ai_graphics_external_beta_api_route_worker_artifact_tool_route_admission'
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
  artifactToolRouteAdmissionPreparedWithProvidedEvidence: true
  sourceHandoffAccepted: boolean
  privateArtifactManifestAccepted: boolean
  toolRouteRuntimeProofAccepted: boolean
  privateArtifactManifestCoversRequestedTool: boolean
  toolRouteRuntimeProofCoversRequestedTool: boolean
  gpuRuntimeStartAllowedForAcceptedExternalBetaJob: boolean
  gpuRuntimeShouldStartNow: false
  routeExecutionApprovedNow: false
  workerDispatchApprovedNow: false
  toolExecutionApprovedNow: false
  providerRuntimePerformedNow: false
  publicArtifactCreatedNow: false
  signedUrlCreatedNow: false
}

export interface AiGraphicsExternalBetaApiRouteWorkerArtifactToolRouteAdmission {
  decision:
    typeof AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_WORKER_ARTIFACT_TOOL_ROUTE_ADMISSION_DECISION
  status: AiGraphicsExternalBetaApiRouteWorkerArtifactToolRouteAdmissionStatus
  requestedToolId: AiGraphicsCanonicalToolId | null
  capabilityId: string | null
  sourceHandoffAccepted: boolean
  sourcePrivateArtifactManifestAccepted: boolean
  sourceToolRouteRuntimeProofAccepted: boolean
  privateArtifactManifestCoversRequestedTool: boolean
  toolRouteRuntimeProofCoversRequestedTool: boolean
  missingAdmissionControls: string[]
  artifactToolRouteAdmissionPreparedWithProvidedEvidence: boolean
  artifactToolRouteAdmissionPreparedRequestsWithProvidedEvidence: 0 | 1
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  gpuRuntimeTargetedTools: 8
  sourcePrivateArtifactRecordsReadyWithProvidedEvidence: number
  sourceToolRouteRecordsReadyWithProvidedEvidence: number
  externalBetaReadyNowTools: 0
  productionReadyNowTools: 0
  gpuRuntimeShouldStartNow: false
  admissionCandidate:
    AiGraphicsExternalBetaApiRouteWorkerArtifactToolRouteAdmissionCandidate | null
  evidence: {
    artifactToolRouteAdmissionPolicyRef: string | null
    privateArtifactWritePolicyRef: string | null
    privateArtifactRetentionPolicyRef: string | null
    toolRouteAdmissionPolicyRef: string | null
    toolRouteExecutionBlockPolicyRef: string | null
    approvedSnapshotBindingRef: string | null
    creditReservationBindingRef: string | null
    gpuOnDemandPolicyRef: string | null
    telemetryRef: string | null
    rollbackPlanRef: string | null
    sourceHandoffStatus: string | null
    sourcePrivateArtifactManifestDecision: string | null
    sourceToolRouteRuntimeProofDecision: string | null
    requiredExecutionEnvironment: 'private_non_production_external_beta'
    requiredAdmissionMode: 'artifact_tool_route_admission_proof_only'
    savedRouteWorkerHandoffProofRequired: true
    savedPrivateArtifactManifestRequired: true
    savedToolRouteRuntimeProofRequired: true
  }
  policy: {
    validatesSavedProofPacketsOnly: true
    privateArtifactsRequired: true
    toolRouteRuntimeProofRequired: true
    noPrivateArtifactWriteByAdmissionProof: true
    noToolRouteExecutionByAdmissionProof: true
    noWorkerDispatchByAdmissionProof: true
    noToolExecutionByAdmissionProof: true
    noProviderRuntimeByAdmissionProof: true
    noBrowserWebglCanvasRuntimeByAdmissionProof: true
    noGpuRuntimeStartByAdmissionProof: true
    publicArtifactsRejected: true
    signedUrlsRejected: true
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    nextGateRequiresControlledWorkerRuntimeProof: true
  }
  booleans: {
    externalBetaApiRouteWorkerArtifactToolRouteAdmissionPrepared: true
    sourceApiRouteWorkerDispatchHandoffProofAccepted: boolean
    sourcePrivateArtifactManifestAccepted: boolean
    sourceToolRouteRuntimeProofAccepted: boolean
    privateArtifactManifestCoversRequestedTool: boolean
    toolRouteRuntimeProofCoversRequestedTool: boolean
    artifactToolRouteAdmissionControlsAccepted: boolean
    artifactToolRouteAdmissionPreparedWithProvidedEvidence: boolean
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    all8GpuToolsTargetGpuRuntime: true
    all21PrivateArtifactManifestRecordsReadyWithProvidedEvidence: boolean
    all21ToolRouteRecordsReadyWithProvidedEvidence: boolean
    privateInputArtifactsRequired: true
    privateOutputArtifactsRequired: true
    privateTelemetryRequired: true
    privateLeaseAuditRequired: true
    toolRouteRuntimeProofAccepted: boolean
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
    artifactToolRouteAdmissionApprovedNow: false
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
  'external-beta-route-worker-dispatch://',
]

const forbiddenRefPatterns = [
  'http://',
  'https://',
  'signed-url://',
  'public://',
  'gs://',
  'gcs://',
]

function productCapabilities(): string[] {
  return AI_GRAPHICS_TOOL_CALL_CAPABILITY_IDS.filter((capability) => (
    capability !== 'planning_metadata_only' &&
    capability !== 'blocked_or_deferred'
  ))
}

function productCapabilityCount(): 12 {
  return productCapabilities().length as 12
}

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

function canonicalToolId(value?: string | null): AiGraphicsCanonicalToolId | null {
  if (!value) return null
  return AI_GRAPHICS_CANONICAL_TOOL_IDS.includes(value as AiGraphicsCanonicalToolId)
    ? value as AiGraphicsCanonicalToolId
    : null
}

function sourceHandoffAccepted(
  packet?: AiGraphicsExternalBetaApiRouteWorkerDispatchHandoffProof,
): boolean {
  return Boolean(packet) &&
    packet?.decision ===
      'ai_graphics_external_beta_api_route_worker_dispatch_handoff_proof_prepared_with_runtime_blocks' &&
    packet.status ===
      'external_beta_api_route_worker_dispatch_handoff_proof_ready_runtime_still_blocked' &&
    packet.apiRouteWorkerDispatchHandoffPreparedWithProvidedEvidence === true &&
    packet.apiRouteWorkerDispatchHandoffPreparedRequestsWithProvidedEvidence === 1 &&
    packet.handoffCandidate !== null &&
    packet.sourceApiRouteQueueSmokeProofAccepted === true &&
    packet.sourceWorkerDispatchSmokeProofAccepted === true &&
    packet.sourceWorkerDispatchSmokeProofAcceptedToolsWithProvidedEvidence === 21 &&
    packet.sourceRouteQueueSmokeRowsAcceptedWithProvidedEvidence === 1 &&
    packet.sourceRouteQueueRowsPersistedAfterCleanup === 0 &&
    packet.sourceWorkerDispatchSmokeInMemoryLeasesAcceptedWithProvidedEvidence === 21 &&
    packet.liveWorkerLeasesCreatedNow === 0 &&
    packet.liveWorkerDispatchesNow === 0 &&
    packet.liveToolExecutionsNow === 0 &&
    packet.gpuRuntimeShouldStartNow === false &&
    packet.booleans.sourceWorkerDispatchSmokeProofCoversRequestedTool === true &&
    packet.booleans.gpuRuntimeOnDemandOnly === true &&
    packet.booleans.noIdleGpuRuntimeApproved === true &&
    packet.booleans.gpuRuntimeShouldStartNow === false &&
    packet.booleans.workerDispatchPerformed === false &&
    packet.booleans.toolExecutionPerformed === false &&
    packet.booleans.externalBetaReadyNow === false &&
    packet.booleans.productionReadyNow === false
}

function sourcePrivateArtifactManifestAccepted(
  packet?: AiGraphicsExternalBetaPrivateArtifactManifest,
): boolean {
  return Boolean(packet) &&
    packet?.decision === 'external_beta_private_artifact_manifest_ready_with_runtime_blocks' &&
    packet.privateArtifactManifestReadyWithProvidedEvidence === true &&
    packet.manifestRecordsPrepared === 21 &&
    packet.manifestRecordsReadyWithProvidedEvidence === 21 &&
    packet.sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence === 21 &&
    packet.sourceServiceRoleQueueSmokeAuthorizationAcceptedWithProvidedEvidence === 21 &&
    packet.records.length === 21 &&
    packet.records.every((record) => (
      record.manifestReadyWithProvidedEvidence === true &&
      record.publicArtifactAllowed === false &&
      record.signedUrlAllowed === false &&
      isSafePrivateRef(record.inputManifestRef) &&
      isSafePrivateRef(record.outputManifestRef) &&
      isSafePrivateRef(record.telemetryRef) &&
      isSafePrivateRef(record.leaseAuditRef) &&
      (!record.gpuRuntimeTargeted || isSafePrivateRef(record.modelWeightOrCacheManifestRef))
    )) &&
    packet.gpuRuntimeTargetedTools === 8 &&
    packet.externalBetaReadyNowTools === 0 &&
    packet.productionReadyNowTools === 0 &&
    packet.booleans.agentCanExecuteToolsNow === false &&
    packet.booleans.workerDispatchApprovedNow === false &&
    packet.booleans.toolExecutionApprovedNow === false &&
    packet.booleans.gpuRuntimeShouldStartNow === false &&
    packet.booleans.publicArtifactCreated === false &&
    packet.booleans.signedUrlCreated === false
}

function sourceToolRouteRuntimeProofAccepted(
  packet?: AiGraphicsExternalBetaToolRouteRuntimeProof,
): boolean {
  return Boolean(packet) &&
    packet?.decision === 'external_beta_tool_route_runtime_proof_ready_with_runtime_blocks' &&
    packet.toolRouteRuntimeProofReadyWithProvidedEvidence === true &&
    packet.toolRouteRecordsPrepared === 21 &&
    packet.toolRouteRecordsReadyWithProvidedEvidence === 21 &&
    packet.sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence === 21 &&
    packet.sourceServiceRoleQueueSmokeAuthorizationAcceptedWithProvidedEvidence === 21 &&
    packet.records.length === 21 &&
    packet.records.every((record) => (
      record.toolRouteRuntimeProofReadyWithProvidedEvidence === true &&
      record.privateArtifactManifestAccepted === true &&
      record.routeMode === 'runtime_proof_only' &&
      record.publicArtifactAllowed === false &&
      record.signedUrlAllowed === false &&
      isSafePrivateRef(record.privateInputManifestRef) &&
      isSafePrivateRef(record.privateOutputManifestRef) &&
      isSafePrivateRef(record.privateTelemetryRef) &&
      isSafePrivateRef(record.privateLeaseAuditRef) &&
      isSafePrivateRef(record.toolRoutePolicyRef) &&
      isSafePrivateRef(record.toolRouteSchemaRef) &&
      isSafePrivateRef(record.toolRouteAdmissionRef) &&
      isSafePrivateRef(record.toolRouteAuthzRef) &&
      isSafePrivateRef(record.toolRouteRateLimitRef) &&
      isSafePrivateRef(record.toolRouteAuditRef) &&
      isSafePrivateRef(record.toolRouteRollbackRef) &&
      (!record.gpuRuntimeTargeted || isSafePrivateRef(record.modelWeightOrCacheManifestRef))
    )) &&
    packet.gpuRuntimeTargetedTools === 8 &&
    packet.externalBetaReadyNowTools === 0 &&
    packet.productionReadyNowTools === 0 &&
    packet.booleans.routeExecutionApprovedNow === false &&
    packet.booleans.workerDispatchApprovedNow === false &&
    packet.booleans.toolExecutionApprovedNow === false &&
    packet.booleans.gpuRuntimeShouldStartNow === false &&
    packet.booleans.publicArtifactCreated === false &&
    packet.booleans.signedUrlCreated === false
}

function missingAdmissionControls(
  input: AiGraphicsExternalBetaApiRouteWorkerArtifactToolRouteAdmissionInput,
): string[] {
  return [
    !isSafePrivateRef(input.externalBetaArtifactToolRouteAdmissionPolicyRef)
      ? 'external beta artifact Tool Route admission policy ref is missing or not private'
      : undefined,
    !isSafePrivateRef(input.externalBetaPrivateArtifactWritePolicyRef)
      ? 'external beta private artifact write policy ref is missing or not private'
      : undefined,
    !isSafePrivateRef(input.externalBetaPrivateArtifactRetentionPolicyRef)
      ? 'external beta private artifact retention policy ref is missing or not private'
      : undefined,
    !isSafePrivateRef(input.externalBetaToolRouteAdmissionPolicyRef)
      ? 'external beta Tool Route admission policy ref is missing or not private'
      : undefined,
    !isSafePrivateRef(input.externalBetaToolRouteExecutionBlockPolicyRef)
      ? 'external beta Tool Route execution block policy ref is missing or not private'
      : undefined,
    !isSafePrivateRef(input.externalBetaApprovedSnapshotBindingRef)
      ? 'external beta approved snapshot binding ref is missing or not private'
      : undefined,
    !isSafePrivateRef(input.externalBetaCreditReservationBindingRef)
      ? 'external beta credit reservation binding ref is missing or not private'
      : undefined,
    !isSafePrivateRef(input.externalBetaGpuOnDemandPolicyRef)
      ? 'external beta GPU on-demand policy ref is missing or not private'
      : undefined,
    !isSafePrivateRef(input.externalBetaTelemetryRef)
      ? 'external beta telemetry ref is missing or not private'
      : undefined,
    !isSafePrivateRef(input.externalBetaRollbackPlanRef)
      ? 'external beta rollback plan ref is missing or not private'
      : undefined,
  ].filter((reason): reason is string => Boolean(reason))
}

function manifestRecordForTool(
  packet: AiGraphicsExternalBetaPrivateArtifactManifest | undefined,
  toolId: AiGraphicsCanonicalToolId | null,
): AiGraphicsExternalBetaPrivateArtifactRecord | undefined {
  if (!toolId) return undefined
  return packet?.records?.find((record) => record.toolId === toolId)
}

function toolRouteRecordForTool(
  packet: AiGraphicsExternalBetaToolRouteRuntimeProof | undefined,
  toolId: AiGraphicsCanonicalToolId | null,
): AiGraphicsExternalBetaToolRouteRuntimeProofRecord | undefined {
  if (!toolId) return undefined
  return packet?.records?.find((record) => record.toolId === toolId)
}

function readinessRecordForTool(toolId: AiGraphicsCanonicalToolId | null) {
  if (!toolId) return undefined
  return listAiGraphicsToolCallReadiness().find((record) => record.toolId === toolId)
}

function manifestCoversTool(input: {
  manifestAccepted: boolean
  manifestRecord?: AiGraphicsExternalBetaPrivateArtifactRecord
  handoffCandidate?: AiGraphicsExternalBetaApiRouteWorkerDispatchHandoffCandidate | null
}): boolean {
  const candidate = input.handoffCandidate
  const manifestRecord = input.manifestRecord
  return input.manifestAccepted &&
    Boolean(candidate) &&
    Boolean(manifestRecord) &&
    manifestRecord?.toolId === candidate?.toolId &&
    manifestRecord?.manifestReadyWithProvidedEvidence === true &&
    manifestRecord?.publicArtifactAllowed === false &&
    manifestRecord?.signedUrlAllowed === false &&
    isSafePrivateRef(manifestRecord?.inputManifestRef) &&
    isSafePrivateRef(manifestRecord?.outputManifestRef) &&
    isSafePrivateRef(manifestRecord?.telemetryRef) &&
    isSafePrivateRef(manifestRecord?.leaseAuditRef) &&
    (!manifestRecord?.gpuRuntimeTargeted ||
      isSafePrivateRef(manifestRecord.modelWeightOrCacheManifestRef))
}

function toolRouteCoversTool(input: {
  toolRouteAccepted: boolean
  toolRouteRecord?: AiGraphicsExternalBetaToolRouteRuntimeProofRecord
  manifestRecord?: AiGraphicsExternalBetaPrivateArtifactRecord
  handoffCandidate?: AiGraphicsExternalBetaApiRouteWorkerDispatchHandoffCandidate | null
}): boolean {
  const candidate = input.handoffCandidate
  const routeRecord = input.toolRouteRecord
  const manifestRecord = input.manifestRecord
  return input.toolRouteAccepted &&
    Boolean(candidate) &&
    Boolean(routeRecord) &&
    routeRecord?.toolId === candidate?.toolId &&
    routeRecord?.toolRouteRuntimeProofReadyWithProvidedEvidence === true &&
    routeRecord?.routeMode === 'runtime_proof_only' &&
    routeRecord?.privateInputManifestRef === manifestRecord?.inputManifestRef &&
    routeRecord?.privateOutputManifestRef === manifestRecord?.outputManifestRef &&
    routeRecord?.privateTelemetryRef === manifestRecord?.telemetryRef &&
    routeRecord?.privateLeaseAuditRef === manifestRecord?.leaseAuditRef &&
    routeRecord?.routeExecutionApprovedNow === false &&
    routeRecord?.workerDispatchApprovedNow === false &&
    routeRecord?.toolExecutionApprovedNow === false &&
    routeRecord?.providerRuntimeApprovedNow === false &&
    routeRecord?.gpuRuntimeShouldStartNow === false &&
    routeRecord?.publicArtifactAllowed === false &&
    routeRecord?.signedUrlAllowed === false
}

function buildAdmissionCandidate(input: {
  toolId: AiGraphicsCanonicalToolId | null
  capabilityId: string | null
  handoffAccepted: boolean
  manifestAccepted: boolean
  toolRouteAccepted: boolean
  manifestCovers: boolean
  toolRouteCovers: boolean
  handoffCandidate?: AiGraphicsExternalBetaApiRouteWorkerDispatchHandoffCandidate | null
  manifestRecord?: AiGraphicsExternalBetaPrivateArtifactRecord
  toolRouteRecord?: AiGraphicsExternalBetaToolRouteRuntimeProofRecord
}): AiGraphicsExternalBetaApiRouteWorkerArtifactToolRouteAdmissionCandidate | null {
  const toolId = input.toolId
  const capabilityId = input.capabilityId
  const handoffCandidate = input.handoffCandidate
  const manifestRecord = input.manifestRecord
  const routeRecord = input.toolRouteRecord
  if (
    !toolId ||
    !capabilityId ||
    !handoffCandidate ||
    !manifestRecord ||
    !routeRecord ||
    !input.handoffAccepted ||
    !input.manifestAccepted ||
    !input.toolRouteAccepted ||
    !input.manifestCovers ||
    !input.toolRouteCovers ||
    !isSafePrivateRef(manifestRecord.inputManifestRef) ||
    !isSafePrivateRef(manifestRecord.outputManifestRef) ||
    !isSafePrivateRef(manifestRecord.telemetryRef) ||
    !isSafePrivateRef(manifestRecord.leaseAuditRef)
  ) {
    return null
  }

  return {
    admissionId:
      'ai_graphics_external_beta_api_route_worker_artifact_tool_route_admission',
    toolId,
    capabilityId,
    routePath: handoffCandidate.routePath,
    routeId: routeRecord.routeId,
    queueName: handoffCandidate.queueName,
    queueJobType: handoffCandidate.queueJobType,
    approvedPlanSnapshotId: handoffCandidate.approvedPlanSnapshotId,
    creditReservationId: handoffCandidate.creditReservationId,
    idempotencyKey: handoffCandidate.idempotencyKey,
    runtimeTarget: handoffCandidate.runtimeTarget,
    workerType: handoffCandidate.workerType,
    gpuRequiredForRuntime: handoffCandidate.gpuRequiredForRuntime,
    privateInputManifestRef: manifestRecord.inputManifestRef ?? '',
    privateOutputManifestRef: manifestRecord.outputManifestRef ?? '',
    privateTelemetryRef: manifestRecord.telemetryRef ?? '',
    privateLeaseAuditRef: manifestRecord.leaseAuditRef ?? '',
    modelWeightOrCacheManifestRef: manifestRecord.modelWeightOrCacheManifestRef,
    artifactToolRouteAdmissionPreparedWithProvidedEvidence: true,
    sourceHandoffAccepted: input.handoffAccepted,
    privateArtifactManifestAccepted: input.manifestAccepted,
    toolRouteRuntimeProofAccepted: input.toolRouteAccepted,
    privateArtifactManifestCoversRequestedTool: input.manifestCovers,
    toolRouteRuntimeProofCoversRequestedTool: input.toolRouteCovers,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob:
      handoffCandidate.gpuRuntimeStartAllowedForAcceptedExternalBetaJob,
    gpuRuntimeShouldStartNow: false,
    routeExecutionApprovedNow: false,
    workerDispatchApprovedNow: false,
    toolExecutionApprovedNow: false,
    providerRuntimePerformedNow: false,
    publicArtifactCreatedNow: false,
    signedUrlCreatedNow: false,
  }
}

function statusFromInput(input: {
  hasHandoff: boolean
  handoffAccepted: boolean
  hasManifest: boolean
  manifestAccepted: boolean
  hasToolRoute: boolean
  toolRouteAccepted: boolean
  controlsAccepted: boolean
}): AiGraphicsExternalBetaApiRouteWorkerArtifactToolRouteAdmissionStatus {
  if (!input.hasHandoff) {
    return 'missing_external_beta_api_route_worker_dispatch_handoff_proof'
  }
  if (!input.handoffAccepted) {
    return 'external_beta_api_route_worker_dispatch_handoff_proof_rejected'
  }
  if (!input.hasManifest) return 'missing_external_beta_private_artifact_manifest'
  if (!input.manifestAccepted) return 'external_beta_private_artifact_manifest_rejected'
  if (!input.hasToolRoute) return 'missing_external_beta_tool_route_runtime_proof'
  if (!input.toolRouteAccepted) return 'external_beta_tool_route_runtime_proof_rejected'
  return input.controlsAccepted
    ? 'external_beta_api_route_worker_artifact_tool_route_admission_ready_runtime_still_blocked'
    : 'missing_external_beta_artifact_tool_route_admission_controls'
}

export function evaluateAiGraphicsExternalBetaApiRouteWorkerArtifactToolRouteAdmission(
  input: AiGraphicsExternalBetaApiRouteWorkerArtifactToolRouteAdmissionInput = {},
): AiGraphicsExternalBetaApiRouteWorkerArtifactToolRouteAdmission {
  const handoffPacket = input.sourceApiRouteWorkerDispatchHandoffProofPacket
  const manifestPacket = input.sourcePrivateArtifactManifestPacket
  const toolRoutePacket = input.sourceToolRouteRuntimeProofPacket
  const handoffAccepted = sourceHandoffAccepted(handoffPacket)
  const manifestAccepted = sourcePrivateArtifactManifestAccepted(manifestPacket)
  const toolRouteAccepted = sourceToolRouteRuntimeProofAccepted(toolRoutePacket)
  const requestedToolId = canonicalToolId(
    handoffPacket?.handoffCandidate?.toolId ?? handoffPacket?.requestedToolId,
  )
  const capabilityId =
    handoffPacket?.handoffCandidate?.capabilityId ??
    handoffPacket?.capabilityId ??
    readinessRecordForTool(requestedToolId)?.capabilities.find((capability) => (
      capability !== 'planning_metadata_only' &&
      capability !== 'blocked_or_deferred'
    )) ??
    null
  const manifestRecord = manifestRecordForTool(manifestPacket, requestedToolId)
  const toolRouteRecord = toolRouteRecordForTool(toolRoutePacket, requestedToolId)
  const controls = missingAdmissionControls(input)
  const controlsAccepted = controls.length === 0
  const manifestCovers = manifestCoversTool({
    manifestAccepted,
    manifestRecord,
    handoffCandidate: handoffPacket?.handoffCandidate,
  })
  const toolRouteCovers = toolRouteCoversTool({
    toolRouteAccepted,
    toolRouteRecord,
    manifestRecord,
    handoffCandidate: handoffPacket?.handoffCandidate,
  })
  const admissionReady =
    handoffAccepted &&
    manifestAccepted &&
    toolRouteAccepted &&
    manifestCovers &&
    toolRouteCovers &&
    controlsAccepted
  const admissionCandidate = buildAdmissionCandidate({
    toolId: requestedToolId,
    capabilityId,
    handoffAccepted,
    manifestAccepted,
    toolRouteAccepted,
    manifestCovers,
    toolRouteCovers,
    handoffCandidate: handoffPacket?.handoffCandidate,
    manifestRecord,
    toolRouteRecord,
  })
  const sourcePrivateArtifactRecordsReadyWithProvidedEvidence =
    manifestAccepted
      ? manifestPacket?.manifestRecordsReadyWithProvidedEvidence ?? 0
      : 0
  const sourceToolRouteRecordsReadyWithProvidedEvidence =
    toolRouteAccepted
      ? toolRoutePacket?.toolRouteRecordsReadyWithProvidedEvidence ?? 0
      : 0

  return {
    decision:
      AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_WORKER_ARTIFACT_TOOL_ROUTE_ADMISSION_DECISION,
    status: statusFromInput({
      hasHandoff: Boolean(handoffPacket),
      handoffAccepted,
      hasManifest: Boolean(manifestPacket),
      manifestAccepted,
      hasToolRoute: Boolean(toolRoutePacket),
      toolRouteAccepted,
      controlsAccepted,
    }),
    requestedToolId,
    capabilityId,
    sourceHandoffAccepted: handoffAccepted,
    sourcePrivateArtifactManifestAccepted: manifestAccepted,
    sourceToolRouteRuntimeProofAccepted: toolRouteAccepted,
    privateArtifactManifestCoversRequestedTool: manifestCovers,
    toolRouteRuntimeProofCoversRequestedTool: toolRouteCovers,
    missingAdmissionControls: controls,
    artifactToolRouteAdmissionPreparedWithProvidedEvidence: admissionReady,
    artifactToolRouteAdmissionPreparedRequestsWithProvidedEvidence:
      admissionReady ? 1 : 0,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: productCapabilityCount(),
    gpuRuntimeTargetedTools: 8,
    sourcePrivateArtifactRecordsReadyWithProvidedEvidence,
    sourceToolRouteRecordsReadyWithProvidedEvidence,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    gpuRuntimeShouldStartNow: false,
    admissionCandidate,
    evidence: {
      artifactToolRouteAdmissionPolicyRef:
        input.externalBetaArtifactToolRouteAdmissionPolicyRef ?? null,
      privateArtifactWritePolicyRef:
        input.externalBetaPrivateArtifactWritePolicyRef ?? null,
      privateArtifactRetentionPolicyRef:
        input.externalBetaPrivateArtifactRetentionPolicyRef ?? null,
      toolRouteAdmissionPolicyRef:
        input.externalBetaToolRouteAdmissionPolicyRef ?? null,
      toolRouteExecutionBlockPolicyRef:
        input.externalBetaToolRouteExecutionBlockPolicyRef ?? null,
      approvedSnapshotBindingRef:
        input.externalBetaApprovedSnapshotBindingRef ?? null,
      creditReservationBindingRef:
        input.externalBetaCreditReservationBindingRef ?? null,
      gpuOnDemandPolicyRef: input.externalBetaGpuOnDemandPolicyRef ?? null,
      telemetryRef: input.externalBetaTelemetryRef ?? null,
      rollbackPlanRef: input.externalBetaRollbackPlanRef ?? null,
      sourceHandoffStatus: handoffPacket?.status ?? null,
      sourcePrivateArtifactManifestDecision: manifestPacket?.decision ?? null,
      sourceToolRouteRuntimeProofDecision: toolRoutePacket?.decision ?? null,
      requiredExecutionEnvironment: 'private_non_production_external_beta',
      requiredAdmissionMode: 'artifact_tool_route_admission_proof_only',
      savedRouteWorkerHandoffProofRequired: true,
      savedPrivateArtifactManifestRequired: true,
      savedToolRouteRuntimeProofRequired: true,
    },
    policy: {
      validatesSavedProofPacketsOnly: true,
      privateArtifactsRequired: true,
      toolRouteRuntimeProofRequired: true,
      noPrivateArtifactWriteByAdmissionProof: true,
      noToolRouteExecutionByAdmissionProof: true,
      noWorkerDispatchByAdmissionProof: true,
      noToolExecutionByAdmissionProof: true,
      noProviderRuntimeByAdmissionProof: true,
      noBrowserWebglCanvasRuntimeByAdmissionProof: true,
      noGpuRuntimeStartByAdmissionProof: true,
      publicArtifactsRejected: true,
      signedUrlsRejected: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      nextGateRequiresControlledWorkerRuntimeProof: true,
    },
    booleans: {
      externalBetaApiRouteWorkerArtifactToolRouteAdmissionPrepared: true,
      sourceApiRouteWorkerDispatchHandoffProofAccepted: handoffAccepted,
      sourcePrivateArtifactManifestAccepted: manifestAccepted,
      sourceToolRouteRuntimeProofAccepted: toolRouteAccepted,
      privateArtifactManifestCoversRequestedTool: manifestCovers,
      toolRouteRuntimeProofCoversRequestedTool: toolRouteCovers,
      artifactToolRouteAdmissionControlsAccepted: controlsAccepted,
      artifactToolRouteAdmissionPreparedWithProvidedEvidence: admissionReady,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all8GpuToolsTargetGpuRuntime: true,
      all21PrivateArtifactManifestRecordsReadyWithProvidedEvidence:
        sourcePrivateArtifactRecordsReadyWithProvidedEvidence ===
          AI_GRAPHICS_CANONICAL_TOOL_IDS.length,
      all21ToolRouteRecordsReadyWithProvidedEvidence:
        sourceToolRouteRecordsReadyWithProvidedEvidence ===
          AI_GRAPHICS_CANONICAL_TOOL_IDS.length,
      privateInputArtifactsRequired: true,
      privateOutputArtifactsRequired: true,
      privateTelemetryRequired: true,
      privateLeaseAuditRequired: true,
      toolRouteRuntimeProofAccepted: toolRouteAccepted,
      publicArtifactRefsRejected: true,
      signedUrlRefsRejected: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForApprovedWorkerOrToolCall: true,
      gpuRuntimeStartAllowedForAcceptedExternalBetaJob:
        admissionCandidate?.gpuRuntimeStartAllowedForAcceptedExternalBetaJob ?? false,
      gpuRuntimeShouldStartNow: false,
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: false,
      externalBetaCallableNow: false,
      artifactToolRouteAdmissionApprovedNow: false,
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
