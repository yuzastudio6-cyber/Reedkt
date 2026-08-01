import type {
  LivingFrameRepresentativeMediaSourceCandidateId,
} from './living-frame-representative-media-source-candidates'

export const LIVING_FRAME_REPRESENTATIVE_SOURCE_PROVENANCE_AUDIT_VERSION =
  'living-frame-representative-source-provenance-audit-v1' as const

export type LivingFrameRepresentativeProvenanceEvidenceClass =
  | 'wikimedia_file_description_and_license_revision'
  | 'official_nasa_source_and_credit_page'
  | 'official_nasa_media_reuse_policy'
  | 'official_eia_analysis_source_notes'
  | 'official_eia_copyright_and_reuse_policy'
  | 'repository_fixture_digest'

export type LivingFrameRepresentativeSourceRestriction =
  | 'attribution_required_by_internal_policy'
  | 'nasa_marks_and_endorsement_restricted'
  | 'identifiable_person_publicity_review_required'
  | 'historical_map_must_not_represent_modern_geography'
  | 'diagram_language_and_semantic_treatment_review_required'
  | 'current_fact_reread_and_row_citation_required'
  | 'third_party_input_reuse_review_required'
  | 'fictional_generated_fixture_not_authentic_person_or_archive'
  | 'static_illustrated_subject_animation_paused'
  | 'generated_object_fixture_not_authentic_archive'
  | 'mechanical_part_animation_paused'

export interface LivingFrameRepresentativeProvenanceEvidenceRef {
  readonly evidenceRefId: string
  readonly evidenceClass:
    LivingFrameRepresentativeProvenanceEvidenceClass
  readonly evidenceRevisionId: string
  readonly checkedOnDate: '2026-08-01'
  readonly canonicalRereadRequired: true
  readonly externalUrlSerialized: false
  readonly evidenceRefDigestSha256: string
}

export interface LivingFrameRepresentativeSourceProvenanceEntry {
  readonly sourceCandidateId:
    LivingFrameRepresentativeMediaSourceCandidateId
  readonly order: number
  readonly sourceCandidateDigestSha256: string
  readonly evidenceRefs:
    readonly LivingFrameRepresentativeProvenanceEvidenceRef[]
  readonly evidenceRefSetDigestSha256: string
  readonly sourcePageContentClass:
    | 'external_media_file_description'
    | 'external_analysis_html_page'
    | 'repository_fixture'
  readonly futurePrivateArtifactClass:
    | 'immutable_source_media_bytes'
    | 'canonical_derived_structured_data_snapshot'
    | 'immutable_repository_fixture_bytes'
  readonly factualFreshnessClass:
    | 'fixed_source_media'
    | 'historical_source_not_modern_data'
    | 'current_reread_required'
    | 'fictional_internal_fixture'
  readonly observedRightsClass:
    | 'us_federal_public_domain_with_nasa_reuse_limits'
    | 'public_domain_expired_term'
    | 'author_released_public_domain'
    | 'us_government_publication_with_third_party_input_review'
    | 'reeditpro_original_generated_internal_fixture'
  readonly requiredRestrictions:
    readonly LivingFrameRepresentativeSourceRestriction[]
  readonly canonicalLicenseAttributionPublicityAndFactReviewPending: true
  readonly privateInternalResearchUseOnly: true
  readonly customerOrPublicUseAuthorized: false
  readonly sourceMediaBytesFetched: false
  readonly provenanceEntryDigestSha256: string
}

export interface LivingFrameRepresentativeSourceProvenanceAuditDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_REPRESENTATIVE_SOURCE_PROVENANCE_AUDIT_VERSION
  readonly auditClass:
    'byte_free_source_page_and_policy_research_snapshot_candidate'
  readonly sourceCandidateSetVersion:
    'living-frame-representative-media-source-candidates-v1'
  readonly sourceCandidateSetDigestSha256: string
  readonly sourceCount: 7
  readonly sources:
    readonly LivingFrameRepresentativeSourceProvenanceEntry[]
  readonly sourcePageResearchPerformed: true
  readonly exactExternalMediaBytesFetched: false
  readonly liveWebPageTreatedAsExecutableStructuredData: false
  readonly structuredDataRequiresCanonicalDerivedSnapshot: true
  readonly generatedFixturePresentedAsAuthenticArchive: false
  readonly pausedCharacterOrMechanicalAnimationAdmitted: false
  readonly canonicalSourcePageLicenseFactAndPublicityRereadPending: true
  readonly canonicalConsumptionPending: true
  readonly createsCanonicalSourceAssetFactSafetySnapshotWorkRendererQaOrReviewOwner:
    false
  readonly containsExternalUrlPathCredentialPromptCommandEnvironmentOrMediaBytes:
    false
  readonly operationRegistered: false
  readonly dispatchGranted: false
  readonly runtimeExecuted: false
  readonly assetCreated: false
  readonly customerCharged: false
  readonly publicDeliveryReady: false
  readonly productionReady: false
}

export interface LivingFrameRepresentativeSourceProvenanceAudit
  extends LivingFrameRepresentativeSourceProvenanceAuditDraft {
  readonly provenanceSetDigestSha256: string
  readonly auditDigestSha256: string
}
