import {
  buildAiGraphicsBetaEvidenceBundle,
  type AiGraphicsBetaEvidenceBundle,
} from './ai-graphics-beta-evidence-bundle'
import {
  buildAiGraphicsGpuRuntimeProofResultPacket,
  type AiGraphicsGpuRuntimeProofResultPacket,
} from './ai-graphics-gpu-runtime-proof-result'
import {
  buildAiGraphicsModelWeightManifestReviewPacket,
  type AiGraphicsModelWeightManifestEvidenceRecord,
  type AiGraphicsModelWeightManifestReviewPacket,
} from './ai-graphics-model-weight-manifest-readiness'

export const AI_GRAPHICS_BETA_EVIDENCE_LOCAL_ASSEMBLY_DECISION =
  'ai_graphics_beta_evidence_local_assembly_prepared_with_directory_inputs'

export interface AiGraphicsBetaEvidenceLocalAssemblyInput {
  manifestRecords?: Partial<AiGraphicsModelWeightManifestEvidenceRecord>[]
  gpuRuntimeProofResults?: unknown[]
  approvedPlanSnapshotGatePassed?: boolean
  creditReservationGatePassed?: boolean
  artifactBoundaryGatePassed?: boolean
  toolRouteGatePassed?: boolean
  workerGatePassed?: boolean
  browserCanvasWebglSandboxPassed?: boolean
  internalBetaOwnerApprovalGranted?: boolean
  nodeRuntimeProofPacket?: Record<string, unknown>
  browserRuntimeProofPacket?: Record<string, unknown>
  satoriFontRuntimeProofPacket?: Record<string, unknown>
}

export interface AiGraphicsBetaEvidenceLocalAssembly {
  decision: typeof AI_GRAPHICS_BETA_EVIDENCE_LOCAL_ASSEMBLY_DECISION
  status:
    | 'missing_local_evidence'
    | 'invalid_local_evidence'
    | 'assembled_not_all21_beta_ready'
    | 'assembled_all21_beta_evidence_ready_for_owner_gate'
  totalAiGraphicsTools: 21
  modelWeightManifestRequiredTools: 5
  nativeGpuRuntimeProfilesRequired: 4
  localManifestRecordsProvided: number
  localGpuRuntimeProofResultsProvided: number
  modelWeightManifestReviewPacket: AiGraphicsModelWeightManifestReviewPacket
  gpuRuntimeProofResultPacket: AiGraphicsGpuRuntimeProofResultPacket
  betaEvidenceBundle: AiGraphicsBetaEvidenceBundle
  missingLocalEvidence: string[]
  missingBetaEvidence: string[]
  booleans: {
    betaEvidenceLocalAssemblyPrepared: true
    modelWeightManifestReviewPacketBuiltFromLocalInput: boolean
    gpuRuntimeProofResultPacketBuiltFromLocalInput: boolean
    committedJsRuntimeProofsAccepted: boolean
    all21BetaEvidenceReady: boolean
    readyForInternalBetaOwnerGate: boolean
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
    modelInferencePerformed: false
    mediaProcessingPerformed: false
    supabaseMutationPerformed: false
    gcsUploadPerformed: false
    publicArtifactCreated: false
    signedUrlCreated: false
  }
}

function localEvidenceMissing(input: AiGraphicsBetaEvidenceLocalAssemblyInput): string[] {
  return [
    !input.manifestRecords?.length ? 'reviewed_private_model_weight_manifest_records' : undefined,
    !input.gpuRuntimeProofResults?.length ? 'native_gpu_runtime_proof_result_records' : undefined,
  ].filter((entry): entry is string => Boolean(entry))
}

function assemblyStatus(input: {
  missingLocalEvidence: string[]
  modelWeightManifestReviewPacket: AiGraphicsModelWeightManifestReviewPacket
  gpuRuntimeProofResultPacket: AiGraphicsGpuRuntimeProofResultPacket
  betaEvidenceBundle: AiGraphicsBetaEvidenceBundle
}): AiGraphicsBetaEvidenceLocalAssembly['status'] {
  if (input.missingLocalEvidence.length > 0) return 'missing_local_evidence'
  if (
    input.modelWeightManifestReviewPacket.nativeGpuProofInputEligibleRecords !== 5 ||
    !input.modelWeightManifestReviewPacket.booleans.privateArtifactRefsNotLogged ||
    !input.gpuRuntimeProofResultPacket.nativeGpuRuntimeProofResultsAccepted
  ) {
    return 'invalid_local_evidence'
  }
  if (input.betaEvidenceBundle.all21BetaEvidenceReady) {
    return 'assembled_all21_beta_evidence_ready_for_owner_gate'
  }
  return 'assembled_not_all21_beta_ready'
}

export function buildAiGraphicsBetaEvidenceLocalAssembly(
  input: AiGraphicsBetaEvidenceLocalAssemblyInput = {},
): AiGraphicsBetaEvidenceLocalAssembly {
  const manifestRecords = input.manifestRecords ?? []
  const gpuRuntimeProofResults = input.gpuRuntimeProofResults ?? []
  const modelWeightManifestReviewPacket = buildAiGraphicsModelWeightManifestReviewPacket(manifestRecords)
  const gpuRuntimeProofResultPacket = buildAiGraphicsGpuRuntimeProofResultPacket(gpuRuntimeProofResults)
  const betaEvidenceBundle = buildAiGraphicsBetaEvidenceBundle({
    approvedPlanSnapshotGatePassed: input.approvedPlanSnapshotGatePassed,
    creditReservationGatePassed: input.creditReservationGatePassed,
    artifactBoundaryGatePassed: input.artifactBoundaryGatePassed,
    toolRouteGatePassed: input.toolRouteGatePassed,
    workerGatePassed: input.workerGatePassed,
    browserCanvasWebglSandboxPassed: input.browserCanvasWebglSandboxPassed,
    internalBetaOwnerApprovalGranted: input.internalBetaOwnerApprovalGranted,
    modelWeightManifestReviewPacket,
    gpuRuntimeProofResultPacket,
    nodeRuntimeProofPacket: input.nodeRuntimeProofPacket,
    browserRuntimeProofPacket: input.browserRuntimeProofPacket,
    satoriFontRuntimeProofPacket: input.satoriFontRuntimeProofPacket,
  })
  const missingLocalEvidence = localEvidenceMissing(input)

  return {
    decision: AI_GRAPHICS_BETA_EVIDENCE_LOCAL_ASSEMBLY_DECISION,
    status: assemblyStatus({
      missingLocalEvidence,
      modelWeightManifestReviewPacket,
      gpuRuntimeProofResultPacket,
      betaEvidenceBundle,
    }),
    totalAiGraphicsTools: 21,
    modelWeightManifestRequiredTools: 5,
    nativeGpuRuntimeProfilesRequired: 4,
    localManifestRecordsProvided: manifestRecords.length,
    localGpuRuntimeProofResultsProvided: gpuRuntimeProofResults.length,
    modelWeightManifestReviewPacket,
    gpuRuntimeProofResultPacket,
    betaEvidenceBundle,
    missingLocalEvidence,
    missingBetaEvidence: betaEvidenceBundle.missingEvidence,
    booleans: {
      betaEvidenceLocalAssemblyPrepared: true,
      modelWeightManifestReviewPacketBuiltFromLocalInput:
        modelWeightManifestReviewPacket.nativeGpuProofInputEligibleRecords === 5,
      gpuRuntimeProofResultPacketBuiltFromLocalInput:
        gpuRuntimeProofResultPacket.nativeGpuRuntimeProofResultsAccepted,
      committedJsRuntimeProofsAccepted:
        betaEvidenceBundle.evidenceSources.jsRuntimeProofsAccepted,
      all21BetaEvidenceReady: betaEvidenceBundle.all21BetaEvidenceReady,
      readyForInternalBetaOwnerGate: betaEvidenceBundle.all21BetaEvidenceReady,
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
      modelInferencePerformed: false,
      mediaProcessingPerformed: false,
      supabaseMutationPerformed: false,
      gcsUploadPerformed: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
    },
  }
}
