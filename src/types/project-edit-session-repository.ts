import type {
  ProjectEditSessionCardModel,
  ProjectEditSessionEventRecord,
  ProjectEditSessionMemoryRecord,
  ProjectEditSessionMessageRecord,
  ProjectEditSessionPreviewRecord,
  ProjectEditSessionRecord,
  ProjectEditSessionRevisionRecord,
  ProjectEditSessionSnapshotRecord,
  ProjectEditSessionSourceRecord,
  ProjectEditSessionVersionRecord,
} from './project-edit-session'

export type ProjectEditSessionRepositoryMode =
  | 'mock_database'
  | 'supabase_disabled'
  | 'supabase_server'
  | 'supabase_local_future'
  | 'supabase_remote_future'

export type ProjectEditSessionRepositoryStatus =
  | 'ready_mock'
  | 'ready_supabase'
  | 'disabled_until_supabase_gates'
  | 'blocked_missing_auth'
  | 'blocked_missing_service_role'
  | 'blocked_missing_schema'
  | 'blocked_remote_deployment'
  | 'failed_validation'

export type ProjectEditSessionRepositoryOperation =
  | 'list_sessions'
  | 'get_session'
  | 'create_session'
  | 'update_session'
  | 'archive_session'
  | 'duplicate_session'
  | 'list_messages'
  | 'append_message'
  | 'list_sources'
  | 'save_source'
  | 'save_sources'
  | 'list_memory'
  | 'get_memory_layer'
  | 'upsert_memory'
  | 'save_snapshot'
  | 'get_latest_snapshot'
  | 'list_snapshots'
  | 'save_version'
  | 'list_versions'
  | 'get_latest_version'
  | 'save_preview'
  | 'list_previews'
  | 'get_latest_preview'
  | 'save_revision'
  | 'list_revisions'
  | 'append_event'
  | 'list_events'
  | 'create_card_model'
  | 'list_card_models'
  | 'create_session_bundle'

export type ProjectEditSessionRepositoryWriteSafety =
  | 'mock_write_only'
  | 'supabase_write_disabled'
  | 'supabase_write_enabled'
  | 'supabase_write_future'

export interface ProjectEditSessionRepositoryContext {
  mode: ProjectEditSessionRepositoryMode
  status: ProjectEditSessionRepositoryStatus
  workspaceId?: string
  projectId?: string
  editSessionId?: string
  userId?: string
  mockOnly: boolean
  writeSafety: ProjectEditSessionRepositoryWriteSafety
  notes: string[]
}

export interface ProjectEditSessionRepositoryResult<T> {
  ok: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
  warnings: string[]
  repositoryMode: ProjectEditSessionRepositoryMode
  mockOnly: boolean
  supabaseReadMade: boolean
  supabaseWriteMade: boolean
  storageReadMade: boolean
  storageWriteMade: boolean
  providerCallMade: boolean
  workerJobCreated: boolean
  renderJobCreated: boolean
  creditReservedOrSpent: boolean
}

export interface ProjectEditSessionBundleRecord {
  session: ProjectEditSessionRecord
  messages: ProjectEditSessionMessageRecord[]
  sources: ProjectEditSessionSourceRecord[]
  memories: ProjectEditSessionMemoryRecord[]
  snapshots: ProjectEditSessionSnapshotRecord[]
  versions: ProjectEditSessionVersionRecord[]
  previews: ProjectEditSessionPreviewRecord[]
  revisions: ProjectEditSessionRevisionRecord[]
  events: ProjectEditSessionEventRecord[]
  cardModel: ProjectEditSessionCardModel
  mockOnly: boolean
  warnings: string[]
}

export interface ProjectEditSessionRepositorySummary {
  repositoryMode: ProjectEditSessionRepositoryMode
  status: ProjectEditSessionRepositoryStatus
  operationCount: number
  mockOnly: boolean
  supabaseEnabled: boolean
  summary: string[]
  warnings: string[]
}

export interface ProjectEditSessionRowMappingSummary {
  tableName: string
  sourceId?: string
  mappedId?: string
  ok: boolean
  warnings: string[]
}

export interface ProjectEditSessionRowLike {
  id: string
  project_id: string
  workspace_id: string | null
  owner_user_id: string | null
  name: string
  description: string | null
  status: string
  aspect_ratio: string
  custom_aspect_ratio: Record<string, unknown> | null
  platform_target: string
  thumbnail_url: string | null
  latest_preview_url: string | null
  source_media_asset_ids: string[]
  selected_edit_level: string | null
  selected_edit_preference_id: string | null
  selected_preference_version_id: string | null
  selected_edit_preference_handle: string | null
  preference_dna_application_id: string | null
  dna_status_label: string | null
  dna_qa_status_label: string | null
  do_not_copy_rules_active: boolean
  message_count: number
  revision_count: number
  version_count: number
  preview_count: number
  latest_snapshot_id: string | null
  latest_version_id: string | null
  latest_preview_id: string | null
  approval_status: string
  last_opened_at: string | null
  created_at: string
  updated_at: string
  mock_only: boolean
  metadata: Record<string, unknown> | null
}

export interface ProjectEditSessionMessageRowLike {
  id: string
  project_id: string
  edit_session_id: string
  role: string
  kind: string
  text: string
  created_at: string
  related_snapshot_id: string | null
  related_version_id: string | null
  related_preview_id: string | null
  metadata: Record<string, unknown> | null
  mock_only: boolean
}

export interface ProjectEditSessionSourceRowLike {
  id: string
  project_id: string
  edit_session_id: string
  media_asset_id: string
  source_order_index: number
  label: string | null
  notes: string[]
  importance: string
  thumbnail_url: string | null
  preview_url: string | null
  duration_seconds: number | null
  mime_type: string | null
  mock_only: boolean
}

export interface ProjectEditSessionMemoryRowLike {
  id: string
  project_id: string
  edit_session_id: string
  layer: string
  summary: string
  facts: string[]
  preferences: string[]
  warnings: string[]
  updated_from_message_id: string | null
  updated_from_revision_id: string | null
  created_at: string
  updated_at: string
  mock_only: boolean
  metadata: Record<string, unknown> | null
}

export interface ProjectEditSessionSnapshotRowLike {
  id: string
  project_id: string
  edit_session_id: string
  kind: string
  version_number: number | null
  message_id: string | null
  summary: string
  state: Record<string, unknown>
  created_at: string
  mock_only: boolean
}

export interface ProjectEditSessionVersionRowLike {
  id: string
  project_id: string
  edit_session_id: string
  version_number: number
  status: string
  name: string
  summary: string
  created_from_snapshot_id: string | null
  created_from_message_id: string | null
  preview_id: string | null
  approval_status: string
  created_at: string
  mock_only: boolean
  metadata: Record<string, unknown> | null
}

export interface ProjectEditSessionPreviewRowLike {
  id: string
  project_id: string
  edit_session_id: string
  version_id: string | null
  status: string
  thumbnail_url: string | null
  preview_url: string | null
  aspect_ratio: string
  duration_seconds: number | null
  created_at: string
  mock_only: boolean
  metadata: Record<string, unknown> | null
}

export interface ProjectEditSessionRevisionRowLike {
  id: string
  project_id: string
  edit_session_id: string
  requested_by_message_id: string
  summary: string
  user_instruction: string
  resets_approval: boolean
  created_snapshot_id: string | null
  created_version_id: string | null
  created_at: string
  mock_only: boolean
  metadata: Record<string, unknown> | null
}

export interface ProjectEditSessionEventRowLike {
  id: string
  project_id: string
  edit_session_id: string
  event_type: string
  summary: string
  created_at: string
  mock_only: boolean
  metadata: Record<string, unknown> | null
}

export const REEDITPRO_PROJECT_EDIT_SESSION_REPOSITORY_RULE =
  'Project Edit Session state must flow through repository interfaces before future persistence; UI and random services should not directly own session persistence.'

export const REEDITPRO_PROJECT_EDIT_SESSION_SUPABASE_DISABLED_RULE =
  'Project Edit Session Supabase writes remain disabled until schema, auth, RLS, service-role boundaries, and remote deployment gates are approved.'

export const REEDITPRO_PROJECT_EDIT_SESSION_REPOSITORY_MOCK_ONLY_RULE =
  'RP-EDITSESSION-03 implements mock repository behavior only; it must not create API routes, UI runtime changes, Supabase migrations, or remote persistence.'
