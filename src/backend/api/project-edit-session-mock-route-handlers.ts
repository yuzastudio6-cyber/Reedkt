import type {
  ApiRequestEnvelope,
  ApiResponseEnvelope,
  ApiRouteHandler,
  ApiRuntimeContext,
} from './api-runtime-contracts'
import {
  PROJECT_EDIT_SESSION_API_ROUTE_IDS,
  type ProjectEditSessionApiRouteId,
} from '../../types/api-routes'
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
} from '../../types/project-edit-session'
import type { UserFacingEditLevel } from '../../types/reeditpro'
import type { ProjectEditSessionRepositoryResult } from '../../types/project-edit-session-repository'
import { createMockDatabase, type MockDatabase } from '../mock/mock-database'
import { createMockProjectEditSessionRepository } from '../repositories/mock-project-edit-session-repository'
import {
  applyPreferenceToProjectEditSessionMock,
  clearPreferenceFromProjectEditSessionMock,
  createProjectEditSessionPreferenceApplicationSummary,
} from '../project-edit-session-preference/project-edit-session-preference-application-service'
import {
  findProjectEditSessionPreferenceOption,
  listProjectEditSessionPreferenceOptions,
} from '../project-edit-session-preference/project-edit-session-preference-option-service'
import { createPreferenceStateFromSession } from '../project-edit-session-preference/project-edit-session-preference-state-service'
import {
  createProjectEditSessionPreferencePanelModel,
  createProjectEditSessionPreferenceReadableSummary,
} from '../project-edit-session-preference/project-edit-session-preference-summary-service'
import {
  loadPreferenceDNASummaryForSessionPreference,
} from '../project-edit-session-preference/project-edit-session-preference-dna-bridge-service'
import { validateProjectEditSessionPreferenceApplicationPlan } from '../project-edit-session-preference/project-edit-session-preference-validation-service'
import type { ProjectEditSessionPreferenceApplicationPlan } from '../../types/project-edit-session-preference'

type RequestRecord = Record<string, unknown>
type RouteData = Record<string, unknown>

interface MockApiRuntimeContextWithDatabase extends ApiRuntimeContext {
  mockDatabase?: MockDatabase
}

const runtimeMockDatabase = createMockDatabase()
const DEFAULT_PROJECT_ID = 'mock-project-edit-chat-foundation'

const NO_PRODUCTION_EFFECTS = {
  providerCallMade: false,
  supabaseWriteMade: false,
  generationRequestCreated: false,
  renderJobCreated: false,
  workerJobCreated: false,
  creditReservedOrSpent: false,
} as const

const PROJECT_EDIT_SESSION_ROUTE_SAFETY_FLAGS = {
  ...NO_PRODUCTION_EFFECTS,
  storageReadMade: false,
  storageWriteMade: false,
  fileBytesRead: false,
  externalUrlFetched: false,
  mediaProcessingStarted: false,
} as const

export function createProjectEditSessionRouteSafetyFlags() {
  return { ...PROJECT_EDIT_SESSION_ROUTE_SAFETY_FLAGS }
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

function numberValue(value: RequestRecord, key: string, fallback: number): number {
  const raw = value[key]
  return typeof raw === 'number' && Number.isFinite(raw) ? raw : fallback
}

function booleanValue(value: RequestRecord, key: string, fallback = false): boolean {
  const raw = value[key]
  return typeof raw === 'boolean' ? raw : fallback
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function recordArray(value: unknown): RequestRecord[] {
  return Array.isArray(value) ? value.map(asRecord) : []
}

function requestBody(request: ApiRequestEnvelope): RequestRecord {
  return asRecord(request.body)
}

function contextWithDatabase(request: ApiRequestEnvelope): MockApiRuntimeContextWithDatabase {
  return request.context as MockApiRuntimeContextWithDatabase
}

function dbFor(request: ApiRequestEnvelope): MockDatabase {
  return contextWithDatabase(request).mockDatabase ?? runtimeMockDatabase
}

function repositoryFor(request: ApiRequestEnvelope) {
  const body = requestBody(request)
  return createMockProjectEditSessionRepository({
    db: dbFor(request),
    workspaceId: optionalString(body, 'workspaceId') ?? request.context.workspaceId,
    projectId: optionalString(body, 'projectId') ?? request.context.projectId,
    editSessionId: optionalString(body, 'editSessionId'),
    userId: optionalString(body, 'userId') ?? request.context.userId,
  })
}

function projectIdFor(request: ApiRequestEnvelope, body: RequestRecord = requestBody(request)): string {
  return optionalString(body, 'projectId') ?? request.context.projectId ?? DEFAULT_PROJECT_ID
}

async function editSessionIdFor(request: ApiRequestEnvelope, body: RequestRecord = requestBody(request)): Promise<string | undefined> {
  const explicit = optionalString(body, 'editSessionId')
    ?? optionalString(body, 'id')
    ?? optionalString(body, 'sessionId')
  if (explicit) return explicit
  const list = await repositoryFor(request).listProjectEditSessions({
    projectId: projectIdFor(request, body),
    includeArchived: true,
  })
  return list.data?.[0]?.id
}

function withSafety<TData extends RouteData>(data: TData): TData & {
  safety: ReturnType<typeof createProjectEditSessionRouteSafetyFlags>
} {
  return {
    ...data,
    safety: createProjectEditSessionRouteSafetyFlags(),
  }
}

function success<TData extends RouteData>(
  data: TData,
  warnings: string[] = [],
): ApiResponseEnvelope<TData & { safety: ReturnType<typeof createProjectEditSessionRouteSafetyFlags> }> {
  return {
    ok: true,
    statusCode: 200,
    data: withSafety(data),
    warnings: [
      'Project Edit Session mock route used repository-backed MockDatabase state only.',
      ...warnings,
    ],
    mockOnly: true,
    ...NO_PRODUCTION_EFFECTS,
  }
}

function failure(
  code: string,
  message: string,
  statusCode = 400,
  details: RequestRecord = {},
  warnings: string[] = [],
): ApiResponseEnvelope {
  return {
    ok: false,
    statusCode,
    error: {
      code,
      message,
      details: {
        ...details,
        safety: createProjectEditSessionRouteSafetyFlags(),
      },
    },
    warnings: [
      'Project Edit Session mock route failed before any production side effect.',
      ...warnings,
    ],
    mockOnly: true,
    ...NO_PRODUCTION_EFFECTS,
  }
}

function fromRepositoryResult<TData extends RouteData, TResult>(
  result: ProjectEditSessionRepositoryResult<TResult>,
  dataFactory: (data: TResult) => TData,
): ApiResponseEnvelope<TData & { safety: ReturnType<typeof createProjectEditSessionRouteSafetyFlags> }> | ApiResponseEnvelope {
  if (!result.ok || result.data === undefined) {
    return failure(
      result.error?.code ?? 'PROJECT_EDIT_SESSION_ROUTE_FAILED',
      result.error?.message ?? 'Project Edit Session repository operation failed.',
      404,
      { repositoryMode: result.repositoryMode },
      result.warnings,
    )
  }

  return success(dataFactory(result.data), result.warnings)
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

function routeSummaryForBundle(bundle: unknown) {
  const value = asRecord(bundle)
  const messages = Array.isArray(value.messages) ? value.messages.length : 0
  const sources = Array.isArray(value.sources) ? value.sources.length : 0
  const memories = Array.isArray(value.memories) ? value.memories.length : 0
  const versions = Array.isArray(value.versions) ? value.versions.length : 0
  return [
    `Edit Chat bundle loaded with ${messages} message(s), ${sources} source(s), ${memories} memory layer(s), and ${versions} version(s).`,
    'Bundle is mock/local and adapted for future Project Home or Edit Chat UI use.',
  ]
}

async function persistPreferenceApplicationPlan(
  repository: ReturnType<typeof repositoryFor>,
  plan: ProjectEditSessionPreferenceApplicationPlan,
) {
  const updated = await repository.updateProjectEditSession({
    editSessionId: plan.editSessionId,
    patch: plan.sessionUpdates,
  })
  if (!updated.ok || !updated.data) return { updated, memories: [], events: [], snapshot: undefined }

  const memories = []
  for (const memory of plan.memoryUpdates) {
    const saved = await repository.upsertSessionMemory({
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
    const saved = await repository.appendSessionEvent({
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

  const snapshot = await repository.saveSessionSnapshot({
    projectId: plan.projectId,
    editSessionId: plan.editSessionId,
    kind: 'manual_checkpoint',
    summary: plan.snapshotSummary ?? 'Preference application checkpoint.',
    state: {
      rpMilestone: 'RP-EDITSESSION-10',
      preferenceStatus: plan.status,
      selectedEditPreferenceHandle: plan.option.handle,
      sideEffects: createProjectEditSessionRouteSafetyFlags(),
    },
  })

  return {
    updated,
    memories,
    events,
    snapshot: snapshot.ok ? snapshot.data : undefined,
  }
}

async function ensureEditSessionId(request: ApiRequestEnvelope, body: RequestRecord): Promise<string | ApiResponseEnvelope> {
  const editSessionId = await editSessionIdFor(request, body)
  if (!editSessionId) return failure('PROJECT_EDIT_SESSION_ID_REQUIRED', 'A Project Edit Session id is required.', 400)
  return editSessionId
}

export async function handleProjectEditSessionMockRoute(request: ApiRequestEnvelope): Promise<ApiResponseEnvelope> {
  if (!PROJECT_EDIT_SESSION_API_ROUTE_IDS.includes(request.routeId as ProjectEditSessionApiRouteId)) {
    return failure(
      'PROJECT_EDIT_SESSION_ROUTE_NOT_REGISTERED',
      `${request.routeId} is not a Project Edit Session mock route.`,
      404,
      { routeId: request.routeId },
    )
  }

  const routeId = request.routeId as ProjectEditSessionApiRouteId
  const body = requestBody(request)
  const repository = repositoryFor(request)

  switch (routeId) {
    case 'project.editSessions.list':
      return fromRepositoryResult(
        await repository.listProjectEditSessions({
          projectId: projectIdFor(request, body),
          includeArchived: booleanValue(body, 'includeArchived'),
          status: sessionStatus(body.status),
        }),
        (sessions) => ({ sessions }),
      )

    case 'project.editSessions.get': {
      const editSessionId = await ensureEditSessionId(request, body)
      if (typeof editSessionId !== 'string') return editSessionId
      return fromRepositoryResult(await repository.getProjectEditSession(editSessionId), (session) => ({ session }))
    }

    case 'project.editSessions.create':
      return fromRepositoryResult(
        await repository.createProjectEditSession({
          id: optionalString(body, 'id'),
          projectId: projectIdFor(request, body),
          workspaceId: optionalString(body, 'workspaceId') ?? request.context.workspaceId,
          ownerUserId: optionalString(body, 'ownerUserId') ?? request.context.userId,
          name: stringValue(body, 'name', 'Untitled Edit Chat'),
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
        }),
        (session) => ({ session }),
      )

    case 'project.editSessions.update': {
      const editSessionId = await ensureEditSessionId(request, body)
      if (typeof editSessionId !== 'string') return editSessionId
      return fromRepositoryResult(
        await repository.updateProjectEditSession({
          editSessionId,
          patch: asRecord(body.patch),
        }),
        (session) => ({ session }),
      )
    }

    case 'project.editSessions.archive': {
      const editSessionId = await ensureEditSessionId(request, body)
      if (typeof editSessionId !== 'string') return editSessionId
      return fromRepositoryResult(await repository.archiveProjectEditSession(editSessionId), (session) => ({ session }))
    }

    case 'project.editSessions.duplicate': {
      const editSessionId = await ensureEditSessionId(request, body)
      if (typeof editSessionId !== 'string') return editSessionId
      return fromRepositoryResult(
        await repository.duplicateProjectEditSession({
          editSessionId,
          newId: optionalString(body, 'newId'),
          newName: optionalString(body, 'newName'),
          projectId: optionalString(body, 'projectId'),
        }),
        (session) => ({ session }),
      )
    }

    case 'project.editSessions.cardModels.list':
      return fromRepositoryResult(await repository.listSessionCardModels(projectIdFor(request, body)), (cardModels) => ({ cardModels }))

    case 'project.editSessions.cardModels.get': {
      const editSessionId = await ensureEditSessionId(request, body)
      if (typeof editSessionId !== 'string') return editSessionId
      return fromRepositoryResult(await repository.createSessionCardModel(editSessionId), (cardModel) => ({ cardModel }))
    }

    case 'project.editSessions.bundle.get': {
      const editSessionId = await ensureEditSessionId(request, body)
      if (typeof editSessionId !== 'string') return editSessionId
      return fromRepositoryResult(await repository.createSessionBundle(editSessionId), (bundle) => ({ bundle }))
    }

    case 'project.editSessions.summary.get': {
      const editSessionId = await ensureEditSessionId(request, body)
      if (typeof editSessionId !== 'string') return editSessionId
      const bundle = await repository.createSessionBundle(editSessionId)
      return fromRepositoryResult(bundle, (data) => ({
        editSessionId,
        summary: routeSummaryForBundle(data),
        bundle: data,
      }))
    }

    case 'project.editSessions.messages.list': {
      const editSessionId = await ensureEditSessionId(request, body)
      if (typeof editSessionId !== 'string') return editSessionId
      return fromRepositoryResult(await repository.listSessionMessages(editSessionId), (messages) => ({ messages }))
    }

    case 'project.editSessions.messages.append': {
      const editSessionId = await ensureEditSessionId(request, body)
      if (typeof editSessionId !== 'string') return editSessionId
      return fromRepositoryResult(
        await repository.appendSessionMessage({
          id: optionalString(body, 'id'),
          projectId: projectIdFor(request, body),
          editSessionId,
          role: messageRole(body.role),
          kind: messageKind(body.kind),
          text: stringValue(body, 'text', 'Mock Edit Chat message.'),
          relatedSnapshotId: optionalString(body, 'relatedSnapshotId'),
          relatedVersionId: optionalString(body, 'relatedVersionId'),
          relatedPreviewId: optionalString(body, 'relatedPreviewId'),
          metadata: asRecord(body.metadata),
        }),
        (message) => ({ message }),
      )
    }

    case 'project.editSessions.sources.list': {
      const editSessionId = await ensureEditSessionId(request, body)
      if (typeof editSessionId !== 'string') return editSessionId
      return fromRepositoryResult(await repository.listSessionSources(editSessionId), (sources) => ({ sources }))
    }

    case 'project.editSessions.sources.save': {
      const editSessionId = await ensureEditSessionId(request, body)
      if (typeof editSessionId !== 'string') return editSessionId
      return fromRepositoryResult(
        await repository.saveSessionSource({
          id: optionalString(body, 'id'),
          projectId: projectIdFor(request, body),
          editSessionId,
          mediaAssetId: stringValue(body, 'mediaAssetId', 'mock-session-source-media'),
          sourceOrderIndex: numberValue(body, 'sourceOrderIndex', 1),
          label: optionalString(body, 'label'),
          notes: stringArray(body.notes),
          importance: sourceImportance(body.importance),
          thumbnailUrl: optionalString(body, 'thumbnailUrl'),
          previewUrl: optionalString(body, 'previewUrl'),
          durationSeconds: typeof body.durationSeconds === 'number' ? body.durationSeconds : undefined,
          mimeType: optionalString(body, 'mimeType'),
        }),
        (source) => ({ source }),
      )
    }

    case 'project.editSessions.sources.saveMany': {
      const editSessionId = await ensureEditSessionId(request, body)
      if (typeof editSessionId !== 'string') return editSessionId
      return fromRepositoryResult(
        await repository.saveSessionSources({
          editSessionId,
          sources: recordArray(body.sources).map((source, index) => ({
            id: optionalString(source, 'id'),
            projectId: projectIdFor(request, source),
            editSessionId,
            mediaAssetId: stringValue(source, 'mediaAssetId', `mock-session-source-media-${index + 1}`),
            sourceOrderIndex: numberValue(source, 'sourceOrderIndex', index + 1),
            label: optionalString(source, 'label'),
            notes: stringArray(source.notes),
            importance: sourceImportance(source.importance),
            thumbnailUrl: optionalString(source, 'thumbnailUrl'),
            previewUrl: optionalString(source, 'previewUrl'),
            durationSeconds: typeof source.durationSeconds === 'number' ? source.durationSeconds : undefined,
            mimeType: optionalString(source, 'mimeType'),
          })),
        }),
        (sources) => ({ sources }),
      )
    }

    case 'project.editSessions.memory.list': {
      const editSessionId = await ensureEditSessionId(request, body)
      if (typeof editSessionId !== 'string') return editSessionId
      return fromRepositoryResult(await repository.listSessionMemory(editSessionId), (memories) => ({ memories }))
    }

    case 'project.editSessions.memory.getLayer': {
      const editSessionId = await ensureEditSessionId(request, body)
      if (typeof editSessionId !== 'string') return editSessionId
      return fromRepositoryResult(
        await repository.getSessionMemoryLayer({ editSessionId, layer: memoryLayer(body.layer) }),
        (memory) => ({ memory }),
      )
    }

    case 'project.editSessions.memory.upsert': {
      const editSessionId = await ensureEditSessionId(request, body)
      if (typeof editSessionId !== 'string') return editSessionId
      return fromRepositoryResult(
        await repository.upsertSessionMemory({
          id: optionalString(body, 'id'),
          projectId: projectIdFor(request, body),
          editSessionId,
          layer: memoryLayer(body.layer),
          summary: stringValue(body, 'summary', 'Mock Edit Chat memory layer.'),
          facts: stringArray(body.facts),
          preferences: stringArray(body.preferences),
          warnings: stringArray(body.warnings),
          updatedFromMessageId: optionalString(body, 'updatedFromMessageId'),
          updatedFromRevisionId: optionalString(body, 'updatedFromRevisionId'),
          metadata: asRecord(body.metadata),
        }),
        (memory) => ({ memory }),
      )
    }

    case 'project.editSessions.snapshots.save': {
      const editSessionId = await ensureEditSessionId(request, body)
      if (typeof editSessionId !== 'string') return editSessionId
      return fromRepositoryResult(
        await repository.saveSessionSnapshot({
          id: optionalString(body, 'id'),
          projectId: projectIdFor(request, body),
          editSessionId,
          kind: snapshotKind(body.kind),
          versionNumber: typeof body.versionNumber === 'number' ? body.versionNumber : undefined,
          messageId: optionalString(body, 'messageId'),
          summary: stringValue(body, 'summary', 'Mock Edit Chat snapshot.'),
          state: asRecord(body.state),
        }),
        (snapshot) => ({ snapshot }),
      )
    }

    case 'project.editSessions.snapshots.latest': {
      const editSessionId = await ensureEditSessionId(request, body)
      if (typeof editSessionId !== 'string') return editSessionId
      return fromRepositoryResult(await repository.getLatestSessionSnapshot(editSessionId), (snapshot) => ({ snapshot }))
    }

    case 'project.editSessions.snapshots.list': {
      const editSessionId = await ensureEditSessionId(request, body)
      if (typeof editSessionId !== 'string') return editSessionId
      return fromRepositoryResult(await repository.listSessionSnapshots(editSessionId), (snapshots) => ({ snapshots }))
    }

    case 'project.editSessions.versions.save': {
      const editSessionId = await ensureEditSessionId(request, body)
      if (typeof editSessionId !== 'string') return editSessionId
      return fromRepositoryResult(
        await repository.saveSessionVersion({
          id: optionalString(body, 'id'),
          projectId: projectIdFor(request, body),
          editSessionId,
          versionNumber: typeof body.versionNumber === 'number' ? body.versionNumber : undefined,
          status: versionStatus(body.status),
          name: stringValue(body, 'name', 'Mock Edit Chat Version'),
          summary: stringValue(body, 'summary', 'Mock version saved for future UI.'),
          createdFromSnapshotId: optionalString(body, 'createdFromSnapshotId'),
          createdFromMessageId: optionalString(body, 'createdFromMessageId'),
          previewId: optionalString(body, 'previewId'),
          metadata: asRecord(body.metadata),
        }),
        (version) => ({ version }),
      )
    }

    case 'project.editSessions.versions.latest': {
      const editSessionId = await ensureEditSessionId(request, body)
      if (typeof editSessionId !== 'string') return editSessionId
      return fromRepositoryResult(await repository.getLatestSessionVersion(editSessionId), (version) => ({ version }))
    }

    case 'project.editSessions.versions.list': {
      const editSessionId = await ensureEditSessionId(request, body)
      if (typeof editSessionId !== 'string') return editSessionId
      return fromRepositoryResult(await repository.listSessionVersions(editSessionId), (versions) => ({ versions }))
    }

    case 'project.editSessions.previews.save': {
      const editSessionId = await ensureEditSessionId(request, body)
      if (typeof editSessionId !== 'string') return editSessionId
      return fromRepositoryResult(
        await repository.saveSessionPreview({
          id: optionalString(body, 'id'),
          projectId: projectIdFor(request, body),
          editSessionId,
          versionId: optionalString(body, 'versionId'),
          status: previewStatus(body.status),
          thumbnailUrl: optionalString(body, 'thumbnailUrl'),
          previewUrl: optionalString(body, 'previewUrl'),
          aspectRatio: aspectRatio(body.aspectRatio),
          durationSeconds: typeof body.durationSeconds === 'number' ? body.durationSeconds : undefined,
          metadata: asRecord(body.metadata),
        }),
        (preview) => ({ preview }),
      )
    }

    case 'project.editSessions.previews.latest': {
      const editSessionId = await ensureEditSessionId(request, body)
      if (typeof editSessionId !== 'string') return editSessionId
      return fromRepositoryResult(await repository.getLatestSessionPreview(editSessionId), (preview) => ({ preview }))
    }

    case 'project.editSessions.previews.list': {
      const editSessionId = await ensureEditSessionId(request, body)
      if (typeof editSessionId !== 'string') return editSessionId
      return fromRepositoryResult(await repository.listSessionPreviews(editSessionId), (previews) => ({ previews }))
    }

    case 'project.editSessions.revisions.save': {
      const editSessionId = await ensureEditSessionId(request, body)
      if (typeof editSessionId !== 'string') return editSessionId
      return fromRepositoryResult(
        await repository.saveSessionRevision({
          id: optionalString(body, 'id'),
          projectId: projectIdFor(request, body),
          editSessionId,
          requestedByMessageId: stringValue(body, 'requestedByMessageId', `${editSessionId}-message-user-brief`),
          summary: stringValue(body, 'summary', 'Mock revision saved for future Edit Chat UI.'),
          userInstruction: stringValue(body, 'userInstruction', 'Revise this mock Edit Chat.'),
          resetsApproval: booleanValue(body, 'resetsApproval', true),
          createdSnapshotId: optionalString(body, 'createdSnapshotId'),
          createdVersionId: optionalString(body, 'createdVersionId'),
          metadata: asRecord(body.metadata),
        }),
        (revision) => ({ revision }),
      )
    }

    case 'project.editSessions.revisions.list': {
      const editSessionId = await ensureEditSessionId(request, body)
      if (typeof editSessionId !== 'string') return editSessionId
      return fromRepositoryResult(await repository.listSessionRevisions(editSessionId), (revisions) => ({ revisions }))
    }

    case 'project.editSessions.events.append': {
      const editSessionId = await ensureEditSessionId(request, body)
      if (typeof editSessionId !== 'string') return editSessionId
      return fromRepositoryResult(
        await repository.appendSessionEvent({
          id: optionalString(body, 'id'),
          projectId: projectIdFor(request, body),
          editSessionId,
          eventType: stringValue(body, 'eventType', 'mock_api_event'),
          summary: stringValue(body, 'summary', 'Mock Project Edit Session route event.'),
          metadata: asRecord(body.metadata),
        }),
        (event) => ({ event }),
      )
    }

    case 'project.editSessions.events.list': {
      const editSessionId = await ensureEditSessionId(request, body)
      if (typeof editSessionId !== 'string') return editSessionId
      return fromRepositoryResult(await repository.listSessionEvents(editSessionId), (events) => ({ events }))
    }

    case 'project.editSessions.preference.options': {
      const options = listProjectEditSessionPreferenceOptions(dbFor(request))
      return success({
        options,
        summary: [
          `${options.length} mock Edit Preference option(s) available for Edit Chats.`,
          'Options are mock/local metadata only and cannot start setup, render, workers, providers, or credits.',
        ],
      })
    }

    case 'project.editSessions.preference.get': {
      const editSessionId = await ensureEditSessionId(request, body)
      if (typeof editSessionId !== 'string') return editSessionId
      const sessionResult = await repository.getProjectEditSession(editSessionId)
      if (!sessionResult.ok || !sessionResult.data) return fromRepositoryResult(sessionResult, (session) => ({ session }))
      const state = createPreferenceStateFromSession(sessionResult.data)
      return success({
        state,
        panelModel: createProjectEditSessionPreferencePanelModel(state),
        summary: createProjectEditSessionPreferenceReadableSummary(state),
      })
    }

    case 'project.editSessions.preference.apply': {
      const editSessionId = await ensureEditSessionId(request, body)
      if (typeof editSessionId !== 'string') return editSessionId
      const sessionResult = await repository.getProjectEditSession(editSessionId)
      if (!sessionResult.ok || !sessionResult.data) return fromRepositoryResult(sessionResult, (session) => ({ session }))
      const option = findProjectEditSessionPreferenceOption(
        dbFor(request),
        optionalString(body, 'preferenceOptionId') ?? optionalString(body, 'preferenceHandle') ?? optionalString(body, 'handle'),
      )
      const plan = applyPreferenceToProjectEditSessionMock({
        projectId: projectIdFor(request, body),
        editSessionId,
        option,
        currentSession: sessionResult.data,
      })
      const persisted = await persistPreferenceApplicationPlan(repository, plan)
      if (!persisted.updated.ok || !persisted.updated.data) return fromRepositoryResult(persisted.updated, (session) => ({ session }))
      const state = createPreferenceStateFromSession(persisted.updated.data)
      return success({
        session: persisted.updated.data,
        state,
        applicationPlan: plan,
        panelModel: createProjectEditSessionPreferencePanelModel(state, plan),
        memories: persisted.memories,
        events: persisted.events,
        snapshot: persisted.snapshot,
        validation: validateProjectEditSessionPreferenceApplicationPlan(plan),
        summary: createProjectEditSessionPreferenceApplicationSummary(plan),
      }, plan.warnings)
    }

    case 'project.editSessions.preference.clear': {
      const editSessionId = await ensureEditSessionId(request, body)
      if (typeof editSessionId !== 'string') return editSessionId
      const sessionResult = await repository.getProjectEditSession(editSessionId)
      if (!sessionResult.ok || !sessionResult.data) return fromRepositoryResult(sessionResult, (session) => ({ session }))
      const plan = clearPreferenceFromProjectEditSessionMock({
        projectId: projectIdFor(request, body),
        editSessionId,
        currentSession: sessionResult.data,
      })
      const persisted = await persistPreferenceApplicationPlan(repository, plan)
      if (!persisted.updated.ok || !persisted.updated.data) return fromRepositoryResult(persisted.updated, (session) => ({ session }))
      const state = createPreferenceStateFromSession(persisted.updated.data)
      return success({
        session: persisted.updated.data,
        state,
        applicationPlan: plan,
        panelModel: createProjectEditSessionPreferencePanelModel(state, plan),
        memories: persisted.memories,
        events: persisted.events,
        snapshot: persisted.snapshot,
        validation: validateProjectEditSessionPreferenceApplicationPlan(plan),
        summary: createProjectEditSessionPreferenceApplicationSummary(plan),
      }, plan.warnings)
    }

    case 'project.editSessions.preference.dnaSummary': {
      const option = findProjectEditSessionPreferenceOption(
        dbFor(request),
        optionalString(body, 'preferenceOptionId') ?? optionalString(body, 'preferenceHandle') ?? optionalString(body, 'handle') ?? '@lifestyle-travel-vlog',
      )
      return success({
        option,
        summary: loadPreferenceDNASummaryForSessionPreference(option),
      })
    }

    case 'project.editSessions.preference.applicationSummary': {
      const editSessionId = await ensureEditSessionId(request, body)
      if (typeof editSessionId !== 'string') return editSessionId
      const sessionResult = await repository.getProjectEditSession(editSessionId)
      if (!sessionResult.ok || !sessionResult.data) return fromRepositoryResult(sessionResult, (session) => ({ session }))
      const state = createPreferenceStateFromSession(sessionResult.data)
      return success({
        state,
        panelModel: createProjectEditSessionPreferencePanelModel(state),
        summary: createProjectEditSessionPreferenceReadableSummary(state),
      })
    }

    default:
      return failure('PROJECT_EDIT_SESSION_ROUTE_UNHANDLED', `${routeId} is registered but has no Project Edit Session mock handler.`, 501)
  }
}

export function createProjectEditSessionMockRouteResponse<TData extends RouteData>(
  data: TData,
  warnings: string[] = [],
): ApiResponseEnvelope<TData & { safety: ReturnType<typeof createProjectEditSessionRouteSafetyFlags> }> {
  return success(data, warnings)
}

export function hasProjectEditSessionMockRouteHandler(routeId: string): routeId is ProjectEditSessionApiRouteId {
  return PROJECT_EDIT_SESSION_API_ROUTE_IDS.includes(routeId as ProjectEditSessionApiRouteId)
}

export const PROJECT_EDIT_SESSION_MOCK_ROUTE_HANDLERS = Object.fromEntries(
  PROJECT_EDIT_SESSION_API_ROUTE_IDS.map((routeId) => [routeId, handleProjectEditSessionMockRoute as ApiRouteHandler]),
) as Record<ProjectEditSessionApiRouteId, ApiRouteHandler>
