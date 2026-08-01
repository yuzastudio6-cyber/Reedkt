import type {
  LivingFrameActiveNonIllustrationCaseId,
} from './living-frame-active-non-illustration-aggregate'
import type {
  LivingFrameRepresentativeMediaSourceCandidateId,
} from './living-frame-representative-media-source-candidates'

export const LIVING_FRAME_REPRESENTATIVE_SEMANTIC_SOURCE_ROUTING_VERSION =
  'living-frame-representative-semantic-source-routing-v1' as const

export const LIVING_FRAME_NASA_EARTH_DAY_BROLL_SOURCE_CANDIDATE_ID =
  'nasa_earth_day_cut_broll_public_domain_candidate' as const

export type LivingFrameRepresentativeEffectiveSourceCandidateId =
  | LivingFrameRepresentativeMediaSourceCandidateId
  | typeof LIVING_FRAME_NASA_EARTH_DAY_BROLL_SOURCE_CANDIDATE_ID

export type LivingFrameRepresentativeSemanticTopic =
  | 'nasa_earth_observation_and_community_data'
  | 'fictional_static_astronomer_editorial_composition'
  | 'fictional_locomotive_environmental_composition'
  | 'historical_and_modern_hormuz_geography'
  | 'scientific_method_process_explanation'
  | 'hormuz_routes_and_current_oil_flow_data'
  | 'final_multichapter_representative_review'

export interface LivingFrameRepresentativeAdditionalSourceCandidate {
  readonly sourceCandidateId:
    typeof LIVING_FRAME_NASA_EARTH_DAY_BROLL_SOURCE_CANDIDATE_ID
  readonly sourceKind: 'external_public_domain_topic_matched_broll_video'
  readonly sourcePageEvidenceRef: {
    readonly evidenceRefId: 'nasa-svs-earth-day-interview-14327'
    readonly evidenceRevisionId: 'page-updated-2023-05-03'
    readonly canonicalRereadRequired: true
    readonly digestSha256: string
  }
  readonly expectedContentType: 'video/webm'
  readonly sourceReportedWidthPixels: 1920
  readonly sourceReportedHeightPixels: 1080
  readonly sourceReportedDurationSeconds: 331
  readonly sourceReportedAudioPolicy: 'no_audio'
  readonly sourceOrLicenseClass:
    'us_federal_public_domain_internal_test_candidate'
  readonly sourceCreditRefId: 'nasa-goddard-space-flight-center'
  readonly nasaMarksAndEndorsementRestricted: true
  readonly identifiablePersonsMayBePresent: true
  readonly publicityOrPersonUseReviewRequired: true
  readonly sourceMotionOnlyNoGeneratedLivingSubjectAnimation: true
  readonly selectedSegmentOrCropApproved: false
  readonly canonicalAssetIngested: false
  readonly immutableBytesReread: false
  readonly externalMediaBytesFetched: false
  readonly publicOrCustomerUsePermitted: false
  readonly candidateDigestSha256: string
}

export interface LivingFrameRepresentativeSemanticSourceRoute {
  readonly caseId: LivingFrameActiveNonIllustrationCaseId
  readonly order: number
  readonly semanticTopic: LivingFrameRepresentativeSemanticTopic
  readonly originalV1SourceCandidateIds:
    readonly LivingFrameRepresentativeMediaSourceCandidateId[]
  readonly effectiveSourceCandidateIds:
    readonly LivingFrameRepresentativeEffectiveSourceCandidateId[]
  readonly removedSourceCandidateIds:
    readonly LivingFrameRepresentativeMediaSourceCandidateId[]
  readonly addedSourceCandidateIds:
    readonly LivingFrameRepresentativeEffectiveSourceCandidateId[]
  readonly sourceTopicsMustMatchCanonicalNarrativeIntent: true
  readonly transcriptOrClaimEvidenceMustSupportEverySource: true
  readonly semanticallyUnrelatedSourceCombinationPermitted: false
  readonly existingV1AdmissionMayDriveRepresentativeRender: false
  readonly canonicalV2CandidateSetAndAdmissionRequired: true
  readonly sourceRouteDigestSha256: string
}

export interface LivingFrameRepresentativeSemanticSourceRoutingDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_REPRESENTATIVE_SEMANTIC_SOURCE_ROUTING_VERSION
  readonly routingClass:
    'source_only_semantic_coherence_correction_and_candidate_extension'
  readonly sourceCandidateSetVersion:
    'living-frame-representative-media-source-candidates-v1'
  readonly sourceCandidateSetDigestSha256: string
  readonly provenanceAuditVersion:
    'living-frame-representative-source-provenance-audit-v1'
  readonly provenanceAuditDigestSha256: string
  readonly semanticMismatchDetectedInV1CaseBindings: true
  readonly additionalSourceCandidateCount: 1
  readonly additionalSourceCandidate:
    LivingFrameRepresentativeAdditionalSourceCandidate
  readonly routeCount: 12
  readonly routes: readonly LivingFrameRepresentativeSemanticSourceRoute[]
  readonly currentV1CaseAdmissionsInvalidatedForRepresentativeRuntime: true
  readonly canonicalV2CandidateSetPrivateBindingAndCaseAdmissionRequired: true
  readonly canonicalTranscriptAndClaimRereadRequired: true
  readonly characterAndMechanicalAnimationPausePreserved: true
  readonly externalMediaBytesFetched: false
  readonly canonicalConsumptionPending: true
  readonly createsCanonicalSourceTranscriptFactSnapshotWorkAssetRendererQaOrReviewOwner:
    false
  readonly operationRegistered: false
  readonly dispatchGranted: false
  readonly runtimeExecuted: false
  readonly assetCreated: false
  readonly customerCharged: false
  readonly publicDeliveryReady: false
  readonly productionReady: false
}

export interface LivingFrameRepresentativeSemanticSourceRouting
  extends LivingFrameRepresentativeSemanticSourceRoutingDraft {
  readonly routeSetDigestSha256: string
  readonly routingDigestSha256: string
}
