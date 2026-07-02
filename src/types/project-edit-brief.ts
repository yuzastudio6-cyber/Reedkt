export type ProjectEditBriefStatus =
  | 'not_created'
  | 'draft'
  | 'active'
  | 'needs_review'
  | 'ready_for_plan'
  | 'applied_to_plan'
  | 'changed_after_plan'
  | 'archived'

export type ProjectEditBriefAvailability =
  | 'optional_not_opened'
  | 'optional_opened'
  | 'has_markers'
  | 'has_confirmed_markers'
  | 'has_conflicts'
  | 'ready_for_plan'

export type ProjectEditBriefMarkerType =
  | 'broll'
  | 'cut_remove'
  | 'keep_emphasize'
  | 'caption_text'
  | 'graphic_card_ui'
  | 'music_soundtrack'
  | 'sfx_sound_design'
  | 'voiceover'
  | 'transition'
  | 'speed_pacing'
  | 'color_tone'
  | 'do_not_use'
  | 'general_note'

export type ProjectEditBriefMarkerStatus =
  | 'draft'
  | 'needs_clarification'
  | 'needs_asset'
  | 'confirmed'
  | 'ready_for_plan'
  | 'conflict'
  | 'applied_to_plan'
  | 'changed_after_plan'
  | 'archived'

export type ProjectEditBriefMarkerPriority =
  | 'must_follow'
  | 'should_follow'
  | 'optional'
  | 'avoid'

export type ProjectEditBriefMarkerTimeMode =
  | 'point'
  | 'range'

export type ProjectEditBriefMarkerAIMode =
  | 'off'
  | 'confirm_only'
  | 'ask_clarifying_questions'
  | 'suggest_options'

export type ProjectEditBriefMarkerMessageRole =
  | 'user'
  | 'assistant'
  | 'system'
  | 'marker_status'

export type ProjectEditBriefMarkerMessageKind =
  | 'note'
  | 'clarification_question'
  | 'clarification_answer'
  | 'confirmation'
  | 'intent_update'
  | 'asset_note'
  | 'conflict_note'
  | 'system_note'

export type ProjectEditBriefAttachmentKind =
  | 'broll_video'
  | 'image'
  | 'music_track'
  | 'soundtrack'
  | 'sfx'
  | 'voiceover'
  | 'document'
  | 'reference_label'
  | 'reference_url_metadata_only'

export type ProjectEditBriefAttachmentStatus =
  | 'metadata_only'
  | 'mock_attached'
  | 'needs_upload_future'
  | 'missing_required_asset'
  | 'blocked'

export type ProjectEditBriefMarkerIntentAction =
  | 'add_broll'
  | 'remove_or_cut'
  | 'keep_or_emphasize'
  | 'add_caption_or_text'
  | 'add_graphic_or_ui_card'
  | 'add_music_or_soundtrack'
  | 'add_sfx'
  | 'add_voiceover'
  | 'add_transition'
  | 'adjust_speed_or_pacing'
  | 'adjust_color_or_tone'
  | 'avoid_or_do_not_use'
  | 'general_instruction'

export type ProjectEditBriefMarkerIntentStatus =
  | 'not_extracted'
  | 'draft_intent'
  | 'needs_clarification'
  | 'needs_asset'
  | 'confirmed'
  | 'ready_for_plan'
  | 'conflict'
  | 'blocked'

export type ProjectEditBriefIntentConfidence =
  | 'low'
  | 'medium'
  | 'high'

export type ProjectEditBriefAudioBehavior =
  | 'keep_original_audio'
  | 'duck_original_audio'
  | 'replace_with_music'
  | 'add_music_under'
  | 'add_sfx_only'
  | 'mute_section'
  | 'no_audio_change'
  | 'unspecified'

export type ProjectEditBriefVisualBehavior =
  | 'replace_visual'
  | 'overlay_visual'
  | 'insert_broll'
  | 'add_graphic_overlay'
  | 'keep_main_video'
  | 'remove_section'
  | 'no_visual_change'
  | 'unspecified'

export type ProjectEditBriefCaptionBehavior =
  | 'add_caption'
  | 'edit_caption'
  | 'make_smaller'
  | 'make_larger'
  | 'remove_caption'
  | 'keep_caption_style'
  | 'no_caption_change'
  | 'unspecified'

export type ProjectEditBriefQAStatus =
  | 'not_checked'
  | 'passed'
  | 'warning'
  | 'needs_clarification'
  | 'needs_asset'
  | 'conflict'
  | 'blocked'

export type ProjectEditSessionExportAspectRatio =
  | '9:16'
  | '16:9'
  | '1:1'
  | '4:5'
  | 'custom'

export type ProjectEditSessionExportFormat =
  | 'mp4'
  | 'mov_future'
  | 'webm_future'
  | 'image_sequence_future'

export type ProjectEditSessionExportPreset =
  | 'instagram_reel_1080x1920'
  | 'tiktok_1080x1920'
  | 'youtube_shorts_1080x1920'
  | 'youtube_standard_1920x1080'
  | 'instagram_feed_square_1080x1080'
  | 'instagram_feed_4x5_1080x1350'
  | 'website_1920x1080'
  | 'custom'

export interface ProjectEditBriefRecord {
  id: string
  projectId: string
  editSessionId: string
  status: ProjectEditBriefStatus
  availability: ProjectEditBriefAvailability
  title: string
  summary?: string
  markerCount: number
  confirmedMarkerCount: number
  conflictCount: number
  needsAssetCount: number
  needsClarificationCount: number
  exportSettingsId?: string
  createdAt: string
  updatedAt: string
  lastOpenedAt?: string
  mockOnly: boolean
  metadata?: Record<string, unknown>
}

export interface ProjectEditBriefMarkerRecord {
  id: string
  projectId: string
  editSessionId: string
  briefId: string
  markerType: ProjectEditBriefMarkerType
  status: ProjectEditBriefMarkerStatus
  priority: ProjectEditBriefMarkerPriority
  timeMode: ProjectEditBriefMarkerTimeMode
  startTimeSeconds: number
  endTimeSeconds?: number
  title: string
  userNote: string
  aiMode: ProjectEditBriefMarkerAIMode
  intentId?: string
  attachmentCount: number
  messageCount: number
  qaStatus: ProjectEditBriefQAStatus
  createdAt: string
  updatedAt: string
  mockOnly: boolean
  metadata?: Record<string, unknown>
}

export interface ProjectEditBriefMarkerAttachmentRecord {
  id: string
  projectId: string
  editSessionId: string
  briefId: string
  markerId: string
  attachmentKind: ProjectEditBriefAttachmentKind
  status: ProjectEditBriefAttachmentStatus
  label: string
  mediaAssetId?: string
  referenceUrl?: string
  referenceLabel?: string
  notes: string[]
  previewLabel?: string
  durationSeconds?: number
  mockOnly: boolean
  metadata?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface ProjectEditBriefMarkerMessageRecord {
  id: string
  projectId: string
  editSessionId: string
  briefId: string
  markerId: string
  role: ProjectEditBriefMarkerMessageRole
  kind: ProjectEditBriefMarkerMessageKind
  text: string
  createdAt: string
  relatedIntentId?: string
  relatedAttachmentId?: string
  mockOnly: boolean
  metadata?: Record<string, unknown>
}

export interface ProjectEditBriefMarkerIntentRecord {
  id: string
  projectId: string
  editSessionId: string
  briefId: string
  markerId: string
  action: ProjectEditBriefMarkerIntentAction
  status: ProjectEditBriefMarkerIntentStatus
  instruction: string
  timeRangeLabel: string
  startTimeSeconds: number
  endTimeSeconds?: number
  visualBehavior: ProjectEditBriefVisualBehavior
  audioBehavior: ProjectEditBriefAudioBehavior
  captionBehavior: ProjectEditBriefCaptionBehavior
  assetRequirement?: string
  providedAssetIds: string[]
  priority: ProjectEditBriefMarkerPriority
  confidence: ProjectEditBriefIntentConfidence
  blockingNeeds: string[]
  doNotCopyNotes: string[]
  plannerHints: string[]
  latestUserMessageId?: string
  latestConfirmationId?: string
  createdAt: string
  updatedAt: string
  mockOnly: boolean
  metadata?: Record<string, unknown>
}

export interface ProjectEditBriefMarkerConfirmationRecord {
  id: string
  projectId: string
  editSessionId: string
  briefId: string
  markerId: string
  intentId: string
  summary: string
  confirmedByUser: boolean
  aiMode: ProjectEditBriefMarkerAIMode
  createdAt: string
  mockOnly: boolean
  metadata?: Record<string, unknown>
}

export interface ProjectEditBriefMarkerConflictRecord {
  id: string
  projectId: string
  editSessionId: string
  briefId: string
  markerId: string
  relatedMarkerId?: string
  qaStatus: ProjectEditBriefQAStatus
  title: string
  summary: string
  recommendedResolution: string
  blocksPlan: boolean
  requiresUserReview: boolean
  createdAt: string
  mockOnly: boolean
  metadata?: Record<string, unknown>
}

export interface ProjectEditBriefMarkerRevisionRecord {
  id: string
  projectId: string
  editSessionId: string
  briefId: string
  markerId: string
  previousIntentId?: string
  newIntentId?: string
  summary: string
  reason: string
  createdAt: string
  mockOnly: boolean
  metadata?: Record<string, unknown>
}

export interface ProjectEditBriefApplicationLogRecord {
  id: string
  projectId: string
  editSessionId: string
  briefId: string
  markerId?: string
  summary: string
  appliedToPlan: boolean
  createdAt: string
  mockOnly: boolean
  metadata?: Record<string, unknown>
}

export interface ProjectEditSessionExportSettingsRecord {
  id: string
  projectId: string
  editSessionId: string
  source: 'auto_recommended_mock' | 'user_override_mock' | 'future_render_settings'
  platformTarget: import('./project-edit-session').ProjectEditSessionPlatformTarget
  aspectRatio: ProjectEditSessionExportAspectRatio
  customAspectRatio?: {
    width: number
    height: number
  }
  resolution: {
    width: number
    height: number
  }
  frameRate: 24 | 25 | 30 | 50 | 60
  format: ProjectEditSessionExportFormat
  codec: 'h264' | 'h265_future' | 'prores_future'
  audioCodec: 'aac' | 'pcm_future'
  audioLoudnessTarget?: string
  captionSafeArea: boolean
  safeZonePreset?: string
  deliveryPreset: ProjectEditSessionExportPreset
  summary: string
  createdAt: string
  updatedAt: string
  mockOnly: boolean
  metadata?: Record<string, unknown>
}

export interface ProjectEditBriefTimelineMarkerModel {
  markerId: string
  markerType: ProjectEditBriefMarkerType
  status: ProjectEditBriefMarkerStatus
  qaStatus: ProjectEditBriefQAStatus
  priority: ProjectEditBriefMarkerPriority
  timeMode: ProjectEditBriefMarkerTimeMode
  startTimeSeconds: number
  endTimeSeconds?: number
  label: string
  iconLabel: string
  lane: string
  colorToken: string
  mockOnly: boolean
}

export interface ProjectEditBriefMarkerDrawerModel {
  marker: ProjectEditBriefMarkerRecord
  intent?: ProjectEditBriefMarkerIntentRecord
  attachments: ProjectEditBriefMarkerAttachmentRecord[]
  messages: ProjectEditBriefMarkerMessageRecord[]
  confirmations: ProjectEditBriefMarkerConfirmationRecord[]
  conflicts: ProjectEditBriefMarkerConflictRecord[]
  statusLabel: string
  actionLabels: string[]
  mockOnly: boolean
  warnings: string[]
}

export interface ProjectEditBriefBundleRecord {
  brief: ProjectEditBriefRecord
  markers: ProjectEditBriefMarkerRecord[]
  attachments: ProjectEditBriefMarkerAttachmentRecord[]
  messages: ProjectEditBriefMarkerMessageRecord[]
  intents: ProjectEditBriefMarkerIntentRecord[]
  confirmations: ProjectEditBriefMarkerConfirmationRecord[]
  conflicts: ProjectEditBriefMarkerConflictRecord[]
  revisions: ProjectEditBriefMarkerRevisionRecord[]
  applicationLogs: ProjectEditBriefApplicationLogRecord[]
  exportSettings?: ProjectEditSessionExportSettingsRecord
  timelineMarkers: ProjectEditBriefTimelineMarkerModel[]
  mockOnly: boolean
  warnings: string[]
}

export interface ProjectEditBriefFixtureBundle {
  briefs: ProjectEditBriefRecord[]
  markers: ProjectEditBriefMarkerRecord[]
  attachments: ProjectEditBriefMarkerAttachmentRecord[]
  messages: ProjectEditBriefMarkerMessageRecord[]
  intents: ProjectEditBriefMarkerIntentRecord[]
  confirmations: ProjectEditBriefMarkerConfirmationRecord[]
  conflicts: ProjectEditBriefMarkerConflictRecord[]
  revisions: ProjectEditBriefMarkerRevisionRecord[]
  applicationLogs: ProjectEditBriefApplicationLogRecord[]
  exportSettings: ProjectEditSessionExportSettingsRecord[]
  timelineMarkers: ProjectEditBriefTimelineMarkerModel[]
  bundles: ProjectEditBriefBundleRecord[]
}

export const REEDITPRO_PROJECT_EDIT_BRIEF_RULE =
  'ProjectEditBrief is an optional timeline-based instruction layer inside a ProjectEditSession; it is not required for chat-only editing.'

export const REEDITPRO_PROJECT_EDIT_BRIEF_MARKER_CHAT_RULE =
  'Marker Chat stores scoped marker conversation and structured marker intent; it must not be treated as the main Edit Chat.'

export const REEDITPRO_PROJECT_EDIT_BRIEF_NO_EXECUTION_RULE =
  'RP-EDITBRIEF-02 defines types, contracts, and mock fixtures only; it must not run models, providers, workers, media processing, render, credits, Supabase, or runtime UI behavior.'
