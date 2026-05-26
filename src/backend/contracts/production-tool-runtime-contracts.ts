import type { ID, ISODateString, JSONObject, Seconds } from '../../types/shared'

export type ProductionWorkerType =
  | 'api_service'
  | 'cpu_analysis_worker'
  | 'gpu_ai_worker'
  | 'render_worker'
  | 'qa_worker'
  | 'tool_readiness_worker'

export type ProductionRecipeFamily =
  | 'smart_cut_recipe'
  | 'transcript_recipe'
  | 'caption_recipe'
  | 'audio_cleanup_recipe'
  | 'color_grade_recipe'
  | 'background_removal_image_recipe'
  | 'background_removal_video_recipe'
  | 'text_behind_subject_recipe'
  | 'ocr_screen_recording_recipe'
  | 'video_enhancement_recipe'
  | 'slow_motion_recipe'
  | 'motion_graphics_recipe'
  | 'final_export_recipe'

export type ToolRecipeStatus =
  | 'draft'
  | 'active'
  | 'deprecated'
  | 'blocked'
  | 'evaluation_only'

export type ToolExecutionPlanStatus =
  | 'draft'
  | 'waiting_approval'
  | 'approved'
  | 'queued'
  | 'running'
  | 'blocked'
  | 'completed'
  | 'failed'
  | 'cancelled'

export type ToolRunStatus =
  | 'queued'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'blocked'
  | 'cancelled'
  | 'skipped'

export type ToolArtifactType =
  | 'source_media'
  | 'proxy_video'
  | 'extracted_audio'
  | 'keyframe_image'
  | 'representative_frame'
  | 'transcript_json'
  | 'word_timestamps_json'
  | 'caption_segments_json'
  | 'scene_report_json'
  | 'visual_analysis_json'
  | 'audio_analysis_json'
  | 'color_analysis_json'
  | 'ocr_report_json'
  | 'mask_image'
  | 'mask_sequence'
  | 'rgba_cutout'
  | 'cleaned_audio'
  | 'separated_audio_stem'
  | 'color_grade_recipe'
  | 'graded_preview'
  | 'enhanced_video'
  | 'interpolated_video'
  | 'render_manifest'
  | 'preview_video'
  | 'final_export'
  | 'qa_report'
  | 'timeline_manifest'
  | 'opentimelineio_manifest'
  | 'temp_file'

export type ProductionStorageBucketPurpose =
  | 'source_media'
  | 'proxy_media'
  | 'analysis_artifacts'
  | 'transcripts'
  | 'masks'
  | 'generated_assets'
  | 'previews'
  | 'final_exports'
  | 'worker_temp'
  | 'qa_artifacts'

export type QualityGateType =
  | 'caption_readability'
  | 'caption_timing'
  | 'caption_safe_zone'
  | 'cut_smoothness'
  | 'transcript_alignment'
  | 'audio_loudness'
  | 'audio_sync'
  | 'audio_naturalness'
  | 'music_over_voice'
  | 'color_exposure'
  | 'color_skin_tone'
  | 'color_export_space'
  | 'color_shot_match'
  | 'mask_edge_quality'
  | 'mask_temporal_stability'
  | 'mask_subject_coverage'
  | 'ocr_text_overlap'
  | 'enhancement_artifacts'
  | 'slow_motion_artifacts'
  | 'render_asset_integrity'
  | 'render_timeline_integrity'
  | 'export_codec_format'
  | 'export_duration_sync'
  | 'final_delivery'

export type QualityGateStatus =
  | 'not_checked'
  | 'passed'
  | 'warning'
  | 'failed'
  | 'blocked'
  | 'needs_human_review'
  | 'skipped'

export type FallbackAction =
  | 'retry_same_tool'
  | 'reduce_strength'
  | 'switch_tool'
  | 'use_simpler_recipe'
  | 'skip_effect'
  | 'block_preview'
  | 'block_final_export'
  | 'request_user_review'

export type FallbackDecisionStatus =
  | 'proposed'
  | 'approved'
  | 'running'
  | 'resolved'
  | 'rejected'
  | 'blocked'

export type TimelineFormat =
  | 'reeditpro_timeline'
  | 'opentimelineio'
  | 'hyperframe_timeline'
  | 'remotion_composition_manifest'

export type RenderEngine =
  | 'hyperframe_preview'
  | 'remotion'
  | 'ffmpeg'
  | 'libass'
  /** Evaluation-only. Revideo is not part of the core production render stack. */
  | 'evaluation_revideo'

export type RenderMode =
  | 'preview'
  | 'final_export'
  | 'qa_probe'
  | 'template_validation'

export type ToolExecutionMode =
  | 'planning_only'
  | 'dry_run'
  | 'worker_execution'
  | 'qa_only'
  | 'render_execution'

export type EstimatedCostTier =
  | 'none'
  | 'low'
  | 'medium'
  | 'high'
  | 'premium'

export type ReviewStatus =
  | 'not_reviewed'
  | 'needs_review'
  | 'approved'
  | 'blocked'
  | 'evaluation_only'

export type LicenseFamily =
  | 'permissive'
  | 'copyleft'
  | 'commercial'
  | 'proprietary'
  | 'model_card'
  | 'unknown'

export interface ProductionToolIssue {
  code: string
  message: string
  severity: 'info' | 'warning' | 'error' | 'blocking'
  details?: JSONObject
}

export interface ProductionToolRecommendation {
  action: string
  reason: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  details?: JSONObject
}

export interface ProductionTimeRange {
  startSeconds: Seconds
  endSeconds: Seconds
  startFrame?: number
  endFrame?: number
}

export interface ProductionStorageReference {
  storageBucketPurpose: ProductionStorageBucketPurpose
  storageObjectPath: string
  sourceOfTruth: boolean
}

export interface RecipeInputRequirement {
  inputId: string
  artifactTypes: ToolArtifactType[]
  required: boolean
  description?: string
}

export interface RecipeAnalysisRequirement {
  analysisType: string
  reportField?: string
  required: boolean
  minimumConfidence?: number
}

export interface RecipeExecutionStep {
  stepId: string
  order: number
  toolId: string
  workerType: ProductionWorkerType
  description: string
  settings: JSONObject
  required: boolean
}

export interface RecipeQualityCheck {
  gateType: QualityGateType
  required: boolean
  threshold?: number
  blocksPreview: boolean
  blocksFinalExport: boolean
}

export interface RecipeFallbackPolicy {
  allowedActions: FallbackAction[]
  requiresUserApprovalWhen: string[]
  maxAttempts?: number
  notes?: string
}

export interface RecipeConfidencePolicy {
  minimumConfidence: number
  warningBelow?: number
  blockBelow?: number
  confidenceInputs: string[]
}

export interface RecipeArtifactPolicy {
  expectedArtifactTypes: ToolArtifactType[]
  storageBucketPurposes: ProductionStorageBucketPurpose[]
  privateByDefault: true
  sourceOfTruthStorageRefsOnly: true
}

export interface RecipeTimelineIntegration {
  required: boolean
  targetTimelineFormats: TimelineFormat[]
  notes?: string
}

export interface RecipeRenderIntegration {
  required: boolean
  targetRenderEngines: RenderEngine[]
  notes?: string
}

export interface RecipeApprovalPolicy {
  requiresApprovedSnapshot: boolean
  requiresCreditReservation: boolean
  requiresHumanReviewWhen: string[]
}

export interface RecipeLicensePolicy {
  requiredReviewStatus: ReviewStatus
  allowEvaluationOnly: boolean
  modelWeightManifestRequired: boolean
  licenseReviewRecordRequired: boolean
}

export interface ProductionRecordBase {
  id: ID
  createdAt: ISODateString
  updatedAt: ISODateString
}
