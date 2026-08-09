import type { CaptionDomainRef } from './caption-domain-contracts'
import type {
  CanonicalCaptionSpecialistAssignmentTrigger,
} from './canonical-caption-specialist-planning'

export const CANONICAL_CAPTION_POSTAPPROVAL_JOB_SELECTION_RECORD_VERSION =
  'canonical-caption-postapproval-job-selection-record-v1' as const
export const CANONICAL_CAPTION_POSTAPPROVAL_JOB_SELECTION_READ_PORT_VERSION =
  'canonical-caption-postapproval-job-selection-read-port-v1' as const
export const CANONICAL_CAPTION_POSTAPPROVAL_JOB_SELECTION_REPOSITORY_VERSION =
  'canonical-caption-postapproval-job-selection-repository-v1' as const

export type CanonicalCaptionPostapprovalSelectedJobType =
  | 'repair_caption_scene'
  | 'recompose_caption_output'
  | 'inspect_caption_specific_result'

export type CanonicalCaptionPostapprovalSelectionTrigger = Extract<
  CanonicalCaptionSpecialistAssignmentTrigger,
  | 'canonical_caption_qa_repair'
  | 'canonical_caption_output_recomposition'
  | 'canonical_caption_result_inspection'
>

export interface CanonicalCaptionPostapprovalSourceScope {
  ownerUserId: string
  workspaceId: string
  projectId: string
  editSessionId: string
  planVersionId: string
  approvedSnapshotRef: CaptionDomainRef
  outputId: string
  sceneId: string
  authorizedFrameRanges: Array<{
    startFrame: number
    endFrameExclusive: number
  }>
  confirmedOutputFrameRef: CaptionDomainRef
  masterTimingRef: CaptionDomainRef
}

export interface CanonicalCaptionPostapprovalTargetPlanningScope {
  ownerUserId: string
  workspaceId: string
  projectId: string
  editSessionId: string
  planningRequestId: string
  outputId: string
  sceneId: string
  authorizedFrameRanges: Array<{
    startFrame: number
    endFrameExclusive: number
  }>
  confirmedOutputFrameRef: CaptionDomainRef
  masterTimingRef: CaptionDomainRef
}

export interface CanonicalCaptionPostapprovalJobSelection {
  selectionId: string
  jobType: CanonicalCaptionPostapprovalSelectedJobType
  trigger: CanonicalCaptionPostapprovalSelectionTrigger
  sourceEvidenceRef: CaptionDomainRef
  dependsOnSelectionId: string | null
  reasonCodes: string[]
  smallestAffectedSceneScopeOnly: true
  priorArtifactPreserved: true
  freshApprovedExecutionPackageRequired: true
  callerMayCreateWork: false
  captionMayDispatchPeerDirectly: false
  captionMayExpandScope: false
  browserMayMarkComplete: false
}

/**
 * Create-only selection evidence emitted after one Caption result has been
 * inspected. It can authorize a later canonical planner to include only the
 * affected repair lifecycle. It never mutates the prior immutable snapshot or
 * creates work by itself.
 */
export interface CanonicalCaptionPostapprovalJobSelectionRecord {
  schemaVersion:
    typeof CANONICAL_CAPTION_POSTAPPROVAL_JOB_SELECTION_RECORD_VERSION
  recordId: string
  recordDigestSha256: string
  evidenceMode:
    | 'source_contract_fixture'
    | 'authenticated_private_caption_qa'
  targetLifecycleKind:
    | 'new_approved_internal_correction_package'
    | 'canonical_same_edit_session_revision'
  sourceScope: CanonicalCaptionPostapprovalSourceScope
  sourceExecutionPackageRef: CaptionDomainRef
  sourceCaptionPlanningProjectionRef: CaptionDomainRef
  completeQaReportRef: CaptionDomainRef
  localRepairFallbackPlanRef: CaptionDomainRef
  accessibilityRecompositionPlanRef: CaptionDomainRef
  directInspectionReceiptRef: CaptionDomainRef
  postrenderVisualQaWorkBindingRef: CaptionDomainRef
  targetPlanningScope: CanonicalCaptionPostapprovalTargetPlanningScope
  selections: [
    CanonicalCaptionPostapprovalJobSelection,
    CanonicalCaptionPostapprovalJobSelection,
    CanonicalCaptionPostapprovalJobSelection,
  ]
  priorApprovedRunLineageExactReread: true
  sourceContractFixtureValidated: boolean
  authenticatedCaptionQaEvidenceExactReread: boolean
  actualRepairNeedObserved: boolean
  privateQualificationEvidence: boolean
  priorApprovedSnapshotRemainsImmutable: true
  targetPlanEstimateAndFreshApprovalRequired: true
  targetApprovedSnapshotPredictedOrInjected: false
  sourceResultReplacedOrOverwritten: false
  byteFree: true
  rawChatIncluded: false
  transcriptTextIncluded: false
  mediaBytesIncluded: false
  pathsUrlsOrCredentialsIncluded: false
  callerSuppliedEvidenceAccepted: false
  directPeerDispatchGranted: false
  timelineMutationAuthorityGrantedToCaption: false
  workCreationAuthorityGrantedToCaption: false
  operationOrRuntimeAuthorityGrantedToCaption: false
  assetMutationAuthorityGrantedToCaption: false
  finalQaApprovalAuthorityGrantedToCaption: false
  creditOrBillingAuthorityGrantedToCaption: false
  publicDeliveryAuthorityGrantedToCaption: false
  productionAuthorityGrantedToCaption: false
}

export interface CanonicalCaptionPostapprovalJobSelectionReadPort {
  readonly schemaVersion:
    typeof CANONICAL_CAPTION_POSTAPPROVAL_JOB_SELECTION_READ_PORT_VERSION
  readonly sourceAuthority:
    'canonical_caption_postapproval_job_selection_repository'
  readonly callerSuppliedEvidenceAccepted: false
  readExact(input: {
    readonly recordRef: CaptionDomainRef
  }): Promise<CanonicalCaptionPostapprovalJobSelectionRecord | null>
}

export interface CanonicalCaptionPostapprovalJobSelectionRepository {
  readonly schemaVersion:
    typeof CANONICAL_CAPTION_POSTAPPROVAL_JOB_SELECTION_REPOSITORY_VERSION
  readonly readPort: CanonicalCaptionPostapprovalJobSelectionReadPort
  persistCreateOnly(input: {
    readonly record: CanonicalCaptionPostapprovalJobSelectionRecord
  }): Promise<'created' | 'identical_replay'>
}
