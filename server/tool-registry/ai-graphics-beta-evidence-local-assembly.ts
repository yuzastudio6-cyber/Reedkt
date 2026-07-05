import {
  buildAiGraphicsBetaEvidenceBundle,
  type AiGraphicsBetaEvidenceBundle,
  type AiGraphicsBetaEvidenceBundleInput,
} from './ai-graphics-beta-evidence-bundle'
import {
  buildAiGraphicsGpuRuntimeProofResultPacket,
  type AiGraphicsGpuRuntimeProofResultPacket,
} from './ai-graphics-gpu-runtime-proof-result'
import type {
  AiGraphicsModelWeightChecksumEvidenceRecord,
} from './ai-graphics-model-weight-checksum-evidence'
import type {
  AiGraphicsModelWeightManifestReviewSupplementRecord,
} from './ai-graphics-model-weight-manifest-authoring'
import {
  buildAiGraphicsModelWeightManifestAuthoringDrafts,
  type AiGraphicsModelWeightManifestAuthoringPacket,
} from './ai-graphics-model-weight-manifest-authoring'
import {
  buildAiGraphicsModelWeightManifestReviewPacket,
  type AiGraphicsModelWeightManifestEvidenceRecord,
  type AiGraphicsModelWeightManifestReviewPacket,
} from './ai-graphics-model-weight-manifest-readiness'

export const AI_GRAPHICS_BETA_EVIDENCE_LOCAL_ASSEMBLY_DECISION =
  'ai_graphics_beta_evidence_local_assembly_prepared_with_directory_inputs'

export interface AiGraphicsBetaEvidenceLocalAssemblyInput {
  manifestRecords?: Partial<AiGraphicsModelWeightManifestEvidenceRecord>[]
  checksumEvidenceRecords?: Partial<AiGraphicsModelWeightChecksumEvidenceRecord>[]
  manifestSupplementRecords?: Partial<AiGraphicsModelWeightManifestReviewSupplementRecord>[]
  gpuRuntimeProofResults?: unknown[]
  approvedPlanSnapshotGatePassed?: boolean
  creditReservationGatePassed?: boolean
  artifactBoundaryGatePassed?: boolean
  toolRouteGatePassed?: boolean
  workerGatePassed?: boolean
  browserCanvasWebglSandboxPassed?: boolean
  internalBetaOwnerApprovalGranted?: boolean
  sourceExternalBetaNativeGpuProofCollectionPacket?:
    AiGraphicsBetaEvidenceBundleInput['sourceExternalBetaNativeGpuProofCollectionPacket']
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
    | 'assembled_technical_evidence_ready_for_owner_gate'
    | 'assembled_all21_beta_evidence_ready_for_owner_gate'
  totalAiGraphicsTools: 21
  modelWeightManifestRequiredTools: 5
  nativeGpuRuntimeProfilesRequired: 6
  localManifestRecordsProvided: number
  localChecksumEvidenceRecordsProvided: number
  localManifestSupplementRecordsProvided: number
  localManifestRecordsAuthoredFromPrivateEvidence: number
  localGpuRuntimeProofResultsProvided: number
  manifestRecordsSource:
    | 'missing'
    | 'provided_manifest_records'
    | 'authored_from_checksum_and_supplement_evidence'
  expectedGpuRuntimeTargets: Record<string, string>
  gpuRuntimePolicy: {
    onDemandOnly: true
    noIdleGpuRuntimeApproved: true
    startsOnlyForApprovedWorkerOrToolCall: true
    proofContainerIsEphemeral: true
    cpuFallbackAllowedForHeavyTools: false
  }
  modelWeightManifestReviewPacket: AiGraphicsModelWeightManifestReviewPacket
  modelWeightManifestAuthoringPacket: AiGraphicsModelWeightManifestAuthoringPacket | null
  gpuRuntimeProofResultPacket: AiGraphicsGpuRuntimeProofResultPacket
  betaEvidenceBundle: AiGraphicsBetaEvidenceBundle
  missingLocalEvidence: string[]
  missingBetaEvidence: string[]
  booleans: {
    betaEvidenceLocalAssemblyPrepared: true
    checksumAndSupplementCanAuthorManifestsForAssembly: boolean
    modelWeightManifestReviewPacketBuiltFromLocalInput: boolean
    gpuRuntimeProofResultPacketBuiltFromLocalInput: boolean
    committedJsRuntimeProofsAccepted: boolean
    gpuRuntimeTargetsExact: true
    gpuRuntimeOnDemandOnly: true
    all21TechnicalEvidenceReadyBeforeOwnerApproval: boolean
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

function localEvidenceMissing(
  input: AiGraphicsBetaEvidenceLocalAssemblyInput,
  manifestRecords: readonly Partial<AiGraphicsModelWeightManifestEvidenceRecord>[],
): string[] {
  const hasDirectManifests = Boolean(input.manifestRecords?.length)
  const hasChecksumEvidence = Boolean(input.checksumEvidenceRecords?.length)
  const hasManifestSupplements = Boolean(input.manifestSupplementRecords?.length)
  const hasManifestAuthoringInputs = hasChecksumEvidence && hasManifestSupplements

  return [
    !manifestRecords.length && !hasManifestAuthoringInputs
      ? 'reviewed_private_model_weight_manifest_records'
      : undefined,
    !hasDirectManifests && hasChecksumEvidence && !hasManifestSupplements
      ? 'reviewed_private_manifest_supplement_records'
      : undefined,
    !hasDirectManifests && !hasChecksumEvidence && hasManifestSupplements
      ? 'reviewed_private_checksum_evidence_records'
      : undefined,
    !input.gpuRuntimeProofResults?.length ? 'native_gpu_runtime_proof_result_records' : undefined,
  ].filter((entry): entry is string => Boolean(entry))
}

function manifestRecordsFromInput(input: AiGraphicsBetaEvidenceLocalAssemblyInput): {
  manifestRecords: Partial<AiGraphicsModelWeightManifestEvidenceRecord>[]
  manifestRecordsSource: AiGraphicsBetaEvidenceLocalAssembly['manifestRecordsSource']
  modelWeightManifestAuthoringPacket: AiGraphicsModelWeightManifestAuthoringPacket | null
  localManifestRecordsAuthoredFromPrivateEvidence: number
} {
  if (input.manifestRecords?.length) {
    return {
      manifestRecords: input.manifestRecords,
      manifestRecordsSource: 'provided_manifest_records',
      modelWeightManifestAuthoringPacket: null,
      localManifestRecordsAuthoredFromPrivateEvidence: 0,
    }
  }

  const hasAuthoringInput = Boolean(input.checksumEvidenceRecords?.length || input.manifestSupplementRecords?.length)
  if (!hasAuthoringInput) {
    return {
      manifestRecords: [],
      manifestRecordsSource: 'missing',
      modelWeightManifestAuthoringPacket: null,
      localManifestRecordsAuthoredFromPrivateEvidence: 0,
    }
  }

  const authoring = buildAiGraphicsModelWeightManifestAuthoringDrafts(
    input.checksumEvidenceRecords ?? [],
    input.manifestSupplementRecords ?? [],
  )

  return {
    manifestRecords: authoring.drafts,
    manifestRecordsSource: 'authored_from_checksum_and_supplement_evidence',
    modelWeightManifestAuthoringPacket: authoring.packet,
    localManifestRecordsAuthoredFromPrivateEvidence: authoring.drafts.length,
  }
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
  if (input.betaEvidenceBundle.all21TechnicalEvidenceReadyBeforeOwnerApproval) {
    return 'assembled_technical_evidence_ready_for_owner_gate'
  }
  return 'assembled_not_all21_beta_ready'
}

export function buildAiGraphicsBetaEvidenceLocalAssembly(
  input: AiGraphicsBetaEvidenceLocalAssemblyInput = {},
): AiGraphicsBetaEvidenceLocalAssembly {
  const manifestInput = manifestRecordsFromInput(input)
  const manifestRecords = manifestInput.manifestRecords
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
    sourceExternalBetaNativeGpuProofCollectionPacket:
      input.sourceExternalBetaNativeGpuProofCollectionPacket,
    nodeRuntimeProofPacket: input.nodeRuntimeProofPacket,
    browserRuntimeProofPacket: input.browserRuntimeProofPacket,
    satoriFontRuntimeProofPacket: input.satoriFontRuntimeProofPacket,
  })
  const missingLocalEvidence = localEvidenceMissing(input, manifestRecords)

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
    nativeGpuRuntimeProfilesRequired: 6,
    localManifestRecordsProvided: manifestRecords.length,
    localChecksumEvidenceRecordsProvided: input.checksumEvidenceRecords?.length ?? 0,
    localManifestSupplementRecordsProvided: input.manifestSupplementRecords?.length ?? 0,
    localManifestRecordsAuthoredFromPrivateEvidence:
      manifestInput.localManifestRecordsAuthoredFromPrivateEvidence,
    localGpuRuntimeProofResultsProvided: gpuRuntimeProofResults.length,
    manifestRecordsSource: manifestInput.manifestRecordsSource,
    expectedGpuRuntimeTargets: betaEvidenceBundle.expectedGpuRuntimeTargets,
    gpuRuntimePolicy: betaEvidenceBundle.gpuRuntimePolicy,
    modelWeightManifestReviewPacket,
    modelWeightManifestAuthoringPacket: manifestInput.modelWeightManifestAuthoringPacket,
    gpuRuntimeProofResultPacket,
    betaEvidenceBundle,
    missingLocalEvidence,
    missingBetaEvidence: betaEvidenceBundle.missingEvidence,
    booleans: {
      betaEvidenceLocalAssemblyPrepared: true,
      checksumAndSupplementCanAuthorManifestsForAssembly:
        manifestInput.localManifestRecordsAuthoredFromPrivateEvidence === 5,
      modelWeightManifestReviewPacketBuiltFromLocalInput:
        modelWeightManifestReviewPacket.nativeGpuProofInputEligibleRecords === 5,
      gpuRuntimeProofResultPacketBuiltFromLocalInput:
        gpuRuntimeProofResultPacket.nativeGpuRuntimeProofResultsAccepted,
      committedJsRuntimeProofsAccepted:
        betaEvidenceBundle.evidenceSources.jsRuntimeProofsAccepted,
      gpuRuntimeTargetsExact: true,
      gpuRuntimeOnDemandOnly: true,
      all21TechnicalEvidenceReadyBeforeOwnerApproval:
        betaEvidenceBundle.all21TechnicalEvidenceReadyBeforeOwnerApproval,
      all21BetaEvidenceReady: betaEvidenceBundle.all21BetaEvidenceReady,
      readyForInternalBetaOwnerGate:
        betaEvidenceBundle.all21TechnicalEvidenceReadyBeforeOwnerApproval,
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
