import type {
  ProjectEditBriefApplicationLogRecord,
  ProjectEditBriefBundleRecord,
  ProjectEditBriefMarkerAttachmentRecord,
  ProjectEditBriefMarkerConfirmationRecord,
  ProjectEditBriefMarkerConflictRecord,
  ProjectEditBriefMarkerDrawerModel,
  ProjectEditBriefMarkerIntentRecord,
  ProjectEditBriefMarkerMessageRecord,
  ProjectEditBriefMarkerRecord,
  ProjectEditBriefMarkerRevisionRecord,
  ProjectEditBriefRecord,
  ProjectEditBriefTimelineMarkerModel,
  ProjectEditSessionExportSettingsRecord,
} from './project-edit-brief'

export type ProjectEditBriefRepositoryMode =
  | 'mock_database'
  | 'supabase_disabled'
  | 'supabase_server'
  | 'supabase_local_future'
  | 'supabase_remote_future'

export type ProjectEditBriefRepositoryStatus =
  | 'ready_mock'
  | 'ready_supabase'
  | 'disabled_until_supabase_gates'
  | 'blocked_missing_auth'
  | 'blocked_missing_service_role'
  | 'blocked_missing_schema'
  | 'blocked_remote_deployment'
  | 'failed_validation'

export type ProjectEditBriefRepositoryOperation =
  | 'get_brief'
  | 'get_brief_for_session'
  | 'create_brief'
  | 'update_brief'
  | 'archive_brief'
  | 'list_markers'
  | 'get_marker'
  | 'create_marker'
  | 'update_marker'
  | 'delete_marker'
  | 'confirm_marker'
  | 'archive_marker'
  | 'list_marker_attachments'
  | 'add_marker_attachment'
  | 'remove_marker_attachment'
  | 'list_marker_messages'
  | 'append_marker_message'
  | 'get_marker_intent'
  | 'save_marker_intent'
  | 'update_marker_intent'
  | 'list_marker_confirmations'
  | 'save_marker_confirmation'
  | 'list_marker_conflicts'
  | 'save_marker_conflict'
  | 'list_marker_revisions'
  | 'save_marker_revision'
  | 'list_application_logs'
  | 'append_application_log'
  | 'get_export_settings'
  | 'recommend_export_settings'
  | 'update_export_settings'
  | 'create_timeline_marker_models'
  | 'create_marker_drawer_model'
  | 'create_brief_bundle'
  | 'create_brief_summary'

export type ProjectEditBriefRepositoryWriteSafety =
  | 'mock_write_only'
  | 'supabase_write_disabled'
  | 'supabase_write_enabled'
  | 'supabase_write_future'

export interface ProjectEditBriefRepositoryContext {
  mode: ProjectEditBriefRepositoryMode
  status: ProjectEditBriefRepositoryStatus
  workspaceId?: string
  projectId?: string
  editSessionId?: string
  briefId?: string
  userId?: string
  mockOnly: boolean
  writeSafety: ProjectEditBriefRepositoryWriteSafety
  notes: string[]
}

export interface ProjectEditBriefRepositoryResult<T> {
  ok: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
  warnings: string[]
  repositoryMode: ProjectEditBriefRepositoryMode
  mockOnly: boolean
  supabaseReadMade: boolean
  supabaseWriteMade: boolean
  storageReadMade: boolean
  storageWriteMade: boolean
  fileBytesRead: boolean
  externalUrlFetched: boolean
  mediaProcessingStarted: boolean
  providerCallMade: boolean
  workerJobCreated: boolean
  generationRequestCreated: boolean
  renderJobCreated: boolean
  creditReservedOrSpent: boolean
}

export type ProjectEditBriefRepositoryBundleRecord = ProjectEditBriefBundleRecord

export interface ProjectEditBriefRepositorySummary {
  repositoryMode: ProjectEditBriefRepositoryMode
  status: ProjectEditBriefRepositoryStatus
  operationCount: number
  mockOnly: boolean
  supabaseEnabled: boolean
  summary: string[]
  warnings: string[]
}

export interface ProjectEditBriefRowMappingSummary {
  tableName: string
  sourceId?: string
  mappedId?: string
  ok: boolean
  warnings: string[]
}

export interface ProjectEditBriefRowLike {
  id: string
  project_id: string
  edit_session_id: string
  status: string
  availability: string
  title: string
  summary: string | null
  marker_count: number
  confirmed_marker_count: number
  conflict_count: number
  needs_asset_count: number
  needs_clarification_count: number
  export_settings_id: string | null
  created_at: string
  updated_at: string
  last_opened_at: string | null
  mock_only: boolean
  metadata: Record<string, unknown> | null
}

export interface ProjectEditBriefMarkerRowLike {
  id: string
  project_id: string
  edit_session_id: string
  brief_id: string
  marker_type: string
  status: string
  priority: string
  time_mode: string
  start_time_seconds: number
  end_time_seconds: number | null
  title: string
  user_note: string
  ai_mode: string
  intent_id: string | null
  attachment_count: number
  message_count: number
  qa_status: string
  created_at: string
  updated_at: string
  mock_only: boolean
  metadata: Record<string, unknown> | null
}

export interface ProjectEditBriefMarkerAttachmentRowLike {
  id: string
  project_id: string
  edit_session_id: string
  brief_id: string
  marker_id: string
  attachment_kind: string
  status: string
  label: string
  media_asset_id: string | null
  reference_url: string | null
  reference_label: string | null
  notes: string[]
  preview_label: string | null
  duration_seconds: number | null
  mock_only: boolean
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface ProjectEditBriefMarkerMessageRowLike {
  id: string
  project_id: string
  edit_session_id: string
  brief_id: string
  marker_id: string
  role: string
  kind: string
  text: string
  created_at: string
  related_intent_id: string | null
  related_attachment_id: string | null
  mock_only: boolean
  metadata: Record<string, unknown> | null
}

export interface ProjectEditBriefMarkerIntentRowLike {
  id: string
  project_id: string
  edit_session_id: string
  brief_id: string
  marker_id: string
  action: string
  status: string
  instruction: string
  time_range_label: string
  start_time_seconds: number
  end_time_seconds: number | null
  visual_behavior: string
  audio_behavior: string
  caption_behavior: string
  asset_requirement: string | null
  provided_asset_ids: string[]
  priority: string
  confidence: string
  blocking_needs: string[]
  do_not_copy_notes: string[]
  planner_hints: string[]
  latest_user_message_id: string | null
  latest_confirmation_id: string | null
  created_at: string
  updated_at: string
  mock_only: boolean
  metadata: Record<string, unknown> | null
}

export interface ProjectEditBriefMarkerConfirmationRowLike {
  id: string
  project_id: string
  edit_session_id: string
  brief_id: string
  marker_id: string
  intent_id: string
  summary: string
  confirmed_by_user: boolean
  ai_mode: string
  created_at: string
  mock_only: boolean
  metadata: Record<string, unknown> | null
}

export interface ProjectEditBriefMarkerConflictRowLike {
  id: string
  project_id: string
  edit_session_id: string
  brief_id: string
  marker_id: string
  related_marker_id: string | null
  qa_status: string
  title: string
  summary: string
  recommended_resolution: string
  blocks_plan: boolean
  requires_user_review: boolean
  created_at: string
  mock_only: boolean
  metadata: Record<string, unknown> | null
}

export interface ProjectEditBriefMarkerRevisionRowLike {
  id: string
  project_id: string
  edit_session_id: string
  brief_id: string
  marker_id: string
  previous_intent_id: string | null
  new_intent_id: string | null
  summary: string
  reason: string
  created_at: string
  mock_only: boolean
  metadata: Record<string, unknown> | null
}

export interface ProjectEditBriefApplicationLogRowLike {
  id: string
  project_id: string
  edit_session_id: string
  brief_id: string
  marker_id: string | null
  summary: string
  applied_to_plan: boolean
  created_at: string
  mock_only: boolean
  metadata: Record<string, unknown> | null
}

export interface ProjectEditSessionExportSettingsRowLike {
  id: string
  project_id: string
  edit_session_id: string
  source: string
  platform_target: string
  aspect_ratio: string
  custom_aspect_ratio: Record<string, unknown> | null
  resolution: Record<string, unknown>
  frame_rate: number
  format: string
  codec: string
  audio_codec: string
  audio_loudness_target: string | null
  caption_safe_area: boolean
  safe_zone_preset: string | null
  delivery_preset: string
  summary: string
  created_at: string
  updated_at: string
  mock_only: boolean
  metadata: Record<string, unknown> | null
}

export type ProjectEditBriefRepositoryRecord =
  | ProjectEditBriefRecord
  | ProjectEditBriefMarkerRecord
  | ProjectEditBriefMarkerAttachmentRecord
  | ProjectEditBriefMarkerMessageRecord
  | ProjectEditBriefMarkerIntentRecord
  | ProjectEditBriefMarkerConfirmationRecord
  | ProjectEditBriefMarkerConflictRecord
  | ProjectEditBriefMarkerRevisionRecord
  | ProjectEditBriefApplicationLogRecord
  | ProjectEditSessionExportSettingsRecord
  | ProjectEditBriefTimelineMarkerModel
  | ProjectEditBriefMarkerDrawerModel

export const REEDITPRO_PROJECT_EDIT_BRIEF_REPOSITORY_RULE =
  'Project Edit Brief state must flow through repository interfaces before future API/UI/persistence; UI and random services should not directly own Brief persistence.'

export const REEDITPRO_PROJECT_EDIT_BRIEF_SUPABASE_DISABLED_RULE =
  'Project Edit Brief Supabase reads/writes remain disabled until schema, auth, RLS, service-role boundaries, and remote deployment gates are approved.'

export const REEDITPRO_PROJECT_EDIT_BRIEF_REPOSITORY_MOCK_ONLY_RULE =
  'RP-EDITBRIEF-03 implements mock repository behavior only; it must not create API routes, UI runtime changes, Supabase migrations, or remote persistence.'
