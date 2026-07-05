import {
  PROJECT_EDIT_BRIEF_API_ROUTE_IDS,
  type ProjectEditBriefApiRouteId,
  type ReeditProApiRequestEnvelope,
  type ReeditProApiResponseEnvelope,
} from '../types/api-routes'
import type {
  ProjectEditBriefApplicationLogRecord,
  ProjectEditBriefAudioBehavior,
  ProjectEditBriefAttachmentKind,
  ProjectEditBriefAttachmentStatus,
  ProjectEditBriefBundleRecord,
  ProjectEditBriefCaptionBehavior,
  ProjectEditBriefFixtureBundle,
  ProjectEditBriefMarkerAIMode,
  ProjectEditBriefMarkerAttachmentRecord,
  ProjectEditBriefMarkerConfirmationRecord,
  ProjectEditBriefMarkerConflictRecord,
  ProjectEditBriefMarkerDrawerModel,
  ProjectEditBriefMarkerIntentAction,
  ProjectEditBriefMarkerIntentRecord,
  ProjectEditBriefMarkerIntentStatus,
  ProjectEditBriefMarkerMessageKind,
  ProjectEditBriefMarkerMessageRecord,
  ProjectEditBriefMarkerMessageRole,
  ProjectEditBriefMarkerPriority,
  ProjectEditBriefMarkerRecord,
  ProjectEditBriefMarkerRevisionRecord,
  ProjectEditBriefMarkerStatus,
  ProjectEditBriefMarkerTimeMode,
  ProjectEditBriefMarkerType,
  ProjectEditBriefQAStatus,
  ProjectEditBriefRecord,
  ProjectEditBriefVisualBehavior,
  ProjectEditSessionExportSettingsRecord,
} from '../types/project-edit-brief'
import type {
  ProjectEditBriefVisualContext,
  ProjectEditBriefVisualContextAnalysisResult,
  ProjectEditBriefVisualContextRequest,
  ProjectEditBriefVisualContextRuntimeSource,
} from '../types/project-edit-brief-visual-context'
import { PROJECT_EDIT_BRIEF_VISUAL_CONTEXT_SAFETY_FLAGS } from '../types/project-edit-brief-visual-context'
import type {
  ReeditProApiClientOptions,
  ReeditProApiClientSafetySummary,
  ReeditProApiTransport,
} from './reeditpro-api-client-types'
import { createMockProjectEditBriefFixtureBundle } from './mock-project-edit-briefs'
import {
  createProjectEditBriefBundle,
  createProjectEditBriefDrawerModel,
} from './project-edit-brief-fixture-mappers'
import { createProjectEditBriefReadableSummary } from './project-edit-brief-summary-mappers'
import { createProjectEditBriefTimelineMarkerModels } from './project-edit-brief-timeline-mappers'
import {
  PROJECT_EDIT_BRIEF_API_CLIENT_SAFETY,
  createProjectEditBriefApiClientSummary,
} from './project-edit-brief-api-client-summaries'
import { recommendProjectEditBriefExportSettings } from './project-edit-brief-export-settings-rules'
import { REEDITPRO_QWEN_MAIN_BRAIN_LABEL } from '../types/qwen-main-brain'

type RequestRecord = Record<string, unknown>

export interface ProjectEditBriefApiClientSafetySummary extends ReeditProApiClientSafetySummary {
  storageReadMade: false
  storageWriteMade: false
  signedUrlCreated: false
  fileBytesRead: false
  externalUrlFetched: false
  mediaProcessingStarted: false
}

export interface ProjectEditBriefQwenMarkerChatRuntimeSummary {
  mode: 'local_fallback' | 'backend_beta_route'
  label: string
  liveConfigured: boolean
  summary: string
  readiness: ProjectEditBriefQwenMarkerChatReadinessSummary
}

export interface ProjectEditBriefQwenMarkerChatReadinessSummary {
  status: string
  ready: boolean
  label: string
  summary: string
  mockOnly: true
  providerCallMade: false
  modelCallMade: false
  qwenCallMade: false
  secretValuePrinted: false
  secretSentToFrontend: false
  gcloudCommandRun: false
  supabaseCommandRun: false
  rawProviderPayloadExposed: false
  checkedAt: string
}

export interface ProjectEditBriefQwen25VLVisualContextRuntimeSummary {
  mode: 'local_fallback' | 'backend_beta_route'
  label: string
  liveConfigured: boolean
  summary: string
  readiness: ProjectEditBriefQwen25VLReadinessSummary
}

export interface ProjectEditBriefQwen25VLReadinessSummary {
  status: string
  ready: boolean
  label: string
  summary: string
  mockOnly: true
  providerCallMade: false
  modelCallMade: false
  qwen25vlCallMade: false
  secretValuePrinted: false
  secretSentToFrontend: false
  gcloudCommandRun: false
  supabaseCommandRun: false
  rawProviderPayloadExposed: false
  sampledFramesPersisted: false
  checkedAt: string
}

export interface ProjectEditBriefApiClient {
  transport: ReeditProApiTransport
  safety: ProjectEditBriefApiClientSafetySummary
  qwenMarkerChatRuntime: ProjectEditBriefQwenMarkerChatRuntimeSummary
  qwen25VLVisualContextRuntime: ProjectEditBriefQwen25VLVisualContextRuntimeSummary
  loadQwenMarkerChatReadiness(): Promise<ProjectEditBriefQwenMarkerChatReadinessSummary>
  loadQwen25VLVisualContextReadiness(): Promise<ProjectEditBriefQwen25VLReadinessSummary>
  createEnvelope<TPayload = unknown>(routeId: ProjectEditBriefApiRouteId, payload?: TPayload): ReeditProApiRequestEnvelope<TPayload>
  request<TPayload = unknown, TData = unknown>(
    routeId: ProjectEditBriefApiRouteId,
    payload?: TPayload,
  ): Promise<ReeditProApiResponseEnvelope<TData>>
  brief: {
    get<TData = unknown>(briefId: string): Promise<ReeditProApiResponseEnvelope<TData>>
    getForSession<TData = unknown>(editSessionId: string): Promise<ReeditProApiResponseEnvelope<TData>>
    create<TData = unknown>(input: unknown): Promise<ReeditProApiResponseEnvelope<TData>>
    update<TData = unknown>(input: unknown): Promise<ReeditProApiResponseEnvelope<TData>>
    archive<TData = unknown>(briefId: string): Promise<ReeditProApiResponseEnvelope<TData>>
    summary<TData = unknown>(briefId: string): Promise<ReeditProApiResponseEnvelope<TData>>
    bundle<TData = unknown>(briefId: string): Promise<ReeditProApiResponseEnvelope<TData>>
  }
  markers: {
    list<TData = unknown>(briefId: string): Promise<ReeditProApiResponseEnvelope<TData>>
    get<TData = unknown>(markerId: string): Promise<ReeditProApiResponseEnvelope<TData>>
    create<TData = unknown>(input: unknown): Promise<ReeditProApiResponseEnvelope<TData>>
    update<TData = unknown>(input: unknown): Promise<ReeditProApiResponseEnvelope<TData>>
    delete<TData = unknown>(markerId: string): Promise<ReeditProApiResponseEnvelope<TData>>
    confirm<TData = unknown>(input: unknown): Promise<ReeditProApiResponseEnvelope<TData>>
    archive<TData = unknown>(markerId: string): Promise<ReeditProApiResponseEnvelope<TData>>
  }
  attachments: {
    list<TData = unknown>(markerId: string): Promise<ReeditProApiResponseEnvelope<TData>>
    add<TData = unknown>(input: unknown): Promise<ReeditProApiResponseEnvelope<TData>>
    remove<TData = unknown>(attachmentId: string): Promise<ReeditProApiResponseEnvelope<TData>>
  }
  markerMessages: {
    list<TData = unknown>(markerId: string): Promise<ReeditProApiResponseEnvelope<TData>>
    append<TData = unknown>(input: unknown): Promise<ReeditProApiResponseEnvelope<TData>>
  }
  intent: {
    get<TData = unknown>(markerId: string): Promise<ReeditProApiResponseEnvelope<TData>>
    save<TData = unknown>(input: unknown): Promise<ReeditProApiResponseEnvelope<TData>>
    update<TData = unknown>(input: unknown): Promise<ReeditProApiResponseEnvelope<TData>>
  }
  confirmations: {
    list<TData = unknown>(markerId: string): Promise<ReeditProApiResponseEnvelope<TData>>
    save<TData = unknown>(input: unknown): Promise<ReeditProApiResponseEnvelope<TData>>
  }
  conflicts: {
    list<TData = unknown>(input: unknown): Promise<ReeditProApiResponseEnvelope<TData>>
    save<TData = unknown>(input: unknown): Promise<ReeditProApiResponseEnvelope<TData>>
  }
  revisions: {
    list<TData = unknown>(markerId: string): Promise<ReeditProApiResponseEnvelope<TData>>
    save<TData = unknown>(input: unknown): Promise<ReeditProApiResponseEnvelope<TData>>
  }
  applicationLogs: {
    list<TData = unknown>(briefId: string): Promise<ReeditProApiResponseEnvelope<TData>>
    append<TData = unknown>(input: unknown): Promise<ReeditProApiResponseEnvelope<TData>>
  }
  exportSettings: {
    get<TData = unknown>(editSessionId: string): Promise<ReeditProApiResponseEnvelope<TData>>
    recommend<TData = unknown>(input: unknown): Promise<ReeditProApiResponseEnvelope<TData>>
    update<TData = unknown>(input: unknown): Promise<ReeditProApiResponseEnvelope<TData>>
  }
  timeline: {
    models<TData = unknown>(briefId: string): Promise<ReeditProApiResponseEnvelope<TData>>
  }
  drawer: {
    get<TData = unknown>(markerId: string): Promise<ReeditProApiResponseEnvelope<TData>>
  }
  visualContext: {
    analyze<TData = unknown>(input: ProjectEditBriefVisualContextRequest): Promise<ReeditProApiResponseEnvelope<TData>>
  }
}

export interface MockProjectEditBriefApiClient extends ProjectEditBriefApiClient {
  getMockState(): ProjectEditBriefFixtureBundle
  resetMockState(): ProjectEditBriefFixtureBundle
}

const DEFAULT_PROJECT_ID = 'mock-project-edit-chat-foundation'
const QWEN_LIVE_MARKER_CHAT_PATH = '/v1/project-edit-brief/marker-messages'
const QWEN_LIVE_READINESS_PATH = '/v1/qwen-beta/readiness'
const QWEN25VL_VISUAL_CONTEXT_PATH = '/v1/project-edit-brief/marker-visual-context'
const QWEN25VL_READINESS_PATH = '/v1/qwen25vl-beta/readiness'
const mockProjectEditBriefStates = new Map<string, ProjectEditBriefFixtureBundle>()

const NO_PRODUCTION_EFFECTS = {
  providerCallMade: false,
  supabaseWriteMade: false,
  generationRequestCreated: false,
  renderJobCreated: false,
  workerJobCreated: false,
  creditReservedOrSpent: false,
} as const

const FULL_SAFETY = {
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

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function nowIso() {
  return new Date().toISOString()
}

function createRequestId(routeId: string) {
  return `${routeId}:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 8)}`
}

function createMockId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function liveApiBaseUrl(options: ReeditProApiClientOptions): string {
  return (options.apiBaseUrl ?? '').replace(/\/+$/, '')
}

function createQwenMarkerChatReadinessSummary(input: {
  status: string
  ready: boolean
  label: string
  summary: string
  checkedAt?: string
}): ProjectEditBriefQwenMarkerChatReadinessSummary {
  return {
    status: input.status,
    ready: input.ready,
    label: input.label,
    summary: input.summary,
    mockOnly: true,
    providerCallMade: false,
    modelCallMade: false,
    qwenCallMade: false,
    secretValuePrinted: false,
    secretSentToFrontend: false,
    gcloudCommandRun: false,
    supabaseCommandRun: false,
    rawProviderPayloadExposed: false,
    checkedAt: input.checkedAt ?? nowIso(),
  }
}

function createLocalQwenMarkerChatReadinessSummary(): ProjectEditBriefQwenMarkerChatReadinessSummary {
  return createQwenMarkerChatReadinessSummary({
    status: 'local_fallback_active',
    ready: false,
    label: `${REEDITPRO_QWEN_MAIN_BRAIN_LABEL} readiness: local fallback active`,
    summary: `Backend live ${REEDITPRO_QWEN_MAIN_BRAIN_LABEL} route is not configured for this browser session; Marker Chat uses deterministic local fallback with no provider call.`,
  })
}

function createLiveQwenMarkerChatReadinessCheckingSummary(): ProjectEditBriefQwenMarkerChatReadinessSummary {
  return createQwenMarkerChatReadinessSummary({
    status: 'checking_backend_readiness',
    ready: false,
    label: `${REEDITPRO_QWEN_MAIN_BRAIN_LABEL} readiness: checking backend`,
    summary: `The browser will ask the backend for a sanitized ${REEDITPRO_QWEN_MAIN_BRAIN_LABEL} beta readiness report before live Marker Chat can claim readiness.`,
  })
}

function qwenReadinessLabel(status: string, ready: boolean): string {
  if (ready) return `${REEDITPRO_QWEN_MAIN_BRAIN_LABEL} beta ready`
  if (status === 'blocked_runtime_disabled') return `${REEDITPRO_QWEN_MAIN_BRAIN_LABEL} beta blocked: runtime disabled`
  if (status === 'blocked_missing_project_config') return `${REEDITPRO_QWEN_MAIN_BRAIN_LABEL} beta blocked: project config missing`
  if (status === 'blocked_missing_secret_reference') return `${REEDITPRO_QWEN_MAIN_BRAIN_LABEL} beta blocked: Secret Manager reference missing`
  if (status === 'blocked_secret_access_denied') return `${REEDITPRO_QWEN_MAIN_BRAIN_LABEL} beta blocked: Secret Manager access denied`
  if (status === 'blocked_missing_endpoint') return `${REEDITPRO_QWEN_MAIN_BRAIN_LABEL} beta blocked: endpoint missing`
  if (status === 'blocked_missing_model_id') return `${REEDITPRO_QWEN_MAIN_BRAIN_LABEL} beta blocked: model missing`
  if (status === 'blocked_frontend_boundary') return `${REEDITPRO_QWEN_MAIN_BRAIN_LABEL} beta blocked: frontend boundary`
  if (status === 'failed_redaction_check') return `${REEDITPRO_QWEN_MAIN_BRAIN_LABEL} beta blocked: redaction check failed`
  return `${REEDITPRO_QWEN_MAIN_BRAIN_LABEL} beta blocked: ${status || 'unknown'}`
}

function qwenReadinessSummary(status: string, ready: boolean): string {
  return ready
    ? `Backend readiness gates are satisfied; live Marker Chat may call ${REEDITPRO_QWEN_MAIN_BRAIN_LABEL} only through the server route and still uses strict structured validation.`
    : `Backend readiness returned ${status || 'unknown'}; Marker Chat should keep using local fallback until owner-approved beta config passes.`
}

function createUnavailableQwenMarkerChatReadinessSummary(reason: string): ProjectEditBriefQwenMarkerChatReadinessSummary {
  return createQwenMarkerChatReadinessSummary({
    status: 'readiness_endpoint_unavailable',
    ready: false,
    label: `${REEDITPRO_QWEN_MAIN_BRAIN_LABEL} beta readiness unavailable`,
    summary: `${reason} Marker Chat should keep using deterministic local fallback.`,
  })
}

function createQwen25VLReadinessSummary(input: {
  status: string
  ready: boolean
  label: string
  summary: string
  checkedAt?: string
}): ProjectEditBriefQwen25VLReadinessSummary {
  return {
    status: input.status,
    ready: input.ready,
    label: input.label,
    summary: input.summary,
    mockOnly: true,
    providerCallMade: false,
    modelCallMade: false,
    qwen25vlCallMade: false,
    secretValuePrinted: false,
    secretSentToFrontend: false,
    gcloudCommandRun: false,
    supabaseCommandRun: false,
    rawProviderPayloadExposed: false,
    sampledFramesPersisted: false,
    checkedAt: input.checkedAt ?? nowIso(),
  }
}

function createLocalQwen25VLReadinessSummary(): ProjectEditBriefQwen25VLReadinessSummary {
  return createQwen25VLReadinessSummary({
    status: 'local_visual_fallback_active',
    ready: false,
    label: 'Qwen2.5-VL readiness: local fallback active',
    summary: 'Backend Qwen2.5-VL visual route is not configured for this browser session; Visual Context uses deterministic local fallback with no provider call.',
  })
}

function createLiveQwen25VLReadinessCheckingSummary(): ProjectEditBriefQwen25VLReadinessSummary {
  return createQwen25VLReadinessSummary({
    status: 'checking_backend_qwen25vl_readiness',
    ready: false,
    label: 'Qwen2.5-VL readiness: checking backend',
    summary: 'The browser will ask the backend for a sanitized Qwen2.5-VL beta readiness report before live visual analysis can claim readiness.',
  })
}

function qwen25VLReadinessLabel(status: string, ready: boolean): string {
  if (ready && status === 'ready_qwen25vl_fake_beta') return 'Qwen2.5-VL fake beta ready'
  if (ready) return 'Qwen2.5-VL beta ready'
  return `Qwen2.5-VL beta blocked: ${status || 'unknown'}`
}

function qwen25VLReadinessSummary(status: string, ready: boolean): string {
  return ready
    ? 'Backend readiness gates are satisfied for Qwen2.5-VL visual context; every response still requires structured validation.'
    : `Backend readiness returned ${status || 'unknown'}; Visual Context should keep using deterministic local fallback.`
}

function createUnavailableQwen25VLReadinessSummary(reason: string): ProjectEditBriefQwen25VLReadinessSummary {
  return createQwen25VLReadinessSummary({
    status: 'readiness_endpoint_unavailable',
    ready: false,
    label: 'Qwen2.5-VL beta readiness unavailable',
    summary: `${reason} Visual Context should keep using deterministic local fallback.`,
  })
}

async function requestLiveQwenMarkerChatReadiness(
  options: ReeditProApiClientOptions,
): Promise<ProjectEditBriefQwenMarkerChatReadinessSummary> {
  const baseUrl = liveApiBaseUrl(options)
  if (!(options.liveQwenMarkerChat === true && options.mode === 'mock_backend_local' && baseUrl)) {
    return createLocalQwenMarkerChatReadinessSummary()
  }

  try {
    const response = await fetch(`${baseUrl}${QWEN_LIVE_READINESS_PATH}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        ...(options.workspaceId ? { 'x-reeditpro-workspace-id': options.workspaceId } : {}),
      },
    })
    const payload = await response.json().catch(() => undefined)
    const data = asRecord(asRecord(payload).data)
    const status = stringValue(data, 'status', response.ok ? 'ready_live_beta' : 'blocked_unknown')
    const ready = Boolean(data.ready)
    return createQwenMarkerChatReadinessSummary({
      status,
      ready,
      label: qwenReadinessLabel(status, ready),
      summary: qwenReadinessSummary(status, ready),
      checkedAt: optionalString(data, 'generatedAt') ?? nowIso(),
    })
  } catch {
    return createUnavailableQwenMarkerChatReadinessSummary('The backend readiness endpoint could not be reached.')
  }
}

async function requestLiveQwen25VLReadiness(
  options: ReeditProApiClientOptions,
): Promise<ProjectEditBriefQwen25VLReadinessSummary> {
  const baseUrl = liveApiBaseUrl(options)
  if (!(options.liveQwen25VLVisualContext === true && options.mode === 'mock_backend_local' && baseUrl)) {
    return createLocalQwen25VLReadinessSummary()
  }

  try {
    const response = await fetch(`${baseUrl}${QWEN25VL_READINESS_PATH}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        ...(options.workspaceId ? { 'x-reeditpro-workspace-id': options.workspaceId } : {}),
      },
    })
    const payload = await response.json().catch(() => undefined)
    const data = asRecord(asRecord(payload).data)
    const status = stringValue(data, 'status', response.ok ? 'ready_qwen25vl_live_beta' : 'blocked_unknown')
    const ready = Boolean(data.ready)
    return createQwen25VLReadinessSummary({
      status,
      ready,
      label: qwen25VLReadinessLabel(status, ready),
      summary: qwen25VLReadinessSummary(status, ready),
      checkedAt: optionalString(data, 'generatedAt') ?? nowIso(),
    })
  } catch {
    return createUnavailableQwen25VLReadinessSummary('The backend Qwen2.5-VL readiness endpoint could not be reached.')
  }
}

function shouldUseLiveQwenMarkerChat(
  options: ReeditProApiClientOptions,
  envelope: ReeditProApiRequestEnvelope,
): boolean {
  const body = asRecord(envelope.payload)
  return envelope.routeId === 'project.editBrief.markerMessages.append'
    && body.runtimeMode === 'qwen_beta'
    && options.liveQwenMarkerChat === true
    && options.mode === 'mock_backend_local'
    && Boolean(liveApiBaseUrl(options))
}

function shouldUseLiveQwen25VLVisualContext(options: ReeditProApiClientOptions): boolean {
  return options.liveQwen25VLVisualContext === true
    && options.mode === 'mock_backend_local'
    && Boolean(liveApiBaseUrl(options))
}

async function requestLiveQwenMarkerChat<TData = unknown>(
  options: ReeditProApiClientOptions,
  envelope: ReeditProApiRequestEnvelope,
): Promise<ReeditProApiResponseEnvelope<TData>> {
  const body = asRecord(envelope.payload)
  const baseUrl = liveApiBaseUrl(options)
  const response = await fetch(`${baseUrl}${QWEN_LIVE_MARKER_CHAT_PATH}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-request-id': envelope.requestId,
      'idempotency-key': stringValue(body, 'idempotencyKey', envelope.requestId),
      ...(envelope.workspaceId ? { 'x-reeditpro-workspace-id': envelope.workspaceId } : {}),
    },
    body: JSON.stringify({
      workspaceId: envelope.workspaceId,
      userId: envelope.userId,
      projectId: stringValue(body, 'projectId', envelope.projectId ?? DEFAULT_PROJECT_ID),
      editSessionId: stringValue(body, 'editSessionId', ''),
      briefId: stringValue(body, 'briefId', ''),
      markerId: stringValue(body, 'markerId', ''),
      messageText: stringValue(body, 'messageText', stringValue(body, 'text', '')),
      aiMode: optionalString(body, 'aiMode'),
      requestId: envelope.requestId,
      idempotencyKey: optionalString(body, 'idempotencyKey') ?? envelope.requestId,
    }),
  })
  const payload = await response.json().catch(() => undefined) as Partial<ReeditProApiResponseEnvelope<TData>> | undefined
  if (!payload || typeof payload !== 'object') {
    return {
      routeId: envelope.routeId,
      requestId: envelope.requestId,
      ok: false,
      error: {
        code: 'QWEN_LIVE_MARKER_CHAT_BAD_RESPONSE',
        message: `${REEDITPRO_QWEN_MAIN_BRAIN_LABEL} beta Marker Chat server response was not JSON.`,
        details: { safety: { ...FULL_SAFETY } },
      },
      warnings: [`Live ${REEDITPRO_QWEN_MAIN_BRAIN_LABEL} Marker Chat transport failed safely before exposing provider details.`],
      mockOnly: true,
      ...NO_PRODUCTION_EFFECTS,
      respondedAt: nowIso(),
    }
  }
  return {
    routeId: envelope.routeId,
    requestId: payload.requestId ?? envelope.requestId,
    ok: Boolean(payload.ok),
    data: payload.data,
    error: payload.error,
    warnings: payload.warnings ?? [`${REEDITPRO_QWEN_MAIN_BRAIN_LABEL} beta Marker Chat server route returned a sanitized response.`],
    mockOnly: true,
    ...NO_PRODUCTION_EFFECTS,
    respondedAt: payload.respondedAt ?? nowIso(),
  }
}

function visualContextTimeLabel(request: ProjectEditBriefVisualContextRequest): string {
  const marker = request.marker
  if (marker.timeMode === 'range' && typeof marker.endTimeSeconds === 'number') {
    return `${Math.round(marker.startTimeSeconds)}s-${Math.round(marker.endTimeSeconds)}s`
  }
  return `${Math.round(marker.startTimeSeconds)}s`
}

function localVisualContextFallback(
  request: ProjectEditBriefVisualContextRequest,
  runtimeSource: ProjectEditBriefVisualContextRuntimeSource,
  reason: string,
): ProjectEditBriefVisualContext {
  const summary = `Visual context unavailable: local fallback only, no Qwen2.5-VL call. Marker "${request.marker.title}" at ${visualContextTimeLabel(request)}${request.sourceVideoLabel ? ` for ${request.sourceVideoLabel}` : ''}.`
  return {
    ...PROJECT_EDIT_BRIEF_VISUAL_CONTEXT_SAFETY_FLAGS,
    id: `marker-visual-context-client-${request.markerId}-${Date.now().toString(36)}`,
    projectId: request.projectId,
    editSessionId: request.editSessionId,
    briefId: request.briefId,
    markerId: request.markerId,
    sourceVideoLabel: request.sourceVideoLabel,
    visualSummary: summary,
    setting: 'Unavailable in browser local fallback.',
    visibleObjects: ['Unavailable until Qwen2.5-VL visual analysis runs.'],
    visiblePeople: ['Unavailable until Qwen2.5-VL visual analysis runs.'],
    actions: [request.marker.userNote || `Marker type: ${request.marker.markerType}.`],
    cameraMotion: 'Unavailable in browser local fallback.',
    visibleText: ['Unavailable until sampled frames are analyzed.'],
    layoutNotes: ['Browser client fallback stores structured marker metadata only.'],
    brollOpportunities: ['Run Qwen2.5-VL beta analysis before using this as visual evidence.'],
    visualRisks: ['Fallback is not model-seen video evidence.'],
    doNotCopyNotes: ['Do not claim Qwen2.5-VL analyzed frames when fallback was used.'],
    confidence: 'low',
    timeRange: {
      startTimeSeconds: request.marker.startTimeSeconds,
      endTimeSeconds: request.marker.endTimeSeconds ?? request.marker.startTimeSeconds,
      label: visualContextTimeLabel(request),
    },
    sampledFrameCount: request.sampledFrames.length,
    runtimeSource,
    fallbackReason: reason,
    summaryForQwen3: `${summary} Reason: ${reason}.`,
    boundarySummary: 'Browser local fallback only. No provider call, no frame persistence, no render/export, no workers, and no credits.',
    createdAt: nowIso(),
    mockOnly: true,
  }
}

async function requestLiveQwen25VLVisualContext<TData = unknown>(
  options: ReeditProApiClientOptions,
  request: ProjectEditBriefVisualContextRequest,
): Promise<ReeditProApiResponseEnvelope<TData>> {
  const baseUrl = liveApiBaseUrl(options)
  const requestId = createRequestId('project.editBrief.markerVisualContext.analyze')
  if (!shouldUseLiveQwen25VLVisualContext(options)) {
    const visualContext = localVisualContextFallback(request, 'deterministic_visual_fallback', 'browser_mock_transport')
    return {
      routeId: 'project.editBrief.markerVisualContext.analyze' as ProjectEditBriefApiRouteId,
      requestId,
      ok: true,
      data: {
        ok: true,
        visualContext,
        runtimeSource: visualContext.runtimeSource,
        fallbackUsed: true,
        fallbackReason: visualContext.fallbackReason,
        providerCallMade: false,
        modelCallMade: false,
        qwen25vlCallMade: false,
        secretValuePrinted: false,
        secretSentToFrontend: false,
        authorizationHeaderLogged: false,
        warnings: ['Browser mock transport used deterministic visual fallback; no Qwen2.5-VL provider call was attempted.'],
        ...PROJECT_EDIT_BRIEF_VISUAL_CONTEXT_SAFETY_FLAGS,
      } satisfies ProjectEditBriefVisualContextAnalysisResult,
      warnings: ['Project Edit Brief browser client kept Qwen2.5-VL visual context in deterministic fallback.'],
      mockOnly: true,
      ...NO_PRODUCTION_EFFECTS,
      respondedAt: nowIso(),
    } as ReeditProApiResponseEnvelope<TData>
  }

  try {
    const response = await fetch(`${baseUrl}${QWEN25VL_VISUAL_CONTEXT_PATH}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-request-id': requestId,
        'idempotency-key': requestId,
        ...(options.workspaceId ? { 'x-reeditpro-workspace-id': options.workspaceId } : {}),
      },
      body: JSON.stringify({
        ...request,
        workspaceId: options.workspaceId,
        userId: options.userId,
        requestId,
        idempotencyKey: requestId,
      }),
    })
    const payload = await response.json().catch(() => undefined) as Partial<ReeditProApiResponseEnvelope<TData>> | undefined
    if (!payload || typeof payload !== 'object') {
      const visualContext = localVisualContextFallback(request, 'deterministic_visual_fallback', 'qwen25vl_bad_response')
      return {
        routeId: 'project.editBrief.markerVisualContext.analyze' as ProjectEditBriefApiRouteId,
        requestId,
        ok: true,
        data: {
          ok: true,
          visualContext,
          runtimeSource: visualContext.runtimeSource,
          fallbackUsed: true,
          fallbackReason: visualContext.fallbackReason,
          providerCallMade: false,
          modelCallMade: false,
          qwen25vlCallMade: false,
          secretValuePrinted: false,
          secretSentToFrontend: false,
          authorizationHeaderLogged: false,
          warnings: ['Qwen2.5-VL visual route response was not JSON; local fallback was used.'],
          ...PROJECT_EDIT_BRIEF_VISUAL_CONTEXT_SAFETY_FLAGS,
        } satisfies ProjectEditBriefVisualContextAnalysisResult,
        warnings: ['Qwen2.5-VL visual route failed safely before exposing provider details.'],
        mockOnly: true,
        ...NO_PRODUCTION_EFFECTS,
        respondedAt: nowIso(),
      } as ReeditProApiResponseEnvelope<TData>
    }
    return {
      routeId: 'project.editBrief.markerVisualContext.analyze' as ProjectEditBriefApiRouteId,
      requestId: payload.requestId ?? requestId,
      ok: Boolean(payload.ok),
      data: payload.data,
      error: payload.error,
      warnings: payload.warnings ?? ['Qwen2.5-VL visual context server route returned a sanitized response.'],
      mockOnly: true,
      ...NO_PRODUCTION_EFFECTS,
      respondedAt: payload.respondedAt ?? nowIso(),
    }
  } catch {
    const visualContext = localVisualContextFallback(request, 'deterministic_visual_fallback', 'qwen25vl_route_unreachable')
    return {
      routeId: 'project.editBrief.markerVisualContext.analyze' as ProjectEditBriefApiRouteId,
      requestId,
      ok: true,
      data: {
        ok: true,
        visualContext,
        runtimeSource: visualContext.runtimeSource,
        fallbackUsed: true,
        fallbackReason: visualContext.fallbackReason,
        providerCallMade: false,
        modelCallMade: false,
        qwen25vlCallMade: false,
        secretValuePrinted: false,
        secretSentToFrontend: false,
        authorizationHeaderLogged: false,
        warnings: ['Qwen2.5-VL visual route could not be reached; local fallback was used.'],
        ...PROJECT_EDIT_BRIEF_VISUAL_CONTEXT_SAFETY_FLAGS,
      } satisfies ProjectEditBriefVisualContextAnalysisResult,
      warnings: ['Qwen2.5-VL visual context route failed safely before exposing provider details.'],
      mockOnly: true,
      ...NO_PRODUCTION_EFFECTS,
      respondedAt: nowIso(),
    } as ReeditProApiResponseEnvelope<TData>
  }
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

function mockStateCacheKey(options: ReeditProApiClientOptions): string {
  return [
    options.workspaceId ?? 'default-workspace',
    options.projectId ?? DEFAULT_PROJECT_ID,
    options.userId ?? 'default-user',
  ].join(':')
}

function createState(): ProjectEditBriefFixtureBundle {
  return clone(createMockProjectEditBriefFixtureBundle())
}

function getSharedMockState(options: ReeditProApiClientOptions): ProjectEditBriefFixtureBundle {
  const key = mockStateCacheKey(options)
  const existing = mockProjectEditBriefStates.get(key)
  if (existing) return existing
  const state = createState()
  mockProjectEditBriefStates.set(key, state)
  return state
}

function setSharedMockState(options: ReeditProApiClientOptions, state: ProjectEditBriefFixtureBundle) {
  mockProjectEditBriefStates.set(mockStateCacheKey(options), state)
}

function findBrief(state: ProjectEditBriefFixtureBundle, body: RequestRecord): ProjectEditBriefRecord | undefined {
  const briefId = optionalString(body, 'briefId') ?? optionalString(body, 'id')
  if (briefId) return state.briefs.find((brief) => brief.id === briefId)
  const editSessionId = optionalString(body, 'editSessionId')
  if (editSessionId) return state.briefs.find((brief) => brief.editSessionId === editSessionId && brief.status !== 'archived')
  return state.briefs.find((brief) => brief.status !== 'archived') ?? state.briefs[0]
}

function findMarker(state: ProjectEditBriefFixtureBundle, body: RequestRecord): ProjectEditBriefMarkerRecord | undefined {
  const markerId = optionalString(body, 'markerId') ?? optionalString(body, 'id')
  if (markerId) return state.markers.find((marker) => marker.id === markerId)
  const brief = findBrief(state, body)
  return brief ? state.markers.find((marker) => marker.briefId === brief.id && marker.status !== 'archived') : state.markers[0]
}

function markerType(value: unknown): ProjectEditBriefMarkerType {
  const allowed: ProjectEditBriefMarkerType[] = ['broll', 'cut_remove', 'keep_emphasize', 'caption_text', 'graphic_card_ui', 'music_soundtrack', 'sfx_sound_design', 'voiceover', 'transition', 'speed_pacing', 'color_tone', 'do_not_use', 'general_note']
  return allowed.includes(value as ProjectEditBriefMarkerType) ? value as ProjectEditBriefMarkerType : 'general_note'
}

function markerStatus(value: unknown, fallback: ProjectEditBriefMarkerStatus = 'draft'): ProjectEditBriefMarkerStatus {
  const allowed: ProjectEditBriefMarkerStatus[] = ['draft', 'needs_clarification', 'needs_asset', 'confirmed', 'ready_for_plan', 'conflict', 'applied_to_plan', 'changed_after_plan', 'archived']
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
  const allowed: ProjectEditBriefAttachmentKind[] = ['broll_video', 'image', 'music_track', 'soundtrack', 'sfx', 'voiceover', 'document', 'reference_label', 'reference_url_metadata_only']
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
  const allowed: ProjectEditBriefMarkerMessageKind[] = ['note', 'clarification_question', 'clarification_answer', 'confirmation', 'intent_update', 'asset_note', 'conflict_note', 'system_note']
  return allowed.includes(value as ProjectEditBriefMarkerMessageKind) ? value as ProjectEditBriefMarkerMessageKind : 'note'
}

function intentAction(value: unknown): ProjectEditBriefMarkerIntentAction {
  const allowed: ProjectEditBriefMarkerIntentAction[] = ['add_broll', 'remove_or_cut', 'keep_or_emphasize', 'add_caption_or_text', 'add_graphic_or_ui_card', 'add_music_or_soundtrack', 'add_sfx', 'add_voiceover', 'add_transition', 'adjust_speed_or_pacing', 'adjust_color_or_tone', 'avoid_or_do_not_use', 'general_instruction']
  return allowed.includes(value as ProjectEditBriefMarkerIntentAction) ? value as ProjectEditBriefMarkerIntentAction : 'general_instruction'
}

function intentStatus(value: unknown): ProjectEditBriefMarkerIntentStatus {
  const allowed: ProjectEditBriefMarkerIntentStatus[] = ['not_extracted', 'draft_intent', 'needs_clarification', 'needs_asset', 'confirmed', 'ready_for_plan', 'conflict', 'blocked']
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

function recomputeMarkerCounts(state: ProjectEditBriefFixtureBundle, markerId: string) {
  const marker = state.markers.find((candidate) => candidate.id === markerId)
  if (!marker) return
  marker.attachmentCount = state.attachments.filter((attachment) => attachment.markerId === markerId).length
  marker.messageCount = state.messages.filter((message) => message.markerId === markerId).length
  marker.updatedAt = nowIso()
}

function recomputeBriefCounts(state: ProjectEditBriefFixtureBundle, briefId: string) {
  const brief = state.briefs.find((candidate) => candidate.id === briefId)
  if (!brief) return
  const markers = state.markers.filter((marker) => marker.briefId === briefId && marker.status !== 'archived')
  const conflicts = state.conflicts.filter((conflict) => conflict.briefId === briefId)
  brief.markerCount = markers.length
  brief.confirmedMarkerCount = markers.filter((marker) => marker.status === 'confirmed' || marker.status === 'ready_for_plan' || marker.status === 'applied_to_plan').length
  brief.conflictCount = conflicts.length
  brief.needsAssetCount = markers.filter((marker) => marker.status === 'needs_asset').length
  brief.needsClarificationCount = markers.filter((marker) => marker.status === 'needs_clarification').length
  brief.availability = brief.conflictCount > 0
    ? 'has_conflicts'
    : brief.markerCount === 0 ? 'optional_opened'
      : brief.confirmedMarkerCount === brief.markerCount ? 'ready_for_plan'
        : brief.confirmedMarkerCount > 0 ? 'has_confirmed_markers'
          : 'has_markers'
  brief.updatedAt = nowIso()
}

function bundleFor(state: ProjectEditBriefFixtureBundle, brief: ProjectEditBriefRecord): ProjectEditBriefBundleRecord {
  return createProjectEditBriefBundle(brief, state)
}

function drawerFor(state: ProjectEditBriefFixtureBundle, marker: ProjectEditBriefMarkerRecord): ProjectEditBriefMarkerDrawerModel {
  return createProjectEditBriefDrawerModel(marker, state)
}

function success<TData extends RequestRecord>(
  envelope: ReeditProApiRequestEnvelope,
  data: TData,
  warnings: string[] = [],
): ReeditProApiResponseEnvelope<TData & { safety: typeof FULL_SAFETY }> {
  return {
    routeId: envelope.routeId,
    requestId: envelope.requestId,
    ok: true,
    data: {
      ...data,
      safety: { ...FULL_SAFETY },
    },
    warnings: [
      'Project Edit Brief browser mock client used fixture-backed local state only.',
      ...warnings,
    ],
    mockOnly: true,
    ...NO_PRODUCTION_EFFECTS,
    respondedAt: nowIso(),
  }
}

function failure(
  envelope: ReeditProApiRequestEnvelope,
  code: string,
  message: string,
  details: RequestRecord = {},
): ReeditProApiResponseEnvelope {
  return {
    routeId: envelope.routeId,
    requestId: envelope.requestId,
    ok: false,
    error: {
      code,
      message,
      details: {
        ...details,
        safety: { ...FULL_SAFETY },
      },
    },
    warnings: [
      'Project Edit Brief browser mock client failed before any production side effect.',
    ],
    mockOnly: true,
    ...NO_PRODUCTION_EFFECTS,
    respondedAt: nowIso(),
  }
}

function handleMockRequest(
  envelope: ReeditProApiRequestEnvelope,
  state: ProjectEditBriefFixtureBundle,
): ReeditProApiResponseEnvelope {
  const body = asRecord(envelope.payload)
  const brief = findBrief(state, body)
  const marker = findMarker(state, body)

  switch (envelope.routeId as ProjectEditBriefApiRouteId) {
    case 'project.editBrief.get':
      return brief ? success(envelope, { brief }) : failure(envelope, 'PROJECT_EDIT_BRIEF_NOT_FOUND', 'Project Edit Brief was not found.', body)
    case 'project.editBrief.forSession.get': {
      const editSessionId = stringValue(body, 'editSessionId', brief?.editSessionId ?? '')
      const sessionBrief = state.briefs.find((candidate) => candidate.editSessionId === editSessionId && candidate.status !== 'archived')
      return sessionBrief ? success(envelope, { brief: sessionBrief }) : failure(envelope, 'PROJECT_EDIT_BRIEF_NOT_FOUND', 'Project Edit Brief was not found for session.', body)
    }
    case 'project.editBrief.create': {
      const timestamp = nowIso()
      const created: ProjectEditBriefRecord = {
        id: optionalString(body, 'id') ?? createMockId('project-edit-brief'),
        projectId: stringValue(body, 'projectId', envelope.projectId ?? DEFAULT_PROJECT_ID),
        editSessionId: stringValue(body, 'editSessionId', 'edit-session-api-client-brief'),
        status: 'active',
        availability: 'optional_opened',
        title: stringValue(body, 'title', 'Mock Edit Brief'),
        summary: optionalString(body, 'summary') ?? 'Browser mock Edit Brief created through route envelope.',
        markerCount: 0,
        confirmedMarkerCount: 0,
        conflictCount: 0,
        needsAssetCount: 0,
        needsClarificationCount: 0,
        exportSettingsId: optionalString(body, 'exportSettingsId'),
        createdAt: timestamp,
        updatedAt: timestamp,
        lastOpenedAt: timestamp,
        mockOnly: true,
        metadata: asRecord(body.metadata),
      }
      state.briefs.push(created)
      return success(envelope, { brief: created })
    }
    case 'project.editBrief.update':
      if (!brief) return failure(envelope, 'PROJECT_EDIT_BRIEF_NOT_FOUND', 'Project Edit Brief was not found.', body)
      Object.assign(brief, asRecord(body.patch), { updatedAt: nowIso(), mockOnly: true })
      return success(envelope, { brief })
    case 'project.editBrief.archive':
      if (!brief) return failure(envelope, 'PROJECT_EDIT_BRIEF_NOT_FOUND', 'Project Edit Brief was not found.', body)
      brief.status = 'archived'
      brief.updatedAt = nowIso()
      return success(envelope, { brief })
    case 'project.editBrief.summary':
      return brief ? success(envelope, { summary: createProjectEditBriefReadableSummary(brief) }) : failure(envelope, 'PROJECT_EDIT_BRIEF_NOT_FOUND', 'Project Edit Brief was not found.', body)
    case 'project.editBrief.bundle':
      return brief ? success(envelope, { bundle: bundleFor(state, brief) }) : failure(envelope, 'PROJECT_EDIT_BRIEF_NOT_FOUND', 'Project Edit Brief was not found.', body)
    case 'project.editBrief.markers.list':
      return brief ? success(envelope, { markers: state.markers.filter((item) => item.briefId === brief.id).sort((a, b) => a.startTimeSeconds - b.startTimeSeconds) }) : failure(envelope, 'PROJECT_EDIT_BRIEF_NOT_FOUND', 'Project Edit Brief was not found.', body)
    case 'project.editBrief.markers.get':
      return marker ? success(envelope, { marker }) : failure(envelope, 'PROJECT_EDIT_BRIEF_MARKER_NOT_FOUND', 'Project Edit Brief marker was not found.', body)
    case 'project.editBrief.markers.create': {
      if (!brief) return failure(envelope, 'PROJECT_EDIT_BRIEF_NOT_FOUND', 'Project Edit Brief was not found.', body)
      const timestamp = nowIso()
      const created: ProjectEditBriefMarkerRecord = {
        id: optionalString(body, 'id') ?? createMockId('project-edit-brief-marker'),
        projectId: stringValue(body, 'projectId', brief.projectId),
        editSessionId: stringValue(body, 'editSessionId', brief.editSessionId),
        briefId: brief.id,
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
        attachmentCount: 0,
        messageCount: 0,
        qaStatus: markerQaStatus(body.qaStatus),
        createdAt: timestamp,
        updatedAt: timestamp,
        mockOnly: true,
        metadata: asRecord(body.metadata),
      }
      state.markers.push(created)
      recomputeBriefCounts(state, brief.id)
      return success(envelope, { marker: created })
    }
    case 'project.editBrief.markers.update':
      if (!marker) return failure(envelope, 'PROJECT_EDIT_BRIEF_MARKER_NOT_FOUND', 'Project Edit Brief marker was not found.', body)
      Object.assign(marker, asRecord(body.patch), { updatedAt: nowIso(), mockOnly: true })
      recomputeMarkerCounts(state, marker.id)
      recomputeBriefCounts(state, marker.briefId)
      return success(envelope, { marker })
    case 'project.editBrief.markers.delete':
      if (!marker) return failure(envelope, 'PROJECT_EDIT_BRIEF_MARKER_NOT_FOUND', 'Project Edit Brief marker was not found.', body)
      state.markers = state.markers.filter((item) => item.id !== marker.id)
      state.attachments = state.attachments.filter((item) => item.markerId !== marker.id)
      state.messages = state.messages.filter((item) => item.markerId !== marker.id)
      state.intents = state.intents.filter((item) => item.markerId !== marker.id)
      state.confirmations = state.confirmations.filter((item) => item.markerId !== marker.id)
      state.conflicts = state.conflicts.filter((item) => item.markerId !== marker.id && item.relatedMarkerId !== marker.id)
      state.revisions = state.revisions.filter((item) => item.markerId !== marker.id)
      recomputeBriefCounts(state, marker.briefId)
      return success(envelope, { markerId: marker.id, deleted: true })
    case 'project.editBrief.markers.confirm':
      if (!marker) return failure(envelope, 'PROJECT_EDIT_BRIEF_MARKER_NOT_FOUND', 'Project Edit Brief marker was not found.', body)
      marker.status = 'confirmed'
      marker.qaStatus = 'passed'
      marker.updatedAt = nowIso()
      recomputeBriefCounts(state, marker.briefId)
      return success(envelope, { marker })
    case 'project.editBrief.markers.archive':
      if (!marker) return failure(envelope, 'PROJECT_EDIT_BRIEF_MARKER_NOT_FOUND', 'Project Edit Brief marker was not found.', body)
      marker.status = 'archived'
      marker.updatedAt = nowIso()
      recomputeBriefCounts(state, marker.briefId)
      return success(envelope, { marker })
    case 'project.editBrief.markerAttachments.list':
      return marker ? success(envelope, { attachments: state.attachments.filter((item) => item.markerId === marker.id) }) : failure(envelope, 'PROJECT_EDIT_BRIEF_MARKER_NOT_FOUND', 'Project Edit Brief marker was not found.', body)
    case 'project.editBrief.markerAttachments.add': {
      if (!marker) return failure(envelope, 'PROJECT_EDIT_BRIEF_MARKER_NOT_FOUND', 'Project Edit Brief marker was not found.', body)
      const timestamp = nowIso()
      const attachment: ProjectEditBriefMarkerAttachmentRecord = {
        id: optionalString(body, 'id') ?? createMockId('project-edit-brief-attachment'),
        projectId: stringValue(body, 'projectId', marker.projectId),
        editSessionId: stringValue(body, 'editSessionId', marker.editSessionId),
        briefId: marker.briefId,
        markerId: marker.id,
        attachmentKind: attachmentKind(body.attachmentKind),
        status: attachmentStatus(body.status),
        label: stringValue(body, 'label', 'Mock metadata attachment'),
        mediaAssetId: optionalString(body, 'mediaAssetId'),
        referenceUrl: optionalString(body, 'referenceUrl'),
        referenceLabel: optionalString(body, 'referenceLabel'),
        notes: stringArray(body.notes),
        previewLabel: optionalString(body, 'previewLabel'),
        durationSeconds: body.durationSeconds === undefined ? undefined : numberValue(body, 'durationSeconds', 0),
        mockOnly: true,
        metadata: asRecord(body.metadata),
        createdAt: timestamp,
        updatedAt: timestamp,
      }
      state.attachments.push(attachment)
      recomputeMarkerCounts(state, marker.id)
      return success(envelope, { attachment })
    }
    case 'project.editBrief.markerAttachments.remove': {
      const attachmentId = optionalString(body, 'attachmentId') ?? optionalString(body, 'id') ?? state.attachments.find((item) => !marker || item.markerId === marker.id)?.id
      if (!attachmentId) return failure(envelope, 'PROJECT_EDIT_BRIEF_ATTACHMENT_NOT_FOUND', 'Project Edit Brief marker attachment was not found.', body)
      const removed = state.attachments.find((item) => item.id === attachmentId)
      state.attachments = state.attachments.filter((item) => item.id !== attachmentId)
      if (removed) recomputeMarkerCounts(state, removed.markerId)
      return success(envelope, { attachmentId, removed: true })
    }
    case 'project.editBrief.markerMessages.list':
      return marker ? success(envelope, { messages: state.messages.filter((item) => item.markerId === marker.id) }) : failure(envelope, 'PROJECT_EDIT_BRIEF_MARKER_NOT_FOUND', 'Project Edit Brief marker was not found.', body)
    case 'project.editBrief.markerMessages.append': {
      if (!marker) return failure(envelope, 'PROJECT_EDIT_BRIEF_MARKER_NOT_FOUND', 'Project Edit Brief marker was not found.', body)
      const message: ProjectEditBriefMarkerMessageRecord = {
        id: optionalString(body, 'id') ?? createMockId('project-edit-brief-message'),
        projectId: stringValue(body, 'projectId', marker.projectId),
        editSessionId: stringValue(body, 'editSessionId', marker.editSessionId),
        briefId: marker.briefId,
        markerId: marker.id,
        role: messageRole(body.role),
        kind: messageKind(body.kind),
        text: stringValue(body, 'text', 'Mock Marker Chat note.'),
        createdAt: nowIso(),
        relatedIntentId: optionalString(body, 'relatedIntentId'),
        relatedAttachmentId: optionalString(body, 'relatedAttachmentId'),
        mockOnly: true,
        metadata: asRecord(body.metadata),
      }
      state.messages.push(message)
      recomputeMarkerCounts(state, marker.id)
      return success(envelope, { message })
    }
    case 'project.editBrief.markerIntent.get':
      return marker ? success(envelope, { intent: state.intents.find((item) => item.markerId === marker.id) }) : failure(envelope, 'PROJECT_EDIT_BRIEF_MARKER_NOT_FOUND', 'Project Edit Brief marker was not found.', body)
    case 'project.editBrief.markerIntent.save': {
      if (!marker) return failure(envelope, 'PROJECT_EDIT_BRIEF_MARKER_NOT_FOUND', 'Project Edit Brief marker was not found.', body)
      const timestamp = nowIso()
      const intent: ProjectEditBriefMarkerIntentRecord = {
        id: optionalString(body, 'id') ?? optionalString(body, 'intentId') ?? createMockId('project-edit-brief-intent'),
        projectId: stringValue(body, 'projectId', marker.projectId),
        editSessionId: stringValue(body, 'editSessionId', marker.editSessionId),
        briefId: marker.briefId,
        markerId: marker.id,
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
        createdAt: timestamp,
        updatedAt: timestamp,
        mockOnly: true,
        metadata: asRecord(body.metadata),
      }
      state.intents = state.intents.filter((item) => item.id !== intent.id && item.markerId !== marker.id)
      state.intents.push(intent)
      marker.intentId = intent.id
      marker.updatedAt = timestamp
      return success(envelope, { intent })
    }
    case 'project.editBrief.markerIntent.update': {
      const intentId = optionalString(body, 'intentId') ?? optionalString(body, 'id') ?? (marker ? state.intents.find((item) => item.markerId === marker.id)?.id : undefined)
      const intent = state.intents.find((item) => item.id === intentId)
      if (!intent) return failure(envelope, 'PROJECT_EDIT_BRIEF_INTENT_NOT_FOUND', 'Project Edit Brief marker intent was not found.', body)
      Object.assign(intent, asRecord(body.patch), { updatedAt: nowIso(), mockOnly: true })
      return success(envelope, { intent })
    }
    case 'project.editBrief.markerConfirmations.list':
      return marker ? success(envelope, { confirmations: state.confirmations.filter((item) => item.markerId === marker.id) }) : failure(envelope, 'PROJECT_EDIT_BRIEF_MARKER_NOT_FOUND', 'Project Edit Brief marker was not found.', body)
    case 'project.editBrief.markerConfirmations.save': {
      if (!marker) return failure(envelope, 'PROJECT_EDIT_BRIEF_MARKER_NOT_FOUND', 'Project Edit Brief marker was not found.', body)
      const confirmation: ProjectEditBriefMarkerConfirmationRecord = {
        id: optionalString(body, 'id') ?? createMockId('project-edit-brief-confirmation'),
        projectId: stringValue(body, 'projectId', marker.projectId),
        editSessionId: stringValue(body, 'editSessionId', marker.editSessionId),
        briefId: marker.briefId,
        markerId: marker.id,
        intentId: optionalString(body, 'intentId') ?? marker.intentId ?? `${marker.id}-mock-intent`,
        summary: stringValue(body, 'summary', 'Mock confirmation saved.'),
        confirmedByUser: booleanValue(body, 'confirmedByUser', true),
        aiMode: markerAiMode(body.aiMode),
        createdAt: nowIso(),
        mockOnly: true,
        metadata: asRecord(body.metadata),
      }
      state.confirmations.push(confirmation)
      return success(envelope, { confirmation })
    }
    case 'project.editBrief.markerConflicts.list':
      return success(envelope, { conflicts: state.conflicts.filter((item) => (!brief || item.briefId === brief.id) && (!marker || item.markerId === marker.id)) })
    case 'project.editBrief.markerConflicts.save': {
      if (!marker) return failure(envelope, 'PROJECT_EDIT_BRIEF_MARKER_NOT_FOUND', 'Project Edit Brief marker was not found.', body)
      const conflict: ProjectEditBriefMarkerConflictRecord = {
        id: optionalString(body, 'id') ?? createMockId('project-edit-brief-conflict'),
        projectId: stringValue(body, 'projectId', marker.projectId),
        editSessionId: stringValue(body, 'editSessionId', marker.editSessionId),
        briefId: marker.briefId,
        markerId: marker.id,
        relatedMarkerId: optionalString(body, 'relatedMarkerId'),
        qaStatus: 'conflict',
        title: stringValue(body, 'title', 'Mock marker conflict'),
        summary: stringValue(body, 'summary', 'Mock conflict saved for owner review.'),
        recommendedResolution: stringValue(body, 'recommendedResolution', 'Resolve marker instructions before future planning.'),
        blocksPlan: booleanValue(body, 'blocksPlan', true),
        requiresUserReview: booleanValue(body, 'requiresUserReview', true),
        createdAt: nowIso(),
        mockOnly: true,
        metadata: asRecord(body.metadata),
      }
      state.conflicts.push(conflict)
      marker.status = 'conflict'
      marker.qaStatus = 'conflict'
      recomputeBriefCounts(state, marker.briefId)
      return success(envelope, { conflict })
    }
    case 'project.editBrief.markerRevisions.list':
      return marker ? success(envelope, { revisions: state.revisions.filter((item) => item.markerId === marker.id) }) : failure(envelope, 'PROJECT_EDIT_BRIEF_MARKER_NOT_FOUND', 'Project Edit Brief marker was not found.', body)
    case 'project.editBrief.markerRevisions.save': {
      if (!marker) return failure(envelope, 'PROJECT_EDIT_BRIEF_MARKER_NOT_FOUND', 'Project Edit Brief marker was not found.', body)
      const revision: ProjectEditBriefMarkerRevisionRecord = {
        id: optionalString(body, 'id') ?? createMockId('project-edit-brief-revision'),
        projectId: stringValue(body, 'projectId', marker.projectId),
        editSessionId: stringValue(body, 'editSessionId', marker.editSessionId),
        briefId: marker.briefId,
        markerId: marker.id,
        previousIntentId: optionalString(body, 'previousIntentId'),
        newIntentId: optionalString(body, 'newIntentId'),
        summary: stringValue(body, 'summary', 'Mock marker revision saved.'),
        reason: stringValue(body, 'reason', 'Marker Chat instruction changed.'),
        createdAt: nowIso(),
        mockOnly: true,
        metadata: asRecord(body.metadata),
      }
      state.revisions.push(revision)
      return success(envelope, { revision })
    }
    case 'project.editBrief.applicationLogs.list':
      return brief ? success(envelope, { applicationLogs: state.applicationLogs.filter((item) => item.briefId === brief.id) }) : failure(envelope, 'PROJECT_EDIT_BRIEF_NOT_FOUND', 'Project Edit Brief was not found.', body)
    case 'project.editBrief.applicationLogs.append': {
      if (!brief) return failure(envelope, 'PROJECT_EDIT_BRIEF_NOT_FOUND', 'Project Edit Brief was not found.', body)
      const applicationLog: ProjectEditBriefApplicationLogRecord = {
        id: optionalString(body, 'id') ?? createMockId('project-edit-brief-application-log'),
        projectId: stringValue(body, 'projectId', brief.projectId),
        editSessionId: stringValue(body, 'editSessionId', brief.editSessionId),
        briefId: brief.id,
        markerId: optionalString(body, 'markerId'),
        summary: stringValue(body, 'summary', 'Mock application log appended.'),
        appliedToPlan: booleanValue(body, 'appliedToPlan', false),
        createdAt: nowIso(),
        mockOnly: true,
        metadata: asRecord(body.metadata),
      }
      state.applicationLogs.push(applicationLog)
      return success(envelope, { applicationLog })
    }
    case 'project.editBrief.exportSettings.get': {
      const editSessionId = stringValue(body, 'editSessionId', brief?.editSessionId ?? '')
      const exportSettings = state.exportSettings.find((item) => item.editSessionId === editSessionId)
      return exportSettings ? success(envelope, { exportSettings }) : failure(envelope, 'PROJECT_EDIT_BRIEF_EXPORT_SETTINGS_NOT_FOUND', 'Project Edit Session export settings were not found.', body)
    }
    case 'project.editBrief.exportSettings.recommend': {
      const editSessionId = stringValue(body, 'editSessionId', brief?.editSessionId ?? 'edit-session-api-client-export')
      const existing = state.exportSettings.find((item) => item.editSessionId === editSessionId)
      const exportSettings = existing ?? recommendProjectEditBriefExportSettings({
        projectId: stringValue(body, 'projectId', envelope.projectId ?? DEFAULT_PROJECT_ID),
        editSessionId,
        platformTarget: body.platformTarget as ProjectEditSessionExportSettingsRecord['platformTarget'],
        aspectRatio: body.aspectRatio as ProjectEditSessionExportSettingsRecord['aspectRatio'],
        customAspectRatio: body.customAspectRatio as ProjectEditSessionExportSettingsRecord['customAspectRatio'],
        presetId: body.presetId as ProjectEditSessionExportSettingsRecord['deliveryPreset'],
        id: createMockId('project-edit-session-export-settings'),
        createdAt: nowIso(),
      }).exportSettings
      if (!existing) state.exportSettings.push(exportSettings)
      return success(envelope, { exportSettings })
    }
    case 'project.editBrief.exportSettings.update': {
      const editSessionId = stringValue(body, 'editSessionId', brief?.editSessionId ?? '')
      const exportSettings = state.exportSettings.find((item) => item.id === optionalString(body, 'exportSettingsId') || item.editSessionId === editSessionId)
      if (!exportSettings) return failure(envelope, 'PROJECT_EDIT_BRIEF_EXPORT_SETTINGS_NOT_FOUND', 'Project Edit Session export settings were not found.', body)
      Object.assign(exportSettings, asRecord(body.patch), { source: 'user_override_mock', updatedAt: nowIso(), mockOnly: true })
      return success(envelope, { exportSettings })
    }
    case 'project.editBrief.timeline.models':
      return brief ? success(envelope, { timelineMarkers: createProjectEditBriefTimelineMarkerModels(state.markers.filter((item) => item.briefId === brief.id)) }) : failure(envelope, 'PROJECT_EDIT_BRIEF_NOT_FOUND', 'Project Edit Brief was not found.', body)
    case 'project.editBrief.markerDrawer.get':
      return marker ? success(envelope, { drawer: drawerFor(state, marker) }) : failure(envelope, 'PROJECT_EDIT_BRIEF_MARKER_NOT_FOUND', 'Project Edit Brief marker was not found.', body)
    default:
      return failure(envelope, 'PROJECT_EDIT_BRIEF_ROUTE_NOT_FOUND', `${envelope.routeId} is not a registered Project Edit Brief mock route.`, { routeId: envelope.routeId })
  }
}

export function createProjectEditBriefApiClient(options: ReeditProApiClientOptions = {}): MockProjectEditBriefApiClient {
  const state = options.preserveMockSession === false ? createState() : getSharedMockState(options)
  if (options.preserveMockSession === false) setSharedMockState(options, state)
  const liveQwenMarkerChatConfigured = options.liveQwenMarkerChat === true
    && options.mode === 'mock_backend_local'
    && Boolean(liveApiBaseUrl(options))
  const liveQwen25VLVisualContextConfigured = options.liveQwen25VLVisualContext === true
    && options.mode === 'mock_backend_local'
    && Boolean(liveApiBaseUrl(options))
  const qwenMarkerChatRuntime: ProjectEditBriefQwenMarkerChatRuntimeSummary = liveQwenMarkerChatConfigured
    ? {
      mode: 'backend_beta_route',
      label: `${REEDITPRO_QWEN_MAIN_BRAIN_LABEL} beta route configured`,
      liveConfigured: true,
      summary: `Marker Chat will request the backend-only ${REEDITPRO_QWEN_MAIN_BRAIN_LABEL} beta route. Provider calls still depend on server runtime gates, Secret Manager, structured validation, and safe fallback.`,
      readiness: createLiveQwenMarkerChatReadinessCheckingSummary(),
    }
    : {
      mode: 'local_fallback',
      label: 'Local fallback active',
      liveConfigured: false,
      summary: `Marker Chat is using deterministic local intent capture. No ${REEDITPRO_QWEN_MAIN_BRAIN_LABEL} provider call is attempted from this browser session.`,
      readiness: createLocalQwenMarkerChatReadinessSummary(),
    }
  const qwen25VLVisualContextRuntime: ProjectEditBriefQwen25VLVisualContextRuntimeSummary = liveQwen25VLVisualContextConfigured
    ? {
      mode: 'backend_beta_route',
      label: 'Qwen2.5-VL beta route configured',
      liveConfigured: true,
      summary: 'Visual Context will request the backend-only Qwen2.5-VL beta route with sampled resized frames. Provider calls still depend on server runtime gates, Secret Manager, structured validation, and safe fallback.',
      readiness: createLiveQwen25VLReadinessCheckingSummary(),
    }
    : {
      mode: 'local_fallback',
      label: 'Qwen2.5-VL local fallback active',
      liveConfigured: false,
      summary: 'Visual Context is using deterministic local fallback. No Qwen2.5-VL provider call is attempted from this browser session.',
      readiness: createLocalQwen25VLReadinessSummary(),
    }

  const transport: ReeditProApiTransport = {
    mode: options.mode ?? 'mock_browser',
    safety: PROJECT_EDIT_BRIEF_API_CLIENT_SAFETY,
    async request<TPayload = unknown, TData = unknown>(
      envelope: ReeditProApiRequestEnvelope<TPayload>,
    ): Promise<ReeditProApiResponseEnvelope<TData>> {
      if (shouldUseLiveQwenMarkerChat(options, envelope)) {
        return requestLiveQwenMarkerChat<TData>(options, envelope)
      }
      return handleMockRequest(envelope, state) as ReeditProApiResponseEnvelope<TData>
    },
  }

  function createEnvelope<TPayload = unknown>(
    routeId: ProjectEditBriefApiRouteId,
    payload = {} as TPayload,
  ): ReeditProApiRequestEnvelope<TPayload> {
    return {
      routeId,
      requestId: createRequestId(routeId),
      workspaceId: options.workspaceId,
      projectId: options.projectId ?? DEFAULT_PROJECT_ID,
      userId: options.userId,
      payload,
      mockOnly: true,
      requestedAt: nowIso(),
      metadata: {
        clientSummary: createProjectEditBriefApiClientSummary().status,
      },
    }
  }

  function request<TPayload = unknown, TData = unknown>(
    routeId: ProjectEditBriefApiRouteId,
    payload?: TPayload,
  ): Promise<ReeditProApiResponseEnvelope<TData>> {
    return transport.request(createEnvelope(routeId, payload ?? {} as TPayload))
  }

  const client: MockProjectEditBriefApiClient = {
    transport,
    safety: PROJECT_EDIT_BRIEF_API_CLIENT_SAFETY,
    qwenMarkerChatRuntime,
    qwen25VLVisualContextRuntime,
    loadQwenMarkerChatReadiness: () => requestLiveQwenMarkerChatReadiness(options),
    loadQwen25VLVisualContextReadiness: () => requestLiveQwen25VLReadiness(options),
    createEnvelope,
    request,
    brief: {
      get: (briefId) => request('project.editBrief.get', { briefId }),
      getForSession: (editSessionId) => request('project.editBrief.forSession.get', { editSessionId }),
      create: (input) => request('project.editBrief.create', input),
      update: (input) => request('project.editBrief.update', input),
      archive: (briefId) => request('project.editBrief.archive', { briefId }),
      summary: (briefId) => request('project.editBrief.summary', { briefId }),
      bundle: (briefId) => request('project.editBrief.bundle', { briefId }),
    },
    markers: {
      list: (briefId) => request('project.editBrief.markers.list', { briefId }),
      get: (markerId) => request('project.editBrief.markers.get', { markerId }),
      create: (input) => request('project.editBrief.markers.create', input),
      update: (input) => request('project.editBrief.markers.update', input),
      delete: (markerId) => request('project.editBrief.markers.delete', { markerId }),
      confirm: (input) => request('project.editBrief.markers.confirm', input),
      archive: (markerId) => request('project.editBrief.markers.archive', { markerId }),
    },
    attachments: {
      list: (markerId) => request('project.editBrief.markerAttachments.list', { markerId }),
      add: (input) => request('project.editBrief.markerAttachments.add', input),
      remove: (attachmentId) => request('project.editBrief.markerAttachments.remove', { attachmentId }),
    },
    markerMessages: {
      list: (markerId) => request('project.editBrief.markerMessages.list', { markerId }),
      append: (input) => request('project.editBrief.markerMessages.append', input),
    },
    intent: {
      get: (markerId) => request('project.editBrief.markerIntent.get', { markerId }),
      save: (input) => request('project.editBrief.markerIntent.save', input),
      update: (input) => request('project.editBrief.markerIntent.update', input),
    },
    confirmations: {
      list: (markerId) => request('project.editBrief.markerConfirmations.list', { markerId }),
      save: (input) => request('project.editBrief.markerConfirmations.save', input),
    },
    conflicts: {
      list: (input) => request('project.editBrief.markerConflicts.list', input),
      save: (input) => request('project.editBrief.markerConflicts.save', input),
    },
    revisions: {
      list: (markerId) => request('project.editBrief.markerRevisions.list', { markerId }),
      save: (input) => request('project.editBrief.markerRevisions.save', input),
    },
    applicationLogs: {
      list: (briefId) => request('project.editBrief.applicationLogs.list', { briefId }),
      append: (input) => request('project.editBrief.applicationLogs.append', input),
    },
    exportSettings: {
      get: (editSessionId) => request('project.editBrief.exportSettings.get', { editSessionId }),
      recommend: (input) => request('project.editBrief.exportSettings.recommend', input),
      update: (input) => request('project.editBrief.exportSettings.update', input),
    },
    timeline: {
      models: (briefId) => request('project.editBrief.timeline.models', { briefId }),
    },
    drawer: {
      get: (markerId) => request('project.editBrief.markerDrawer.get', { markerId }),
    },
    visualContext: {
      analyze: (input) => requestLiveQwen25VLVisualContext(options, input),
    },
    getMockState: () => state,
    resetMockState: () => {
      const next = createState()
      setSharedMockState(options, next)
      Object.assign(state, next)
      return state
    },
  }

  return client
}

export function createDefaultMockProjectEditBriefApiClient(
  options: ReeditProApiClientOptions = {},
): MockProjectEditBriefApiClient {
  return createProjectEditBriefApiClient({
    preserveMockSession: true,
    mockOnly: true,
    mode: 'mock_browser',
    projectId: DEFAULT_PROJECT_ID,
    ...options,
  })
}

export function createQwenLiveProjectEditBriefApiClient(
  options: ReeditProApiClientOptions & { apiBaseUrl: string },
): MockProjectEditBriefApiClient {
  return createProjectEditBriefApiClient({
    preserveMockSession: true,
    mockOnly: true,
    mode: 'mock_backend_local',
    liveQwenMarkerChat: options.liveQwenMarkerChat ?? true,
    liveQwen25VLVisualContext: options.liveQwen25VLVisualContext ?? false,
    projectId: DEFAULT_PROJECT_ID,
    ...options,
  })
}

export function listProjectEditBriefApiClientRouteIds(): readonly ProjectEditBriefApiRouteId[] {
  return PROJECT_EDIT_BRIEF_API_ROUTE_IDS
}
