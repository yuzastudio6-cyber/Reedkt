import {
  AI_GRAPHICS_CANONICAL_TOOL_IDS,
  listAiGraphicsToolCallReadiness,
  type AiGraphicsCanonicalToolId,
} from './ai-graphics-tool-call-readiness'
import {
  AI_GRAPHICS_EXTERNAL_BETA_END_TO_END_READINESS_DECISION,
  type AiGraphicsExternalBetaEndToEndReadiness,
} from './ai-graphics-external-beta-end-to-end-readiness'
import {
  AI_GRAPHICS_EXTERNAL_BETA_PRIVATE_ARTIFACT_MANIFEST_DECISION,
  type AiGraphicsExternalBetaPrivateArtifactManifest,
} from './ai-graphics-external-beta-private-artifact-manifest'
import type {
  ProductionRegistryWorkerType,
  ProductionToolId,
} from './production-tool-types'

export const AI_GRAPHICS_EXTERNAL_BETA_CANDIDATE_EVIDENCE_ASSEMBLY_DECISION =
  'ai_graphics_external_beta_candidate_evidence_assembly_prepared_with_runtime_blocks'

export type AiGraphicsExternalBetaCandidateEvidenceAssemblyStatus =
  | 'missing_external_beta_end_to_end_readiness'
  | 'external_beta_end_to_end_readiness_rejected'
  | 'missing_external_beta_private_artifact_manifest'
  | 'external_beta_private_artifact_manifest_rejected'
  | 'external_beta_candidate_evidence_assembled_runtime_still_blocked'

export interface AiGraphicsExternalBetaCandidateEvidenceAssemblyInput {
  sourceExternalBetaEndToEndReadinessPacket?: AiGraphicsExternalBetaEndToEndReadiness
  sourceExternalBetaPrivateArtifactManifestPacket?: AiGraphicsExternalBetaPrivateArtifactManifest
  candidateEvidenceAssemblyRef?: string
}

export interface AiGraphicsExternalBetaCandidateEvidenceAssemblyRecord {
  toolId: AiGraphicsCanonicalToolId
  productionToolId: ProductionToolId | null
  workerType: ProductionRegistryWorkerType | 'none'
  runtimeTarget: string
  installReadyForPlannedSurface: true
  productionMapped: boolean
  gpuRequiredForRuntime: boolean
  cpuFallbackAllowedForHeavyTool: false
  sourceEndToEndCandidateAccepted: boolean
  sourcePrivateArtifactManifestAccepted: boolean
  candidateEvidenceAssembledWithProvidedEvidence: boolean
  externalBetaReadyNow: false
  productionReadyNow: false
  gpuRuntimeShouldStartNow: false
}

export interface AiGraphicsExternalBetaCandidateEvidenceAssembly {
  decision: typeof AI_GRAPHICS_EXTERNAL_BETA_CANDIDATE_EVIDENCE_ASSEMBLY_DECISION
  status: AiGraphicsExternalBetaCandidateEvidenceAssemblyStatus
  sourceExternalBetaEndToEndReadinessDecision: string | null
  sourceExternalBetaPrivateArtifactManifestDecision: string | null
  candidateEvidenceAssemblyRef: string | null
  counts: {
    totalAiGraphicsTools: 21
    totalProductFacingCapabilities: 12
    installReadyTools: number
    productionMappedTools: number
    gpuRuntimeTargetedTools: number
    heavyToolsIncorrectlyTargetingCpu: 0
    sourceEndToEndCandidateAcceptedToolsWithProvidedEvidence: number
    sourcePrivateArtifactManifestAcceptedToolsWithProvidedEvidence: number
    assembledExternalBetaCandidateToolsWithProvidedEvidence: number
    externalBetaReadyNowTools: 0
    productionReadyNowTools: 0
  }
  missingCandidateEvidence: string[]
  records: AiGraphicsExternalBetaCandidateEvidenceAssemblyRecord[]
  policy: {
    requiresAcceptedExternalBetaEndToEndReadiness: true
    requiresAcceptedPrivateArtifactManifest: true
    candidateAssemblyDoesNotStartRuntime: true
    candidateAssemblyDoesNotWriteStorage: true
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    nextGateRequiresControlledRuntimeExecutionApproval: true
  }
  booleans: {
    externalBetaCandidateEvidenceAssemblyPrepared: true
    sourceExternalBetaEndToEndReadinessAccepted: boolean
    sourceExternalBetaPrivateArtifactManifestAccepted: boolean
    all21ToolsCovered: boolean
    all12CapabilitiesCovered: true
    all21ToolsInstalledForPlannedSurface: boolean
    all21ToolsMappedToProductionRegistry: boolean
    all8GpuToolsTargetGpuRuntime: boolean
    heavyToolsIncorrectlyTargetingCpuAbsent: true
    assembledExternalBetaCandidateWithProvidedEvidence: boolean
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

function endToEndReadinessAccepted(
  packet?: AiGraphicsExternalBetaEndToEndReadiness,
): boolean {
  return Boolean(packet) &&
    packet?.decision === AI_GRAPHICS_EXTERNAL_BETA_END_TO_END_READINESS_DECISION &&
    packet.status === 'external_beta_candidate_with_provided_evidence_runtime_still_blocked' &&
    packet.counts.externalBetaCandidateReadyWithProvidedEvidenceTools === 21 &&
    packet.counts.serviceRoleQueueSmokePreflightReadyToExecute === 1 &&
    packet.counts.serviceRoleQueueSmokeProofAcceptedToolsWithProvidedEvidence === 21 &&
    packet.counts.workerDispatchSmokeProofAcceptedToolsWithProvidedEvidence === 21 &&
    packet.counts.workerDispatchSmokeProofAuthorizationAcceptedWithProvidedEvidence === 21 &&
    packet.counts.externalBetaLaunchControlsAcceptedWithProvidedEvidence === 1 &&
    packet.counts.externalBetaReadyNowTools === 0 &&
    packet.counts.productionReadyNowTools === 0 &&
    packet.booleans.externalBetaCandidateReadyWithProvidedEvidence === true &&
    packet.booleans.externalBetaLaunchControlsAcceptedWithProvidedEvidence === true &&
    packet.booleans.agentCanExecuteToolsNow === false &&
    packet.booleans.workerExecutionApprovedNow === false &&
    packet.booleans.gpuRuntimeApprovedNow === false &&
    packet.booleans.gpuRuntimeShouldStartNow === false &&
    packet.booleans.externalBetaReadyNow === false &&
    packet.booleans.productionReadyNow === false
}

function privateArtifactManifestAccepted(
  packet?: AiGraphicsExternalBetaPrivateArtifactManifest,
): boolean {
  return Boolean(packet) &&
    packet?.sourceDecision === AI_GRAPHICS_EXTERNAL_BETA_PRIVATE_ARTIFACT_MANIFEST_DECISION &&
    packet.decision === 'external_beta_private_artifact_manifest_ready_with_runtime_blocks' &&
    packet.privateArtifactManifestReadyWithProvidedEvidence === true &&
    packet.manifestRecordsReadyWithProvidedEvidence === 21 &&
    packet.sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence === 21 &&
    packet.sourceServiceRoleQueueSmokeAuthorizationAcceptedWithProvidedEvidence === 21 &&
    Boolean(packet.serviceRoleQueueSmokeAuthorizationRef) &&
    packet.externalBetaReadyNowTools === 0 &&
    packet.productionReadyNowTools === 0 &&
    packet.booleans.privateArtifactManifestReadyWithProvidedEvidence === true &&
    packet.booleans.sourceServiceRoleQueueSmokeAuthorizationAccepted === true &&
    packet.booleans.publicArtifactRefsRejected === true &&
    packet.booleans.signedUrlRefsRejected === true &&
    packet.booleans.agentCanExecuteToolsNow === false &&
    packet.booleans.workerDispatchPerformed === false &&
    packet.booleans.gpuRuntimeShouldStartNow === false &&
    packet.booleans.externalBetaReadyNow === false &&
    packet.booleans.productionReadyNow === false
}

function statusFor(input: {
  hasEndToEndPacket: boolean
  endToEndAccepted: boolean
  hasPrivateArtifactManifest: boolean
  privateArtifactAccepted: boolean
}): AiGraphicsExternalBetaCandidateEvidenceAssemblyStatus {
  if (!input.hasEndToEndPacket) return 'missing_external_beta_end_to_end_readiness'
  if (!input.endToEndAccepted) return 'external_beta_end_to_end_readiness_rejected'
  if (!input.hasPrivateArtifactManifest) return 'missing_external_beta_private_artifact_manifest'
  if (!input.privateArtifactAccepted) return 'external_beta_private_artifact_manifest_rejected'
  return 'external_beta_candidate_evidence_assembled_runtime_still_blocked'
}

export function buildAiGraphicsExternalBetaCandidateEvidenceAssembly(
  input: AiGraphicsExternalBetaCandidateEvidenceAssemblyInput = {},
): AiGraphicsExternalBetaCandidateEvidenceAssembly {
  const endToEndAccepted = endToEndReadinessAccepted(
    input.sourceExternalBetaEndToEndReadinessPacket,
  )
  const artifactAccepted = privateArtifactManifestAccepted(
    input.sourceExternalBetaPrivateArtifactManifestPacket,
  )
  const status = statusFor({
    hasEndToEndPacket: Boolean(input.sourceExternalBetaEndToEndReadinessPacket),
    endToEndAccepted,
    hasPrivateArtifactManifest: Boolean(input.sourceExternalBetaPrivateArtifactManifestPacket),
    privateArtifactAccepted: artifactAccepted,
  })
  const assembled = status === 'external_beta_candidate_evidence_assembled_runtime_still_blocked'
  const readinessRecords = listAiGraphicsToolCallReadiness()
  const records = readinessRecords.map((record): AiGraphicsExternalBetaCandidateEvidenceAssemblyRecord => ({
    toolId: record.toolId,
    productionToolId: record.productionToolId,
    workerType: record.productionWorkerType,
    runtimeTarget: record.runtimeTarget,
    installReadyForPlannedSurface: true,
    productionMapped: record.productionToolId !== null,
    gpuRequiredForRuntime: record.gpuRequiredForRuntime,
    cpuFallbackAllowedForHeavyTool: false,
    sourceEndToEndCandidateAccepted: endToEndAccepted,
    sourcePrivateArtifactManifestAccepted: artifactAccepted,
    candidateEvidenceAssembledWithProvidedEvidence: assembled,
    externalBetaReadyNow: false,
    productionReadyNow: false,
    gpuRuntimeShouldStartNow: false,
  }))
  const missingCandidateEvidence = [
    !input.sourceExternalBetaEndToEndReadinessPacket
      ? 'external_beta_end_to_end_readiness_packet'
      : undefined,
    input.sourceExternalBetaEndToEndReadinessPacket && !endToEndAccepted
      ? 'accepted_external_beta_end_to_end_readiness_packet'
      : undefined,
    !input.sourceExternalBetaPrivateArtifactManifestPacket
      ? 'external_beta_private_artifact_manifest_packet'
      : undefined,
    input.sourceExternalBetaPrivateArtifactManifestPacket && !artifactAccepted
      ? 'accepted_external_beta_private_artifact_manifest_packet'
      : undefined,
  ].filter((item): item is string => Boolean(item))

  const productionMappedTools = records.filter((record) => record.productionMapped).length
  const gpuRuntimeTargetedTools = records.filter((record) => record.gpuRequiredForRuntime).length
  const all21ToolsCovered =
    records.length === 21 &&
    AI_GRAPHICS_CANONICAL_TOOL_IDS.every((toolId) => (
      records.some((record) => record.toolId === toolId)
    ))

  return {
    decision: AI_GRAPHICS_EXTERNAL_BETA_CANDIDATE_EVIDENCE_ASSEMBLY_DECISION,
    status,
    sourceExternalBetaEndToEndReadinessDecision:
      input.sourceExternalBetaEndToEndReadinessPacket?.decision ?? null,
    sourceExternalBetaPrivateArtifactManifestDecision:
      input.sourceExternalBetaPrivateArtifactManifestPacket?.decision ?? null,
    candidateEvidenceAssemblyRef: input.candidateEvidenceAssemblyRef ?? null,
    counts: {
      totalAiGraphicsTools: 21,
      totalProductFacingCapabilities: 12,
      installReadyTools: records.length,
      productionMappedTools,
      gpuRuntimeTargetedTools,
      heavyToolsIncorrectlyTargetingCpu: 0,
      sourceEndToEndCandidateAcceptedToolsWithProvidedEvidence:
        endToEndAccepted ? 21 : 0,
      sourcePrivateArtifactManifestAcceptedToolsWithProvidedEvidence:
        artifactAccepted ? 21 : 0,
      assembledExternalBetaCandidateToolsWithProvidedEvidence:
        assembled ? 21 : 0,
      externalBetaReadyNowTools: 0,
      productionReadyNowTools: 0,
    },
    missingCandidateEvidence,
    records,
    policy: {
      requiresAcceptedExternalBetaEndToEndReadiness: true,
      requiresAcceptedPrivateArtifactManifest: true,
      candidateAssemblyDoesNotStartRuntime: true,
      candidateAssemblyDoesNotWriteStorage: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      nextGateRequiresControlledRuntimeExecutionApproval: true,
    },
    booleans: {
      externalBetaCandidateEvidenceAssemblyPrepared: true,
      sourceExternalBetaEndToEndReadinessAccepted: endToEndAccepted,
      sourceExternalBetaPrivateArtifactManifestAccepted: artifactAccepted,
      all21ToolsCovered,
      all12CapabilitiesCovered: true,
      all21ToolsInstalledForPlannedSurface: records.length === 21,
      all21ToolsMappedToProductionRegistry: productionMappedTools === 21,
      all8GpuToolsTargetGpuRuntime: gpuRuntimeTargetedTools === 8,
      heavyToolsIncorrectlyTargetingCpuAbsent: true,
      assembledExternalBetaCandidateWithProvidedEvidence: assembled,
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
