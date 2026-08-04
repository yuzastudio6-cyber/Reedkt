import type { ProfessionalExportExecutionAuthority } from '../../src/types/professional-export'

export const OBJECTIVE_FINAL_MASTER_QA_CONTRACT_VERSION =
  'canonical-objective-final-master-qa-contract-v1' as const
export const OBJECTIVE_FINAL_MASTER_QA_POLICY_VERSION =
  'canonical-objective-final-master-media-policy-v1' as const
export const OBJECTIVE_FINAL_MASTER_DECODED_VIDEO_EVIDENCE_PROFILE_ID =
  'approved_final_master_full_decode_integrity_v1' as const
export const OBJECTIVE_FINAL_MASTER_DECODED_AUDIO_EVIDENCE_PROFILE_ID =
  'approved_final_master_full_audio_quality_sync_v1' as const
export const OBJECTIVE_FINAL_MASTER_DECODED_VIDEO_RUNNER_CLASS =
  'offline_media_binary_final_master_video_qa_v1' as const
export const OBJECTIVE_FINAL_MASTER_DECODED_AUDIO_RUNNER_CLASS =
  'offline_media_binary_final_master_audio_qa_v1' as const

export const OBJECTIVE_FINAL_MASTER_QA_GATE_IDS = [
  'technical_media_contract',
  'decoded_video_integrity',
  'decoded_audio_quality_sync',
  'master_timing_layer_reconciliation',
  'cross_chunk_color_continuity',
  'private_artifact_integrity',
] as const

export type ObjectiveFinalMasterQaGateId =
  typeof OBJECTIVE_FINAL_MASTER_QA_GATE_IDS[number]

export interface ObjectiveFinalMasterQaIdentity {
  ownerUserId: string
  workspaceId: string
  projectId: string
  editSessionId: string
  approvedPlanId: string
  approvedPlanSnapshotId: string
  approvedPlanSnapshotHash: string
  approvedExecutionPackageHash: string
}

export interface ObjectiveFinalMasterQaApprovalAuthority {
  approvedEstimateId: string
  creditReservationId: string
  approvedDeliverableId: string
  creditReservationStatus: 'reserved'
  exportAuthority: ProfessionalExportExecutionAuthority
  exportCoveredByOriginalApprovedEstimate: true
  exportTimeEstimateAllowed: false
  exportTimeCustomerChargeAllowed: false
}

export interface ObjectiveFinalMasterArtifactIdentity {
  artifactId: string
  artifactType: 'private_approved_delivery_master_v1'
  contentType: 'video/mp4'
  sha256: string
  byteLength: number
  storageKind: 'private_local_test' | 'private_gcs_test'
  opaqueObjectIdentityHash: string
  providerGeneration: string | null
  privateObject: true
  placeholder: false
  publicObject: false
}

export interface ObjectiveFinalMasterTimingAuthority {
  masterTimingArtifactId: string
  masterTimingArtifactHash: string
  sourceSequenceHash: string
  requiredLayerManifestHash: string
  durationFrames: number
  frameRateNumerator: number
  frameRateDenominator: number
  expectedChunkCount: number
  captionTrackRequired: boolean
  captionTrackHash: string | null
  approvedVisualExceptionManifestHash: string
  approvedAudioExceptionManifestHash: string
  approvedColorExceptionManifestHash: string
}

export interface ObjectiveFinalMasterAudioPolicy {
  policyId: 'approved_web_delivery_audio_policy_v1'
  targetIntegratedLufs: number
  integratedLufsTolerance: number
  maximumTruePeakDbtp: number
  maximumLoudnessRangeLufs: number
  maximumAvSyncDriftFrames: 2
  speechClarityRequired: true
}

export interface ObjectiveFinalMasterExecutionAuthority {
  finalMasterWorkItemId: string
  finalMasterJobId: string
  finalMasterExecutionAttemptId: string
  finalMasterLeaseId: string
  finalMasterDispatchGrantId: string
  finalMasterRunnerEvidenceHash: string
  finalMasterAttemptCostEvidenceHash: string
  finalMasterArtifactQaEvaluationHash: string
  finalMasterArtifactReconciliationHash: string
}

export interface ObjectiveFinalMasterQaCommercialBoundary {
  internalProductionCostOnly: true
  customerPriceAuthorityIncluded: false
  customerCreditAuthorityIncluded: false
  serviceFeeAuthorityIncluded: false
  customerChargeCreated: false
  walletMutationAuthorized: false
  billingAuthorized: false
}

export interface ObjectiveFinalMasterQaGateCommon {
  schemaVersion: 'objective-final-master-qa-gate-evidence-v1'
  gateId: ObjectiveFinalMasterQaGateId
  evidenceId: string
  evidenceProfileId: string
  evidenceArtifactHash: string
  qaRunId: string
  approvedPlanSnapshotId: string
  approvedExecutionPackageHash: string
  sourceMasterArtifactId: string
  sourceMasterSha256: string
  executionAttemptId: string
  runnerClass: string
  toolId: 'ffmpeg' | 'ffprobe' | 'internal'
  operationId: string
  runtimeImageIdentityHash: string
  executionEnvironment: 'private_local_test' | 'private_gcp_internal'
  cloudExecutionResourceHash: string | null
  internalCostEvidenceSetHash: string
  outcome: 'passed' | 'failed' | 'needs_user_review'
  evaluatedAt: string
  commercialBoundary: ObjectiveFinalMasterQaCommercialBoundary
  providerCallMade: false
  evidenceHash: string
}

export interface ObjectiveTechnicalMediaContractEvidence
  extends ObjectiveFinalMasterQaGateCommon {
  gateId: 'technical_media_contract'
  evidenceProfileId: 'independent_ffprobe_final_export_v1'
  toolId: 'ffprobe'
  operationId: 'tool.ffprobe.inspect_approved_media.v1'
  runnerClass: 'offline_media_binary_execution_v1'
  metrics: {
    independentFfprobeExecuted: boolean
    inspectionProfileId: 'final_export_v1'
    binaryVersion: string
    container: string
    videoStreamCount: number
    videoCodecName: string
    pixelFormat: string
    colorSpace: string
    colorTransfer: string
    colorPrimaries: string
    colorRange: string
    width: number
    height: number
    frameRateNumerator: number
    frameRateDenominator: number
    frameCount: number
    audioStreamCount: number
    audioCodecName: string
    audioSampleRate: number
    audioChannels: number
    durationDriftFrames: number
    maximumDurationDriftFrames: number
  }
}

export interface ObjectiveDecodedVideoIntegrityEvidence
  extends ObjectiveFinalMasterQaGateCommon {
  gateId: 'decoded_video_integrity'
  evidenceProfileId:
    typeof OBJECTIVE_FINAL_MASTER_DECODED_VIDEO_EVIDENCE_PROFILE_ID
  toolId: 'ffmpeg'
  operationId: 'tool.ffmpeg.execute_approved_media_recipe.v1'
  runnerClass: typeof OBJECTIVE_FINAL_MASTER_DECODED_VIDEO_RUNNER_CLASS
  metrics: {
    fullFrameDecodeCompleted: boolean
    firstDecodedFrame: number
    lastDecodedFrame: number
    decodedFrameCount: number
    decodeErrorCount: number
    nonMonotonicTimestampCount: number
    unexpectedBlackFrameCount: number
    unexpectedFreezeFrameCount: number
    unexpectedFlashFrameCount: number
    approvedVisualExceptionManifestHash: string
    fullFrameCoverage: boolean
  }
}

export interface ObjectiveDecodedAudioQualitySyncEvidence
  extends ObjectiveFinalMasterQaGateCommon {
  gateId: 'decoded_audio_quality_sync'
  evidenceProfileId:
    typeof OBJECTIVE_FINAL_MASTER_DECODED_AUDIO_EVIDENCE_PROFILE_ID
  toolId: 'ffmpeg'
  operationId: 'tool.ffmpeg.execute_approved_media_recipe.v1'
  runnerClass: typeof OBJECTIVE_FINAL_MASTER_DECODED_AUDIO_RUNNER_CLASS
  metrics: {
    fullProgramAudioDecodeCompleted: boolean
    sampleRate: number
    channels: number
    decodedSampleFrameCount: number
    integratedLufs: number | 'negative_infinity'
    truePeakDbtp: number | 'negative_infinity'
    loudnessRangeLufs: number | 'negative_infinity'
    avSyncDriftFrames: number
    unexpectedClippedSampleCount: number
    unexpectedDigitalSilenceFrameCount: number
    approvedAudioExceptionManifestHash: string
    speechClarityGatePassed: boolean
  }
}

export interface ObjectiveMasterTimingLayerEvidence
  extends ObjectiveFinalMasterQaGateCommon {
  gateId: 'master_timing_layer_reconciliation'
  evidenceProfileId: 'approved_final_master_timing_layer_reconciliation_v1'
  toolId: 'internal'
  operationId: 'internal.reconcile_approved_final_master_timing_layers.v1'
  runnerClass: 'canonical_objective_final_master_timing_qa_runner_v1'
  metrics: {
    masterTimingArtifactHash: string
    sourceSequenceHash: string
    requiredLayerManifestHash: string
    captionTrackHash: string | null
    durationFrames: number
    gapFrameCount: number
    overlapFrameCount: number
    missingRequiredLayerCount: number
    finalPlaceholderCount: number
    captionCollisionCount: number
    fullFrameCoverage: boolean
    approvedSourceOrderPreserved: boolean
  }
}

export interface ObjectiveCrossChunkColorEvidence
  extends ObjectiveFinalMasterQaGateCommon {
  gateId: 'cross_chunk_color_continuity'
  evidenceProfileId: 'approved_final_master_cross_chunk_color_continuity_v1'
  toolId: 'internal'
  operationId: 'internal.reconcile_approved_final_master_color_continuity.v1'
  runnerClass: 'canonical_objective_final_master_color_qa_aggregator_v1'
  metrics: {
    chunkCount: number
    expectedBoundaryCount: number
    passedBoundaryCount: number
    failedBoundaryCount: number
    continuityEvidenceSetHash: string
    approvedColorExceptionManifestHash: string
    allBoundariesAccountedFor: boolean
  }
}

export interface ObjectivePrivateArtifactIntegrityEvidence
  extends ObjectiveFinalMasterQaGateCommon {
  gateId: 'private_artifact_integrity'
  evidenceProfileId: 'approved_final_master_private_artifact_reconciliation_v1'
  toolId: 'internal'
  operationId: 'internal.verify_private_final_master_artifact_reconciliation.v1'
  runnerClass: 'canonical_objective_final_master_artifact_qa_runner_v1'
  metrics: {
    reopenedSha256: string
    reopenedByteLength: number
    opaqueObjectIdentityHash: string
    artifactQaEvaluationHash: string
    artifactReconciliationHash: string
    createOnlyPersistenceVerified: boolean
    privateReadbackVerified: boolean
    publicUrlIssued: boolean
    overwriteOccurred: boolean
  }
}

export type ObjectiveFinalMasterQaGateEvidence =
  | ObjectiveTechnicalMediaContractEvidence
  | ObjectiveDecodedVideoIntegrityEvidence
  | ObjectiveDecodedAudioQualitySyncEvidence
  | ObjectiveMasterTimingLayerEvidence
  | ObjectiveCrossChunkColorEvidence
  | ObjectivePrivateArtifactIntegrityEvidence

export type ObjectiveFinalMasterQaGateEvidenceWithoutHash =
  ObjectiveFinalMasterQaGateEvidence extends infer Gate
    ? Gate extends ObjectiveFinalMasterQaGateEvidence
      ? Omit<Gate, 'evidenceHash'>
      : never
    : never

export interface CanonicalObjectiveFinalMasterQaInput {
  schemaVersion: typeof OBJECTIVE_FINAL_MASTER_QA_CONTRACT_VERSION
  policyVersion: typeof OBJECTIVE_FINAL_MASTER_QA_POLICY_VERSION
  qaRunId: string
  idempotencyKey: string
  identity: ObjectiveFinalMasterQaIdentity
  approval: ObjectiveFinalMasterQaApprovalAuthority
  artifact: ObjectiveFinalMasterArtifactIdentity
  timing: ObjectiveFinalMasterTimingAuthority
  audioPolicy: ObjectiveFinalMasterAudioPolicy
  execution: ObjectiveFinalMasterExecutionAuthority
  gateEvidence: ObjectiveFinalMasterQaGateEvidence[]
}

export interface CanonicalObjectiveFinalMasterQaResult {
  schemaVersion: 'canonical-objective-final-master-qa-result-v1'
  qaRunId: string
  approvedPlanSnapshotId: string
  artifactId: string
  artifactSha256: string
  manifestHash: string
  evidenceSetHash: string
  contractValid: boolean
  objectiveMediaQaPassed: boolean
  privateReviewObjectiveMediaEligible: boolean
  blockers: string[]
  gateOutcomes: Array<{
    gateId: ObjectiveFinalMasterQaGateId
    outcome: 'passed' | 'failed' | 'needs_user_review' | 'missing'
    evidenceHash: string | null
  }>
  boundaries: {
    contractEvaluationOnly: true
    mediaReadMade: false
    toolExecutionMade: false
    providerCallMade: false
    googleCloudDispatchMade: false
    artifactWriteMade: false
    publicDeliveryUnlocked: false
    customerPriceCalculated: false
    customerCreditsCalculated: false
    customerChargeCreated: false
    walletMutationMade: false
    serviceFeeIncluded: false
    semanticIntentQaIncluded: false
    editPreferenceComplianceIncluded: false
    copySafetyQaIncluded: false
    productReady: false
    productionReady: false
  }
}
