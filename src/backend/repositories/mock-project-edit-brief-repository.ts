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
  ProjectEditBriefRepositoryResult,
} from '../../types/project-edit-brief-repository'
import { createMockProjectEditBriefFixtureBundle } from '../../lib/mock-project-edit-briefs'
import {
  createProjectEditBriefBundle,
  createProjectEditBriefDrawerModel,
} from '../../lib/project-edit-brief-fixture-mappers'
import { createProjectEditBriefReadableSummary } from '../../lib/project-edit-brief-summary-mappers'
import { createProjectEditBriefTimelineMarkerModels } from '../../lib/project-edit-brief-timeline-mappers'
import { recommendProjectEditBriefExportSettings } from '../../lib/project-edit-brief-export-settings-rules'
import type { MockDatabase } from '../mock/mock-database'
import { createMockId, nowIso } from '../mock/mock-database'
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

export interface CreateMockProjectEditBriefRepositoryInput {
  db: MockDatabase
  workspaceId?: string
  projectId?: string
  editSessionId?: string
  briefId?: string
  userId?: string
}

type RecordWithId = { id: string }
type BriefFixtureRecord =
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

function clone<T>(value: T): T {
  if (value === undefined) return value
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

function sortByUpdatedAt<T extends { id: string; updatedAt: string }>(records: T[]): T[] {
  return [...records].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || a.id.localeCompare(b.id))
}

function sortByCreatedAt<T extends { id: string; createdAt: string }>(records: T[]): T[] {
  return [...records].sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id))
}

function safeResult<T>(
  context: ProjectEditBriefRepositoryContext,
  input: {
    ok: boolean
    data?: T
    error?: { code: string; message: string }
    warnings?: string[]
  },
): ProjectEditBriefRepositoryResult<T> {
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

function markFixtureRecord<T extends BriefFixtureRecord>(record: T): T {
  return {
    ...clone(record),
    mockOnly: true,
  }
}

export class MockProjectEditBriefRepository implements ProjectEditBriefRepository {
  public readonly context: ProjectEditBriefRepositoryContext
  private readonly db: MockDatabase

  constructor(db: MockDatabase, input: Omit<CreateMockProjectEditBriefRepositoryInput, 'db'> = {}) {
    this.db = db
    this.context = {
      mode: 'mock_database',
      status: 'ready_mock',
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      editSessionId: input.editSessionId,
      briefId: input.briefId,
      userId: input.userId,
      mockOnly: true,
      writeSafety: 'mock_write_only',
      notes: [
        'ProjectEditBrief mock repository uses in-memory MockDatabase collections only.',
        'No Supabase, storage, file-byte, URL fetch, media processing, provider, worker, render, or credit side effects occur.',
      ],
    }
    this.seedFixtureDataIfEmpty()
  }

  async getEditBrief(briefId: string): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefRecord | undefined>> {
    return this.success(this.findBrief(briefId), ['ProjectEditBrief get read from MockDatabase only.'])
  }

  async getEditBriefForSession(editSessionId: string): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefRecord | undefined>> {
    const brief = sortByUpdatedAt(this.db.projectEditBriefs
      .filter((candidate) => candidate.editSessionId === editSessionId)
      .filter((candidate) => candidate.status !== 'archived'))[0]
    return this.success(brief, ['ProjectEditBrief session lookup read from MockDatabase only.'])
  }

  async createEditBrief(input: CreateProjectEditBriefRepositoryInput): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefRecord>> {
    const timestamp = nowIso()
    const brief: ProjectEditBriefRecord = {
      id: input.id ?? createMockId('project-edit-brief'),
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
      mockOnly: true,
      metadata: {
        ...(input.metadata ?? {}),
        repositoryCreated: true,
        optionalEditBrief: true,
      },
    }
    return this.success(upsert(this.db.projectEditBriefs, brief), ['ProjectEditBrief created in MockDatabase only.'])
  }

  async updateEditBrief(input: UpdateProjectEditBriefRepositoryInput): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefRecord>> {
    const brief = this.findBrief(input.briefId)
    if (!brief) return this.notFound('ProjectEditBrief was not found.', { briefId: input.briefId })
    Object.assign(brief, input.patch, {
      updatedAt: nowIso(),
      mockOnly: true,
    })
    return this.success(brief, ['ProjectEditBrief updated in MockDatabase only.'])
  }

  async archiveEditBrief(briefId: string): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefRecord>> {
    const brief = this.findBrief(briefId)
    if (!brief) return this.notFound('ProjectEditBrief was not found.', { briefId })
    brief.status = 'archived'
    brief.availability = 'optional_opened'
    brief.updatedAt = nowIso()
    return this.success(brief, ['ProjectEditBrief archived in MockDatabase only.'])
  }

  async listMarkers(briefId: string): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefMarkerRecord[]>> {
    return this.success(this.markersForBrief(briefId), ['ProjectEditBrief markers listed from MockDatabase only.'])
  }

  async getMarker(markerId: string): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefMarkerRecord | undefined>> {
    return this.success(this.findMarker(markerId), ['ProjectEditBrief marker get read from MockDatabase only.'])
  }

  async createMarker(input: CreateProjectEditBriefMarkerRepositoryInput): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefMarkerRecord>> {
    const timestamp = nowIso()
    const marker: ProjectEditBriefMarkerRecord = {
      ...input.marker,
      id: input.id ?? createMockId('project-edit-brief-marker'),
      projectId: input.projectId,
      editSessionId: input.editSessionId,
      briefId: input.briefId,
      attachmentCount: 0,
      messageCount: 0,
      createdAt: input.marker.createdAt ?? timestamp,
      updatedAt: input.marker.updatedAt ?? timestamp,
      mockOnly: true,
    }
    upsert(this.db.projectEditBriefMarkers, marker)
    this.recomputeBriefCounts(input.briefId)
    return this.success(marker, ['ProjectEditBrief marker created in MockDatabase only.'])
  }

  async updateMarker(input: UpdateProjectEditBriefMarkerRepositoryInput): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefMarkerRecord>> {
    const marker = this.findMarker(input.markerId)
    if (!marker) return this.notFound('ProjectEditBrief marker was not found.', { markerId: input.markerId })
    Object.assign(marker, input.patch, {
      updatedAt: nowIso(),
      mockOnly: true,
    })
    this.recomputeBriefCounts(marker.briefId)
    this.recomputeMarkerCounts(marker.id)
    return this.success(marker, ['ProjectEditBrief marker updated in MockDatabase only.'])
  }

  async deleteMarker(markerId: string): Promise<ProjectEditBriefRepositoryResult<{ markerId: string; deleted: true }>> {
    const marker = this.findMarker(markerId)
    if (!marker) return this.notFound('ProjectEditBrief marker was not found.', { markerId })
    this.db.projectEditBriefMarkers = this.db.projectEditBriefMarkers.filter((candidate) => candidate.id !== markerId)
    this.db.projectEditBriefMarkerAttachments = this.db.projectEditBriefMarkerAttachments.filter((candidate) => candidate.markerId !== markerId)
    this.db.projectEditBriefMarkerMessages = this.db.projectEditBriefMarkerMessages.filter((candidate) => candidate.markerId !== markerId)
    this.db.projectEditBriefMarkerIntents = this.db.projectEditBriefMarkerIntents.filter((candidate) => candidate.markerId !== markerId)
    this.db.projectEditBriefMarkerConfirmations = this.db.projectEditBriefMarkerConfirmations.filter((candidate) => candidate.markerId !== markerId)
    this.db.projectEditBriefMarkerConflicts = this.db.projectEditBriefMarkerConflicts.filter((candidate) =>
      candidate.markerId !== markerId && candidate.relatedMarkerId !== markerId,
    )
    this.db.projectEditBriefMarkerRevisions = this.db.projectEditBriefMarkerRevisions.filter((candidate) => candidate.markerId !== markerId)
    this.db.projectEditBriefApplicationLogs = this.db.projectEditBriefApplicationLogs.filter((candidate) => candidate.markerId !== markerId)
    this.recomputeBriefCounts(marker.briefId)
    return this.success({ markerId, deleted: true }, ['ProjectEditBrief marker and marker-scoped children hard-deleted in MockDatabase only.'])
  }

  async confirmMarker(input: ConfirmProjectEditBriefMarkerRepositoryInput): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefMarkerRecord>> {
    const marker = this.findMarker(input.markerId)
    if (!marker) return this.notFound('ProjectEditBrief marker was not found.', { markerId: input.markerId })
    marker.status = 'confirmed'
    marker.qaStatus = 'passed'
    marker.intentId = input.intentId ?? marker.intentId
    marker.updatedAt = nowIso()
    const intentId = marker.intentId ?? createMockId('project-edit-brief-intent')
    this.saveMarkerConfirmation({
      projectId: marker.projectId,
      editSessionId: marker.editSessionId,
      briefId: marker.briefId,
      markerId: marker.id,
      intentId,
      summary: input.summary,
      confirmedByUser: true,
      aiMode: marker.aiMode,
    })
    this.recomputeMarkerCounts(marker.id)
    this.recomputeBriefCounts(marker.briefId)
    return this.success(marker, ['ProjectEditBrief marker confirmed in MockDatabase only.'])
  }

  async archiveMarker(markerId: string): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefMarkerRecord>> {
    const marker = this.findMarker(markerId)
    if (!marker) return this.notFound('ProjectEditBrief marker was not found.', { markerId })
    marker.status = 'archived'
    marker.updatedAt = nowIso()
    this.recomputeBriefCounts(marker.briefId)
    return this.success(marker, ['ProjectEditBrief marker archived in MockDatabase only.'])
  }

  async listMarkerAttachments(markerId: string): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefMarkerAttachmentRecord[]>> {
    const attachments = sortByCreatedAt(this.db.projectEditBriefMarkerAttachments.filter((attachment) => attachment.markerId === markerId))
    return this.success(attachments, ['ProjectEditBrief marker attachments listed from MockDatabase only.'])
  }

  async addMarkerAttachment(input: AddProjectEditBriefMarkerAttachmentRepositoryInput): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefMarkerAttachmentRecord>> {
    const timestamp = nowIso()
    const attachment: ProjectEditBriefMarkerAttachmentRecord = {
      ...input.attachment,
      id: input.id ?? createMockId('project-edit-brief-attachment'),
      projectId: input.projectId,
      editSessionId: input.editSessionId,
      briefId: input.briefId,
      markerId: input.markerId,
      createdAt: input.attachment.createdAt ?? timestamp,
      updatedAt: input.attachment.updatedAt ?? timestamp,
      mockOnly: true,
    }
    upsert(this.db.projectEditBriefMarkerAttachments, attachment)
    this.recomputeMarkerCounts(input.markerId)
    return this.success(attachment, ['ProjectEditBrief marker attachment saved as metadata-only mock record.'])
  }

  async removeMarkerAttachment(attachmentId: string): Promise<ProjectEditBriefRepositoryResult<{ attachmentId: string; removed: true }>> {
    const attachment = this.db.projectEditBriefMarkerAttachments.find((candidate) => candidate.id === attachmentId)
    if (!attachment) return this.notFound('ProjectEditBrief marker attachment was not found.', { attachmentId })
    this.db.projectEditBriefMarkerAttachments = this.db.projectEditBriefMarkerAttachments.filter((candidate) => candidate.id !== attachmentId)
    this.recomputeMarkerCounts(attachment.markerId)
    return this.success({ attachmentId, removed: true }, ['ProjectEditBrief marker attachment removed from MockDatabase only.'])
  }

  async listMarkerMessages(markerId: string): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefMarkerMessageRecord[]>> {
    const messages = sortByCreatedAt(this.db.projectEditBriefMarkerMessages.filter((message) => message.markerId === markerId))
    return this.success(messages, ['Marker Chat messages listed from MockDatabase only.'])
  }

  async appendMarkerMessage(input: AppendProjectEditBriefMarkerMessageRepositoryInput): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefMarkerMessageRecord>> {
    const message: ProjectEditBriefMarkerMessageRecord = {
      ...input.message,
      id: input.id ?? createMockId('project-edit-brief-marker-message'),
      projectId: input.projectId,
      editSessionId: input.editSessionId,
      briefId: input.briefId,
      markerId: input.markerId,
      createdAt: input.message.createdAt ?? nowIso(),
      mockOnly: true,
    }
    upsert(this.db.projectEditBriefMarkerMessages, message)
    this.recomputeMarkerCounts(input.markerId)
    return this.success(message, ['Marker Chat message appended in MockDatabase only.'])
  }

  async getMarkerIntent(markerId: string): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefMarkerIntentRecord | undefined>> {
    return this.success(this.db.projectEditBriefMarkerIntents.find((intent) => intent.markerId === markerId), ['ProjectEditBrief marker intent read from MockDatabase only.'])
  }

  async saveMarkerIntent(input: SaveProjectEditBriefMarkerIntentRepositoryInput): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefMarkerIntentRecord>> {
    const timestamp = nowIso()
    const intent: ProjectEditBriefMarkerIntentRecord = {
      ...input.intent,
      id: input.id ?? createMockId('project-edit-brief-intent'),
      projectId: input.projectId,
      editSessionId: input.editSessionId,
      briefId: input.briefId,
      markerId: input.markerId,
      createdAt: input.intent.createdAt ?? timestamp,
      updatedAt: input.intent.updatedAt ?? timestamp,
      mockOnly: true,
    }
    upsert(this.db.projectEditBriefMarkerIntents, intent)
    const marker = this.findMarker(input.markerId)
    if (marker) {
      marker.intentId = intent.id
      marker.updatedAt = timestamp
    }
    return this.success(intent, ['ProjectEditBrief marker intent saved in MockDatabase only.'])
  }

  async updateMarkerIntent(input: UpdateProjectEditBriefMarkerIntentRepositoryInput): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefMarkerIntentRecord>> {
    const intent = this.db.projectEditBriefMarkerIntents.find((candidate) => candidate.id === input.intentId)
    if (!intent) return this.notFound('ProjectEditBrief marker intent was not found.', { intentId: input.intentId })
    Object.assign(intent, input.patch, {
      updatedAt: nowIso(),
      mockOnly: true,
    })
    return this.success(intent, ['ProjectEditBrief marker intent updated in MockDatabase only.'])
  }

  async listMarkerConfirmations(markerId: string): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefMarkerConfirmationRecord[]>> {
    const confirmations = sortByCreatedAt(this.db.projectEditBriefMarkerConfirmations.filter((confirmation) => confirmation.markerId === markerId))
    return this.success(confirmations, ['ProjectEditBrief marker confirmations listed from MockDatabase only.'])
  }

  async saveMarkerConfirmation(input: SaveProjectEditBriefMarkerConfirmationRepositoryInput): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefMarkerConfirmationRecord>> {
    const confirmation: ProjectEditBriefMarkerConfirmationRecord = {
      id: input.id ?? createMockId('project-edit-brief-confirmation'),
      projectId: input.projectId,
      editSessionId: input.editSessionId,
      briefId: input.briefId,
      markerId: input.markerId,
      intentId: input.intentId,
      summary: input.summary,
      confirmedByUser: input.confirmedByUser ?? true,
      aiMode: input.aiMode ?? 'confirm_only',
      createdAt: input.createdAt ?? nowIso(),
      mockOnly: true,
      metadata: {
        ...(input.metadata ?? {}),
        markerChatScoped: true,
      },
    }
    upsert(this.db.projectEditBriefMarkerConfirmations, confirmation)
    return this.success(confirmation, ['ProjectEditBrief marker confirmation saved in MockDatabase only.'])
  }

  async listMarkerConflicts(input: ListProjectEditBriefMarkerConflictsRepositoryInput): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefMarkerConflictRecord[]>> {
    const conflicts = sortByCreatedAt(this.db.projectEditBriefMarkerConflicts
      .filter((conflict) => input.briefId ? conflict.briefId === input.briefId : true)
      .filter((conflict) => input.markerId ? conflict.markerId === input.markerId : true))
    return this.success(conflicts, ['ProjectEditBrief marker conflicts listed from MockDatabase only.'])
  }

  async saveMarkerConflict(input: SaveProjectEditBriefMarkerConflictRepositoryInput): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefMarkerConflictRecord>> {
    const conflict: ProjectEditBriefMarkerConflictRecord = {
      ...input.conflict,
      id: input.id ?? createMockId('project-edit-brief-conflict'),
      projectId: input.projectId,
      editSessionId: input.editSessionId,
      briefId: input.briefId,
      markerId: input.markerId,
      createdAt: input.conflict.createdAt ?? nowIso(),
      mockOnly: true,
    }
    upsert(this.db.projectEditBriefMarkerConflicts, conflict)
    const marker = this.findMarker(input.markerId)
    if (marker) {
      marker.status = 'conflict'
      marker.qaStatus = 'conflict'
      marker.updatedAt = nowIso()
    }
    this.recomputeBriefCounts(input.briefId)
    return this.success(conflict, ['ProjectEditBrief marker conflict saved in MockDatabase only.'])
  }

  async listMarkerRevisions(markerId: string): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefMarkerRevisionRecord[]>> {
    const revisions = sortByCreatedAt(this.db.projectEditBriefMarkerRevisions.filter((revision) => revision.markerId === markerId))
    return this.success(revisions, ['ProjectEditBrief marker revisions listed from MockDatabase only.'])
  }

  async saveMarkerRevision(input: SaveProjectEditBriefMarkerRevisionRepositoryInput): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefMarkerRevisionRecord>> {
    const revision: ProjectEditBriefMarkerRevisionRecord = {
      ...input.revision,
      id: input.id ?? createMockId('project-edit-brief-revision'),
      projectId: input.projectId,
      editSessionId: input.editSessionId,
      briefId: input.briefId,
      markerId: input.markerId,
      createdAt: input.revision.createdAt ?? nowIso(),
      mockOnly: true,
    }
    upsert(this.db.projectEditBriefMarkerRevisions, revision)
    return this.success(revision, ['ProjectEditBrief marker revision saved in MockDatabase only.'])
  }

  async listApplicationLogs(briefId: string): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefApplicationLogRecord[]>> {
    const logs = sortByCreatedAt(this.db.projectEditBriefApplicationLogs.filter((log) => log.briefId === briefId))
    return this.success(logs, ['ProjectEditBrief application logs listed from MockDatabase only.'])
  }

  async appendApplicationLog(input: AppendProjectEditBriefApplicationLogRepositoryInput): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefApplicationLogRecord>> {
    const log: ProjectEditBriefApplicationLogRecord = {
      id: input.id ?? createMockId('project-edit-brief-application-log'),
      projectId: input.projectId,
      editSessionId: input.editSessionId,
      briefId: input.briefId,
      markerId: input.markerId,
      summary: input.summary,
      appliedToPlan: input.appliedToPlan ?? false,
      createdAt: input.createdAt ?? nowIso(),
      mockOnly: true,
      metadata: input.metadata,
    }
    upsert(this.db.projectEditBriefApplicationLogs, log)
    return this.success(log, ['ProjectEditBrief application log appended in MockDatabase only.'])
  }

  async getExportSettings(editSessionId: string): Promise<ProjectEditBriefRepositoryResult<ProjectEditSessionExportSettingsRecord | undefined>> {
    return this.success(this.db.projectEditSessionExportSettings.find((settings) => settings.editSessionId === editSessionId), ['ProjectEditSession export settings read for Edit Brief use only.'])
  }

  async recommendExportSettings(input: RecommendProjectEditSessionExportSettingsRepositoryInput): Promise<ProjectEditBriefRepositoryResult<ProjectEditSessionExportSettingsRecord>> {
    const existing = this.db.projectEditSessionExportSettings.find((settings) => settings.editSessionId === input.editSessionId)
    if (existing) return this.success(existing, ['Existing ProjectEditSession export settings reused for Edit Brief.'])
    const settings = recommendProjectEditBriefExportSettings({
      projectId: input.projectId,
      editSessionId: input.editSessionId,
      platformTarget: input.platformTarget,
      aspectRatio: input.aspectRatio,
      customAspectRatio: input.customAspectRatio,
      presetId: input.presetId,
      id: createMockId('project-edit-session-export-settings'),
      createdAt: nowIso(),
    }).exportSettings
    upsert(this.db.projectEditSessionExportSettings, settings)
    return this.success(settings, ['ProjectEditSession export settings recommended as mock metadata only.'])
  }

  async updateExportSettings(input: UpdateProjectEditSessionExportSettingsRepositoryInput): Promise<ProjectEditBriefRepositoryResult<ProjectEditSessionExportSettingsRecord>> {
    const settings = input.exportSettingsId
      ? this.db.projectEditSessionExportSettings.find((candidate) => candidate.id === input.exportSettingsId)
      : this.db.projectEditSessionExportSettings.find((candidate) => candidate.editSessionId === input.editSessionId)
    if (!settings) return this.notFound('ProjectEditSession export settings were not found.', input)
    Object.assign(settings, input.patch, {
      source: input.patch.source ?? 'user_override_mock',
      updatedAt: nowIso(),
      mockOnly: true,
    })
    return this.success(settings, ['ProjectEditSession export settings updated as mock metadata only.'])
  }

  async createTimelineMarkerModels(briefId: string): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefTimelineMarkerModel[]>> {
    return this.success(createProjectEditBriefTimelineMarkerModels(this.markersForBrief(briefId)), ['ProjectEditBrief timeline models created without UI route changes.'])
  }

  async createMarkerDrawerModel(markerId: string): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefMarkerDrawerModel>> {
    const marker = this.findMarker(markerId)
    if (!marker) return this.notFound('ProjectEditBrief marker was not found.', { markerId })
    return this.success(createProjectEditBriefDrawerModel(marker, this.fixtureFromDatabase()), ['ProjectEditBrief marker drawer model created from repository state.'])
  }

  async createBriefBundle(briefId: string): Promise<ProjectEditBriefRepositoryResult<ProjectEditBriefBundleRecord>> {
    const brief = this.findBrief(briefId)
    if (!brief) return this.notFound('ProjectEditBrief was not found.', { briefId })
    return this.success(createProjectEditBriefBundle(brief, this.fixtureFromDatabase()), ['ProjectEditBrief bundle created from repository state.'])
  }

  async createBriefSummary(briefId: string): Promise<ProjectEditBriefRepositoryResult<string>> {
    const brief = this.findBrief(briefId)
    if (!brief) return this.notFound('ProjectEditBrief was not found.', { briefId })
    return this.success(createProjectEditBriefReadableSummary(brief), ['ProjectEditBrief summary created from repository state.'])
  }

  private success<T>(data: T, warnings: string[] = []): ProjectEditBriefRepositoryResult<T> {
    return safeResult(this.context, {
      ok: true,
      data: clone(data),
      warnings,
    })
  }

  private notFound<T>(message: string, details: unknown): ProjectEditBriefRepositoryResult<T> {
    return safeResult(this.context, {
      ok: false,
      error: {
        code: 'EDIT_PREFERENCE_NOT_FOUND',
        message,
      },
      warnings: [
        'ProjectEditBrief repository miss is safe; no production persistence or side effects were attempted.',
        JSON.stringify(details),
      ],
    })
  }

  private findBrief(briefId: string): ProjectEditBriefRecord | undefined {
    return this.db.projectEditBriefs.find((brief) => brief.id === briefId)
  }

  private findMarker(markerId: string): ProjectEditBriefMarkerRecord | undefined {
    return this.db.projectEditBriefMarkers.find((marker) => marker.id === markerId)
  }

  private markersForBrief(briefId: string): ProjectEditBriefMarkerRecord[] {
    return [...this.db.projectEditBriefMarkers]
      .filter((marker) => marker.briefId === briefId)
      .sort((a, b) => a.startTimeSeconds - b.startTimeSeconds || a.id.localeCompare(b.id))
  }

  private recomputeMarkerCounts(markerId: string): void {
    const marker = this.findMarker(markerId)
    if (!marker) return
    marker.attachmentCount = this.db.projectEditBriefMarkerAttachments.filter((attachment) => attachment.markerId === markerId).length
    marker.messageCount = this.db.projectEditBriefMarkerMessages.filter((message) => message.markerId === markerId).length
    marker.updatedAt = nowIso()
  }

  private recomputeBriefCounts(briefId: string): void {
    const brief = this.findBrief(briefId)
    if (!brief) return
    const markers = this.db.projectEditBriefMarkers.filter((marker) => marker.briefId === briefId && marker.status !== 'archived')
    const conflicts = this.db.projectEditBriefMarkerConflicts.filter((conflict) => conflict.briefId === briefId)
    brief.markerCount = markers.length
    brief.confirmedMarkerCount = markers.filter((marker) =>
      marker.status === 'confirmed' || marker.status === 'ready_for_plan' || marker.status === 'applied_to_plan',
    ).length
    brief.conflictCount = conflicts.length
    brief.needsAssetCount = markers.filter((marker) => marker.status === 'needs_asset').length
    brief.needsClarificationCount = markers.filter((marker) => marker.status === 'needs_clarification').length
    brief.availability = brief.conflictCount > 0
      ? 'has_conflicts'
      : brief.markerCount === 0 ? 'optional_opened'
        : brief.confirmedMarkerCount === brief.markerCount ? 'ready_for_plan'
          : brief.confirmedMarkerCount > 0 ? 'has_confirmed_markers'
            : 'has_markers'
    if (brief.conflictCount > 0) brief.status = 'needs_review'
    brief.updatedAt = nowIso()
  }

  private fixtureFromDatabase() {
    const markers = this.db.projectEditBriefMarkers
    return {
      briefs: this.db.projectEditBriefs,
      markers,
      attachments: this.db.projectEditBriefMarkerAttachments,
      messages: this.db.projectEditBriefMarkerMessages,
      intents: this.db.projectEditBriefMarkerIntents,
      confirmations: this.db.projectEditBriefMarkerConfirmations,
      conflicts: this.db.projectEditBriefMarkerConflicts,
      revisions: this.db.projectEditBriefMarkerRevisions,
      applicationLogs: this.db.projectEditBriefApplicationLogs,
      exportSettings: this.db.projectEditSessionExportSettings,
      timelineMarkers: createProjectEditBriefTimelineMarkerModels(markers),
      bundles: this.db.projectEditBriefs.map((brief) => createProjectEditBriefBundle(brief, {
        briefs: this.db.projectEditBriefs,
        markers,
        attachments: this.db.projectEditBriefMarkerAttachments,
        messages: this.db.projectEditBriefMarkerMessages,
        intents: this.db.projectEditBriefMarkerIntents,
        confirmations: this.db.projectEditBriefMarkerConfirmations,
        conflicts: this.db.projectEditBriefMarkerConflicts,
        revisions: this.db.projectEditBriefMarkerRevisions,
        applicationLogs: this.db.projectEditBriefApplicationLogs,
        exportSettings: this.db.projectEditSessionExportSettings,
        timelineMarkers: createProjectEditBriefTimelineMarkerModels(markers),
        bundles: [],
      })),
    }
  }

  private seedFixtureDataIfEmpty(): void {
    if (this.db.projectEditBriefs.length > 0) return
    const fixture = createMockProjectEditBriefFixtureBundle()
    this.db.projectEditBriefs.push(...fixture.briefs.map(markFixtureRecord))
    this.db.projectEditBriefMarkers.push(...fixture.markers.map(markFixtureRecord))
    this.db.projectEditBriefMarkerAttachments.push(...fixture.attachments.map(markFixtureRecord))
    this.db.projectEditBriefMarkerMessages.push(...fixture.messages.map(markFixtureRecord))
    this.db.projectEditBriefMarkerIntents.push(...fixture.intents.map(markFixtureRecord))
    this.db.projectEditBriefMarkerConfirmations.push(...fixture.confirmations.map(markFixtureRecord))
    this.db.projectEditBriefMarkerConflicts.push(...fixture.conflicts.map(markFixtureRecord))
    this.db.projectEditBriefMarkerRevisions.push(...fixture.revisions.map(markFixtureRecord))
    this.db.projectEditBriefApplicationLogs.push(...fixture.applicationLogs.map(markFixtureRecord))
    this.db.projectEditSessionExportSettings.push(...fixture.exportSettings.map(markFixtureRecord))
  }
}

export function createMockProjectEditBriefRepository(
  input: CreateMockProjectEditBriefRepositoryInput,
): MockProjectEditBriefRepository {
  return new MockProjectEditBriefRepository(input.db, input)
}
