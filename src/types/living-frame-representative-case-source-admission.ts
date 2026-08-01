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
  LivingFrameRepresentativeMediaSourceCandidateId,
} from './living-frame-representative-media-source-candidates'
import type {
  LivingFrameRepresentativePrivateDigestRef,
  LivingFrameRepresentativePrivateSourceSelection,
} from './living-frame-representative-private-source-binding'

export const LIVING_FRAME_REPRESENTATIVE_CASE_SOURCE_ADMISSION_VERSION =
  'living-frame-representative-case-source-admission-v1' as const

export type LivingFrameRepresentativeCaseSourceUse =
  | 'primary_a_roll'
  | 'geographic_or_supporting_still'
  | 'archival_or_map_evidence'
  | 'diagram_source'
  | 'data_claim_source'
  | 'static_illustration'
  | 'non_character_still'
  | 'final_review_source_lineage'

export interface LivingFrameRepresentativeCaseSourceAssignment {
  readonly sourceCandidateId:
    LivingFrameRepresentativeMediaSourceCandidateId
  readonly order: number
  readonly sourceUse: LivingFrameRepresentativeCaseSourceUse
  readonly privateSourceBindingVersion:
    'living-frame-representative-private-source-binding-v1'
  readonly privateSourceBindingDigestSha256: string
  readonly selectionKind:
    LivingFrameRepresentativePrivateSourceSelection['selectionKind']
  readonly approvedWorkRefDigestSha256: string
  readonly assetManifestEntryRefDigestSha256: string
  readonly exactBindingCanonicalRereadRequired: true
}

export interface LivingFrameRepresentativeCaseSourceAdmissionDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_REPRESENTATIVE_CASE_SOURCE_ADMISSION_VERSION
  readonly admissionClass:
    'byte_free_non_executable_exact_case_source_binding_admission_candidate'
  readonly state:
    'source_binding_contract_complete_actual_canonical_reread_pending'
  readonly caseId: LivingFrameActiveNonIllustrationCaseId
  readonly caseOrder: number
  readonly activeScope: LivingFrameActiveNonIllustrationScope
  readonly sourceCandidateSetVersion:
    'living-frame-representative-media-source-candidates-v1'
  readonly sourceCandidateSetDigestSha256: string
  readonly representativeVisualFixtureVersion:
    'living-frame-representative-visual-fixture-v1'
  readonly representativeVisualFixtureDigestSha256: string
  readonly representativeVisualCaseDigestSha256: string
  readonly requiredSourceCandidateIds:
    readonly LivingFrameRepresentativeMediaSourceCandidateId[]
  readonly assignments:
    readonly LivingFrameRepresentativeCaseSourceAssignment[]
  readonly requiredAssetRoles:
    readonly LivingFrameRepresentativeAssetRole[]
  readonly sourceDerivedAssetRolesCovered:
    readonly LivingFrameRepresentativeAssetRole[]
  readonly nonSourceDependencyRoles:
    readonly LivingFrameRepresentativeAssetRole[]
  readonly commonCanonicalLineage: {
    readonly workspaceId: string
    readonly projectId: string
    readonly approvedSnapshotRef:
      LivingFrameRepresentativePrivateDigestRef
    readonly selectedSceneRef:
      LivingFrameRepresentativePrivateDigestRef
    readonly masterTimingRef:
      LivingFrameRepresentativePrivateDigestRef
    readonly confirmedFrameRef:
      LivingFrameRepresentativePrivateDigestRef
  }
  readonly exactRequiredCandidateSetBound: true
  readonly missingOrExtraSourceBindingAccepted: false
  readonly crossCaseSourceBindingAccepted: false
  readonly crossSnapshotSceneTimingOrFrameBindingAccepted: false
  readonly duplicateWorkOrManifestEntryAccepted: false
  readonly sourceToCanonicalAssetRoleReconciliationPending: true
  readonly canonicalConsumptionPending: true
  readonly sourceBytesPathsUrlsRawTranscriptOrChatSerialized: false
  readonly createsSourceSnapshotTimingWorkAssetRendererQaOrReviewOwner: false
  readonly operationRegistered: false
  readonly dispatchGranted: false
  readonly runtimeExecuted: false
  readonly assetCreated: false
  readonly customerCharged: false
  readonly publicDeliveryReady: false
  readonly productionReady: false
}

export interface LivingFrameRepresentativeCaseSourceAdmission
  extends LivingFrameRepresentativeCaseSourceAdmissionDraft {
  readonly assignmentSetDigestSha256: string
  readonly admissionDigestSha256: string
}
