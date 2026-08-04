import type { CaptionDomainCanonicalScope, CaptionDomainRef } from
  './caption-domain-contracts'
import type {
  CaptionRenderedVisualReviewAuthenticatedReadResult,
  CaptionRenderedVisualReviewConfirmedOutputFrameRef,
} from './caption-direction-visual-review-authenticated-read'
import type { PlatformAspectRatio } from './workflow-common'

export const PROFESSIONAL_SKILL_COMPOSITION_TRACE_VERSION =
  'professional-skill-composition-trace-v1' as const
export const CAPTION_SPECIALIST_SNAPSHOT_EXTENSION_VERSION =
  'caption-specialist-approved-snapshot-extension-v1' as const
export const CAPTION_SPECIALIST_PRESENTATION_VERSION =
  'caption-specialist-chat-presentation-v1' as const
export const CAPTION_SPECIALIST_REVISION_INTENT_VERSION =
  'caption-specialist-natural-language-revision-intent-v1' as const
export const CAPTION_SPECIALIST_PERSISTENCE_RECEIPT_VERSION =
  'caption-specialist-component-persistence-receipt-v1' as const
export const CAPTION_SPECIALIST_OBSERVABILITY_RECEIPT_VERSION =
  'caption-specialist-observability-receipt-v1' as const

export type CaptionProfessionalComponentKey =
  | 'caption_design'
  | 'caption_render_qa'

export interface CaptionProfessionalSkillCompositionTraceEntry {
  specialistKey: 'captions'
  disposition: 'selected' | 'restrained' | 'unresolved'
  selectedComponentKeys: CaptionProfessionalComponentKey[]
  restraintKey: 'no_captions' | null
  sourceSkillIds: string[]
  selectionSources: Array<
    | 'baseline'
    | 'user_prompt'
    | 'compiled_intent'
    | 'edit_brief'
    | 'edit_cue'
    | 'workflow_profile'
    | 'edit_level'
    | 'source_context'
  >
  exactRegistrySelectionVerified: true
  legacyOptionalCaptionComponentActivationAllowed: false
}

/**
 * Backward-readable shared trace. Older snapshots may omit it, but every plan
 * produced by the current planner emits it and canonical coverage must fail
 * closed when a new professional plan omits it.
 */
export interface ProfessionalSkillCompositionTrace {
  schemaVersion: typeof PROFESSIONAL_SKILL_COMPOSITION_TRACE_VERSION
  traceId: string
  traceDigestSha256: string
  entries: [CaptionProfessionalSkillCompositionTraceEntry]
  exactRegistrySelectionVerified: true
  selectionInferredFromLegacyOptionalComponent: false
  approvalOrExecutionAuthorityGranted: false
}

export type CaptionSpecialistMilestoneComponentKey =
  | 'CAP-02.composite'
  | 'CAP-03.domain_contracts'
  | 'CAP-04.transcript_lineage'
  | 'CAP-05.font_shaping'
  | 'CAP-06.early_planning'
  | 'CAP-07.finish_readiness'
  | 'CAP-08.visual_intelligence_support'
  | 'CAP-09.track_all_support'
  | 'CAP-10.semantic_style'
  | 'CAP-11.scene_graph'
  | 'CAP-12.storytiming_motion_handoffs'
  | 'CAP-13.sound_support'
  | 'CAP-14.remotion_render'
  | 'CAP-15.accessibility_export'
  | 'CAP-16.complete_qa_repair'

export interface CaptionSpecialistSnapshotComponentRef {
  componentKey: CaptionSpecialistMilestoneComponentKey
  componentRef: CaptionDomainRef
}

export interface CaptionSpecialistOutputScope {
  outputId: string
  aspectRatio: PlatformAspectRatio
  width: number
  height: number
  fpsNumerator: number
  fpsDenominator: number
  confirmedOutputFrameRef: CaptionRenderedVisualReviewConfirmedOutputFrameRef
}

export interface CaptionSpecialistApprovedSnapshotExtension {
  schemaVersion: typeof CAPTION_SPECIALIST_SNAPSHOT_EXTENSION_VERSION
  extensionId: string
  extensionDigestSha256: string
  ownerUserId: string
  workspaceId: string
  projectId: string
  editSessionId: string
  approvedSnapshotId: string
  approvedPlanVersionId: string
  selectionDisposition: 'selected' | 'restrained'
  compositionTraceRef: CaptionDomainRef
  ownerApprovedRestraintRef: CaptionDomainRef | null
  outputScopes: CaptionSpecialistOutputScope[]
  componentRefs: CaptionSpecialistSnapshotComponentRef[]
  executionBundleRef: CaptionDomainRef | null
  captionWorkBindingRef: CaptionDomainRef | null
  captionRenderQaWorkBindingRef: CaptionDomainRef | null
  assetManifestRefs: CaptionDomainRef[]
  estimateInputRef: CaptionDomainRef | null
  approvedEstimateRef: CaptionDomainRef | null
  creditReservationRef: CaptionDomainRef | null
  privateReviewDependencyRef: CaptionDomainRef | null
  postrenderVisualQaRequestRef: CaptionDomainRef | null
  brollOwnerReadRefs: CaptionDomainRef[]
  exactScopeFrameMasterTimingBound: boolean
  componentCoverageComplete: boolean
  workCoverageComplete: boolean
  manifestEstimateAndQaCoverageComplete: boolean
  privateArtifactPolicy: {
    tenantScoped: true
    createOnly: true
    byteFreeSerializedRecord: true
    rawTranscriptIncluded: false
    mediaBytesIncluded: false
    pathsOrUrlsIncluded: false
  }
  approvedSnapshotMutatedAfterApproval: false
  separateCaptionApprovalCreated: false
  separateCaptionCreditReservationCreated: false
  operationDispatchAuthority: false
  providerRuntimeAuthority: false
  assetMutationAuthority: false
  qaApprovalAuthority: false
  billingAuthority: false
  publicDeliveryAuthority: false
  productionAuthority: false
}

export type CaptionSpecialistPresentationPhase =
  | 'planning_selected'
  | 'planning_restrained'
  | 'approved_waiting_for_picture_lock'
  | 'finish_readiness_blocked'
  | 'ready_for_private_render'
  | 'waiting_for_qualified_visual_review'
  | 'repair_required'
  | 'ready_for_human_review'
  | 'caption_scope_passed'

export interface CaptionSpecialistChatPresentation {
  schemaVersion: typeof CAPTION_SPECIALIST_PRESENTATION_VERSION
  presentationId: string
  presentationDigestSha256: string
  source: 'professional_skill_plan' | 'approved_snapshot_authenticated_read'
  phase: CaptionSpecialistPresentationPhase
  title: string
  summary: string
  statusLabel: string
  selectionDisposition: 'selected' | 'restrained'
  opportunityCount: number | null
  reservedSceneCount: number | null
  readySceneCount: number | null
  blockedSceneCount: number | null
  visualReviewState:
    | 'not_applicable'
    | 'waiting'
    | 'repair_required'
    | 'needs_human_review'
    | 'passed'
  details: Array<{
    label: string
    value: string
  }>
  authenticatedVisualReviewRead:
    CaptionRenderedVisualReviewAuthenticatedReadResult | null
  revisionHint: string | null
  onePlanApprovalAndEstimateOnly: true
  browserLocalCompletionAccepted: false
  rawTranscriptIncluded: false
  mediaBytesIncluded: false
  pathsOrUrlsIncluded: false
  operationDispatchAuthority: false
  providerRuntimeAuthority: false
  qaApprovalAuthority: false
  creditOrBillingAuthority: false
  publicDeliveryAuthority: false
  productionAuthority: false
}

export type CaptionNaturalLanguageRevisionChange =
  | 'increase_readability'
  | 'decrease_caption_size'
  | 'increase_caption_size'
  | 'reduce_motion'
  | 'remove_decorative_emphasis'
  | 'move_to_safer_region'
  | 'change_caption_style'
  | 'correct_caption_wording'
  | 'enable_captions'
  | 'disable_captions'

export interface CaptionSpecialistNaturalLanguageRevisionIntent {
  schemaVersion: typeof CAPTION_SPECIALIST_REVISION_INTENT_VERSION
  revisionIntentId: string
  revisionIntentDigestSha256: string
  canonicalScope: CaptionDomainCanonicalScope
  sourceRequestDigestSha256: string
  requestedChanges: CaptionNaturalLanguageRevisionChange[]
  affectedSceneIds: string[]
  affectedOutputIds: string[]
  reasonCodes: string[]
  priorSnapshotRef: CaptionDomainRef
  priorComponentRefs: CaptionDomainRef[]
  requiresFreshPlan: true
  requiresFreshEstimateAndApproval: true
  requiresFreshPrivateReview: true
  priorSnapshotMutated: false
  rawRequestPersistedToWorker: false
  operationDispatchAuthority: false
  repairExecutionAuthority: false
  creditOrBillingAuthority: false
  publicDeliveryAuthority: false
  productionAuthority: false
}

export interface CaptionSpecialistComponentPersistenceReceipt {
  schemaVersion: typeof CAPTION_SPECIALIST_PERSISTENCE_RECEIPT_VERSION
  receiptId: string
  receiptDigestSha256: string
  ownerUserId: string
  workspaceId: string
  projectId: string
  editSessionId: string
  approvedSnapshotRef: CaptionDomainRef
  snapshotExtensionRef: CaptionDomainRef
  exactApprovedSnapshotRereadVerified: true
  exactExtensionDigestRereadVerified: true
  tenantScopeVerified: true
  immutableApprovedSnapshotPreserved: true
  persistenceOwner: 'canonical_approved_plan_snapshot_service'
  browserLocalCompletionAccepted: false
  separateCaptionPersistenceOwnerCreated: false
  operationDispatchAuthority: false
  providerRuntimeAuthority: false
  assetMutationAuthority: false
  qaApprovalAuthority: false
  billingAuthority: false
  publicDeliveryAuthority: false
  productionAuthority: false
}

export interface CaptionSpecialistObservabilityReceipt {
  schemaVersion: typeof CAPTION_SPECIALIST_OBSERVABILITY_RECEIPT_VERSION
  receiptId: string
  receiptDigestSha256: string
  workspaceId: string
  projectId: string
  editSessionId: string
  approvedSnapshotId: string | null
  selectionDisposition: 'selected' | 'restrained'
  phase: CaptionSpecialistPresentationPhase
  counters: {
    selectedComponentCount: number
    outputCount: number
    readySceneCount: number
    blockedSceneCount: number
    repairItemCount: number
    unresolvedExternalGateCount: number
  }
  lineageRefs: CaptionDomainRef[]
  rawUserTextIncluded: false
  rawTranscriptIncluded: false
  rawModelTextIncluded: false
  mediaBytesIncluded: false
  pathsOrUrlsIncluded: false
  secretsIncluded: false
  productionMetricPublished: false
  alertCreated: false
  billingAuthority: false
  publicDeliveryAuthority: false
  productionAuthority: false
}
