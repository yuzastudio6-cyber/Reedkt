import type {
  LivingFrameControlledIllustrationArtifactFamily,
  LivingFrameControlledIllustrationCandidateClass,
  LivingFrameControlledIllustrationCandidateKey,
  LivingFrameControlledIllustrationReviewGateCode,
} from './living-frame-controlled-illustration-qualification'

export const LIVING_FRAME_CONTROLLED_ILLUSTRATION_SOURCE_OBSERVATION_VERSION =
  'living-frame-controlled-illustration-source-observation-v1' as const
export const LIVING_FRAME_CONTROLLED_ILLUSTRATION_SOURCE_OBSERVATION_SOURCE =
  'living_frame_controlled_illustration_upstream_observation_only' as const
export const LIVING_FRAME_CONTROLLED_ILLUSTRATION_SOURCE_OBSERVATION_STATUS =
  'controlled_source_observation' as const
export const LIVING_FRAME_CONTROLLED_ILLUSTRATION_SOURCE_OBSERVATION_EVIDENCE_CLASS =
  'controlled_non_promotable_upstream_source_observation' as const

type ValueOf<T extends readonly string[]> = T[number]

export const LIVING_FRAME_CONTROLLED_ILLUSTRATION_SOURCE_LOCATOR_CODES = [
  'github_comfy_org_comfyui',
  'github_fannovel16_comfyui_controlnet_aux',
  'github_lllyasviel_controlnet',
  'hf_lllyasviel_controlnet_v1_1',
  'github_tencent_ailab_ip_adapter',
  'hf_h94_ip_adapter',
  'hf_h94_ip_adapter_faceid',
  'github_to_the_beginning_pulid',
  'hf_guozinan_pulid',
  'hf_black_forest_labs_flux_1_dev',
  'github_deepinsight_insightface',
  'github_huggingface_peft',
] as const
export type LivingFrameControlledIllustrationSourceLocatorCode =
  ValueOf<
    typeof LIVING_FRAME_CONTROLLED_ILLUSTRATION_SOURCE_LOCATOR_CODES
  >

export const LIVING_FRAME_CONTROLLED_ILLUSTRATION_SOURCE_CLASSES = [
  'source_repository',
  'model_repository',
] as const
export type LivingFrameControlledIllustrationSourceClass =
  ValueOf<typeof LIVING_FRAME_CONTROLLED_ILLUSTRATION_SOURCE_CLASSES>

export const LIVING_FRAME_CONTROLLED_ILLUSTRATION_DOCUMENT_CLASSES = [
  'source_license',
  'model_card',
] as const
export type LivingFrameControlledIllustrationDocumentClass =
  ValueOf<typeof LIVING_FRAME_CONTROLLED_ILLUSTRATION_DOCUMENT_CLASSES>

export const LIVING_FRAME_CONTROLLED_ILLUSTRATION_DOCUMENT_PATH_CODES = [
  'license_file',
  'license_txt_file',
  'readme_model_card',
] as const
export type LivingFrameControlledIllustrationDocumentPathCode =
  ValueOf<typeof LIVING_FRAME_CONTROLLED_ILLUSTRATION_DOCUMENT_PATH_CODES>

export const LIVING_FRAME_CONTROLLED_ILLUSTRATION_DECLARED_LABEL_OBSERVATIONS = [
  'gpl_3_0_source_label',
  'apache_2_0_source_label',
  'openrail_model_card_label',
  'research_only_noncommercial_model_card_statement',
  'gated_other_license_model_card',
] as const
export type LivingFrameControlledIllustrationDeclaredLabelObservation =
  ValueOf<
    typeof LIVING_FRAME_CONTROLLED_ILLUSTRATION_DECLARED_LABEL_OBSERVATIONS
  >

export const LIVING_FRAME_CONTROLLED_ILLUSTRATION_OBSERVATION_DISPOSITIONS = [
  'candidate_source_only',
  'dependency_scope_unresolved',
  'noncommercial_route_blocked',
  'mechanism_only_no_loaded_artifact',
] as const
export type LivingFrameControlledIllustrationObservationDisposition =
  ValueOf<
    typeof LIVING_FRAME_CONTROLLED_ILLUSTRATION_OBSERVATION_DISPOSITIONS
  >

export const LIVING_FRAME_CONTROLLED_ILLUSTRATION_DEPENDENCY_SCOPE_RULE_CODES = [
  'aux_copied_annotators_require_independent_admission',
  'aux_checkpoints_require_independent_admission',
  'controlnet_code_weights_and_base_model_are_separate',
  'ip_adapter_generic_does_not_promote_faceid',
  'faceid_insightface_route_is_noncommercial_blocked',
  'pulid_adapter_does_not_promote_flux_base_model',
  'pulid_insightface_identity_dependency_is_unresolved',
  'peft_does_not_qualify_loaded_adapter_data_or_base_model',
] as const
export type LivingFrameControlledIllustrationDependencyScopeRuleCode =
  ValueOf<
    typeof LIVING_FRAME_CONTROLLED_ILLUSTRATION_DEPENDENCY_SCOPE_RULE_CODES
  >

export const LIVING_FRAME_CONTROLLED_ILLUSTRATION_SOURCE_OBSERVATION_ISSUE_CODES = [
  'non_json_input',
  'forbidden_key',
  'unsafe_text',
  'schema_rejected',
  'qualification_invalid',
  'qualification_digest_mismatch',
  'candidate_set_invalid',
  'candidate_order_invalid',
  'candidate_class_invalid',
  'candidate_disposition_invalid',
  'duplicate_id',
  'duplicate_value',
  'source_set_invalid',
  'source_order_invalid',
  'source_scope_invalid',
  'source_revision_invalid',
  'observation_date_invalid',
  'document_set_invalid',
  'document_order_invalid',
  'document_scope_invalid',
  'document_digest_invalid',
  'artifact_scope_invalid',
  'review_gate_scope_invalid',
  'dependency_rule_set_invalid',
  'dependency_scope_collapse_forbidden',
  'faceid_promotion_forbidden',
  'pulid_flux_promotion_forbidden',
  'loaded_adapter_promotion_forbidden',
  'observation_promotion_forbidden',
  'authority_promotion_forbidden',
  'digest_mismatch',
  'crypto_unavailable',
  'digest_calculation_failed',
] as const
export type LivingFrameControlledIllustrationSourceObservationIssueCode =
  ValueOf<
    typeof LIVING_FRAME_CONTROLLED_ILLUSTRATION_SOURCE_OBSERVATION_ISSUE_CODES
  >

export interface LivingFrameControlledIllustrationDocumentObservation {
  readonly documentObservationId: string
  readonly order: number
  readonly documentClass: LivingFrameControlledIllustrationDocumentClass
  readonly relativeDocumentPathCode:
    LivingFrameControlledIllustrationDocumentPathCode
  readonly observedContentDigestSha256: string
  readonly declaredLabelObservation:
    LivingFrameControlledIllustrationDeclaredLabelObservation
  readonly observedOnDate: string
  readonly controlledDocumentObservationOnly: true
  readonly independentSourceReReadRequired: true
  readonly currentTruthAuthority: false
  readonly releasedEvidence: false
  readonly legalInterpretationProvided: false
  readonly commercialApprovalProvided: false
  readonly redistributionApprovalProvided: false
  readonly modelWeightApprovalProvided: false
}

export interface LivingFrameControlledIllustrationUpstreamSourceObservation {
  readonly sourceObservationId: string
  readonly order: number
  readonly sourceLocatorCode:
    LivingFrameControlledIllustrationSourceLocatorCode
  readonly sourceClass: LivingFrameControlledIllustrationSourceClass
  readonly observedImmutableRevisionSha1: string
  readonly observedOnDate: string
  readonly declaredDocumentObservations:
    readonly LivingFrameControlledIllustrationDocumentObservation[]
  readonly controlledSourceObservationOnly: true
  readonly independentSourceReReadRequired: true
  readonly currentSourceAuthority: false
  readonly releasedEvidence: false
  readonly artifactBytesFetched: false
  readonly artifactChecksumIndependentlyVerified: false
  readonly sourceLicenseLegallyReviewed: false
  readonly commercialUseApproved: false
  readonly redistributionApproved: false
  readonly canonicalModelWeightManifestApproved: false
  readonly installationAuthorized: false
  readonly dispatchAuthorized: false
  readonly runtimeAuthorized: false
  readonly productionReady: false
}

export interface LivingFrameControlledIllustrationCandidateSourceObservation {
  readonly candidateObservationId: string
  readonly order: number
  readonly candidateKey: LivingFrameControlledIllustrationCandidateKey
  readonly candidateClass: LivingFrameControlledIllustrationCandidateClass
  readonly disposition:
    LivingFrameControlledIllustrationObservationDisposition
  readonly sourceObservations:
    readonly LivingFrameControlledIllustrationUpstreamSourceObservation[]
  readonly unresolvedArtifactFamilyCodes:
    readonly LivingFrameControlledIllustrationArtifactFamily[]
  readonly requiredReviewGateCodes:
    readonly LivingFrameControlledIllustrationReviewGateCode[]
  readonly controlledObservationOnly: true
  readonly evaluationOnly: true
  readonly exactArtifactInventoryPresent: false
  readonly dependencyClosurePresent: false
  readonly packageOrArtifactPinnedForRuntime: false
  readonly sourceLicenseVerified: false
  readonly copiedSourceLicenseVerified: false
  readonly modelWeightLicenseVerified: false
  readonly baseModelLicenseVerified: false
  readonly trainingDataRightsVerified: false
  readonly commercialUseApproved: false
  readonly securityReviewPassed: false
  readonly privacyReviewPassed: false
  readonly benchmarkMeasured: false
  readonly benchmarkPassed: false
  readonly canonicalRegistryAdmitted: false
  readonly canonicalOperationAdmitted: false
  readonly dispatchAuthorized: false
  readonly runtimeAuthorized: false
  readonly productionReady: false
}

export interface LivingFrameControlledIllustrationDependencyScopeRule {
  readonly dependencyScopeRuleId: string
  readonly ruleCode:
    LivingFrameControlledIllustrationDependencyScopeRuleCode
  readonly affectedCandidateKeys:
    readonly LivingFrameControlledIllustrationCandidateKey[]
  readonly relatedSourceLocatorCodes:
    readonly LivingFrameControlledIllustrationSourceLocatorCode[]
  readonly unresolved: true
  readonly independentArtifactAdmissionRequired: true
  readonly promotionAllowed: false
  readonly legalOrCommercialConclusionProvided: false
}

export interface LivingFrameControlledIllustrationSourceObservationAuthorityBoundary {
  readonly controlledUpstreamObservationOnly: true
  readonly currentSourceAuthority: false
  readonly releasedEvidenceAuthority: false
  readonly legalReviewAuthority: false
  readonly commercialUseAuthority: false
  readonly redistributionAuthority: false
  readonly packageAuthority: false
  readonly containerAuthority: false
  readonly modelWeightAuthority: false
  readonly artifactManifestAuthority: false
  readonly installationAuthority: false
  readonly providerAuthority: false
  readonly toolRegistryAuthority: false
  readonly operationAuthority: false
  readonly dispatchAuthority: false
  readonly planningAuthority: false
  readonly selectedSceneAuthority: false
  readonly timingAuthority: false
  readonly soundAuthority: false
  readonly estimateAuthority: false
  readonly customerCommercialAuthority: false
  readonly approvalAuthority: false
  readonly snapshotAuthority: false
  readonly workGraphAuthority: false
  readonly queueAuthority: false
  readonly assetAuthority: false
  readonly qaApprovalAuthority: false
  readonly renderAuthority: false
  readonly runtimeAuthority: false
  readonly productionReady: false
}

export interface LivingFrameControlledIllustrationSourceObservationPacketDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_CONTROLLED_ILLUSTRATION_SOURCE_OBSERVATION_VERSION
  readonly contractSource:
    typeof LIVING_FRAME_CONTROLLED_ILLUSTRATION_SOURCE_OBSERVATION_SOURCE
  readonly status:
    typeof LIVING_FRAME_CONTROLLED_ILLUSTRATION_SOURCE_OBSERVATION_STATUS
  readonly evidenceClass:
    typeof LIVING_FRAME_CONTROLLED_ILLUSTRATION_SOURCE_OBSERVATION_EVIDENCE_CLASS
  readonly observationPacketId: string
  readonly observedOnDate: string
  readonly qualificationContractDigestSha256: string
  readonly candidateObservations:
    readonly LivingFrameControlledIllustrationCandidateSourceObservation[]
  readonly dependencyScopeRules:
    readonly LivingFrameControlledIllustrationDependencyScopeRule[]
  readonly authorityBoundary:
    LivingFrameControlledIllustrationSourceObservationAuthorityBoundary
}

export interface LivingFrameControlledIllustrationSourceObservationPacket
  extends LivingFrameControlledIllustrationSourceObservationPacketDraft {
  readonly observationPacketDigestSha256: string
}

export interface LivingFrameControlledIllustrationSourceObservationIssue {
  readonly code:
    LivingFrameControlledIllustrationSourceObservationIssueCode
  readonly path: string
}

export type LivingFrameControlledIllustrationSourceObservationValidationResult =
  | {
      readonly ok: true
      readonly packet:
        LivingFrameControlledIllustrationSourceObservationPacket
      readonly issues: readonly []
    }
  | {
      readonly ok: false
      readonly issues:
        readonly LivingFrameControlledIllustrationSourceObservationIssue[]
    }
