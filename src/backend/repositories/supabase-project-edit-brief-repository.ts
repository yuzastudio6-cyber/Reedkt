import { randomUUID } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
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
} from '../../types/project-edit-brief'
import type {
  ProjectEditBriefRepositoryContext,
  ProjectEditBriefRepositoryOperation,
  ProjectEditBriefRepositoryResult,
} from '../../types/project-edit-brief-repository'
import { createProjectEditBriefReadableSummary } from '../../lib/project-edit-brief-summary-mappers'
import { createProjectEditBriefTimelineMarkerModels } from '../../lib/project-edit-brief-timeline-mappers'
import { recommendProjectEditBriefExportSettings } from '../../lib/project-edit-brief-export-settings-rules'
import {
  mapProjectEditBriefApplicationLogRecordToInsertRow,
  mapProjectEditBriefApplicationLogRowToRecord,
  mapProjectEditBriefMarkerAttachmentRecordToInsertRow,
  mapProjectEditBriefMarkerAttachmentRowToRecord,
  mapProjectEditBriefMarkerConfirmationRecordToInsertRow,
  mapProjectEditBriefMarkerConfirmationRowToRecord,
  mapProjectEditBriefMarkerConflictRecordToInsertRow,
  mapProjectEditBriefMarkerConflictRowToRecord,
  mapProjectEditBriefMarkerIntentRecordToInsertRow,
  mapProjectEditBriefMarkerIntentRowToRecord,
  mapProjectEditBriefMarkerMessageRecordToInsertRow,
  mapProjectEditBriefMarkerMessageRowToRecord,
  mapProjectEditBriefMarkerRecordToInsertRow,
  mapProjectEditBriefMarkerRevisionRecordToInsertRow,
  mapProjectEditBriefMarkerRevisionRowToRecord,
  mapProjectEditBriefMarkerRowToRecord,
  mapProjectEditBriefRecordToInsertRow,
  mapProjectEditBriefRowToRecord,
  mapProjectEditSessionExportSettingsRecordToInsertRow,
  mapProjectEditSessionExportSettingsRowToRecord,
} from './project-edit-brief-row-mappers'
import type {
  AddProjectEditBriefMarkerAttachmentRepositoryInput,
  AppendProjectEditBriefApplicationLogRepositoryInput,
  AppendProjectEditBriefMarkerMessageRepositoryInput,
  ConfirmProjectEditBriefMarkerRepositoryInput,
  CreateProjectEditBriefMarkerRepositoryInput,
  CreateProjectEditBriefRepositoryInput,
  ListProjectEditBriefMarkerConflictsRepositoryInput,
  ProjectEditBriefRepository,
  RecommendProjectEditSessionExportSettingsRepositoryInput,
  SaveProjectEditBriefMarkerConfirmationRepositoryInput,
  SaveProjectEditBriefMarkerConflictRepositoryInput,
  SaveProjectEditBriefMarkerIntentRepositoryInput,
  SaveProjectEditBriefMarkerRevisionRepositoryInput,
  UpdateProjectEditBriefMarkerIntentRepositoryInput,
  UpdateProjectEditBriefMarkerRepositoryInput,
  UpdateProjectEditBriefRepositoryInput,
  UpdateProjectEditSessionExportSettingsRepositoryInput,
} from './project-edit-brief-repository'

type SupabaseQuery = ReturnType<SupabaseClient['from']>

type SupabaseLike = {
  from: (table: string) => SupabaseQuery
}

export interface CreateSupabaseProjectEditBriefRepositoryInput {
  client?: SupabaseLike | null
  workspaceId?: string
  projectId?: string
  editSessionId?: string
  briefId?: string
  userId?: string
}

function nowIso(): string {
  return new Date().toISOString()
}

function uuid(): string {
  return randomUUID()
}

function result<T>(
  context: ProjectEditBriefRepositoryContext,
  input: {
    ok: boolean
    data?: T
    error?: { code: string; message: string }
    warnings?: string[]
    read?: boolean
    write?: boolean
  },
): ProjectEditBriefRepositoryResult<T> {
  return {
    ok: input.ok,
    data: input.data,
    error: input.error,
    warnings: input.warnings ?? [],
    repositoryMode: context.mode,
    mockOnly: context.mockOnly,
    supabaseReadMade: input.read ?? false,
    supabaseWriteMade: input.write ?? false,
    storageReadMade: false,
    storageWriteMade: false,
    fileBytesRead: false,
    externalUrlFetched: false,
    mediaProcessingStarted: false,
    providerCallMade: false,
    workerJobCreated: false,
    generationRequestCreated: false,
    renderJobCreated: false,
    creditReservedOrSpent: false,
  }
}

function throwIfError(error: unknown, operation: ProjectEditBriefRepositoryOperation): void {
  if (!error) return
  const err = error as { message?: string }
  throw new Error(`ProjectEditBrief Supabase ${operation} failed: ${err.message ?? 'unknown error'}`)
}

function rows(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object' && !Array.isArray(item))) : []
}

function row(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : undefined
}

function cueRoleForMarkerType(markerType: ProjectEditBriefMarkerRecord['markerType']): string {
  const mapping: Record<ProjectEditBriefMarkerRecord['markerType'], string> = {
    broll: 'b_roll',
    cut_remove: 'reference_only',
    keep_emphasize: 'reference_only',
    caption_text: 'caption_instruction',
    graphic_card_ui: 'graphic',
    music_soundtrack: 'music',
    sfx_sound_design: 'sound_effect',
    voiceover: 'reference_only',
    transition: 'reference_only',
    speed_pacing: 'reference_only',
    color_tone: 'reference_only',
    do_not_use: 'avoid',
    general_note: 'reference_only',
  }
  return mapping[markerType] ?? 'reference_only'
}

function cuePriorityForMarkerPriority(priority: ProjectEditBriefMarkerRecord['priority']): string {
  if (priority === 'should_follow') return 'prefer'
  return priority
}

function markerPriorityForCuePriority(priority: string | undefined): ProjectEditBriefMarkerRecord['priority'] {
  if (priority === 'prefer') return 'should_follow'
  if (priority === 'must_follow' || priority === 'optional' || priority === 'avoid') return priority
  return 'should_follow'
}

function markerTypeForCueRole(role: string | undefined): ProjectEditBriefMarkerRecord['markerType'] {
  const mapping: Record<string, ProjectEditBriefMarkerRecord['markerType']> = {
    b_roll: 'broll',
    overlay: 'graphic_card_ui',
    picture_in_picture: 'broll',
    split_screen: 'broll',
    insert_clip: 'broll',
    text_overlay: 'caption_text',
    caption_instruction: 'caption_text',
    graphic: 'graphic_card_ui',
    sound_effect: 'sfx_sound_design',
    music: 'music_soundtrack',
    reference_only: 'general_note',
    avoid: 'do_not_use',
  }
  return mapping[role ?? ''] ?? 'general_note'
}

function dbBriefToRow(row: Record<string, unknown>) {
  return {
    ...row,
    edit_session_id: row.edit_session_id ?? (row.metadata as Record<string, unknown> | undefined)?.editSessionId ?? '',
    availability: row.availability ?? 'optional_opened',
    title: row.title ?? row.goal ?? 'Edit Brief',
    summary: row.summary ?? row.special_instructions ?? null,
    marker_count: row.marker_count ?? 0,
    confirmed_marker_count: row.confirmed_marker_count ?? 0,
    conflict_count: row.conflict_count ?? 0,
    needs_asset_count: row.needs_asset_count ?? 0,
    needs_clarification_count: row.needs_clarification_count ?? 0,
    export_settings_id: row.export_settings_id ?? null,
    last_opened_at: row.last_opened_at ?? null,
    mock_only: row.mock_only ?? false,
  }
}

function recordBriefToDb(record: ProjectEditBriefRecord): Record<string, unknown> {
  const row = mapProjectEditBriefRecordToInsertRow(record)
  return {
    id: row.id,
    project_id: row.project_id,
    edit_session_id: row.edit_session_id,
    status: row.status,
    availability: row.availability,
    title: row.title,
    goal: row.title,
    summary: row.summary,
    special_instructions: row.summary,
    marker_count: row.marker_count,
    confirmed_marker_count: row.confirmed_marker_count,
    conflict_count: row.conflict_count,
    needs_asset_count: row.needs_asset_count,
    needs_clarification_count: row.needs_clarification_count,
    export_settings_id: row.export_settings_id,
    last_opened_at: row.last_opened_at,
    mock_only: row.mock_only,
    created_at: row.created_at,
    updated_at: row.updated_at,
    metadata: row.metadata,
  }
}

function dbCueToMarkerRow(row: Record<string, unknown>) {
  return {
    id: row.id,
    project_id: row.project_id,
    edit_session_id: row.edit_session_id ?? (row.metadata as Record<string, unknown> | undefined)?.editSessionId ?? '',
    brief_id: row.edit_brief_id ?? row.brief_id ?? '',
    marker_type: row.marker_type ?? markerTypeForCueRole(typeof row.role === 'string' ? row.role : undefined),
    status: row.marker_status ?? (row.status === 'deleted' ? 'archived' : row.status === 'conflict' ? 'conflict' : 'draft'),
    priority: row.marker_priority ?? markerPriorityForCuePriority(typeof row.priority === 'string' ? row.priority : undefined),
    time_mode: row.time_mode ?? 'point',
    start_time_seconds: Number(row.start_time_seconds ?? 0),
    end_time_seconds: row.end_time_seconds === null || row.end_time_seconds === undefined ? null : Number(row.end_time_seconds),
    title: row.title,
    user_note: row.user_note ?? row.instructions ?? '',
    ai_mode: row.ai_mode ?? 'confirm_only',
    intent_id: row.intent_id ?? null,
    attachment_count: row.attachment_count ?? 0,
    message_count: row.message_count ?? 0,
    qa_status: row.qa_status ?? 'not_checked',
    created_at: row.created_at,
    updated_at: row.updated_at,
    mock_only: row.mock_only ?? false,
    metadata: row.metadata ?? null,
  }
}

function recordMarkerToDb(record: ProjectEditBriefMarkerRecord): Record<string, unknown> {
  const row = mapProjectEditBriefMarkerRecordToInsertRow(record)
  return {
    id: row.id,
    project_id: row.project_id,
    edit_session_id: row.edit_session_id,
    edit_brief_id: row.brief_id,
    title: row.title,
    status: row.status === 'archived' ? 'deleted' : row.status === 'conflict' ? 'conflict' : 'draft',
    role: cueRoleForMarkerType(record.markerType),
    priority: cuePriorityForMarkerPriority(record.priority),
    timing_flexibility: record.timeMode === 'range' ? 'exact' : 'ai_can_adjust',
    instructions: row.user_note,
    marker_type: row.marker_type,
    marker_status: row.status,
    marker_priority: row.priority,
    time_mode: row.time_mode,
    start_time_seconds: row.start_time_seconds,
    end_time_seconds: row.end_time_seconds,
    user_note: row.user_note,
    ai_mode: row.ai_mode,
    intent_id: row.intent_id,
    attachment_count: row.attachment_count,
    message_count: row.message_count,
    qa_status: row.qa_status,
    created_at: row.created_at,
    updated_at: row.updated_at,
    mock_only: row.mock_only,
    metadata: row.metadata,
  }
}

function dbAttachmentToRow(row: Record<string, unknown>) {
  return {
    id: row.id,
    project_id: row.project_id,
    edit_session_id: row.edit_session_id ?? '',
    brief_id: row.brief_id ?? row.edit_brief_id ?? '',
    marker_id: row.marker_id ?? row.edit_cue_id,
    attachment_kind: row.attachment_kind ?? 'reference_label',
    status: row.attachment_status ?? 'metadata_only',
    label: row.label ?? 'Attachment',
    media_asset_id: row.media_asset_id ?? null,
    reference_url: row.reference_url ?? null,
    reference_label: row.reference_label ?? null,
    notes: row.notes ?? [],
    preview_label: row.preview_label ?? null,
    duration_seconds: row.duration_seconds === null || row.duration_seconds === undefined ? null : Number(row.duration_seconds),
    mock_only: row.mock_only ?? false,
    metadata: row.metadata ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

function recordAttachmentToDb(record: ProjectEditBriefMarkerAttachmentRecord): Record<string, unknown> {
  const row = mapProjectEditBriefMarkerAttachmentRecordToInsertRow(record)
  return {
    id: row.id,
    project_id: row.project_id,
    edit_session_id: row.edit_session_id,
    brief_id: row.brief_id,
    marker_id: row.marker_id,
    edit_cue_id: row.marker_id,
    media_asset_id: row.media_asset_id,
    role: row.attachment_kind === 'music_track' || row.attachment_kind === 'soundtrack'
      ? 'music'
      : row.attachment_kind === 'sfx'
        ? 'sfx'
        : row.attachment_kind === 'broll_video'
          ? 'b_roll'
          : 'reference_only',
    label: row.label,
    required: row.status === 'missing_required_asset',
    attachment_kind: row.attachment_kind,
    attachment_status: row.status,
    reference_url: row.reference_url,
    reference_label: row.reference_label,
    notes: row.notes,
    preview_label: row.preview_label,
    duration_seconds: row.duration_seconds,
    mock_only: row.mock_only,
    metadata: row.metadata,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

function dbConflictToRow(row: Record<string, unknown>) {
  return {
    id: row.id,
    project_id: row.project_id,
    edit_session_id: row.edit_session_id ?? '',
    brief_id: row.brief_id ?? row.edit_brief_id ?? '',
    marker_id: row.marker_id ?? row.edit_cue_id,
    related_marker_id: row.related_marker_id ?? null,
    qa_status: row.qa_status ?? 'conflict',
    title: row.title ?? 'Marker conflict',
    summary: row.summary ?? row.description ?? 'Marker conflict requires review.',
    recommended_resolution: row.recommended_resolution ?? row.resolution_hint ?? 'Review marker conflict.',
    blocks_plan: row.blocks_plan ?? false,
    requires_user_review: row.requires_user_review ?? true,
    created_at: row.created_at,
    mock_only: row.mock_only ?? false,
    metadata: row.metadata ?? null,
  }
}

export class SupabaseProjectEditBriefRepository implements ProjectEditBriefRepository {
  public readonly context: ProjectEditBriefRepositoryContext
  private readonly client?: SupabaseLike | null

  constructor(input: CreateSupabaseProjectEditBriefRepositoryInput = {}) {
    this.client = input.client
    const enabled = Boolean(input.client)
    this.context = {
      mode: enabled ? 'supabase_server' : 'supabase_disabled',
      status: enabled ? 'ready_supabase' : 'blocked_missing_service_role',
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      editSessionId: input.editSessionId,
      briefId: input.briefId,
      userId: input.userId,
      mockOnly: !enabled,
      writeSafety: enabled ? 'supabase_write_enabled' : 'supabase_write_disabled',
      notes: enabled
        ? ['ProjectEditBrief Supabase repository maps ProjectEditBrief onto edit_briefs/edit_cues server-side.']
        : ['ProjectEditBrief Supabase repository requires an injected server-side service-role client.'],
    }
  }

  async getEditBrief(briefId: string): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefRecord | undefined>> {
    if (!this.client) return this.blocked('get_brief')
    const { data, error } = await this.client.from('edit_briefs').select('*').eq('id', briefId).maybeSingle()
    throwIfError(error, 'get_brief')
    return this.success(row(data) ? mapProjectEditBriefRowToRecord(dbBriefToRow(row(data) as Record<string, unknown>) as never) : undefined, { read: true })
  }

  async getEditBriefForSession(editSessionId: string): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefRecord | undefined>> {
    if (!this.client) return this.blocked('get_brief_for_session')
    const { data, error } = await this.client.from('edit_briefs')
      .select('*')
      .eq('edit_session_id', editSessionId)
      .neq('status', 'archived')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    throwIfError(error, 'get_brief_for_session')
    return this.success(row(data) ? mapProjectEditBriefRowToRecord(dbBriefToRow(row(data) as Record<string, unknown>) as never) : undefined, { read: true })
  }

  async createEditBrief(input: CreateProjectEditBriefRepositoryInput): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefRecord>> {
    if (!this.client) return this.blocked('create_brief')
    const timestamp = nowIso()
    const record: ProjectEditBriefRecord = {
      id: input.id ?? uuid(),
      projectId: input.projectId,
      editSessionId: input.editSessionId,
      status: 'active',
      availability: 'optional_opened',
      title: input.title,
      summary: input.summary,
      markerCount: 0,
      confirmedMarkerCount: 0,
      conflictCount: 0,
      needsAssetCount: 0,
      needsClarificationCount: 0,
      exportSettingsId: input.exportSettingsId,
      createdAt: timestamp,
      updatedAt: timestamp,
      lastOpenedAt: timestamp,
      mockOnly: false,
      metadata: input.metadata,
    }
    const { data, error } = await this.client.from('edit_briefs').insert(recordBriefToDb(record)).select('*').single()
    throwIfError(error, 'create_brief')
    return this.success(mapProjectEditBriefRowToRecord(dbBriefToRow(row(data) as Record<string, unknown>) as never), { write: true })
  }

  async updateEditBrief(input: UpdateProjectEditBriefRepositoryInput): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefRecord>> {
    if (!this.client) return this.blocked('update_brief')
    const patch = briefPatchToDb(input.patch)
    const { data, error } = await this.client.from('edit_briefs').update({ ...patch, updated_at: nowIso() }).eq('id', input.briefId).select('*').single()
    throwIfError(error, 'update_brief')
    return this.success(mapProjectEditBriefRowToRecord(dbBriefToRow(row(data) as Record<string, unknown>) as never), { write: true })
  }

  async archiveEditBrief(briefId: string): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefRecord>> {
    if (!this.client) return this.blocked('archive_brief')
    const { data, error } = await this.client.from('edit_briefs').update({ status: 'archived', updated_at: nowIso() }).eq('id', briefId).select('*').single()
    throwIfError(error, 'archive_brief')
    return this.success(mapProjectEditBriefRowToRecord(dbBriefToRow(row(data) as Record<string, unknown>) as never), { write: true })
  }

  async listMarkers(briefId: string): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefMarkerRecord[]>> {
    if (!this.client) return this.blocked('list_markers')
    const { data, error } = await this.client.from('edit_cues').select('*').eq('edit_brief_id', briefId).neq('marker_status', 'archived').order('start_time_seconds', { ascending: true })
    throwIfError(error, 'list_markers')
    return this.success(rows(data).map((item) => mapProjectEditBriefMarkerRowToRecord(dbCueToMarkerRow(item) as never)), { read: true })
  }

  async getMarker(markerId: string): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefMarkerRecord | undefined>> {
    if (!this.client) return this.blocked('get_marker')
    const { data, error } = await this.client.from('edit_cues').select('*').eq('id', markerId).maybeSingle()
    throwIfError(error, 'get_marker')
    return this.success(row(data) ? mapProjectEditBriefMarkerRowToRecord(dbCueToMarkerRow(row(data) as Record<string, unknown>) as never) : undefined, { read: true })
  }

  async createMarker(input: CreateProjectEditBriefMarkerRepositoryInput): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefMarkerRecord>> {
    if (!this.client) return this.blocked('create_marker')
    const timestamp = nowIso()
    const record: ProjectEditBriefMarkerRecord = {
      ...input.marker,
      id: input.id ?? uuid(),
      projectId: input.projectId,
      editSessionId: input.editSessionId,
      briefId: input.briefId,
      attachmentCount: 0,
      messageCount: 0,
      createdAt: input.marker.createdAt ?? timestamp,
      updatedAt: input.marker.updatedAt ?? timestamp,
      mockOnly: false,
    }
    const { data, error } = await this.client.from('edit_cues').insert(recordMarkerToDb(record)).select('*').single()
    throwIfError(error, 'create_marker')
    await this.recomputeBriefCounts(input.briefId)
    return this.success(mapProjectEditBriefMarkerRowToRecord(dbCueToMarkerRow(row(data) as Record<string, unknown>) as never), { write: true })
  }

  async updateMarker(input: UpdateProjectEditBriefMarkerRepositoryInput): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefMarkerRecord>> {
    if (!this.client) return this.blocked('update_marker')
    const patch = markerPatchToDb(input.patch)
    const { data, error } = await this.client.from('edit_cues').update({ ...patch, updated_at: nowIso() }).eq('id', input.markerId).select('*').single()
    throwIfError(error, 'update_marker')
    const marker = mapProjectEditBriefMarkerRowToRecord(dbCueToMarkerRow(row(data) as Record<string, unknown>) as never)
    await this.recomputeBriefCounts(marker.briefId)
    return this.success(marker, { write: true })
  }

  async deleteMarker(markerId: string): Promise<ProjectEditBriefRepositoryResult<{ markerId: string; deleted: true }>> {
    if (!this.client) return this.blocked('delete_marker')
    const marker = (await this.getMarker(markerId)).data
    const { error } = await this.client.from('edit_cues').delete().eq('id', markerId)
    throwIfError(error, 'delete_marker')
    if (marker) await this.recomputeBriefCounts(marker.briefId)
    return this.success({ markerId, deleted: true }, { write: true })
  }

  async confirmMarker(input: ConfirmProjectEditBriefMarkerRepositoryInput): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefMarkerRecord>> {
    return this.updateMarker({
      markerId: input.markerId,
      patch: {
        status: 'confirmed',
        intentId: input.intentId,
        qaStatus: 'passed',
        metadata: { confirmedSummary: input.summary, confirmedAt: nowIso() },
      },
    })
  }

  async archiveMarker(markerId: string): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefMarkerRecord>> {
    return this.updateMarker({ markerId, patch: { status: 'archived' } })
  }

  async listMarkerAttachments(markerId: string): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefMarkerAttachmentRecord[]>> {
    return this.listChild('edit_cue_assets', 'marker_id', markerId, (item) => mapProjectEditBriefMarkerAttachmentRowToRecord(dbAttachmentToRow(item) as never), 'created_at')
  }

  async addMarkerAttachment(input: AddProjectEditBriefMarkerAttachmentRepositoryInput): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefMarkerAttachmentRecord>> {
    if (!this.client) return this.blocked('add_marker_attachment')
    const timestamp = nowIso()
    const record: ProjectEditBriefMarkerAttachmentRecord = {
      ...input.attachment,
      id: input.id ?? uuid(),
      projectId: input.projectId,
      editSessionId: input.editSessionId,
      briefId: input.briefId,
      markerId: input.markerId,
      createdAt: input.attachment.createdAt ?? timestamp,
      updatedAt: input.attachment.updatedAt ?? timestamp,
      mockOnly: false,
    }
    const { data, error } = await this.client.from('edit_cue_assets').insert(recordAttachmentToDb(record)).select('*').single()
    throwIfError(error, 'add_marker_attachment')
    await this.refreshMarkerCounts(input.markerId)
    return this.success(mapProjectEditBriefMarkerAttachmentRowToRecord(dbAttachmentToRow(row(data) as Record<string, unknown>) as never), { write: true })
  }

  async removeMarkerAttachment(attachmentId: string): Promise<ProjectEditBriefRepositoryResult<{ attachmentId: string; removed: true }>> {
    if (!this.client) return this.blocked('remove_marker_attachment')
    const { data } = await this.client.from('edit_cue_assets').select('*').eq('id', attachmentId).maybeSingle()
    const { error } = await this.client.from('edit_cue_assets').delete().eq('id', attachmentId)
    throwIfError(error, 'remove_marker_attachment')
    const deleted = row(data)
    if (deleted?.marker_id ?? deleted?.edit_cue_id) await this.refreshMarkerCounts(String(deleted.marker_id ?? deleted.edit_cue_id))
    return this.success({ attachmentId, removed: true }, { write: true })
  }

  async listMarkerMessages(markerId: string): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefMarkerMessageRecord[]>> {
    return this.listChild('edit_cue_messages', 'marker_id', markerId, (item) => mapProjectEditBriefMarkerMessageRowToRecord(item as never), 'created_at')
  }

  async appendMarkerMessage(input: AppendProjectEditBriefMarkerMessageRepositoryInput): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefMarkerMessageRecord>> {
    if (!this.client) return this.blocked('append_marker_message')
    const record: ProjectEditBriefMarkerMessageRecord = {
      ...input.message,
      id: input.id ?? uuid(),
      projectId: input.projectId,
      editSessionId: input.editSessionId,
      briefId: input.briefId,
      markerId: input.markerId,
      createdAt: input.message.createdAt ?? nowIso(),
      mockOnly: false,
    }
    const { data, error } = await this.client.from('edit_cue_messages').insert(mapProjectEditBriefMarkerMessageRecordToInsertRow(record)).select('*').single()
    throwIfError(error, 'append_marker_message')
    await this.refreshMarkerCounts(input.markerId)
    return this.success(mapProjectEditBriefMarkerMessageRowToRecord(row(data) as never), { write: true })
  }

  async getMarkerIntent(markerId: string): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefMarkerIntentRecord | undefined>> {
    if (!this.client) return this.blocked('get_marker_intent')
    const { data, error } = await this.client.from('edit_cue_intents').select('*').eq('marker_id', markerId).order('updated_at', { ascending: false }).limit(1).maybeSingle()
    throwIfError(error, 'get_marker_intent')
    return this.success(row(data) ? mapProjectEditBriefMarkerIntentRowToRecord(row(data) as never) : undefined, { read: true })
  }

  async saveMarkerIntent(input: SaveProjectEditBriefMarkerIntentRepositoryInput): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefMarkerIntentRecord>> {
    if (!this.client) return this.blocked('save_marker_intent')
    const timestamp = nowIso()
    const record: ProjectEditBriefMarkerIntentRecord = {
      ...input.intent,
      id: input.id ?? uuid(),
      projectId: input.projectId,
      editSessionId: input.editSessionId,
      briefId: input.briefId,
      markerId: input.markerId,
      createdAt: input.intent.createdAt ?? timestamp,
      updatedAt: input.intent.updatedAt ?? timestamp,
      mockOnly: false,
    }
    const { data, error } = await this.client.from('edit_cue_intents').upsert(mapProjectEditBriefMarkerIntentRecordToInsertRow(record)).select('*').single()
    throwIfError(error, 'save_marker_intent')
    const saved = row(data)
    await this.updateMarker({ markerId: input.markerId, patch: { intentId: String(saved?.id ?? '') } })
    return this.success(mapProjectEditBriefMarkerIntentRowToRecord(saved as never), { write: true })
  }

  async updateMarkerIntent(input: UpdateProjectEditBriefMarkerIntentRepositoryInput): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefMarkerIntentRecord>> {
    if (!this.client) return this.blocked('update_marker_intent')
    const patch = intentPatchToDb(input.patch)
    const { data, error } = await this.client.from('edit_cue_intents').update({ ...patch, updated_at: nowIso() }).eq('id', input.intentId).select('*').single()
    throwIfError(error, 'update_marker_intent')
    return this.success(mapProjectEditBriefMarkerIntentRowToRecord(row(data) as never), { write: true })
  }

  async listMarkerConfirmations(markerId: string): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefMarkerConfirmationRecord[]>> {
    return this.listChild('edit_cue_confirmations', 'marker_id', markerId, (item) => mapProjectEditBriefMarkerConfirmationRowToRecord(item as never), 'created_at')
  }

  async saveMarkerConfirmation(input: SaveProjectEditBriefMarkerConfirmationRepositoryInput): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefMarkerConfirmationRecord>> {
    if (!this.client) return this.blocked('save_marker_confirmation')
    const record: ProjectEditBriefMarkerConfirmationRecord = {
      id: input.id ?? uuid(),
      projectId: input.projectId,
      editSessionId: input.editSessionId,
      briefId: input.briefId,
      markerId: input.markerId,
      intentId: input.intentId,
      summary: input.summary,
      confirmedByUser: input.confirmedByUser ?? true,
      aiMode: input.aiMode ?? 'confirm_only',
      createdAt: input.createdAt ?? nowIso(),
      mockOnly: false,
      metadata: input.metadata,
    }
    const { data, error } = await this.client.from('edit_cue_confirmations').insert(mapProjectEditBriefMarkerConfirmationRecordToInsertRow(record)).select('*').single()
    throwIfError(error, 'save_marker_confirmation')
    return this.success(mapProjectEditBriefMarkerConfirmationRowToRecord(row(data) as never), { write: true })
  }

  async listMarkerConflicts(input: ListProjectEditBriefMarkerConflictsRepositoryInput): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefMarkerConflictRecord[]>> {
    if (!this.client) return this.blocked('list_marker_conflicts')
    let query = this.client.from('edit_cue_conflicts').select('*')
    if (input.briefId) query = query.eq('brief_id', input.briefId)
    if (input.markerId) query = query.eq('marker_id', input.markerId)
    const { data, error } = await query.order('created_at', { ascending: true })
    throwIfError(error, 'list_marker_conflicts')
    return this.success(rows(data).map((item) => mapProjectEditBriefMarkerConflictRowToRecord(dbConflictToRow(item) as never)), { read: true })
  }

  async saveMarkerConflict(input: SaveProjectEditBriefMarkerConflictRepositoryInput): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefMarkerConflictRecord>> {
    if (!this.client) return this.blocked('save_marker_conflict')
    const record: ProjectEditBriefMarkerConflictRecord = {
      ...input.conflict,
      id: input.id ?? uuid(),
      projectId: input.projectId,
      editSessionId: input.editSessionId,
      briefId: input.briefId,
      markerId: input.markerId,
      createdAt: input.conflict.createdAt ?? nowIso(),
      mockOnly: false,
    }
    const conflictRow = mapProjectEditBriefMarkerConflictRecordToInsertRow(record)
    const { data, error } = await this.client.from('edit_cue_conflicts').upsert({
      ...conflictRow,
      edit_brief_id: conflictRow.brief_id,
      edit_cue_id: conflictRow.marker_id,
      description: conflictRow.summary,
      resolution_hint: conflictRow.recommended_resolution,
    }).select('*').single()
    throwIfError(error, 'save_marker_conflict')
    await this.recomputeBriefCounts(input.briefId)
    return this.success(mapProjectEditBriefMarkerConflictRowToRecord(dbConflictToRow(row(data) as Record<string, unknown>) as never), { write: true })
  }

  async listMarkerRevisions(markerId: string): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefMarkerRevisionRecord[]>> {
    return this.listChild('edit_cue_revisions', 'marker_id', markerId, (item) => mapProjectEditBriefMarkerRevisionRowToRecord(item as never), 'created_at')
  }

  async saveMarkerRevision(input: SaveProjectEditBriefMarkerRevisionRepositoryInput): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefMarkerRevisionRecord>> {
    if (!this.client) return this.blocked('save_marker_revision')
    const record: ProjectEditBriefMarkerRevisionRecord = {
      ...input.revision,
      id: input.id ?? uuid(),
      projectId: input.projectId,
      editSessionId: input.editSessionId,
      briefId: input.briefId,
      markerId: input.markerId,
      createdAt: input.revision.createdAt ?? nowIso(),
      mockOnly: false,
    }
    const { data, error } = await this.client.from('edit_cue_revisions').insert(mapProjectEditBriefMarkerRevisionRecordToInsertRow(record)).select('*').single()
    throwIfError(error, 'save_marker_revision')
    return this.success(mapProjectEditBriefMarkerRevisionRowToRecord(row(data) as never), { write: true })
  }

  async listApplicationLogs(briefId: string): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefApplicationLogRecord[]>> {
    return this.listChild('edit_brief_application_logs', 'brief_id', briefId, (item) => mapProjectEditBriefApplicationLogRowToRecord(item as never), 'created_at')
  }

  async appendApplicationLog(input: AppendProjectEditBriefApplicationLogRepositoryInput): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefApplicationLogRecord>> {
    if (!this.client) return this.blocked('append_application_log')
    const record: ProjectEditBriefApplicationLogRecord = {
      id: input.id ?? uuid(),
      projectId: input.projectId,
      editSessionId: input.editSessionId,
      briefId: input.briefId,
      markerId: input.markerId,
      summary: input.summary,
      appliedToPlan: input.appliedToPlan ?? false,
      createdAt: input.createdAt ?? nowIso(),
      mockOnly: false,
      metadata: input.metadata,
    }
    const { data, error } = await this.client.from('edit_brief_application_logs').insert(mapProjectEditBriefApplicationLogRecordToInsertRow(record)).select('*').single()
    throwIfError(error, 'append_application_log')
    return this.success(mapProjectEditBriefApplicationLogRowToRecord(row(data) as never), { write: true })
  }

  async getExportSettings(editSessionId: string): Promise<ProjectEditBriefRepositoryResult<ProjectEditSessionExportSettingsRecord | undefined>> {
    if (!this.client) return this.blocked('get_export_settings')
    const { data, error } = await this.client.from('edit_session_export_settings').select('*').eq('edit_session_id', editSessionId).order('updated_at', { ascending: false }).limit(1).maybeSingle()
    throwIfError(error, 'get_export_settings')
    return this.success(row(data) ? mapProjectEditSessionExportSettingsRowToRecord(row(data) as never) : undefined, { read: true })
  }

  async recommendExportSettings(input: RecommendProjectEditSessionExportSettingsRepositoryInput): Promise<ProjectEditBriefRepositoryResult<ProjectEditSessionExportSettingsRecord>> {
    const existing = (await this.getExportSettings(input.editSessionId)).data
    if (existing) return this.success(existing, { read: true })
    const settings = recommendProjectEditBriefExportSettings({
      projectId: input.projectId,
      editSessionId: input.editSessionId,
      platformTarget: input.platformTarget,
      aspectRatio: input.aspectRatio,
      customAspectRatio: input.customAspectRatio,
      presetId: input.presetId,
      id: uuid(),
      createdAt: nowIso(),
    }).exportSettings
    return this.upsertExportSettings(settings, 'recommend_export_settings')
  }

  async updateExportSettings(input: UpdateProjectEditSessionExportSettingsRepositoryInput): Promise<ProjectEditBriefRepositoryResult<ProjectEditSessionExportSettingsRecord>> {
    const existing = input.exportSettingsId
      ? await this.getExportSettingsById(input.exportSettingsId)
      : (await this.getExportSettings(input.editSessionId)).data
    if (!existing) return this.notFound('ProjectEditSession export settings were not found.')
    const settings: ProjectEditSessionExportSettingsRecord = {
      ...existing,
      ...input.patch,
      id: input.exportSettingsId ?? existing.id,
      editSessionId: input.editSessionId,
      source: input.patch.source ?? 'user_override_mock',
      updatedAt: nowIso(),
      mockOnly: false,
    }
    return this.upsertExportSettings(settings, 'update_export_settings')
  }

  async createTimelineMarkerModels(briefId: string): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefTimelineMarkerModel[]>> {
    const markers = (await this.listMarkers(briefId)).data ?? []
    return this.success(createProjectEditBriefTimelineMarkerModels(markers), { read: true })
  }

  async createMarkerDrawerModel(markerId: string): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefMarkerDrawerModel>> {
    const marker = (await this.getMarker(markerId)).data
    if (!marker) return this.notFound('ProjectEditBrief marker was not found.')
    const [attachments, messages, intent, confirmations, conflicts] = await Promise.all([
      this.listMarkerAttachments(markerId),
      this.listMarkerMessages(markerId),
      this.getMarkerIntent(markerId),
      this.listMarkerConfirmations(markerId),
      this.listMarkerConflicts({ markerId }),
    ])
    return this.success({
      marker,
      intent: intent.data,
      attachments: attachments.data ?? [],
      messages: messages.data ?? [],
      confirmations: confirmations.data ?? [],
      conflicts: conflicts.data ?? [],
      statusLabel: marker.status.replace(/_/g, ' '),
      actionLabels: [marker.markerType.replace(/_/g, ' '), marker.priority.replace(/_/g, ' '), marker.aiMode.replace(/_/g, ' ')],
      mockOnly: false,
      warnings: (conflicts.data ?? []).map((conflict) => conflict.summary),
    }, { read: true })
  }

  async createBriefBundle(briefId: string): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefBundleRecord>> {
    const brief = (await this.getEditBrief(briefId)).data
    if (!brief) return this.notFound('ProjectEditBrief was not found.')
    const [markers, exportSettings, logs] = await Promise.all([
      this.listMarkers(briefId),
      this.getExportSettings(brief.editSessionId),
      this.listApplicationLogs(briefId),
    ])
    const markerRecords = markers.data ?? []
    const [attachments, messages, intents, confirmations, conflicts, revisions] = await Promise.all([
      Promise.all(markerRecords.map((marker) => this.listMarkerAttachments(marker.id))),
      Promise.all(markerRecords.map((marker) => this.listMarkerMessages(marker.id))),
      Promise.all(markerRecords.map((marker) => this.getMarkerIntent(marker.id))),
      Promise.all(markerRecords.map((marker) => this.listMarkerConfirmations(marker.id))),
      this.listMarkerConflicts({ briefId }),
      Promise.all(markerRecords.map((marker) => this.listMarkerRevisions(marker.id))),
    ])
    const bundle: ProjectEditBriefBundleRecord = {
      brief,
      markers: markerRecords,
      attachments: attachments.flatMap((item) => item.data ?? []),
      messages: messages.flatMap((item) => item.data ?? []),
      intents: intents.flatMap((item) => item.data ? [item.data] : []),
      confirmations: confirmations.flatMap((item) => item.data ?? []),
      conflicts: conflicts.data ?? [],
      revisions: revisions.flatMap((item) => item.data ?? []),
      applicationLogs: logs.data ?? [],
      exportSettings: exportSettings.data,
      timelineMarkers: createProjectEditBriefTimelineMarkerModels(markerRecords),
      mockOnly: false,
      warnings: (conflicts.data ?? []).map((conflict) => conflict.summary),
    }
    return this.success(bundle, { read: true })
  }

  async createBriefSummary(briefId: string): Promise<ProjectEditBriefRepositoryResult<string>> {
    const brief = (await this.getEditBrief(briefId)).data
    if (!brief) return this.notFound('ProjectEditBrief was not found.')
    return this.success(createProjectEditBriefReadableSummary(brief), { read: true })
  }

  private async listChild<T>(table: string, column: string, value: string, mapper: (row: Record<string, unknown>) => T, orderColumn: string): Promise<ProjectEditBriefRepositoryResult<T[]>> {
    if (!this.client) return this.blocked('list_marker_messages')
    const { data, error } = await this.client.from(table).select('*').eq(column, value).order(orderColumn, { ascending: true })
    throwIfError(error, 'list_marker_messages')
    return this.success(rows(data).map(mapper), { read: true })
  }

  private async getExportSettingsById(exportSettingsId: string): Promise<ProjectEditSessionExportSettingsRecord | undefined> {
    if (!this.client) return undefined
    const { data, error } = await this.client.from('edit_session_export_settings').select('*').eq('id', exportSettingsId).maybeSingle()
    throwIfError(error, 'get_export_settings')
    return row(data) ? mapProjectEditSessionExportSettingsRowToRecord(row(data) as never) : undefined
  }

  private async upsertExportSettings(settings: ProjectEditSessionExportSettingsRecord, operation: ProjectEditBriefRepositoryOperation): Promise<ProjectEditBriefRepositoryResult<ProjectEditSessionExportSettingsRecord>> {
    if (!this.client) return this.blocked(operation)
    const { data, error } = await this.client.from('edit_session_export_settings').upsert(mapProjectEditSessionExportSettingsRecordToInsertRow(settings)).select('*').single()
    throwIfError(error, operation)
    return this.success(mapProjectEditSessionExportSettingsRowToRecord(row(data) as never), { write: true })
  }

  private async refreshMarkerCounts(markerId: string): Promise<void> {
    if (!this.client) return
    const marker = (await this.getMarker(markerId)).data
    if (!marker) return
    const [attachments, messages] = await Promise.all([
      this.listMarkerAttachments(markerId),
      this.listMarkerMessages(markerId),
    ])
    await this.client.from('edit_cues').update({
      attachment_count: attachments.data?.length ?? 0,
      message_count: messages.data?.length ?? 0,
      updated_at: nowIso(),
    }).eq('id', markerId)
  }

  private async recomputeBriefCounts(briefId: string): Promise<void> {
    if (!this.client) return
    const markers = (await this.listMarkers(briefId)).data ?? []
    const conflicts = (await this.listMarkerConflicts({ briefId })).data ?? []
    await this.client.from('edit_briefs').update({
      marker_count: markers.length,
      confirmed_marker_count: markers.filter((marker) => marker.status === 'confirmed' || marker.status === 'ready_for_plan' || marker.status === 'applied_to_plan').length,
      conflict_count: conflicts.length + markers.filter((marker) => marker.status === 'conflict' || marker.qaStatus === 'conflict').length,
      needs_asset_count: markers.filter((marker) => marker.status === 'needs_asset' || marker.qaStatus === 'needs_asset').length,
      needs_clarification_count: markers.filter((marker) => marker.status === 'needs_clarification' || marker.qaStatus === 'needs_clarification').length,
      availability: availabilityForMarkers(markers, conflicts),
      updated_at: nowIso(),
    }).eq('id', briefId)
  }

  private success<T>(data: T, flags: { read?: boolean; write?: boolean } = {}): ProjectEditBriefRepositoryResult<T> {
    return result(this.context, {
      ok: true,
      data,
      warnings: ['ProjectEditBrief Supabase repository operation completed server-side.'],
      ...flags,
    })
  }

  private blocked<T>(operation: ProjectEditBriefRepositoryOperation): ProjectEditBriefRepositoryResult<T> {
    return result(this.context, {
      ok: false,
      error: {
        code: 'PROJECT_EDIT_BRIEF_REPOSITORY_DISABLED',
        message: `ProjectEditBrief Supabase repository blocks ${operation}; a server-side service-role client is required.`,
      },
      warnings: this.context.notes,
    })
  }

  private notFound<T>(message: string): ProjectEditBriefRepositoryResult<T> {
    return result(this.context, {
      ok: false,
      error: { code: 'PROJECT_EDIT_BRIEF_NOT_FOUND', message },
      warnings: ['ProjectEditBrief Supabase repository did not find a matching row.'],
      read: true,
    })
  }
}

function availabilityForMarkers(markers: ProjectEditBriefMarkerRecord[], conflicts: ProjectEditBriefMarkerConflictRecord[]): ProjectEditBriefRecord['availability'] {
  if (conflicts.length > 0 || markers.some((marker) => marker.status === 'conflict')) return 'has_conflicts'
  if (markers.some((marker) => marker.status === 'needs_asset' || marker.status === 'needs_clarification')) return 'has_markers'
  if (markers.some((marker) => marker.status === 'ready_for_plan')) return 'ready_for_plan'
  if (markers.some((marker) => marker.status === 'confirmed')) return 'has_confirmed_markers'
  return markers.length ? 'has_markers' : 'optional_opened'
}

function briefPatchToDb(patch: UpdateProjectEditBriefRepositoryInput['patch']): Record<string, unknown> {
  const mapping: Record<string, string> = {
    status: 'status',
    availability: 'availability',
    title: 'title',
    summary: 'summary',
    exportSettingsId: 'export_settings_id',
    lastOpenedAt: 'last_opened_at',
    metadata: 'metadata',
  }
  const result = Object.fromEntries(Object.entries(patch).map(([key, value]) => [mapping[key] ?? key, value]))
  if (patch.title) result.goal = patch.title
  if (patch.summary) result.special_instructions = patch.summary
  return result
}

function markerPatchToDb(patch: UpdateProjectEditBriefMarkerRepositoryInput['patch']): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  if (patch.markerType) {
    result.marker_type = patch.markerType
    result.role = cueRoleForMarkerType(patch.markerType)
  }
  if (patch.status) {
    result.marker_status = patch.status
    result.status = patch.status === 'archived' ? 'deleted' : patch.status === 'conflict' ? 'conflict' : 'draft'
  }
  if (patch.priority) {
    result.marker_priority = patch.priority
    result.priority = cuePriorityForMarkerPriority(patch.priority)
  }
  if (patch.timeMode) {
    result.time_mode = patch.timeMode
    result.timing_flexibility = patch.timeMode === 'range' ? 'exact' : 'ai_can_adjust'
  }
  if (patch.startTimeSeconds !== undefined) result.start_time_seconds = patch.startTimeSeconds
  if (patch.endTimeSeconds !== undefined) result.end_time_seconds = patch.endTimeSeconds
  if (patch.title !== undefined) result.title = patch.title
  if (patch.userNote !== undefined) {
    result.user_note = patch.userNote
    result.instructions = patch.userNote
  }
  if (patch.aiMode !== undefined) result.ai_mode = patch.aiMode
  if (patch.intentId !== undefined) result.intent_id = patch.intentId
  if (patch.attachmentCount !== undefined) result.attachment_count = patch.attachmentCount
  if (patch.messageCount !== undefined) result.message_count = patch.messageCount
  if (patch.qaStatus !== undefined) result.qa_status = patch.qaStatus
  if (patch.metadata !== undefined) result.metadata = patch.metadata
  return result
}

function intentPatchToDb(patch: UpdateProjectEditBriefMarkerIntentRepositoryInput['patch']): Record<string, unknown> {
  const mapping: Record<string, string> = {
    action: 'action',
    status: 'status',
    instruction: 'instruction',
    timeRangeLabel: 'time_range_label',
    startTimeSeconds: 'start_time_seconds',
    endTimeSeconds: 'end_time_seconds',
    visualBehavior: 'visual_behavior',
    audioBehavior: 'audio_behavior',
    captionBehavior: 'caption_behavior',
    assetRequirement: 'asset_requirement',
    providedAssetIds: 'provided_asset_ids',
    priority: 'priority',
    confidence: 'confidence',
    blockingNeeds: 'blocking_needs',
    doNotCopyNotes: 'do_not_copy_notes',
    plannerHints: 'planner_hints',
    latestUserMessageId: 'latest_user_message_id',
    latestConfirmationId: 'latest_confirmation_id',
    metadata: 'metadata',
  }
  return Object.fromEntries(Object.entries(patch).map(([key, value]) => [mapping[key] ?? key, value]))
}

export function createSupabaseProjectEditBriefRepository(
  input: CreateSupabaseProjectEditBriefRepositoryInput = {},
): SupabaseProjectEditBriefRepository {
  return new SupabaseProjectEditBriefRepository(input)
}

export function createSupabaseDisabledProjectEditBriefRepository(
  input: CreateSupabaseProjectEditBriefRepositoryInput = {},
): SupabaseProjectEditBriefRepository {
  return new SupabaseProjectEditBriefRepository({ ...input, client: null })
}
