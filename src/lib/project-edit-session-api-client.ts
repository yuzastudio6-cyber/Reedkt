import type {
  ProjectEditSessionApiRouteId,
  ReeditProApiRequestEnvelope,
  ReeditProApiResponseEnvelope,
} from '../types/api-routes'
import type {
  ProjectEditSessionAspectRatio,
  ProjectEditSessionMemoryLayer,
  ProjectEditSessionMessageKind,
  ProjectEditSessionMessageRole,
  ProjectEditSessionPlatformTarget,
  ProjectEditSessionPreviewStatus,
  ProjectEditSessionSnapshotKind,
  ProjectEditSessionSourceImportance,
  ProjectEditSessionStatus,
  ProjectEditSessionVersionStatus,
} from '../types/project-edit-session'
import type { UserFacingEditLevel } from '../types/reeditpro'
import { createMockDatabase, type MockDatabase } from '../backend/mock/mock-database'
import { createMockProjectEditSessionRepository } from '../backend/repositories/mock-project-edit-session-repository'
import type { ProjectEditSessionRepositoryResult } from '../types/project-edit-session-repository'
import {
  applyPreferenceToProjectEditSessionMock,
  clearPreferenceFromProjectEditSessionMock,
  createProjectEditSessionPreferenceApplicationSummary,
} from '../backend/project-edit-session-preference/project-edit-session-preference-application-service'
import {
  findProjectEditSessionPreferenceOption,
  listProjectEditSessionPreferenceOptions,
} from '../backend/project-edit-session-preference/project-edit-session-preference-option-service'
import { createPreferenceStateFromSession } from '../backend/project-edit-session-preference/project-edit-session-preference-state-service'
import {
  createProjectEditSessionPreferencePanelModel,
  createProjectEditSessionPreferenceReadableSummary,
} from '../backend/project-edit-session-preference/project-edit-session-preference-summary-service'
import { loadPreferenceDNASummaryForSessionPreference } from '../backend/project-edit-session-preference/project-edit-session-preference-dna-bridge-service'
import { validateProjectEditSessionPreferenceApplicationPlan } from '../backend/project-edit-session-preference/project-edit-session-preference-validation-service'
import type { ProjectEditSessionPreferenceApplicationPlan } from '../types/project-edit-session-preference'
import type { PreferenceApplicationRecord } from '../types/edit-reference'
import type {
  PreferenceApplicationDownstreamContext,
  ProjectEditSessionPreferenceIntegrationPlan,
} from '../types/edit-reference-integration'
import {
  createActivatePreferenceApplicationPlan,
  createStagePreferenceApplicationPlan,
} from '../backend/project-edit-session-preference/project-edit-session-preference-application-integration-service'
import {
  createPreferenceApplicationTargetSessionReceipt,
  readPreferenceApplicationIntegrationState,
} from './edit-reference-downstream-context'
import type {
  ReeditProApiClientOptions,
  ReeditProApiClientSafetySummary,
  ReeditProApiTransport,
} from './reeditpro-api-client-types'
import {
  PROJECT_EDIT_SESSION_API_CLIENT_SAFETY,
  createProjectEditSessionApiClientSummary,
} from './project-edit-session-api-client-summaries'

type RequestRecord = Record<string, unknown>

export interface ProjectEditSessionApiClientSafetySummary extends ReeditProApiClientSafetySummary {
  storageReadMade: false
  storageWriteMade: false
  fileBytesRead: false
  externalUrlFetched: false
  mediaProcessingStarted: false
}

export interface ProjectEditSessionApiClientOptions extends ReeditProApiClientOptions {
  mockDatabase?: MockDatabase
}

export interface ProjectEditSessionApiClient {
  transport: ReeditProApiTransport
  safety: ProjectEditSessionApiClientSafetySummary
  createEnvelope<TPayload = unknown>(routeId: ProjectEditSessionApiRouteId, payload?: TPayload): ReeditProApiRequestEnvelope<TPayload>
  request<TPayload = unknown, TData = unknown>(
    routeId: ProjectEditSessionApiRouteId,
    payload?: TPayload,
  ): Promise<ReeditProApiResponseEnvelope<TData>>
  sessions: {
    list<TData = unknown>(projectId: string): Promise<ReeditProApiResponseEnvelope<TData>>
    get<TData = unknown>(editSessionId: string): Promise<ReeditProApiResponseEnvelope<TData>>
    create<TData = unknown>(input: unknown): Promise<ReeditProApiResponseEnvelope<TData>>
    update<TData = unknown>(input: unknown): Promise<ReeditProApiResponseEnvelope<TData>>
    archive<TData = unknown>(editSessionId: string): Promise<ReeditProApiResponseEnvelope<TData>>
    duplicate<TData = unknown>(input: unknown): Promise<ReeditProApiResponseEnvelope<TData>>
  }
  cardModels: {
    list<TData = unknown>(projectId: string): Promise<ReeditProApiResponseEnvelope<TData>>
    get<TData = unknown>(editSessionId: string): Promise<ReeditProApiResponseEnvelope<TData>>
  }
  bundle: { get<TData = unknown>(editSessionId: string): Promise<ReeditProApiResponseEnvelope<TData>> }
  summary: { get<TData = unknown>(editSessionId: string): Promise<ReeditProApiResponseEnvelope<TData>> }
  messages: {
    list<TData = unknown>(editSessionId: string): Promise<ReeditProApiResponseEnvelope<TData>>
    append<TData = unknown>(input: unknown): Promise<ReeditProApiResponseEnvelope<TData>>
  }
  sources: {
    list<TData = unknown>(editSessionId: string): Promise<ReeditProApiResponseEnvelope<TData>>
    save<TData = unknown>(input: unknown): Promise<ReeditProApiResponseEnvelope<TData>>
    saveMany<TData = unknown>(input: unknown): Promise<ReeditProApiResponseEnvelope<TData>>
  }
  memory: {
    list<TData = unknown>(editSessionId: string): Promise<ReeditProApiResponseEnvelope<TData>>
    getLayer<TData = unknown>(input: unknown): Promise<ReeditProApiResponseEnvelope<TData>>
    upsert<TData = unknown>(input: unknown): Promise<ReeditProApiResponseEnvelope<TData>>
  }
  snapshots: {
    save<TData = unknown>(input: unknown): Promise<ReeditProApiResponseEnvelope<TData>>
    latest<TData = unknown>(editSessionId: string): Promise<ReeditProApiResponseEnvelope<TData>>
    list<TData = unknown>(editSessionId: string): Promise<ReeditProApiResponseEnvelope<TData>>
  }
  versions: {
    save<TData = unknown>(input: unknown): Promise<ReeditProApiResponseEnvelope<TData>>
    latest<TData = unknown>(editSessionId: string): Promise<ReeditProApiResponseEnvelope<TData>>
    list<TData = unknown>(editSessionId: string): Promise<ReeditProApiResponseEnvelope<TData>>
  }
  previews: {
    save<TData = unknown>(input: unknown): Promise<ReeditProApiResponseEnvelope<TData>>
    latest<TData = unknown>(editSessionId: string): Promise<ReeditProApiResponseEnvelope<TData>>
    list<TData = unknown>(editSessionId: string): Promise<ReeditProApiResponseEnvelope<TData>>
  }
  revisions: {
    save<TData = unknown>(input: unknown): Promise<ReeditProApiResponseEnvelope<TData>>
    list<TData = unknown>(editSessionId: string): Promise<ReeditProApiResponseEnvelope<TData>>
  }
  events: {
    append<TData = unknown>(input: unknown): Promise<ReeditProApiResponseEnvelope<TData>>
    list<TData = unknown>(editSessionId: string): Promise<ReeditProApiResponseEnvelope<TData>>
  }
  preference: {
    options<TData = unknown>(projectId: string, editSessionId?: string): Promise<ReeditProApiResponseEnvelope<TData>>
    get<TData = unknown>(editSessionId: string): Promise<ReeditProApiResponseEnvelope<TData>>
    apply<TData = unknown>(input: unknown): Promise<ReeditProApiResponseEnvelope<TData>>
    clear<TData = unknown>(editSessionId: string): Promise<ReeditProApiResponseEnvelope<TData>>
    dnaSummary<TData = unknown>(input: unknown): Promise<ReeditProApiResponseEnvelope<TData>>
    applicationSummary<TData = unknown>(editSessionId: string): Promise<ReeditProApiResponseEnvelope<TData>>
    stageApplication<TData = unknown>(input: unknown): Promise<ReeditProApiResponseEnvelope<TData>>
    activateApplication<TData = unknown>(input: unknown): Promise<ReeditProApiResponseEnvelope<TData>>
  }
}

export interface MockProjectEditSessionApiClient extends ProjectEditSessionApiClient {
  getMockDatabase(): MockDatabase
  resetMockDatabase(): MockDatabase
}

const DEFAULT_PROJECT_ID = 'mock-project-edit-chat-foundation'
const mockProjectEditSessionDatabases = new Map<string, MockDatabase>()

const NO_PRODUCTION_EFFECTS = {
  providerCallMade: false,
  supabaseWriteMade: false,
  generationRequestCreated: false,
  renderJobCreated: false,
  workerJobCreated: false,
  creditReservedOrSpent: false,
} as const

function nowIso() {
  return new Date().toISOString()
}

function createRequestId(routeId: string) {
  return `${routeId}:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 8)}`
}

function mockDatabaseCacheKey(options: ProjectEditSessionApiClientOptions): string {
  return [
    options.workspaceId ?? 'default-workspace',
    options.projectId ?? DEFAULT_PROJECT_ID,
    options.userId ?? 'default-user',
  ].join(':')
}

function getSharedMockDatabase(options: ProjectEditSessionApiClientOptions): MockDatabase {
  const key = mockDatabaseCacheKey(options)
  const existing = mockProjectEditSessionDatabases.get(key)
  if (existing) return existing
  const db = createMockDatabase()
  mockProjectEditSessionDatabases.set(key, db)
  return db
}

function asRecord(value: unknown): RequestRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as RequestRecord : {}
}

function optionalString(value: RequestRecord, key: string): string | undefined {
  const raw = value[key]
  return typeof raw === 'string' && raw.trim() ? raw.trim() : undefined
}

function stringValue(value: RequestRecord, key: string, fallback: string): string {
  return optionalString(value, key) ?? fallback
}

function booleanValue(value: RequestRecord, key: string, fallback = false): boolean {
  const raw = value[key]
  return typeof raw === 'boolean' ? raw : fallback
}

function numberValue(value: RequestRecord, key: string, fallback: number): number {
  const raw = value[key]
  return typeof raw === 'number' && Number.isFinite(raw) ? raw : fallback
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function recordArray(value: unknown): RequestRecord[] {
  return Array.isArray(value) ? value.map(asRecord) : []
}

function projectIdFrom(body: RequestRecord, options: ReeditProApiClientOptions): string {
  return optionalString(body, 'projectId') ?? options.projectId ?? DEFAULT_PROJECT_ID
}

function userFacingEditLevel(value: unknown): UserFacingEditLevel | undefined {
  return value === 'basic' || value === 'premium' || value === 'ultra_premium' ? value : undefined
}

function aspectRatio(value: unknown): ProjectEditSessionAspectRatio {
  return value === '9:16' || value === '16:9' || value === '1:1' || value === '4:5' || value === 'custom'
    ? value
    : '9:16'
}

function platformTarget(value: unknown): ProjectEditSessionPlatformTarget {
  const allowed: ProjectEditSessionPlatformTarget[] = [
    'tiktok_reel',
    'instagram_reel',
    'instagram_feed',
    'youtube_shorts',
    'youtube_standard',
    'linkedin',
    'website',
    'podcast_clip',
    'ad_creative',
    'internal_review',
    'custom',
  ]
  return allowed.includes(value as ProjectEditSessionPlatformTarget) ? value as ProjectEditSessionPlatformTarget : 'custom'
}

function sessionStatus(value: unknown): ProjectEditSessionStatus | undefined {
  const allowed: ProjectEditSessionStatus[] = [
    'draft',
    'setup_ready',
    'awaiting_approval',
    'approved',
    'in_progress_mock',
    'preview_ready',
    'revision_requested',
    'needs_review',
    'rendered_future',
    'archived',
  ]
  return allowed.includes(value as ProjectEditSessionStatus) ? value as ProjectEditSessionStatus : undefined
}

function messageRole(value: unknown): ProjectEditSessionMessageRole {
  const allowed: ProjectEditSessionMessageRole[] = ['user', 'assistant', 'system', 'tool_status', 'approval', 'revision', 'preview']
  return allowed.includes(value as ProjectEditSessionMessageRole) ? value as ProjectEditSessionMessageRole : 'user'
}

function messageKind(value: unknown): ProjectEditSessionMessageKind {
  const allowed: ProjectEditSessionMessageKind[] = [
    'text',
    'source_update',
    'setup_summary',
    'edit_plan',
    'credit_estimate',
    'approval_request',
    'approval_response',
    'progress_update',
    'preview_ready',
    'revision_request',
    'revision_learned',
    'preference_dna_applied',
    'preference_dna_review_warning',
    'qa_summary',
    'system_note',
  ]
  return allowed.includes(value as ProjectEditSessionMessageKind) ? value as ProjectEditSessionMessageKind : 'text'
}

function sourceImportance(value: unknown): ProjectEditSessionSourceImportance {
  const allowed: ProjectEditSessionSourceImportance[] = ['primary', 'optional', 'broll', 'reference_only']
  return allowed.includes(value as ProjectEditSessionSourceImportance) ? value as ProjectEditSessionSourceImportance : 'optional'
}

function memoryLayer(value: unknown): ProjectEditSessionMemoryLayer {
  const allowed: ProjectEditSessionMemoryLayer[] = [
    'project_memory',
    'session_memory',
    'source_memory',
    'preference_memory',
    'dna_application_memory',
    'revision_memory',
    'approval_memory',
    'preview_memory',
    'user_instruction_memory',
  ]
  return allowed.includes(value as ProjectEditSessionMemoryLayer) ? value as ProjectEditSessionMemoryLayer : 'session_memory'
}

function snapshotKind(value: unknown): ProjectEditSessionSnapshotKind {
  const allowed: ProjectEditSessionSnapshotKind[] = [
    'created',
    'source_updated',
    'setup_generated',
    'plan_approved',
    'preview_created',
    'revision_requested',
    'revision_applied',
    'version_created',
    'manual_checkpoint',
  ]
  return allowed.includes(value as ProjectEditSessionSnapshotKind) ? value as ProjectEditSessionSnapshotKind : 'manual_checkpoint'
}

function versionStatus(value: unknown): ProjectEditSessionVersionStatus {
  const allowed: ProjectEditSessionVersionStatus[] = ['draft', 'approved', 'superseded', 'preview_ready', 'rendered_future', 'rejected']
  return allowed.includes(value as ProjectEditSessionVersionStatus) ? value as ProjectEditSessionVersionStatus : 'draft'
}

function previewStatus(value: unknown): ProjectEditSessionPreviewStatus {
  const allowed: ProjectEditSessionPreviewStatus[] = ['placeholder_mock', 'preview_ready_mock', 'render_future', 'failed', 'blocked']
  return allowed.includes(value as ProjectEditSessionPreviewStatus) ? value as ProjectEditSessionPreviewStatus : 'placeholder_mock'
}

function success<TData>(
  request: ReeditProApiRequestEnvelope,
  data: TData,
  warnings: string[] = [],
): ReeditProApiResponseEnvelope<TData> {
  return {
    routeId: request.routeId,
    requestId: request.requestId,
    ok: true,
    data,
    warnings,
    mockOnly: true,
    ...NO_PRODUCTION_EFFECTS,
    respondedAt: nowIso(),
  }
}

function failure<TData = never>(
  request: ReeditProApiRequestEnvelope,
  code: string,
  message: string,
  warnings: string[] = [],
): ReeditProApiResponseEnvelope<TData> {
  return {
    routeId: request.routeId,
    requestId: request.requestId,
    ok: false,
    error: {
      code,
      message,
      details: { safety: PROJECT_EDIT_SESSION_API_CLIENT_SAFETY },
    },
    warnings,
    mockOnly: true,
    ...NO_PRODUCTION_EFFECTS,
    respondedAt: nowIso(),
  }
}

function withSafety<TData extends RequestRecord>(data: TData): TData & {
  safety: typeof PROJECT_EDIT_SESSION_API_CLIENT_SAFETY
} {
  return {
    ...data,
    safety: PROJECT_EDIT_SESSION_API_CLIENT_SAFETY,
  }
}

function fromRepositoryResult<TData extends RequestRecord, TResult>(
  request: ReeditProApiRequestEnvelope,
  result: ProjectEditSessionRepositoryResult<TResult>,
  dataFactory: (data: TResult) => TData,
): ReeditProApiResponseEnvelope<TData & { safety: typeof PROJECT_EDIT_SESSION_API_CLIENT_SAFETY }> {
  if (!result.ok || result.data === undefined) {
    return failure(
      request,
      result.error?.code ?? 'PROJECT_EDIT_SESSION_CLIENT_ROUTE_FAILED',
      result.error?.message ?? 'Project Edit Session mock client operation failed.',
      result.warnings,
    )
  }
  return success(request, withSafety(dataFactory(result.data)), result.warnings)
}

function createSafetySummary(): ProjectEditSessionApiClientSafetySummary {
  return {
    ...PROJECT_EDIT_SESSION_API_CLIENT_SAFETY,
    summary: createProjectEditSessionApiClientSummary().summary.join(' '),
    warnings: [
      'No production HTTP route is called.',
      'No Supabase, storage, provider, worker, render, generation, credit, file-byte, external URL, or media-processing effect occurs.',
    ],
  }
}

export function createProjectEditSessionApiClient(
  options: ProjectEditSessionApiClientOptions = {},
): ProjectEditSessionApiClient {
  const db = options.mockDatabase ?? createMockDatabase()
  const safety = createSafetySummary()

  function repository() {
    return createMockProjectEditSessionRepository({
      db,
      workspaceId: options.workspaceId,
      projectId: options.projectId,
      userId: options.userId,
    })
  }

  async function defaultEditSessionId(body: RequestRecord): Promise<string | undefined> {
    const explicit = optionalString(body, 'editSessionId')
      ?? optionalString(body, 'id')
      ?? optionalString(body, 'sessionId')
    if (explicit) return explicit
    const list = await repository().listProjectEditSessions({
      projectId: projectIdFrom(body, options),
      includeArchived: true,
    })
    return list.data?.[0]?.id
  }

  async function requireEditSessionId(
    request: ReeditProApiRequestEnvelope,
    body: RequestRecord,
  ): Promise<string | ReeditProApiResponseEnvelope> {
    const editSessionId = await defaultEditSessionId(body)
    if (!editSessionId) {
      return failure(request, 'PROJECT_EDIT_SESSION_ID_REQUIRED', 'A Project Edit Session id is required.')
    }
    return editSessionId
  }

  async function persistPreferencePlan(plan: ProjectEditSessionPreferenceApplicationPlan) {
    const repo = repository()
    const updated = await repo.updateProjectEditSession({
      editSessionId: plan.editSessionId,
      patch: plan.sessionUpdates,
    })
    if (!updated.ok || !updated.data) return { updated, memories: [], events: [], snapshot: undefined }

    const memories = []
    for (const memory of plan.memoryUpdates) {
      const saved = await repo.upsertSessionMemory({
        projectId: plan.projectId,
        editSessionId: plan.editSessionId,
        layer: memory.layer,
        summary: memory.summary,
        facts: memory.facts,
        preferences: memory.preferences,
        warnings: memory.warnings,
        metadata: {
          rpMilestone: 'RP-EDITSESSION-10',
          preferenceApplicationPlanId: plan.id,
        },
      })
      if (saved.ok && saved.data) memories.push(saved.data)
    }

    const events = []
    for (const eventSummary of plan.historyEvents) {
      const saved = await repo.appendSessionEvent({
        projectId: plan.projectId,
        editSessionId: plan.editSessionId,
        eventType: plan.status === 'cleared' ? 'preference_cleared' : 'preference_applied',
        summary: eventSummary,
        metadata: {
          rpMilestone: 'RP-EDITSESSION-10',
          preferenceStatus: plan.status,
          preferenceHandle: plan.option.handle,
        },
      })
      if (saved.ok && saved.data) events.push(saved.data)
    }

    const snapshot = await repo.saveSessionSnapshot({
      projectId: plan.projectId,
      editSessionId: plan.editSessionId,
      kind: 'manual_checkpoint',
      summary: plan.snapshotSummary ?? 'Preference application checkpoint.',
      state: {
        rpMilestone: 'RP-EDITSESSION-10',
        preferenceStatus: plan.status,
        selectedEditPreferenceHandle: plan.option.handle,
        sideEffects: PROJECT_EDIT_SESSION_API_CLIENT_SAFETY,
      },
    })

    return {
      updated,
      memories,
      events,
      snapshot: snapshot.ok ? snapshot.data : undefined,
    }
  }

  async function persistPreferenceIntegrationPlan(plan: ProjectEditSessionPreferenceIntegrationPlan) {
    const repo = repository()
    const updated = await repo.updateProjectEditSession({
      editSessionId: plan.editSessionId,
      patch: plan.sessionUpdates,
    })
    if (!updated.ok || !updated.data) return { updated, memories: [], events: [], snapshot: undefined }

    const memories = []
    for (const memory of plan.memoryUpdates) {
      const saved = await repo.upsertSessionMemory({
        id: `${plan.id}-${memory.layer}`,
        projectId: plan.projectId,
        editSessionId: plan.editSessionId,
        layer: memory.layer,
        summary: memory.summary,
        facts: memory.facts,
        preferences: memory.preferences,
        warnings: memory.warnings,
        metadata: {
          rpMilestone: 'RP-GOAL-EDITREFERENCE-GATE6',
          preferenceApplicationIntegrationPlanId: plan.id,
          exactPreferenceApplicationId: plan.applicationId,
          integrationAction: plan.action,
        },
      })
      if (saved.ok && saved.data) memories.push(saved.data)
    }

    const events = []
    for (const [index, eventSummary] of plan.historyEvents.entries()) {
      const saved = await repo.appendSessionEvent({
        id: `${plan.id}-event-${index + 1}`,
        projectId: plan.projectId,
        editSessionId: plan.editSessionId,
        eventType: plan.action === 'stage_exact_application'
          ? 'preference_application_staged'
          : 'preference_application_connected_mock',
        summary: eventSummary,
        metadata: {
          rpMilestone: 'RP-GOAL-EDITREFERENCE-GATE6',
          exactPreferenceApplicationId: plan.applicationId,
          integrationAction: plan.action,
        },
      })
      if (saved.ok && saved.data) events.push(saved.data)
    }

    const snapshot = await repo.saveSessionSnapshot({
      id: `${plan.id}-snapshot`,
      projectId: plan.projectId,
      editSessionId: plan.editSessionId,
      kind: 'manual_checkpoint',
      summary: plan.snapshotSummary,
      state: {
        rpMilestone: 'RP-GOAL-EDITREFERENCE-GATE6',
        exactPreferenceApplicationId: plan.applicationId,
        preferenceApplicationContextHash: plan.context.packageHash,
        integrationAction: plan.action,
        sideEffects: plan.safety,
      },
    })

    return {
      updated,
      memories,
      events,
      snapshot: snapshot.ok ? snapshot.data : undefined,
    }
  }

  const transport: ReeditProApiTransport = {
    mode: options.mode ?? 'mock_browser',
    safety,
    async request<TPayload = unknown, TData = unknown>(
      envelope: ReeditProApiRequestEnvelope<TPayload>,
    ): Promise<ReeditProApiResponseEnvelope<TData>> {
      const body = asRecord(envelope.payload)
      const repo = repository()

      switch (envelope.routeId as ProjectEditSessionApiRouteId) {
        case 'project.editSessions.list':
          return fromRepositoryResult(envelope, await repo.listProjectEditSessions({
            projectId: projectIdFrom(body, options),
            includeArchived: booleanValue(body, 'includeArchived'),
            status: sessionStatus(body.status),
          }), (sessions) => ({ sessions })) as ReeditProApiResponseEnvelope<TData>

        case 'project.editSessions.get': {
          const editSessionId = await requireEditSessionId(envelope, body)
          if (typeof editSessionId !== 'string') return editSessionId as ReeditProApiResponseEnvelope<TData>
          return fromRepositoryResult(envelope, await repo.getProjectEditSession(editSessionId), (session) => ({ session })) as ReeditProApiResponseEnvelope<TData>
        }

        case 'project.editSessions.create':
          return fromRepositoryResult(envelope, await repo.createProjectEditSession({
            id: optionalString(body, 'id'),
            projectId: projectIdFrom(body, options),
            workspaceId: optionalString(body, 'workspaceId') ?? options.workspaceId,
            ownerUserId: optionalString(body, 'ownerUserId') ?? options.userId,
            name: stringValue(body, 'name', 'Untitled edit'),
            description: optionalString(body, 'description'),
            status: sessionStatus(body.status),
            aspectRatio: aspectRatio(body.aspectRatio),
            platformTarget: platformTarget(body.platformTarget),
            thumbnailUrl: optionalString(body, 'thumbnailUrl'),
            sourceMediaAssetIds: stringArray(body.sourceMediaAssetIds),
            selectedEditLevel: userFacingEditLevel(body.selectedEditLevel),
            selectedEditPreferenceId: optionalString(body, 'selectedEditPreferenceId'),
            selectedPreferenceVersionId: optionalString(body, 'selectedPreferenceVersionId'),
            selectedEditPreferenceHandle: optionalString(body, 'selectedEditPreferenceHandle'),
            metadata: asRecord(body.metadata),
          }), (session) => ({ session })) as ReeditProApiResponseEnvelope<TData>

        case 'project.editSessions.update': {
          const editSessionId = await requireEditSessionId(envelope, body)
          if (typeof editSessionId !== 'string') return editSessionId as ReeditProApiResponseEnvelope<TData>
          return fromRepositoryResult(envelope, await repo.updateProjectEditSession({
            editSessionId,
            patch: asRecord(body.patch) as never,
          }), (session) => ({ session })) as ReeditProApiResponseEnvelope<TData>
        }

        case 'project.editSessions.archive': {
          const editSessionId = await requireEditSessionId(envelope, body)
          if (typeof editSessionId !== 'string') return editSessionId as ReeditProApiResponseEnvelope<TData>
          return fromRepositoryResult(envelope, await repo.archiveProjectEditSession(editSessionId), (session) => ({ session })) as ReeditProApiResponseEnvelope<TData>
        }

        case 'project.editSessions.duplicate': {
          const editSessionId = await requireEditSessionId(envelope, body)
          if (typeof editSessionId !== 'string') return editSessionId as ReeditProApiResponseEnvelope<TData>
          return fromRepositoryResult(envelope, await repo.duplicateProjectEditSession({
            editSessionId,
            newId: optionalString(body, 'newId'),
            newName: optionalString(body, 'newName'),
            projectId: optionalString(body, 'projectId'),
          }), (session) => ({ session })) as ReeditProApiResponseEnvelope<TData>
        }

        case 'project.editSessions.cardModels.list':
          return fromRepositoryResult(envelope, await repo.listSessionCardModels(projectIdFrom(body, options)), (cardModels) => ({ cardModels })) as ReeditProApiResponseEnvelope<TData>

        case 'project.editSessions.cardModels.get': {
          const editSessionId = await requireEditSessionId(envelope, body)
          if (typeof editSessionId !== 'string') return editSessionId as ReeditProApiResponseEnvelope<TData>
          return fromRepositoryResult(envelope, await repo.createSessionCardModel(editSessionId), (cardModel) => ({ cardModel })) as ReeditProApiResponseEnvelope<TData>
        }

        case 'project.editSessions.bundle.get': {
          const editSessionId = await requireEditSessionId(envelope, body)
          if (typeof editSessionId !== 'string') return editSessionId as ReeditProApiResponseEnvelope<TData>
          return fromRepositoryResult(envelope, await repo.createSessionBundle(editSessionId), (bundle) => ({ bundle })) as ReeditProApiResponseEnvelope<TData>
        }

        case 'project.editSessions.summary.get': {
          const editSessionId = await requireEditSessionId(envelope, body)
          if (typeof editSessionId !== 'string') return editSessionId as ReeditProApiResponseEnvelope<TData>
          const bundle = await repo.createSessionBundle(editSessionId)
          return fromRepositoryResult(envelope, bundle, (data) => ({
            editSessionId,
            bundle: data,
            summary: [
              `${data.session.name} loaded for future Edit Chat UI.`,
              `${data.messages.length} message(s), ${data.sources.length} source(s), ${data.memories.length} memory layer(s).`,
            ],
          })) as ReeditProApiResponseEnvelope<TData>
        }

        case 'project.editSessions.messages.list': {
          const editSessionId = await requireEditSessionId(envelope, body)
          if (typeof editSessionId !== 'string') return editSessionId as ReeditProApiResponseEnvelope<TData>
          return fromRepositoryResult(envelope, await repo.listSessionMessages(editSessionId), (messages) => ({ messages })) as ReeditProApiResponseEnvelope<TData>
        }

        case 'project.editSessions.messages.append': {
          const editSessionId = await requireEditSessionId(envelope, body)
          if (typeof editSessionId !== 'string') return editSessionId as ReeditProApiResponseEnvelope<TData>
          return fromRepositoryResult(envelope, await repo.appendSessionMessage({
            id: optionalString(body, 'id'),
            projectId: projectIdFrom(body, options),
            editSessionId,
            role: messageRole(body.role),
            kind: messageKind(body.kind),
            text: stringValue(body, 'text', 'Mock Edit Chat message.'),
            metadata: asRecord(body.metadata),
          }), (message) => ({ message })) as ReeditProApiResponseEnvelope<TData>
        }

        case 'project.editSessions.sources.list': {
          const editSessionId = await requireEditSessionId(envelope, body)
          if (typeof editSessionId !== 'string') return editSessionId as ReeditProApiResponseEnvelope<TData>
          return fromRepositoryResult(envelope, await repo.listSessionSources(editSessionId), (sources) => ({ sources })) as ReeditProApiResponseEnvelope<TData>
        }

        case 'project.editSessions.sources.save': {
          const editSessionId = await requireEditSessionId(envelope, body)
          if (typeof editSessionId !== 'string') return editSessionId as ReeditProApiResponseEnvelope<TData>
          return fromRepositoryResult(envelope, await repo.saveSessionSource({
            id: optionalString(body, 'id'),
            projectId: projectIdFrom(body, options),
            editSessionId,
            mediaAssetId: stringValue(body, 'mediaAssetId', 'mock-session-source-media'),
            sourceOrderIndex: numberValue(body, 'sourceOrderIndex', 1),
            label: optionalString(body, 'label'),
            notes: stringArray(body.notes),
            importance: sourceImportance(body.importance),
          }), (source) => ({ source })) as ReeditProApiResponseEnvelope<TData>
        }

        case 'project.editSessions.sources.saveMany': {
          const editSessionId = await requireEditSessionId(envelope, body)
          if (typeof editSessionId !== 'string') return editSessionId as ReeditProApiResponseEnvelope<TData>
          return fromRepositoryResult(envelope, await repo.saveSessionSources({
            editSessionId,
            sources: recordArray(body.sources).map((source, index) => ({
              id: optionalString(source, 'id'),
              projectId: projectIdFrom(source, options),
              editSessionId,
              mediaAssetId: stringValue(source, 'mediaAssetId', `mock-session-source-media-${index + 1}`),
              sourceOrderIndex: numberValue(source, 'sourceOrderIndex', index + 1),
              label: optionalString(source, 'label'),
              notes: stringArray(source.notes),
              importance: sourceImportance(source.importance),
            })),
          }), (sources) => ({ sources })) as ReeditProApiResponseEnvelope<TData>
        }

        case 'project.editSessions.memory.list': {
          const editSessionId = await requireEditSessionId(envelope, body)
          if (typeof editSessionId !== 'string') return editSessionId as ReeditProApiResponseEnvelope<TData>
          return fromRepositoryResult(envelope, await repo.listSessionMemory(editSessionId), (memories) => ({ memories })) as ReeditProApiResponseEnvelope<TData>
        }

        case 'project.editSessions.memory.getLayer': {
          const editSessionId = await requireEditSessionId(envelope, body)
          if (typeof editSessionId !== 'string') return editSessionId as ReeditProApiResponseEnvelope<TData>
          return fromRepositoryResult(envelope, await repo.getSessionMemoryLayer({ editSessionId, layer: memoryLayer(body.layer) }), (memory) => ({ memory })) as ReeditProApiResponseEnvelope<TData>
        }

        case 'project.editSessions.memory.upsert': {
          const editSessionId = await requireEditSessionId(envelope, body)
          if (typeof editSessionId !== 'string') return editSessionId as ReeditProApiResponseEnvelope<TData>
          return fromRepositoryResult(envelope, await repo.upsertSessionMemory({
            id: optionalString(body, 'id'),
            projectId: projectIdFrom(body, options),
            editSessionId,
            layer: memoryLayer(body.layer),
            summary: stringValue(body, 'summary', 'Mock Edit Chat memory layer.'),
            facts: stringArray(body.facts),
            preferences: stringArray(body.preferences),
            warnings: stringArray(body.warnings),
            updatedFromMessageId: optionalString(body, 'updatedFromMessageId'),
            updatedFromRevisionId: optionalString(body, 'updatedFromRevisionId'),
            metadata: asRecord(body.metadata),
          }), (memory) => ({ memory })) as ReeditProApiResponseEnvelope<TData>
        }

        case 'project.editSessions.snapshots.save': {
          const editSessionId = await requireEditSessionId(envelope, body)
          if (typeof editSessionId !== 'string') return editSessionId as ReeditProApiResponseEnvelope<TData>
          return fromRepositoryResult(envelope, await repo.saveSessionSnapshot({
            id: optionalString(body, 'id'),
            projectId: projectIdFrom(body, options),
            editSessionId,
            kind: snapshotKind(body.kind),
            summary: stringValue(body, 'summary', 'Mock Edit Chat snapshot.'),
            state: asRecord(body.state),
          }), (snapshot) => ({ snapshot })) as ReeditProApiResponseEnvelope<TData>
        }

        case 'project.editSessions.snapshots.latest': {
          const editSessionId = await requireEditSessionId(envelope, body)
          if (typeof editSessionId !== 'string') return editSessionId as ReeditProApiResponseEnvelope<TData>
          return fromRepositoryResult(envelope, await repo.getLatestSessionSnapshot(editSessionId), (snapshot) => ({ snapshot })) as ReeditProApiResponseEnvelope<TData>
        }

        case 'project.editSessions.snapshots.list': {
          const editSessionId = await requireEditSessionId(envelope, body)
          if (typeof editSessionId !== 'string') return editSessionId as ReeditProApiResponseEnvelope<TData>
          return fromRepositoryResult(envelope, await repo.listSessionSnapshots(editSessionId), (snapshots) => ({ snapshots })) as ReeditProApiResponseEnvelope<TData>
        }

        case 'project.editSessions.versions.save': {
          const editSessionId = await requireEditSessionId(envelope, body)
          if (typeof editSessionId !== 'string') return editSessionId as ReeditProApiResponseEnvelope<TData>
          return fromRepositoryResult(envelope, await repo.saveSessionVersion({
            id: optionalString(body, 'id'),
            projectId: projectIdFrom(body, options),
            editSessionId,
            status: versionStatus(body.status),
            name: stringValue(body, 'name', 'Mock Edit Chat Version'),
            summary: stringValue(body, 'summary', 'Mock version saved for future UI.'),
            metadata: asRecord(body.metadata),
          }), (version) => ({ version })) as ReeditProApiResponseEnvelope<TData>
        }

        case 'project.editSessions.versions.latest': {
          const editSessionId = await requireEditSessionId(envelope, body)
          if (typeof editSessionId !== 'string') return editSessionId as ReeditProApiResponseEnvelope<TData>
          return fromRepositoryResult(envelope, await repo.getLatestSessionVersion(editSessionId), (version) => ({ version })) as ReeditProApiResponseEnvelope<TData>
        }

        case 'project.editSessions.versions.list': {
          const editSessionId = await requireEditSessionId(envelope, body)
          if (typeof editSessionId !== 'string') return editSessionId as ReeditProApiResponseEnvelope<TData>
          return fromRepositoryResult(envelope, await repo.listSessionVersions(editSessionId), (versions) => ({ versions })) as ReeditProApiResponseEnvelope<TData>
        }

        case 'project.editSessions.previews.save': {
          const editSessionId = await requireEditSessionId(envelope, body)
          if (typeof editSessionId !== 'string') return editSessionId as ReeditProApiResponseEnvelope<TData>
          return fromRepositoryResult(envelope, await repo.saveSessionPreview({
            id: optionalString(body, 'id'),
            projectId: projectIdFrom(body, options),
            editSessionId,
            versionId: optionalString(body, 'versionId'),
            status: previewStatus(body.status),
            thumbnailUrl: optionalString(body, 'thumbnailUrl'),
            previewUrl: optionalString(body, 'previewUrl'),
            aspectRatio: aspectRatio(body.aspectRatio),
            durationSeconds: typeof body.durationSeconds === 'number' ? body.durationSeconds : undefined,
            metadata: asRecord(body.metadata),
          }), (preview) => ({ preview })) as ReeditProApiResponseEnvelope<TData>
        }

        case 'project.editSessions.previews.latest': {
          const editSessionId = await requireEditSessionId(envelope, body)
          if (typeof editSessionId !== 'string') return editSessionId as ReeditProApiResponseEnvelope<TData>
          return fromRepositoryResult(envelope, await repo.getLatestSessionPreview(editSessionId), (preview) => ({ preview })) as ReeditProApiResponseEnvelope<TData>
        }

        case 'project.editSessions.previews.list': {
          const editSessionId = await requireEditSessionId(envelope, body)
          if (typeof editSessionId !== 'string') return editSessionId as ReeditProApiResponseEnvelope<TData>
          return fromRepositoryResult(envelope, await repo.listSessionPreviews(editSessionId), (previews) => ({ previews })) as ReeditProApiResponseEnvelope<TData>
        }

        case 'project.editSessions.revisions.save': {
          const editSessionId = await requireEditSessionId(envelope, body)
          if (typeof editSessionId !== 'string') return editSessionId as ReeditProApiResponseEnvelope<TData>
          return fromRepositoryResult(envelope, await repo.saveSessionRevision({
            id: optionalString(body, 'id'),
            projectId: projectIdFrom(body, options),
            editSessionId,
            requestedByMessageId: stringValue(body, 'requestedByMessageId', `${editSessionId}-message-user-brief`),
            summary: stringValue(body, 'summary', 'Mock revision saved for future Edit Chat UI.'),
            userInstruction: stringValue(body, 'userInstruction', 'Revise this mock Edit Chat.'),
            resetsApproval: booleanValue(body, 'resetsApproval', true),
            metadata: asRecord(body.metadata),
          }), (revision) => ({ revision })) as ReeditProApiResponseEnvelope<TData>
        }

        case 'project.editSessions.revisions.list': {
          const editSessionId = await requireEditSessionId(envelope, body)
          if (typeof editSessionId !== 'string') return editSessionId as ReeditProApiResponseEnvelope<TData>
          return fromRepositoryResult(envelope, await repo.listSessionRevisions(editSessionId), (revisions) => ({ revisions })) as ReeditProApiResponseEnvelope<TData>
        }

        case 'project.editSessions.events.append': {
          const editSessionId = await requireEditSessionId(envelope, body)
          if (typeof editSessionId !== 'string') return editSessionId as ReeditProApiResponseEnvelope<TData>
          return fromRepositoryResult(envelope, await repo.appendSessionEvent({
            id: optionalString(body, 'id'),
            projectId: projectIdFrom(body, options),
            editSessionId,
            eventType: stringValue(body, 'eventType', 'mock_client_event'),
            summary: stringValue(body, 'summary', 'Mock Project Edit Session client event.'),
            metadata: asRecord(body.metadata),
          }), (event) => ({ event })) as ReeditProApiResponseEnvelope<TData>
        }

        case 'project.editSessions.events.list': {
          const editSessionId = await requireEditSessionId(envelope, body)
          if (typeof editSessionId !== 'string') return editSessionId as ReeditProApiResponseEnvelope<TData>
          return fromRepositoryResult(envelope, await repo.listSessionEvents(editSessionId), (events) => ({ events })) as ReeditProApiResponseEnvelope<TData>
        }

        case 'project.editSessions.preference.options': {
          const options = listProjectEditSessionPreferenceOptions(db)
          return success(envelope, withSafety({
            options,
            summary: [
              `${options.length} mock Edit Preference option(s) available for Edit Chats.`,
              'Options are mock/local metadata only.',
            ],
          })) as ReeditProApiResponseEnvelope<TData>
        }

        case 'project.editSessions.preference.get': {
          const editSessionId = await requireEditSessionId(envelope, body)
          if (typeof editSessionId !== 'string') return editSessionId as ReeditProApiResponseEnvelope<TData>
          const sessionResult = await repo.getProjectEditSession(editSessionId)
          if (!sessionResult.ok || !sessionResult.data) return fromRepositoryResult(envelope, sessionResult, (session) => ({ session })) as ReeditProApiResponseEnvelope<TData>
          const state = createPreferenceStateFromSession(sessionResult.data)
          return success(envelope, withSafety({
            state,
            panelModel: createProjectEditSessionPreferencePanelModel(state),
            summary: createProjectEditSessionPreferenceReadableSummary(state),
          })) as ReeditProApiResponseEnvelope<TData>
        }

        case 'project.editSessions.preference.apply': {
          const editSessionId = await requireEditSessionId(envelope, body)
          if (typeof editSessionId !== 'string') return editSessionId as ReeditProApiResponseEnvelope<TData>
          const sessionResult = await repo.getProjectEditSession(editSessionId)
          if (!sessionResult.ok || !sessionResult.data) return fromRepositoryResult(envelope, sessionResult, (session) => ({ session })) as ReeditProApiResponseEnvelope<TData>
          const option = findProjectEditSessionPreferenceOption(
            db,
            optionalString(body, 'preferenceOptionId') ?? optionalString(body, 'preferenceHandle') ?? optionalString(body, 'handle'),
          )
          const plan = applyPreferenceToProjectEditSessionMock({
            projectId: projectIdFrom(body, options),
            editSessionId,
            option,
            currentSession: sessionResult.data,
          })
          const persisted = await persistPreferencePlan(plan)
          if (!persisted.updated.ok || !persisted.updated.data) return fromRepositoryResult(envelope, persisted.updated, (session) => ({ session })) as ReeditProApiResponseEnvelope<TData>
          const state = createPreferenceStateFromSession(persisted.updated.data)
          return success(envelope, withSafety({
            session: persisted.updated.data,
            state,
            applicationPlan: plan,
            panelModel: createProjectEditSessionPreferencePanelModel(state, plan),
            memories: persisted.memories,
            events: persisted.events,
            snapshot: persisted.snapshot,
            validation: validateProjectEditSessionPreferenceApplicationPlan(plan),
            summary: createProjectEditSessionPreferenceApplicationSummary(plan),
          }), plan.warnings) as ReeditProApiResponseEnvelope<TData>
        }

        case 'project.editSessions.preference.clear': {
          const editSessionId = await requireEditSessionId(envelope, body)
          if (typeof editSessionId !== 'string') return editSessionId as ReeditProApiResponseEnvelope<TData>
          const sessionResult = await repo.getProjectEditSession(editSessionId)
          if (!sessionResult.ok || !sessionResult.data) return fromRepositoryResult(envelope, sessionResult, (session) => ({ session })) as ReeditProApiResponseEnvelope<TData>
          const plan = clearPreferenceFromProjectEditSessionMock({
            projectId: projectIdFrom(body, options),
            editSessionId,
            currentSession: sessionResult.data,
          })
          const persisted = await persistPreferencePlan(plan)
          if (!persisted.updated.ok || !persisted.updated.data) return fromRepositoryResult(envelope, persisted.updated, (session) => ({ session })) as ReeditProApiResponseEnvelope<TData>
          const state = createPreferenceStateFromSession(persisted.updated.data)
          return success(envelope, withSafety({
            session: persisted.updated.data,
            state,
            applicationPlan: plan,
            panelModel: createProjectEditSessionPreferencePanelModel(state, plan),
            memories: persisted.memories,
            events: persisted.events,
            snapshot: persisted.snapshot,
            validation: validateProjectEditSessionPreferenceApplicationPlan(plan),
            summary: createProjectEditSessionPreferenceApplicationSummary(plan),
          }), plan.warnings) as ReeditProApiResponseEnvelope<TData>
        }

        case 'project.editSessions.preference.dnaSummary': {
          const option = findProjectEditSessionPreferenceOption(
            db,
            optionalString(body, 'preferenceOptionId') ?? optionalString(body, 'preferenceHandle') ?? optionalString(body, 'handle') ?? '@lifestyle-travel-vlog',
          )
          return success(envelope, withSafety({
            option,
            summary: loadPreferenceDNASummaryForSessionPreference(option),
          })) as ReeditProApiResponseEnvelope<TData>
        }

        case 'project.editSessions.preference.applicationSummary': {
          const editSessionId = await requireEditSessionId(envelope, body)
          if (typeof editSessionId !== 'string') return editSessionId as ReeditProApiResponseEnvelope<TData>
          const sessionResult = await repo.getProjectEditSession(editSessionId)
          if (!sessionResult.ok || !sessionResult.data) return fromRepositoryResult(envelope, sessionResult, (session) => ({ session })) as ReeditProApiResponseEnvelope<TData>
          const state = createPreferenceStateFromSession(sessionResult.data)
          return success(envelope, withSafety({
            state,
            panelModel: createProjectEditSessionPreferencePanelModel(state),
            summary: createProjectEditSessionPreferenceReadableSummary(state),
          })) as ReeditProApiResponseEnvelope<TData>
        }

        case 'project.editSessions.preference.application.stage': {
          const editSessionId = await requireEditSessionId(envelope, body)
          if (typeof editSessionId !== 'string') return editSessionId as ReeditProApiResponseEnvelope<TData>
          const sessionResult = await repo.getProjectEditSession(editSessionId)
          if (!sessionResult.ok || !sessionResult.data) return fromRepositoryResult(envelope, sessionResult, (session) => ({ session })) as ReeditProApiResponseEnvelope<TData>
          const sessionBefore = structuredClone(sessionResult.data)
          const application = body.application as PreferenceApplicationRecord | undefined
          const context = body.context as PreferenceApplicationDownstreamContext | undefined
          if (!application || !context) return failure(envelope, 'PREFERENCE_APPLICATION_REQUIRED', 'An exact Preference Application and bounded downstream context are required.') as ReeditProApiResponseEnvelope<TData>
          let plan: ProjectEditSessionPreferenceIntegrationPlan
          try {
            plan = createStagePreferenceApplicationPlan({
              application,
              context,
              currentSession: sessionResult.data,
              outputFrameConfirmed: body.outputFrameConfirmed === true,
            })
          } catch (error) {
            return failure(envelope, 'PREFERENCE_APPLICATION_TARGET_INVALID', error instanceof Error ? error.message : 'Preference Application target validation failed.') as ReeditProApiResponseEnvelope<TData>
          }
          const persisted = await persistPreferenceIntegrationPlan(plan)
          if (!persisted.updated.ok || !persisted.updated.data) return fromRepositoryResult(envelope, persisted.updated, (session) => ({ session })) as ReeditProApiResponseEnvelope<TData>
          const receipt = createPreferenceApplicationTargetSessionReceipt({
            application,
            context,
            sessionBefore,
            sessionAfter: persisted.updated.data,
            outputFrameConfirmed: true,
            stagedAt: readPreferenceApplicationIntegrationState(persisted.updated.data)?.stagedAt,
          })
          return success(envelope, withSafety({
            session: persisted.updated.data,
            integrationPlan: plan,
            targetSessionReceipt: receipt,
            memories: persisted.memories,
            events: persisted.events,
            snapshot: persisted.snapshot,
          })) as ReeditProApiResponseEnvelope<TData>
        }

        case 'project.editSessions.preference.application.activate': {
          const editSessionId = await requireEditSessionId(envelope, body)
          if (typeof editSessionId !== 'string') return editSessionId as ReeditProApiResponseEnvelope<TData>
          const sessionResult = await repo.getProjectEditSession(editSessionId)
          if (!sessionResult.ok || !sessionResult.data) return fromRepositoryResult(envelope, sessionResult, (session) => ({ session })) as ReeditProApiResponseEnvelope<TData>
          const application = body.application as PreferenceApplicationRecord | undefined
          if (!application) return failure(envelope, 'PREFERENCE_APPLICATION_REQUIRED', 'A connected exact Preference Application is required.') as ReeditProApiResponseEnvelope<TData>
          let plan: ProjectEditSessionPreferenceIntegrationPlan
          try {
            plan = createActivatePreferenceApplicationPlan({ application, currentSession: sessionResult.data })
          } catch (error) {
            return failure(envelope, 'PREFERENCE_APPLICATION_CONNECTION_INVALID', error instanceof Error ? error.message : 'Preference Application connection validation failed.') as ReeditProApiResponseEnvelope<TData>
          }
          const persisted = await persistPreferenceIntegrationPlan(plan)
          if (!persisted.updated.ok || !persisted.updated.data) return fromRepositoryResult(envelope, persisted.updated, (session) => ({ session })) as ReeditProApiResponseEnvelope<TData>
          return success(envelope, withSafety({
            session: persisted.updated.data,
            integrationPlan: plan,
            memories: persisted.memories,
            events: persisted.events,
            snapshot: persisted.snapshot,
          })) as ReeditProApiResponseEnvelope<TData>
        }

        default:
          return failure(envelope, 'PROJECT_EDIT_SESSION_CLIENT_ROUTE_UNKNOWN', `${envelope.routeId} is not implemented by the mock Project Edit Session client.`) as ReeditProApiResponseEnvelope<TData>
      }
    },
  }

  const client = {
    transport,
    safety,
    createEnvelope<TPayload>(routeId: ProjectEditSessionApiRouteId, payload?: TPayload) {
      return {
        routeId,
        requestId: createRequestId(routeId),
        workspaceId: options.workspaceId,
        projectId: options.projectId,
        userId: options.userId,
        payload: (payload ?? {}) as TPayload,
        mockOnly: true,
        requestedAt: nowIso(),
        metadata: {
          clientMode: options.mode ?? 'mock_browser',
          preserveMockSession: options.preserveMockSession ?? true,
        },
      }
    },
    request<TPayload, TData>(routeId: ProjectEditSessionApiRouteId, payload?: TPayload) {
      return transport.request<TPayload, TData>(client.createEnvelope(routeId, payload))
    },
  } as unknown as ProjectEditSessionApiClient

  client.sessions = {
    list: (projectId) => client.request('project.editSessions.list', { projectId }),
    get: (editSessionId) => client.request('project.editSessions.get', { editSessionId }),
    create: (input) => client.request('project.editSessions.create', input),
    update: (input) => client.request('project.editSessions.update', input),
    archive: (editSessionId) => client.request('project.editSessions.archive', { editSessionId }),
    duplicate: (input) => client.request('project.editSessions.duplicate', input),
  }
  client.cardModels = {
    list: (projectId) => client.request('project.editSessions.cardModels.list', { projectId }),
    get: (editSessionId) => client.request('project.editSessions.cardModels.get', { editSessionId }),
  }
  client.bundle = { get: (editSessionId) => client.request('project.editSessions.bundle.get', { editSessionId }) }
  client.summary = { get: (editSessionId) => client.request('project.editSessions.summary.get', { editSessionId }) }
  client.messages = {
    list: (editSessionId) => client.request('project.editSessions.messages.list', { editSessionId }),
    append: (input) => client.request('project.editSessions.messages.append', input),
  }
  client.sources = {
    list: (editSessionId) => client.request('project.editSessions.sources.list', { editSessionId }),
    save: (input) => client.request('project.editSessions.sources.save', input),
    saveMany: (input) => client.request('project.editSessions.sources.saveMany', input),
  }
  client.memory = {
    list: (editSessionId) => client.request('project.editSessions.memory.list', { editSessionId }),
    getLayer: (input) => client.request('project.editSessions.memory.getLayer', input),
    upsert: (input) => client.request('project.editSessions.memory.upsert', input),
  }
  client.snapshots = {
    save: (input) => client.request('project.editSessions.snapshots.save', input),
    latest: (editSessionId) => client.request('project.editSessions.snapshots.latest', { editSessionId }),
    list: (editSessionId) => client.request('project.editSessions.snapshots.list', { editSessionId }),
  }
  client.versions = {
    save: (input) => client.request('project.editSessions.versions.save', input),
    latest: (editSessionId) => client.request('project.editSessions.versions.latest', { editSessionId }),
    list: (editSessionId) => client.request('project.editSessions.versions.list', { editSessionId }),
  }
  client.previews = {
    save: (input) => client.request('project.editSessions.previews.save', input),
    latest: (editSessionId) => client.request('project.editSessions.previews.latest', { editSessionId }),
    list: (editSessionId) => client.request('project.editSessions.previews.list', { editSessionId }),
  }
  client.revisions = {
    save: (input) => client.request('project.editSessions.revisions.save', input),
    list: (editSessionId) => client.request('project.editSessions.revisions.list', { editSessionId }),
  }
  client.events = {
    append: (input) => client.request('project.editSessions.events.append', input),
    list: (editSessionId) => client.request('project.editSessions.events.list', { editSessionId }),
  }
  client.preference = {
    options: (projectId, editSessionId) => client.request('project.editSessions.preference.options', { projectId, editSessionId }),
    get: (editSessionId) => client.request('project.editSessions.preference.get', { editSessionId }),
    apply: (input) => client.request('project.editSessions.preference.apply', input),
    clear: (editSessionId) => client.request('project.editSessions.preference.clear', { editSessionId }),
    dnaSummary: (input) => client.request('project.editSessions.preference.dnaSummary', input),
    applicationSummary: (editSessionId) => client.request('project.editSessions.preference.applicationSummary', { editSessionId }),
    stageApplication: (input) => client.request('project.editSessions.preference.application.stage', input),
    activateApplication: (input) => client.request('project.editSessions.preference.application.activate', input),
  }

  return client
}

export function createDefaultMockProjectEditSessionApiClient(
  options: ProjectEditSessionApiClientOptions = {},
): MockProjectEditSessionApiClient {
  const cacheKey = mockDatabaseCacheKey(options)
  const db = options.mockDatabase ?? (options.preserveMockSession === false ? createMockDatabase() : getSharedMockDatabase(options))
  if (!options.mockDatabase && options.preserveMockSession !== false) {
    mockProjectEditSessionDatabases.set(cacheKey, db)
  }
  const client = createProjectEditSessionApiClient({
    ...options,
    mode: 'mock_browser',
    preserveMockSession: true,
    mockDatabase: db,
  }) as MockProjectEditSessionApiClient

  client.getMockDatabase = () => db
  client.resetMockDatabase = () => {
    Object.assign(db, createMockDatabase())
    if (options.preserveMockSession !== false) {
      mockProjectEditSessionDatabases.set(cacheKey, db)
    }
    return db
  }

  return client
}
