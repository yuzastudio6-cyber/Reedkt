export const LIVING_FRAME_CONTROLLED_ILLUSTRATION_QUALIFICATION_VERSION =
  'living-frame-controlled-illustration-qualification-v2' as const
export const LIVING_FRAME_CONTROLLED_ILLUSTRATION_QUALIFICATION_SOURCE =
  'living_frame_controlled_illustration_source_requirements_only' as const
export const LIVING_FRAME_CONTROLLED_ILLUSTRATION_QUALIFICATION_STATUS =
  'evaluation_only_requirements' as const
export const LIVING_FRAME_CONTROLLED_ILLUSTRATION_QUALIFICATION_EVIDENCE_CLASS =
  'controlled_non_promotable_qualification_requirements' as const

type ValueOf<T extends readonly string[]> = T[number]

export const LIVING_FRAME_CONTROLLED_ILLUSTRATION_CANDIDATE_KEYS = [
  'comfyui',
  'comfyui_controlnet_aux',
  'controlnet',
  'ip_adapter',
  'auraface',
  'peft_lora',
] as const
export type LivingFrameControlledIllustrationCandidateKey =
  ValueOf<typeof LIVING_FRAME_CONTROLLED_ILLUSTRATION_CANDIDATE_KEYS>

export const LIVING_FRAME_CONTROLLED_ILLUSTRATION_CANDIDATE_CLASSES = [
  'execution_host_orchestrator',
  'preprocessing_bundle',
  'model_adapter_or_checkpoint_capability',
  'identity_continuity_measurement_capability',
  'training_or_loading_mechanism',
] as const
export type LivingFrameControlledIllustrationCandidateClass =
  ValueOf<typeof LIVING_FRAME_CONTROLLED_ILLUSTRATION_CANDIDATE_CLASSES>

export const LIVING_FRAME_CONTROLLED_ILLUSTRATION_ARTIFACT_FAMILIES = [
  'source_repository',
  'source_license',
  'copied_source_inventory',
  'copied_source_license_inventory',
  'package_dependency_lock',
  'container_image',
  'base_model',
  'model_checkpoint',
  'adapter_checkpoint',
  'preprocessor_checkpoint_inventory',
  'identity_dependency',
  'training_data_rights',
  'workflow_definition',
  'runtime_protocol',
  'security_configuration',
  'benchmark_fixture',
  'benchmark_result',
] as const
export type LivingFrameControlledIllustrationArtifactFamily =
  ValueOf<typeof LIVING_FRAME_CONTROLLED_ILLUSTRATION_ARTIFACT_FAMILIES>

export const LIVING_FRAME_CONTROLLED_ILLUSTRATION_REVIEW_GATE_CODES = [
  'exact_source_version_review',
  'source_license_review',
  'copied_source_inventory_review',
  'copied_source_license_review',
  'exact_artifact_inventory_review',
  'model_weight_license_review',
  'base_model_license_review',
  'commercial_use_review',
  'training_data_rights_review',
  'security_review',
  'arbitrary_node_or_code_review',
  'workflow_allowlist_review',
  'network_egress_review',
  'runtime_download_prohibition_review',
  'reproducibility_review',
  'runtime_resource_review',
  'quality_benchmark_review',
  'component_separability_review',
  'alpha_quality_review',
  'character_continuity_review',
  'pose_control_review',
  'style_control_review',
  'consent_review',
  'likeness_and_deepfake_review',
  'minor_safety_review',
  'retention_review',
  'documentary_fact_safety_review',
  'independent_verification_review',
  'canonical_registry_admission_review',
  'canonical_operation_admission_review',
  'canonical_dispatch_admission_review',
] as const
export type LivingFrameControlledIllustrationReviewGateCode =
  ValueOf<typeof LIVING_FRAME_CONTROLLED_ILLUSTRATION_REVIEW_GATE_CODES>

export const LIVING_FRAME_CONTROLLED_ILLUSTRATION_BENCHMARK_CODES = [
  'character_identity_consistency',
  'pose_compliance',
  'style_continuity',
  'component_separability',
  'fine_edge_quality',
  'alpha_destination_composite_quality',
  'deterministic_reproducibility',
  'latency',
  'gpu_memory',
  'cost_per_accepted_component',
  'repairability',
  'security_confinement',
] as const
export type LivingFrameControlledIllustrationBenchmarkCode =
  ValueOf<typeof LIVING_FRAME_CONTROLLED_ILLUSTRATION_BENCHMARK_CODES>

export const LIVING_FRAME_CONTROLLED_ILLUSTRATION_HYPOTHESIS_CODES = [
  'host_source_labels_gpl3_pending_exact_review',
  'host_custom_nodes_create_arbitrary_code_risk',
  'copied_annotator_sources_require_independent_pin_and_license',
  'downloaded_preprocessor_checkpoints_require_independent_pin_and_license',
  'source_code_and_checkpoint_terms_are_separate',
  'base_adapter_does_not_promote_faceid_variant',
  'faceid_variant_research_only_noncommercial_due_identity_dependency',
  'adapter_terms_do_not_override_base_model_terms',
  'model_card_license_label_does_not_prove_training_data_rights',
  'identity_measurement_does_not_authorize_generation_or_likeness',
  'measurement_runtime_dependencies_require_independent_qualification',
  'identity_workflow_requires_consent_likeness_and_documentary_review',
  'mechanism_terms_do_not_qualify_loaded_adapters',
] as const
export type LivingFrameControlledIllustrationHypothesisCode =
  ValueOf<typeof LIVING_FRAME_CONTROLLED_ILLUSTRATION_HYPOTHESIS_CODES>

export const LIVING_FRAME_CONTROLLED_ILLUSTRATION_IMAGE_BOUNDARY_CODES = [
  'gpt_image_2_opaque_generation_required',
  'qualified_segmentation_or_matting_required',
  'edge_decontamination_required',
  'true_alpha_artifact_required',
  'multi_background_alpha_qa_required',
  'destination_composite_qa_required',
] as const
export type LivingFrameControlledIllustrationImageBoundaryCode =
  ValueOf<typeof LIVING_FRAME_CONTROLLED_ILLUSTRATION_IMAGE_BOUNDARY_CODES>

export const LIVING_FRAME_CONTROLLED_ILLUSTRATION_VALIDATION_ISSUE_CODES = [
  'non_json_input',
  'forbidden_key',
  'schema_rejected',
  'candidate_set_invalid',
  'candidate_order_invalid',
  'candidate_class_invalid',
  'duplicate_id',
  'duplicate_value',
  'artifact_expectation_invalid',
  'artifact_family_missing',
  'review_gate_missing',
  'benchmark_expectation_invalid',
  'hypothesis_missing',
  'source_license_scope_collapsed',
  'base_model_scope_missing',
  'copied_source_scope_missing',
  'identity_safety_gate_missing',
  'deterministic_route_required',
  'image_capability_boundary_invalid',
  'qualification_promotion_forbidden',
  'authority_promotion_forbidden',
  'digest_mismatch',
  'crypto_unavailable',
  'digest_calculation_failed',
] as const
export type LivingFrameControlledIllustrationValidationIssueCode =
  ValueOf<
    typeof LIVING_FRAME_CONTROLLED_ILLUSTRATION_VALIDATION_ISSUE_CODES
  >

export interface LivingFrameControlledIllustrationArtifactExpectation {
  readonly artifactExpectationId: string
  readonly artifactFamily: LivingFrameControlledIllustrationArtifactFamily
  readonly exactVersionRequired: true
  readonly exactDigestRequired: true
  readonly independentReviewRequired: true
  readonly suppliedInQualification: false
  readonly verifiedInQualification: false
}

export interface LivingFrameControlledIllustrationBenchmarkExpectation {
  readonly benchmarkExpectationId: string
  readonly benchmarkCode: LivingFrameControlledIllustrationBenchmarkCode
  readonly measurementRequired: true
  readonly measuredInQualification: false
  readonly passedInQualification: false
}

export interface LivingFrameControlledIllustrationCandidateRequirement {
  readonly candidateRequirementId: string
  readonly candidateKey: LivingFrameControlledIllustrationCandidateKey
  readonly order: number
  readonly candidateClass: LivingFrameControlledIllustrationCandidateClass
  readonly artifactExpectations:
    readonly LivingFrameControlledIllustrationArtifactExpectation[]
  readonly reviewGateCodes:
    readonly LivingFrameControlledIllustrationReviewGateCode[]
  readonly benchmarkExpectations:
    readonly LivingFrameControlledIllustrationBenchmarkExpectation[]
  readonly hypothesisCodes:
    readonly LivingFrameControlledIllustrationHypothesisCode[]
  readonly evaluationOnly: true
  readonly installationAuthorized: false
  readonly exactVersionSelected: false
  readonly artifactManifestPresent: false
  readonly packageOrArtifactPinned: false
  readonly sourceLicenseVerified: false
  readonly copiedSourceLicenseVerified: false
  readonly modelWeightLicenseVerified: false
  readonly baseModelLicenseVerified: false
  readonly commercialUseApproved: false
  readonly securityReviewPassed: false
  readonly privacyReviewPassed: false
  readonly benchmarkMeasured: false
  readonly benchmarkPassed: false
  readonly canonicalToolIdAssigned: false
  readonly canonicalOperationIdAssigned: false
  readonly canonicalRegistryAdmitted: false
  readonly independentVerificationPassed: false
  readonly dispatchAuthorized: false
  readonly imageRouteQualified: false
  readonly productionReady: false
}

export interface LivingFrameControlledIllustrationImageCapabilityBoundary {
  readonly capabilityBoundaryCodes:
    readonly LivingFrameControlledIllustrationImageBoundaryCode[]
  readonly gptImage2TransparentOutputSupported: false
  readonly opaqueGenerationRequired: true
  readonly providerEditMaskIsProductionMatte: false
  readonly qualifiedSegmentationOrMattingRequired: true
  readonly edgeDecontaminationRequired: true
  readonly trueAlphaArtifactRequired: true
  readonly multiBackgroundQaRequired: true
  readonly destinationCompositeQaRequired: true
  readonly providerRuntimeQualified: false
  readonly imageRouteQualified: false
}

export interface LivingFrameControlledIllustrationQualificationAuthorityBoundary {
  readonly controlledSourceRequirementsOnly: true
  readonly installationAuthority: false
  readonly packageAuthority: false
  readonly containerAuthority: false
  readonly modelWeightAuthority: false
  readonly providerAuthority: false
  readonly toolRegistryAuthority: false
  readonly operationAuthority: false
  readonly dispatchAuthority: false
  readonly planningAuthority: false
  readonly selectedSceneAuthority: false
  readonly estimateAuthority: false
  readonly customerPriceAuthority: false
  readonly customerCreditAuthority: false
  readonly approvalAuthority: false
  readonly snapshotAuthority: false
  readonly workGraphAuthority: false
  readonly queueAuthority: false
  readonly assetManifestAuthority: false
  readonly costAuthority: false
  readonly qaApprovalAuthority: false
  readonly renderAuthority: false
  readonly runtimeAuthority: false
  readonly productionReady: false
}

export interface LivingFrameControlledIllustrationQualificationDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_CONTROLLED_ILLUSTRATION_QUALIFICATION_VERSION
  readonly source:
    typeof LIVING_FRAME_CONTROLLED_ILLUSTRATION_QUALIFICATION_SOURCE
  readonly status:
    typeof LIVING_FRAME_CONTROLLED_ILLUSTRATION_QUALIFICATION_STATUS
  readonly evidenceClass:
    typeof LIVING_FRAME_CONTROLLED_ILLUSTRATION_QUALIFICATION_EVIDENCE_CLASS
  readonly qualificationId: string
  readonly candidateRequirements:
    readonly LivingFrameControlledIllustrationCandidateRequirement[]
  readonly imageCapabilityBoundary:
    LivingFrameControlledIllustrationImageCapabilityBoundary
  readonly deterministicRouteRequiredForExactGraphics: true
  readonly generatedVideoIsLastResort: true
  readonly candidateSetComplete: true
  readonly authorityBoundary:
    LivingFrameControlledIllustrationQualificationAuthorityBoundary
}

export interface LivingFrameControlledIllustrationQualification
  extends LivingFrameControlledIllustrationQualificationDraft {
  readonly qualificationDigestSha256: string
}

export interface LivingFrameControlledIllustrationValidationIssue {
  readonly code: LivingFrameControlledIllustrationValidationIssueCode
  readonly path: string
}

export type LivingFrameControlledIllustrationValidationResult =
  | {
    readonly ok: true
    readonly qualification: LivingFrameControlledIllustrationQualification
    readonly issues: readonly []
  }
  | {
    readonly ok: false
    readonly issues:
      readonly LivingFrameControlledIllustrationValidationIssue[]
  }
