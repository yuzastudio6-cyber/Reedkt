import type { ID, ISODateString } from '../shared'
import type {
  MotionStudioOwnership,
  MotionStudioTimingAuthority,
  MotionStudioVersionReference,
} from './shared'

export const MOTION_STUDIO_FINE_CUT_MANIFEST_VERSION =
  'motion-studio.fine-cut-manifest.v1' as const
export const MOTION_STUDIO_FINE_CUT_BINDING_VERSION =
  'motion-studio.fine-cut-binding.v1' as const
export const MOTION_STUDIO_FINE_CUT_ARTIFACT_VERSION =
  'motion-studio.fine-cut-artifact.v1' as const
export const MOTION_STUDIO_FINE_CUT_RENDER_QUALITY_VERSION =
  'motion-studio.fine-cut-render-quality.v1' as const
export const MOTION_STUDIO_PRIVATE_REVIEW_BINDING_VERSION =
  'motion-studio.private-review-binding.v1' as const
export const MOTION_STUDIO_REVIEW_COMMENT_VERSION =
  'motion-studio.review-comment.v1' as const
export const MOTION_STUDIO_REVIEW_COMMENT_EVENT_VERSION =
  'motion-studio.review-comment-event.v1' as const
export const MOTION_STUDIO_FINE_CUT_REVIEW_DECISION_VERSION =
  'motion-studio.fine-cut-review-decision.v1' as const
export const MOTION_STUDIO_REVISION_IMPACT_VERSION =
  'motion-studio.revision-impact.v1' as const
export const MOTION_STUDIO_QUALITY_CONTROL_REPORT_VERSION =
  'motion-studio.quality-control-report.v1' as const
export const MOTION_STUDIO_DELIVERY_HANDOFF_VERSION =
  'motion-studio.delivery-handoff.v1' as const
export const MOTION_STUDIO_FINE_CUT_WORKSPACE_DTO_VERSION =
  'motion-studio.fine-cut-workspace.dto.v1' as const

export type MotionStudioFineCutAuthorityState = 'approved' | 'locked'

export type MotionStudioFineCutAuthorityRole =
  | 'picture_lock'
  | 'prepared_script'
  | 'story_bible'
  | 'research_package'
  | 'claim_ledger'
  | 'reconstruction_disclosure'
  | 'visual_coverage_plan'
  | 'reference_contract'
  | 'motion_dna'
  | 'motion_strategy'
  | 'visual_memory'
  | 'character_continuity'
  | 'location_continuity'
  | 'object_continuity'
  | 'source_audit'
  | 'rights_consent_provenance'
  | 'voice_bible'
  | 'pronunciation_performance'
  | 'music_bible'
  | 'cue_sheet'
  | 'scene_graph'
  | 'scene_document'
  | 'scene_recipe'
  | 'storyboard'
  | 'animatic'
  | 'audio_selection'
  | 'narration_assembly'
  | 'integrated_audio_mix'
  | 'caption_plan'
  | 'map_plan'
  | 'chart_plan'
  | 'document_plan'
  | 'exact_text_plan'
  | 'transition_plan'
  | 'color_plan'

export interface MotionStudioFineCutVersionAuthorityV1 {
  role: MotionStudioFineCutAuthorityRole
  version: MotionStudioVersionReference
  state: MotionStudioFineCutAuthorityState
  current: true
  qaPassed: true
  rightsVerified: true
  placeholder: false
}

export interface MotionStudioFineCutManifestAuthorityV1 {
  manifestId: ID
  manifestVersionId: ID
  manifestVersion: number
  manifestDigest: string
  current: true
  qaPassed: true
}

export interface MotionStudioFineCutSceneAuthorityV1 {
  sceneId: ID
  sceneDocument: MotionStudioFineCutVersionAuthorityV1
  startFrame: number
  endFrame: number
  selectedAssetVersionIds: readonly ID[]
  propertyLockIds: readonly ID[]
}

export interface MotionStudioFineCutAssetAuthorityV1 {
  assetId: ID
  assetVersionId: ID
  checksumSha256: string
  contentDigest: string
  mimeType: string
  sceneId: ID
  layerId: ID
  startFrame: number
  endFrame: number
  required: true
  current: true
  qaPassed: true
  privateAsset: true
  placeholder: false
  rightsVerified: true
  provenanceVerified: true
}

export interface MotionStudioFineCutCostAuthorityV1 {
  approvedEstimateId: ID
  approvedEstimateDigest: string
  planApprovalId: ID
  planApprovalDigest: string
  costBudgetId: ID
  internalCostActualId: ID
  internalCostActualDigest: string
  maximumAuthorizedInternalCostMicros: number
  inheritedActualInternalCostMicros: number
  fineCutMaximumIncrementalInternalCostMicros: number
  currency: 'USD'
  reconciled: true
  withinApprovedMaximum: true
  customerPriceIncluded: false
  customerCreditsIncluded: false
  serviceFeeIncluded: false
  walletMutationPerformed: false
  billingMutationPerformed: false
}

export interface MotionStudioFineCutManifestV1 extends MotionStudioOwnership {
  schemaVersion: typeof MOTION_STUDIO_FINE_CUT_MANIFEST_VERSION
  moduleId: 'storytelling'
  productionId: ID
  productionRecordVersion: number
  moduleCatalogVersion: string
  stageProfileId: string
  fineCutId: ID
  fineCutVersionId: ID
  fineCutVersion: number
  supersedesFineCutVersionId?: ID
  approvedSnapshotId: ID
  approvedSnapshotDigest: string
  timingAuthority: MotionStudioTimingAuthority
  pictureLock: MotionStudioFineCutVersionAuthorityV1
  preparedScript: MotionStudioFineCutVersionAuthorityV1
  storyBible: MotionStudioFineCutVersionAuthorityV1
  researchPackage: MotionStudioFineCutVersionAuthorityV1
  claimLedger: MotionStudioFineCutVersionAuthorityV1
  reconstructionDisclosure: MotionStudioFineCutVersionAuthorityV1
  visualCoveragePlan: MotionStudioFineCutVersionAuthorityV1
  referenceContracts: readonly MotionStudioFineCutVersionAuthorityV1[]
  motionDna: MotionStudioFineCutVersionAuthorityV1
  motionStrategy: MotionStudioFineCutVersionAuthorityV1
  visualMemory: readonly MotionStudioFineCutVersionAuthorityV1[]
  continuityAuthorities: readonly MotionStudioFineCutVersionAuthorityV1[]
  sourceAudits: readonly MotionStudioFineCutVersionAuthorityV1[]
  rightsConsentProvenance: readonly MotionStudioFineCutVersionAuthorityV1[]
  voiceBible: MotionStudioFineCutVersionAuthorityV1
  pronunciationPerformance: MotionStudioFineCutVersionAuthorityV1
  musicBible: MotionStudioFineCutVersionAuthorityV1
  cueSheet: MotionStudioFineCutVersionAuthorityV1
  sceneGraph: MotionStudioFineCutVersionAuthorityV1
  sceneRecipes: readonly MotionStudioFineCutVersionAuthorityV1[]
  storyboard: MotionStudioFineCutVersionAuthorityV1
  animatic: MotionStudioFineCutVersionAuthorityV1
  audioSelection: MotionStudioFineCutVersionAuthorityV1
  narrationAssembly: MotionStudioFineCutVersionAuthorityV1
  integratedAudioMix: MotionStudioFineCutVersionAuthorityV1
  captionPlan: MotionStudioFineCutVersionAuthorityV1
  mapPlan: MotionStudioFineCutVersionAuthorityV1
  chartPlan: MotionStudioFineCutVersionAuthorityV1
  documentPlan: MotionStudioFineCutVersionAuthorityV1
  exactTextPlan: MotionStudioFineCutVersionAuthorityV1
  transitionPlan: MotionStudioFineCutVersionAuthorityV1
  colorPlan: MotionStudioFineCutVersionAuthorityV1
  timelineManifest: MotionStudioFineCutManifestAuthorityV1
  renderManifest: MotionStudioFineCutManifestAuthorityV1
  dependencyGraphManifest: MotionStudioFineCutManifestAuthorityV1
  scenes: readonly MotionStudioFineCutSceneAuthorityV1[]
  requiredAssets: readonly MotionStudioFineCutAssetAuthorityV1[]
  requiredWorkItemIds: readonly ID[]
  requiredQaGateIds: readonly ID[]
  costAuthority: MotionStudioFineCutCostAuthorityV1
  sourceAuthorityDigest: string
  invalidationState: 'current_no_unresolved_invalidation'
  fineCutEligible: true
  eligibilityDerivedBy: 'motion_studio_fine_cut_compiler_v1'
  immutable: true
  timelineMutationAllowed: false
  providerCallAllowed: false
  exportAllowed: false
  publicDeliveryAllowed: false
  productReady: false
  createdAt: ISODateString
}

export interface MotionStudioFineCutBindingV1 extends MotionStudioOwnership {
  schemaVersion: typeof MOTION_STUDIO_FINE_CUT_BINDING_VERSION
  productionId: ID
  bindingId: ID
  fineCutVersionId: ID
  fineCutManifestDigest: string
  approvedSnapshotId: ID
  packageRecordId: ID
  approvedWorkItemId: ID
  jobId: ID
  costBudgetId: ID
  maximumAttempts: 1
  automaticRetry: false
  automaticFallback: false
  automaticSubstitution: false
  canonicalPackageQueue: true
  registeredCompositionOnly: true
  callerCodeAllowed: false
  callerArgumentsAllowed: false
  callerPathAllowed: false
  providerUrlAllowed: false
  privateReviewOnly: true
  immutable: true
}

export interface MotionStudioFineCutArtifactV1 extends MotionStudioOwnership {
  schemaVersion: typeof MOTION_STUDIO_FINE_CUT_ARTIFACT_VERSION
  productionId: ID
  artifactId: ID
  artifactVersionId: ID
  fineCutVersionId: ID
  fineCutManifestDigest: string
  canonicalReviewAssemblyId: ID
  canonicalReviewManifestSha256: string
  checksumSha256: string
  byteLength: number
  mimeType: 'video/mp4'
  codec: 'h264'
  audioCodec: 'aac'
  pixelFormat: 'yuv420p'
  colorSpace: 'bt709'
  width: number
  height: number
  frameRate: number
  durationFrames: number
  privateAsset: true
  createOnly: true
  checksumVerified: true
  privateReadbackVerified: true
  proxyReviewArtifact: true
  masterExportQualityClaimed: false
  qaStatus: 'pending_independent_qa' | 'passed' | 'failed'
  timelineReady: false
  exportReady: false
  publicDeliveryReady: false
  productReady: false
  createdAt: ISODateString
  immutable: true
}

export type MotionStudioFineCutRenderQaGate =
  | 'manifest_integrity'
  | 'media_integrity'
  | 'frame_count_and_duration'
  | 'frame_rate_and_output_frame'
  | 'video_decode'
  | 'audio_decode_and_stream_count'
  | 'audio_video_sync'
  | 'black_and_frozen_frames'
  | 'color_space_and_pixel_format'
  | 'checksum_and_private_readback'

export interface MotionStudioFineCutRenderQaGateResultV1 {
  gate: MotionStudioFineCutRenderQaGate
  status: 'passed' | 'failed' | 'not_run'
  blocking: true
  evidenceId?: ID
  evidenceDigest?: string
  note: string
}

export interface MotionStudioFineCutRenderQualityReportV1 extends MotionStudioOwnership {
  schemaVersion: typeof MOTION_STUDIO_FINE_CUT_RENDER_QUALITY_VERSION
  productionId: ID
  reportId: ID
  fineCutVersionId: ID
  fineCutManifestDigest: string
  artifactId: ID
  artifactVersionId: ID
  artifactChecksumSha256: string
  gateResults: readonly MotionStudioFineCutRenderQaGateResultV1[]
  allBlockingGatesPassed: boolean
  privateReviewEligible: boolean
  humanOverrideAllowed: false
  createdAt: ISODateString
  immutable: true
}

export interface MotionStudioPrivateReviewBindingV1 extends MotionStudioOwnership {
  schemaVersion: typeof MOTION_STUDIO_PRIVATE_REVIEW_BINDING_VERSION
  productionId: ID
  reviewBindingId: ID
  fineCutVersionId: ID
  fineCutManifestDigest: string
  canonicalPackageRecordId: ID
  canonicalReviewAssemblyId: ID
  canonicalReviewManifestSha256: string
  canonicalFinalArtifactSha256: string
  artifactId: ID
  artifactVersionId: ID
  durationFrames: number
  frameRate: number
  width: number
  height: number
  renderQualityReportId: ID
  renderQualityReportDigest: string
  renderQaPassed: true
  current: true
  privateReviewReady: true
  publicExportReady: false
  productReady: false
  immutable: true
}

export interface MotionStudioFrameRangeV1 {
  startFrame: number
  endFrame: number
}

export interface MotionStudioReviewCommentV1 extends MotionStudioOwnership {
  schemaVersion: typeof MOTION_STUDIO_REVIEW_COMMENT_VERSION
  productionId: ID
  commentId: ID
  fineCutVersionId: ID
  reviewBindingId: ID
  fineCutDurationFrames: number
  frameRange: MotionStudioFrameRangeV1
  body: string
  authoredByActorId: ID
  createdAt: ISODateString
  originalState: 'open'
  inertUntrustedText: true
  toolInvocationAllowed: false
  productionMutationAllowed: false
  immutable: true
}

export interface MotionStudioReviewCommentEventV1 extends MotionStudioOwnership {
  schemaVersion: typeof MOTION_STUDIO_REVIEW_COMMENT_EVENT_VERSION
  productionId: ID
  eventId: ID
  commentId: ID
  fineCutVersionId: ID
  sequence: number
  expectedPreviousState: 'open' | 'resolved' | 'reopened' | 'dismissed'
  event: 'resolve' | 'reopen' | 'dismiss'
  resultingState: 'resolved' | 'reopened' | 'dismissed'
  reason: string
  actorId: ID
  createdAt: ISODateString
  appendOnly: true
  originalCommentMutated: false
  immutable: true
}

export type MotionStudioFineCutReviewDecision = 'approve' | 'request_changes' | 'reject'

export interface MotionStudioFineCutReviewDecisionV1 extends MotionStudioOwnership {
  schemaVersion: typeof MOTION_STUDIO_FINE_CUT_REVIEW_DECISION_VERSION
  productionId: ID
  decisionId: ID
  fineCutVersionId: ID
  reviewBindingId: ID
  canonicalReviewAssemblyId: ID
  canonicalReviewManifestSha256: string
  canonicalFinalArtifactSha256: string
  expectedReviewRecordVersion: number
  decision: MotionStudioFineCutReviewDecision
  commentIds: readonly ID[]
  unresolvedActionRequiredCommentIds: readonly ID[]
  renderQaPassed: boolean
  blockingQualityControlPassed: boolean
  currentFineCutReverified: true
  decidedByActorId: ID
  decidedAt: ISODateString
  immutable: true
  humanOverrideOfBlockingQaAllowed: false
  fineCutLocked: boolean
  revisionImpactRequired: boolean
  deliveryEligible: false
  timelineMutationPerformed: false
  renderStarted: false
  exportStarted: false
  publicDeliveryStarted: false
}

export type MotionStudioRevisionImpactRoute =
  | 'covered_no_cost_metadata_or_render_only'
  | 'new_private_render_within_approved_maximum'
  | 'new_plan_estimate_and_approval_required'
  | 'blocked_for_user_review'

export interface MotionStudioRevisionImpactV1 extends MotionStudioOwnership {
  schemaVersion: typeof MOTION_STUDIO_REVISION_IMPACT_VERSION
  productionId: ID
  impactId: ID
  fineCutVersionId: ID
  sourceDecisionId: ID
  sourceCommentIds: readonly ID[]
  chatRevisionProposalId: ID
  normalizedRequestedChange: string
  affectedArtifactVersionIds: readonly ID[]
  affectedTargetPaths: readonly string[]
  affectedSceneIds: readonly ID[]
  affectedShotIds: readonly ID[]
  affectedFrameRanges: readonly MotionStudioFrameRangeV1[]
  affectedAudioSampleRanges: readonly { startSample: number; endSample: number }[]
  affectedJobIds: readonly ID[]
  affectedAssetVersionIds: readonly ID[]
  affectedRenderIds: readonly ID[]
  invalidatedLockIds: readonly ID[]
  preservedArtifactVersionIds: readonly ID[]
  preservedLockIds: readonly ID[]
  changesMeaning: boolean
  changesTimingOrFrame: boolean
  changesRightsOrConsent: boolean
  changesProviderRoute: boolean
  changesQualityAuthority: boolean
  requiresGeneration: boolean
  requiresPrivateRender: boolean
  changesInternalCost: boolean
  estimatedIncrementalInternalCostMicros: number
  remainingApprovedInternalCostMicros: number
  withinApprovedMaximum: boolean
  approvalStillCoversChange: boolean
  approvedFallbackAuthorityId?: ID
  approvedFallbackAuthorityDigest?: string
  route: MotionStudioRevisionImpactRoute
  nextAction: 'return_to_chat' | 'create_successor_fine_cut' | 'request_plan_review'
  approvedFineCutMutated: false
  executionStarted: false
  createdAt: ISODateString
  immutable: true
}

export type MotionStudioQualityControlGate =
  | 'identity_snapshot_version_dependency_integrity'
  | 'required_asset_completeness_no_final_placeholder'
  | 'story_script_claim_source_and_disclosure'
  | 'visual_coverage_reference_motion_language'
  | 'character_object_location_continuity'
  | 'visual_artifacts_flicker_black_freeze_plausibility'
  | 'camera_motion_scene_transition_coherence'
  | 'exact_text_captions_data_maps_logos_safe_zones'
  | 'frame_timing_duration_caption_and_av_sync'
  | 'narration_pronunciation_continuity_loudness'
  | 'voice_music_cue_foley_sfx_and_speech_clarity'
  | 'color_codec_pixel_format_and_media_integrity'
  | 'rights_consent_provenance_retention_disclosure'
  | 'must_follow_avoid_and_professional_quality'
  | 'internal_cost_authorization_and_reconciliation'
  | 'tenant_private_readback_and_delivery_eligibility'

export interface MotionStudioQualityControlGateResultV1 {
  gate: MotionStudioQualityControlGate
  status: 'passed' | 'warning' | 'failed' | 'not_run'
  blocking: boolean
  evidenceIds: readonly ID[]
  evidenceDigest: string
  frameRange?: MotionStudioFrameRangeV1
  recommendedAction: string
  warningAcknowledgementId?: ID
}

export interface MotionStudioQualityControlReportV1 extends MotionStudioOwnership {
  schemaVersion: typeof MOTION_STUDIO_QUALITY_CONTROL_REPORT_VERSION
  productionId: ID
  reportId: ID
  fineCutVersionId: ID
  fineCutManifestDigest: string
  reviewDecisionId: ID
  gateResults: readonly MotionStudioQualityControlGateResultV1[]
  allRequiredGatesPresentExactlyOnce: boolean
  allBlockingGatesPassed: boolean
  allWarningsAcknowledged: boolean
  status: 'blocked' | 'warnings_require_acknowledgement' | 'passed'
  deliveryEligible: boolean
  humanOverrideOfBlockingQaAllowed: false
  internalCostActualId: ID
  internalCostActualDigest: string
  approvedMaximumInternalCostMicros: number
  reconciledActualInternalCostMicros: number
  customerPriceIncluded: false
  customerCreditsIncluded: false
  serviceFeeIncluded: false
  walletMutationPerformed: false
  billingMutationPerformed: false
  createdAt: ISODateString
  immutable: true
}

export interface MotionStudioDeliveryHandoffV1 extends MotionStudioOwnership {
  schemaVersion: typeof MOTION_STUDIO_DELIVERY_HANDOFF_VERSION
  productionId: ID
  handoffId: ID
  fineCutVersionId: ID
  fineCutManifestDigest: string
  fineCutReviewDecisionId: ID
  approvedSnapshotId: ID
  approvedSnapshotDigest: string
  qualityControlReportId: ID
  qualityControlReportDigest: string
  existingExportRecordId: ID
  exportManifestId: ID
  exportManifestDigest: string
  timelineManifestId: ID
  timelineManifestDigest: string
  renderManifestId: ID
  renderManifestDigest: string
  internalCostActualId: ID
  deliveryApprovalId: ID
  deliveryApprovalDigest: string
  privateOutputAssetVersionIds: readonly ID[]
  provenanceRecordIds: readonly ID[]
  currentAuthorityDigest: string
  status: 'ready_for_existing_export_system'
  currentAuthorityReverified: true
  deliveryApproved: true
  publicUrlCreated: false
  publicLinkCreated: false
  externalUploadStarted: false
  publicExportStarted: false
  customerChargeStarted: false
  deploymentStarted: false
  immutable: true
  createdAt: ISODateString
}

export type MotionStudioFineCutWorkspaceState =
  | 'empty'
  | 'preparing'
  | 'rendering'
  | 'failed'
  | 'reconciliation_required'
  | 'cancelled'
  | 'ready_for_review'
  | 'changes_requested'
  | 'stale'
  | 'approved_locked'
  | 'quality_control_blocked'
  | 'delivery_ready'
  | 'private_complete'
  | 'access_denied'
  | 'not_found'
  | 'unavailable'

export interface MotionStudioFineCutWorkspaceDtoV1 {
  schemaVersion: typeof MOTION_STUDIO_FINE_CUT_WORKSPACE_DTO_VERSION
  productionId: ID
  state: MotionStudioFineCutWorkspaceState
  currentFineCut?: {
    versionId: ID
    version: number
    reviewable: boolean
    locked: boolean
  }
  review?: {
    mediaReady: boolean
    commentCount: number
    unresolvedActionRequiredCommentCount: number
    decision?: MotionStudioFineCutReviewDecision
  }
  qualityControl?: {
    status: 'not_ready' | 'blocked' | 'warnings_require_acknowledgement' | 'passed'
    blockingFailureCount: number
    warningCount: number
  }
  delivery?: {
    readyForExistingExportSystem: boolean
    privateComplete: boolean
  }
  recovery?: {
    retryAvailable: boolean
    resumeAvailable: boolean
    reconciliationRequired: boolean
    preservedInput: boolean
  }
  primaryAction: 'continue_in_chat' | 'load_private_review' | 'review_changes' |
    'acknowledge_warnings' | 'retry_preparation' | 'resume_preparation' |
    'reconcile_result' | 'prepare_delivery' | 'none'
  message: string
  privateOnly: true
  providerCallAllowed: false
  timelineMutationAllowed: false
  renderStartAllowedFromWorkspace: false
  exportStartAllowedFromWorkspace: false
  publicDeliveryAllowed: false
  customerCommercialAuthority: false
}
