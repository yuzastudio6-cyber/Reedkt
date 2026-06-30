import {
  acceptedAiGraphicsProductionControlledWorkerRuntimeSmokeProof,
  type AiGraphicsProductionControlledWorkerRuntimeSmokeProof,
} from './ai-graphics-production-controlled-worker-runtime-smoke-proof'
import type {
  AiGraphicsCanonicalToolId,
} from './ai-graphics-tool-call-readiness'
import type {
  ProductionRegistryWorkerType,
  ProductionToolId,
} from './production-tool-types'

export const AI_GRAPHICS_PRODUCTION_CONTROLLED_PRIVATE_ARTIFACT_TOOL_ROUTE_HANDOFF_PROOF_DECISION =
  'ai_graphics_production_controlled_private_artifact_tool_route_handoff_proof_prepared_with_runtime_blocks'

export type AiGraphicsProductionControlledPrivateArtifactToolRouteHandoffProofStatus =
  | 'planning_metadata_selected'
  | 'missing_production_controlled_worker_runtime_smoke_proof'
  | 'production_controlled_worker_runtime_smoke_proof_rejected'
  | 'awaiting_production_controlled_private_artifact_tool_route_handoff_controls'
  | 'production_controlled_private_artifact_tool_route_handoff_ready_no_execution'

export interface AiGraphicsProductionControlledPrivateArtifactToolRouteHandoffProofInput {
  sourceProductionControlledWorkerRuntimeSmokeProofPacket?:
    AiGraphicsProductionControlledWorkerRuntimeSmokeProof
  productionControlledPrivateInputManifestRef?: string
  productionControlledPrivateOutputManifestRef?: string
  productionControlledPrivateTelemetryRef?: string
  productionControlledPrivateLeaseAuditRef?: string
  productionControlledPrivateRouteHandoffRef?: string
  productionControlledPrivateArtifactPolicyRef?: string
  productionControlledPrivateArtifactRetentionRef?: string
  productionControlledToolRoutePolicyRef?: string
  productionControlledToolRouteSchemaRef?: string
  productionControlledToolRouteAdmissionRef?: string
  productionControlledToolRouteAuthzRef?: string
  productionControlledToolRouteExecutionBlockRef?: string
  productionControlledToolRouteAuditRef?: string
  productionControlledToolRouteRollbackRef?: string
  productionControlledGpuOnDemandPolicyRef?: string
  productionControlledModelWeightOrCacheManifestRef?: string
}

export interface AiGraphicsProductionControlledPrivateArtifactToolRouteHandoffCandidate {
  handoffId: 'ai_graphics_production_controlled_private_artifact_tool_route_handoff_proof'
  toolId: AiGraphicsCanonicalToolId
  productionToolId: ProductionToolId
  capabilityId: string
  futureRoutePath: '/api/ai-graphics/production/tool-call'
  futureRouteId: string
  futureHandler: string
  workerType: ProductionRegistryWorkerType
  runtimeTarget: string
  sourceRuntimeSmokeJobId: string
  sourceExecutionMode: 'dry_run'
  sourceRuntimeSmokeProofAccepted: true
  sourceAiGraphicsToolCallHandoffResultCreated: true
  sourceInMemoryLeaseLifecycleAccepted: true
  sourceToolRunResultsEmpty: true
  sourceArtifactRecordsEmpty: true
  sourceQualityGateResultsEmpty: true
  sourceFallbackDecisionsEmpty: true
  privateInputManifestRef: string
  privateOutputManifestRef: string
  privateTelemetryRef: string
  privateLeaseAuditRef: string
  privateRouteHandoffRef: string
  privateArtifactPolicyRef: string
  privateArtifactRetentionRef: string
  toolRoutePolicyRef: string
  toolRouteSchemaRef: string
  toolRouteAdmissionRef: string
  toolRouteAuthzRef: string
  toolRouteExecutionBlockRef: string
  toolRouteAuditRef: string
  toolRouteRollbackRef: string
  gpuOnDemandPolicyRef: string
  modelWeightOrCacheManifestRef: string | null
  privateArtifactManifestPreparedWithProvidedEvidence: true
  toolRouteHandoffPreparedWithProvidedEvidence: true
  gpuRuntimeStartAllowedForAcceptedDryRunWorkerJob: boolean
  gpuRuntimeShouldStartNow: false
  privateArtifactWriteApprovedNow: false
  privateArtifactWritePerformedNow: false
  routeExecutionApprovedNow: false
  routeExecutionPerformedNow: false
  workerDispatchApprovedNow: false
  workerDispatchPerformedNow: false
  toolExecutionApprovedNow: false
  toolExecutionPerformedNow: false
  providerRuntimePerformedNow: false
  browserWebglCanvasRuntimePerformedNow: false
  gpuRuntimePerformedNow: false
  publicArtifactCreatedNow: false
  signedUrlCreatedNow: false
}

export interface AiGraphicsProductionControlledPrivateArtifactToolRouteHandoffProof {
  decision:
    typeof AI_GRAPHICS_PRODUCTION_CONTROLLED_PRIVATE_ARTIFACT_TOOL_ROUTE_HANDOFF_PROOF_DECISION
  sourceProductionControlledWorkerRuntimeSmokeProofDecision: string | null
  status: AiGraphicsProductionControlledPrivateArtifactToolRouteHandoffProofStatus
  capabilityId: string | null
  requestedToolId: AiGraphicsCanonicalToolId | null
  sourceProductionControlledWorkerRuntimeSmokeProofAccepted: boolean
  sourceAiGraphicsToolCallHandoffResultAccepted: boolean
  sourceInMemoryLeaseLifecycleAccepted: boolean
  sourceToolRunResultsEmpty: boolean
  sourceArtifactRecordsEmpty: boolean
  sourceQualityGateResultsEmpty: boolean
  sourceFallbackDecisionsEmpty: boolean
  productionControlledPrivateArtifactToolRouteHandoffControlsAccepted: boolean
  privateArtifactManifestPreparedWithProvidedEvidence: boolean
  toolRouteHandoffPreparedWithProvidedEvidence: boolean
  privateArtifactToolRouteHandoffPreparedWithProvidedEvidence: boolean
  missingHandoffControls: string[]
  rejectionReasons: string[]
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  gpuRuntimeTargetedTools: 8
  productionControlledToolCallReadyNowTools: 21 | 0
  runtimeReadyForOnDemandProductionToolCallTools: 0
  externalBetaReadyNowTools: 0
  productionReadyNowTools: 0
  privateArtifactWritesNow: 0
  routeExecutionsNow: 0
  liveWorkerDispatchesNow: 0
  liveToolExecutionsNow: 0
  gpuRuntimeShouldStartNow: false
  handoffCandidate:
    AiGraphicsProductionControlledPrivateArtifactToolRouteHandoffCandidate | null
  evidence: {
    privateInputManifestRef: string | null
    privateOutputManifestRef: string | null
    privateTelemetryRef: string | null
    privateLeaseAuditRef: string | null
    privateRouteHandoffRef: string | null
    privateArtifactPolicyRef: string | null
    privateArtifactRetentionRef: string | null
    toolRoutePolicyRef: string | null
    toolRouteSchemaRef: string | null
    toolRouteAdmissionRef: string | null
    toolRouteAuthzRef: string | null
    toolRouteExecutionBlockRef: string | null
    toolRouteAuditRef: string | null
    toolRouteRollbackRef: string | null
    gpuOnDemandPolicyRef: string | null
    modelWeightOrCacheManifestRef: string | null
    requiredExecutionEnvironment: 'private_non_production_runtime_smoke'
    requiredAdmissionMode: 'private_artifact_tool_route_handoff_proof_only'
    sourceRuntimeSmokeProofRequired: true
    savedPrivateArtifactManifestRequired: true
    savedToolRouteHandoffRequired: true
  }
  policy: {
    validatesSavedRuntimeSmokeProofOnly: true
    privateArtifactsRequired: true
    toolRouteHandoffRequired: true
    noPrivateArtifactWriteByProof: true
    noToolRouteExecutionByProof: true
    noWorkerDispatchByProof: true
    noToolExecutionByProof: true
    noProviderRuntimeByProof: true
    noBrowserWebglCanvasRuntimeByProof: true
    noGpuRuntimeStartByProof: true
    publicArtifactsRejected: true
    signedUrlsRejected: true
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    nextGateRequiresControlledPerToolCallableResultProof: true
  }
  booleans: {
    productionControlledPrivateArtifactToolRouteHandoffProofPrepared: true
    sourceProductionControlledWorkerRuntimeSmokeProofAccepted: boolean
    sourceAiGraphicsToolCallHandoffResultAccepted: boolean
    sourceInMemoryLeaseLifecycleAccepted: boolean
    sourceToolRunResultsEmpty: boolean
    sourceArtifactRecordsEmpty: boolean
    sourceQualityGateResultsEmpty: boolean
    sourceFallbackDecisionsEmpty: boolean
    productionControlledPrivateArtifactToolRouteHandoffControlsAccepted: boolean
    privateArtifactManifestPreparedWithProvidedEvidence: boolean
    toolRouteHandoffPreparedWithProvidedEvidence: boolean
    privateArtifactToolRouteHandoffPreparedWithProvidedEvidence: boolean
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    all8GpuToolsTargetGpuRuntime: true
    productionControlledToolCallReadyNow: boolean
    runtimeReadyForOnDemandProductionToolCall: false
    privateInputArtifactsRequired: true
    privateOutputArtifactsRequired: true
    privateTelemetryRequired: true
    privateLeaseAuditRequired: true
    toolRouteHandoffRequired: true
    publicArtifactRefsRejected: true
    signedUrlRefsRejected: true
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    gpuStartsOnlyForApprovedWorkerOrToolCall: true
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
    privateArtifactWritePerformed: false
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

function hasValue(value?: string | null): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isPrivateEvidenceRef(value?: string | null): value is string {
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
    normalized.startsWith('production-evidence://') ||
    normalized.startsWith('reeditpro-private://')
}

function missingHandoffControls(
  input: AiGraphicsProductionControlledPrivateArtifactToolRouteHandoffProofInput,
  gpuRuntimeTargeted: boolean,
): string[] {
  return [
    !isPrivateEvidenceRef(input.productionControlledPrivateInputManifestRef)
      ? 'productionControlledPrivateInputManifestRef: private/backend evidence ref is required'
      : undefined,
    !isPrivateEvidenceRef(input.productionControlledPrivateOutputManifestRef)
      ? 'productionControlledPrivateOutputManifestRef: private/backend evidence ref is required'
      : undefined,
    !isPrivateEvidenceRef(input.productionControlledPrivateTelemetryRef)
      ? 'productionControlledPrivateTelemetryRef: private/backend evidence ref is required'
      : undefined,
    !isPrivateEvidenceRef(input.productionControlledPrivateLeaseAuditRef)
      ? 'productionControlledPrivateLeaseAuditRef: private/backend evidence ref is required'
      : undefined,
    !isPrivateEvidenceRef(input.productionControlledPrivateRouteHandoffRef)
      ? 'productionControlledPrivateRouteHandoffRef: private/backend evidence ref is required'
      : undefined,
    !isPrivateEvidenceRef(input.productionControlledPrivateArtifactPolicyRef)
      ? 'productionControlledPrivateArtifactPolicyRef: private/backend evidence ref is required'
      : undefined,
    !isPrivateEvidenceRef(input.productionControlledPrivateArtifactRetentionRef)
      ? 'productionControlledPrivateArtifactRetentionRef: private/backend evidence ref is required'
      : undefined,
    !isPrivateEvidenceRef(input.productionControlledToolRoutePolicyRef)
      ? 'productionControlledToolRoutePolicyRef: private/backend evidence ref is required'
      : undefined,
    !isPrivateEvidenceRef(input.productionControlledToolRouteSchemaRef)
      ? 'productionControlledToolRouteSchemaRef: private/backend evidence ref is required'
      : undefined,
    !isPrivateEvidenceRef(input.productionControlledToolRouteAdmissionRef)
      ? 'productionControlledToolRouteAdmissionRef: private/backend evidence ref is required'
      : undefined,
    !isPrivateEvidenceRef(input.productionControlledToolRouteAuthzRef)
      ? 'productionControlledToolRouteAuthzRef: private/backend evidence ref is required'
      : undefined,
    !isPrivateEvidenceRef(input.productionControlledToolRouteExecutionBlockRef)
      ? 'productionControlledToolRouteExecutionBlockRef: private/backend evidence ref is required'
      : undefined,
    !isPrivateEvidenceRef(input.productionControlledToolRouteAuditRef)
      ? 'productionControlledToolRouteAuditRef: private/backend evidence ref is required'
      : undefined,
    !isPrivateEvidenceRef(input.productionControlledToolRouteRollbackRef)
      ? 'productionControlledToolRouteRollbackRef: private/backend evidence ref is required'
      : undefined,
    !isPrivateEvidenceRef(input.productionControlledGpuOnDemandPolicyRef)
      ? 'productionControlledGpuOnDemandPolicyRef: private/backend evidence ref is required'
      : undefined,
    gpuRuntimeTargeted &&
      !isPrivateEvidenceRef(input.productionControlledModelWeightOrCacheManifestRef)
      ? 'productionControlledModelWeightOrCacheManifestRef: private/backend evidence ref is required for GPU/model tools'
      : undefined,
  ].filter((reason): reason is string => Boolean(reason))
}

function sourceRecord(
  packet?: AiGraphicsProductionControlledWorkerRuntimeSmokeProof,
) {
  return packet?.runtimeSmokeProofRecord ?? null
}

function sourceHandoffAccepted(
  packet?: AiGraphicsProductionControlledWorkerRuntimeSmokeProof,
): boolean {
  const record = sourceRecord(packet)
  return acceptedAiGraphicsProductionControlledWorkerRuntimeSmokeProof(packet) &&
    record?.aiGraphicsToolCallHandoffResultCreated === true &&
    record?.routeOutputCreated === true &&
    hasValue(record.routeOutputFutureHandler)
}

function sourceLeaseLifecycleAccepted(
  packet?: AiGraphicsProductionControlledWorkerRuntimeSmokeProof,
): boolean {
  const record = sourceRecord(packet)
  return acceptedAiGraphicsProductionControlledWorkerRuntimeSmokeProof(packet) &&
    record?.inMemoryLeaseCreated === true &&
    record?.inMemoryLeaseReleased === true &&
    record?.inMemoryLeaseCount === 1
}

function sourceZeroResultSetsAccepted(
  packet?: AiGraphicsProductionControlledWorkerRuntimeSmokeProof,
): {
  toolRunResultsEmpty: boolean
  artifactRecordsEmpty: boolean
  qualityGateResultsEmpty: boolean
  fallbackDecisionsEmpty: boolean
} {
  const record = sourceRecord(packet)
  return {
    toolRunResultsEmpty:
      acceptedAiGraphicsProductionControlledWorkerRuntimeSmokeProof(packet) &&
      record?.toolRunResultsCreated === 0,
    artifactRecordsEmpty:
      acceptedAiGraphicsProductionControlledWorkerRuntimeSmokeProof(packet) &&
      record?.artifactRecordsCreated === 0,
    qualityGateResultsEmpty:
      acceptedAiGraphicsProductionControlledWorkerRuntimeSmokeProof(packet) &&
      record?.qualityGateResultsCreated === 0,
    fallbackDecisionsEmpty:
      acceptedAiGraphicsProductionControlledWorkerRuntimeSmokeProof(packet) &&
      record?.fallbackDecisionsCreated === 0,
  }
}

function buildCandidate(input: {
  packet?: AiGraphicsProductionControlledWorkerRuntimeSmokeProof
  controlsAccepted: boolean
  sourceAccepted: boolean
  sourceHandoffAccepted: boolean
  sourceLeaseLifecycleAccepted: boolean
  sourceToolRunResultsEmpty: boolean
  sourceArtifactRecordsEmpty: boolean
  sourceQualityGateResultsEmpty: boolean
  sourceFallbackDecisionsEmpty: boolean
  refs: AiGraphicsProductionControlledPrivateArtifactToolRouteHandoffProofInput
}): AiGraphicsProductionControlledPrivateArtifactToolRouteHandoffCandidate | null {
  const record = sourceRecord(input.packet)
  if (
    !record ||
    !input.sourceAccepted ||
    !input.sourceHandoffAccepted ||
    !input.sourceLeaseLifecycleAccepted ||
    !input.sourceToolRunResultsEmpty ||
    !input.sourceArtifactRecordsEmpty ||
    !input.sourceQualityGateResultsEmpty ||
    !input.sourceFallbackDecisionsEmpty ||
    !input.controlsAccepted ||
    !isPrivateEvidenceRef(input.refs.productionControlledPrivateInputManifestRef) ||
    !isPrivateEvidenceRef(input.refs.productionControlledPrivateOutputManifestRef) ||
    !isPrivateEvidenceRef(input.refs.productionControlledPrivateTelemetryRef) ||
    !isPrivateEvidenceRef(input.refs.productionControlledPrivateLeaseAuditRef) ||
    !isPrivateEvidenceRef(input.refs.productionControlledPrivateRouteHandoffRef) ||
    !isPrivateEvidenceRef(input.refs.productionControlledPrivateArtifactPolicyRef) ||
    !isPrivateEvidenceRef(input.refs.productionControlledPrivateArtifactRetentionRef) ||
    !isPrivateEvidenceRef(input.refs.productionControlledToolRoutePolicyRef) ||
    !isPrivateEvidenceRef(input.refs.productionControlledToolRouteSchemaRef) ||
    !isPrivateEvidenceRef(input.refs.productionControlledToolRouteAdmissionRef) ||
    !isPrivateEvidenceRef(input.refs.productionControlledToolRouteAuthzRef) ||
    !isPrivateEvidenceRef(input.refs.productionControlledToolRouteExecutionBlockRef) ||
    !isPrivateEvidenceRef(input.refs.productionControlledToolRouteAuditRef) ||
    !isPrivateEvidenceRef(input.refs.productionControlledToolRouteRollbackRef) ||
    !isPrivateEvidenceRef(input.refs.productionControlledGpuOnDemandPolicyRef)
  ) {
    return null
  }
  const gpuRuntimeTargeted = record.gpuRuntimeStartAllowedForAcceptedDryRunWorkerJob
  if (
    gpuRuntimeTargeted &&
    !isPrivateEvidenceRef(input.refs.productionControlledModelWeightOrCacheManifestRef)
  ) {
    return null
  }
  return {
    handoffId:
      'ai_graphics_production_controlled_private_artifact_tool_route_handoff_proof',
    toolId: record.toolId,
    productionToolId: record.productionToolId,
    capabilityId: record.capabilityId,
    futureRoutePath: '/api/ai-graphics/production/tool-call',
    futureRouteId: `ai-graphics-production-tool-route-${record.toolId}`,
    futureHandler: record.routeOutputFutureHandler ?? '',
    workerType: record.workerType,
    runtimeTarget: record.runtimeTarget,
    sourceRuntimeSmokeJobId: record.jobId,
    sourceExecutionMode: record.executionMode,
    sourceRuntimeSmokeProofAccepted: true,
    sourceAiGraphicsToolCallHandoffResultCreated: true,
    sourceInMemoryLeaseLifecycleAccepted: true,
    sourceToolRunResultsEmpty: true,
    sourceArtifactRecordsEmpty: true,
    sourceQualityGateResultsEmpty: true,
    sourceFallbackDecisionsEmpty: true,
    privateInputManifestRef: input.refs.productionControlledPrivateInputManifestRef,
    privateOutputManifestRef: input.refs.productionControlledPrivateOutputManifestRef,
    privateTelemetryRef: input.refs.productionControlledPrivateTelemetryRef,
    privateLeaseAuditRef: input.refs.productionControlledPrivateLeaseAuditRef,
    privateRouteHandoffRef: input.refs.productionControlledPrivateRouteHandoffRef,
    privateArtifactPolicyRef: input.refs.productionControlledPrivateArtifactPolicyRef,
    privateArtifactRetentionRef:
      input.refs.productionControlledPrivateArtifactRetentionRef,
    toolRoutePolicyRef: input.refs.productionControlledToolRoutePolicyRef,
    toolRouteSchemaRef: input.refs.productionControlledToolRouteSchemaRef,
    toolRouteAdmissionRef: input.refs.productionControlledToolRouteAdmissionRef,
    toolRouteAuthzRef: input.refs.productionControlledToolRouteAuthzRef,
    toolRouteExecutionBlockRef:
      input.refs.productionControlledToolRouteExecutionBlockRef,
    toolRouteAuditRef: input.refs.productionControlledToolRouteAuditRef,
    toolRouteRollbackRef: input.refs.productionControlledToolRouteRollbackRef,
    gpuOnDemandPolicyRef: input.refs.productionControlledGpuOnDemandPolicyRef,
    modelWeightOrCacheManifestRef: gpuRuntimeTargeted
      ? input.refs.productionControlledModelWeightOrCacheManifestRef ?? null
      : null,
    privateArtifactManifestPreparedWithProvidedEvidence: true,
    toolRouteHandoffPreparedWithProvidedEvidence: true,
    gpuRuntimeStartAllowedForAcceptedDryRunWorkerJob: gpuRuntimeTargeted,
    gpuRuntimeShouldStartNow: false,
    privateArtifactWriteApprovedNow: false,
    privateArtifactWritePerformedNow: false,
    routeExecutionApprovedNow: false,
    routeExecutionPerformedNow: false,
    workerDispatchApprovedNow: false,
    workerDispatchPerformedNow: false,
    toolExecutionApprovedNow: false,
    toolExecutionPerformedNow: false,
    providerRuntimePerformedNow: false,
    browserWebglCanvasRuntimePerformedNow: false,
    gpuRuntimePerformedNow: false,
    publicArtifactCreatedNow: false,
    signedUrlCreatedNow: false,
  }
}

function statusFromInput(input: {
  hasSource: boolean
  sourceAccepted: boolean
  controlsAccepted: boolean
  prepared: boolean
}): AiGraphicsProductionControlledPrivateArtifactToolRouteHandoffProofStatus {
  if (!input.hasSource) {
    return 'missing_production_controlled_worker_runtime_smoke_proof'
  }
  if (!input.sourceAccepted) {
    return 'production_controlled_worker_runtime_smoke_proof_rejected'
  }
  if (input.prepared) {
    return 'production_controlled_private_artifact_tool_route_handoff_ready_no_execution'
  }
  return input.controlsAccepted
    ? 'awaiting_production_controlled_private_artifact_tool_route_handoff_controls'
    : 'awaiting_production_controlled_private_artifact_tool_route_handoff_controls'
}

export function acceptedAiGraphicsProductionControlledPrivateArtifactToolRouteHandoffProof(
  packet:
    AiGraphicsProductionControlledPrivateArtifactToolRouteHandoffProof | undefined,
): packet is AiGraphicsProductionControlledPrivateArtifactToolRouteHandoffProof {
  return Boolean(
    packet &&
      packet.decision ===
        AI_GRAPHICS_PRODUCTION_CONTROLLED_PRIVATE_ARTIFACT_TOOL_ROUTE_HANDOFF_PROOF_DECISION &&
      packet.status ===
        'production_controlled_private_artifact_tool_route_handoff_ready_no_execution' &&
      packet.sourceProductionControlledWorkerRuntimeSmokeProofAccepted === true &&
      packet.sourceAiGraphicsToolCallHandoffResultAccepted === true &&
      packet.sourceInMemoryLeaseLifecycleAccepted === true &&
      packet.privateArtifactToolRouteHandoffPreparedWithProvidedEvidence === true &&
      packet.handoffCandidate !== null &&
      packet.privateArtifactWritesNow === 0 &&
      packet.routeExecutionsNow === 0 &&
      packet.liveWorkerDispatchesNow === 0 &&
      packet.liveToolExecutionsNow === 0 &&
      packet.gpuRuntimeShouldStartNow === false &&
      packet.booleans.agentCanExecuteToolsNow === false &&
      packet.booleans.routeExecutionApprovedNow === false &&
      packet.booleans.workerExecutionApprovedNow === false &&
      packet.booleans.toolExecutionApprovedNow === false &&
      packet.booleans.privateArtifactWriteApprovedNow === false &&
      packet.booleans.gpuRuntimeApprovedNow === false &&
      packet.booleans.runtimeReadyNow === false &&
      packet.booleans.externalBetaReadyNow === false &&
      packet.booleans.productionReadyNow === false,
  )
}

export function evaluateAiGraphicsProductionControlledPrivateArtifactToolRouteHandoffProof(
  input: AiGraphicsProductionControlledPrivateArtifactToolRouteHandoffProofInput = {},
): AiGraphicsProductionControlledPrivateArtifactToolRouteHandoffProof {
  const source = input.sourceProductionControlledWorkerRuntimeSmokeProofPacket
  const record = sourceRecord(source)
  const sourceAccepted =
    acceptedAiGraphicsProductionControlledWorkerRuntimeSmokeProof(source)
  const sourceHandoff = sourceHandoffAccepted(source)
  const sourceLeaseLifecycle = sourceLeaseLifecycleAccepted(source)
  const zeroSets = sourceZeroResultSetsAccepted(source)
  const gpuRuntimeTargeted =
    record?.gpuRuntimeStartAllowedForAcceptedDryRunWorkerJob === true
  const missingControls = sourceAccepted
    ? missingHandoffControls(input, gpuRuntimeTargeted)
    : []
  const controlsAccepted = sourceAccepted && missingControls.length === 0
  const candidate = buildCandidate({
    packet: source,
    controlsAccepted,
    sourceAccepted,
    sourceHandoffAccepted: sourceHandoff,
    sourceLeaseLifecycleAccepted: sourceLeaseLifecycle,
    sourceToolRunResultsEmpty: zeroSets.toolRunResultsEmpty,
    sourceArtifactRecordsEmpty: zeroSets.artifactRecordsEmpty,
    sourceQualityGateResultsEmpty: zeroSets.qualityGateResultsEmpty,
    sourceFallbackDecisionsEmpty: zeroSets.fallbackDecisionsEmpty,
    refs: input,
  })
  const prepared = Boolean(candidate)
  const status = statusFromInput({
    hasSource: Boolean(source),
    sourceAccepted,
    controlsAccepted,
    prepared,
  })
  const rejectionReasons = [
    !source ? 'source production controlled worker runtime smoke proof packet is missing' : undefined,
    source && !sourceAccepted
      ? 'source production controlled worker runtime smoke proof packet is not accepted'
      : undefined,
    sourceAccepted && !sourceHandoff
      ? 'source aiGraphicsToolCallHandoffResult was not accepted'
      : undefined,
    sourceAccepted && !sourceLeaseLifecycle
      ? 'source in-memory lease lifecycle was not accepted'
      : undefined,
    sourceAccepted && !zeroSets.toolRunResultsEmpty
      ? 'source toolRunResults are not empty'
      : undefined,
    sourceAccepted && !zeroSets.artifactRecordsEmpty
      ? 'source artifactRecords are not empty'
      : undefined,
    sourceAccepted && !zeroSets.qualityGateResultsEmpty
      ? 'source qualityGateResults are not empty'
      : undefined,
    sourceAccepted && !zeroSets.fallbackDecisionsEmpty
      ? 'source fallbackDecisions are not empty'
      : undefined,
    ...missingControls,
    controlsAccepted && !prepared
      ? 'private artifact Tool Route handoff was not prepared with the required no-execution evidence'
      : undefined,
  ].filter((reason): reason is string => Boolean(reason))

  return {
    decision:
      AI_GRAPHICS_PRODUCTION_CONTROLLED_PRIVATE_ARTIFACT_TOOL_ROUTE_HANDOFF_PROOF_DECISION,
    sourceProductionControlledWorkerRuntimeSmokeProofDecision:
      source?.decision ?? null,
    status,
    capabilityId: record?.capabilityId ?? null,
    requestedToolId: record?.toolId ?? null,
    sourceProductionControlledWorkerRuntimeSmokeProofAccepted: sourceAccepted,
    sourceAiGraphicsToolCallHandoffResultAccepted: sourceHandoff,
    sourceInMemoryLeaseLifecycleAccepted: sourceLeaseLifecycle,
    sourceToolRunResultsEmpty: zeroSets.toolRunResultsEmpty,
    sourceArtifactRecordsEmpty: zeroSets.artifactRecordsEmpty,
    sourceQualityGateResultsEmpty: zeroSets.qualityGateResultsEmpty,
    sourceFallbackDecisionsEmpty: zeroSets.fallbackDecisionsEmpty,
    productionControlledPrivateArtifactToolRouteHandoffControlsAccepted:
      controlsAccepted,
    privateArtifactManifestPreparedWithProvidedEvidence: prepared,
    toolRouteHandoffPreparedWithProvidedEvidence: prepared,
    privateArtifactToolRouteHandoffPreparedWithProvidedEvidence: prepared,
    missingHandoffControls: missingControls,
    rejectionReasons,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    gpuRuntimeTargetedTools: 8,
    productionControlledToolCallReadyNowTools: sourceAccepted ? 21 : 0,
    runtimeReadyForOnDemandProductionToolCallTools: 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    privateArtifactWritesNow: 0,
    routeExecutionsNow: 0,
    liveWorkerDispatchesNow: 0,
    liveToolExecutionsNow: 0,
    gpuRuntimeShouldStartNow: false,
    handoffCandidate: candidate,
    evidence: {
      privateInputManifestRef:
        input.productionControlledPrivateInputManifestRef ?? null,
      privateOutputManifestRef:
        input.productionControlledPrivateOutputManifestRef ?? null,
      privateTelemetryRef:
        input.productionControlledPrivateTelemetryRef ?? null,
      privateLeaseAuditRef:
        input.productionControlledPrivateLeaseAuditRef ?? null,
      privateRouteHandoffRef:
        input.productionControlledPrivateRouteHandoffRef ?? null,
      privateArtifactPolicyRef:
        input.productionControlledPrivateArtifactPolicyRef ?? null,
      privateArtifactRetentionRef:
        input.productionControlledPrivateArtifactRetentionRef ?? null,
      toolRoutePolicyRef: input.productionControlledToolRoutePolicyRef ?? null,
      toolRouteSchemaRef: input.productionControlledToolRouteSchemaRef ?? null,
      toolRouteAdmissionRef:
        input.productionControlledToolRouteAdmissionRef ?? null,
      toolRouteAuthzRef: input.productionControlledToolRouteAuthzRef ?? null,
      toolRouteExecutionBlockRef:
        input.productionControlledToolRouteExecutionBlockRef ?? null,
      toolRouteAuditRef: input.productionControlledToolRouteAuditRef ?? null,
      toolRouteRollbackRef:
        input.productionControlledToolRouteRollbackRef ?? null,
      gpuOnDemandPolicyRef:
        input.productionControlledGpuOnDemandPolicyRef ?? null,
      modelWeightOrCacheManifestRef:
        input.productionControlledModelWeightOrCacheManifestRef ?? null,
      requiredExecutionEnvironment: 'private_non_production_runtime_smoke',
      requiredAdmissionMode: 'private_artifact_tool_route_handoff_proof_only',
      sourceRuntimeSmokeProofRequired: true,
      savedPrivateArtifactManifestRequired: true,
      savedToolRouteHandoffRequired: true,
    },
    policy: {
      validatesSavedRuntimeSmokeProofOnly: true,
      privateArtifactsRequired: true,
      toolRouteHandoffRequired: true,
      noPrivateArtifactWriteByProof: true,
      noToolRouteExecutionByProof: true,
      noWorkerDispatchByProof: true,
      noToolExecutionByProof: true,
      noProviderRuntimeByProof: true,
      noBrowserWebglCanvasRuntimeByProof: true,
      noGpuRuntimeStartByProof: true,
      publicArtifactsRejected: true,
      signedUrlsRejected: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      nextGateRequiresControlledPerToolCallableResultProof: true,
    },
    booleans: {
      productionControlledPrivateArtifactToolRouteHandoffProofPrepared: true,
      sourceProductionControlledWorkerRuntimeSmokeProofAccepted: sourceAccepted,
      sourceAiGraphicsToolCallHandoffResultAccepted: sourceHandoff,
      sourceInMemoryLeaseLifecycleAccepted: sourceLeaseLifecycle,
      sourceToolRunResultsEmpty: zeroSets.toolRunResultsEmpty,
      sourceArtifactRecordsEmpty: zeroSets.artifactRecordsEmpty,
      sourceQualityGateResultsEmpty: zeroSets.qualityGateResultsEmpty,
      sourceFallbackDecisionsEmpty: zeroSets.fallbackDecisionsEmpty,
      productionControlledPrivateArtifactToolRouteHandoffControlsAccepted:
        controlsAccepted,
      privateArtifactManifestPreparedWithProvidedEvidence: prepared,
      toolRouteHandoffPreparedWithProvidedEvidence: prepared,
      privateArtifactToolRouteHandoffPreparedWithProvidedEvidence: prepared,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all8GpuToolsTargetGpuRuntime: true,
      productionControlledToolCallReadyNow: sourceAccepted,
      runtimeReadyForOnDemandProductionToolCall: false,
      privateInputArtifactsRequired: true,
      privateOutputArtifactsRequired: true,
      privateTelemetryRequired: true,
      privateLeaseAuditRequired: true,
      toolRouteHandoffRequired: true,
      publicArtifactRefsRejected: true,
      signedUrlRefsRejected: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForApprovedWorkerOrToolCall: true,
      gpuRuntimeStartAllowedForAcceptedDryRunWorkerJob:
        candidate?.gpuRuntimeStartAllowedForAcceptedDryRunWorkerJob ?? false,
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
      privateArtifactWritePerformed: false,
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
