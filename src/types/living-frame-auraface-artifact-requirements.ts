export const LIVING_FRAME_AURAFACE_ARTIFACT_REQUIREMENTS_VERSION =
  'living-frame-auraface-artifact-requirements-v1' as const

export const LIVING_FRAME_AURAFACE_ARTIFACT_REQUIREMENTS_CLASS =
  'controlled_non_promotable_exact_auraface_measurement_artifact_expectation' as const

export const LIVING_FRAME_AURAFACE_ARTIFACT_REQUIREMENT_IDS = [
  'auraface_v1_embedding_model',
  'auraface_v1_face_detector',
] as const

export type LivingFrameAuraFaceArtifactRequirementId =
  (typeof LIVING_FRAME_AURAFACE_ARTIFACT_REQUIREMENT_IDS)[number]

export const LIVING_FRAME_AURAFACE_ARTIFACT_REQUIREMENTS_OPEN_GATES = [
  'exact_upstream_artifact_metadata_reread_required',
  'artifact_bytes_ingest_and_repository_verification_required',
  'weight_origin_and_training_data_rights_review_required',
  'insightface_runtime_and_preprocessing_license_review_required',
  'onnxruntime_dependency_lock_and_security_review_required',
  'detector_embedding_compatibility_benchmark_required',
  'consent_likeness_minor_and_documentary_safety_policy_required',
  'embedding_retention_deletion_and_access_policy_required',
  'demographic_fairness_and_project_threshold_calibration_required',
  'private_cpu_runtime_and_confinement_qualification_required',
  'canonical_operation_dispatch_attempt_and_cost_authority_required',
  'selected_scene_continuity_qa_and_private_review_required',
] as const

export type LivingFrameAuraFaceArtifactRequirementsOpenGate =
  (typeof
    LIVING_FRAME_AURAFACE_ARTIFACT_REQUIREMENTS_OPEN_GATES)[number]

export const LIVING_FRAME_AURAFACE_ARTIFACT_REQUIREMENTS_ISSUES = [
  'input_invalid',
  'qualification_invalid',
  'source_observation_invalid',
  'auraface_candidate_missing',
  'source_lineage_invalid',
  'artifact_requirement_invalid',
  'artifact_order_invalid',
  'gate_set_invalid',
  'measurement_scope_invalid',
  'safety_boundary_invalid',
  'cost_boundary_invalid',
  'authority_promotion_forbidden',
  'unsafe_payload_forbidden',
  'digest_mismatch',
] as const

export type LivingFrameAuraFaceArtifactRequirementsIssueCode =
  (typeof
    LIVING_FRAME_AURAFACE_ARTIFACT_REQUIREMENTS_ISSUES)[number]

export interface LivingFrameAuraFaceArtifactRequirementsAuthority {
  readonly controlledArtifactRequirementAuthority: true
  readonly currentSourceAuthority: false
  readonly legalReviewAuthority: false
  readonly trainingDataRightsAuthority: false
  readonly consentAuthority: false
  readonly modelArtifactIngestAuthority: false
  readonly modelArtifactMountAuthority: false
  readonly packageAuthority: false
  readonly operationAuthority: false
  readonly providerAuthority: false
  readonly dispatchAuthority: false
  readonly workerCompletionAuthority: false
  readonly actualCostAuthority: false
  readonly customerPriceAuthority: false
  readonly customerCreditAuthority: false
  readonly serviceFeeAuthority: false
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
  readonly identityApprovalAuthority: false
  readonly qaApprovalAuthority: false
  readonly renderAuthority: false
  readonly runtimeAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameAuraFaceArtifactRequirement {
  readonly canonicalOrder: 0 | 1
  readonly requirementId:
    LivingFrameAuraFaceArtifactRequirementId
  readonly sourceLocatorCode: 'hf_fal_auraface_v1'
  readonly sourceRevision:
    'af6d057c9b0ec4071d4c49c80e3539258798b609'
  readonly artifactIdentityCode:
    | 'glintr100_onnx'
    | 'scrfd_10g_bnkps_onnx'
  readonly artifactFormat: 'onnx'
  readonly artifactRole:
    | 'face_embedding_measurement'
    | 'face_detection_and_landmark_alignment'
  readonly modelFamily:
    | 'auraface_v1_glintr100'
    | 'auraface_v1_scrfd_10g_bnkps'
  readonly byteLength: 260_694_151 | 16_923_827
  readonly contentSha256:
    | 'a7933ea5330113b01c9b60351d8f4c33003f145d8470ac5f0e52ee2effe25c60'
    | '5838f7fe053675b1c7a08b633df49e7af5495cee0493c7dcf6697200b85b5b91'
  readonly consumerScope:
    'living-frame.auraface-continuity-measurement'
  readonly executionClass: 'cpu_permitted'
  readonly requiredExecutionTarget: 'private_controlled_cpu'
  readonly accelerator: 'none'
  readonly cpuFallbackAllowed: false
  readonly runtimeDownloadAllowed: false
  readonly networkFetchAllowed: false
  readonly exactBytesFetched: false
  readonly exactBytesIndependentlyVerified: false
  readonly modelArtifactIngested: false
  readonly requirementDigestSha256: string
}

export interface LivingFrameAuraFaceArtifactRequirementsDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_AURAFACE_ARTIFACT_REQUIREMENTS_VERSION
  readonly resultClass:
    typeof LIVING_FRAME_AURAFACE_ARTIFACT_REQUIREMENTS_CLASS
  readonly requirementSetId:
    'living-frame.auraface-v1.continuity-measurement.candidate'
  readonly sourceBindings: {
    readonly controlledIllustrationQualificationDigestSha256: string
    readonly controlledSourceObservationPacketId: string
    readonly controlledSourceObservationDigestSha256: string
    readonly sourceLocatorCode: 'hf_fal_auraface_v1'
    readonly sourceRevision:
      'af6d057c9b0ec4071d4c49c80e3539258798b609'
    readonly sourceObservedOnDate: '2026-07-28'
    readonly modelCardDigestSha256:
      '106272348689716d3c159ff16ec42e5f36aafebca591b3678b375f8aa2d12cde'
    readonly licenseDocumentDigestSha256:
      'c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4'
    readonly declaredLicenseLabelObservation:
      'apache_2_0_source_label'
    readonly sourceObservationIsCurrentTruth: false
    readonly legalOrCommercialConclusionProvided: false
  }
  readonly artifacts:
    readonly [
      LivingFrameAuraFaceArtifactRequirement,
      LivingFrameAuraFaceArtifactRequirement,
    ]
  readonly bundleSummary: {
    readonly artifactCount: 2
    readonly totalByteLength: 277_617_978
    readonly embeddingModelCount: 1
    readonly detectorModelCount: 1
    readonly genderOrAgeModelIncluded: false
    readonly identityGenerationAdapterIncluded: false
    readonly measurementOnly: true
  }
  readonly measurementPolicy: {
    readonly capabilityKey: 'auraface'
    readonly placement: 'post_generation_cpu_continuity_qa'
    readonly purpose:
      'compare_approved_reference_and_candidate_face_embeddings'
    readonly mayGenerateOrConditionIdentity: false
    readonly mayApproveLikenessOrHistoricalIdentity: false
    readonly canonicalIllustrativeInterpretationRemainsIllustrative:
      true
    readonly noFaceOrMultipleFacesRequiresUserReview: true
    readonly projectCalibratedThresholdRequired: true
    readonly universalSimilarityThresholdAllowed: false
    readonly embeddingBytesSerializable: false
    readonly embeddingPersistenceAllowed: false
    readonly identityReferencePersistenceAllowed: false
  }
  readonly safetyPolicy: {
    readonly explicitConsentRequiredForRealPersonReference: true
    readonly publicFigureAndDocumentarySafetyReviewRequired: true
    readonly minorProtectionRequired: true
    readonly impersonationAndDeepfakeSafeguardsRequired: true
    readonly retentionAndDeletionPolicyRequired: true
    readonly demographicFairnessReviewRequired: true
    readonly provenanceAndTrainingDataRightsUnresolved: true
    readonly paidProductionUseApproved: false
  }
  readonly costLineage: {
    readonly separateCpuContinuityMeasurementAttempt: true
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
    readonly LivingFrameAuraFaceArtifactRequirementsOpenGate[]
  readonly authorityBoundary:
    LivingFrameAuraFaceArtifactRequirementsAuthority
  readonly controlledSourceObservationRevalidated: true
  readonly exactArtifactIdentityObservationOnly: true
  readonly artifactRepositoryLocatorCreated: false
  readonly artifactIngested: false
  readonly operationRegistered: false
  readonly runtimeExecuted: false
  readonly continuityMeasurementCreated: false
  readonly containsUrlPathCredentialBytesEmbeddingOrIdentityReference:
    false
  readonly containsPriceCreditServiceFeeReservationWalletOrLedgerData:
    false
  readonly subjectSpecificRouting: false
  readonly productionReady: false
}

export interface LivingFrameAuraFaceArtifactRequirements
  extends LivingFrameAuraFaceArtifactRequirementsDraft {
  readonly requirementSetDigestSha256: string
}

export interface LivingFrameAuraFaceArtifactRequirementsIssue {
  readonly code:
    LivingFrameAuraFaceArtifactRequirementsIssueCode
  readonly path: string
}
