import type { CaptionDomainRef } from './caption-domain-contracts'
import type { CaptionsSupportedJobType } from './captions-specialist'

export const CANONICAL_CAPTION_SPECIALIST_PLANNING_BINDING_VERSION =
  'canonical-caption-specialist-planning-binding-v1' as const
export const CANONICAL_CAPTION_SPECIALIST_PLANNING_BINDING_V2_VERSION =
  'canonical-caption-specialist-planning-binding-v2' as const
export const CANONICAL_CAPTION_SPECIALIST_PLANNING_BINDING_V3_VERSION =
  'canonical-caption-specialist-planning-binding-v3' as const
export const CANONICAL_CAPTION_SPECIALIST_PLANNING_PROJECTION_VERSION =
  'canonical-caption-specialist-planning-projection-v1' as const
export const CANONICAL_CAPTION_SPECIALIST_PLANNING_PROJECTION_V2_VERSION =
  'canonical-caption-specialist-planning-projection-v2' as const
export const CANONICAL_CAPTION_SPECIALIST_PLANNING_PROJECTION_V3_VERSION =
  'canonical-caption-specialist-planning-projection-v3' as const
export const CANONICAL_CAPTION_SPECIALIST_PLANNING_PROJECTION_COMPONENT_KEY =
  'canonicalCaptionSpecialistPlanningProjection' as const
export const CANONICAL_CAPTION_SPECIALIST_ESTIMATE_BINDING_VERSION =
  'canonical-caption-specialist-estimate-binding-v1' as const
export const CANONICAL_CAPTION_SPECIALIST_JOB_ASSIGNMENT_VERSION =
  'canonical-caption-specialist-job-assignment-v1' as const

export type CanonicalCaptionTrackingJobType =
  | 'resolve_subject_occluded_typography'
  | 'resolve_front_of_subject_typography'
  | 'resolve_object_anchored_typography'
  | 'resolve_environmental_typography'

export type CanonicalCaptionSpecialistAssignmentTrigger =
  | 'approved_early_plan'
  | 'approved_picture_lock'
  | 'approved_boundary_requirement'
  | 'hq_mediated_support_request'
  | 'canonical_caption_qa_repair'
  | 'canonical_caption_output_recomposition'
  | 'canonical_caption_result_inspection'
  | 'canonical_caption_boundary_inspection'

export interface CanonicalCaptionSpecialistJobAssignmentIntent {
  assignmentId: string
  jobType: CaptionsSupportedJobType
  scopeLevel: 'video' | 'scene' | 'boundary'
  outputId: string
  sceneId: string | null
  boundaryId: string | null
  authorizedFrameRange: {
    startFrame: number
    endFrameExclusive: number
  }
  trigger: CanonicalCaptionSpecialistAssignmentTrigger
  selectionEvidenceRef: CaptionDomainRef
  sourceSupportRequestRef: CaptionDomainRef | null
  reasonCodes: string[]
  callerMayCreateWork: false
  captionMayDispatchPeerDirectly: false
  captionMayExpandScope: false
  browserMayMarkComplete: false
}

export interface CanonicalCaptionSpecialistPlanningBindingV1 {
  schemaVersion:
    typeof CANONICAL_CAPTION_SPECIALIST_PLANNING_BINDING_VERSION
  bindingId: string
  bindingDigestSha256: string
  canonicalScope: {
    ownerUserId: string
    workspaceId: string
    projectId: string
    editSessionId: string
    planningRequestId: string
    outputId: string
  }
  confirmedOutputFrame: {
    width: number
    height: number
    fpsNumerator: number
    fpsDenominator: number
    confirmedOutputFrameRef: CaptionDomainRef
  }
  professionalSkillCompositionTraceRef: CaptionDomainRef
  earlyPlanningBundleRef: CaptionDomainRef
  canonicalTranscriptRef: CaptionDomainRef
  masterTimingRef: CaptionDomainRef
  captionEstimateInputRef: CaptionDomainRef
  scenePolicies: Array<{
    sceneId: string
    trackingJobType: CanonicalCaptionTrackingJobType | null
    crossSystemTarget:
      | 'broll'
      | 'living_frame'
      | 'map'
      | 'chart'
      | 'diagram'
      | 'transition'
      | null
  }>
  privateArtifact: true
  byteFree: true
  rawChatIncluded: false
  transcriptTextIncluded: false
  mediaBytesIncluded: false
  pathsUrlsOrCredentialsIncluded: false
  approvedSnapshotPredictedOrInjected: false
  workCreationAuthorityGrantedToCaption: false
  operationDispatchAuthorityGranted: false
  providerRuntimeAuthorityGranted: false
  assetMutationAuthorityGranted: false
  finalQaApprovalAuthorityGranted: false
  billingAuthorityGranted: false
  publicDeliveryGranted: false
  productionAuthorityGranted: false
}

export interface CanonicalCaptionSpecialistPlanningBindingV2
  extends Omit<CanonicalCaptionSpecialistPlanningBindingV1,
    'schemaVersion'> {
  schemaVersion:
    typeof CANONICAL_CAPTION_SPECIALIST_PLANNING_BINDING_V2_VERSION
  assignmentIntents: CanonicalCaptionSpecialistJobAssignmentIntent[]
  assignmentsSelectedByCanonicalPlanOwner: true
  oneAllFeatureEditFabricated: false
}

/**
 * Fresh source-led plans cannot know the final postapproval transcript digest.
 * V3 therefore freezes a source-bound expectation, never a fabricated final
 * transcript reference. The canonical transcript owner resolves it after
 * approval and persists an exact expectation-to-transcript binding.
 */
export interface CanonicalCaptionSpecialistPlanningBindingV3
  extends Omit<CanonicalCaptionSpecialistPlanningBindingV2,
    'schemaVersion' | 'canonicalTranscriptRef'> {
  schemaVersion:
    typeof CANONICAL_CAPTION_SPECIALIST_PLANNING_BINDING_V3_VERSION
  canonicalTranscriptExpectationRef: CaptionDomainRef
  postapprovalCanonicalTranscriptResolutionRequired: true
}

export type CanonicalCaptionSpecialistPlanningBinding =
  | CanonicalCaptionSpecialistPlanningBindingV1
  | CanonicalCaptionSpecialistPlanningBindingV2
  | CanonicalCaptionSpecialistPlanningBindingV3

export interface CanonicalCaptionSpecialistEstimateBindingMetadata {
  schemaVersion:
    typeof CANONICAL_CAPTION_SPECIALIST_ESTIMATE_BINDING_VERSION
  outputId: string
  compositionTraceRef: CaptionDomainRef
  earlyPlanningBundleRef: CaptionDomainRef
  captionEstimateInputRef: CaptionDomainRef
  selectedComponentKeys: ['caption_design', 'caption_render_qa']
  estimateOwnerRemainsCanonical: true
  serviceFeeIncludedInCaptionWorkCost: false
  billingAuthorityGrantedToCaption: false
}

export interface CanonicalCaptionSpecialistPlanningProjectionV1 {
  schemaVersion:
    typeof CANONICAL_CAPTION_SPECIALIST_PLANNING_PROJECTION_VERSION
  projectionId: string
  projectionDigestSha256: string
  disposition:
    | 'planning_work_projected_downstream_caption_execution_required'
    | 'no_caption_work_owner_restraint_preserved'
  planningBindingRef: CaptionDomainRef
  compositionTraceRef: CaptionDomainRef
  earlyPlanningBundleRef: CaptionDomainRef
  outputId: string
  captionEstimateLineKey: string | null
  projectedWorkItemKeys: string[]
  projectedJobTypes: CaptionsSupportedJobType[]
  projectedSceneIds: string[]
  postapprovalTranscriptBindingRequired: boolean
  authenticatedOwnerResumeRequired: boolean
  downstreamCaptionRenderWorkRequired: boolean
  deterministicRenderedCaptionQaRequired: boolean
  qualifiedCompleteTimeVisualReviewRequired: boolean
  independentPrivateReviewRequired: boolean
  planningJobsClaimFinishedCaptionMedia: false
  fullyApprovedCaptionExecutionCoverageClaimed: false
  captionWorkItemsCreatedByCanonicalPlanner: true
  captionWorkItemsCreatedByBrowser: false
  directPeerDispatchGranted: false
  providerRuntimeAuthorityGranted: false
  assetMutationAuthorityGranted: false
  finalQaApprovalAuthorityGranted: false
  billingAuthorityGranted: false
  publicDeliveryGranted: false
  productionAuthorityGranted: false
}

export interface CanonicalCaptionSpecialistPlanningProjectionV2
  extends Omit<CanonicalCaptionSpecialistPlanningProjectionV1,
    'schemaVersion'> {
  schemaVersion:
    typeof CANONICAL_CAPTION_SPECIALIST_PLANNING_PROJECTION_V2_VERSION
  assignmentIntentRefs: CaptionDomainRef[]
  projectedBoundaryIds: string[]
  exactAssignmentIntentCoverage: true
  repairOrSupportWorkProjectedOnlyFromTypedTrigger: true
  oneAllFeatureEditFabricated: false
}

export interface CanonicalCaptionSpecialistPlanningProjectionV3
  extends Omit<CanonicalCaptionSpecialistPlanningProjectionV2,
    'schemaVersion'> {
  schemaVersion:
    typeof CANONICAL_CAPTION_SPECIALIST_PLANNING_PROJECTION_V3_VERSION
  canonicalTranscriptExpectationRef: CaptionDomainRef
  postapprovalCanonicalTranscriptResolutionRequired: true
}

export type CanonicalCaptionSpecialistPlanningProjection =
  | CanonicalCaptionSpecialistPlanningProjectionV1
  | CanonicalCaptionSpecialistPlanningProjectionV2
  | CanonicalCaptionSpecialistPlanningProjectionV3
