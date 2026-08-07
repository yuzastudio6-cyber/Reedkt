import type {
  OrchestraSkillCall,
  OrchestraSkillJobResult,
  SkillArtifactRef,
  SkillContractRef,
  SkillFrameRange,
} from './orchestra-skill-contracts'
import type { SkillSupportRequestV2 } from
  './orchestra-skill-support-request-v2'
import type { CaptionsSupportedJobType } from './captions-specialist'
import type { SkillRequestedMode, SkillScopeLevel } from
  './skill-capability-manifest'

export const CANONICAL_CAPTION_SPECIALIST_WORK_ITEM_INPUT_VERSION =
  'canonical-caption-specialist-work-item-input-v1' as const
export const CANONICAL_CAPTION_SPECIALIST_WORK_ITEM_INPUT_V2_VERSION =
  'canonical-caption-specialist-work-item-input-v2' as const
export const CANONICAL_CAPTION_SPECIALIST_WORK_ITEM_INPUT_V3_VERSION =
  'canonical-caption-specialist-work-item-input-v3' as const
export const CANONICAL_CAPTION_SPECIALIST_WORK_ITEM_OPERATION =
  'internal.run_approved_caption_specialist_job.v1' as const
export const CANONICAL_CAPTION_SPECIALIST_EXECUTION_RECEIPT_VERSION =
  'canonical-caption-specialist-execution-receipt-v1' as const
export const CANONICAL_CAPTION_SPECIALIST_EXECUTION_RECEIPT_V2_VERSION =
  'canonical-caption-specialist-execution-receipt-v2' as const
export const CANONICAL_CAPTION_INCOMING_SUPPORT_REQUEST_READ_PORT_VERSION =
  'canonical-caption-incoming-support-request-read-port-v1' as const
export const CANONICAL_CAPTION_SPECIALIST_WORKER_CLASS =
  'canonical_caption_specialist_worker_v1' as const

export type CanonicalCaptionInitialArtifactType =
  | 'canonical_transcript'
  | 'canonical_transcript_planning_expectation'
  | 'canonical_transcript_planning_expectation_binding'
  | 'canonical_transcript_authenticated_read_binding'
  | 'confirmed_output_frame'
  | 'master_timing_or_planning_timing'
  | 'source_skill_support_request'

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
export interface CanonicalCaptionSpecialistWorkItemInputV1 {
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

export interface CanonicalCaptionSpecialistWorkItemInputV2
  extends Omit<CanonicalCaptionSpecialistWorkItemInputV1, 'schemaVersion'> {
  schemaVersion:
    typeof CANONICAL_CAPTION_SPECIALIST_WORK_ITEM_INPUT_V2_VERSION
  assignmentIntentRef: SkillContractRef
  assignmentTrigger:
    import('./canonical-caption-specialist-planning')
      .CanonicalCaptionSpecialistAssignmentTrigger
  sourceSupportRequestRef: SkillContractRef | null
  selectionEvidenceRef: SkillContractRef
}

export interface CanonicalCaptionSpecialistWorkItemInputV3
  extends Omit<CanonicalCaptionSpecialistWorkItemInputV2, 'schemaVersion'> {
  schemaVersion:
    typeof CANONICAL_CAPTION_SPECIALIST_WORK_ITEM_INPUT_V3_VERSION
}

export type CanonicalCaptionSpecialistWorkItemInput =
  | CanonicalCaptionSpecialistWorkItemInputV1
  | CanonicalCaptionSpecialistWorkItemInputV2
  | CanonicalCaptionSpecialistWorkItemInputV3

export interface CanonicalCaptionIncomingSupportRequestReadPort {
  readonly schemaVersion:
    typeof CANONICAL_CAPTION_INCOMING_SUPPORT_REQUEST_READ_PORT_VERSION
  readonly sourceAuthority:
    'canonical_backend_persisted_specialist_support_request'
  readonly callerSuppliedRequestAccepted: false
  readExact(input: {
    readonly requestRef: SkillContractRef
  }): Promise<{
    readonly request: SkillSupportRequestV2
    readonly originalCall: OrchestraSkillCall
  } | null>
}

interface CanonicalCaptionSpecialistExecutionReceiptBase {
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

/** Frozen single-artifact receipt retained byte-for-byte for V1 work. */
export interface CanonicalCaptionSpecialistExecutionReceiptV1
  extends CanonicalCaptionSpecialistExecutionReceiptBase {
  schemaVersion:
    typeof CANONICAL_CAPTION_SPECIALIST_EXECUTION_RECEIPT_VERSION
}

/**
 * Additive receipt for jobs whose exact completed result contains more than
 * the frozen V1 job receipt, including incoming support and V3 cross-system
 * coordination. The digest binds the complete ordered artifact set, while the
 * optional cross-system ref preserves the separately persisted source input.
 */
export interface CanonicalCaptionSpecialistExecutionReceiptV2
  extends CanonicalCaptionSpecialistExecutionReceiptBase {
  schemaVersion:
    typeof CANONICAL_CAPTION_SPECIALIST_EXECUTION_RECEIPT_V2_VERSION
  producedArtifactCount: number
  producedArtifactRefsDigestSha256: string
  exactProducedArtifactRefsBound: true
  crossSystemExecutionInputRef: SkillContractRef | null
  crossSystemExecutionInputPersistedCreateOnlyAndReread: boolean
}

export type CanonicalCaptionSpecialistExecutionReceipt =
  | CanonicalCaptionSpecialistExecutionReceiptV1
  | CanonicalCaptionSpecialistExecutionReceiptV2
