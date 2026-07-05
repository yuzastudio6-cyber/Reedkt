import {
  AI_GRAPHICS_CANONICAL_TOOL_IDS,
  AI_GRAPHICS_TOOL_CALL_CAPABILITY_IDS,
  listAiGraphicsToolCallReadiness,
  type AiGraphicsCanonicalToolId,
} from './ai-graphics-tool-call-readiness'
import type {
  AiGraphicsExternalBetaWorkerDispatchSmokeProof,
} from './ai-graphics-external-beta-worker-dispatch-smoke-proof'
import type { ProductionRegistryWorkerType, ProductionToolId } from './production-tool-types'

export const AI_GRAPHICS_EXTERNAL_BETA_PRIVATE_ARTIFACT_MANIFEST_DECISION =
  'ai_graphics_external_beta_private_artifact_manifest_prepared_with_runtime_blocks'

export type AiGraphicsExternalBetaPrivateArtifactManifestStatus =
  | 'missing_external_beta_worker_dispatch_smoke_proof'
  | 'external_beta_worker_dispatch_smoke_proof_rejected'
  | 'missing_external_beta_private_artifact_manifest_controls'
  | 'external_beta_private_artifact_manifest_ready_with_runtime_blocks'

export interface AiGraphicsExternalBetaPrivateArtifactManifestInput {
  sourceWorkerDispatchSmokeProofPacket?: AiGraphicsExternalBetaWorkerDispatchSmokeProof
  externalBetaPrivateArtifactPolicyRef?: string
  externalBetaArtifactManifestSchemaRef?: string
  externalBetaStorageNamespaceRef?: string
  externalBetaAccessBoundaryRef?: string
  externalBetaEncryptionPolicyRef?: string
  externalBetaRetentionPolicyRef?: string
  externalBetaArtifactTelemetryRef?: string
}

export interface AiGraphicsExternalBetaPrivateArtifactRecord {
  toolId: AiGraphicsCanonicalToolId
  productionToolId: ProductionToolId
  workerType: ProductionRegistryWorkerType
  runtimeTarget: string
  capabilityIds: string[]
  inputManifestRef: string | null
  outputManifestRef: string | null
  telemetryRef: string | null
  leaseAuditRef: string | null
  modelWeightOrCacheManifestRef: string | null
  gpuRuntimeTargeted: boolean
  privateInputArtifactRequired: true
  privateOutputArtifactRequired: true
  privateTelemetryRequired: true
  privateLeaseAuditRequired: true
  publicArtifactAllowed: false
  signedUrlAllowed: false
  sourceRuntimeQueueServiceProofBridgeAccepted: boolean
  sourceServiceRoleQueueSmokeAuthorizationAccepted: boolean
  refsAcceptedWithProvidedEvidence: boolean
  manifestReadyWithProvidedEvidence: boolean
  toolExecutionApprovedNow: false
  workerDispatchApprovedNow: false
  gpuRuntimeShouldStartNow: false
}

export interface AiGraphicsExternalBetaPrivateArtifactManifest {
  decision: AiGraphicsExternalBetaPrivateArtifactManifestStatus
  sourceDecision: typeof AI_GRAPHICS_EXTERNAL_BETA_PRIVATE_ARTIFACT_MANIFEST_DECISION
  sourceWorkerDispatchSmokeProofAccepted: boolean
  sourceWorkerDispatchSmokeProofBridgeAccepted: boolean
  serviceRoleQueueSmokeAuthorizationRef: string | null
  missingPrivateArtifactControls: string[]
  privateArtifactManifestReadyWithProvidedEvidence: boolean
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  gpuRuntimeTargetedTools: 8
  manifestRecordsPrepared: 21
  manifestRecordsReadyWithProvidedEvidence: number
  sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence: number
  sourceServiceRoleQueueSmokeAuthorizationAcceptedWithProvidedEvidence: number
  externalBetaReadyNowTools: 0
  productionReadyNowTools: 0
  acceptedPrivateRefNamespaces: string[]
  forbiddenArtifactRefPatterns: string[]
  records: AiGraphicsExternalBetaPrivateArtifactRecord[]
  policy: {
    sourceWorkerDispatchSmokeProofRequired: true
    sourceServiceRoleQueueSmokeAuthorizationRequired: true
    privateArtifactManifestSchemaRequired: true
    privateStorageNamespaceRequired: true
    accessBoundaryRequired: true
    encryptionPolicyRequired: true
    retentionPolicyRequired: true
    artifactTelemetryRequired: true
    publicArtifactsRejected: true
    signedUrlsRejected: true
    rawHttpRefsRejected: true
    rawGcsPublicRefsRejected: true
    manifestOnlyNoStorageMutation: true
    nextGateRequiresToolRouteRuntimeProof: true
  }
  booleans: {
    externalBetaPrivateArtifactManifestPrepared: true
    sourceWorkerDispatchSmokeProofAccepted: boolean
    sourceRuntimeQueueServiceProofBridgeAccepted: boolean
    sourceServiceRoleQueueSmokeAuthorizationAccepted: boolean
    privateArtifactManifestControlsAccepted: boolean
    privateArtifactManifestReadyWithProvidedEvidence: boolean
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    all8GpuToolsTargetGpuRuntime: true
    all21PrivateArtifactManifestRecordsPrepared: true
    all21PrivateArtifactManifestRecordsReadyWithProvidedEvidence: boolean
    privateInputArtifactsRequired: true
    privateOutputArtifactsRequired: true
    privateTelemetryRequired: true
    privateLeaseAuditRequired: true
    privateOrBackendArtifactRefsRequired: true
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

const forbiddenArtifactRefPatterns = [
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

function hasValue(value?: string): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isSafePrivateRef(value?: string): boolean {
  if (!hasValue(value)) return false
  const ref = value.trim()
  if (forbiddenArtifactRefPatterns.some((pattern) => ref.startsWith(pattern))) {
    return false
  }
  const acceptedPrefix = acceptedPrivateRefNamespaces.find((prefix) => ref.startsWith(prefix))
  if (!acceptedPrefix) return false
  const suffix = ref.slice(acceptedPrefix.length)
  return suffix.length > 0 && /^[a-z0-9_.:/-]+$/i.test(suffix)
}

function sourceProofAccepted(
  packet?: AiGraphicsExternalBetaWorkerDispatchSmokeProof,
): boolean {
  return Boolean(packet) &&
    packet?.decision === 'external_beta_worker_dispatch_smoke_proof_accepted_with_runtime_blocks' &&
    packet.proofAcceptedWithProvidedEvidence === true &&
    packet.counts.workerDispatchSmokeProofAcceptedToolsWithProvidedEvidence === 21 &&
    packet.counts.sourceSmokeJobsCompletedWithProvidedEvidence === 21 &&
    packet.counts.sourceCapabilityScenariosCompletedWithProvidedEvidence === 12 &&
    packet.counts.sourceInMemoryLeaseRecordsCreated === 21 &&
    packet.counts.sourceInMemoryLeaseRecordsReleased === 21 &&
    packet.counts.sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence === 21 &&
    packet.counts.sourceServiceRoleQueueSmokeAuthorizationAcceptedWithProvidedEvidence === 21 &&
    packet.evidence.sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence === true &&
    packet.evidence.sourceServiceRoleQueueSmokeAuthorizationAcceptedWithProvidedEvidence === true &&
    isSafePrivateRef(packet.evidence.serviceRoleQueueSmokeAuthorizationRef ?? undefined) &&
    packet.counts.sourceLiveWorkerLeasesCreatedNow === 0 &&
    packet.counts.sourceLiveWorkerDispatchesNow === 0 &&
    packet.counts.sourceLiveToolExecutionsNow === 0 &&
    packet.booleans.sourceRuntimeQueueServiceProofBridgeAccepted === true &&
    packet.booleans.agentCanExecuteToolsNow === false &&
    packet.booleans.workerDispatchPerformed === false &&
    packet.booleans.gpuRuntimeShouldStartNow === false
}

function missingPrivateArtifactControls(
  input: AiGraphicsExternalBetaPrivateArtifactManifestInput,
): string[] {
  return [
    !isSafePrivateRef(input.externalBetaPrivateArtifactPolicyRef)
      ? 'external beta private artifact policy ref is missing or not private'
      : undefined,
    !isSafePrivateRef(input.externalBetaArtifactManifestSchemaRef)
      ? 'external beta artifact manifest schema ref is missing or not private'
      : undefined,
    !isSafePrivateRef(input.externalBetaStorageNamespaceRef)
      ? 'external beta storage namespace ref is missing or not private'
      : undefined,
    !isSafePrivateRef(input.externalBetaAccessBoundaryRef)
      ? 'external beta access boundary ref is missing or not private'
      : undefined,
    !isSafePrivateRef(input.externalBetaEncryptionPolicyRef)
      ? 'external beta encryption policy ref is missing or not private'
      : undefined,
    !isSafePrivateRef(input.externalBetaRetentionPolicyRef)
      ? 'external beta retention policy ref is missing or not private'
      : undefined,
    !isSafePrivateRef(input.externalBetaArtifactTelemetryRef)
      ? 'external beta artifact telemetry ref is missing or not private'
      : undefined,
  ].filter((reason): reason is string => Boolean(reason))
}

function normalizeRoot(ref?: string): string | null {
  if (!ref || !isSafePrivateRef(ref)) return null
  return ref.trim().replace(/\/+$/, '')
}

function buildPrivateRef(input: {
  root: string | null
  toolId: AiGraphicsCanonicalToolId
  name: string
}): string | null {
  if (!input.root) return null
  return `${input.root}/${input.toolId}/${input.name}`
}

function statusFromInput(input: {
  hasSourceProof: boolean
  sourceAccepted: boolean
  controlsAccepted: boolean
}): AiGraphicsExternalBetaPrivateArtifactManifestStatus {
  if (!input.hasSourceProof) return 'missing_external_beta_worker_dispatch_smoke_proof'
  if (!input.sourceAccepted) return 'external_beta_worker_dispatch_smoke_proof_rejected'
  return input.controlsAccepted
    ? 'external_beta_private_artifact_manifest_ready_with_runtime_blocks'
    : 'missing_external_beta_private_artifact_manifest_controls'
}

export function buildAiGraphicsExternalBetaPrivateArtifactManifest(
  input: AiGraphicsExternalBetaPrivateArtifactManifestInput = {},
): AiGraphicsExternalBetaPrivateArtifactManifest {
  const sourceAccepted = sourceProofAccepted(input.sourceWorkerDispatchSmokeProofPacket)
  const serviceRoleQueueSmokeAuthorizationRef = sourceAccepted
    ? input.sourceWorkerDispatchSmokeProofPacket?.evidence
      .serviceRoleQueueSmokeAuthorizationRef ?? null
    : null
  const missingControls = sourceAccepted ? missingPrivateArtifactControls(input) : []
  const controlsAccepted = sourceAccepted && missingControls.length === 0
  const storageRoot = normalizeRoot(input.externalBetaStorageNamespaceRef)
  const records = listAiGraphicsToolCallReadiness().map((record): AiGraphicsExternalBetaPrivateArtifactRecord => {
    if (!record.productionToolId) {
      throw new Error(`AI graphics tool ${record.toolId} is missing a productionToolId.`)
    }
    const inputManifestRef = buildPrivateRef({
      root: storageRoot,
      toolId: record.toolId,
      name: 'input-manifest.json',
    })
    const outputManifestRef = buildPrivateRef({
      root: storageRoot,
      toolId: record.toolId,
      name: 'output-manifest.json',
    })
    const telemetryRef = buildPrivateRef({
      root: storageRoot,
      toolId: record.toolId,
      name: 'telemetry.json',
    })
    const leaseAuditRef = buildPrivateRef({
      root: storageRoot,
      toolId: record.toolId,
      name: 'lease-audit.json',
    })
    const modelWeightOrCacheManifestRef = record.gpuRequiredForRuntime
      ? buildPrivateRef({
        root: storageRoot,
        toolId: record.toolId,
        name: 'model-weight-or-cache-manifest.json',
      })
      : null
    const refsAccepted =
      isSafePrivateRef(inputManifestRef ?? undefined) &&
      isSafePrivateRef(outputManifestRef ?? undefined) &&
      isSafePrivateRef(telemetryRef ?? undefined) &&
      isSafePrivateRef(leaseAuditRef ?? undefined) &&
      (!record.gpuRequiredForRuntime ||
        isSafePrivateRef(modelWeightOrCacheManifestRef ?? undefined))

    return {
      toolId: record.toolId,
      productionToolId: record.productionToolId,
      workerType: record.productionWorkerType as ProductionRegistryWorkerType,
      runtimeTarget: record.runtimeTarget,
      capabilityIds: record.capabilities.filter((capability) => (
        capability !== 'planning_metadata_only' &&
        capability !== 'blocked_or_deferred'
      )),
      inputManifestRef,
      outputManifestRef,
      telemetryRef,
      leaseAuditRef,
      modelWeightOrCacheManifestRef,
      gpuRuntimeTargeted: record.gpuRequiredForRuntime,
      privateInputArtifactRequired: true,
      privateOutputArtifactRequired: true,
      privateTelemetryRequired: true,
      privateLeaseAuditRequired: true,
      publicArtifactAllowed: false,
      signedUrlAllowed: false,
      sourceRuntimeQueueServiceProofBridgeAccepted: sourceAccepted,
      sourceServiceRoleQueueSmokeAuthorizationAccepted: sourceAccepted,
      refsAcceptedWithProvidedEvidence: controlsAccepted && refsAccepted,
      manifestReadyWithProvidedEvidence: controlsAccepted && refsAccepted && sourceAccepted,
      toolExecutionApprovedNow: false,
      workerDispatchApprovedNow: false,
      gpuRuntimeShouldStartNow: false,
    }
  })
  const readyRecords = records.filter((record) => record.manifestReadyWithProvidedEvidence)
  const sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence =
    records.filter((record) => record.sourceRuntimeQueueServiceProofBridgeAccepted).length
  const sourceServiceRoleQueueSmokeAuthorizationAcceptedWithProvidedEvidence =
    records.filter((record) => (
      record.sourceServiceRoleQueueSmokeAuthorizationAccepted
    )).length
  const manifestReadyWithProvidedEvidence =
    controlsAccepted &&
    readyRecords.length === AI_GRAPHICS_CANONICAL_TOOL_IDS.length &&
    sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence === 21 &&
    sourceServiceRoleQueueSmokeAuthorizationAcceptedWithProvidedEvidence === 21

  return {
    decision: statusFromInput({
      hasSourceProof: Boolean(input.sourceWorkerDispatchSmokeProofPacket),
      sourceAccepted,
      controlsAccepted,
    }),
    sourceDecision: AI_GRAPHICS_EXTERNAL_BETA_PRIVATE_ARTIFACT_MANIFEST_DECISION,
    sourceWorkerDispatchSmokeProofAccepted: sourceAccepted,
    sourceWorkerDispatchSmokeProofBridgeAccepted: sourceAccepted,
    serviceRoleQueueSmokeAuthorizationRef,
    missingPrivateArtifactControls: missingControls,
    privateArtifactManifestReadyWithProvidedEvidence: manifestReadyWithProvidedEvidence,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: productCapabilityCount(),
    gpuRuntimeTargetedTools: records.filter((record) => record.gpuRuntimeTargeted).length as 8,
    manifestRecordsPrepared: records.length as 21,
    manifestRecordsReadyWithProvidedEvidence: readyRecords.length,
    sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence,
    sourceServiceRoleQueueSmokeAuthorizationAcceptedWithProvidedEvidence,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    acceptedPrivateRefNamespaces,
    forbiddenArtifactRefPatterns,
    records,
    policy: {
      sourceWorkerDispatchSmokeProofRequired: true,
      sourceServiceRoleQueueSmokeAuthorizationRequired: true,
      privateArtifactManifestSchemaRequired: true,
      privateStorageNamespaceRequired: true,
      accessBoundaryRequired: true,
      encryptionPolicyRequired: true,
      retentionPolicyRequired: true,
      artifactTelemetryRequired: true,
      publicArtifactsRejected: true,
      signedUrlsRejected: true,
      rawHttpRefsRejected: true,
      rawGcsPublicRefsRejected: true,
      manifestOnlyNoStorageMutation: true,
      nextGateRequiresToolRouteRuntimeProof: true,
    },
    booleans: {
      externalBetaPrivateArtifactManifestPrepared: true,
      sourceWorkerDispatchSmokeProofAccepted: sourceAccepted,
      sourceRuntimeQueueServiceProofBridgeAccepted: sourceAccepted,
      sourceServiceRoleQueueSmokeAuthorizationAccepted: sourceAccepted,
      privateArtifactManifestControlsAccepted: controlsAccepted,
      privateArtifactManifestReadyWithProvidedEvidence: manifestReadyWithProvidedEvidence,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all8GpuToolsTargetGpuRuntime: true,
      all21PrivateArtifactManifestRecordsPrepared: true,
      all21PrivateArtifactManifestRecordsReadyWithProvidedEvidence:
        readyRecords.length === 21,
      privateInputArtifactsRequired: true,
      privateOutputArtifactsRequired: true,
      privateTelemetryRequired: true,
      privateLeaseAuditRequired: true,
      privateOrBackendArtifactRefsRequired: true,
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
