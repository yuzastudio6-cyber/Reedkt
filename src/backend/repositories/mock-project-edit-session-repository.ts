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
  ProjectEditSessionRepositoryResult,
} from '../../types/project-edit-session-repository'
import {
  createMockProjectEditSessionFixtureBundle,
} from '../../lib/mock-project-edit-sessions'
import { createProjectEditSessionCardModel } from '../../lib/project-edit-session-fixture-mappers'
import type { MockDatabase } from '../mock/mock-database'
import { createMockId, nowIso } from '../mock/mock-database'
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

export interface CreateMockProjectEditSessionRepositoryInput {
  db: MockDatabase
  workspaceId?: string
  projectId?: string
  editSessionId?: string
  userId?: string
}

type RecordWithId = { id: string }
type SessionChild =
  | ProjectEditSessionMessageRecord
  | ProjectEditSessionSourceRecord
  | ProjectEditSessionMemoryRecord
  | ProjectEditSessionSnapshotRecord
  | ProjectEditSessionVersionRecord
  | ProjectEditSessionPreviewRecord
  | ProjectEditSessionRevisionRecord
  | ProjectEditSessionEventRecord

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function upsert<T extends RecordWithId>(collection: T[], record: T): T {
  const index = collection.findIndex((item) => item.id === record.id)
  if (index === -1) {
    collection.push(record)
    return record
  }
  collection[index] = record
  return record
}

function sortByCreatedAt<T extends { createdAt: string }>(records: T[]): T[] {
  return [...records].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

function safeResult<T>(
  context: ProjectEditSessionRepositoryContext,
  input: {
    ok: boolean
    data?: T
    error?: { code: string; message: string }
    warnings?: string[]
  },
): ProjectEditSessionRepositoryResult<T> {
  return {
    ok: input.ok,
    data: input.data,
    error: input.error,
    warnings: input.warnings ?? [],
    repositoryMode: context.mode,
    mockOnly: true,
    supabaseReadMade: false,
    supabaseWriteMade: false,
    storageReadMade: false,
    storageWriteMade: false,
    providerCallMade: false,
    workerJobCreated: false,
    renderJobCreated: false,
    creditReservedOrSpent: false,
  }
}

function duplicateChildId(id: string, sourceSessionId: string, newSessionId: string): string {
  if (id.startsWith(sourceSessionId)) return id.replace(sourceSessionId, newSessionId)
  return `${newSessionId}-${id}`
}

function retargetChild<T extends SessionChild>(
  child: T,
  sourceSessionId: string,
  newSessionId: string,
  projectId: string,
): T {
  const next = clone(child) as T & Record<string, unknown>
  next.id = duplicateChildId(String(next.id), sourceSessionId, newSessionId)
  next.projectId = projectId
  next.editSessionId = newSessionId
  if (typeof next.relatedSnapshotId === 'string') next.relatedSnapshotId = duplicateChildId(next.relatedSnapshotId, sourceSessionId, newSessionId)
  if (typeof next.relatedVersionId === 'string') next.relatedVersionId = duplicateChildId(next.relatedVersionId, sourceSessionId, newSessionId)
  if (typeof next.relatedPreviewId === 'string') next.relatedPreviewId = duplicateChildId(next.relatedPreviewId, sourceSessionId, newSessionId)
  if (typeof next.updatedFromMessageId === 'string') next.updatedFromMessageId = duplicateChildId(next.updatedFromMessageId, sourceSessionId, newSessionId)
  if (typeof next.updatedFromRevisionId === 'string') next.updatedFromRevisionId = duplicateChildId(next.updatedFromRevisionId, sourceSessionId, newSessionId)
  if (typeof next.messageId === 'string') next.messageId = duplicateChildId(next.messageId, sourceSessionId, newSessionId)
  if (typeof next.createdFromSnapshotId === 'string') next.createdFromSnapshotId = duplicateChildId(next.createdFromSnapshotId, sourceSessionId, newSessionId)
  if (typeof next.createdFromMessageId === 'string') next.createdFromMessageId = duplicateChildId(next.createdFromMessageId, sourceSessionId, newSessionId)
  if (typeof next.previewId === 'string') next.previewId = duplicateChildId(next.previewId, sourceSessionId, newSessionId)
  if (typeof next.versionId === 'string') next.versionId = duplicateChildId(next.versionId, sourceSessionId, newSessionId)
  if (typeof next.requestedByMessageId === 'string') next.requestedByMessageId = duplicateChildId(next.requestedByMessageId, sourceSessionId, newSessionId)
  if (typeof next.createdSnapshotId === 'string') next.createdSnapshotId = duplicateChildId(next.createdSnapshotId, sourceSessionId, newSessionId)
  if (typeof next.createdVersionId === 'string') next.createdVersionId = duplicateChildId(next.createdVersionId, sourceSessionId, newSessionId)
  return next as T
}

export class MockProjectEditSessionRepository implements ProjectEditSessionRepository {
  public readonly context: ProjectEditSessionRepositoryContext
  private readonly db: MockDatabase

  constructor(db: MockDatabase, input: Omit<CreateMockProjectEditSessionRepositoryInput, 'db'> = {}) {
    this.db = db
    this.context = {
      mode: 'mock_database',
      status: 'ready_mock',
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      editSessionId: input.editSessionId,
      userId: input.userId,
      mockOnly: true,
      writeSafety: 'mock_write_only',
      notes: [
        'ProjectEditSession mock repository uses in-memory MockDatabase collections only.',
        'No Supabase, storage, provider, worker, render, or credit side effects occur.',
      ],
    }
    this.seedFixtureDataIfEmpty()
  }

  async listProjectEditSessions(input: ListProjectEditSessionsRepositoryInput | string): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionRecord[]>> {
    const listInput = typeof input === 'string' ? { projectId: input } : input
    const sessions = this.db.projectEditSessions
      .filter((session) => session.projectId === listInput.projectId)
      .filter((session) => listInput.includeArchived ? true : session.status !== 'archived')
      .filter((session) => listInput.status ? session.status === listInput.status : true)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    return this.success(sessions, ['ProjectEditSession list read from MockDatabase only.'])
  }

  async getProjectEditSession(editSessionId: string): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionRecord | undefined>> {
    return this.success(this.findSession(editSessionId), ['ProjectEditSession get read from MockDatabase only.'])
  }

  async createProjectEditSession(input: CreateProjectEditSessionRepositoryInput): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionRecord>> {
    const id = input.id ?? createMockId('project-edit-session')
    const session: ProjectEditSessionRecord = {
      id,
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
      doNotCopyRulesActive: true,
      messageCount: 0,
      revisionCount: 0,
      versionCount: 0,
      previewCount: 0,
      approvalStatus: 'not_requested',
      lastOpenedAt: nowIso(),
      createdAt: nowIso(),
      updatedAt: nowIso(),
      mockOnly: true,
      metadata: {
        ...(input.metadata ?? {}),
        repositoryCreated: true,
      },
    }
    return this.success(upsert(this.db.projectEditSessions, session), ['ProjectEditSession created in MockDatabase only.'])
  }

  async updateProjectEditSession(input: UpdateProjectEditSessionRepositoryInput): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionRecord>> {
    const session = this.findSession(input.editSessionId)
    if (!session) return this.notFound('ProjectEditSession was not found.', { editSessionId: input.editSessionId })
    Object.assign(session, input.patch, {
      updatedAt: nowIso(),
      mockOnly: true,
    })
    return this.success(session, ['ProjectEditSession updated in MockDatabase only.'])
  }

  async archiveProjectEditSession(editSessionId: string): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionRecord>> {
    const session = this.findSession(editSessionId)
    if (!session) return this.notFound('ProjectEditSession was not found.', { editSessionId })
    session.status = 'archived'
    session.approvalStatus = session.approvalStatus === 'approved' ? 'reset_after_revision' : session.approvalStatus
    session.updatedAt = nowIso()
    return this.success(session, ['ProjectEditSession archived in MockDatabase only.'])
  }

  async duplicateProjectEditSession(input: DuplicateProjectEditSessionRepositoryInput): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionRecord>> {
    const source = this.findSession(input.editSessionId)
    if (!source) return this.notFound('ProjectEditSession was not found.', { editSessionId: input.editSessionId })
    const newId = input.newId ?? createMockId('project-edit-session-copy')
    const projectId = input.projectId ?? source.projectId
    const session: ProjectEditSessionRecord = {
      ...clone(source),
      id: newId,
      projectId,
      name: input.newName ?? `${source.name} Copy`,
      status: 'draft',
      latestPreviewUrl: undefined,
      latestSnapshotId: source.latestSnapshotId ? duplicateChildId(source.latestSnapshotId, source.id, newId) : undefined,
      latestVersionId: source.latestVersionId ? duplicateChildId(source.latestVersionId, source.id, newId) : undefined,
      latestPreviewId: source.latestPreviewId ? duplicateChildId(source.latestPreviewId, source.id, newId) : undefined,
      approvalStatus: 'not_requested',
      lastOpenedAt: nowIso(),
      createdAt: nowIso(),
      updatedAt: nowIso(),
      metadata: {
        ...(source.metadata ?? {}),
        duplicatedFromEditSessionId: source.id,
      },
    }
    upsert(this.db.projectEditSessions, session)
    this.db.projectEditSessionMessages.push(...this.childrenFor(this.db.projectEditSessionMessages, source.id).map((child) => retargetChild(child, source.id, newId, projectId)))
    this.db.projectEditSessionSources.push(...this.childrenFor(this.db.projectEditSessionSources, source.id).map((child) => retargetChild(child, source.id, newId, projectId)))
    this.db.projectEditSessionMemory.push(...this.childrenFor(this.db.projectEditSessionMemory, source.id).map((child) => retargetChild(child, source.id, newId, projectId)))
    this.db.projectEditSessionSnapshots.push(...this.childrenFor(this.db.projectEditSessionSnapshots, source.id).map((child) => retargetChild(child, source.id, newId, projectId)))
    this.db.projectEditSessionVersions.push(...this.childrenFor(this.db.projectEditSessionVersions, source.id).map((child) => ({
      ...retargetChild(child, source.id, newId, projectId),
      approvalStatus: 'not_requested' as const,
      status: child.status === 'rendered_future' ? 'draft' : child.status,
    })))
    this.db.projectEditSessionPreviews.push(...this.childrenFor(this.db.projectEditSessionPreviews, source.id).map((child) => ({
      ...retargetChild(child, source.id, newId, projectId),
      status: 'placeholder_mock' as const,
      previewUrl: undefined,
    })))
    this.db.projectEditSessionRevisions.push(...this.childrenFor(this.db.projectEditSessionRevisions, source.id).map((child) => retargetChild(child, source.id, newId, projectId)))
    this.db.projectEditSessionEvents.push({
      id: `${newId}-event-duplicated`,
      projectId,
      editSessionId: newId,
      eventType: 'session_duplicated',
      summary: `Duplicated from ${source.name}; approval reset for safety.`,
      createdAt: nowIso(),
      mockOnly: true,
      metadata: { sourceEditSessionId: source.id },
    })
    return this.success(session, ['ProjectEditSession duplicated in MockDatabase only; approval was reset.'])
  }

  async listSessionMessages(editSessionId: string): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionMessageRecord[]>> {
    return this.success(sortByCreatedAt(this.childrenFor(this.db.projectEditSessionMessages, editSessionId)))
  }

  async appendSessionMessage(input: AppendProjectEditSessionMessageRepositoryInput): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionMessageRecord>> {
    const session = this.findSession(input.editSessionId)
    if (!session) return this.notFound('ProjectEditSession was not found.', { editSessionId: input.editSessionId })
    const message: ProjectEditSessionMessageRecord = {
      id: input.id ?? createMockId('project-edit-session-message'),
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
      mockOnly: true,
    }
    upsert(this.db.projectEditSessionMessages, message)
    session.messageCount = this.childrenFor(this.db.projectEditSessionMessages, input.editSessionId).length
    session.updatedAt = nowIso()
    return this.success(message, ['ProjectEditSession message appended in MockDatabase only.'])
  }

  async listSessionSources(editSessionId: string): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionSourceRecord[]>> {
    return this.success(this.childrenFor(this.db.projectEditSessionSources, editSessionId).sort((a, b) => a.sourceOrderIndex - b.sourceOrderIndex))
  }

  async saveSessionSource(input: SaveProjectEditSessionSourceRepositoryInput): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionSourceRecord>> {
    const session = this.findSession(input.editSessionId)
    if (!session) return this.notFound('ProjectEditSession was not found.', { editSessionId: input.editSessionId })
    const source: ProjectEditSessionSourceRecord = {
      id: input.id ?? createMockId('project-edit-session-source'),
      projectId: input.projectId,
      editSessionId: input.editSessionId,
      mediaAssetId: input.mediaAssetId,
      sourceOrderIndex: input.sourceOrderIndex,
      label: input.label,
      notes: input.notes ?? [],
      importance: input.importance ?? 'optional',
      thumbnailUrl: input.thumbnailUrl,
      previewUrl: input.previewUrl,
      durationSeconds: input.durationSeconds,
      mimeType: input.mimeType,
      mockOnly: true,
    }
    upsert(this.db.projectEditSessionSources, source)
    session.sourceMediaAssetIds = this.childrenFor(this.db.projectEditSessionSources, input.editSessionId)
      .sort((a, b) => a.sourceOrderIndex - b.sourceOrderIndex)
      .map((item) => item.mediaAssetId)
    session.updatedAt = nowIso()
    return this.success(source, ['ProjectEditSession source saved in MockDatabase only.'])
  }

  async saveSessionSources(input: SaveProjectEditSessionSourcesRepositoryInput): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionSourceRecord[]>> {
    this.db.projectEditSessionSources = this.db.projectEditSessionSources.filter((source) => source.editSessionId !== input.editSessionId)
    const saved: ProjectEditSessionSourceRecord[] = []
    for (const sourceInput of input.sources) {
      const result = await this.saveSessionSource(sourceInput)
      if (!result.ok || !result.data) return result as unknown as ProjectEditSessionRepositoryResult<ProjectEditSessionSourceRecord[]>
      saved.push(result.data)
    }
    return this.success(saved.sort((a, b) => a.sourceOrderIndex - b.sourceOrderIndex), ['ProjectEditSession source set saved in MockDatabase only.'])
  }

  async listSessionMemory(editSessionId: string): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionMemoryRecord[]>> {
    return this.success(this.childrenFor(this.db.projectEditSessionMemory, editSessionId).sort((a, b) => a.layer.localeCompare(b.layer)))
  }

  async getSessionMemoryLayer(input: GetProjectEditSessionMemoryLayerRepositoryInput): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionMemoryRecord | undefined>> {
    return this.success(this.db.projectEditSessionMemory.find((memory) => memory.editSessionId === input.editSessionId && memory.layer === input.layer))
  }

  async upsertSessionMemory(input: UpsertProjectEditSessionMemoryRepositoryInput): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionMemoryRecord>> {
    const existing = this.db.projectEditSessionMemory.find((memory) => memory.editSessionId === input.editSessionId && memory.layer === input.layer)
    const memory: ProjectEditSessionMemoryRecord = {
      id: existing?.id ?? input.id ?? createMockId('project-edit-session-memory'),
      projectId: input.projectId,
      editSessionId: input.editSessionId,
      layer: input.layer,
      summary: input.summary,
      facts: input.facts ?? [],
      preferences: input.preferences ?? [],
      warnings: input.warnings ?? [],
      updatedFromMessageId: input.updatedFromMessageId,
      updatedFromRevisionId: input.updatedFromRevisionId,
      createdAt: existing?.createdAt ?? nowIso(),
      updatedAt: nowIso(),
      mockOnly: true,
      metadata: input.metadata,
    }
    upsert(this.db.projectEditSessionMemory, memory)
    return this.success(memory, ['ProjectEditSession memory layer upserted in MockDatabase only.'])
  }

  async saveSessionSnapshot(input: SaveProjectEditSessionSnapshotRepositoryInput): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionSnapshotRecord>> {
    const snapshot: ProjectEditSessionSnapshotRecord = {
      id: input.id ?? createMockId('project-edit-session-snapshot'),
      projectId: input.projectId,
      editSessionId: input.editSessionId,
      kind: input.kind,
      versionNumber: input.versionNumber,
      messageId: input.messageId,
      summary: input.summary,
      state: input.state ?? {},
      createdAt: input.createdAt ?? nowIso(),
      mockOnly: true,
    }
    upsert(this.db.projectEditSessionSnapshots, snapshot)
    const session = this.findSession(input.editSessionId)
    if (session) {
      session.latestSnapshotId = snapshot.id
      session.updatedAt = nowIso()
    }
    return this.success(snapshot, ['ProjectEditSession snapshot saved in MockDatabase only.'])
  }

  async getLatestSessionSnapshot(editSessionId: string): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionSnapshotRecord | undefined>> {
    return this.success(this.childrenFor(this.db.projectEditSessionSnapshots, editSessionId).at(-1))
  }

  async listSessionSnapshots(editSessionId: string): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionSnapshotRecord[]>> {
    return this.success(sortByCreatedAt(this.childrenFor(this.db.projectEditSessionSnapshots, editSessionId)))
  }

  async saveSessionVersion(input: SaveProjectEditSessionVersionRepositoryInput): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionVersionRecord>> {
    const existingVersions = this.childrenFor(this.db.projectEditSessionVersions, input.editSessionId)
    const version: ProjectEditSessionVersionRecord = {
      id: input.id ?? createMockId('project-edit-session-version'),
      projectId: input.projectId,
      editSessionId: input.editSessionId,
      versionNumber: input.versionNumber ?? existingVersions.length + 1,
      status: input.status ?? 'draft',
      name: input.name,
      summary: input.summary,
      createdFromSnapshotId: input.createdFromSnapshotId,
      createdFromMessageId: input.createdFromMessageId,
      previewId: input.previewId,
      approvalStatus: input.approvalStatus ?? 'not_requested',
      createdAt: nowIso(),
      mockOnly: true,
      metadata: input.metadata,
    }
    upsert(this.db.projectEditSessionVersions, version)
    const session = this.findSession(input.editSessionId)
    if (session) {
      session.versionCount = this.childrenFor(this.db.projectEditSessionVersions, input.editSessionId).length
      session.latestVersionId = version.id
      session.approvalStatus = version.approvalStatus
      session.updatedAt = nowIso()
    }
    return this.success(version, ['ProjectEditSession version saved in MockDatabase only.'])
  }

  async listSessionVersions(editSessionId: string): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionVersionRecord[]>> {
    return this.success(sortByCreatedAt(this.childrenFor(this.db.projectEditSessionVersions, editSessionId)))
  }

  async getLatestSessionVersion(editSessionId: string): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionVersionRecord | undefined>> {
    return this.success(this.childrenFor(this.db.projectEditSessionVersions, editSessionId).at(-1))
  }

  async saveSessionPreview(input: SaveProjectEditSessionPreviewRepositoryInput): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionPreviewRecord>> {
    const preview: ProjectEditSessionPreviewRecord = {
      id: input.id ?? createMockId('project-edit-session-preview'),
      projectId: input.projectId,
      editSessionId: input.editSessionId,
      versionId: input.versionId,
      status: input.status ?? 'placeholder_mock',
      thumbnailUrl: input.thumbnailUrl,
      previewUrl: input.previewUrl,
      aspectRatio: input.aspectRatio,
      durationSeconds: input.durationSeconds,
      createdAt: nowIso(),
      mockOnly: true,
      metadata: input.metadata,
    }
    upsert(this.db.projectEditSessionPreviews, preview)
    const session = this.findSession(input.editSessionId)
    if (session) {
      session.previewCount = this.childrenFor(this.db.projectEditSessionPreviews, input.editSessionId).length
      session.latestPreviewId = preview.id
      session.latestPreviewUrl = preview.previewUrl
      session.updatedAt = nowIso()
    }
    return this.success(preview, ['ProjectEditSession preview saved in MockDatabase only.'])
  }

  async listSessionPreviews(editSessionId: string): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionPreviewRecord[]>> {
    return this.success(sortByCreatedAt(this.childrenFor(this.db.projectEditSessionPreviews, editSessionId)))
  }

  async getLatestSessionPreview(editSessionId: string): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionPreviewRecord | undefined>> {
    return this.success(this.childrenFor(this.db.projectEditSessionPreviews, editSessionId).at(-1))
  }

  async saveSessionRevision(input: SaveProjectEditSessionRevisionRepositoryInput): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionRevisionRecord>> {
    const revision: ProjectEditSessionRevisionRecord = {
      id: input.id ?? createMockId('project-edit-session-revision'),
      projectId: input.projectId,
      editSessionId: input.editSessionId,
      requestedByMessageId: input.requestedByMessageId,
      summary: input.summary,
      userInstruction: input.userInstruction,
      resetsApproval: input.resetsApproval,
      createdSnapshotId: input.createdSnapshotId,
      createdVersionId: input.createdVersionId,
      createdAt: nowIso(),
      mockOnly: true,
      metadata: input.metadata,
    }
    upsert(this.db.projectEditSessionRevisions, revision)
    const session = this.findSession(input.editSessionId)
    if (session) {
      session.revisionCount = this.childrenFor(this.db.projectEditSessionRevisions, input.editSessionId).length
      if (revision.resetsApproval) {
        session.approvalStatus = 'reset_after_revision'
        session.status = 'revision_requested'
        session.latestPreviewUrl = undefined
      }
      session.updatedAt = nowIso()
    }
    return this.success(revision, ['ProjectEditSession revision saved in MockDatabase only.'])
  }

  async listSessionRevisions(editSessionId: string): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionRevisionRecord[]>> {
    return this.success(sortByCreatedAt(this.childrenFor(this.db.projectEditSessionRevisions, editSessionId)))
  }

  async appendSessionEvent(input: AppendProjectEditSessionEventRepositoryInput): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionEventRecord>> {
    const event: ProjectEditSessionEventRecord = {
      id: input.id ?? createMockId('project-edit-session-event'),
      projectId: input.projectId,
      editSessionId: input.editSessionId,
      eventType: input.eventType,
      summary: input.summary,
      createdAt: input.createdAt ?? nowIso(),
      mockOnly: true,
      metadata: input.metadata,
    }
    upsert(this.db.projectEditSessionEvents, event)
    return this.success(event, ['ProjectEditSession event appended in MockDatabase only.'])
  }

  async listSessionEvents(editSessionId: string): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionEventRecord[]>> {
    return this.success(sortByCreatedAt(this.childrenFor(this.db.projectEditSessionEvents, editSessionId)))
  }

  async createSessionCardModel(editSessionId: string): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionCardModel>> {
    const session = this.findSession(editSessionId)
    if (!session) return this.notFound('ProjectEditSession was not found.', { editSessionId })
    return this.success(createProjectEditSessionCardModel(session), ['ProjectEditSession card model created from MockDatabase session only.'])
  }

  async listSessionCardModels(projectId: string): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionCardModel[]>> {
    const sessions = (await this.listProjectEditSessions(projectId)).data ?? []
    return this.success(sessions.map(createProjectEditSessionCardModel), ['ProjectEditSession card models created from MockDatabase sessions only.'])
  }

  async createSessionBundle(editSessionId: string): Promise<ProjectEditSessionRepositoryResult<ProjectEditSessionBundleRecord>> {
    const session = this.findSession(editSessionId)
    if (!session) return this.notFound('ProjectEditSession was not found.', { editSessionId })
    const bundle: ProjectEditSessionBundleRecord = {
      session,
      messages: sortByCreatedAt(this.childrenFor(this.db.projectEditSessionMessages, editSessionId)),
      sources: this.childrenFor(this.db.projectEditSessionSources, editSessionId).sort((a, b) => a.sourceOrderIndex - b.sourceOrderIndex),
      memories: this.childrenFor(this.db.projectEditSessionMemory, editSessionId).sort((a, b) => a.layer.localeCompare(b.layer)),
      snapshots: sortByCreatedAt(this.childrenFor(this.db.projectEditSessionSnapshots, editSessionId)),
      versions: sortByCreatedAt(this.childrenFor(this.db.projectEditSessionVersions, editSessionId)),
      previews: sortByCreatedAt(this.childrenFor(this.db.projectEditSessionPreviews, editSessionId)),
      revisions: sortByCreatedAt(this.childrenFor(this.db.projectEditSessionRevisions, editSessionId)),
      events: sortByCreatedAt(this.childrenFor(this.db.projectEditSessionEvents, editSessionId)),
      cardModel: createProjectEditSessionCardModel(session),
      mockOnly: true,
      warnings: ['ProjectEditSession bundle created from MockDatabase only.'],
    }
    return this.success(bundle, bundle.warnings)
  }

  private seedFixtureDataIfEmpty(): void {
    if (this.db.projectEditSessions.length > 0) return
    const bundle = createMockProjectEditSessionFixtureBundle()
    this.db.projectEditSessions.push(...clone(bundle.sessions))
    this.db.projectEditSessionMessages.push(...clone(bundle.messages))
    this.db.projectEditSessionSources.push(...clone(bundle.sources))
    this.db.projectEditSessionMemory.push(...clone(bundle.memories))
    this.db.projectEditSessionSnapshots.push(...clone(bundle.snapshots))
    this.db.projectEditSessionVersions.push(...clone(bundle.versions))
    this.db.projectEditSessionPreviews.push(...clone(bundle.previews))
    this.db.projectEditSessionRevisions.push(...clone(bundle.revisions))
    this.db.projectEditSessionEvents.push(...clone(bundle.events))
  }

  private findSession(editSessionId: string): ProjectEditSessionRecord | undefined {
    return this.db.projectEditSessions.find((session) => session.id === editSessionId)
  }

  private childrenFor<T extends { editSessionId: string }>(collection: T[], editSessionId: string): T[] {
    return collection.filter((item) => item.editSessionId === editSessionId)
  }

  private success<T>(data: T, warnings: string[] = ['ProjectEditSession repository operation used MockDatabase only.']): ProjectEditSessionRepositoryResult<T> {
    return safeResult(this.context, { ok: true, data, warnings })
  }

  private notFound<T>(message: string, details?: unknown): ProjectEditSessionRepositoryResult<T> {
    return safeResult(this.context, {
      ok: false,
      error: {
        code: 'PROJECT_EDIT_SESSION_NOT_FOUND',
        message,
      },
      warnings: [
        'ProjectEditSession repository operation failed without any production side effect.',
        JSON.stringify(details ?? {}),
      ],
    })
  }
}

export function createMockProjectEditSessionRepository(
  input: CreateMockProjectEditSessionRepositoryInput,
): MockProjectEditSessionRepository {
  return new MockProjectEditSessionRepository(input.db, {
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    userId: input.userId,
  })
}
