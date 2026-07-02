export type ProjectEditSessionStatus =
  | 'draft'
  | 'setup_ready'
  | 'awaiting_approval'
  | 'approved'
  | 'in_progress_mock'
  | 'preview_ready'
  | 'revision_requested'
  | 'needs_review'
  | 'rendered_future'
  | 'archived'

export type ProjectEditSessionAspectRatio =
  | '9:16'
  | '16:9'
  | '1:1'
  | '4:5'
  | 'custom'

export type ProjectEditSessionPlatformTarget =
  | 'tiktok_reel'
  | 'instagram_reel'
  | 'instagram_feed'
  | 'youtube_shorts'
  | 'youtube_standard'
  | 'linkedin'
  | 'website'
  | 'podcast_clip'
  | 'ad_creative'
  | 'internal_review'
  | 'custom'

export type ProjectEditSessionMessageRole =
  | 'user'
  | 'assistant'
  | 'system'
  | 'tool_status'
  | 'approval'
  | 'revision'
  | 'preview'

export type ProjectEditSessionMessageKind =
  | 'text'
  | 'source_update'
  | 'setup_summary'
  | 'edit_plan'
  | 'credit_estimate'
  | 'approval_request'
  | 'approval_response'
  | 'progress_update'
  | 'preview_ready'
  | 'revision_request'
  | 'revision_learned'
  | 'preference_dna_applied'
  | 'preference_dna_review_warning'
  | 'qa_summary'
  | 'system_note'

export type ProjectEditSessionSourceImportance =
  | 'primary'
  | 'optional'
  | 'broll'
  | 'reference_only'

export type ProjectEditSessionMemoryLayer =
  | 'project_memory'
  | 'session_memory'
  | 'source_memory'
  | 'preference_memory'
  | 'dna_application_memory'
  | 'revision_memory'
  | 'approval_memory'
  | 'preview_memory'
  | 'user_instruction_memory'

export type ProjectEditSessionSnapshotKind =
  | 'created'
  | 'source_updated'
  | 'setup_generated'
  | 'plan_approved'
  | 'preview_created'
  | 'revision_requested'
  | 'revision_applied'
  | 'version_created'
  | 'manual_checkpoint'

export type ProjectEditSessionVersionStatus =
  | 'draft'
  | 'approved'
  | 'superseded'
  | 'preview_ready'
  | 'rendered_future'
  | 'rejected'

export type ProjectEditSessionPreviewStatus =
  | 'placeholder_mock'
  | 'preview_ready_mock'
  | 'render_future'
  | 'failed'
  | 'blocked'

export type ProjectEditSessionApprovalStatus =
  | 'not_requested'
  | 'requested'
  | 'approved'
  | 'rejected'
  | 'reset_after_revision'

export type ProjectEditSessionCardShape =
  | 'vertical'
  | 'wide'
  | 'square'
  | 'social'
  | 'custom'

export type ProjectEditSessionUserFacingEditLevel =
  | 'basic'
  | 'premium'
  | 'ultra_premium'

export interface ProjectEditSessionRecord {
  id: string
  projectId: string
  workspaceId?: string
  ownerUserId?: string
  name: string
  description?: string
  status: ProjectEditSessionStatus
  aspectRatio: ProjectEditSessionAspectRatio
  customAspectRatio?: {
    width: number
    height: number
  }
  platformTarget: ProjectEditSessionPlatformTarget
  thumbnailUrl?: string
  latestPreviewUrl?: string
  sourceMediaAssetIds: string[]
  selectedEditLevel?: ProjectEditSessionUserFacingEditLevel
  selectedEditPreferenceId?: string
  selectedPreferenceVersionId?: string
  selectedEditPreferenceHandle?: string
  preferenceDNAApplicationId?: string
  dnaStatusLabel?: string
  dnaQAStatusLabel?: string
  doNotCopyRulesActive: boolean
  messageCount: number
  revisionCount: number
  versionCount: number
  previewCount: number
  latestSnapshotId?: string
  latestVersionId?: string
  latestPreviewId?: string
  approvalStatus: ProjectEditSessionApprovalStatus
  lastOpenedAt?: string
  createdAt: string
  updatedAt: string
  mockOnly: boolean
  metadata?: Record<string, unknown>
}

export interface ProjectEditSessionCardModel {
  id: string
  projectId: string
  name: string
  status: ProjectEditSessionStatus
  aspectRatio: ProjectEditSessionAspectRatio
  platformTarget: ProjectEditSessionPlatformTarget
  thumbnailUrl?: string
  latestPreviewUrl?: string
  selectedEditPreferenceName?: string
  selectedEditPreferenceHandle?: string
  dnaStatusLabel?: string
  dnaQAStatusLabel?: string
  badges: string[]
  messageCount: number
  revisionCount: number
  versionCount: number
  lastEditedAt: string
  cardShape: ProjectEditSessionCardShape
  mockOnly: boolean
}

export interface ProjectEditSessionMessageRecord {
  id: string
  projectId: string
  editSessionId: string
  role: ProjectEditSessionMessageRole
  kind: ProjectEditSessionMessageKind
  text: string
  createdAt: string
  relatedSnapshotId?: string
  relatedVersionId?: string
  relatedPreviewId?: string
  metadata?: Record<string, unknown>
  mockOnly: boolean
}

export interface ProjectEditSessionSourceRecord {
  id: string
  projectId: string
  editSessionId: string
  mediaAssetId: string
  sourceOrderIndex: number
  label?: string
  notes: string[]
  importance: ProjectEditSessionSourceImportance
  thumbnailUrl?: string
  previewUrl?: string
  durationSeconds?: number
  mimeType?: string
  mockOnly: boolean
}

export interface ProjectEditSessionMemoryRecord {
  id: string
  projectId: string
  editSessionId: string
  layer: ProjectEditSessionMemoryLayer
  summary: string
  facts: string[]
  preferences: string[]
  warnings: string[]
  updatedFromMessageId?: string
  updatedFromRevisionId?: string
  createdAt: string
  updatedAt: string
  mockOnly: boolean
  metadata?: Record<string, unknown>
}

export interface ProjectEditSessionSnapshotRecord {
  id: string
  projectId: string
  editSessionId: string
  kind: ProjectEditSessionSnapshotKind
  versionNumber?: number
  messageId?: string
  summary: string
  state: Record<string, unknown>
  createdAt: string
  mockOnly: boolean
}

export interface ProjectEditSessionVersionRecord {
  id: string
  projectId: string
  editSessionId: string
  versionNumber: number
  status: ProjectEditSessionVersionStatus
  name: string
  summary: string
  createdFromSnapshotId?: string
  createdFromMessageId?: string
  previewId?: string
  approvalStatus: ProjectEditSessionApprovalStatus
  createdAt: string
  mockOnly: boolean
  metadata?: Record<string, unknown>
}

export interface ProjectEditSessionPreviewRecord {
  id: string
  projectId: string
  editSessionId: string
  versionId?: string
  status: ProjectEditSessionPreviewStatus
  thumbnailUrl?: string
  previewUrl?: string
  aspectRatio: ProjectEditSessionAspectRatio
  durationSeconds?: number
  createdAt: string
  mockOnly: boolean
  metadata?: Record<string, unknown>
}

export interface ProjectEditSessionRevisionRecord {
  id: string
  projectId: string
  editSessionId: string
  requestedByMessageId: string
  summary: string
  userInstruction: string
  resetsApproval: boolean
  createdSnapshotId?: string
  createdVersionId?: string
  createdAt: string
  mockOnly: boolean
  metadata?: Record<string, unknown>
}

export interface ProjectEditSessionEventRecord {
  id: string
  projectId: string
  editSessionId: string
  eventType: string
  summary: string
  createdAt: string
  mockOnly: boolean
  metadata?: Record<string, unknown>
}

export interface ProjectEditSessionFixtureBundle {
  sessions: ProjectEditSessionRecord[]
  messages: ProjectEditSessionMessageRecord[]
  sources: ProjectEditSessionSourceRecord[]
  memories: ProjectEditSessionMemoryRecord[]
  snapshots: ProjectEditSessionSnapshotRecord[]
  versions: ProjectEditSessionVersionRecord[]
  previews: ProjectEditSessionPreviewRecord[]
  revisions: ProjectEditSessionRevisionRecord[]
  events: ProjectEditSessionEventRecord[]
}

export const REEDITPRO_PROJECT_EDIT_SESSION_RULE =
  'ProjectEditSession is the persistent video-editing conversation inside a project; it is not the same object as an Edit Preference.'

export const REEDITPRO_EDIT_CHAT_USER_FACING_RULE =
  'Edit Chat is the user-facing name for ProjectEditSession.'

export const REEDITPRO_PROJECT_EDIT_SESSION_MOCK_ONLY_RULE =
  'RP-EDITSESSION-02 defines types, contracts, and mock fixtures only; it must not implement runtime persistence, routes, UI behavior, or Supabase migrations.'
