import {
  AI_GRAPHICS_BETA_EVIDENCE_BUNDLE_DECISION,
  buildAiGraphicsBetaEvidenceBundle,
  type AiGraphicsBetaEvidenceBundle,
} from './ai-graphics-beta-evidence-bundle'
import {
  AI_GRAPHICS_EXTERNAL_BETA_EVIDENCE_PACKET_DECISION,
  buildAiGraphicsExternalBetaEvidencePacket,
  type AiGraphicsExternalBetaEvidencePacket,
} from './ai-graphics-external-beta-evidence-packet'
import {
  AI_GRAPHICS_CANONICAL_TOOL_IDS,
  type AiGraphicsCanonicalToolId,
} from './ai-graphics-tool-call-readiness'

export const AI_GRAPHICS_EXTERNAL_BETA_EVIDENCE_ADMISSION_BUNDLE_DECISION =
  'ai_graphics_external_beta_evidence_admission_bundle_prepared_with_runtime_blocks'

export type AiGraphicsExternalBetaEvidenceAdmissionBundleStatus =
  | 'missing_technical_runtime_evidence'
  | 'missing_external_beta_private_evidence_refs'
  | 'external_beta_admission_candidate_with_provided_evidence_runtime_still_blocked'

export interface AiGraphicsExternalBetaEvidenceAdmissionBundleInput {
  betaEvidenceBundlePacket?: Partial<AiGraphicsBetaEvidenceBundle>
  externalBetaEvidencePacket?: Partial<AiGraphicsExternalBetaEvidencePacket>
}

export interface AiGraphicsExternalBetaEvidenceAdmissionToolRow {
  toolId: AiGraphicsCanonicalToolId
  technicalEvidenceAcceptedForTool: boolean
  externalBetaPrivateEvidenceAcceptedForTool: boolean
  externalBetaAdmissionCandidateWithProvidedEvidence: boolean
  externalBetaReadyNow: false
  productionReadyNow: false
  missingEvidenceBeforeExternalBetaAdmission: string[]
}

export interface AiGraphicsExternalBetaEvidenceAdmissionBundle {
  decision: typeof AI_GRAPHICS_EXTERNAL_BETA_EVIDENCE_ADMISSION_BUNDLE_DECISION
  sourceBetaEvidenceBundleDecision: typeof AI_GRAPHICS_BETA_EVIDENCE_BUNDLE_DECISION
  sourceExternalBetaEvidencePacketDecision: typeof AI_GRAPHICS_EXTERNAL_BETA_EVIDENCE_PACKET_DECISION
  status: AiGraphicsExternalBetaEvidenceAdmissionBundleStatus
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  technicalEvidenceReadyBeforeOwnerApprovalTools: number
  externalBetaPrivateEvidenceAcceptedTools: number
  externalBetaAdmissionCandidateToolsWithProvidedEvidence: number
  externalBetaReadyNowTools: 0
  productionReadyNowTools: 0
  requiredEvidenceFlow: string[]
  nextExternalBetaActions: string[]
  sourceBetaEvidenceBundle: AiGraphicsBetaEvidenceBundle
  sourceExternalBetaEvidencePacket: AiGraphicsExternalBetaEvidencePacket
  tools: AiGraphicsExternalBetaEvidenceAdmissionToolRow[]
  booleans: {
    externalBetaEvidenceAdmissionBundlePrepared: true
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    technicalEvidenceReadyBeforeOwnerApproval: boolean
    externalBetaPrivateEvidenceRefsAccepted: boolean
    externalBetaAdmissionCandidateWithProvidedEvidence: boolean
    gpuRuntimeOnDemandOnly: true
    privateOrBackendEvidenceRefsRequired: true
    publicArtifactRefsRejected: true
    signedUrlRefsRejected: true
    agentCanSelectForPlanning: true
    agentCanExecuteToolsNow: false
    routeExecutionApprovedNow: false
    workerExecutionApprovedNow: false
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

const requiredEvidenceFlow = [
  'technical proof bundle accepted for all 21 AI graphics tools',
  'private or backend external-beta evidence refs accepted for all 21 tools',
  'external-beta launch go/no-go approval recorded with rollout, cost, concurrency, privacy, rollback, and support refs',
  'runtime admission still requires explicit feature flag, Tool Route, Worker, private artifact, credit, and approved-plan gates',
]

const nextExternalBetaActions = [
  'Collect or validate private runtime-soak evidence refs for every tool.',
  'Collect or validate external-beta QA evidence refs for every tool.',
  'Collect or validate cost, concurrency, privacy, rollback, incident-response, and owner-approval refs.',
  'Feed this admission bundle into external-beta launch go/no-go; do not enable runtime directly from this packet.',
]

function betaEvidenceBundleAccepted(
  packet: Partial<AiGraphicsBetaEvidenceBundle>,
): packet is AiGraphicsBetaEvidenceBundle {
  return Boolean(
    packet.decision === AI_GRAPHICS_BETA_EVIDENCE_BUNDLE_DECISION &&
      packet.totalAiGraphicsTools === 21 &&
      packet.all21TechnicalEvidenceReadyBeforeOwnerApproval === true &&
      packet.evidenceSources?.jsRuntimeProofsAccepted === true &&
      packet.evidenceSources?.modelWeightManifestReviewPacketAccepted === true &&
      packet.evidenceSources?.nativeGpuRuntimeProofResultPacketAccepted === true &&
      packet.evidenceSources?.nativeGpuRuntimeProofTargetsExact === true &&
      packet.booleans?.gpuRuntimeOnDemandOnly === true &&
      packet.booleans?.agentCanExecuteToolsNow === false &&
      packet.booleans?.externalBetaReadyNow === false &&
      packet.booleans?.productionReadyNow === false,
  )
}

function externalBetaEvidencePacketAccepted(
  packet: Partial<AiGraphicsExternalBetaEvidencePacket>,
): packet is AiGraphicsExternalBetaEvidencePacket {
  return Boolean(
    packet.decision === AI_GRAPHICS_EXTERNAL_BETA_EVIDENCE_PACKET_DECISION &&
      packet.totalAiGraphicsTools === 21 &&
      packet.evidenceRecordsAcceptedWithProvidedEvidence === 21 &&
      packet.externalBetaReadyWithProvidedEvidenceTools === 21 &&
      packet.externalBetaReadyNowTools === 0 &&
      packet.productionReadyNowTools === 0 &&
      packet.booleans?.externalBetaReadyWithProvidedEvidence === true &&
      packet.booleans?.privateOrBackendEvidenceRefsRequired === true &&
      packet.booleans?.publicArtifactRefsRejected === true &&
      packet.booleans?.signedUrlRefsRejected === true &&
      packet.booleans?.agentCanExecuteToolsNow === false &&
      packet.booleans?.externalBetaReadyNow === false &&
      packet.booleans?.productionReadyNow === false,
  )
}

function statusForBundle(input: {
  technicalEvidenceAccepted: boolean
  externalBetaEvidenceAccepted: boolean
}): AiGraphicsExternalBetaEvidenceAdmissionBundleStatus {
  if (!input.technicalEvidenceAccepted) return 'missing_technical_runtime_evidence'
  if (!input.externalBetaEvidenceAccepted) return 'missing_external_beta_private_evidence_refs'
  return 'external_beta_admission_candidate_with_provided_evidence_runtime_still_blocked'
}

function toolMissingEvidence(input: {
  toolId: AiGraphicsCanonicalToolId
  technicalEvidenceAccepted: boolean
  externalBetaEvidenceAccepted: boolean
}): string[] {
  return [
    !input.technicalEvidenceAccepted
      ? `${input.toolId}: accepted all-21 technical runtime proof bundle`
      : undefined,
    !input.externalBetaEvidenceAccepted
      ? `${input.toolId}: accepted private external-beta evidence refs`
      : undefined,
    input.technicalEvidenceAccepted && input.externalBetaEvidenceAccepted
      ? `${input.toolId}: launch go/no-go and runtime admission still required before execution`
      : undefined,
  ].filter((entry): entry is string => Boolean(entry))
}

export function buildAiGraphicsExternalBetaEvidenceAdmissionBundle(
  input: AiGraphicsExternalBetaEvidenceAdmissionBundleInput = {},
): AiGraphicsExternalBetaEvidenceAdmissionBundle {
  const sourceBetaEvidenceBundle = {
    ...buildAiGraphicsBetaEvidenceBundle(),
    ...(input.betaEvidenceBundlePacket ?? {}),
  } as AiGraphicsBetaEvidenceBundle
  const sourceExternalBetaEvidencePacket = {
    ...buildAiGraphicsExternalBetaEvidencePacket(),
    ...(input.externalBetaEvidencePacket ?? {}),
  } as AiGraphicsExternalBetaEvidencePacket
  const technicalEvidenceAccepted = betaEvidenceBundleAccepted(sourceBetaEvidenceBundle)
  const externalBetaEvidenceAccepted =
    externalBetaEvidencePacketAccepted(sourceExternalBetaEvidencePacket)
  const admissionCandidate =
    technicalEvidenceAccepted && externalBetaEvidenceAccepted
  const status = statusForBundle({
    technicalEvidenceAccepted,
    externalBetaEvidenceAccepted,
  })

  const tools = AI_GRAPHICS_CANONICAL_TOOL_IDS.map((toolId) => {
    const externalRecord = sourceExternalBetaEvidencePacket.records?.find(
      (record) => record.toolId === toolId,
    )
    const externalBetaPrivateEvidenceAcceptedForTool =
      externalBetaEvidenceAccepted &&
      externalRecord?.externalBetaEvidenceAcceptedWithProvidedEvidence === true

    return {
      toolId,
      technicalEvidenceAcceptedForTool: technicalEvidenceAccepted,
      externalBetaPrivateEvidenceAcceptedForTool,
      externalBetaAdmissionCandidateWithProvidedEvidence:
        technicalEvidenceAccepted && externalBetaPrivateEvidenceAcceptedForTool,
      externalBetaReadyNow: false,
      productionReadyNow: false,
      missingEvidenceBeforeExternalBetaAdmission: toolMissingEvidence({
        toolId,
        technicalEvidenceAccepted,
        externalBetaEvidenceAccepted: externalBetaPrivateEvidenceAcceptedForTool,
      }),
    }
  })

  return {
    decision: AI_GRAPHICS_EXTERNAL_BETA_EVIDENCE_ADMISSION_BUNDLE_DECISION,
    sourceBetaEvidenceBundleDecision: AI_GRAPHICS_BETA_EVIDENCE_BUNDLE_DECISION,
    sourceExternalBetaEvidencePacketDecision: AI_GRAPHICS_EXTERNAL_BETA_EVIDENCE_PACKET_DECISION,
    status,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    technicalEvidenceReadyBeforeOwnerApprovalTools: technicalEvidenceAccepted ? 21 : 0,
    externalBetaPrivateEvidenceAcceptedTools: externalBetaEvidenceAccepted ? 21 : 0,
    externalBetaAdmissionCandidateToolsWithProvidedEvidence: admissionCandidate ? 21 : 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    requiredEvidenceFlow,
    nextExternalBetaActions,
    sourceBetaEvidenceBundle,
    sourceExternalBetaEvidencePacket,
    tools,
    booleans: {
      externalBetaEvidenceAdmissionBundlePrepared: true,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      technicalEvidenceReadyBeforeOwnerApproval: technicalEvidenceAccepted,
      externalBetaPrivateEvidenceRefsAccepted: externalBetaEvidenceAccepted,
      externalBetaAdmissionCandidateWithProvidedEvidence: admissionCandidate,
      gpuRuntimeOnDemandOnly: true,
      privateOrBackendEvidenceRefsRequired: true,
      publicArtifactRefsRejected: true,
      signedUrlRefsRejected: true,
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: false,
      routeExecutionApprovedNow: false,
      workerExecutionApprovedNow: false,
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
