import type { CaptionDomainRef } from './caption-domain-contracts'

export const CAPTION_GOAL_COMPLETION_AUDIT_VERSION =
  'caption-goal-completion-audit-v1' as const

export const CAPTION_GOAL_COMPLETION_GAP_IDS = [
  'canonical_transcript_owner_authenticated_read',
  'visual_intelligence_authenticated_evidence',
  'track_all_authenticated_evidence',
  'soundsync_authenticated_evidence',
  'broll_owner_authenticated_read',
  'canonical_backend_private_execution_mount',
  'qualified_ai_complete_time_visual_review',
  'independent_final_qa_reread',
  'final_per_job_qualification_projection',
] as const

export type CaptionGoalCompletionGapId =
  typeof CAPTION_GOAL_COMPLETION_GAP_IDS[number]

export type CaptionGoalCompletionOwnerKey =
  | 'captions'
  | 'backend_workflow'
  | 'canonical_transcript'
  | 'visual_intelligence'
  | 'track_all'
  | 'soundsync'
  | 'broll_owner'
  | 'canonical_postrender_visual_qa'
  | 'canonical_private_review'

export interface CaptionGoalCompletionGap {
  gapId: CaptionGoalCompletionGapId
  ownerKeys: CaptionGoalCompletionOwnerKey[]
  missingEvidenceCodes: string[]
  prerequisiteRefs: CaptionDomainRef[]
  blocksTerminalStatus: true
  captionMayImplementDuplicateOwner: false
  runtimeOrDispatchAuthorityGrantedByAudit: false
}

export interface CaptionGoalCompletionAudit {
  schemaVersion: typeof CAPTION_GOAL_COMPLETION_AUDIT_VERSION
  auditId: string
  auditDigestSha256: string
  observedAt: string
  sourceSequentialResumeCheckpointRef: CaptionDomainRef
  sourceCap20ReleaseRef: CaptionDomainRef
  sourceSharedOwnerIntegrationHandoffRef: CaptionDomainRef
  sourcePlanningManifestRef: CaptionDomainRef
  sourcePlanningQualificationSnapshotRef: CaptionDomainRef
  counts: {
    declaredCaptionJobs: 41
    currentlyAdmittedJobs: 29
    conditionalSharedOwnerJobs: 12
    requiredSharedOwners: 5
    authenticatedPrivateSharedOwnerIntegrations: 0
    remainingTerminalGaps: 9
  }
  completedEvidence: {
    cap00rThroughCap20SourceMilestonesComplete: true
    captionFeatureModulesComplete: true
    planningManifestComplete: true
    perJobPlanningQualificationComplete: true
    standalonePlanningRuntimeAndHarnessComplete: true
    boundedSequentialSupportResumeProved: true
    currentAdmittedSurfaceQualified: true
    actualPrivateRenderedMediaEvidencePresent: true
    directRenderedRasterInspectionPresent: true
    captionLivingFrameTypedBoundaryComplete: true
    sharedOwnerPublicHandoffComplete: true
  }
  terminalEvidence: {
    canonicalBackendPrivateExecutionMounted: false
    fullConditionalJobSurfaceIntegrated: false
    authenticatedPrivateSharedOwnerEvidenceIntegrated: false
    qualifiedAiCompleteTimeVisualReviewIntegrated: false
    independentFinalQaRereadIntegrated: false
    finalPerJobQualificationProjectionPublished: false
  }
  gaps: CaptionGoalCompletionGap[]
  currentStatus: 'ready_for_shared_pipeline_integration'
  targetTerminalStatus: 'caption_specialist_private_internal_qualified'
  terminalStatusClaimed: false
  publicProductionRequiredForTerminalStatus: false
  centralOrchestraRequiredForTerminalStatus: false
  centralOrchestraImplemented: false
  browserLocalCompletionAccepted: false
  historicalEvidenceRelabeledAsFreshRuntime: false
  technicalQaRelabeledAsVisualAiReview: false
  directVisualInspectionRelabeledAsCompleteTimeAiReview: false
  operationDispatchAuthority: false
  providerOrModelRuntimeAuthority: false
  assetMutationAuthority: false
  finalQaApprovalAuthority: false
  creditOrBillingAuthority: false
  publicDeliveryAuthority: false
  productionAuthority: false
}
