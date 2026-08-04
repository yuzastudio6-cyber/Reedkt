import type { PreferenceEvidenceCategory } from './edit-reference'

export const EDIT_REFERENCE_LONG_FORM_STUDY_REVIEW_PACKAGE_VERSION =
  'edit-reference-long-form-study-review-package-v1' as const
export const EDIT_REFERENCE_LONG_FORM_STUDY_REVIEW_DECISION_VERSION =
  'edit-reference-long-form-study-review-decision-v1' as const
export const EDIT_REFERENCE_LONG_FORM_STUDY_SELECTION_RECEIPT_VERSION =
  'edit-reference-long-form-study-selection-receipt-v1' as const

export const EDIT_REFERENCE_LONG_FORM_STUDY_REVIEW_DECISION_KINDS = [
  'adapt',
  'context_only',
  'avoid',
] as const

export const EDIT_REFERENCE_LONG_FORM_REVIEW_SPECIALIST_IDS = [
  'visual_language',
  'story_editorial',
  'speech_pacing',
  'caption_design',
  'color_treatment',
  'audio_sound_design',
  'graphics_motion',
] as const

export type EditReferenceLongFormReviewSpecialistId =
  typeof EDIT_REFERENCE_LONG_FORM_REVIEW_SPECIALIST_IDS[number]

export type EditReferenceLongFormReviewCopyRiskKind =
  | 'exact_shot_order'
  | 'exact_timing'
  | 'exact_graphic_layout'
  | 'exact_music_or_sfx'
  | 'creator_or_brand_identity'
  | 'reference_as_project_footage'

export interface EditReferenceLongFormStudyReviewFinding {
  readonly findingId: string
  readonly specialistId: EditReferenceLongFormReviewSpecialistId
  readonly skillId: string
  readonly category: PreferenceEvidenceCategory
  readonly title: string
  readonly status: 'analyzed' | 'not_applicable'
  readonly summary: string
  readonly confidence: number
  readonly semanticWindowCount: number
  readonly checkpointDigestsSha256: readonly string[]
  readonly evidenceOutputDigestsSha256: readonly string[]
  readonly runtimeSource: 'verified_local' | 'verified_live' | null
  readonly toolIds: readonly string[]
  readonly providerCallMade: boolean
  readonly modelCallMade: boolean
  readonly workerJobCreated: boolean
  readonly meteredInternalCostMicros: string
  readonly usageEventIds: readonly string[]
  readonly internalCostRecordIds: readonly string[]
  readonly copyRiskKinds: readonly EditReferenceLongFormReviewCopyRiskKind[]
  readonly requiresUserSelection: boolean
  readonly targetAdaptationRequired: true
  readonly exactCopyInstructionCreated: false
}

export interface EditReferenceLongFormStudyReviewPackage {
  readonly schemaVersion: typeof EDIT_REFERENCE_LONG_FORM_STUDY_REVIEW_PACKAGE_VERSION
  readonly packageId: string
  readonly packageDigestSha256: string
  readonly reviewAuthority: 'controlled_review_only' | 'completed_authoritative'
  readonly workspaceId: string
  readonly editReferenceId: string
  readonly studySessionId: string
  readonly sourceEvidenceId: string
  readonly privateMediaArtifactId: string
  readonly mediaChecksumSha256: string
  readonly runId: string
  readonly runRevision: number
  readonly planId: string
  readonly planDigestSha256: string
  readonly sourceDurationSeconds: number
  readonly sourceHasAudio: boolean
  readonly chunkCount: number
  readonly semanticWindowCount: number
  readonly checkpointCount: number
  readonly findings: readonly EditReferenceLongFormStudyReviewFinding[]
  readonly boundaries: {
    readonly originalRemainsImmutable: true
    readonly rawMediaPersisted: false
    readonly rawProviderPayloadPersisted: false
    readonly rawTranscriptPersisted: false
    readonly recognizedOcrTextPersisted: false
    readonly localFilePathPersisted: false
    readonly signedUrlPersisted: false
    readonly userSelectionRequired: true
    readonly automaticPreferenceDnaCreationAllowed: false
    readonly automaticPreferenceApplicationAllowed: false
    readonly approvedSnapshotMutationAllowed: false
    readonly planOrEstimateMutationAllowed: false
    readonly customerPriceCalculated: false
    readonly customerCreditsMutated: false
    readonly serviceFeeIncluded: false
    readonly productionReady: false
  }
  readonly createdAt: string
}

export type EditReferenceLongFormStudyReviewDecisionKind =
  typeof EDIT_REFERENCE_LONG_FORM_STUDY_REVIEW_DECISION_KINDS[number]

export interface EditReferenceLongFormStudyReviewDecision {
  readonly schemaVersion: typeof EDIT_REFERENCE_LONG_FORM_STUDY_REVIEW_DECISION_VERSION
  readonly findingId: string
  readonly decision: EditReferenceLongFormStudyReviewDecisionKind
}

export interface EditReferenceLongFormStudyReviewSelection {
  readonly package: EditReferenceLongFormStudyReviewPackage
  readonly sourceEvidenceId: string
  readonly decisions: readonly EditReferenceLongFormStudyReviewDecision[]
  readonly acknowledgeAdaptNotCopy: boolean
  readonly acknowledgeFactSafetyReview: boolean
}

export interface EditReferenceLongFormStudySelectionReceipt {
  readonly schemaVersion: typeof EDIT_REFERENCE_LONG_FORM_STUDY_SELECTION_RECEIPT_VERSION
  readonly receiptId: string
  readonly receiptDigestSha256: string
  readonly packageId: string
  readonly packageDigestSha256: string
  readonly workspaceId: string
  readonly editReferenceId: string
  readonly studySessionId: string
  readonly sourceEvidenceId: string
  readonly decisionCount: number
  readonly adaptedFindingCount: number
  readonly contextOnlyFindingCount: number
  readonly avoidedFindingCount: number
  readonly notApplicableFindingCount: number
  readonly outputEvidenceIds: readonly string[]
  readonly outputSkillRunIds: readonly string[]
  readonly selectionWasExplicit: true
  readonly preferenceDnaCreated: false
  readonly preferenceApplied: false
  readonly approvedSnapshotMutated: false
  readonly planOrEstimateMutated: false
  readonly providerCallMade: false
  readonly modelCallMade: false
  readonly workerJobCreated: false
  readonly customerPriceCalculated: false
  readonly customerCreditsMutated: false
  readonly serviceFeeIncluded: false
  readonly productionReady: false
  readonly createdAt: string
}

export interface ApplyEditReferenceLongFormStudyReviewRequest {
  readonly workspaceId: string
  readonly expectedStudyRevision: number
  readonly expectedReviewPackageDigestSha256: string
  readonly decisions: readonly EditReferenceLongFormStudyReviewDecision[]
  readonly acknowledgeAdaptNotCopy: boolean
  readonly acknowledgeFactSafetyReview: boolean
}

export interface EditReferenceLongFormStudyReviewFindingData {
  readonly findingId: string
  readonly specialistId: EditReferenceLongFormReviewSpecialistId
  readonly title: string
  readonly status: EditReferenceLongFormStudyReviewFinding['status']
  readonly summary: string
  readonly confidence: number
  readonly semanticWindowCount: number
  readonly copyRiskKinds: readonly EditReferenceLongFormReviewCopyRiskKind[]
  readonly canAdapt: boolean
  readonly requiresUserSelection: boolean
  readonly selectedDecision?: EditReferenceLongFormStudyReviewDecisionKind
}

export interface EditReferenceLongFormStudyReviewSelectionSummary {
  readonly status: 'needs_selection' | 'selected'
  readonly decisions: readonly EditReferenceLongFormStudyReviewDecision[]
  readonly selectedAt?: string
  readonly selectionReceiptId?: string
  readonly adaptedFindingCount: number
  readonly contextOnlyFindingCount: number
  readonly avoidedFindingCount: number
  readonly notApplicableFindingCount: number
}

export interface EditReferenceLongFormStudyReviewData {
  readonly editReferenceId: string
  readonly studySessionId: string
  readonly studyRevision: number
  readonly referenceAssetId: string
  readonly sourceLabel: string
  readonly reviewPackageId: string
  readonly reviewPackageDigestSha256: string
  readonly reviewAuthority: EditReferenceLongFormStudyReviewPackage['reviewAuthority']
  readonly sourceDurationSeconds: number
  readonly sourceHasAudio: boolean
  readonly chunkCount: number
  readonly semanticWindowCount: number
  readonly checkpointCount: number
  readonly findings: readonly EditReferenceLongFormStudyReviewFindingData[]
  readonly selection: EditReferenceLongFormStudyReviewSelectionSummary
  readonly boundaries: EditReferenceLongFormStudyReviewPackage['boundaries']
  readonly persistence: 'backend_local_private_segmented'
  readonly productionPersistence: 'blocked_by_migration_baseline'
}

export interface EditReferenceLongFormStudyReviewSelectionData {
  readonly review: EditReferenceLongFormStudyReviewData
  readonly detail: import('./edit-reference').EditReferenceDetailData
}
