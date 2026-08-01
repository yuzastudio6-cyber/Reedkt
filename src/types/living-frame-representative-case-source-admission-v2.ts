import type {
  LivingFrameActiveNonIllustrationCaseId,
} from './living-frame-active-non-illustration-aggregate'
import type {
  LivingFrameActiveNonIllustrationScope,
} from './living-frame-owner-scope-amendment'
import type {
  LivingFrameRepresentativeAssetRole,
} from './living-frame-representative-visual-fixture'
import type {
  LivingFrameRepresentativePrivateDigestRef,
} from './living-frame-representative-private-source-binding'
import type {
  LivingFrameRepresentativePrivateSourceSelectionV2,
} from './living-frame-representative-private-source-binding-v2'
import type {
  LivingFrameRepresentativeEffectiveSourceCandidateId,
  LivingFrameRepresentativeSemanticTopic,
} from './living-frame-representative-semantic-source-routing'

export const LIVING_FRAME_REPRESENTATIVE_CASE_SOURCE_ADMISSION_V2_VERSION =
  'living-frame-representative-case-source-admission-v2' as const

export type LivingFrameRepresentativeCaseSourceUseV2 =
  | 'primary_a_roll'
  | 'topic_matched_supporting_broll'
  | 'geographic_or_supporting_still'
  | 'archival_or_map_evidence'
  | 'diagram_source'
  | 'data_claim_source'
  | 'static_illustration'
  | 'non_character_still'
  | 'final_review_source_lineage'

export interface LivingFrameRepresentativeCaseSourceAssignmentV2 {
  readonly sourceCandidateId:
    LivingFrameRepresentativeEffectiveSourceCandidateId
  readonly order: number
  readonly sourceUse: LivingFrameRepresentativeCaseSourceUseV2
  readonly privateSourceBindingVersion:
    'living-frame-representative-private-source-binding-v2'
  readonly privateSourceBindingDigestSha256: string
  readonly selectionKind:
    LivingFrameRepresentativePrivateSourceSelectionV2['selectionKind']
  readonly sourceRouteDigestSha256: string
  readonly sourceProbeOrSnapshotDigestSha256: string
  readonly approvedWorkRefDigestSha256: string
  readonly assetManifestEntryRefDigestSha256: string
  readonly exactBindingCanonicalRereadRequired: true
}

export interface LivingFrameRepresentativeCaseSourceAdmissionV2Draft {
  readonly contractVersion:
    typeof LIVING_FRAME_REPRESENTATIVE_CASE_SOURCE_ADMISSION_V2_VERSION
  readonly admissionClass:
    'byte_free_non_executable_semantic_route_exact_probe_case_source_admission_candidate'
  readonly state:
    'v2_source_binding_contract_complete_actual_canonical_reread_pending'
  readonly supersedesRuntimeUseOfContractVersion:
    'living-frame-representative-case-source-admission-v1'
  readonly legacyV1AdmissionMayDriveRepresentativeRender: false
  readonly caseId: LivingFrameActiveNonIllustrationCaseId
  readonly caseOrder: number
  readonly activeScope: LivingFrameActiveNonIllustrationScope
  readonly semanticTopic: LivingFrameRepresentativeSemanticTopic
  readonly semanticRoutingVersion:
    'living-frame-representative-semantic-source-routing-v1'
  readonly semanticRoutingDigestSha256: string
  readonly sourceRouteDigestSha256: string
  readonly provenanceAuditVersion:
    'living-frame-representative-source-provenance-audit-v1'
  readonly provenanceAuditDigestSha256: string
  readonly representativeVisualFixtureVersion:
    'living-frame-representative-visual-fixture-v1'
  readonly representativeVisualFixtureDigestSha256: string
  readonly representativeVisualCaseDigestSha256: string
  readonly requiredSourceCandidateIds:
    readonly LivingFrameRepresentativeEffectiveSourceCandidateId[]
  readonly assignments:
    readonly LivingFrameRepresentativeCaseSourceAssignmentV2[]
  readonly requiredAssetRoles:
    readonly LivingFrameRepresentativeAssetRole[]
  readonly sourceDerivedAssetRolesCovered:
    readonly LivingFrameRepresentativeAssetRole[]
  readonly nonSourceDependencyRoles:
    readonly LivingFrameRepresentativeAssetRole[]
  readonly commonCanonicalLineage: {
    readonly workspaceId: string
    readonly projectId: string
    readonly approvedSnapshotRef: LivingFrameRepresentativePrivateDigestRef
    readonly selectedSceneRef: LivingFrameRepresentativePrivateDigestRef
    readonly masterTimingRef: LivingFrameRepresentativePrivateDigestRef
    readonly confirmedFrameRef: LivingFrameRepresentativePrivateDigestRef
  }
  readonly exactSemanticRequiredCandidateSetBound: true
  readonly everyVideoSourceUsesExactProbeAndRationalFrameMapping: true
  readonly everyStillSourceUsesExactProbeBeforeCrop: true
  readonly everyDataSourceUsesExactSnapshotRowsAndCitations: true
  readonly missingExtraReorderedOrDuplicateSourceBindingAccepted: false
  readonly crossCaseOrSemanticTopicSourceBindingAccepted: false
  readonly crossSnapshotSceneTimingOrFrameBindingAccepted: false
  readonly duplicateWorkOrManifestEntryAccepted: false
  readonly sourceToCanonicalAssetRoleReconciliationPending: true
  readonly canonicalConsumptionPending: true
  readonly sourceBytesPathsUrlsRawTranscriptOrChatSerialized: false
  readonly createsSourceProbeSnapshotTimingWorkAssetRendererQaOrReviewOwner:
    false
  readonly operationRegistered: false
  readonly dispatchGranted: false
  readonly runtimeExecuted: false
  readonly assetCreated: false
  readonly customerCharged: false
  readonly publicDeliveryReady: false
  readonly productionReady: false
}

export interface LivingFrameRepresentativeCaseSourceAdmissionV2
  extends LivingFrameRepresentativeCaseSourceAdmissionV2Draft {
  readonly assignmentSetDigestSha256: string
  readonly admissionDigestSha256: string
}
