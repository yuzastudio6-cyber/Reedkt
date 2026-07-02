import type { OpenSourceToolId, ProviderModel } from './reeditpro'

export type EditingAgentLayer =
  | 'planning_agent'
  | 'editing_supervisor_agent'
  | 'asset_generation_agent'
  | 'tool_execution_agent'
  | 'timing_agent'
  | 'renderer_agent'
  | 'qa_agent'
  | 'revision_agent'

export type EditWorkItemType =
  | 'validate_approved_snapshot'
  | 'prepare_source_trim'
  | 'select_retake'
  | 'validate_meaning_preservation'
  | 'prepare_caption_timing'
  | 'prepare_visual_cue_timing'
  | 'prepare_soundsync_timing'
  | 'generate_image_asset'
  | 'generate_ai_video_asset'
  | 'render_map_asset'
  | 'render_chart_asset'
  | 'capture_browser_asset'
  | 'run_audio_analysis'
  | 'run_audio_stretch'
  | 'process_image_asset'
  | 'process_video_asset'
  | 'generate_mask_asset'
  | 'prepare_remotion_layer'
  | 'render_remotion_preview'
  | 'render_final_export'
  | 'run_asset_qa'
  | 'run_timing_qa'
  | 'run_final_qa'
  | 'apply_fallback'
  | 'request_user_review'
  | 'custom'

export type EditWorkItemStatus =
  | 'planned'
  | 'blocked'
  | 'ready'
  | 'queued'
  | 'running'
  | 'waiting_provider'
  | 'waiting_worker'
  | 'waiting_asset'
  | 'waiting_user_review'
  | 'ready_to_merge'
  | 'merged'
  | 'qa_pending'
  | 'qa_passed'
  | 'qa_failed'
  | 'fallback_needed'
  | 'fallback_used'
  | 'failed'
  | 'canceled'
  | 'complete'

export type EditDependencyType =
  | 'blocks_start'
  | 'blocks_finish'
  | 'required_asset'
  | 'optional_asset'
  | 'can_use_placeholder'
  | 'qa_after'
  | 'fallback_if_failed'
  | 'user_review_required'

export type EditAssetLifecycleStatus =
  | 'planned'
  | 'queued'
  | 'generating'
  | 'processing'
  | 'ready'
  | 'merged'
  | 'qa_pending'
  | 'qa_passed'
  | 'qa_failed'
  | 'fallback_requested'
  | 'replaced'
  | 'archived'
  | 'failed'

export type EditAssetStorageProvider =
  | 'gcs'
  | 'supabase_storage'
  | 'provider_temp_url'
  | 'local_mock'
  | 'unknown'

export type WorkGraphRunMode =
  | 'planning_only'
  | 'mock_execution_plan'
  | 'future_worker_execution'

export type AsyncCheckbackTrigger =
  | 'provider_webhook'
  | 'worker_event'
  | 'scheduled_poll'
  | 'manual_refresh'
  | 'status_poll'
  | 'timeout'
  | 'retry'
  | 'fallback_event'
  | 'user_review'

export type AsyncCheckbackStatus =
  | 'not_started'
  | 'waiting'
  | 'checking'
  | 'ready'
  | 'stale'
  | 'failed'
  | 'timed_out'
  | 'retrying'
  | 'fallback_needed'
  | 'user_review_required'
  | 'merged'

export type AssetMergeStatus =
  | 'not_ready'
  | 'ready_to_merge'
  | 'merged'
  | 'blocked'
  | 'qa_pending'
  | 'qa_failed'
  | 'fallback_required'
  | 'user_review_required'

export type AssetReconciliationDecision =
  | 'attach_to_layer'
  | 'replace_placeholder'
  | 'update_timing'
  | 'rerender_required'
  | 'request_fallback'
  | 'request_user_review'
  | 'archive_previous'
  | 'no_action'

export type DependencyReadinessStatus =
  | 'ready_now'
  | 'waiting_for_provider'
  | 'waiting_for_worker'
  | 'waiting_for_asset'
  | 'waiting_for_user_review'
  | 'waiting_for_qa'
  | 'blocked_by_policy'
  | 'complete'

export type AgentQAGateType =
  | 'preflight_gate'
  | 'work_item_start_gate'
  | 'provider_request_gate'
  | 'asset_received_gate'
  | 'asset_quality_gate'
  | 'merge_gate'
  | 'render_preflight_gate'
  | 'final_qa_gate'
  | 'custom'

export type AgentQAGateStatus =
  | 'not_checked'
  | 'passed'
  | 'warning'
  | 'failed'
  | 'blocked'
  | 'needs_user_review'
  | 'fallback_required'

export type AgentFailureCategory =
  | 'provider_timeout'
  | 'provider_error'
  | 'provider_policy_rejection'
  | 'provider_bad_output'
  | 'prompt_mismatch'
  | 'style_mismatch'
  | 'character_mismatch'
  | 'duration_mismatch'
  | 'aspect_ratio_mismatch'
  | 'background_mismatch'
  | 'missing_required_asset'
  | 'asset_storage_failure'
  | 'asset_qa_failed'
  | 'tool_worker_failure'
  | 'map_render_failure'
  | 'chart_render_failure'
  | 'browser_capture_failure'
  | 'mask_generation_failure'
  | 'audio_analysis_failure'
  | 'audio_processing_failure'
  | 'color_processing_failure'
  | 'render_preflight_failure'
  | 'render_failure'
  | 'timing_validation_failure'
  | 'trim_meaning_failure'
  | 'user_review_required'
  | 'credit_limit_or_budget_issue'
  | 'policy_violation'
  | 'unknown'

export type AgentFailureScope =
  | 'local_asset'
  | 'segment'
  | 'timeline_section'
  | 'global_edit'
  | 'final_render'
  | 'approval_gate'

export type AgentFallbackActionType =
  | 'retry_same'
  | 'retry_with_simpler_prompt'
  | 'switch_to_fallback_provider'
  | 'switch_to_still_card'
  | 'switch_to_motion_design'
  | 'switch_to_remotion_only'
  | 'switch_to_tool_generated_asset'
  | 'switch_to_static_map'
  | 'switch_to_static_chart'
  | 'use_uploaded_screenshot'
  | 'use_placeholder_preview_only'
  | 'simplify_layout'
  | 'use_lower_panel'
  | 'use_side_by_side'
  | 'remove_optional_asset'
  | 'request_user_review'
  | 'request_new_approval'
  | 'block_final_render'
  | 'cancel_work_item'
  | 'restore_or_refund_credits_future'
  | 'custom'

export type AgentRecoveryState =
  | 'auto_recoverable'
  | 'fallback_available'
  | 'needs_user_review'
  | 'needs_new_approval'
  | 'unrecoverable_in_current_plan'

export interface EditWorkDependency {
  id: string
  dependencyType: EditDependencyType
  dependsOnWorkItemId?: string
  dependsOnAssetId?: string
  reason: string
  blocking: boolean
  fallbackIfMissing?: string
}

export interface EditWorkExpectedOutput {
  id: string
  outputType:
    | 'image_asset'
    | 'ai_video_clip'
    | 'processed_audio'
    | 'processed_video'
    | 'map_asset'
    | 'chart_asset'
    | 'browser_capture_asset'
    | 'mask_asset'
    | 'remotion_layer'
    | 'qa_report'
    | 'final_export'
    | 'status_update'
    | 'none'
  linkedAssetManifestId?: string
  linkedRendererLayerId?: string
  linkedTimingCueId?: string
  notes: string[]
}

export interface EditWorkItem {
  id: string
  workItemType: EditWorkItemType
  agentLayer: EditingAgentLayer
  status: EditWorkItemStatus
  label: string
  purpose: string
  approvedPlanSnapshotId?: string
  idempotencyKey: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  canRunInParallel: boolean
  dependencies: EditWorkDependency[]
  expectedOutputs: EditWorkExpectedOutput[]
  linkedSegmentIds: string[]
  linkedVisualAssetPlanItemIds: string[]
  linkedTimingCueIds: string[]
  linkedProviderPromptPlanIds: string[]
  linkedToolStrategyItemIds: string[]
  linkedRendererLayerIds: string[]
  retryCount: number
  maxRetries: number
  fallbackPolicy: string[]
  checkbackPolicy: string[]
  qaChecks: string[]
  notes: string[]
  asyncCheckbackItemIds?: string[]
  dependencyReadinessIds?: string[]
  qaGateCheckIds?: string[]
  failureScenarioIds?: string[]
  fallbackDecisionIds?: string[]
}

export interface EditAssetManifestItem {
  id: string
  label: string
  lifecycleStatus: EditAssetLifecycleStatus
  assetType:
    | 'source_video'
    | 'generated_image'
    | 'ai_video_clip'
    | 'map_visual'
    | 'chart_visual'
    | 'browser_capture'
    | 'audio_asset'
    | 'processed_video'
    | 'mask_asset'
    | 'thumbnail'
    | 'final_export'
    | 'unknown'
  storageProvider: EditAssetStorageProvider
  storageBucket?: string
  storagePath?: string
  providerTempUrl?: string
  generationRequestId?: string
  parentWorkItemId?: string
  promptPlanId?: string
  providerModel?: ProviderModel
  toolId?: OpenSourceToolId
  linkedSegmentIds: string[]
  linkedVisualAssetPlanItemIds: string[]
  linkedTimingCueIds: string[]
  linkedRendererLayerIds: string[]
  version: number
  replacesAssetId?: string
  fallbackForAssetId?: string
  qaStatus: 'not_checked' | 'passed' | 'warning' | 'failed' | 'blocked'
  qaNotes: string[]
  metadata: Record<string, unknown>
  notes: string[]
  mergePlanItemId?: string
  versionReconciliationId?: string
  qaGateCheckIds?: string[]
  failureScenarioIds?: string[]
  fallbackDecisionIds?: string[]
}

export interface AsyncCheckbackItem {
  id: string
  workItemId: string
  assetManifestItemId?: string
  trigger: AsyncCheckbackTrigger
  status: AsyncCheckbackStatus
  providerRequestId?: string
  workerJobId?: string
  idempotencyKey: string
  approvedPlanSnapshotId?: string
  nextCheckReason: string
  timeoutPolicy: string
  retryPolicy: string
  fallbackPolicy: string[]
  expectedOutputIds: string[]
  qaChecks: string[]
  notes: string[]
}

export interface AssetDependencyReadiness {
  id: string
  dependencyId: string
  dependencyType: EditDependencyType
  status: DependencyReadinessStatus
  required: boolean
  placeholderAllowed: boolean
  blocksFinalRender: boolean
  blocksPreviewRender: boolean
  reason: string
  fallbackIfMissing?: string
  linkedWorkItemId?: string
  linkedAssetManifestItemId?: string
  qaChecks: string[]
}

export interface AssetMergePlanItem {
  id: string
  assetManifestItemId: string
  workItemId?: string
  status: AssetMergeStatus
  reconciliationDecision: AssetReconciliationDecision
  targetSegmentIds: string[]
  targetVisualAssetPlanItemIds: string[]
  targetTimingCueIds: string[]
  targetRendererLayerIds: string[]
  replacePlaceholder: boolean
  updateTimingRequired: boolean
  rerenderRequired: boolean
  qaRequired: boolean
  fallbackRequired: boolean
  userReviewRequired: boolean
  reason: string
  qaChecks: string[]
  notes: string[]
}

export interface AssetVersionReconciliation {
  id: string
  assetManifestItemId: string
  activeVersion: number
  previousVersionIds: string[]
  fallbackVersionIds: string[]
  replacedAssetIds: string[]
  selectedForFinalRender: boolean
  reason: string
  qaChecks: string[]
}

export interface AsyncMergeCheckpoint {
  id: string
  label: string
  readyToMergeAssetIds: string[]
  mergedAssetIds: string[]
  blockedAssetIds: string[]
  waitingWorkItemIds: string[]
  unblockedWorkItemIds: string[]
  nextCheckbackIds: string[]
  nextActions: string[]
  notes: string[]
}

export interface AsyncAssetReconciliationPlan {
  id: string
  summary: string
  checkbackItems: AsyncCheckbackItem[]
  dependencyReadiness: AssetDependencyReadiness[]
  mergePlanItems: AssetMergePlanItem[]
  versionReconciliations: AssetVersionReconciliation[]
  checkpoints: AsyncMergeCheckpoint[]
  finalRenderReadiness: {
    ready: boolean
    missingRequiredAssetIds: string[]
    blockingWorkItemIds: string[]
    placeholderAssetIds: string[]
    qaPendingAssetIds: string[]
    reason: string
  }
  previewRenderReadiness: {
    ready: boolean
    placeholderAssetIds: string[]
    missingOptionalAssetIds: string[]
    reason: string
  }
  globalRules: string[]
  limitations: string[]
  qaChecks: string[]
  notes: string[]
}

export interface AgentQAGateCheck {
  id: string
  gateType: AgentQAGateType
  status: AgentQAGateStatus
  label: string
  severity: 'info' | 'warning' | 'error' | 'blocking'
  relatedWorkItemId?: string
  relatedAssetManifestItemId?: string
  relatedSegmentId?: string
  relatedRendererLayerId?: string
  message: string
  recommendation?: string
  qaChecks: string[]
}

export interface AgentFailureScenario {
  id: string
  category: AgentFailureCategory
  scope: AgentFailureScope
  label: string
  description: string
  likelyCauses: string[]
  affectedWorkItemTypes: EditWorkItemType[]
  affectedAssetTypes: EditAssetManifestItem['assetType'][]
  blocksIndependentWork: boolean
  blocksFinalRender: boolean
  requiresUserReviewByDefault: boolean
  severity: 'low' | 'medium' | 'high' | 'blocking'
}

export interface AgentFallbackAction {
  id: string
  actionType: AgentFallbackActionType
  label: string
  description: string
  allowedForTiers: {
    basic: boolean
    pro: boolean
    premium: boolean
  }
  allowedProviderModels: ProviderModel[]
  allowedToolIds: OpenSourceToolId[]
  requiresUserReview: boolean
  requiresNewApproval: boolean
  affectsCredits: boolean
  estimatedCreditImpact: 'none' | 'low' | 'medium' | 'high' | 'premium'
  reason: string
  qaChecks: string[]
}

export interface AgentFailureFallbackDecision {
  id: string
  failureScenarioId: string
  relatedWorkItemId?: string
  relatedAssetManifestItemId?: string
  recoveryState: AgentRecoveryState
  selectedFallbackActionIds: string[]
  blockedActionIds: string[]
  userReviewQuestion?: string
  newApprovalReason?: string
  creditImpactNote: string
  continueIndependentWork: boolean
  finalRenderBlocked: boolean
  reason: string
  qaChecks: string[]
}

export interface AgentQAFallbackPlan {
  id: string
  summary: string
  gateChecks: AgentQAGateCheck[]
  failureScenarios: AgentFailureScenario[]
  fallbackActions: AgentFallbackAction[]
  decisions: AgentFailureFallbackDecision[]
  localFailureCount: number
  globalFailureCount: number
  userReviewRequiredCount: number
  finalRenderBlocked: boolean
  independentWorkCanContinue: boolean
  globalRules: string[]
  limitations: string[]
  qaChecks: string[]
  notes: string[]
}

export interface EditExecutionCheckpoint {
  id: string
  label: string
  completedWorkItemIds: string[]
  pendingWorkItemIds: string[]
  blockedWorkItemIds: string[]
  readyToMergeAssetIds: string[]
  currentFocus: string
  nextActions: string[]
  notes: string[]
}

export interface EditingAgentExecutionPlan {
  id: string
  runMode: WorkGraphRunMode
  summary: string
  approvedPlanSnapshotId?: string
  asyncAssetReconciliationPlanId?: string
  agentQAFallbackPlanId?: string
  planningModelLabel: string
  editingSupervisorModelLabel: string
  workItems: EditWorkItem[]
  assetManifest: EditAssetManifestItem[]
  checkpoints: EditExecutionCheckpoint[]
  parallelGroups: {
    id: string
    label: string
    workItemIds: string[]
    reason: string
  }[]
  blockingWorkItemIds: string[]
  readyWorkItemIds: string[]
  waitingWorkItemIds: string[]
  qaWorkItemIds: string[]
  globalRules: string[]
  limitations: string[]
  notes: string[]
}
