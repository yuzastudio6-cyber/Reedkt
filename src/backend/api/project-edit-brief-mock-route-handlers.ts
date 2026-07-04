import type {
  ApiRequestEnvelope,
  ApiResponseEnvelope,
  ApiRouteHandler,
  ApiRuntimeContext,
} from './api-runtime-contracts'
import {
  PROJECT_EDIT_BRIEF_API_ROUTE_IDS,
  type ProjectEditBriefApiRouteId,
} from '../../types/api-routes'
import type {
  ProjectEditBriefAudioBehavior,
  ProjectEditBriefAttachmentKind,
  ProjectEditBriefAttachmentStatus,
  ProjectEditBriefCaptionBehavior,
  ProjectEditBriefMarkerAIMode,
  ProjectEditBriefMarkerIntentAction,
  ProjectEditBriefMarkerIntentStatus,
  ProjectEditBriefMarkerMessageKind,
  ProjectEditBriefMarkerMessageRole,
  ProjectEditBriefMarkerPriority,
  ProjectEditBriefMarkerStatus,
  ProjectEditBriefMarkerTimeMode,
  ProjectEditBriefMarkerType,
  ProjectEditBriefQAStatus,
  ProjectEditBriefRecord,
  ProjectEditBriefVisualBehavior,
  ProjectEditSessionExportSettingsRecord,
} from '../../types/project-edit-brief'
import type { ProjectEditBriefRepositoryResult } from '../../types/project-edit-brief-repository'
import { createMockDatabase, type MockDatabase } from '../mock/mock-database'
import { createProjectEditBriefInternalPersistenceBackend } from '../project-edit-brief-production/internal-persistence-backend'
import { runQwenMarkerChatBridge } from '../qwen-runtime/qwen-marker-chat-bridge-service'

type RequestRecord = Record<string, unknown>
type RouteData = Record<string, unknown>

interface MockApiRuntimeContextWithDatabase extends ApiRuntimeContext {
  mockDatabase?: MockDatabase
}

const DEFAULT_PROJECT_ID = 'mock-project-edit-chat-foundation'
const runtimeMockDatabases = new Map<string, MockDatabase>()

const NO_PRODUCTION_EFFECTS = {
  providerCallMade: false,
  supabaseWriteMade: false,
  generationRequestCreated: false,
  renderJobCreated: false,
  workerJobCreated: false,
  creditReservedOrSpent: false,
} as const

const PROJECT_EDIT_BRIEF_ROUTE_SAFETY_FLAGS = {
  ...NO_PRODUCTION_EFFECTS,
  modelCallMade: false,
  supabaseReadMade: false,
  storageReadMade: false,
  storageWriteMade: false,
  signedUrlCreated: false,
  fileBytesRead: false,
  externalUrlFetched: false,
  mediaProcessingStarted: false,
} as const

export function createProjectEditBriefRouteSafetyFlags() {
  return { ...PROJECT_EDIT_BRIEF_ROUTE_SAFETY_FLAGS }
}

function asRecord(value: unknown): RequestRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as RequestRecord : {}
}

function requestBody(request: ApiRequestEnvelope): RequestRecord {
  return asRecord(request.body)
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

function contextWithDatabase(request: ApiRequestEnvelope): MockApiRuntimeContextWithDatabase {
  return request.context as MockApiRuntimeContextWithDatabase
}

function mockDatabaseCacheKey(request: ApiRequestEnvelope): string {
  const body = requestBody(request)
  return [
    optionalString(body, 'workspaceId') ?? request.context.workspaceId ?? 'default-workspace',
    optionalString(body, 'projectId') ?? request.context.projectId ?? DEFAULT_PROJECT_ID,
    optionalString(body, 'userId') ?? request.context.userId ?? 'default-user',
  ].join(':')
}

function dbFor(request: ApiRequestEnvelope): MockDatabase {
  const injected = contextWithDatabase(request).mockDatabase
  if (injected) return injected
  const key = mockDatabaseCacheKey(request)
  const existing = runtimeMockDatabases.get(key)
  if (existing) return existing
  const db = createMockDatabase()
  runtimeMockDatabases.set(key, db)
  return db
}

function repositoryFor(request: ApiRequestEnvelope) {
  const body = requestBody(request)
  return createProjectEditBriefInternalPersistenceBackend({
    mode: 'mock_internal',
    db: dbFor(request),
    workspaceId: optionalString(body, 'workspaceId') ?? request.context.workspaceId,
    projectId: optionalString(body, 'projectId') ?? request.context.projectId,
    editSessionId: optionalString(body, 'editSessionId'),
    briefId: optionalString(body, 'briefId'),
    userId: optionalString(body, 'userId') ?? request.context.userId,
  }).repository
}

export function createProjectEditBriefRouteInternalPersistenceMeta() {
  return {
    decision: 'project_edit_brief_internal_route_integration_passed_ready_for_internal_testing_readback',
    backendDecision: 'project_edit_brief_internal_persistence_backend_skeleton_passed_ready_for_internal_route_integration',
    backendMode: 'mock_internal',
    supabaseLiveEnabled: false,
    productionRouteEnabled: false,
    idempotencyAuditPolicyKnown: true,
  } as const
}

function projectIdFor(request: ApiRequestEnvelope, body: RequestRecord = requestBody(request)): string {
  return optionalString(body, 'projectId') ?? request.context.projectId ?? DEFAULT_PROJECT_ID
}

function fallbackBrief(db: MockDatabase, body: RequestRecord): ProjectEditBriefRecord | undefined {
  const editSessionId = optionalString(body, 'editSessionId')
  if (editSessionId) {
    return db.projectEditBriefs.find((brief) => brief.editSessionId === editSessionId && brief.status !== 'archived')
  }
  return db.projectEditBriefs.find((brief) => brief.status !== 'archived') ?? db.projectEditBriefs[0]
}

async function briefIdFor(request: ApiRequestEnvelope, body: RequestRecord = requestBody(request)): Promise<string | undefined> {
  const explicit = optionalString(body, 'briefId') ?? optionalString(body, 'id')
  if (explicit) return explicit
  repositoryFor(request)
  const editSessionId = optionalString(body, 'editSessionId')
  if (editSessionId) {
    const result = await repositoryFor(request).getEditBriefForSession(editSessionId)
    if (result.data?.id) return result.data.id
  }
  return fallbackBrief(dbFor(request), body)?.id
}

async function markerIdFor(request: ApiRequestEnvelope, body: RequestRecord = requestBody(request)): Promise<string | undefined> {
  const explicit = optionalString(body, 'markerId') ?? optionalString(body, 'id')
  if (explicit) return explicit
  const briefId = await briefIdFor(request, body)
  if (!briefId) return undefined
  const markers = await repositoryFor(request).listMarkers(briefId)
  return markers.data?.[0]?.id
}

async function attachmentIdFor(request: ApiRequestEnvelope, body: RequestRecord = requestBody(request)): Promise<string | undefined> {
  const explicit = optionalString(body, 'attachmentId') ?? optionalString(body, 'id')
  if (explicit) return explicit
  const markerId = await markerIdFor(request, body)
  if (!markerId) return undefined
  const attachments = await repositoryFor(request).listMarkerAttachments(markerId)
  return attachments.data?.[0]?.id
}

async function intentIdFor(request: ApiRequestEnvelope, body: RequestRecord = requestBody(request)): Promise<string | undefined> {
  const explicit = optionalString(body, 'intentId') ?? optionalString(body, 'id')
  if (explicit) return explicit
  const markerId = await markerIdFor(request, body)
  if (!markerId) return undefined
  const intent = await repositoryFor(request).getMarkerIntent(markerId)
  return intent.data?.id
}

function withSafety<TData extends RouteData>(data: TData): TData & {
  safety: ReturnType<typeof createProjectEditBriefRouteSafetyFlags>
  internalPersistence: ReturnType<typeof createProjectEditBriefRouteInternalPersistenceMeta>
} {
  return {
    ...data,
    safety: createProjectEditBriefRouteSafetyFlags(),
    internalPersistence: createProjectEditBriefRouteInternalPersistenceMeta(),
  }
}

function success<TData extends RouteData>(
  data: TData,
  warnings: string[] = [],
): ApiResponseEnvelope<TData & { safety: ReturnType<typeof createProjectEditBriefRouteSafetyFlags> }> {
  return {
    ok: true,
    statusCode: 200,
    data: withSafety(data),
    warnings: [
      'Project Edit Brief mock route used the internal persistence backend skeleton with repository-backed MockDatabase state only.',
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
        safety: createProjectEditBriefRouteSafetyFlags(),
      },
    },
    warnings: [
      'Project Edit Brief mock route failed before any production side effect.',
      ...warnings,
    ],
    mockOnly: true,
    ...NO_PRODUCTION_EFFECTS,
  }
}

function fromRepositoryResult<TData extends RouteData, TResult>(
  result: ProjectEditBriefRepositoryResult<TResult>,
  dataFactory: (data: TResult) => TData,
): ApiResponseEnvelope<TData & { safety: ReturnType<typeof createProjectEditBriefRouteSafetyFlags> }> | ApiResponseEnvelope {
  if (!result.ok || result.data === undefined) {
    return failure(
      result.error?.code ?? 'PROJECT_EDIT_BRIEF_ROUTE_FAILED',
      result.error?.message ?? 'Project Edit Brief repository operation failed.',
      404,
      { repositoryMode: result.repositoryMode },
      result.warnings,
    )
  }
  return success(dataFactory(result.data), result.warnings)
}

function markerType(value: unknown): ProjectEditBriefMarkerType {
  const allowed: ProjectEditBriefMarkerType[] = [
    'broll',
    'cut_remove',
    'keep_emphasize',
    'caption_text',
    'graphic_card_ui',
    'music_soundtrack',
    'sfx_sound_design',
    'voiceover',
    'transition',
    'speed_pacing',
    'color_tone',
    'do_not_use',
    'general_note',
  ]
  return allowed.includes(value as ProjectEditBriefMarkerType) ? value as ProjectEditBriefMarkerType : 'general_note'
}

function markerStatus(value: unknown, fallback: ProjectEditBriefMarkerStatus = 'draft'): ProjectEditBriefMarkerStatus {
  const allowed: ProjectEditBriefMarkerStatus[] = [
    'draft',
    'needs_clarification',
    'needs_asset',
    'confirmed',
    'ready_for_plan',
    'conflict',
    'applied_to_plan',
    'changed_after_plan',
    'archived',
  ]
  return allowed.includes(value as ProjectEditBriefMarkerStatus) ? value as ProjectEditBriefMarkerStatus : fallback
}

function markerPriority(value: unknown): ProjectEditBriefMarkerPriority {
  return value === 'must_follow' || value === 'optional' || value === 'avoid' ? value : 'should_follow'
}

function markerTimeMode(value: unknown): ProjectEditBriefMarkerTimeMode {
  return value === 'range' ? 'range' : 'point'
}

function markerAiMode(value: unknown): ProjectEditBriefMarkerAIMode {
  const allowed: ProjectEditBriefMarkerAIMode[] = ['off', 'confirm_only', 'ask_clarifying_questions', 'suggest_options']
  return allowed.includes(value as ProjectEditBriefMarkerAIMode) ? value as ProjectEditBriefMarkerAIMode : 'confirm_only'
}

function markerQaStatus(value: unknown): ProjectEditBriefQAStatus {
  const allowed: ProjectEditBriefQAStatus[] = ['not_checked', 'passed', 'warning', 'needs_clarification', 'needs_asset', 'conflict', 'blocked']
  return allowed.includes(value as ProjectEditBriefQAStatus) ? value as ProjectEditBriefQAStatus : 'not_checked'
}

function attachmentKind(value: unknown): ProjectEditBriefAttachmentKind {
  const allowed: ProjectEditBriefAttachmentKind[] = [
    'broll_video',
    'image',
    'music_track',
    'soundtrack',
    'sfx',
    'voiceover',
    'document',
    'reference_label',
    'reference_url_metadata_only',
  ]
  return allowed.includes(value as ProjectEditBriefAttachmentKind) ? value as ProjectEditBriefAttachmentKind : 'reference_label'
}

function attachmentStatus(value: unknown): ProjectEditBriefAttachmentStatus {
  const allowed: ProjectEditBriefAttachmentStatus[] = ['metadata_only', 'mock_attached', 'needs_upload_future', 'missing_required_asset', 'blocked']
  return allowed.includes(value as ProjectEditBriefAttachmentStatus) ? value as ProjectEditBriefAttachmentStatus : 'metadata_only'
}

function messageRole(value: unknown): ProjectEditBriefMarkerMessageRole {
  return value === 'assistant' || value === 'system' || value === 'marker_status' ? value : 'user'
}

function messageKind(value: unknown): ProjectEditBriefMarkerMessageKind {
  const allowed: ProjectEditBriefMarkerMessageKind[] = [
    'note',
    'clarification_question',
    'clarification_answer',
    'confirmation',
    'intent_update',
    'asset_note',
    'conflict_note',
    'system_note',
  ]
  return allowed.includes(value as ProjectEditBriefMarkerMessageKind) ? value as ProjectEditBriefMarkerMessageKind : 'note'
}

function intentAction(value: unknown): ProjectEditBriefMarkerIntentAction {
  const allowed: ProjectEditBriefMarkerIntentAction[] = [
    'add_broll',
    'remove_or_cut',
    'keep_or_emphasize',
    'add_caption_or_text',
    'add_graphic_or_ui_card',
    'add_music_or_soundtrack',
    'add_sfx',
    'add_voiceover',
    'add_transition',
    'adjust_speed_or_pacing',
    'adjust_color_or_tone',
    'avoid_or_do_not_use',
    'general_instruction',
  ]
  return allowed.includes(value as ProjectEditBriefMarkerIntentAction) ? value as ProjectEditBriefMarkerIntentAction : 'general_instruction'
}

function intentStatus(value: unknown): ProjectEditBriefMarkerIntentStatus {
  const allowed: ProjectEditBriefMarkerIntentStatus[] = [
    'not_extracted',
    'draft_intent',
    'needs_clarification',
    'needs_asset',
    'confirmed',
    'ready_for_plan',
    'conflict',
    'blocked',
  ]
  return allowed.includes(value as ProjectEditBriefMarkerIntentStatus) ? value as ProjectEditBriefMarkerIntentStatus : 'draft_intent'
}

function visualBehavior(value: unknown): ProjectEditBriefVisualBehavior {
  const allowed: ProjectEditBriefVisualBehavior[] = ['replace_visual', 'overlay_visual', 'insert_broll', 'add_graphic_overlay', 'keep_main_video', 'remove_section', 'no_visual_change', 'unspecified']
  return allowed.includes(value as ProjectEditBriefVisualBehavior) ? value as ProjectEditBriefVisualBehavior : 'unspecified'
}

function audioBehavior(value: unknown): ProjectEditBriefAudioBehavior {
  const allowed: ProjectEditBriefAudioBehavior[] = ['keep_original_audio', 'duck_original_audio', 'replace_with_music', 'add_music_under', 'add_sfx_only', 'mute_section', 'no_audio_change', 'unspecified']
  return allowed.includes(value as ProjectEditBriefAudioBehavior) ? value as ProjectEditBriefAudioBehavior : 'unspecified'
}

function captionBehavior(value: unknown): ProjectEditBriefCaptionBehavior {
  const allowed: ProjectEditBriefCaptionBehavior[] = ['add_caption', 'edit_caption', 'make_smaller', 'make_larger', 'remove_caption', 'keep_caption_style', 'no_caption_change', 'unspecified']
  return allowed.includes(value as ProjectEditBriefCaptionBehavior) ? value as ProjectEditBriefCaptionBehavior : 'unspecified'
}

async function requireBriefId(request: ApiRequestEnvelope, body: RequestRecord): Promise<string | ApiResponseEnvelope> {
  const briefId = await briefIdFor(request, body)
  return briefId ?? failure('PROJECT_EDIT_BRIEF_MISSING_BRIEF_ID', 'Project Edit Brief route requires a briefId or seeded session brief.', 400, body)
}

async function requireMarkerId(request: ApiRequestEnvelope, body: RequestRecord): Promise<string | ApiResponseEnvelope> {
  const markerId = await markerIdFor(request, body)
  return markerId ?? failure('PROJECT_EDIT_BRIEF_MISSING_MARKER_ID', 'Project Edit Brief route requires a markerId or seeded marker.', 400, body)
}

function isResponse(value: string | ApiResponseEnvelope): value is ApiResponseEnvelope {
  return typeof value !== 'string'
}

async function handleProjectEditBriefGet(request: ApiRequestEnvelope) {
  const body = requestBody(request)
  const briefId = await requireBriefId(request, body)
  if (isResponse(briefId)) return briefId
  return fromRepositoryResult(await repositoryFor(request).getEditBrief(briefId), (brief) => ({ brief }))
}

async function handleProjectEditBriefForSessionGet(request: ApiRequestEnvelope) {
  const body = requestBody(request)
  const editSessionId = stringValue(body, 'editSessionId', fallbackBrief(dbFor(request), body)?.editSessionId ?? 'edit-session-vertical-dna')
  return fromRepositoryResult(await repositoryFor(request).getEditBriefForSession(editSessionId), (brief) => ({ brief }))
}

async function handleProjectEditBriefCreate(request: ApiRequestEnvelope) {
  const body = requestBody(request)
  return fromRepositoryResult(await repositoryFor(request).createEditBrief({
    id: optionalString(body, 'id'),
    projectId: projectIdFor(request, body),
    editSessionId: stringValue(body, 'editSessionId', 'edit-session-api-brief-smoke'),
    title: stringValue(body, 'title', 'Mock Edit Brief'),
    summary: optionalString(body, 'summary') ?? 'Mock/local Edit Brief created through API route.',
    exportSettingsId: optionalString(body, 'exportSettingsId'),
    metadata: asRecord(body.metadata),
  }), (brief) => ({ brief }))
}

async function handleProjectEditBriefUpdate(request: ApiRequestEnvelope) {
  const body = requestBody(request)
  const briefId = await requireBriefId(request, body)
  if (isResponse(briefId)) return briefId
  return fromRepositoryResult(await repositoryFor(request).updateEditBrief({
    briefId,
    patch: asRecord(body.patch),
  }), (brief) => ({ brief }))
}

async function handleProjectEditBriefArchive(request: ApiRequestEnvelope) {
  const body = requestBody(request)
  const briefId = await requireBriefId(request, body)
  if (isResponse(briefId)) return briefId
  return fromRepositoryResult(await repositoryFor(request).archiveEditBrief(briefId), (brief) => ({ brief }))
}

async function handleProjectEditBriefSummary(request: ApiRequestEnvelope) {
  const body = requestBody(request)
  const briefId = await requireBriefId(request, body)
  if (isResponse(briefId)) return briefId
  return fromRepositoryResult(await repositoryFor(request).createBriefSummary(briefId), (summary) => ({ summary }))
}

async function handleProjectEditBriefBundle(request: ApiRequestEnvelope) {
  const body = requestBody(request)
  const briefId = await requireBriefId(request, body)
  if (isResponse(briefId)) return briefId
  return fromRepositoryResult(await repositoryFor(request).createBriefBundle(briefId), (bundle) => ({ bundle }))
}

async function handleMarkersList(request: ApiRequestEnvelope) {
  const body = requestBody(request)
  const briefId = await requireBriefId(request, body)
  if (isResponse(briefId)) return briefId
  return fromRepositoryResult(await repositoryFor(request).listMarkers(briefId), (markers) => ({ markers }))
}

async function handleMarkersGet(request: ApiRequestEnvelope) {
  const body = requestBody(request)
  const markerId = await requireMarkerId(request, body)
  if (isResponse(markerId)) return markerId
  return fromRepositoryResult(await repositoryFor(request).getMarker(markerId), (marker) => ({ marker }))
}

async function handleMarkersCreate(request: ApiRequestEnvelope) {
  const body = requestBody(request)
  const briefId = await requireBriefId(request, body)
  if (isResponse(briefId)) return briefId
  const brief = (await repositoryFor(request).getEditBrief(briefId)).data
  if (!brief) return failure('PROJECT_EDIT_BRIEF_NOT_FOUND', 'Project Edit Brief was not found for marker creation.', 404, { briefId })
  return fromRepositoryResult(await repositoryFor(request).createMarker({
    id: optionalString(body, 'id'),
    projectId: projectIdFor(request, body),
    editSessionId: stringValue(body, 'editSessionId', brief.editSessionId),
    briefId,
    marker: {
      markerType: markerType(body.markerType),
      status: markerStatus(body.status),
      priority: markerPriority(body.priority),
      timeMode: markerTimeMode(body.timeMode),
      startTimeSeconds: numberValue(body, 'startTimeSeconds', 0),
      endTimeSeconds: body.endTimeSeconds === undefined ? undefined : numberValue(body, 'endTimeSeconds', 0),
      title: stringValue(body, 'title', 'Mock timeline marker'),
      userNote: stringValue(body, 'userNote', 'Mock/local marker note.'),
      aiMode: markerAiMode(body.aiMode),
      intentId: optionalString(body, 'intentId'),
      qaStatus: markerQaStatus(body.qaStatus),
      metadata: asRecord(body.metadata),
    },
  }), (marker) => ({ marker }))
}

async function handleMarkersUpdate(request: ApiRequestEnvelope) {
  const body = requestBody(request)
  const markerId = await requireMarkerId(request, body)
  if (isResponse(markerId)) return markerId
  return fromRepositoryResult(await repositoryFor(request).updateMarker({
    markerId,
    patch: asRecord(body.patch),
  }), (marker) => ({ marker }))
}

async function handleMarkersDelete(request: ApiRequestEnvelope) {
  const body = requestBody(request)
  const markerId = await requireMarkerId(request, body)
  if (isResponse(markerId)) return markerId
  return fromRepositoryResult(await repositoryFor(request).deleteMarker(markerId), (result) => result)
}

async function handleMarkersConfirm(request: ApiRequestEnvelope) {
  const body = requestBody(request)
  const markerId = await requireMarkerId(request, body)
  if (isResponse(markerId)) return markerId
  return fromRepositoryResult(await repositoryFor(request).confirmMarker({
    markerId,
    intentId: optionalString(body, 'intentId'),
    summary: stringValue(body, 'summary', 'Marker confirmed in mock/local route.'),
  }), (marker) => ({ marker }))
}

async function handleMarkersArchive(request: ApiRequestEnvelope) {
  const body = requestBody(request)
  const markerId = await requireMarkerId(request, body)
  if (isResponse(markerId)) return markerId
  return fromRepositoryResult(await repositoryFor(request).archiveMarker(markerId), (marker) => ({ marker }))
}

async function handleAttachmentsList(request: ApiRequestEnvelope) {
  const body = requestBody(request)
  const markerId = await requireMarkerId(request, body)
  if (isResponse(markerId)) return markerId
  return fromRepositoryResult(await repositoryFor(request).listMarkerAttachments(markerId), (attachments) => ({ attachments }))
}

async function handleAttachmentsAdd(request: ApiRequestEnvelope) {
  const body = requestBody(request)
  const markerId = await requireMarkerId(request, body)
  if (isResponse(markerId)) return markerId
  const marker = (await repositoryFor(request).getMarker(markerId)).data
  if (!marker) return failure('PROJECT_EDIT_BRIEF_MARKER_NOT_FOUND', 'Project Edit Brief marker was not found for attachment.', 404, { markerId })
  return fromRepositoryResult(await repositoryFor(request).addMarkerAttachment({
    id: optionalString(body, 'id'),
    projectId: projectIdFor(request, body),
    editSessionId: stringValue(body, 'editSessionId', marker.editSessionId),
    briefId: stringValue(body, 'briefId', marker.briefId),
    markerId,
    attachment: {
      attachmentKind: attachmentKind(body.attachmentKind),
      status: attachmentStatus(body.status),
      label: stringValue(body, 'label', 'Mock metadata attachment'),
      mediaAssetId: optionalString(body, 'mediaAssetId'),
      referenceUrl: optionalString(body, 'referenceUrl'),
      referenceLabel: optionalString(body, 'referenceLabel'),
      notes: stringArray(body.notes),
      previewLabel: optionalString(body, 'previewLabel'),
      durationSeconds: body.durationSeconds === undefined ? undefined : numberValue(body, 'durationSeconds', 0),
      metadata: asRecord(body.metadata),
    },
  }), (attachment) => ({ attachment }))
}

async function handleAttachmentsRemove(request: ApiRequestEnvelope) {
  const body = requestBody(request)
  const attachmentId = await attachmentIdFor(request, body)
  if (!attachmentId) return failure('PROJECT_EDIT_BRIEF_MISSING_ATTACHMENT_ID', 'Project Edit Brief route requires an attachmentId.', 400, body)
  return fromRepositoryResult(await repositoryFor(request).removeMarkerAttachment(attachmentId), (result) => result)
}

async function handleMarkerMessagesList(request: ApiRequestEnvelope) {
  const body = requestBody(request)
  const markerId = await requireMarkerId(request, body)
  if (isResponse(markerId)) return markerId
  return fromRepositoryResult(await repositoryFor(request).listMarkerMessages(markerId), (messages) => ({ messages }))
}

async function handleMarkerMessagesAppend(request: ApiRequestEnvelope) {
  const body = requestBody(request)
  const markerId = await requireMarkerId(request, body)
  if (isResponse(markerId)) return markerId
  const repository = repositoryFor(request)
  const marker = (await repository.getMarker(markerId)).data
  if (!marker) return failure('PROJECT_EDIT_BRIEF_MARKER_NOT_FOUND', 'Project Edit Brief marker was not found for Marker Chat.', 404, { markerId })

  if (body.runtimeMode === 'qwen_beta' && messageRole(body.role) === 'user') {
    const bridge = await runQwenMarkerChatBridge({
      repository,
      request: {
        source: 'backend_route',
        projectId: projectIdFor(request, body),
        editSessionId: stringValue(body, 'editSessionId', marker.editSessionId),
        briefId: stringValue(body, 'briefId', marker.briefId),
        markerId,
        messageText: stringValue(body, 'text', 'Mock Marker Chat note.'),
      },
    })
    return success({
      message: bridge.userMessage,
      assistantMessage: bridge.assistantMessage,
      intent: bridge.intent,
      confirmation: bridge.confirmation,
      marker: bridge.updatedMarker,
      qwenRuntime: {
        ok: bridge.ok,
        status: bridge.status,
        runtimeStatus: bridge.runtimeStatus,
        fallbackStatus: bridge.fallbackStatus,
        providerCallMade: bridge.providerCallMade,
        modelCallMade: bridge.modelCallMade,
        qwenCallMade: bridge.qwenCallMade,
        secretValuePrinted: bridge.secretValuePrinted,
        secretSentToFrontend: bridge.secretSentToFrontend,
        authorizationHeaderLogged: bridge.authorizationHeaderLogged,
        plannerExecuted: bridge.plannerExecuted,
        editPlanCreated: bridge.editPlanCreated,
        creditReservedOrSpent: bridge.creditReservedOrSpent,
        usage: bridge.usage,
        publicSummary: bridge.publicSummary,
        warnings: bridge.warnings,
      },
    }, [
      'Marker Chat Qwen beta route path is backend-only and preserves deterministic fallback when runtime gates are missing.',
    ])
  }

  return fromRepositoryResult(await repository.appendMarkerMessage({
    id: optionalString(body, 'id'),
    projectId: projectIdFor(request, body),
    editSessionId: stringValue(body, 'editSessionId', marker.editSessionId),
    briefId: stringValue(body, 'briefId', marker.briefId),
    markerId,
    message: {
      role: messageRole(body.role),
      kind: messageKind(body.kind),
      text: stringValue(body, 'text', 'Mock Marker Chat note.'),
      relatedIntentId: optionalString(body, 'relatedIntentId'),
      relatedAttachmentId: optionalString(body, 'relatedAttachmentId'),
      metadata: asRecord(body.metadata),
    },
  }), (message) => ({ message }))
}

async function handleIntentGet(request: ApiRequestEnvelope) {
  const body = requestBody(request)
  const markerId = await requireMarkerId(request, body)
  if (isResponse(markerId)) return markerId
  return fromRepositoryResult(await repositoryFor(request).getMarkerIntent(markerId), (intent) => ({ intent }))
}

async function handleIntentSave(request: ApiRequestEnvelope) {
  const body = requestBody(request)
  const markerId = await requireMarkerId(request, body)
  if (isResponse(markerId)) return markerId
  const marker = (await repositoryFor(request).getMarker(markerId)).data
  if (!marker) return failure('PROJECT_EDIT_BRIEF_MARKER_NOT_FOUND', 'Project Edit Brief marker was not found for intent save.', 404, { markerId })
  return fromRepositoryResult(await repositoryFor(request).saveMarkerIntent({
    id: optionalString(body, 'id') ?? optionalString(body, 'intentId'),
    projectId: projectIdFor(request, body),
    editSessionId: stringValue(body, 'editSessionId', marker.editSessionId),
    briefId: stringValue(body, 'briefId', marker.briefId),
    markerId,
    intent: {
      action: intentAction(body.action),
      status: intentStatus(body.status),
      instruction: stringValue(body, 'instruction', 'Mock structured marker intent.'),
      timeRangeLabel: stringValue(body, 'timeRangeLabel', `${marker.startTimeSeconds}s`),
      startTimeSeconds: numberValue(body, 'startTimeSeconds', marker.startTimeSeconds),
      endTimeSeconds: body.endTimeSeconds === undefined ? marker.endTimeSeconds : numberValue(body, 'endTimeSeconds', marker.endTimeSeconds ?? marker.startTimeSeconds),
      visualBehavior: visualBehavior(body.visualBehavior),
      audioBehavior: audioBehavior(body.audioBehavior),
      captionBehavior: captionBehavior(body.captionBehavior),
      assetRequirement: optionalString(body, 'assetRequirement'),
      providedAssetIds: stringArray(body.providedAssetIds),
      priority: markerPriority(body.priority ?? marker.priority),
      confidence: body.confidence === 'low' || body.confidence === 'high' ? body.confidence : 'medium',
      blockingNeeds: stringArray(body.blockingNeeds),
      doNotCopyNotes: stringArray(body.doNotCopyNotes),
      plannerHints: stringArray(body.plannerHints),
      latestUserMessageId: optionalString(body, 'latestUserMessageId'),
      latestConfirmationId: optionalString(body, 'latestConfirmationId'),
      metadata: asRecord(body.metadata),
    },
  }), (intent) => ({ intent }))
}

async function handleIntentUpdate(request: ApiRequestEnvelope) {
  const body = requestBody(request)
  const intentId = await intentIdFor(request, body)
  if (!intentId) return failure('PROJECT_EDIT_BRIEF_MISSING_INTENT_ID', 'Project Edit Brief route requires an intentId or marker intent.', 400, body)
  return fromRepositoryResult(await repositoryFor(request).updateMarkerIntent({
    intentId,
    patch: asRecord(body.patch),
  }), (intent) => ({ intent }))
}

async function handleConfirmationsList(request: ApiRequestEnvelope) {
  const body = requestBody(request)
  const markerId = await requireMarkerId(request, body)
  if (isResponse(markerId)) return markerId
  return fromRepositoryResult(await repositoryFor(request).listMarkerConfirmations(markerId), (confirmations) => ({ confirmations }))
}

async function handleConfirmationsSave(request: ApiRequestEnvelope) {
  const body = requestBody(request)
  const markerId = await requireMarkerId(request, body)
  if (isResponse(markerId)) return markerId
  const marker = (await repositoryFor(request).getMarker(markerId)).data
  if (!marker) return failure('PROJECT_EDIT_BRIEF_MARKER_NOT_FOUND', 'Project Edit Brief marker was not found for confirmation.', 404, { markerId })
  const existingIntentId = await intentIdFor(request, body)
  return fromRepositoryResult(await repositoryFor(request).saveMarkerConfirmation({
    id: optionalString(body, 'id'),
    projectId: projectIdFor(request, body),
    editSessionId: stringValue(body, 'editSessionId', marker.editSessionId),
    briefId: stringValue(body, 'briefId', marker.briefId),
    markerId,
    intentId: existingIntentId ?? `${markerId}-mock-intent`,
    summary: stringValue(body, 'summary', 'Mock confirmation saved.'),
    confirmedByUser: booleanValue(body, 'confirmedByUser', true),
    aiMode: markerAiMode(body.aiMode),
    metadata: asRecord(body.metadata),
  }), (confirmation) => ({ confirmation }))
}

async function handleConflictsList(request: ApiRequestEnvelope) {
  const body = requestBody(request)
  const briefId = await briefIdFor(request, body)
  return fromRepositoryResult(await repositoryFor(request).listMarkerConflicts({
    briefId,
    markerId: optionalString(body, 'markerId'),
  }), (conflicts) => ({ conflicts }))
}

async function handleConflictsSave(request: ApiRequestEnvelope) {
  const body = requestBody(request)
  const markerId = await requireMarkerId(request, body)
  if (isResponse(markerId)) return markerId
  const marker = (await repositoryFor(request).getMarker(markerId)).data
  if (!marker) return failure('PROJECT_EDIT_BRIEF_MARKER_NOT_FOUND', 'Project Edit Brief marker was not found for conflict.', 404, { markerId })
  return fromRepositoryResult(await repositoryFor(request).saveMarkerConflict({
    id: optionalString(body, 'id'),
    projectId: projectIdFor(request, body),
    editSessionId: stringValue(body, 'editSessionId', marker.editSessionId),
    briefId: stringValue(body, 'briefId', marker.briefId),
    markerId,
    conflict: {
      relatedMarkerId: optionalString(body, 'relatedMarkerId'),
      qaStatus: markerQaStatus(body.qaStatus) === 'not_checked' ? 'conflict' : markerQaStatus(body.qaStatus),
      title: stringValue(body, 'title', 'Mock marker conflict'),
      summary: stringValue(body, 'summary', 'Mock conflict saved for owner review.'),
      recommendedResolution: stringValue(body, 'recommendedResolution', 'Resolve marker instructions before future planning.'),
      blocksPlan: booleanValue(body, 'blocksPlan', true),
      requiresUserReview: booleanValue(body, 'requiresUserReview', true),
      metadata: asRecord(body.metadata),
    },
  }), (conflict) => ({ conflict }))
}

async function handleRevisionsList(request: ApiRequestEnvelope) {
  const body = requestBody(request)
  const markerId = await requireMarkerId(request, body)
  if (isResponse(markerId)) return markerId
  return fromRepositoryResult(await repositoryFor(request).listMarkerRevisions(markerId), (revisions) => ({ revisions }))
}

async function handleRevisionsSave(request: ApiRequestEnvelope) {
  const body = requestBody(request)
  const markerId = await requireMarkerId(request, body)
  if (isResponse(markerId)) return markerId
  const marker = (await repositoryFor(request).getMarker(markerId)).data
  if (!marker) return failure('PROJECT_EDIT_BRIEF_MARKER_NOT_FOUND', 'Project Edit Brief marker was not found for revision.', 404, { markerId })
  return fromRepositoryResult(await repositoryFor(request).saveMarkerRevision({
    id: optionalString(body, 'id'),
    projectId: projectIdFor(request, body),
    editSessionId: stringValue(body, 'editSessionId', marker.editSessionId),
    briefId: stringValue(body, 'briefId', marker.briefId),
    markerId,
    revision: {
      previousIntentId: optionalString(body, 'previousIntentId'),
      newIntentId: optionalString(body, 'newIntentId'),
      summary: stringValue(body, 'summary', 'Mock marker revision saved.'),
      reason: stringValue(body, 'reason', 'Marker Chat instruction changed.'),
      metadata: asRecord(body.metadata),
    },
  }), (revision) => ({ revision }))
}

async function handleApplicationLogsList(request: ApiRequestEnvelope) {
  const body = requestBody(request)
  const briefId = await requireBriefId(request, body)
  if (isResponse(briefId)) return briefId
  return fromRepositoryResult(await repositoryFor(request).listApplicationLogs(briefId), (applicationLogs) => ({ applicationLogs }))
}

async function handleApplicationLogsAppend(request: ApiRequestEnvelope) {
  const body = requestBody(request)
  const briefId = await requireBriefId(request, body)
  if (isResponse(briefId)) return briefId
  const brief = (await repositoryFor(request).getEditBrief(briefId)).data
  if (!brief) return failure('PROJECT_EDIT_BRIEF_NOT_FOUND', 'Project Edit Brief was not found for application log.', 404, { briefId })
  return fromRepositoryResult(await repositoryFor(request).appendApplicationLog({
    id: optionalString(body, 'id'),
    projectId: projectIdFor(request, body),
    editSessionId: stringValue(body, 'editSessionId', brief.editSessionId),
    briefId,
    markerId: optionalString(body, 'markerId'),
    summary: stringValue(body, 'summary', 'Mock application log appended.'),
    appliedToPlan: booleanValue(body, 'appliedToPlan', false),
    metadata: asRecord(body.metadata),
  }), (applicationLog) => ({ applicationLog }))
}

async function handleExportSettingsGet(request: ApiRequestEnvelope) {
  const body = requestBody(request)
  const editSessionId = stringValue(body, 'editSessionId', fallbackBrief(dbFor(request), body)?.editSessionId ?? 'edit-session-vertical-dna')
  return fromRepositoryResult(await repositoryFor(request).getExportSettings(editSessionId), (exportSettings) => ({ exportSettings }))
}

async function handleExportSettingsRecommend(request: ApiRequestEnvelope) {
  const body = requestBody(request)
  return fromRepositoryResult(await repositoryFor(request).recommendExportSettings({
    projectId: projectIdFor(request, body),
    editSessionId: stringValue(body, 'editSessionId', fallbackBrief(dbFor(request), body)?.editSessionId ?? 'edit-session-api-brief-smoke'),
    platformTarget: body.platformTarget as ProjectEditSessionExportSettingsRecord['platformTarget'],
    aspectRatio: body.aspectRatio as ProjectEditSessionExportSettingsRecord['aspectRatio'],
    customAspectRatio: body.customAspectRatio as ProjectEditSessionExportSettingsRecord['customAspectRatio'],
    presetId: body.presetId as ProjectEditSessionExportSettingsRecord['deliveryPreset'],
  }), (exportSettings) => ({ exportSettings }))
}

async function handleExportSettingsUpdate(request: ApiRequestEnvelope) {
  const body = requestBody(request)
  return fromRepositoryResult(await repositoryFor(request).updateExportSettings({
    editSessionId: stringValue(body, 'editSessionId', fallbackBrief(dbFor(request), body)?.editSessionId ?? 'edit-session-api-brief-smoke'),
    exportSettingsId: optionalString(body, 'exportSettingsId'),
    patch: asRecord(body.patch),
  }), (exportSettings) => ({ exportSettings }))
}

async function handleTimelineModels(request: ApiRequestEnvelope) {
  const body = requestBody(request)
  const briefId = await requireBriefId(request, body)
  if (isResponse(briefId)) return briefId
  return fromRepositoryResult(await repositoryFor(request).createTimelineMarkerModels(briefId), (timelineMarkers) => ({ timelineMarkers }))
}

async function handleMarkerDrawerGet(request: ApiRequestEnvelope) {
  const body = requestBody(request)
  const markerId = await requireMarkerId(request, body)
  if (isResponse(markerId)) return markerId
  return fromRepositoryResult(await repositoryFor(request).createMarkerDrawerModel(markerId), (drawer) => ({ drawer }))
}

export async function handleProjectEditBriefMockRoute(request: ApiRequestEnvelope): Promise<ApiResponseEnvelope> {
  const handler = PROJECT_EDIT_BRIEF_MOCK_ROUTE_HANDLERS[request.routeId as ProjectEditBriefApiRouteId]
  if (!handler) {
    return failure('PROJECT_EDIT_BRIEF_ROUTE_NOT_FOUND', `${request.routeId} is not a registered Project Edit Brief mock route.`, 404, {
      routeId: request.routeId,
    })
  }
  return handler(request)
}

export const PROJECT_EDIT_BRIEF_MOCK_ROUTE_HANDLERS: Record<ProjectEditBriefApiRouteId, ApiRouteHandler> = {
  'project.editBrief.get': handleProjectEditBriefGet,
  'project.editBrief.forSession.get': handleProjectEditBriefForSessionGet,
  'project.editBrief.create': handleProjectEditBriefCreate,
  'project.editBrief.update': handleProjectEditBriefUpdate,
  'project.editBrief.archive': handleProjectEditBriefArchive,
  'project.editBrief.summary': handleProjectEditBriefSummary,
  'project.editBrief.bundle': handleProjectEditBriefBundle,
  'project.editBrief.markers.list': handleMarkersList,
  'project.editBrief.markers.get': handleMarkersGet,
  'project.editBrief.markers.create': handleMarkersCreate,
  'project.editBrief.markers.update': handleMarkersUpdate,
  'project.editBrief.markers.delete': handleMarkersDelete,
  'project.editBrief.markers.confirm': handleMarkersConfirm,
  'project.editBrief.markers.archive': handleMarkersArchive,
  'project.editBrief.markerAttachments.list': handleAttachmentsList,
  'project.editBrief.markerAttachments.add': handleAttachmentsAdd,
  'project.editBrief.markerAttachments.remove': handleAttachmentsRemove,
  'project.editBrief.markerMessages.list': handleMarkerMessagesList,
  'project.editBrief.markerMessages.append': handleMarkerMessagesAppend,
  'project.editBrief.markerIntent.get': handleIntentGet,
  'project.editBrief.markerIntent.save': handleIntentSave,
  'project.editBrief.markerIntent.update': handleIntentUpdate,
  'project.editBrief.markerConfirmations.list': handleConfirmationsList,
  'project.editBrief.markerConfirmations.save': handleConfirmationsSave,
  'project.editBrief.markerConflicts.list': handleConflictsList,
  'project.editBrief.markerConflicts.save': handleConflictsSave,
  'project.editBrief.markerRevisions.list': handleRevisionsList,
  'project.editBrief.markerRevisions.save': handleRevisionsSave,
  'project.editBrief.applicationLogs.list': handleApplicationLogsList,
  'project.editBrief.applicationLogs.append': handleApplicationLogsAppend,
  'project.editBrief.exportSettings.get': handleExportSettingsGet,
  'project.editBrief.exportSettings.recommend': handleExportSettingsRecommend,
  'project.editBrief.exportSettings.update': handleExportSettingsUpdate,
  'project.editBrief.timeline.models': handleTimelineModels,
  'project.editBrief.markerDrawer.get': handleMarkerDrawerGet,
}

export function listProjectEditBriefMockRouteHandlers() {
  return PROJECT_EDIT_BRIEF_API_ROUTE_IDS.map((routeId) => ({
    routeId,
    handlerReady: Boolean(PROJECT_EDIT_BRIEF_MOCK_ROUTE_HANDLERS[routeId]),
    safety: createProjectEditBriefRouteSafetyFlags(),
  }))
}
