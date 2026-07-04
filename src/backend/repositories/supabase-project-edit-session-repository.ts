import { randomUUID } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
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
} from '../../types/project-edit-session'
import type {
  ProjectEditSessionBundleRecord,
  ProjectEditSessionRepositoryContext,
  ProjectEditSessionRepositoryOperation,
  ProjectEditSessionRepositoryResult,
} from '../../types/project-edit-session-repository'
import { createProjectEditSessionCardModel } from '../../lib/project-edit-session-fixture-mappers'
import {
  mapProjectEditSessionEventRecordToInsertRow,
  mapProjectEditSessionEventRowToRecord,
  mapProjectEditSessionMemoryRowToRecord,
  mapProjectEditSessionMemoryRecordToInsertRow,
  mapProjectEditSessionMessageRowToRecord,
  mapProjectEditSessionMessageRecordToInsertRow,
  mapProjectEditSessionPreviewRowToRecord,
  mapProjectEditSessionPreviewRecordToInsertRow,
  mapProjectEditSessionRecordToInsertRow,
  mapProjectEditSessionRevisionRowToRecord,
  mapProjectEditSessionRevisionRecordToInsertRow,
  mapProjectEditSessionRowToRecord,
  mapProjectEditSessionSnapshotRowToRecord,
  mapProjectEditSessionSnapshotRecordToInsertRow,
  mapProjectEditSessionSourceRowToRecord,
  mapProjectEditSessionSourceRecordToInsertRow,
  mapProjectEditSessionVersionRowToRecord,
  mapProjectEditSessionVersionRecordToInsertRow,
} from './project-edit-session-row-mappers'
import type {
  AppendProjectEditSessionEventRepositoryInput,
  AppendProjectEditSessionMessageRepositoryInput,
  CreateProjectEditSessionRepositoryInput,
  DuplicateProjectEditSessionRepositoryInput,
  GetProjectEditSessionMemoryLayerRepositoryInput,
  ListProjectEditSessionsRepositoryInput,
  ProjectEditSessionRepository,
  SaveProjectEditSessionPreviewRepositoryInput,
  SaveProjectEditSessionRevisionRepositoryInput,
  SaveProjectEditSessionSnapshotRepositoryInput,
  SaveProjectEditSessionSourceRepositoryInput,
  SaveProjectEditSessionSourcesRepositoryInput,
  SaveProjectEditSessionVersionRepositoryInput,
  UpdateProjectEditSessionRepositoryInput,
  UpsertProjectEditSessionMemoryRepositoryInput,
} from './project-edit-session-repository'

type SupabaseQuery = ReturnType<SupabaseClient['from']>

type SupabaseLike = {
  from: (table: string) => SupabaseQuery
}

export interface CreateSupabaseProjectEditSessionRepositoryInput {
  client?: SupabaseLike | null
  workspaceId?: string
  projectId?: string
  editSessionId?: string
  userId?: string
}

function nowIso(): string {
  return new Date().toISOString()
}

function uuid(): string {
  return randomUUID()
}

function result<T>(
  context: ProjectEditSessionRepositoryContext,
  input: {
    ok: boolean
    data?: T
    error?: { code: string; message: string }
    warnings?: string[]
    read?: boolean
    write?: boolean
  },
): ProjectEditSessionRepositoryResult<T> {
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
    providerCallMade: false,
    workerJobCreated: false,
    renderJobCreated: false,
    creditReservedOrSpent: false,
  }
}

function throwIfError(error: unknown, operation: ProjectEditSessionRepositoryOperation): void {
  if (error) {
    const err = error as { message?: string }
    throw new Error(`ProjectEditSession Supabase ${operation} failed: ${err.message ?? 'unknown error'}`)
  }
}

function rows(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object' && !Array.isArray(item))) : []
}

function row(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : undefined
}

export class SupabaseProjectEditSessionRepository implements ProjectEditSessionRepository {
  public readonly context: ProjectEditSessionRepositoryContext
  private readonly client?: SupabaseLike | null

  constructor(input: CreateSupabaseProjectEditSessionRepositoryInput = {}) {
    this.client = input.client
    const enabled = Boolean(input.client)
    this.context = {
      mode: enabled ? 'supabase_server' : 'supabase_disabled',
      status: enabled ? 'ready_supabase' : 'blocked_missing_service_role',
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      editSessionId: input.editSessionId,
      userId: input.userId,
      mockOnly: !enabled,
      writeSafety: enabled ? 'supabase_write_enabled' : 'supabase_write_disabled',
      notes: enabled
        ? ['ProjectEditSession Supabase repository is enabled for server-side production persistence.']
        : ['ProjectEditSession Supabase repository requires an injected server-side service-role client.'],
    }
  }

  async listProjectEditSessions(input: ListProjectEditSessionsRepositoryInput | string): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionRecord[]>> {
    if (!this.client) return this.blocked('list_sessions')
    const listInput = typeof input === 'string' ? { projectId: input } : input
    let query = this.client.from('edit_sessions').select('*').eq('project_id', listInput.projectId)
    if (!listInput.includeArchived) query = query.is('archived_at', null)
    if (listInput.status) query = query.eq('status', listInput.status)
    const { data, error } = await query.order('updated_at', { ascending: false })
    throwIfError(error, 'list_sessions')
    return this.success(rows(data).map((item) => mapProjectEditSessionRowToRecord(item as never)), { read: true })
  }

  async getProjectEditSession(editSessionId: string): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionRecord | undefined>> {
    if (!this.client) return this.blocked('get_session')
    const { data, error } = await this.client.from('edit_sessions').select('*').eq('id', editSessionId).maybeSingle()
    throwIfError(error, 'get_session')
    return this.success(row(data) ? mapProjectEditSessionRowToRecord(row(data) as never) : undefined, { read: true })
  }

  async createProjectEditSession(input: CreateProjectEditSessionRepositoryInput): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionRecord>> {
    if (!this.client) return this.blocked('create_session')
    const timestamp = nowIso()
    const record: ProjectEditSessionRecord = {
      id: input.id ?? uuid(),
      projectId: input.projectId,
      workspaceId: input.workspaceId ?? this.context.workspaceId,
      ownerUserId: input.ownerUserId ?? this.context.userId,
      name: input.name,
      description: input.description,
      status: input.status ?? 'draft',
      aspectRatio: input.aspectRatio ?? '9:16',
      customAspectRatio: input.customAspectRatio,
      platformTarget: input.platformTarget ?? 'custom',
      thumbnailUrl: input.thumbnailUrl,
      sourceMediaAssetIds: input.sourceMediaAssetIds ?? [],
      selectedEditLevel: input.selectedEditLevel,
      selectedEditPreferenceId: input.selectedEditPreferenceId,
      selectedPreferenceVersionId: input.selectedPreferenceVersionId,
      selectedEditPreferenceHandle: input.selectedEditPreferenceHandle,
      doNotCopyRulesActive: false,
      messageCount: 0,
      revisionCount: 0,
      versionCount: 0,
      previewCount: 0,
      approvalStatus: 'not_requested',
      lastOpenedAt: timestamp,
      createdAt: timestamp,
      updatedAt: timestamp,
      mockOnly: false,
      metadata: input.metadata,
    }
    const insertRow = mapProjectEditSessionRecordToInsertRow(record)
    const { data, error } = await this.client.from('edit_sessions').insert(insertRow).select('*').single()
    throwIfError(error, 'create_session')
    return this.success(mapProjectEditSessionRowToRecord(row(data) as never), { write: true })
  }

  async updateProjectEditSession(input: UpdateProjectEditSessionRepositoryInput): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionRecord>> {
    if (!this.client) return this.blocked('update_session')
    const patch = recordPatchToRowPatch(input.patch)
    const { data, error } = await this.client.from('edit_sessions').update({ ...patch, updated_at: nowIso() }).eq('id', input.editSessionId).select('*').single()
    throwIfError(error, 'update_session')
    return this.success(mapProjectEditSessionRowToRecord(row(data) as never), { write: true })
  }

  async archiveProjectEditSession(editSessionId: string): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionRecord>> {
    if (!this.client) return this.blocked('archive_session')
    const { data, error } = await this.client.from('edit_sessions').update({
      status: 'archived',
      archived_at: nowIso(),
      updated_at: nowIso(),
    }).eq('id', editSessionId).select('*').single()
    throwIfError(error, 'archive_session')
    return this.success(mapProjectEditSessionRowToRecord(row(data) as never), { write: true })
  }

  async duplicateProjectEditSession(input: DuplicateProjectEditSessionRepositoryInput): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionRecord>> {
    const source = (await this.getProjectEditSession(input.editSessionId)).data
    if (!source) return this.notFound('ProjectEditSession was not found.')
    return this.createProjectEditSession({
      id: input.newId,
      projectId: input.projectId ?? source.projectId,
      workspaceId: source.workspaceId,
      ownerUserId: source.ownerUserId,
      name: input.newName ?? `${source.name} Copy`,
      description: source.description,
      status: 'draft',
      aspectRatio: source.aspectRatio,
      customAspectRatio: source.customAspectRatio,
      platformTarget: source.platformTarget,
      selectedEditLevel: source.selectedEditLevel,
      selectedEditPreferenceId: source.selectedEditPreferenceId,
      selectedPreferenceVersionId: source.selectedPreferenceVersionId,
      selectedEditPreferenceHandle: source.selectedEditPreferenceHandle,
      metadata: {
        ...(source.metadata ?? {}),
        duplicatedFromEditSessionId: source.id,
        approvalResetForProductionSafety: true,
      },
    })
  }

  async listSessionMessages(editSessionId: string): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionMessageRecord[]>> {
    return this.listChild('project_edit_session_messages', 'edit_session_id', editSessionId, (item) => mapProjectEditSessionMessageRowToRecord(item as never))
  }

  async appendSessionMessage(input: AppendProjectEditSessionMessageRepositoryInput): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionMessageRecord>> {
    if (!this.client) return this.blocked('append_message')
    const record: ProjectEditSessionMessageRecord = {
      id: input.id ?? uuid(),
      projectId: input.projectId,
      editSessionId: input.editSessionId,
      role: input.role,
      kind: input.kind,
      text: input.text,
      createdAt: input.createdAt ?? nowIso(),
      relatedSnapshotId: input.relatedSnapshotId,
      relatedVersionId: input.relatedVersionId,
      relatedPreviewId: input.relatedPreviewId,
      metadata: input.metadata,
      mockOnly: false,
    }
    const { data, error } = await this.client.from('project_edit_session_messages').insert(mapProjectEditSessionMessageRecordToInsertRow(record)).select('*').single()
    throwIfError(error, 'append_message')
    await this.incrementSessionCount(input.editSessionId, 'message_count')
    return this.success(mapProjectEditSessionMessageRowToRecord(row(data) as never), { write: true })
  }

  async listSessionSources(editSessionId: string): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionSourceRecord[]>> {
    return this.listChild('project_edit_session_sources', 'edit_session_id', editSessionId, (item) => mapProjectEditSessionSourceRowToRecord(item as never), 'source_order_index')
  }

  async saveSessionSource(input: SaveProjectEditSessionSourceRepositoryInput): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionSourceRecord>> {
    if (!this.client) return this.blocked('save_source')
    const record: ProjectEditSessionSourceRecord = { ...input, id: input.id ?? uuid(), notes: input.notes ?? [], importance: input.importance ?? 'optional', mockOnly: false }
    const { data, error } = await this.client.from('project_edit_session_sources').upsert(mapProjectEditSessionSourceRecordToInsertRow(record)).select('*').single()
    throwIfError(error, 'save_source')
    await this.refreshSourceIds(input.editSessionId)
    return this.success(mapProjectEditSessionSourceRowToRecord(row(data) as never), { write: true })
  }

  async saveSessionSources(input: SaveProjectEditSessionSourcesRepositoryInput): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionSourceRecord[]>> {
    if (!this.client) return this.blocked('save_sources')
    const { error: deleteError } = await this.client.from('project_edit_session_sources').delete().eq('edit_session_id', input.editSessionId)
    throwIfError(deleteError, 'save_sources')
    const saved: ProjectEditSessionSourceRecord[] = []
    for (const source of input.sources) {
      const result = await this.saveSessionSource(source)
      if (result.data) saved.push(result.data)
    }
    return this.success(saved.sort((a, b) => a.sourceOrderIndex - b.sourceOrderIndex), { write: true })
  }

  async listSessionMemory(editSessionId: string): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionMemoryRecord[]>> {
    return this.listChild('project_edit_session_memory', 'edit_session_id', editSessionId, (item) => mapProjectEditSessionMemoryRowToRecord(item as never), 'layer')
  }

  async getSessionMemoryLayer(input: GetProjectEditSessionMemoryLayerRepositoryInput): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionMemoryRecord | undefined>> {
    if (!this.client) return this.blocked('get_memory_layer')
    const { data, error } = await this.client.from('project_edit_session_memory').select('*').eq('edit_session_id', input.editSessionId).eq('layer', input.layer).maybeSingle()
    throwIfError(error, 'get_memory_layer')
    return this.success(row(data) ? mapProjectEditSessionMemoryRowToRecord(row(data) as never) : undefined, { read: true })
  }

  async upsertSessionMemory(input: UpsertProjectEditSessionMemoryRepositoryInput): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionMemoryRecord>> {
    if (!this.client) return this.blocked('upsert_memory')
    const existing = (await this.getSessionMemoryLayer({ editSessionId: input.editSessionId, layer: input.layer })).data
    const timestamp = nowIso()
    const record: ProjectEditSessionMemoryRecord = {
      id: existing?.id ?? input.id ?? uuid(),
      projectId: input.projectId,
      editSessionId: input.editSessionId,
      layer: input.layer,
      summary: input.summary,
      facts: input.facts ?? [],
      preferences: input.preferences ?? [],
      warnings: input.warnings ?? [],
      updatedFromMessageId: input.updatedFromMessageId,
      updatedFromRevisionId: input.updatedFromRevisionId,
      createdAt: existing?.createdAt ?? timestamp,
      updatedAt: timestamp,
      mockOnly: false,
      metadata: input.metadata,
    }
    const { data, error } = await this.client.from('project_edit_session_memory').upsert(mapProjectEditSessionMemoryRecordToInsertRow(record)).select('*').single()
    throwIfError(error, 'upsert_memory')
    return this.success(mapProjectEditSessionMemoryRowToRecord(row(data) as never), { write: true })
  }

  async saveSessionSnapshot(input: SaveProjectEditSessionSnapshotRepositoryInput): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionSnapshotRecord>> {
    if (!this.client) return this.blocked('save_snapshot')
    const record: ProjectEditSessionSnapshotRecord = {
      id: input.id ?? uuid(),
      projectId: input.projectId,
      editSessionId: input.editSessionId,
      kind: input.kind,
      versionNumber: input.versionNumber,
      messageId: input.messageId,
      summary: input.summary,
      state: input.state ?? {},
      createdAt: input.createdAt ?? nowIso(),
      mockOnly: false,
    }
    const { data, error } = await this.client.from('project_edit_session_snapshots').insert(mapProjectEditSessionSnapshotRecordToInsertRow(record)).select('*').single()
    throwIfError(error, 'save_snapshot')
    const saved = row(data)
    await this.updateSession(input.editSessionId, { latest_snapshot_id: saved?.id })
    return this.success(mapProjectEditSessionSnapshotRowToRecord(saved as never), { write: true })
  }

  async getLatestSessionSnapshot(editSessionId: string): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionSnapshotRecord | undefined>> {
    return this.latestChild('project_edit_session_snapshots', editSessionId, (item) => mapProjectEditSessionSnapshotRowToRecord(item as never), 'get_latest_snapshot')
  }

  async listSessionSnapshots(editSessionId: string): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionSnapshotRecord[]>> {
    return this.listChild('project_edit_session_snapshots', 'edit_session_id', editSessionId, (item) => mapProjectEditSessionSnapshotRowToRecord(item as never))
  }

  async saveSessionVersion(input: SaveProjectEditSessionVersionRepositoryInput): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionVersionRecord>> {
    if (!this.client) return this.blocked('save_version')
    const existing = (await this.listSessionVersions(input.editSessionId)).data ?? []
    const record: ProjectEditSessionVersionRecord = {
      id: input.id ?? uuid(),
      projectId: input.projectId,
      editSessionId: input.editSessionId,
      versionNumber: input.versionNumber ?? existing.length + 1,
      status: input.status ?? 'draft',
      name: input.name,
      summary: input.summary,
      createdFromSnapshotId: input.createdFromSnapshotId,
      createdFromMessageId: input.createdFromMessageId,
      previewId: input.previewId,
      approvalStatus: input.approvalStatus ?? 'not_requested',
      createdAt: nowIso(),
      mockOnly: false,
      metadata: input.metadata,
    }
    const { data, error } = await this.client.from('project_edit_session_versions').insert(mapProjectEditSessionVersionRecordToInsertRow(record)).select('*').single()
    throwIfError(error, 'save_version')
    const saved = row(data)
    await this.updateSession(input.editSessionId, { latest_version_id: saved?.id, version_count: existing.length + 1, approval_status: record.approvalStatus })
    return this.success(mapProjectEditSessionVersionRowToRecord(saved as never), { write: true })
  }

  async listSessionVersions(editSessionId: string): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionVersionRecord[]>> {
    return this.listChild('project_edit_session_versions', 'edit_session_id', editSessionId, (item) => mapProjectEditSessionVersionRowToRecord(item as never))
  }

  async getLatestSessionVersion(editSessionId: string): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionVersionRecord | undefined>> {
    return this.latestChild('project_edit_session_versions', editSessionId, (item) => mapProjectEditSessionVersionRowToRecord(item as never), 'get_latest_version')
  }

  async saveSessionPreview(input: SaveProjectEditSessionPreviewRepositoryInput): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionPreviewRecord>> {
    if (!this.client) return this.blocked('save_preview')
    const existing = (await this.listSessionPreviews(input.editSessionId)).data ?? []
    const record: ProjectEditSessionPreviewRecord = {
      id: input.id ?? uuid(),
      projectId: input.projectId,
      editSessionId: input.editSessionId,
      versionId: input.versionId,
      status: input.status ?? 'placeholder_mock',
      thumbnailUrl: input.thumbnailUrl,
      previewUrl: input.previewUrl,
      aspectRatio: input.aspectRatio,
      durationSeconds: input.durationSeconds,
      createdAt: nowIso(),
      mockOnly: false,
      metadata: input.metadata,
    }
    const { data, error } = await this.client.from('project_edit_session_previews').insert(mapProjectEditSessionPreviewRecordToInsertRow(record)).select('*').single()
    throwIfError(error, 'save_preview')
    const saved = row(data)
    await this.updateSession(input.editSessionId, { latest_preview_id: saved?.id, latest_preview_url: saved?.preview_url, preview_count: existing.length + 1 })
    return this.success(mapProjectEditSessionPreviewRowToRecord(saved as never), { write: true })
  }

  async listSessionPreviews(editSessionId: string): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionPreviewRecord[]>> {
    return this.listChild('project_edit_session_previews', 'edit_session_id', editSessionId, (item) => mapProjectEditSessionPreviewRowToRecord(item as never))
  }

  async getLatestSessionPreview(editSessionId: string): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionPreviewRecord | undefined>> {
    return this.latestChild('project_edit_session_previews', editSessionId, (item) => mapProjectEditSessionPreviewRowToRecord(item as never), 'get_latest_preview')
  }

  async saveSessionRevision(input: SaveProjectEditSessionRevisionRepositoryInput): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionRevisionRecord>> {
    if (!this.client) return this.blocked('save_revision')
    const existing = (await this.listSessionRevisions(input.editSessionId)).data ?? []
    const record: ProjectEditSessionRevisionRecord = {
      id: input.id ?? uuid(),
      projectId: input.projectId,
      editSessionId: input.editSessionId,
      requestedByMessageId: input.requestedByMessageId,
      summary: input.summary,
      userInstruction: input.userInstruction,
      resetsApproval: input.resetsApproval,
      createdSnapshotId: input.createdSnapshotId,
      createdVersionId: input.createdVersionId,
      createdAt: nowIso(),
      mockOnly: false,
      metadata: input.metadata,
    }
    const { data, error } = await this.client.from('project_edit_session_revisions').insert(mapProjectEditSessionRevisionRecordToInsertRow(record)).select('*').single()
    throwIfError(error, 'save_revision')
    await this.updateSession(input.editSessionId, {
      revision_count: existing.length + 1,
      approval_status: input.resetsApproval ? 'reset_after_revision' : undefined,
      status: input.resetsApproval ? 'revision_requested' : undefined,
    })
    return this.success(mapProjectEditSessionRevisionRowToRecord(row(data) as never), { write: true })
  }

  async listSessionRevisions(editSessionId: string): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionRevisionRecord[]>> {
    return this.listChild('project_edit_session_revisions', 'edit_session_id', editSessionId, (item) => mapProjectEditSessionRevisionRowToRecord(item as never))
  }

  async appendSessionEvent(input: AppendProjectEditSessionEventRepositoryInput): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionEventRecord>> {
    if (!this.client) return this.blocked('append_event')
    const record: ProjectEditSessionEventRecord = { ...input, id: input.id ?? uuid(), createdAt: input.createdAt ?? nowIso(), mockOnly: false }
    const { data, error } = await this.client.from('project_edit_session_events').insert(mapProjectEditSessionEventRecordToInsertRow(record)).select('*').single()
    throwIfError(error, 'append_event')
    return this.success(mapProjectEditSessionEventRowToRecord(row(data) as never), { write: true })
  }

  async listSessionEvents(editSessionId: string): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionEventRecord[]>> {
    return this.listChild('project_edit_session_events', 'edit_session_id', editSessionId, (item) => mapProjectEditSessionEventRowToRecord(item as never))
  }

  async createSessionCardModel(editSessionId: string): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionCardModel>> {
    const session = (await this.getProjectEditSession(editSessionId)).data
    if (!session) return this.notFound('ProjectEditSession was not found.')
    return this.success(createProjectEditSessionCardModel(session), { read: true })
  }

  async listSessionCardModels(projectId: string): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionCardModel[]>> {
    const sessions = (await this.listProjectEditSessions(projectId)).data ?? []
    return this.success(sessions.map(createProjectEditSessionCardModel), { read: true })
  }

  async createSessionBundle(editSessionId: string): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionBundleRecord>> {
    const session = (await this.getProjectEditSession(editSessionId)).data
    if (!session) return this.notFound('ProjectEditSession was not found.')
    const [messages, sources, memories, snapshots, versions, previews, revisions, events] = await Promise.all([
      this.listSessionMessages(editSessionId),
      this.listSessionSources(editSessionId),
      this.listSessionMemory(editSessionId),
      this.listSessionSnapshots(editSessionId),
      this.listSessionVersions(editSessionId),
      this.listSessionPreviews(editSessionId),
      this.listSessionRevisions(editSessionId),
      this.listSessionEvents(editSessionId),
    ])
    const bundle: ProjectEditSessionBundleRecord = {
      session,
      messages: messages.data ?? [],
      sources: sources.data ?? [],
      memories: memories.data ?? [],
      snapshots: snapshots.data ?? [],
      versions: versions.data ?? [],
      previews: previews.data ?? [],
      revisions: revisions.data ?? [],
      events: events.data ?? [],
      cardModel: createProjectEditSessionCardModel(session),
      mockOnly: false,
      warnings: ['ProjectEditSession bundle loaded from Supabase repository.'],
    }
    return this.success(bundle, { read: true })
  }

  private async listChild<T>(table: string, column: string, value: string, mapper: (row: Record<string, unknown>) => T, orderColumn = 'created_at'): Promise<ProjectEditSessionRepositoryResult<T[]>> {
    if (!this.client) return this.blocked('list_messages')
    const { data, error } = await this.client.from(table).select('*').eq(column, value).order(orderColumn, { ascending: true })
    throwIfError(error, 'list_messages')
    return this.success(rows(data).map(mapper), { read: true })
  }

  private async latestChild<T>(table: string, editSessionId: string, mapper: (row: Record<string, unknown>) => T, operation: ProjectEditSessionRepositoryOperation): Promise<ProjectEditSessionRepositoryResult<T | undefined>> {
    if (!this.client) return this.blocked(operation)
    const { data, error } = await this.client.from(table).select('*').eq('edit_session_id', editSessionId).order('created_at', { ascending: false }).limit(1).maybeSingle()
    throwIfError(error, operation)
    return this.success(row(data) ? mapper(row(data) as Record<string, unknown>) : undefined, { read: true })
  }

  private async incrementSessionCount(editSessionId: string, column: 'message_count'): Promise<void> {
    const session = (await this.getProjectEditSession(editSessionId)).data
    if (!session) return
    await this.updateSession(editSessionId, { [column]: session.messageCount + 1 })
  }

  private async refreshSourceIds(editSessionId: string): Promise<void> {
    const sources = (await this.listSessionSources(editSessionId)).data ?? []
    await this.updateSession(editSessionId, { source_media_asset_ids: sources.map((source) => source.mediaAssetId) })
  }

  private async updateSession(editSessionId: string, patch: Record<string, unknown>): Promise<void> {
    if (!this.client) return
    const cleaned = Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined))
    if (Object.keys(cleaned).length === 0) return
    await this.client.from('edit_sessions').update({ ...cleaned, updated_at: nowIso() }).eq('id', editSessionId)
  }

  private success<T>(data: T, flags: { read?: boolean; write?: boolean } = {}): ProjectEditSessionRepositoryResult<T> {
    return result(this.context, {
      ok: true,
      data,
      warnings: ['ProjectEditSession Supabase repository operation completed server-side.'],
      ...flags,
    })
  }

  private blocked<T>(operation: ProjectEditSessionRepositoryOperation): ProjectEditSessionRepositoryResult<T> {
    return result(this.context, {
      ok: false,
      error: {
        code: 'PROJECT_EDIT_SESSION_REPOSITORY_DISABLED',
        message: `ProjectEditSession Supabase repository blocks ${operation}; a server-side service-role client is required.`,
      },
      warnings: this.context.notes,
    })
  }

  private notFound<T>(message: string): ProjectEditSessionRepositoryResult<T> {
    return result(this.context, {
      ok: false,
      error: { code: 'PROJECT_EDIT_SESSION_NOT_FOUND', message },
      warnings: ['ProjectEditSession Supabase repository did not find a matching row.'],
      read: true,
    })
  }
}

function recordPatchToRowPatch(patch: UpdateProjectEditSessionRepositoryInput['patch']): Record<string, unknown> {
  const mapping: Record<string, string> = {
    name: 'name',
    description: 'description',
    status: 'status',
    aspectRatio: 'aspect_ratio',
    customAspectRatio: 'custom_aspect_ratio',
    platformTarget: 'platform_target',
    thumbnailUrl: 'thumbnail_url',
    latestPreviewUrl: 'latest_preview_url',
    sourceMediaAssetIds: 'source_media_asset_ids',
    selectedEditLevel: 'selected_edit_level',
    selectedEditPreferenceId: 'selected_edit_preference_id',
    selectedPreferenceVersionId: 'selected_preference_version_id',
    selectedEditPreferenceHandle: 'selected_edit_preference_handle',
    preferenceDNAApplicationId: 'preference_dna_application_id',
    dnaStatusLabel: 'dna_status_label',
    dnaQAStatusLabel: 'dna_qa_status_label',
    doNotCopyRulesActive: 'do_not_copy_rules_active',
    approvalStatus: 'approval_status',
    lastOpenedAt: 'last_opened_at',
    metadata: 'metadata',
  }
  return Object.fromEntries(Object.entries(patch).map(([key, value]) => [mapping[key] ?? key, value]))
}

export function createSupabaseProjectEditSessionRepository(
  input: CreateSupabaseProjectEditSessionRepositoryInput = {},
): SupabaseProjectEditSessionRepository {
  return new SupabaseProjectEditSessionRepository(input)
}

export function createSupabaseDisabledProjectEditSessionRepository(
  input: CreateSupabaseProjectEditSessionRepositoryInput = {},
): SupabaseProjectEditSessionRepository {
  return new SupabaseProjectEditSessionRepository({ ...input, client: null })
}
