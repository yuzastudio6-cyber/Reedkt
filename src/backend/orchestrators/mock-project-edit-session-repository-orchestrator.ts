import type {
  ProjectEditSessionBundleRecord,
  ProjectEditSessionRepositoryContext,
  ProjectEditSessionRepositoryResult,
} from '../../types/project-edit-session-repository'
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
import { createMockDatabase } from '../mock/mock-database'
import { createMockProjectEditSessionRepository } from '../repositories/mock-project-edit-session-repository'
import { createSupabaseDisabledProjectEditSessionRepository } from '../repositories/supabase-project-edit-session-repository'
import {
  createProjectEditSessionRepositoryReadinessSummary,
  createProjectEditSessionRepositorySummary,
} from '../repositories/project-edit-session-repository-summary-service'

export interface MockProjectEditSessionRepositoryOrchestratorResult {
  repositoryContext: ProjectEditSessionRepositoryContext
  sessions: ProjectEditSessionRecord[]
  cardModels: ProjectEditSessionCardModel[]
  messages: ProjectEditSessionMessageRecord[]
  sources: ProjectEditSessionSourceRecord[]
  memories: ProjectEditSessionMemoryRecord[]
  snapshots: ProjectEditSessionSnapshotRecord[]
  versions: ProjectEditSessionVersionRecord[]
  previews: ProjectEditSessionPreviewRecord[]
  revisions: ProjectEditSessionRevisionRecord[]
  events: ProjectEditSessionEventRecord[]
  bundle?: ProjectEditSessionBundleRecord
  operationResult?: ProjectEditSessionRepositoryResult<unknown>
  readinessSummary: string[]
  warnings: string[]
  nextStep: 'RP-EDITSESSION-04 — API Routes + Client Layer'
}

function emptyResult(
  context: ProjectEditSessionRepositoryContext,
  operationResult?: ProjectEditSessionRepositoryResult<unknown>,
): MockProjectEditSessionRepositoryOrchestratorResult {
  return {
    repositoryContext: context,
    sessions: [],
    cardModels: [],
    messages: [],
    sources: [],
    memories: [],
    snapshots: [],
    versions: [],
    previews: [],
    revisions: [],
    events: [],
    operationResult,
    readinessSummary: createProjectEditSessionRepositoryReadinessSummary(context),
    warnings: [
      ...context.notes,
      ...(operationResult?.warnings ?? []),
    ],
    nextStep: 'RP-EDITSESSION-04 — API Routes + Client Layer',
  }
}

async function createRepository() {
  const db = createMockDatabase()
  const repository = createMockProjectEditSessionRepository({ db, projectId: 'mock-project-edit-chat-foundation' })
  const list = await repository.listProjectEditSessions('mock-project-edit-chat-foundation')
  const session = list.data?.[0]
  return { db, repository, session }
}

export async function runMockProjectEditSessionRepositoryFlow(): Promise<MockProjectEditSessionRepositoryOrchestratorResult> {
  const { repository, session } = await createRepository()
  if (!session) return emptyResult(repository.context)
  const [messages, sources, memories, snapshots, versions, previews, revisions, events, cards, bundle] = await Promise.all([
    repository.listSessionMessages(session.id),
    repository.listSessionSources(session.id),
    repository.listSessionMemory(session.id),
    repository.listSessionSnapshots(session.id),
    repository.listSessionVersions(session.id),
    repository.listSessionPreviews(session.id),
    repository.listSessionRevisions(session.id),
    repository.listSessionEvents(session.id),
    repository.listSessionCardModels(session.projectId),
    repository.createSessionBundle(session.id),
  ])
  return {
    ...emptyResult(repository.context, bundle),
    sessions: (await repository.listProjectEditSessions(session.projectId)).data ?? [],
    cardModels: cards.data ?? [],
    messages: messages.data ?? [],
    sources: sources.data ?? [],
    memories: memories.data ?? [],
    snapshots: snapshots.data ?? [],
    versions: versions.data ?? [],
    previews: previews.data ?? [],
    revisions: revisions.data ?? [],
    events: events.data ?? [],
    bundle: bundle.data,
  }
}

export async function runMockProjectEditSessionListFlow(): Promise<MockProjectEditSessionRepositoryOrchestratorResult> {
  const { repository } = await createRepository()
  const sessions = await repository.listProjectEditSessions('mock-project-edit-chat-foundation')
  const cardModels = await repository.listSessionCardModels('mock-project-edit-chat-foundation')
  return {
    ...emptyResult(repository.context, sessions),
    sessions: sessions.data ?? [],
    cardModels: cardModels.data ?? [],
  }
}

export async function runMockProjectEditSessionCreateFlow(): Promise<MockProjectEditSessionRepositoryOrchestratorResult> {
  const { repository } = await createRepository()
  const created = await repository.createProjectEditSession({
    projectId: 'mock-project-edit-chat-foundation',
    name: 'Repository Created Edit Chat',
    aspectRatio: '9:16',
    platformTarget: 'instagram_reel',
    selectedEditLevel: 'premium',
  })
  return {
    ...emptyResult(repository.context, created),
    sessions: created.data ? [created.data] : [],
  }
}

export async function runMockProjectEditSessionDuplicateFlow(): Promise<MockProjectEditSessionRepositoryOrchestratorResult> {
  const { repository, session } = await createRepository()
  const duplicated = session
    ? await repository.duplicateProjectEditSession({ editSessionId: session.id, newName: `${session.name} Repository Copy` })
    : undefined
  return {
    ...emptyResult(repository.context, duplicated),
    sessions: duplicated?.data ? [duplicated.data] : [],
  }
}

export async function runMockProjectEditSessionMessageFlow(): Promise<MockProjectEditSessionRepositoryOrchestratorResult> {
  const { repository, session } = await createRepository()
  if (!session) return emptyResult(repository.context)
  const appended = await repository.appendSessionMessage({
    projectId: session.projectId,
    editSessionId: session.id,
    role: 'user',
    kind: 'text',
    text: 'Repository flow message.',
  })
  return {
    ...emptyResult(repository.context, appended),
    messages: (await repository.listSessionMessages(session.id)).data ?? [],
  }
}

export async function runMockProjectEditSessionSourceFlow(): Promise<MockProjectEditSessionRepositoryOrchestratorResult> {
  const { repository, session } = await createRepository()
  if (!session) return emptyResult(repository.context)
  const saved = await repository.saveSessionSource({
    projectId: session.projectId,
    editSessionId: session.id,
    mediaAssetId: `${session.id}-repository-source`,
    sourceOrderIndex: 9,
    importance: 'broll',
    notes: ['Repository source metadata only.'],
  })
  return {
    ...emptyResult(repository.context, saved),
    sources: (await repository.listSessionSources(session.id)).data ?? [],
  }
}

export async function runMockProjectEditSessionMemoryFlow(): Promise<MockProjectEditSessionRepositoryOrchestratorResult> {
  const { repository, session } = await createRepository()
  if (!session) return emptyResult(repository.context)
  const memory = await repository.upsertSessionMemory({
    projectId: session.projectId,
    editSessionId: session.id,
    layer: 'session_memory',
    summary: 'Repository memory flow updated session memory.',
    facts: ['Repository-only mock memory.'],
    preferences: ['Keep Edit Chat distinct from Edit Preference.'],
  })
  return {
    ...emptyResult(repository.context, memory),
    memories: (await repository.listSessionMemory(session.id)).data ?? [],
  }
}

export async function runMockProjectEditSessionSnapshotFlow(): Promise<MockProjectEditSessionRepositoryOrchestratorResult> {
  const { repository, session } = await createRepository()
  if (!session) return emptyResult(repository.context)
  const snapshot = await repository.saveSessionSnapshot({
    projectId: session.projectId,
    editSessionId: session.id,
    kind: 'manual_checkpoint',
    summary: 'Repository checkpoint.',
    state: { mockOnly: true },
  })
  return {
    ...emptyResult(repository.context, snapshot),
    snapshots: (await repository.listSessionSnapshots(session.id)).data ?? [],
  }
}

export async function runMockProjectEditSessionVersionPreviewFlow(): Promise<MockProjectEditSessionRepositoryOrchestratorResult> {
  const { repository, session } = await createRepository()
  if (!session) return emptyResult(repository.context)
  const version = await repository.saveSessionVersion({
    projectId: session.projectId,
    editSessionId: session.id,
    name: 'Repository v2',
    summary: 'Repository version flow.',
  })
  const preview = await repository.saveSessionPreview({
    projectId: session.projectId,
    editSessionId: session.id,
    versionId: version.data?.id,
    status: 'placeholder_mock',
    aspectRatio: session.aspectRatio,
  })
  return {
    ...emptyResult(repository.context, preview),
    versions: (await repository.listSessionVersions(session.id)).data ?? [],
    previews: (await repository.listSessionPreviews(session.id)).data ?? [],
  }
}

export async function runMockProjectEditSessionRevisionEventFlow(): Promise<MockProjectEditSessionRepositoryOrchestratorResult> {
  const { repository, session } = await createRepository()
  if (!session) return emptyResult(repository.context)
  const revision = await repository.saveSessionRevision({
    projectId: session.projectId,
    editSessionId: session.id,
    requestedByMessageId: `${session.id}-message-user-brief`,
    summary: 'Repository revision flow.',
    userInstruction: 'Make captions smaller.',
    resetsApproval: true,
  })
  const event = await repository.appendSessionEvent({
    projectId: session.projectId,
    editSessionId: session.id,
    eventType: 'repository_revision_saved',
    summary: 'Repository revision event saved.',
  })
  return {
    ...emptyResult(repository.context, revision),
    revisions: (await repository.listSessionRevisions(session.id)).data ?? [],
    events: event.data ? [event.data] : [],
  }
}

export async function runMockProjectEditSessionBundleFlow(): Promise<MockProjectEditSessionRepositoryOrchestratorResult> {
  const { repository, session } = await createRepository()
  const bundle = session ? await repository.createSessionBundle(session.id) : undefined
  return {
    ...emptyResult(repository.context, bundle),
    bundle: bundle?.data,
  }
}

export async function runSupabaseDisabledProjectEditSessionRepositoryFlow(): Promise<MockProjectEditSessionRepositoryOrchestratorResult> {
  const repository = createSupabaseDisabledProjectEditSessionRepository({ projectId: 'mock-project-edit-chat-foundation' })
  const result = await repository.listProjectEditSessions('mock-project-edit-chat-foundation')
  return emptyResult(repository.context, result)
}

export async function runProjectEditSessionRepositoryReadinessFlow(): Promise<MockProjectEditSessionRepositoryOrchestratorResult> {
  const { repository } = await createRepository()
  const summary = createProjectEditSessionRepositorySummary(repository.context, 32)
  return {
    ...emptyResult(repository.context),
    readinessSummary: [
      ...createProjectEditSessionRepositoryReadinessSummary(repository.context),
      ...summary.summary,
    ],
  }
}
