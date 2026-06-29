import type {
  AiGraphicsModelWeightChecksumEvidencePacket,
} from './ai-graphics-model-weight-checksum-evidence'
import type {
  AiGraphicsModelWeightManifestAuthoringPacket,
} from './ai-graphics-model-weight-manifest-authoring'
import type {
  AiGraphicsModelWeightManifestReviewPacket,
  AiGraphicsModelWeightManifestToolId,
} from './ai-graphics-model-weight-manifest-readiness'
import type {
  AiGraphicsModelWeightManifestSupplementPacket,
} from './ai-graphics-model-weight-manifest-supplement'

export const AI_GRAPHICS_MODEL_WEIGHT_PRIVATE_EVIDENCE_INTAKE_DECISION =
  'ai_graphics_model_weight_private_evidence_intake_prepared_with_runtime_blocks'

export type AiGraphicsModelWeightPrivateEvidenceIntakeStatus =
  | 'blocked_missing_private_checksum_evidence'
  | 'blocked_missing_private_manifest_supplements'
  | 'blocked_missing_private_manifest_authoring'
  | 'blocked_missing_reviewed_private_manifests'
  | 'private_model_weight_evidence_ready_for_native_gpu_proof_not_beta_ready'

export interface AiGraphicsModelWeightPrivateEvidenceIntakeInput {
  checksumEvidencePacket?: AiGraphicsModelWeightChecksumEvidencePacket
  manifestSupplementPacket?: AiGraphicsModelWeightManifestSupplementPacket
  manifestAuthoringPacket?: AiGraphicsModelWeightManifestAuthoringPacket
  manifestReviewPacket?: AiGraphicsModelWeightManifestReviewPacket
}

export interface AiGraphicsModelWeightPrivateEvidenceIntakePacket {
  decision: typeof AI_GRAPHICS_MODEL_WEIGHT_PRIVATE_EVIDENCE_INTAKE_DECISION
  status: AiGraphicsModelWeightPrivateEvidenceIntakeStatus
  totalAiGraphicsTools: 21
  gpuRuntimeTargetedTools: 8
  modelWeightManifestRequiredTools: AiGraphicsModelWeightManifestToolId[]
  checksumEvidenceRecordsAccepted: number
  manifestSupplementRecordsAccepted: number
  localPrivateManifestDraftsReady: number
  reviewedPrivateManifestRecordsAccepted: number
  nativeGpuProofInputEligibleRecords: number
  readyForNativeGpuProofInputRecords: number
  privateArtifactRefsLogged: 0
  betaReadyModelWeightTools: 0
  missingEvidence: string[]
  nextRequiredMilestones: string[]
  booleans: {
    modelWeightPrivateEvidenceIntakePrepared: true
    all5ModelWeightToolsCovered: true
    checksumEvidenceAcceptedForAll5: boolean
    manifestSupplementsAcceptedForAll5: boolean
    localPrivateManifestDraftsReadyForAll5: boolean
    reviewedPrivateManifestsAcceptedForAll5: boolean
    readyForNativeGpuProofInput: boolean
    nativeGpuProofStillRequired: true
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    privateArtifactRefsNotLogged: true
    publicOrSignedRefsRejected: true
    agentCanSelectForPlanning: true
    agentCanExecuteToolsNow: false
    routeExecutionApprovedNow: false
    workerExecutionApprovedNow: false
    toolExecutionApprovedNow: false
    providerRuntimeApprovedNow: false
    browserWebglCanvasRuntimeApprovedNow: false
    gpuRuntimeApprovedNow: false
    gpuRuntimeShouldStartNow: false
    modelWeightManifestsApprovedNow: false
    modelWeightsDownloaded: false
    modelWeightsLoaded: false
    modelInferencePerformed: false
    runtimeReadyNow: false
    internalBetaReadyNow: false
    externalBetaReadyNow: false
    productionReadyNow: false
    dependencyInstallPerformed: false
    packageLockMutationPerformed: false
    mediaProcessingPerformed: false
    supabaseMutationPerformed: false
    gcsUploadPerformed: false
    publicArtifactCreated: false
    signedUrlCreated: false
  }
}

const modelWeightManifestRequiredTools = [
  'sam2',
  'birefnet',
  'real_esrgan',
  'rembg',
  'transparent_background',
] as const satisfies readonly AiGraphicsModelWeightManifestToolId[]

function statusForInput(
  checksumAccepted: number,
  supplementsAccepted: number,
  draftsReady: number,
  reviewedManifestsAccepted: number,
  nativeGpuEligible: number,
): AiGraphicsModelWeightPrivateEvidenceIntakeStatus {
  if (checksumAccepted !== 5) return 'blocked_missing_private_checksum_evidence'
  if (supplementsAccepted !== 5) return 'blocked_missing_private_manifest_supplements'
  if (draftsReady !== 5) return 'blocked_missing_private_manifest_authoring'
  if (reviewedManifestsAccepted !== 5 || nativeGpuEligible !== 5) {
    return 'blocked_missing_reviewed_private_manifests'
  }
  return 'private_model_weight_evidence_ready_for_native_gpu_proof_not_beta_ready'
}

export function buildAiGraphicsModelWeightPrivateEvidenceIntakePacket(
  input: AiGraphicsModelWeightPrivateEvidenceIntakeInput = {},
): AiGraphicsModelWeightPrivateEvidenceIntakePacket {
  const checksumAccepted = input.checksumEvidencePacket?.checksumEvidenceRecordsAccepted ?? 0
  const supplementsAccepted = input.manifestSupplementPacket?.manifestSupplementRecordsAccepted ?? 0
  const draftsReady = input.manifestAuthoringPacket?.localPrivateManifestDraftsReady ?? 0
  const reviewedManifestsAccepted = input.manifestReviewPacket?.reviewAcceptedManifestRecords ?? 0
  const nativeGpuEligible = input.manifestReviewPacket?.nativeGpuProofInputEligibleRecords ?? 0
  const readyForNativeGpuProofInput = checksumAccepted === 5 &&
    supplementsAccepted === 5 &&
    draftsReady === 5 &&
    reviewedManifestsAccepted === 5 &&
    nativeGpuEligible === 5
  const missingEvidence = [
    checksumAccepted !== 5 ? 'private_checksum_evidence_for_all_5_model_weight_tools' : undefined,
    supplementsAccepted !== 5 ? 'private_manifest_review_supplements_for_all_5_model_weight_tools' : undefined,
    draftsReady !== 5 ? 'local_private_manifest_drafts_for_all_5_model_weight_tools' : undefined,
    reviewedManifestsAccepted !== 5 || nativeGpuEligible !== 5
      ? 'reviewed_private_manifest_records_for_all_5_model_weight_tools'
      : undefined,
  ].filter((entry): entry is string => Boolean(entry))

  return {
    decision: AI_GRAPHICS_MODEL_WEIGHT_PRIVATE_EVIDENCE_INTAKE_DECISION,
    status: statusForInput(
      checksumAccepted,
      supplementsAccepted,
      draftsReady,
      reviewedManifestsAccepted,
      nativeGpuEligible,
    ),
    totalAiGraphicsTools: 21,
    gpuRuntimeTargetedTools: 8,
    modelWeightManifestRequiredTools: [...modelWeightManifestRequiredTools],
    checksumEvidenceRecordsAccepted: checksumAccepted,
    manifestSupplementRecordsAccepted: supplementsAccepted,
    localPrivateManifestDraftsReady: draftsReady,
    reviewedPrivateManifestRecordsAccepted: reviewedManifestsAccepted,
    nativeGpuProofInputEligibleRecords: nativeGpuEligible,
    readyForNativeGpuProofInputRecords: readyForNativeGpuProofInput ? 5 : 0,
    privateArtifactRefsLogged: 0,
    betaReadyModelWeightTools: 0,
    missingEvidence,
    nextRequiredMilestones: [
      'Provide local private checksum evidence records for all five model-weight tools.',
      'Provide local private manifest review supplements for all five model-weight tools.',
      'Author local private model-weight manifests and validate them with ai-graphics:model-weight-manifest-review:validate.',
      'Run native linux/amd64 NVIDIA L4 proof only after the five reviewed private manifests are eligible for native GPU proof input.',
      'Keep GPU runtime on-demand only; no idle GPU service, model load, inference, Tool Route, Worker, beta, or production execution is approved by this intake packet.',
    ],
    booleans: {
      modelWeightPrivateEvidenceIntakePrepared: true,
      all5ModelWeightToolsCovered: true,
      checksumEvidenceAcceptedForAll5: checksumAccepted === 5,
      manifestSupplementsAcceptedForAll5: supplementsAccepted === 5,
      localPrivateManifestDraftsReadyForAll5: draftsReady === 5,
      reviewedPrivateManifestsAcceptedForAll5: reviewedManifestsAccepted === 5 && nativeGpuEligible === 5,
      readyForNativeGpuProofInput,
      nativeGpuProofStillRequired: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      privateArtifactRefsNotLogged: true,
      publicOrSignedRefsRejected: true,
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: false,
      routeExecutionApprovedNow: false,
      workerExecutionApprovedNow: false,
      toolExecutionApprovedNow: false,
      providerRuntimeApprovedNow: false,
      browserWebglCanvasRuntimeApprovedNow: false,
      gpuRuntimeApprovedNow: false,
      gpuRuntimeShouldStartNow: false,
      modelWeightManifestsApprovedNow: false,
      modelWeightsDownloaded: false,
      modelWeightsLoaded: false,
      modelInferencePerformed: false,
      runtimeReadyNow: false,
      internalBetaReadyNow: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
      dependencyInstallPerformed: false,
      packageLockMutationPerformed: false,
      mediaProcessingPerformed: false,
      supabaseMutationPerformed: false,
      gcsUploadPerformed: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
    },
  }
}
