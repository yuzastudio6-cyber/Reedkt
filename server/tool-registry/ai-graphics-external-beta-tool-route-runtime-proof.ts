import {
  AI_GRAPHICS_CANONICAL_TOOL_IDS,
  AI_GRAPHICS_TOOL_CALL_CAPABILITY_IDS,
  listAiGraphicsToolCallReadiness,
  type AiGraphicsCanonicalToolId,
} from './ai-graphics-tool-call-readiness'
import type {
  AiGraphicsExternalBetaPrivateArtifactManifest,
  AiGraphicsExternalBetaPrivateArtifactRecord,
} from './ai-graphics-external-beta-private-artifact-manifest'
import type { ProductionRegistryWorkerType, ProductionToolId } from './production-tool-types'

export const AI_GRAPHICS_EXTERNAL_BETA_TOOL_ROUTE_RUNTIME_PROOF_DECISION =
  'ai_graphics_external_beta_tool_route_runtime_proof_prepared_with_runtime_blocks'

export type AiGraphicsExternalBetaToolRouteRuntimeProofStatus =
  | 'missing_external_beta_private_artifact_manifest'
  | 'external_beta_private_artifact_manifest_rejected'
  | 'missing_external_beta_tool_route_runtime_proof_controls'
  | 'external_beta_tool_route_runtime_proof_ready_with_runtime_blocks'

export interface AiGraphicsExternalBetaToolRouteRuntimeProofInput {
  sourcePrivateArtifactManifestPacket?: AiGraphicsExternalBetaPrivateArtifactManifest
  externalBetaToolRoutePolicyRef?: string
  externalBetaToolRouteSchemaRef?: string
  externalBetaToolRouteAdmissionRef?: string
  externalBetaToolRouteAuthzRef?: string
  externalBetaToolRouteRateLimitRef?: string
  externalBetaToolRouteAuditRef?: string
  externalBetaToolRouteRollbackRef?: string
}

export interface AiGraphicsExternalBetaToolRouteRuntimeProofRecord {
  toolId: AiGraphicsCanonicalToolId
  productionToolId: ProductionToolId
  workerType: ProductionRegistryWorkerType
  runtimeTarget: string
  capabilityIds: string[]
  routeId: string
  routeMode: 'runtime_proof_only'
  privateArtifactManifestAccepted: boolean
  privateInputManifestRef: string | null
  privateOutputManifestRef: string | null
  privateTelemetryRef: string | null
  privateLeaseAuditRef: string | null
  modelWeightOrCacheManifestRef: string | null
  gpuRuntimeTargeted: boolean
  sourceRuntimeQueueServiceProofBridgeAccepted: boolean
  sourceServiceRoleQueueSmokeAuthorizationAccepted: boolean
  toolRoutePolicyRef: string | null
  toolRouteSchemaRef: string | null
  toolRouteAdmissionRef: string | null
  toolRouteAuthzRef: string | null
  toolRouteRateLimitRef: string | null
  toolRouteAuditRef: string | null
  toolRouteRollbackRef: string | null
  toolRouteRuntimeProofReadyWithProvidedEvidence: boolean
  routeExecutionApprovedNow: false
  workerDispatchApprovedNow: false
  toolExecutionApprovedNow: false
  providerRuntimeApprovedNow: false
  gpuRuntimeShouldStartNow: false
  publicArtifactAllowed: false
  signedUrlAllowed: false
}

export interface AiGraphicsExternalBetaToolRouteRuntimeProof {
  decision: AiGraphicsExternalBetaToolRouteRuntimeProofStatus
  sourceDecision: typeof AI_GRAPHICS_EXTERNAL_BETA_TOOL_ROUTE_RUNTIME_PROOF_DECISION
  sourcePrivateArtifactManifestAccepted: boolean
  sourcePrivateArtifactManifestProofBridgeAccepted: boolean
  serviceRoleQueueSmokeAuthorizationRef: string | null
  missingToolRouteRuntimeProofControls: string[]
  toolRouteRuntimeProofReadyWithProvidedEvidence: boolean
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  gpuRuntimeTargetedTools: 8
  toolRouteRecordsPrepared: 21
  toolRouteRecordsReadyWithProvidedEvidence: number
  sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence: number
  sourceServiceRoleQueueSmokeAuthorizationAcceptedWithProvidedEvidence: number
  externalBetaReadyNowTools: 0
  productionReadyNowTools: 0
  acceptedPrivateRefNamespaces: string[]
  forbiddenRouteRefPatterns: string[]
  records: AiGraphicsExternalBetaToolRouteRuntimeProofRecord[]
  policy: {
    sourcePrivateArtifactManifestRequired: true
    sourceServiceRoleQueueSmokeAuthorizationRequired: true
    toolRoutePolicyRequired: true
    toolRouteSchemaRequired: true
    toolRouteAdmissionRequired: true
    toolRouteAuthzRequired: true
    toolRouteRateLimitRequired: true
    toolRouteAuditRequired: true
    toolRouteRollbackRequired: true
    runtimeProofOnlyNoRouteExecution: true
    routeRecordsOnlyNoWorkerDispatch: true
    publicArtifactsRejected: true
    signedUrlsRejected: true
    rawHttpRefsRejected: true
    rawGcsPublicRefsRejected: true
    nextGateRequiresPerToolRuntimeExecutionProof: true
  }
  booleans: {
    externalBetaToolRouteRuntimeProofPrepared: true
    sourcePrivateArtifactManifestAccepted: boolean
    sourceRuntimeQueueServiceProofBridgeAccepted: boolean
    sourceServiceRoleQueueSmokeAuthorizationAccepted: boolean
    toolRouteRuntimeProofControlsAccepted: boolean
    toolRouteRuntimeProofReadyWithProvidedEvidence: boolean
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    all8GpuToolsTargetGpuRuntime: true
    all21ToolRouteRecordsPrepared: true
    all21ToolRouteRecordsReadyWithProvidedEvidence: boolean
    privateArtifactManifestAccepted: boolean
    privateInputArtifactsRequired: true
    privateOutputArtifactsRequired: true
    privateTelemetryRequired: true
    privateLeaseAuditRequired: true
    toolRoutePolicyRequired: true
    toolRouteSchemaRequired: true
    toolRouteAdmissionRequired: true
    toolRouteAuthzRequired: true
    toolRouteRateLimitRequired: true
    toolRouteAuditRequired: true
    toolRouteRollbackRequired: true
    publicArtifactRefsRejected: true
    signedUrlRefsRejected: true
    rawHttpRefsRejected: true
    rawGcsPublicRefsRejected: true
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    gpuStartsOnlyForApprovedWorkerOrToolCall: true
    agentCanSelectForPlanning: true
    agentCanExecuteToolsNow: false
    routeExecutionApprovedNow: false
    workerExecutionApprovedNow: false
    workerQueueApprovedNow: false
    backendQueueSubmissionApprovedNow: false
    liveQueueWriteApprovedNow: false
    workerLeaseCreationApprovedNow: false
    workerDispatchApprovedNow: false
    productionWorkerDispatchApprovedNow: false
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
    routeExecutionPerformed: false
    backendQueueSubmissionPerformed: false
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
  'backend-evidence://',
  'external-beta-evidence://',
]

const forbiddenRouteRefPatterns = [
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

function hasValue(value?: string): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

function isSafePrivateRef(value?: string | null): boolean {
  if (!hasValue(value ?? undefined)) return false
  const ref = String(value).trim()
  if (forbiddenRouteRefPatterns.some((pattern) => ref.startsWith(pattern))) return false
  const acceptedPrefix = acceptedPrivateRefNamespaces.find((prefix) => ref.startsWith(prefix))
  if (!acceptedPrefix) return false
  const suffix = ref.slice(acceptedPrefix.length)
  return suffix.length > 0 && /^[a-z0-9_.:/-]+$/i.test(suffix)
}

function sourceManifestAccepted(
  packet?: AiGraphicsExternalBetaPrivateArtifactManifest,
): boolean {
  return Boolean(packet) &&
    packet?.decision === 'external_beta_private_artifact_manifest_ready_with_runtime_blocks' &&
    packet.sourceWorkerDispatchSmokeProofAccepted === true &&
    packet.privateArtifactManifestReadyWithProvidedEvidence === true &&
    packet.manifestRecordsPrepared === 21 &&
    packet.manifestRecordsReadyWithProvidedEvidence === 21 &&
    packet.sourceWorkerDispatchSmokeProofBridgeAccepted === true &&
    packet.sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence === 21 &&
    packet.sourceServiceRoleQueueSmokeAuthorizationAcceptedWithProvidedEvidence === 21 &&
    isSafePrivateRef(packet.serviceRoleQueueSmokeAuthorizationRef) &&
    packet.records.length === 21 &&
    packet.records.every((record) => (
      record.sourceRuntimeQueueServiceProofBridgeAccepted === true &&
      record.sourceServiceRoleQueueSmokeAuthorizationAccepted === true
    )) &&
    packet.gpuRuntimeTargetedTools === 8 &&
    packet.externalBetaReadyNowTools === 0 &&
    packet.productionReadyNowTools === 0 &&
    packet.booleans.sourceRuntimeQueueServiceProofBridgeAccepted === true &&
    packet.booleans.sourceServiceRoleQueueSmokeAuthorizationAccepted === true &&
    packet.booleans.agentCanExecuteToolsNow === false &&
    packet.booleans.routeExecutionApprovedNow === false &&
    packet.booleans.workerDispatchApprovedNow === false &&
    packet.booleans.gpuRuntimeShouldStartNow === false &&
    packet.booleans.publicArtifactCreated === false &&
    packet.booleans.signedUrlCreated === false
}

function missingToolRouteRuntimeProofControls(
  input: AiGraphicsExternalBetaToolRouteRuntimeProofInput,
): string[] {
  return [
    !isSafePrivateRef(input.externalBetaToolRoutePolicyRef)
      ? 'external beta Tool Route policy ref is missing or not private'
      : undefined,
    !isSafePrivateRef(input.externalBetaToolRouteSchemaRef)
      ? 'external beta Tool Route schema ref is missing or not private'
      : undefined,
    !isSafePrivateRef(input.externalBetaToolRouteAdmissionRef)
      ? 'external beta Tool Route admission ref is missing or not private'
      : undefined,
    !isSafePrivateRef(input.externalBetaToolRouteAuthzRef)
      ? 'external beta Tool Route authorization ref is missing or not private'
      : undefined,
    !isSafePrivateRef(input.externalBetaToolRouteRateLimitRef)
      ? 'external beta Tool Route rate-limit ref is missing or not private'
      : undefined,
    !isSafePrivateRef(input.externalBetaToolRouteAuditRef)
      ? 'external beta Tool Route audit ref is missing or not private'
      : undefined,
    !isSafePrivateRef(input.externalBetaToolRouteRollbackRef)
      ? 'external beta Tool Route rollback ref is missing or not private'
      : undefined,
  ].filter((reason): reason is string => Boolean(reason))
}

function statusFromInput(input: {
  hasSourceManifest: boolean
  sourceAccepted: boolean
  controlsAccepted: boolean
}): AiGraphicsExternalBetaToolRouteRuntimeProofStatus {
  if (!input.hasSourceManifest) return 'missing_external_beta_private_artifact_manifest'
  if (!input.sourceAccepted) return 'external_beta_private_artifact_manifest_rejected'
  return input.controlsAccepted
    ? 'external_beta_tool_route_runtime_proof_ready_with_runtime_blocks'
    : 'missing_external_beta_tool_route_runtime_proof_controls'
}

function sourceManifestRecord(
  packet: AiGraphicsExternalBetaPrivateArtifactManifest | undefined,
  toolId: AiGraphicsCanonicalToolId,
): AiGraphicsExternalBetaPrivateArtifactRecord | undefined {
  return packet?.records.find((record) => record.toolId === toolId)
}

export function buildAiGraphicsExternalBetaToolRouteRuntimeProof(
  input: AiGraphicsExternalBetaToolRouteRuntimeProofInput = {},
): AiGraphicsExternalBetaToolRouteRuntimeProof {
  const sourceAccepted = sourceManifestAccepted(input.sourcePrivateArtifactManifestPacket)
  const serviceRoleQueueSmokeAuthorizationRef = sourceAccepted
    ? input.sourcePrivateArtifactManifestPacket?.serviceRoleQueueSmokeAuthorizationRef ?? null
    : null
  const missingControls = sourceAccepted ? missingToolRouteRuntimeProofControls(input) : []
  const controlsAccepted = sourceAccepted && missingControls.length === 0

  const records = listAiGraphicsToolCallReadiness().map((record): AiGraphicsExternalBetaToolRouteRuntimeProofRecord => {
    if (!record.productionToolId) {
      throw new Error(`AI graphics tool ${record.toolId} is missing a productionToolId.`)
    }
    const manifestRecord = sourceManifestRecord(input.sourcePrivateArtifactManifestPacket, record.toolId)
    const manifestAccepted =
      sourceAccepted &&
      manifestRecord?.manifestReadyWithProvidedEvidence === true &&
      manifestRecord.publicArtifactAllowed === false &&
      manifestRecord.signedUrlAllowed === false &&
      isSafePrivateRef(manifestRecord.inputManifestRef) &&
      isSafePrivateRef(manifestRecord.outputManifestRef) &&
      isSafePrivateRef(manifestRecord.telemetryRef) &&
      isSafePrivateRef(manifestRecord.leaseAuditRef) &&
      (!record.gpuRequiredForRuntime || isSafePrivateRef(manifestRecord.modelWeightOrCacheManifestRef))
    const proofBridgeAccepted =
      sourceAccepted &&
      manifestRecord?.sourceRuntimeQueueServiceProofBridgeAccepted === true
    const sourceAuthorizationAccepted =
      sourceAccepted &&
      manifestRecord?.sourceServiceRoleQueueSmokeAuthorizationAccepted === true

    return {
      toolId: record.toolId,
      productionToolId: record.productionToolId,
      workerType: record.productionWorkerType === 'none'
        ? 'planning_only'
        : record.productionWorkerType,
      runtimeTarget: record.runtimeTarget,
      capabilityIds: record.capabilities.filter((capability) => (
        capability !== 'planning_metadata_only' &&
        capability !== 'blocked_or_deferred'
      )),
      routeId: `ai_graphics_external_beta_tool_route_${record.toolId}`,
      routeMode: 'runtime_proof_only',
      privateArtifactManifestAccepted: manifestAccepted,
      privateInputManifestRef: manifestRecord?.inputManifestRef ?? null,
      privateOutputManifestRef: manifestRecord?.outputManifestRef ?? null,
      privateTelemetryRef: manifestRecord?.telemetryRef ?? null,
      privateLeaseAuditRef: manifestRecord?.leaseAuditRef ?? null,
      modelWeightOrCacheManifestRef: manifestRecord?.modelWeightOrCacheManifestRef ?? null,
      gpuRuntimeTargeted: record.gpuRequiredForRuntime,
      sourceRuntimeQueueServiceProofBridgeAccepted: proofBridgeAccepted,
      sourceServiceRoleQueueSmokeAuthorizationAccepted: sourceAuthorizationAccepted,
      toolRoutePolicyRef: controlsAccepted ? input.externalBetaToolRoutePolicyRef?.trim() ?? null : null,
      toolRouteSchemaRef: controlsAccepted ? input.externalBetaToolRouteSchemaRef?.trim() ?? null : null,
      toolRouteAdmissionRef: controlsAccepted ? input.externalBetaToolRouteAdmissionRef?.trim() ?? null : null,
      toolRouteAuthzRef: controlsAccepted ? input.externalBetaToolRouteAuthzRef?.trim() ?? null : null,
      toolRouteRateLimitRef: controlsAccepted ? input.externalBetaToolRouteRateLimitRef?.trim() ?? null : null,
      toolRouteAuditRef: controlsAccepted ? input.externalBetaToolRouteAuditRef?.trim() ?? null : null,
      toolRouteRollbackRef: controlsAccepted ? input.externalBetaToolRouteRollbackRef?.trim() ?? null : null,
      toolRouteRuntimeProofReadyWithProvidedEvidence:
        controlsAccepted && manifestAccepted && proofBridgeAccepted && sourceAuthorizationAccepted,
      routeExecutionApprovedNow: false,
      workerDispatchApprovedNow: false,
      toolExecutionApprovedNow: false,
      providerRuntimeApprovedNow: false,
      gpuRuntimeShouldStartNow: false,
      publicArtifactAllowed: false,
      signedUrlAllowed: false,
    }
  })

  const readyRecords = records.filter((record) => (
    record.toolRouteRuntimeProofReadyWithProvidedEvidence
  ))
  const sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence =
    records.filter((record) => record.sourceRuntimeQueueServiceProofBridgeAccepted).length
  const sourceServiceRoleQueueSmokeAuthorizationAcceptedWithProvidedEvidence =
    records.filter((record) => (
      record.sourceServiceRoleQueueSmokeAuthorizationAccepted
    )).length
  const readyWithProvidedEvidence =
    controlsAccepted &&
    readyRecords.length === AI_GRAPHICS_CANONICAL_TOOL_IDS.length &&
    sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence === 21 &&
    sourceServiceRoleQueueSmokeAuthorizationAcceptedWithProvidedEvidence === 21

  return {
    decision: statusFromInput({
      hasSourceManifest: Boolean(input.sourcePrivateArtifactManifestPacket),
      sourceAccepted,
      controlsAccepted,
    }),
    sourceDecision: AI_GRAPHICS_EXTERNAL_BETA_TOOL_ROUTE_RUNTIME_PROOF_DECISION,
    sourcePrivateArtifactManifestAccepted: sourceAccepted,
    sourcePrivateArtifactManifestProofBridgeAccepted: sourceAccepted,
    serviceRoleQueueSmokeAuthorizationRef,
    missingToolRouteRuntimeProofControls: missingControls,
    toolRouteRuntimeProofReadyWithProvidedEvidence: readyWithProvidedEvidence,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: productCapabilityCount(),
    gpuRuntimeTargetedTools: records.filter((record) => record.gpuRuntimeTargeted).length as 8,
    toolRouteRecordsPrepared: records.length as 21,
    toolRouteRecordsReadyWithProvidedEvidence: readyRecords.length,
    sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence,
    sourceServiceRoleQueueSmokeAuthorizationAcceptedWithProvidedEvidence,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    acceptedPrivateRefNamespaces,
    forbiddenRouteRefPatterns,
    records,
    policy: {
      sourcePrivateArtifactManifestRequired: true,
      sourceServiceRoleQueueSmokeAuthorizationRequired: true,
      toolRoutePolicyRequired: true,
      toolRouteSchemaRequired: true,
      toolRouteAdmissionRequired: true,
      toolRouteAuthzRequired: true,
      toolRouteRateLimitRequired: true,
      toolRouteAuditRequired: true,
      toolRouteRollbackRequired: true,
      runtimeProofOnlyNoRouteExecution: true,
      routeRecordsOnlyNoWorkerDispatch: true,
      publicArtifactsRejected: true,
      signedUrlsRejected: true,
      rawHttpRefsRejected: true,
      rawGcsPublicRefsRejected: true,
      nextGateRequiresPerToolRuntimeExecutionProof: true,
    },
    booleans: {
      externalBetaToolRouteRuntimeProofPrepared: true,
      sourcePrivateArtifactManifestAccepted: sourceAccepted,
      sourceRuntimeQueueServiceProofBridgeAccepted: sourceAccepted,
      sourceServiceRoleQueueSmokeAuthorizationAccepted: sourceAccepted,
      toolRouteRuntimeProofControlsAccepted: controlsAccepted,
      toolRouteRuntimeProofReadyWithProvidedEvidence: readyWithProvidedEvidence,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all8GpuToolsTargetGpuRuntime: true,
      all21ToolRouteRecordsPrepared: true,
      all21ToolRouteRecordsReadyWithProvidedEvidence: readyRecords.length === 21,
      privateArtifactManifestAccepted: sourceAccepted,
      privateInputArtifactsRequired: true,
      privateOutputArtifactsRequired: true,
      privateTelemetryRequired: true,
      privateLeaseAuditRequired: true,
      toolRoutePolicyRequired: true,
      toolRouteSchemaRequired: true,
      toolRouteAdmissionRequired: true,
      toolRouteAuthzRequired: true,
      toolRouteRateLimitRequired: true,
      toolRouteAuditRequired: true,
      toolRouteRollbackRequired: true,
      publicArtifactRefsRejected: true,
      signedUrlRefsRejected: true,
      rawHttpRefsRejected: true,
      rawGcsPublicRefsRejected: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForApprovedWorkerOrToolCall: true,
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: false,
      routeExecutionApprovedNow: false,
      workerExecutionApprovedNow: false,
      workerQueueApprovedNow: false,
      backendQueueSubmissionApprovedNow: false,
      liveQueueWriteApprovedNow: false,
      workerLeaseCreationApprovedNow: false,
      workerDispatchApprovedNow: false,
      productionWorkerDispatchApprovedNow: false,
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
      routeExecutionPerformed: false,
      backendQueueSubmissionPerformed: false,
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
