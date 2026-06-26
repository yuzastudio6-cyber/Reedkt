import {
  buildAiGraphicsBetaReadinessGate,
  type AiGraphicsBetaReadinessEvidence,
} from './ai-graphics-beta-readiness-gate'
import type {
  AiGraphicsGpuRuntimeProofResultPacket,
} from './ai-graphics-gpu-runtime-proof-result'
import type {
  AiGraphicsModelWeightManifestReviewPacket,
} from './ai-graphics-model-weight-manifest-readiness'
import {
  listAiGraphicsToolCallReadiness,
  type AiGraphicsCanonicalToolId,
} from './ai-graphics-tool-call-readiness'

export const AI_GRAPHICS_BETA_EVIDENCE_BUNDLE_DECISION =
  'ai_graphics_beta_evidence_bundle_validator_prepared_with_fail_closed_defaults'

export interface AiGraphicsBetaEvidenceBundleInput {
  approvedPlanSnapshotGatePassed?: boolean
  creditReservationGatePassed?: boolean
  artifactBoundaryGatePassed?: boolean
  toolRouteGatePassed?: boolean
  workerGatePassed?: boolean
  browserCanvasWebglSandboxPassed?: boolean
  internalBetaOwnerApprovalGranted?: boolean
  modelWeightManifestReviewPacket?: Partial<AiGraphicsModelWeightManifestReviewPacket>
  gpuRuntimeProofResultPacket?: Partial<AiGraphicsGpuRuntimeProofResultPacket>
  modelWeightManifestsApprovedOverride?: boolean
  nativeGpuRuntimeProofPassedOverride?: boolean
}

export interface AiGraphicsBetaEvidenceBundleToolRow {
  toolId: AiGraphicsCanonicalToolId
  installReadyForPlannedSurface: true
  productionMapped: true
  planningSelectable: true
  betaTestingReadyNow: boolean
  evidenceMissing: string[]
  blockers: string[]
}

export interface AiGraphicsBetaEvidenceBundle {
  decision: typeof AI_GRAPHICS_BETA_EVIDENCE_BUNDLE_DECISION
  totalAiGraphicsTools: 21
  installReadyForPlannedSurfaceTools: 21
  productionMappedTools: 21
  planningSelectableTools: 21
  betaTestingReadyTools: number
  blockedTools: number
  all21BetaEvidenceReady: boolean
  evidence: Required<AiGraphicsBetaReadinessEvidence>
  evidenceSources: {
    modelWeightManifestReviewPacketAccepted: boolean
    nativeGpuRuntimeProofResultPacketAccepted: boolean
    modelWeightManifestReviewPacketProvided: boolean
    nativeGpuRuntimeProofResultPacketProvided: boolean
  }
  tools: AiGraphicsBetaEvidenceBundleToolRow[]
  missingEvidence: string[]
  booleans: {
    betaEvidenceBundleValidatorPrepared: true
    all21ToolsCovered: true
    all21ToolsInstallReadyForPlannedSurface: true
    all21ToolsMappedToProductionRegistry: true
    all21ToolsPlanningSelectable: true
    agentCanSelectForPlanning: true
    all21BetaEvidenceReady: boolean
    agentCanExecuteToolsNow: false
    routeExecutionApprovedNow: boolean
    workerExecutionApprovedNow: boolean
    toolExecutionApprovedNow: false
    providerRuntimeApprovedNow: false
    browserWebglCanvasRuntimeApprovedNow: boolean
    gpuRuntimeApprovedNow: boolean
    modelWeightManifestsApprovedNow: boolean
    runtimeReadyNow: false
    internalBetaReadyNow: boolean
    externalBetaReadyNow: false
    productionReadyNow: false
    dependencyInstallPerformed: false
    packageLockMutationPerformed: false
    toolExecutionPerformed: false
    workerExecutionPerformed: false
    routeExecutionPerformed: false
    providerRuntimePerformed: false
    browserWebglCanvasRuntimePerformed: false
    gpuRuntimePerformed: false
    modelWeightsDownloaded: false
    modelWeightsLoaded: false
    mediaProcessingPerformed: false
    supabaseMutationPerformed: false
    gcsUploadPerformed: false
    publicArtifactCreated: false
    signedUrlCreated: false
  }
}

function packetProvided(value: unknown): boolean {
  return typeof value === 'object' && value !== null
}

function modelWeightPacketAccepted(
  packet: Partial<AiGraphicsModelWeightManifestReviewPacket> | undefined,
): boolean {
  return Boolean(
    packet &&
      packet.manifestRecordsProvided === 5 &&
      packet.schemaValidManifestRecords === 5 &&
      packet.reviewAcceptedManifestRecords === 5 &&
      packet.nativeGpuProofInputEligibleRecords === 5 &&
      packet.privateArtifactRefsLogged === 0 &&
      packet.booleans?.privateArtifactRefsNotLogged === true &&
      packet.booleans?.publicOrSignedArtifactRefsRejected === true,
  )
}

function gpuRuntimePacketAccepted(
  packet: Partial<AiGraphicsGpuRuntimeProofResultPacket> | undefined,
): boolean {
  return Boolean(
    packet &&
      packet.runtimeProofResultsProvided === 4 &&
      packet.runtimeProofResultsAcceptedForOwnerReview === 4 &&
      packet.nativeGpuRuntimeProofResultsAccepted === true &&
      packet.booleans?.nativeGpuRuntimeProofResultsAcceptedForOwnerReview === true &&
      packet.booleans?.gpuRuntimeApprovedNow === false &&
      packet.booleans?.runtimeReadyNow === false,
  )
}

function buildMissingEvidence(evidence: Required<AiGraphicsBetaReadinessEvidence>): string[] {
  return [
    !evidence.approvedPlanSnapshotGatePassed ? 'approved_plan_snapshot_gate' : undefined,
    !evidence.creditReservationGatePassed ? 'credit_reservation_gate' : undefined,
    !evidence.artifactBoundaryGatePassed ? 'artifact_boundary_gate' : undefined,
    !evidence.toolRouteGatePassed ? 'tool_route_gate' : undefined,
    !evidence.workerGatePassed ? 'worker_gate' : undefined,
    !evidence.browserCanvasWebglSandboxPassed ? 'browser_canvas_webgl_sandbox_proof' : undefined,
    !evidence.nativeGpuRuntimeProofPassed ? 'native_gpu_runtime_proof_packet' : undefined,
    !evidence.modelWeightManifestsApproved ? 'model_weight_manifest_review_packet' : undefined,
    !evidence.internalBetaOwnerApprovalGranted ? 'internal_beta_owner_approval' : undefined,
  ].filter((entry): entry is string => Boolean(entry))
}

function toolMissingEvidence(input: {
  toolId: AiGraphicsCanonicalToolId
  blockers: readonly string[]
  evidence: Required<AiGraphicsBetaReadinessEvidence>
}): string[] {
  const missing = buildMissingEvidence(input.evidence)
  const toolBlockers = input.blockers.join('\n').toLowerCase()

  return missing.filter((entry) => {
    if (entry === 'browser_canvas_webgl_sandbox_proof') {
      return toolBlockers.includes('browser') ||
        toolBlockers.includes('canvas') ||
        toolBlockers.includes('webgl') ||
        toolBlockers.includes('animation')
    }
    if (entry === 'native_gpu_runtime_proof_packet') {
      return toolBlockers.includes('gpu') || toolBlockers.includes('nvidia')
    }
    if (entry === 'model_weight_manifest_review_packet') {
      return toolBlockers.includes('model-weight') || toolBlockers.includes('model weight')
    }
    return true
  })
}

export function buildAiGraphicsBetaEvidenceBundle(
  input: AiGraphicsBetaEvidenceBundleInput = {},
): AiGraphicsBetaEvidenceBundle {
  const modelWeightManifestReviewPacketAccepted =
    input.modelWeightManifestsApprovedOverride === true ||
    modelWeightPacketAccepted(input.modelWeightManifestReviewPacket)
  const nativeGpuRuntimeProofResultPacketAccepted =
    input.nativeGpuRuntimeProofPassedOverride === true ||
    gpuRuntimePacketAccepted(input.gpuRuntimeProofResultPacket)

  const evidence: Required<AiGraphicsBetaReadinessEvidence> = {
    approvedPlanSnapshotGatePassed: input.approvedPlanSnapshotGatePassed === true,
    creditReservationGatePassed: input.creditReservationGatePassed === true,
    artifactBoundaryGatePassed: input.artifactBoundaryGatePassed === true,
    toolRouteGatePassed: input.toolRouteGatePassed === true,
    workerGatePassed: input.workerGatePassed === true,
    browserCanvasWebglSandboxPassed: input.browserCanvasWebglSandboxPassed === true,
    nativeGpuRuntimeProofPassed: nativeGpuRuntimeProofResultPacketAccepted,
    modelWeightManifestsApproved: modelWeightManifestReviewPacketAccepted,
    internalBetaOwnerApprovalGranted: input.internalBetaOwnerApprovalGranted === true,
  }

  const gate = buildAiGraphicsBetaReadinessGate(evidence)
  const readinessRecords = listAiGraphicsToolCallReadiness()
  const tools = gate.tools.map((tool): AiGraphicsBetaEvidenceBundleToolRow => {
    const readiness = readinessRecords.find((record) => record.toolId === tool.toolId)
    if (!readiness) throw new Error(`Missing AI graphics readiness row for ${tool.toolId}`)

    return {
      toolId: tool.toolId,
      installReadyForPlannedSurface: true,
      productionMapped: true,
      planningSelectable: true,
      betaTestingReadyNow: tool.betaTestingReadyNow,
      evidenceMissing: toolMissingEvidence({
        toolId: tool.toolId,
        blockers: tool.blockers,
        evidence,
      }),
      blockers: tool.blockers,
    }
  })
  const all21BetaEvidenceReady = gate.betaTestingReadyTools === 21 && gate.blockedTools === 0

  return {
    decision: AI_GRAPHICS_BETA_EVIDENCE_BUNDLE_DECISION,
    totalAiGraphicsTools: 21,
    installReadyForPlannedSurfaceTools: 21,
    productionMappedTools: 21,
    planningSelectableTools: 21,
    betaTestingReadyTools: gate.betaTestingReadyTools,
    blockedTools: gate.blockedTools,
    all21BetaEvidenceReady,
    evidence,
    evidenceSources: {
      modelWeightManifestReviewPacketAccepted,
      nativeGpuRuntimeProofResultPacketAccepted,
      modelWeightManifestReviewPacketProvided: packetProvided(input.modelWeightManifestReviewPacket),
      nativeGpuRuntimeProofResultPacketProvided: packetProvided(input.gpuRuntimeProofResultPacket),
    },
    tools,
    missingEvidence: buildMissingEvidence(evidence),
    booleans: {
      betaEvidenceBundleValidatorPrepared: true,
      all21ToolsCovered: true,
      all21ToolsInstallReadyForPlannedSurface: true,
      all21ToolsMappedToProductionRegistry: true,
      all21ToolsPlanningSelectable: true,
      agentCanSelectForPlanning: true,
      all21BetaEvidenceReady,
      agentCanExecuteToolsNow: false,
      routeExecutionApprovedNow: false,
      workerExecutionApprovedNow: false,
      toolExecutionApprovedNow: false,
      providerRuntimeApprovedNow: false,
      browserWebglCanvasRuntimeApprovedNow: false,
      gpuRuntimeApprovedNow: false,
      modelWeightManifestsApprovedNow: false,
      runtimeReadyNow: false,
      internalBetaReadyNow: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
      dependencyInstallPerformed: false,
      packageLockMutationPerformed: false,
      toolExecutionPerformed: false,
      workerExecutionPerformed: false,
      routeExecutionPerformed: false,
      providerRuntimePerformed: false,
      browserWebglCanvasRuntimePerformed: false,
      gpuRuntimePerformed: false,
      modelWeightsDownloaded: false,
      modelWeightsLoaded: false,
      mediaProcessingPerformed: false,
      supabaseMutationPerformed: false,
      gcsUploadPerformed: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
    },
  }
}
