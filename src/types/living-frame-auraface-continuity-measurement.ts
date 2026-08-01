export const LIVING_FRAME_AURAFACE_CONTINUITY_MEASUREMENT_VERSION =
  'living-frame-auraface-continuity-measurement-v1' as const

export const LIVING_FRAME_AURAFACE_CONTINUITY_MEASUREMENT_CLASS =
  'private_controlled_non_promotable_auraface_cosine_measurement' as const

export const LIVING_FRAME_AURAFACE_CONTINUITY_MEASUREMENT_EVIDENCE_CLASSES = [
  'controlled_non_promotable_embedding_fixture',
  'private_internal_auraface_cpu_embedding_observation_unreleased',
] as const

export type LivingFrameAuraFaceContinuityMeasurementEvidenceClass =
  (typeof
    LIVING_FRAME_AURAFACE_CONTINUITY_MEASUREMENT_EVIDENCE_CLASSES)[number]

export const LIVING_FRAME_AURAFACE_CONTINUITY_MEASUREMENT_OPEN_GATES = [
  'current_model_artifact_repository_and_mount_reread_required',
  'exact_auraface_cpu_inference_operation_required',
  'detector_alignment_embedding_compatibility_benchmark_required',
  'consent_likeness_minor_and_documentary_safety_admission_required',
  'embedding_retention_deletion_and_access_policy_required',
  'project_threshold_calibration_and_fairness_review_required',
  'canonical_attempt_completion_and_actual_cost_evidence_required',
  'selected_scene_continuity_qa_and_private_review_required',
] as const

export type LivingFrameAuraFaceContinuityMeasurementOpenGate =
  (typeof
    LIVING_FRAME_AURAFACE_CONTINUITY_MEASUREMENT_OPEN_GATES)[number]

export const LIVING_FRAME_AURAFACE_CONTINUITY_MEASUREMENT_ISSUES = [
  'input_invalid',
  'artifact_requirements_invalid',
  'reader_invalid',
  'reader_reused',
  'reader_failed',
  'reader_lineage_invalid',
  'packet_invalid',
  'packet_lineage_invalid',
  'face_count_invalid',
  'embedding_type_invalid',
  'embedding_buffer_forbidden',
  'embedding_dimension_invalid',
  'embedding_value_invalid',
  'embedding_zero_norm',
  'measurement_invalid',
  'privacy_boundary_invalid',
  'cost_boundary_invalid',
  'authority_promotion_forbidden',
  'unsafe_result_forbidden',
  'digest_mismatch',
] as const

export type LivingFrameAuraFaceContinuityMeasurementIssueCode =
  (typeof
    LIVING_FRAME_AURAFACE_CONTINUITY_MEASUREMENT_ISSUES)[number]

export interface LivingFrameAuraFaceContinuityMeasurementAuthority {
  readonly processBoundEmbeddingReadAuthority: true
  readonly controlledVectorMathAuthority: true
  readonly liveInferenceAuthority: false
  readonly modelArtifactAuthority: false
  readonly operationAuthority: false
  readonly providerAuthority: false
  readonly dispatchAuthority: false
  readonly workerCompletionAuthority: false
  readonly actualCostAuthority: false
  readonly customerPriceAuthority: false
  readonly customerCreditAuthority: false
  readonly serviceFeeAuthority: false
  readonly consentAuthority: false
  readonly identityVerificationAuthority: false
  readonly likenessApprovalAuthority: false
  readonly planningAuthority: false
  readonly selectedSceneAuthority: false
  readonly timingAuthority: false
  readonly soundAuthority: false
  readonly estimateAuthority: false
  readonly approvalAuthority: false
  readonly snapshotAuthority: false
  readonly workItemAuthority: false
  readonly workGraphAuthority: false
  readonly queueAuthority: false
  readonly assetManifestAuthority: false
  readonly qaApprovalAuthority: false
  readonly renderAuthority: false
  readonly runtimeAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameAuraFaceContinuityMeasurementDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_AURAFACE_CONTINUITY_MEASUREMENT_VERSION
  readonly resultClass:
    typeof LIVING_FRAME_AURAFACE_CONTINUITY_MEASUREMENT_CLASS
  readonly evidenceClass:
    LivingFrameAuraFaceContinuityMeasurementEvidenceClass
  readonly measurementId: string
  readonly sourceBindings: {
    readonly artifactRequirementSetDigestSha256: string
    readonly readerBindingDigestSha256: string
    readonly referenceArtifactDigestSha256: string
    readonly candidateArtifactDigestSha256: string
    readonly referenceContinuityEntryDigestSha256: string
    readonly candidateContinuityEntryDigestSha256: string
    readonly preprocessingSpecDigestSha256: string
    readonly referenceInferenceOutputDigestSha256: string
    readonly candidateInferenceOutputDigestSha256: string
  }
  readonly measurement: {
    readonly metric: 'cosine_similarity'
    readonly embeddingDimension: 512
    readonly scoreScale: 1_000_000
    readonly scorePpm: number
    readonly minimumScorePpm: -1_000_000
    readonly maximumScorePpm: 1_000_000
    readonly referenceFaceCount: 1
    readonly candidateFaceCount: 1
    readonly normalizedBeforeComparison: true
    readonly callerThresholdAccepted: false
    readonly thresholdApplied: false
    readonly universalThresholdAllowed: false
    readonly projectCalibratedThresholdRequired: true
    readonly outcome:
      'measurement_only_project_calibration_and_user_review_required'
    readonly identityOrLikenessApproved: false
    readonly canonicalIllustrativeInterpretationRemainsIllustrative:
      true
  }
  readonly privacyBoundary: {
    readonly privateServerOnly: true
    readonly browserShareable: false
    readonly rawImagesIncluded: false
    readonly embeddingsIncluded: false
    readonly embeddingBytesSerializable: false
    readonly embeddingPersistenceAuthorized: false
    readonly identityReferencePersistenceAuthorized: false
    readonly measurementPersistenceAuthorized: false
    readonly sensitiveMeasurementEvidence: true
  }
  readonly costLineage: {
    readonly separateCpuMeasurementAttemptExpected: true
    readonly excludedFromSharedComfyuiGpuAttempt: true
    readonly exactReuseAddsNoAttempt: true
    readonly actualAttemptCostOwnedByExistingToolCostAuthority:
      true
    readonly failedOrUnknownAttemptCostMustBeRetained: true
    readonly costAmountIncluded: false
    readonly customerPriceOrCreditIncluded: false
    readonly serviceFeeIncluded: false
  }
  readonly openGateCodes:
    readonly LivingFrameAuraFaceContinuityMeasurementOpenGate[]
  readonly authorityBoundary:
    LivingFrameAuraFaceContinuityMeasurementAuthority
  readonly processBoundReaderConsumedExactlyOnce: true
  readonly controlledFixtureVectorsCompared: boolean
  readonly privateRuntimeVectorsComparedUnreleased: boolean
  readonly liveInferenceExecuted: false
  readonly continuityDecisionCreated: false
  readonly containsEmbeddingImagePathUrlCredentialOrIdentityReference:
    false
  readonly containsPriceCreditServiceFeeReservationWalletOrLedgerData:
    false
  readonly subjectSpecificRouting: false
  readonly productionReady: false
}

export interface LivingFrameAuraFaceContinuityMeasurement
  extends LivingFrameAuraFaceContinuityMeasurementDraft {
  readonly measurementDigestSha256: string
}

export interface LivingFrameAuraFaceContinuityMeasurementIssue {
  readonly code:
    LivingFrameAuraFaceContinuityMeasurementIssueCode
  readonly path: string
}
