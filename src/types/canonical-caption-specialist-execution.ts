import type {
  OrchestraSkillJobResult,
  SkillArtifactRef,
  SkillContractRef,
  SkillFrameRange,
} from './orchestra-skill-contracts'
import type { CaptionsSupportedJobType } from './captions-specialist'
import type { SkillRequestedMode, SkillScopeLevel } from
  './skill-capability-manifest'

export const CANONICAL_CAPTION_SPECIALIST_WORK_ITEM_INPUT_VERSION =
  'canonical-caption-specialist-work-item-input-v1' as const
export const CANONICAL_CAPTION_SPECIALIST_WORK_ITEM_OPERATION =
  'internal.run_approved_caption_specialist_job.v1' as const
export const CANONICAL_CAPTION_SPECIALIST_EXECUTION_RECEIPT_VERSION =
  'canonical-caption-specialist-execution-receipt-v1' as const
export const CANONICAL_CAPTION_SPECIALIST_WORKER_CLASS =
  'canonical_caption_specialist_worker_v1' as const

export type CanonicalCaptionInitialArtifactType =
  | 'canonical_transcript'
  | 'canonical_transcript_authenticated_read_binding'
  | 'confirmed_output_frame'
  | 'master_timing_or_planning_timing'

export interface CanonicalCaptionSpecialistInitialArtifactRef
  extends SkillArtifactRef {
  artifactType: CanonicalCaptionInitialArtifactType
  sourceSupportRequestRef: null
}

/**
 * Immutable planning input embedded in one canonical approved work item.
 * The approved snapshot identity is deliberately added by the backend only
 * after approval; callers cannot predict or inject it before approval.
 */
export interface CanonicalCaptionSpecialistWorkItemInput {
  schemaVersion:
    typeof CANONICAL_CAPTION_SPECIALIST_WORK_ITEM_INPUT_VERSION
  operation: typeof CANONICAL_CAPTION_SPECIALIST_WORK_ITEM_OPERATION
  captionJobType: CaptionsSupportedJobType
  requestedMode: Extract<SkillRequestedMode, 'planning'>
  scopeLevel: SkillScopeLevel
  outputId: string | null
  sceneId: string | null
  boundaryId: string | null
  authorizedFrameRanges: SkillFrameRange[]
  initialArtifactRefs: CanonicalCaptionSpecialistInitialArtifactRef[]
  rawChatIncluded: false
  transcriptTextIncluded: false
  mediaBytesIncluded: false
  pathsUrlsOrCredentialsIncluded: false
  directPeerDispatchRequested: false
  providerCallRequested: false
  timelineMutationRequested: false
  assetMutationRequested: false
  qaApprovalRequested: false
  billingAuthorityRequested: false
  publicDeliveryRequested: false
  productionAuthorityRequested: false
}

export interface CanonicalCaptionSpecialistExecutionReceipt {
  schemaVersion:
    typeof CANONICAL_CAPTION_SPECIALIST_EXECUTION_RECEIPT_VERSION
  receiptId: string
  receiptDigestSha256: string
  executionPackageRef: SkillContractRef
  approvedSnapshotRef: SkillContractRef
  approvedWorkItemRef: SkillContractRef
  canonicalJobRef: SkillContractRef
  plannedManifestEntryRef: SkillContractRef
  estimateRef: SkillContractRef
  reservationRef: SkillContractRef
  captionCallRef: SkillContractRef
  captionResultRef: SkillContractRef
  captionJobType: CaptionsSupportedJobType
  resultDisposition: OrchestraSkillJobResult['disposition']
  persistedAt: string
  exactApprovedSnapshotReread: true
  exactExecutionPackageReread: true
  exactWorkItemAndJobReread: true
  exactConfirmedFrameAndMasterTimingRefsBound: true
  exactPlannedManifestEntryBound: true
  exactEstimateAndReservationBound: true
  callResultPersistedCreateOnlyAndReread: true
  supportRequestsRemainHqMediated: true
  browserLocalCompletionAccepted: false
  directPeerDispatchPerformed: false
  providerCallPerformed: false
  mediaRuntimePerformed: false
  timelineMutationPerformed: false
  assetMutationPerformed: false
  costOrBillingMutationPerformed: false
  finalQaApprovalGranted: false
  publicDeliveryGranted: false
  productionAuthorityGranted: false
}
