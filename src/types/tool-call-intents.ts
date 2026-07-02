export type ToolCallIntentCapabilityId =
  | 'ocr'
  | 'audio'
  | 'color'
  | 'render'
  | 'transcript'
  | 'media_extraction'
  | 'timeline'
  | 'chart_dataviz'
  | 'browser_capture'
  | 'qwen_reasoning'
  | 'qwen_visual_understanding'
  | 'sound_music_audio'
  | 'track_a_container_tools'
  | 'storage_runtime'
  | 'credit_gate'

export type ToolCallIntentReadinessState =
  | 'ready_for_backend_execution'
  | 'dry_run_only'
  | 'blocked_by_provider_lane'
  | 'blocked_by_storage_billing'
  | 'blocked_by_owner_approval'

export type ToolCallIntentLane =
  | 'track_b_media_oss'
  | 'track_a_native_container'
  | 'sound_cpu'
  | 'qwen_provider'
  | 'storage_billing'
  | 'planner_mock'

export type ToolCallIntentArtifactType =
  | 'source_media'
  | 'source_media_frame_sample'
  | 'audio_extract'
  | 'transcript'
  | 'render_manifest'
  | 'asset_manifest'
  | 'json_data'
  | 'approved_url_or_html'
  | 'approved_plan_snapshot'
  | 'credit_reservation'
  | 'none'

export type ToolCallIntentOutputArtifactType =
  | 'analysis_report'
  | 'ocr_report_json'
  | 'processed_audio'
  | 'color_qa_report'
  | 'image_asset'
  | 'chart_visual'
  | 'screenshot_asset'
  | 'json_data'
  | 'timeline_manifest'
  | 'render_manifest'
  | 'preview_video'
  | 'final_export'
  | 'transcript'
  | 'tool_cost_event'
  | 'none'

export interface ToolCallIntentArtifactDependency {
  artifactType: ToolCallIntentArtifactType
  dependencyId?: string
  description: string
  required: boolean
  readiness: 'available_in_plan' | 'requires_approval' | 'requires_future_artifact' | 'blocked'
}

export interface ToolCallIntentExpectedOutput {
  artifactType: ToolCallIntentOutputArtifactType
  description: string
  consumedBy: string[]
  requiredForApproval: boolean
}

export interface ToolCallIntentCostEstimate {
  credits: number
  creditImpact: 'none' | 'low' | 'medium' | 'high' | 'premium'
  basis: string
  includedInEditEstimate: boolean
  notes: string[]
}

export interface ToolCallIntentFallback {
  fallbackToolIds: string[]
  strategy: string
  requiresNewApproval: boolean
  reason: string
}

export interface ToolCallIntent {
  id: string
  toolId: string
  toolLabel: string
  capabilityId: ToolCallIntentCapabilityId
  capabilityLabel: string
  lane: ToolCallIntentLane
  readinessState: ToolCallIntentReadinessState
  readinessExplanation: string
  reason: string
  inputArtifactDependency: ToolCallIntentArtifactDependency
  expectedOutputArtifact: ToolCallIntentExpectedOutput
  costEstimate: ToolCallIntentCostEstimate
  fallback: ToolCallIntentFallback
  approvalRequiredBeforeExecution: true
  frontendExecutionAllowed: false
  metadata?: Record<string, string | number | boolean | string[]>
}

export interface ToolCallIntentPlan {
  id: string
  summary: string
  intents: ToolCallIntent[]
  readinessCounts: Record<ToolCallIntentReadinessState, number>
  totalEstimatedCredits: number
  planningOnly: true
  approvalRequiredBeforeExecution: true
  notes: string[]
}
