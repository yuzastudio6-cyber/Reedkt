import type { FallbackAction, OpenSourceToolId, ProviderModel } from './reeditpro'

export type WorkerGroup =
  | 'media_analysis_worker'
  | 'ffmpeg_media_worker'
  | 'color_pipeline_worker'
  | 'audio_soundsync_worker'
  | 'map_visual_worker'
  | 'dataviz_worker'
  | 'browser_capture_worker'
  | 'mask_tracking_worker'
  | 'image_asset_worker'
  | 'ai_video_asset_worker'
  | 'remotion_render_worker'
  | 'qa_worker'
  | 'export_worker'

export type WorkerExecutionMode =
  | 'planning_only'
  | 'analysis_worker'
  | 'preprocess_worker'
  | 'generation_worker'
  | 'render_worker'
  | 'postprocess_worker'
  | 'qa_worker'
  | 'export_worker'

export type WorkerJobStatus =
  | 'queued'
  | 'blocked'
  | 'waiting_for_approval'
  | 'waiting_for_credits'
  | 'running'
  | 'retrying'
  | 'waiting_for_user_review'
  | 'succeeded'
  | 'failed'
  | 'canceled'
  | 'refunded_or_restored'

export type WorkerStepStatus =
  | 'planned'
  | 'ready'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'skipped'
  | 'retrying'
  | 'fallback_used'
  | 'needs_user_review'
  | 'blocked'

export type WorkerAssetStatus =
  | 'planned'
  | 'requested'
  | 'generating'
  | 'ready'
  | 'failed'
  | 'rejected_by_qa'
  | 'replaced_by_fallback'
  | 'archived'

export type WorkerQAStatus =
  | 'not_checked'
  | 'passed'
  | 'warning'
  | 'failed'
  | 'blocked'
  | 'needs_user_review'

export type WorkerJobStepType =
  | 'validate_approved_snapshot'
  | 'reserve_credits'
  | 'prepare_source_media'
  | 'analyze_media'
  | 'transcribe_audio'
  | 'trim_and_cut'
  | 'color_correct'
  | 'color_grade'
  | 'normalize_audio'
  | 'sound_cleanup'
  | 'analyze_music_beats'
  | 'generate_gpt_image_asset'
  | 'generate_ai_video_asset'
  | 'render_map_asset'
  | 'render_dataviz_asset'
  | 'capture_browser_asset'
  | 'generate_mask_asset'
  | 'compose_remotion_preview'
  | 'render_remotion_final'
  | 'postprocess_export'
  | 'run_qa_checks'
  | 'retry_or_fallback'
  | 'request_user_review'
  | 'deliver_preview'
  | 'create_final_export'

export type WorkerOutputType =
  | 'processed_video'
  | 'processed_audio'
  | 'generated_image_asset'
  | 'ai_video_clip_asset'
  | 'map_visual_asset'
  | 'chart_visual_asset'
  | 'browser_capture_asset'
  | 'mask_asset'
  | 'timing_map'
  | 'renderer_composition_asset'
  | 'qa_report'
  | 'final_export'
  | 'error_report'
  | 'none'

export type WorkerCreditImpact =
  | 'none'
  | 'low'
  | 'medium'
  | 'high'
  | 'premium'

export interface WorkerInputContract {
  approvedPlanSnapshotId: string
  projectId: string
  editSessionId?: string
  editPlanVersionId: string
  creditReservationId?: string
  sourceAssetIds: string[]
  segmentIds: string[]
  operationIds: string[]
  visualAssetPlanItemIds: string[]
  rendererLayerIds: string[]
  toolStrategyItemIds: string[]
  providerPromptPlanIds: string[]
  settings: Record<string, unknown>
  fallbackPolicy: string[]
  qaChecks: string[]
  notes: string[]
}

export interface WorkerOutputContract {
  outputType: WorkerOutputType
  assetIds: string[]
  storageUrls: string[]
  metadata: Record<string, unknown>
  qaReportIds: string[]
  error?: string
  notes: string[]
}

export interface WorkerFallbackPolicy {
  allowedActions: FallbackAction[]
  allowedProviderModels: ProviderModel[]
  allowedToolIds: OpenSourceToolId[]
  maxRetries: number
  requiresUserApprovalIfExceeded: boolean
  tierPolicyNotes: string[]
}

export interface WorkerRuntimeStepPlan {
  id: string
  stepType: WorkerJobStepType
  workerGroup: WorkerGroup
  executionMode: WorkerExecutionMode
  label: string
  purpose: string
  order: number
  status: WorkerStepStatus
  inputContract: WorkerInputContract
  expectedOutputs: WorkerOutputType[]
  fallbackPolicy: WorkerFallbackPolicy
  creditImpact: WorkerCreditImpact
  qaResponsibilities: string[]
  failureHandling: string[]
  workerNotes: string[]
}

export interface WorkerRuntimeJobPlan {
  id: string
  projectId: string
  editPlanVersionId: string
  approvedPlanSnapshotId?: string
  status: WorkerJobStatus
  label: string
  summary: string
  steps: WorkerRuntimeStepPlan[]
  workerGroupsUsed: WorkerGroup[]
  providerModelsReferenced: ProviderModel[]
  openSourceToolsReferenced: OpenSourceToolId[]
  requiresCreditReservation: boolean
  approvalRequired: boolean
  canRunInFrontend: false
  limitations: string[]
  qaChecks: string[]
  notes: string[]
}

export interface WorkerRuntimePlan {
  id: string
  summary: string
  jobs: WorkerRuntimeJobPlan[]
  totalSteps: number
  workerGroupsUsed: WorkerGroup[]
  providerModelsReferenced: ProviderModel[]
  openSourceToolsReferenced: OpenSourceToolId[]
  approvalRequired: boolean
  creditReservationRequired: boolean
  frontendExecutionAllowed: false
  globalRules: string[]
  limitations: string[]
  qaChecks: string[]
}

export interface WorkerGroupProfile {
  id: WorkerGroup
  label: string
  description: string
  executionMode: WorkerExecutionMode
  bestFor: string[]
  requiredInputs: string[]
  outputTypes: WorkerOutputType[]
  toolIds: OpenSourceToolId[]
  providerModels: ProviderModel[]
  qaResponsibilities: string[]
  safetyNotes: string[]
  futureOnly: true
}

export interface WorkerJobStepProfile {
  id: WorkerJobStepType
  label: string
  purpose: string
  workerGroup: WorkerGroup
  executionMode: WorkerExecutionMode
  requiredInputs: string[]
  outputTypes: WorkerOutputType[]
  allowedFallbackBehavior: string[]
  qaResponsibilities: string[]
  failureHandling: string[]
  creditImpact: WorkerCreditImpact
  toolIds: OpenSourceToolId[]
  providerModels: ProviderModel[]
  safetyNotes: string[]
  futureOnly: true
}
