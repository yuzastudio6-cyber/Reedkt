import type {
  AspectRatio,
  AdaptiveEditStrategy,
  AdaptiveEditStrategyPlan,
  AspectRatioFramePlan,
  AudioPipelinePlan,
  BrollPolicyId,
  CaptionStyleId,
  CaptionVisualCueTimingPlan,
  CharacterConsistencyPlan,
  ColorPipelinePlan,
  ColorGradeStyleId,
  CompiledEditingIntent,
  CreditEstimate,
  CreditPreference,
  CutIntensity,
  DataVizPlan,
  DocumentaryFactSafetyPlan,
  DepthAwareOverlayPlan,
  EditLevel,
  EditOperationStatus,
  EditPlan,
  EditSegmentRole,
  EditingCategory,
  EditingOperationType,
  FrameLayoutPlan,
  FrameTemplateType,
  LayerFitMode,
  MapAnimationPlan,
  MasterTimingPlan,
  PlanningSystemAuditReport,
  ProfessionalEditStyleId,
  ProfessionalEditingDirective,
  ProviderPromptPlan,
  ProviderModel,
  ProviderRoute,
  QACategory,
  QAStatus,
  RenderStrategyPlan,
  RendererCompositionPlan,
  RendererEngine,
  RendererLayerPlan,
  RendererLayerType,
  SegmentEditPlan,
  SignatureSystem,
  SourceCleanupPlan,
  SpeakerVisualLayoutPlan,
  SoundSyncTransitionTimingPlan,
  SoundStyleId,
  TargetPlatform,
  TimingValidationPlan,
  TrimReviewPlan,
  ToolRegistrySummary,
  ToolStrategyPlan,
  TransitionFamilyId,
  VideoUnderstandingReport,
  VisualAssetPlanItem,
  VisualAssetType,
  VisualPreference,
  PacingStyleId,
} from './reeditpro'
import type { AgentQAFallbackPlan, AsyncAssetReconciliationPlan, EditingAgentExecutionPlan } from './editing-agent-runtime'
import type { SupabaseSchemaPlan } from './supabase-schema-plan'
import type { MigrationDraftPlan } from './supabase-migration-drafts'
import type { MigrationReviewPlan } from './supabase-rls-hardening'
import type { SupabaseProductionReadinessPlan } from './supabase-production-readiness'

export type JsonPrimitive = string | number | boolean | null
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[]
export type JsonObject = { [key: string]: JsonValue }

export type TimestampString = string
export type RecordStatus = string

export interface ProjectRecord {
  id: string
  owner_id: string
  workspace_id: string
  title: string
  status: RecordStatus
  created_at: TimestampString
  updated_at: TimestampString
}

export interface EditSessionRecord {
  id: string
  project_id: string
  status: RecordStatus
  current_plan_version_id?: string
  current_intent_snapshot_id?: string
  created_at: TimestampString
  updated_at: TimestampString
}

export interface ChatMessageRecord {
  id: string
  edit_session_id: string
  role: 'user' | 'ai' | 'system' | 'tool'
  content: string
  attachments_json: JsonValue
  related_clip_ids_json: string[]
  created_at: TimestampString
}

export interface UserConfirmationRecord {
  id: string
  edit_session_id: string
  confirmation_type: string
  confirmed_value_json: JsonValue
  confirmed_at: TimestampString
  superseded_at?: TimestampString
}

export interface EditIntentSnapshotRecord {
  id: string
  project_id: string
  edit_session_id: string
  version: number
  source_chat_message_ids_json: string[]
  editing_category: EditingCategory
  edit_level: EditLevel
  target_platform: TargetPlatform
  aspect_ratio: AspectRatio
  frame_template_type?: FrameTemplateType
  goal_summary: string
  style_direction: string
  visual_preference: VisualPreference
  credit_preference: CreditPreference
  professional_edit_style: ProfessionalEditStyleId
  pacing_style: PacingStyleId
  cut_intensity: CutIntensity
  transition_families_json: TransitionFamilyId[]
  color_grade_style: ColorGradeStyleId
  caption_style: CaptionStyleId
  broll_policy: BrollPolicyId
  sound_style: SoundStyleId
  must_follow_rules_json: string[]
  avoid_rules_json: string[]
  custom_directives_json: JsonValue
  unclear_items_json: JsonValue
  clarifying_questions_json: JsonValue
  confidence: 'low' | 'medium' | 'high'
  status: RecordStatus
  created_at: TimestampString
}

export interface EditSettingsSnapshotRecord {
  id: string
  project_id: string
  edit_session_id: string
  intent_snapshot_id: string
  editing_category: EditingCategory
  edit_level: EditLevel
  target_platform: TargetPlatform
  aspect_ratio: AspectRatio
  frame_template_type?: FrameTemplateType
  visual_preference: VisualPreference
  mood_style: string
  credit_preference: CreditPreference
  source_order_confirmed: boolean
  reference_video_url?: string
  status: RecordStatus
  created_at: TimestampString
}

export interface MediaAssetRecord {
  id: string
  project_id: string
  asset_type: string
  storage_url: string
  file_name: string
  mime_type: string
  duration_seconds?: number
  width?: number
  height?: number
  status: RecordStatus
  created_at: TimestampString
}

export interface UploadedClipRecord {
  id: string
  project_id: string
  media_asset_id: string
  uploaded_order: number
  user_notes?: string
  detected_type?: string
  is_important: boolean
  is_optional: boolean
  status: RecordStatus
  created_at: TimestampString
}

export interface SourceSequenceItemRecord {
  id: string
  project_id: string
  edit_session_id: string
  uploaded_clip_id: string
  source_order: number
  confirmed_order?: number
  user_confirmed: boolean
  notes?: string
  created_at: TimestampString
  updated_at: TimestampString
}

export interface ClipAnalysisRecord {
  id: string
  uploaded_clip_id: string
  visual_summary: string
  audio_summary: string
  detected_faces_json: JsonValue
  detected_objects_json: JsonValue
  quality_issues_json: JsonValue
  strong_moments_json: JsonValue
  dead_space_ranges_json: JsonValue
  speaker_zone_json: JsonValue
  created_at: TimestampString
}

export interface TranscriptSegmentRecord {
  id: string
  uploaded_clip_id: string
  start_time: number
  end_time: number
  text: string
  speaker_label?: string
  confidence: number
}

export interface TranscriptWordRecord {
  id: string
  transcript_segment_id: string
  word: string
  start_time: number
  end_time: number
  confidence: number
}

export interface EditPlanVersionRecord {
  id: string
  project_id: string
  edit_session_id: string
  intent_snapshot_id: string
  version: number
  status: 'draft' | 'awaiting_approval' | 'approved' | 'superseded' | 'rejected'
  goal_summary: string
  recommended_structure_json: string[]
  source_sequence_summary_json: JsonValue
  hook_decision_json: JsonValue
  professional_editing_directive_json: ProfessionalEditingDirective
  visual_asset_plan_summary_json: JsonValue
  renderer_plan_summary_json: JsonValue
  qa_plan_summary_json: JsonValue
  credit_estimate_id: string
  approval_required: boolean
  approved_at?: TimestampString
  approved_by?: string
  superseded_by_plan_version_id?: string
  created_at: TimestampString
  updated_at: TimestampString
}

export interface EditPlanSegmentRecord {
  id: string
  edit_plan_version_id: string
  segment_order: number
  role: EditSegmentRole
  label: string
  story_purpose: string
  source_clip_ids_json: string[]
  source_time_range_json?: JsonValue
  final_time_range_json: JsonValue
  spoken_text_summary?: string
  pacing_style: PacingStyleId
  cut_intensity: CutIntensity
  must_follow_rules_json: string[]
  avoid_rules_json: string[]
  worker_notes_json: string[]
  created_at: TimestampString
}

export interface EditOperationRecord {
  id: string
  edit_plan_segment_id: string
  operation_type: EditingOperationType
  operation_order: number
  label: string
  instruction: string
  parameters_json: JsonValue
  reason: string
  status: EditOperationStatus
  qa_checks_json: string[]
  created_at: TimestampString
}

export interface CaptionPlanRecord {
  id: string
  edit_plan_segment_id: string
  caption_style: CaptionStyleId
  placement: string
  max_lines: number
  keyword_emphasis: boolean
  face_safe: boolean
  animation_style: string
  notes_json: string[]
}

export interface BrollPlanRecord {
  id: string
  edit_plan_segment_id: string
  broll_policy: BrollPolicyId
  source_priority_json: string[]
  timing_rule: string
  meaning_rule: string
  avoid_rules_json: string[]
  notes_json: string[]
}

export interface ColorGradePlanRecord {
  id: string
  edit_plan_segment_id: string
  color_grade_style: ColorGradeStyleId
  intensity: 'light' | 'medium' | 'strong'
  operations_json: string[]
  skin_tone_protection: boolean
  shot_matching: boolean
  avoid_rules_json: string[]
  notes_json: string[]
}

export interface SoundPlanRecord {
  id: string
  edit_plan_segment_id: string
  sound_style: SoundStyleId
  voice_cleanup: boolean
  music_bed: boolean
  ducking: boolean
  sfx_json: string[]
  avoid_rules_json: string[]
  notes_json: string[]
}

export interface TransitionPlanRecord {
  id: string
  edit_plan_segment_id: string
  transition_families_json: TransitionFamilyId[]
  preferred_transitions_json: string[]
  intensity: 'minimal' | 'balanced' | 'strong'
  timing_rule: string
  avoid_rules_json: string[]
  notes_json: string[]
}

export interface VisualAssetPlanItemRecord {
  id: string
  edit_plan_version_id: string
  edit_plan_segment_id?: string
  asset_type: VisualAssetType
  signature_system: SignatureSystem
  style_mode_id?: string
  frame_template_type: FrameTemplateType
  needs_character_consistency: boolean
  needs_start_frame: boolean
  needs_end_frame: boolean
  recommended_duration_seconds: number
  provider_route_json: ProviderRoute
  prompt_plan_json: JsonValue
  qa_checks_json: string[]
  credit_impact: 'none' | 'low' | 'medium' | 'high' | 'premium'
  status: RecordStatus
  created_at: TimestampString
}

export interface FrameLayoutPlanRecord {
  id: string
  edit_plan_version_id: string
  frame_template_type: FrameTemplateType
  aspect_ratio: AspectRatio
  canvas_width: number
  canvas_height: number
  speaker_zone_json?: JsonValue
  animation_zone_json: JsonValue
  caption_safe_zone_json?: JsonValue
  safe_margin: number
  panel_background_color: string
  notes_json: string[]
}

export interface RendererCompositionPlanRecord {
  id: string
  edit_plan_version_id: string
  renderer_engine: RendererEngine
  aspect_ratio: AspectRatio
  canvas_width: number
  canvas_height: number
  fps: number
  duration_seconds: number
  frame_template_json: FrameLayoutPlan
  caption_safe_zone_json?: JsonValue
  speaker_zone_json?: JsonValue
  animation_zone_json: JsonValue
  panel_background_color: string
  approval_required: boolean
  render_ready: boolean
  status: RecordStatus
  created_at: TimestampString
}

export interface RendererLayerRecord {
  id: string
  renderer_composition_plan_id: string
  visual_asset_plan_item_id?: string
  layer_order: number
  layer_type: RendererLayerType
  label: string
  start_time: number
  end_time: number
  zone_json: JsonValue
  fit_mode: LayerFitMode
  background_color?: string
  opacity?: number
  motion_preset?: string
  z_index: number
  notes_json: string[]
}

export interface CreditEstimateRecord {
  id: string
  project_id: string
  edit_plan_version_id: string
  estimate_version: string
  edit_level: EditLevel
  editing_category: EditingCategory
  total_credits: number
  fallback_allowance_credits: number
  risk_level?: 'low' | 'medium' | 'high' | 'premium'
  approval_copy?: string
  status: RecordStatus
  created_at: TimestampString
}

export interface CreditEstimateItemRecord {
  id: string
  credit_estimate_id: string
  label: string
  credits: number
  reason: string
  category: string
  metadata_json: JsonValue
}

export interface ApprovalRecord {
  id: string
  project_id: string
  edit_session_id: string
  edit_plan_version_id: string
  credit_estimate_id: string
  approval_type: string
  approved_by: string
  approved_at: TimestampString
  approved_snapshot_json: JsonValue
  ip_or_audit_metadata_json: JsonValue
}

export interface GenerationRequestRecord {
  id: string
  project_id: string
  edit_plan_version_id: string
  edit_plan_segment_id?: string
  visual_asset_plan_item_id?: string
  provider_model: ProviderModel
  provider_route_json: ProviderRoute
  prompt_json: JsonValue
  status: RecordStatus
  approved: boolean
  credit_reservation_id?: string
  created_at: TimestampString
}

export interface GeneratedAssetRecord {
  id: string
  project_id: string
  generation_request_id: string
  asset_type: VisualAssetType | string
  storage_url: string
  width?: number
  height?: number
  duration_seconds?: number
  background_color?: string
  status: RecordStatus
  created_at: TimestampString
}

export interface EditingJobRecord {
  id: string
  project_id: string
  edit_plan_version_id: string
  job_type: string
  status: RecordStatus
  approved_plan_snapshot_id: string
  created_at: TimestampString
  started_at?: TimestampString
  completed_at?: TimestampString
}

export interface JobStepRecord {
  id: string
  editing_job_id: string
  step_order: number
  step_type: string
  status: RecordStatus
  input_json: JsonValue
  output_json?: JsonValue
  error_json?: JsonValue
  started_at?: TimestampString
  completed_at?: TimestampString
}

export interface QAReportRecord {
  id: string
  project_id: string
  edit_plan_version_id: string
  editing_job_id?: string
  status: QAStatus
  summary: string
  created_at: TimestampString
}

export interface QACheckResultRecord {
  id: string
  qa_report_id: string
  category: QACategory
  label: string
  check: string
  status: QAStatus
  severity: 'low' | 'medium' | 'high' | 'blocking'
  fallback_actions_json: JsonValue
  notes_json: string[]
}

export interface RevisionRequestRecord {
  id: string
  project_id: string
  edit_session_id: string
  previous_plan_version_id: string
  requested_by: string
  request_text: string
  compiled_revision_intent_json: JsonValue
  status: RecordStatus
  created_at: TimestampString
}

export interface FinalExportRecord {
  id: string
  project_id: string
  edit_plan_version_id: string
  renderer_composition_plan_id: string
  export_format: string
  aspect_ratio: AspectRatio
  storage_url: string
  status: RecordStatus
  created_at: TimestampString
}

export interface ApprovedPlanSnapshot {
  id: string
  projectId: string
  editSessionId: string
  editPlanVersionId: string
  creditEstimateId: string
  approvedAt: TimestampString
  approvedBy: string
  compiledIntent?: CompiledEditingIntent
  professionalEditingDirective?: ProfessionalEditingDirective
  settingsSnapshot: Partial<EditSettingsSnapshotRecord>
  aspectRatioFramePlan?: AspectRatioFramePlan
  masterTimingPlan?: MasterTimingPlan
  captionVisualCueTimingPlan?: CaptionVisualCueTimingPlan
  soundSyncTransitionTimingPlan?: SoundSyncTransitionTimingPlan
  timingValidationPlan?: TimingValidationPlan
  sourceCleanupPlan?: SourceCleanupPlan
  trimReviewPlan?: TrimReviewPlan
  editingAgentExecutionPlan?: EditingAgentExecutionPlan
  asyncAssetReconciliationPlan?: AsyncAssetReconciliationPlan
  agentQAFallbackPlan?: AgentQAFallbackPlan
  sourceSequence: SourceSequenceItemRecord[]
  editPlanVersion: EditPlanVersionRecord
  segments: EditPlanSegmentRecord[]
  operations: EditOperationRecord[]
  visualAssetPlan: VisualAssetPlanItemRecord[]
  visualAssetPlanDomain?: VisualAssetPlanItem[]
  videoUnderstandingReport?: VideoUnderstandingReport
  adaptiveEditStrategy?: AdaptiveEditStrategy
  adaptiveEditStrategyPlan?: AdaptiveEditStrategyPlan
  toolRegistrySummary?: ToolRegistrySummary
  toolStrategyPlan?: ToolStrategyPlan
  renderStrategyPlan?: RenderStrategyPlan
  colorPipelinePlan?: ColorPipelinePlan
  audioPipelinePlan?: AudioPipelinePlan
  mapAnimationPlan?: MapAnimationPlan
  dataVizPlan?: DataVizPlan
  speakerVisualLayoutPlan?: SpeakerVisualLayoutPlan
  depthAwareOverlayPlan?: DepthAwareOverlayPlan
  frameLayoutPlan?: FrameLayoutPlanRecord
  frameLayoutPlanDomain?: FrameLayoutPlan
  rendererCompositionPlan?: RendererCompositionPlanRecord
  rendererCompositionPlanDomain?: RendererCompositionPlan
  rendererLayers: RendererLayerRecord[]
  rendererLayersDomain?: RendererLayerPlan[]
  providerPromptPlans?: ProviderPromptPlan[]
  characterConsistencyPlan?: CharacterConsistencyPlan
  documentaryFactSafetyPlan?: DocumentaryFactSafetyPlan
  creditEstimate: CreditEstimateRecord
  creditEstimateDomain: CreditEstimate
  qaPlan?: QAReportRecord
  qaPlanDomain?: EditPlan['editQAPlan']
  planningSystemAuditReport?: PlanningSystemAuditReport
  supabaseSchemaPlan?: SupabaseSchemaPlan
  migrationDraftPlan?: MigrationDraftPlan
  migrationReviewPlan?: MigrationReviewPlan
  supabaseProductionReadinessPlan?: SupabaseProductionReadinessPlan
  tierConstraints: string[]
  modelRoutingConstraints: string[]
  frameBackgroundPolicy: string[]
  mustFollowRules: string[]
  avoidRules: string[]
  fallbackPolicy: string[]
  snapshotVersion: 'mock-v1' | string
  sourcePlan: EditPlan
  segmentPlansDomain?: SegmentEditPlan[]
}
