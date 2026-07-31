import type {
  LivingFrameActiveNonIllustrationCaseId,
} from './living-frame-active-non-illustration-aggregate'

export const LIVING_FRAME_REPRESENTATIVE_MEDIA_SOURCE_CANDIDATES_VERSION =
  'living-frame-representative-media-source-candidates-v1' as const

export const LIVING_FRAME_REPRESENTATIVE_MEDIA_SOURCE_CANDIDATE_IDS = [
  'nasa_earth_day_expert_interview_public_domain_candidate',
  'nasa_strait_of_hormuz_satellite_public_domain_candidate',
  'historical_strait_of_hormuz_map_public_domain_candidate',
  'scientific_method_diagram_public_domain_candidate',
  'eia_world_oil_chokepoint_data_official_source_candidate',
  'local_astronomer_static_illustration_candidate',
  'local_locomotive_non_character_still_candidate',
] as const

export type LivingFrameRepresentativeMediaSourceCandidateId =
  typeof LIVING_FRAME_REPRESENTATIVE_MEDIA_SOURCE_CANDIDATE_IDS[number]

export type LivingFrameRepresentativeMediaSourceKind =
  | 'external_public_domain_talking_head_video'
  | 'external_public_domain_satellite_image'
  | 'external_public_domain_historical_map'
  | 'external_public_domain_diagram'
  | 'external_official_fact_data_requires_current_reread'
  | 'committed_generated_static_illustration_internal_fixture'
  | 'committed_generated_non_character_still_internal_fixture'

export interface LivingFrameRepresentativeMediaSourceCandidate {
  readonly sourceCandidateId:
    LivingFrameRepresentativeMediaSourceCandidateId
  readonly order: number
  readonly sourceKind: LivingFrameRepresentativeMediaSourceKind
  readonly sourcePageReferenceId: string
  readonly sourcePageEvidenceDigestSha256: string
  readonly expectedContentType:
    | 'video/webm'
    | 'image/jpeg'
    | 'image/svg+xml'
    | 'application/json'
    | 'image/png'
  readonly sourceOrLicenseClass:
    | 'us_federal_public_domain_internal_test_candidate'
    | 'public_domain_expired_term_internal_test_candidate'
    | 'author_released_public_domain_internal_test_candidate'
    | 'official_us_government_analysis_third_party_inputs_review_required'
    | 'reeditpro_original_generated_fixture_internal_test_only'
  readonly identifiablePersonPresent: boolean
  readonly publicityOrPersonUseReviewRequired: boolean
  readonly factualOrArchivalUseRequiresDocumentaryFactSafety: boolean
  readonly attributionRequiredByInternalPolicy: true
  readonly selectedSegmentOrCropApproved: false
  readonly canonicalAssetIngested: false
  readonly immutableBytesReread: false
  readonly externalNetworkFetchMade: false
  readonly approvedWorkOrManifestEntryCreated: false
  readonly publicOrCustomerUsePermitted: false
  readonly candidateDigestSha256: string
}

export interface LivingFrameRepresentativeMediaCaseBinding {
  readonly caseId: LivingFrameActiveNonIllustrationCaseId
  readonly order: number
  readonly requiredSourceCandidateIds:
    readonly LivingFrameRepresentativeMediaSourceCandidateId[]
  readonly selectedSourceSegmentOrCropPending: true
  readonly canonicalTranscriptSelectionPending: boolean
  readonly canonicalFactRereadPending: boolean
  readonly canonicalAssetIngestPending: true
  readonly representativeRuntimePending: true
  readonly caseBindingDigestSha256: string
}

export interface LivingFrameRepresentativeMediaSourceCandidateSetDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_REPRESENTATIVE_MEDIA_SOURCE_CANDIDATES_VERSION
  readonly sourceSetClass:
    'byte_free_non_executable_private_internal_representative_source_candidates'
  readonly sourceCandidateCount: 7
  readonly caseBindingCount: 12
  readonly sources:
    readonly LivingFrameRepresentativeMediaSourceCandidate[]
  readonly caseBindings:
    readonly LivingFrameRepresentativeMediaCaseBinding[]
  readonly localFixtureBytesPresentInRepository: true
  readonly externalSourceBytesPresentInRepository: false
  readonly currentGeometryProbeReusedAsRepresentativeMedia: false
  readonly generatedFixturePresentedAsAuthenticArchive: false
  readonly identifiablePersonCustomerUseAuthorized: false
  readonly legalLicensePublicityReviewComplete: false
  readonly canonicalIngestPending: true
  readonly representativeMediaRuntimeExecuted: false
  readonly createsCanonicalSourceAssetWorkManifestFactTimingRendererQaOrReviewOwner:
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

export interface LivingFrameRepresentativeMediaSourceCandidateSet
  extends LivingFrameRepresentativeMediaSourceCandidateSetDraft {
  readonly sourceSetDigestSha256: string
  readonly caseBindingSetDigestSha256: string
  readonly candidateSetDigestSha256: string
}
