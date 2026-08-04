import type {
  CaptionDomainCanonicalScope,
  CaptionDomainContract,
  CaptionDomainRef,
} from './caption-domain-contracts'

export const CAPTION_DIRECT_VISUAL_INSPECTION_RECEIPT_VERSION =
  'caption-direct-visual-inspection-receipt-v1' as const
export const CAPTION_COMPLETE_QA_REPORT_VERSION =
  'caption-complete-qa-report-v1' as const
export const CAPTION_LOCAL_REPAIR_FALLBACK_PLAN_VERSION =
  'caption-local-repair-fallback-plan-v1' as const

export type CaptionCompleteQaCategory =
  | 'transcript'
  | 'alignment'
  | 'semantic'
  | 'typography'
  | 'visual_placement'
  | 'occlusion_mask'
  | 'motion'
  | 'sound'
  | 'accessibility_localization'
  | 'render_export'
  | 'policy_security'

export interface CaptionDirectVisualInspectionItem {
  inspectionItemId: string
  sourceArtifactRef: CaptionDomainRef
  sourceKind:
    | 'remotion_full_motion_golden'
    | 'remotion_reduced_motion_golden'
    | 'libass_widescreen_overlay'
    | 'libass_vertical_overlay_rejected'
    | 'libass_vertical_overlay_repair'
  outputId: string
  width: number
  height: number
  frameNumber: number | null
  rasterSha256: string
  disposition: 'passed' | 'failed_repaired'
  findingCodes: string[]
  actualRasterOpenedAndInspected: true
}

export interface CaptionDirectVisualInspectionReceipt {
  schemaVersion: typeof CAPTION_DIRECT_VISUAL_INSPECTION_RECEIPT_VERSION
  receiptId: string
  receiptDigestSha256: string
  canonicalScope: CaptionDomainCanonicalScope
  fullMotionRenderSpecRef: CaptionDomainRef | null
  reducedMotionRenderSpecRef: CaptionDomainRef | null
  accessibilityPlanRef: CaptionDomainRef
  inspectedArtifacts: CaptionDirectVisualInspectionItem[]
  repairChain: Array<{
    issueId: string
    failureCode: 'caption_vertical_single_line_horizontal_clipping'
    failedArtifactRef: CaptionDomainRef
    repairedArtifactRef: CaptionDomainRef
    repairActionCode: 'reject_clipped_fixture_add_safe_width_guard_use_short_stable_cue'
    repairVersion: 1
    predispatchGuardVersion: 'caption_libass_fixture_safe_width_guard_v1'
    reinspectionDisposition: 'passed'
  }>
  coverage: {
    renderDurationFrames: number
    requiredGoldenFrameNumbers: number[]
    fullMotionGoldenFramesInspected: number[]
    reducedMotionGoldenFramesInspected: number[]
    acceptedLibassOutputProfile:
      | 'widescreen_balanced_v1'
      | 'vertical_compact_v1'
    boundedGoldenRasterCoverageComplete: true
    completeTimePixelInspectionPerformed: false
    completeMotionPlaybackInspectionPerformed: false
  }
  inspectorClass: 'codex_agent_direct_raster_inspection'
  actualRenderedPixelsInspected: true
  deterministicTechnicalQaReplaced: false
  qualifiedVisualIntelligenceEvidenceClaimed: false
  independentFinalQaGranted: false
  browserLocalCompletionClaimed: false
  mediaBytesSerialized: false
  localPathsSerialized: false
  providerCallMade: false
  repairExecutionAuthorityGranted: false
  assetMutationAuthorityGranted: false
  finalQaApprovalGranted: false
  publicDeliveryGranted: false
  productionAuthorityGranted: false
}

export interface CaptionCompleteQaCheck {
  checkId: string
  category: CaptionCompleteQaCategory
  disposition: 'passed' | 'needs_evidence' | 'not_applicable'
  failureScope: 'none' | 'local' | 'global'
  evidenceRefs: CaptionDomainRef[]
  reasonCodes: string[]
  repairActionCode: string | null
  fallbackId: string | null
  blocksCaptionScopeAcceptance: boolean
  blocksFinalDelivery: boolean
}

export interface CaptionCompleteQaReport {
  schemaVersion: typeof CAPTION_COMPLETE_QA_REPORT_VERSION
  reportId: string
  reportDigestSha256: string
  canonicalScope: CaptionDomainCanonicalScope
  approvedSnapshotRef: CaptionDomainRef | null
  sceneGroupRef: CaptionDomainRef
  storyTimingResolutionRef: CaptionDomainRef
  motionPlanRef: CaptionDomainRef
  motionLockRef: CaptionDomainRef
  soundAdmissionRef: CaptionDomainRef
  fullMotionRenderSpecRef: CaptionDomainRef | null
  reducedMotionRenderSpecRef: CaptionDomainRef | null
  accessibilityPlanRef: CaptionDomainRef
  accessibleArtifactSetRef: CaptionDomainRef
  directInspectionReceiptRef: CaptionDomainRef
  qualifiedVisualIntelligenceEvidenceRef: CaptionDomainRef | null
  completeTrackExecutionEvidenceRef: CaptionDomainRef | null
  finalExportEvidenceRef: CaptionDomainRef | null
  checks: CaptionCompleteQaCheck[]
  passedCheckCount: number
  needsEvidenceCheckCount: number
  notApplicableCheckCount: number
  deterministicCaptionQaPassed: true
  boundedDirectVisualInspectionPassed: true
  repairedEvidenceKeptSeparateFromPassedEvidence: true
  completeTimeQualifiedAiVisualReviewCompleted: boolean
  completeTrackRuntimeQaCompleted: boolean
  finalExportQaCompleted: boolean
  captionScopeRecommendation:
    | 'accept_caption_scope'
    | 'repair_caption_scope'
    | 'blocked_external_evidence'
  localUnrelatedWorkMayContinue: true
  independentFinalQaStillRequired: true
  finalDeliveryAllowed: false
  operationDispatchAuthority: false
  repairExecutionAuthority: false
  assetMutationAuthority: false
  creditOrBillingAuthority: false
  finalQaApprovalAuthority: false
  publicDeliveryAuthority: false
  productionAuthority: false
}

export interface CaptionLocalRepairFallbackItem {
  itemId: string
  sourceCheckId: string
  issueCode: string
  affectedSceneIds: string[]
  affectedNodeIds: string[]
  owner:
    | 'caption_projection'
    | 'caption_layout'
    | 'track_all'
    | 'soundsync'
    | 'visual_intelligence'
    | 'canonical_font_runtime'
    | 'canonical_libass_runtime'
    | 'canonical_ffmpeg_packaging'
    | 'independent_final_qa'
  disposition:
    | 'completed_and_reinspected'
    | 'approved_fallback_selected'
    | 'blocked_external_owner'
  repairActionCode: string
  fallbackId: string | null
  evidenceRefs: CaptionDomainRef[]
  createsNewVersion: true
  preservesPriorArtifact: true
  requiresReinspection: boolean
  requiresNewApproval: boolean
  retryExecuted: false
}

export interface CaptionLocalRepairFallbackPlan {
  schemaVersion: typeof CAPTION_LOCAL_REPAIR_FALLBACK_PLAN_VERSION
  planId: string
  planDigestSha256: string
  canonicalScope: CaptionDomainCanonicalScope
  completeQaReportRef: CaptionDomainRef
  directInspectionReceiptRef: CaptionDomainRef
  items: CaptionLocalRepairFallbackItem[]
  fallbackLadder: [
    'retry_deterministic_local_operation_when_idempotent',
    'simplify_layout_or_motion_preserve_meaning',
    'move_creative_track_to_safe_plane',
    'replace_word_motion_with_stable_phrase_motion',
    'stable_open_captions_through_libass',
    'accessible_sidecars',
    'request_user_review_or_new_approval',
  ]
  blockingExternalGateCodes: string[]
  completedRepairCount: number
  selectedFallbackCount: number
  blockedExternalOwnerCount: number
  smallestAffectedScopeOnly: true
  hiddenQualityDowngradeAllowed: false
  unrelatedWorkMayContinue: true
  mapsChartsBrowserCaptionsTimingMasksQaFallbackToAiVideo: false
  retryOrRepairExecutionGranted: false
  snapshotMutationGranted: false
  assetMutationGranted: false
  finalQaApprovalGranted: false
  publicDeliveryGranted: false
  productionAuthorityGranted: false
}

export interface CaptionCompleteQaBundle {
  inspectionReceipt: CaptionDirectVisualInspectionReceipt
  report: CaptionCompleteQaReport
  repairPlan: CaptionLocalRepairFallbackPlan
  domainQaContract: CaptionDomainContract<'qa_report'>
  domainRepairContract: CaptionDomainContract<'repair_plan'>
}
