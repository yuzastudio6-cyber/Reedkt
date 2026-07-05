import type { ReeditProApiResponseEnvelope } from '../types/api-routes'
import type {
  ProjectEditSessionEventRecord,
  ProjectEditSessionMemoryRecord,
  ProjectEditSessionMessageKind,
  ProjectEditSessionMessageRecord,
  ProjectEditSessionMessageRole,
  ProjectEditSessionPreviewRecord,
  ProjectEditSessionRecord,
  ProjectEditSessionRevisionRecord,
  ProjectEditSessionSnapshotRecord,
  ProjectEditSessionSourceRecord,
  ProjectEditSessionVersionRecord,
} from '../types/project-edit-session'
import type { ProjectEditSessionBundleRecord } from '../types/project-edit-session-repository'
import {
  createDefaultMockProjectEditSessionApiClient,
  type ProjectEditSessionApiClient,
} from './project-edit-session-api-client'
import { PROJECT_EDIT_SESSION_API_CLIENT_SAFETY } from './project-edit-session-api-client-summaries'
import {
  applyMockMemoryUpdateFromMessageViaApi,
  applyMockRevisionMemoryUpdateViaApi,
  createProjectEditSessionMemoryBoundarySummary,
  createProjectEditSessionMemoryLayerCardModels,
  type ProjectEditSessionMemoryLayerCardModel,
  type ProjectEditSessionMemoryUpdateNoticeModel,
} from './project-edit-session-memory-ui-adapter'
import {
  createProjectEditSessionHistoryPackageFromBundle,
  createProjectEditSessionHistoryPanelModel,
  type ProjectEditSessionHistoryPanelModel,
} from './project-edit-session-history-ui-adapter'

export const PROJECT_EDIT_SESSION_CHAT_REVISION_KEYWORDS = [
  'revise',
  'change',
  'make it faster',
  'slow it down',
  'captions',
  'music',
  'sfx',
  'premium',
  'less',
  'more',
] as const

export type ProjectEditSessionChatHeaderModel = {
  editSessionId: string
  projectId: string
  title: string
  statusLabel: string
  aspectRatioLabel: string
  platformLabel: string
  editLevelLabel: string
  selectedPreferenceLabel: string
  dnaLabel: string
  dnaQALabel: string
  doNotCopyLabel: string
  projectRoute: string
  mockOnly: true
}

export type ProjectEditSessionChatMessageModel = {
  id: string
  role: ProjectEditSessionMessageRole
  kind: ProjectEditSessionMessageKind
  roleLabel: string
  kindLabel: string
  text: string
  timestampLabel: string
  bubbleClassName: string
  mockOnly: true
}

export type ProjectEditSessionChatContextPanelModel = {
  sourceSummary: string
  memorySummary: string
  versionPreviewSummary: string
  revisionSummary: string
  eventSummary: string
  sourceItems: string[]
  memoryItems: string[]
  versionItems: string[]
  previewItems: string[]
  revisionItems: string[]
  eventItems: string[]
  historyPanel: ProjectEditSessionHistoryPanelModel
  memoryLayerCards: ProjectEditSessionMemoryLayerCardModel[]
  memoryBoundarySummary: string
  counts: {
    messages: number
    sources: number
    memories: number
    versions: number
    previews: number
    revisions: number
    events: number
  }
  safetyLabels: string[]
  mockOnly: true
}

export type ProjectEditSessionChatBoundarySummary = {
  title: string
  body: string
  safetyLabels: string[]
  mockOnly: true
}

export type ProjectEditSessionChatBundleForUI = {
  response: ReeditProApiResponseEnvelope<{ bundle: ProjectEditSessionBundleRecord }>
  bundle?: ProjectEditSessionBundleRecord
  header?: ProjectEditSessionChatHeaderModel
  messages: ProjectEditSessionChatMessageModel[]
  context?: ProjectEditSessionChatContextPanelModel
  boundary: ProjectEditSessionChatBoundarySummary
  warnings: string[]
  safety: typeof PROJECT_EDIT_SESSION_API_CLIENT_SAFETY
  mockOnly: true
}

export type ProjectEditSessionChatAppendResult = {
  ok: boolean
  userMessage?: ProjectEditSessionMessageRecord
  assistantMessage?: ProjectEditSessionMessageRecord
  revision?: ProjectEditSessionRevisionRecord
  snapshot?: ProjectEditSessionSnapshotRecord
  memory?: ProjectEditSessionMemoryRecord
  memoryUpdates: ProjectEditSessionMemoryRecord[]
  memoryUpdateNotice?: ProjectEditSessionMemoryUpdateNoticeModel
  events: ProjectEditSessionEventRecord[]
  responseSummaries: string[]
  warnings: string[]
  revisionDetected: boolean
  safety: typeof PROJECT_EDIT_SESSION_API_CLIENT_SAFETY
  mockOnly: true
}

const DEFAULT_PROJECT_ID = 'mock-project-edit-chat-foundation'

function clientFor(projectId: string, client?: ProjectEditSessionApiClient): ProjectEditSessionApiClient {
  return client ?? createDefaultMockProjectEditSessionApiClient({
    projectId,
    preserveMockSession: true,
  })
}

function titleCase(value: string): string {
  return value
    .replace(/^@/, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatTimestamp(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

function editLevelLabel(value: ProjectEditSessionRecord['selectedEditLevel']): string {
  if (value === 'ultra_premium') return 'Ultra Premium'
  if (value === 'premium') return 'Premium'
  if (value === 'basic') return 'Basic'
  return 'Not selected'
}

function responseSummary(response: ReeditProApiResponseEnvelope, label: string): string {
  return response.ok
    ? `${label}: ${response.routeId} completed with mock/local safety flags.`
    : `${label}: ${response.error?.code ?? 'unknown_error'} without production side effects.`
}

function dataRecord<TRecord extends object>(response: ReeditProApiResponseEnvelope): TRecord | undefined {
  return response.data && typeof response.data === 'object' && !Array.isArray(response.data)
    ? response.data as TRecord
    : undefined
}

function firstText(items: string[], fallback: string): string {
  return items.find((item) => item.trim()) ?? fallback
}

function sourceLabel(source: ProjectEditSessionSourceRecord): string {
  const label = source.label ?? source.mediaAssetId
  const notes = source.notes.length ? ` - ${source.notes.join('; ')}` : ''
  return `${source.sourceOrderIndex}. ${label}${notes}`
}

function memoryLabel(memory: ProjectEditSessionMemoryRecord): string {
  return `${titleCase(memory.layer)}: ${memory.summary}`
}

function versionLabel(version: ProjectEditSessionVersionRecord): string {
  return `v${version.versionNumber} ${titleCase(version.status)} - ${version.summary}`
}

function previewLabel(preview: ProjectEditSessionPreviewRecord): string {
  return `${titleCase(preview.status)} (${preview.aspectRatio})`
}

function revisionLabel(revision: ProjectEditSessionRevisionRecord): string {
  return `${revision.summary} Approval reset: ${revision.resetsApproval ? 'yes' : 'no'}`
}

function eventLabel(event: ProjectEditSessionEventRecord): string {
  return `${titleCase(event.eventType)}: ${event.summary}`
}

export function isProjectEditSessionRevisionRequest(text: string): boolean {
  const normalized = text.toLowerCase()
  return PROJECT_EDIT_SESSION_CHAT_REVISION_KEYWORDS.some((keyword) => normalized.includes(keyword))
}

export function createProjectEditSessionChatBoundarySummary(): ProjectEditSessionChatBoundarySummary {
  return {
    title: 'Mock/local Edit Chat',
    body: 'Messages and session state persist in the mock repository. No real media processing, Qwen, DeepSeek, providers, render, workers, or credits yet.',
    safetyLabels: [
      'providerCallMade: false',
      'supabaseWriteMade: false',
      'storageWriteMade: false',
      'fileBytesRead: false',
      'externalUrlFetched: false',
      'mediaProcessingStarted: false',
      'workerJobCreated: false',
      'generationRequestCreated: false',
      'renderJobCreated: false',
      'creditReservedOrSpent: false',
    ],
    mockOnly: true,
  }
}

export function createProjectEditSessionChatHeaderModelFromRecord(
  session: ProjectEditSessionRecord,
): ProjectEditSessionChatHeaderModel {
  return {
    editSessionId: session.id,
    projectId: session.projectId,
    title: session.name,
    statusLabel: titleCase(session.status),
    aspectRatioLabel: session.aspectRatio,
    platformLabel: titleCase(session.platformTarget),
    editLevelLabel: editLevelLabel(session.selectedEditLevel),
    selectedPreferenceLabel: session.selectedEditPreferenceHandle ?? 'No Edit Preference selected',
    dnaLabel: session.dnaStatusLabel ? 'DNA applied' : 'Legacy no-DNA',
    dnaQALabel: session.dnaQAStatusLabel ?? (session.dnaStatusLabel ? 'DNA QA ready' : 'Legacy QA'),
    doNotCopyLabel: session.doNotCopyRulesActive ? 'Do-not-copy active' : 'No DNA do-not-copy package',
    projectRoute: `/projects/${session.projectId}`,
    mockOnly: true,
  }
}

export function createProjectEditSessionChatHeaderModel(
  bundle: ProjectEditSessionBundleRecord,
): ProjectEditSessionChatHeaderModel {
  return createProjectEditSessionChatHeaderModelFromRecord(bundle.session)
}

export function createProjectEditSessionMessageModels(
  messages: ProjectEditSessionMessageRecord[],
): ProjectEditSessionChatMessageModel[] {
  return messages.map((message) => ({
    id: message.id,
    role: message.role,
    kind: message.kind,
    roleLabel: titleCase(message.role),
    kindLabel: titleCase(message.kind),
    text: message.text,
    timestampLabel: formatTimestamp(message.createdAt),
    bubbleClassName: `project-edit-session-message--${message.role}`,
    mockOnly: true,
  }))
}

export function createProjectEditSessionContextPanelModel(
  bundle: ProjectEditSessionBundleRecord,
): ProjectEditSessionChatContextPanelModel {
  const sourceItems = bundle.sources.map(sourceLabel)
  const memoryItems = bundle.memories.map(memoryLabel)
  const versionItems = bundle.versions.map(versionLabel)
  const previewItems = bundle.previews.map(previewLabel)
  const revisionItems = bundle.revisions.map(revisionLabel)
  const eventItems = bundle.events.map(eventLabel)
  const historyPackage = createProjectEditSessionHistoryPackageFromBundle(bundle)

  return {
    sourceSummary: firstText(sourceItems, 'No mock source clips or source notes yet.'),
    memorySummary: firstText(memoryItems, 'No memory layers yet.'),
    versionPreviewSummary: versionItems[0] ?? previewItems[0] ?? 'No mock versions or previews yet.',
    revisionSummary: firstText(revisionItems, 'No revision requests yet.'),
    eventSummary: firstText(eventItems, 'No event records yet.'),
    sourceItems,
    memoryItems,
    versionItems,
    previewItems,
    revisionItems,
    eventItems,
    historyPanel: createProjectEditSessionHistoryPanelModel(historyPackage),
    memoryLayerCards: createProjectEditSessionMemoryLayerCardModels(bundle.memories),
    memoryBoundarySummary: createProjectEditSessionMemoryBoundarySummary(),
    counts: {
      messages: bundle.messages.length,
      sources: bundle.sources.length,
      memories: bundle.memories.length,
      versions: bundle.versions.length,
      previews: bundle.previews.length,
      revisions: bundle.revisions.length,
      events: bundle.events.length,
    },
    safetyLabels: createProjectEditSessionChatBoundarySummary().safetyLabels,
    mockOnly: true,
  }
}

export async function loadProjectEditSessionChatBundleForUI(input: {
  projectId?: string
  editSessionId: string
  client?: ProjectEditSessionApiClient
}): Promise<ProjectEditSessionChatBundleForUI> {
  const projectId = input.projectId ?? DEFAULT_PROJECT_ID
  const api = clientFor(projectId, input.client)
  const response = await api.bundle.get<{ bundle: ProjectEditSessionBundleRecord }>(input.editSessionId)
  const bundle = response.data?.bundle
  return {
    response,
    bundle,
    header: bundle ? createProjectEditSessionChatHeaderModel(bundle) : undefined,
    messages: bundle ? createProjectEditSessionMessageModels(bundle.messages) : [],
    context: bundle ? createProjectEditSessionContextPanelModel(bundle) : undefined,
    boundary: createProjectEditSessionChatBoundarySummary(),
    warnings: response.warnings ?? [],
    safety: PROJECT_EDIT_SESSION_API_CLIENT_SAFETY,
    mockOnly: true,
  }
}

export async function appendProjectEditSessionUserMessageViaApi(input: {
  projectId: string
  editSessionId: string
  text: string
  client?: ProjectEditSessionApiClient
}): Promise<{
  response: ReeditProApiResponseEnvelope<{ message: ProjectEditSessionMessageRecord }>
  message?: ProjectEditSessionMessageRecord
  revisionDetected: boolean
  event?: ProjectEditSessionEventRecord
  responseSummaries: string[]
  warnings: string[]
}> {
  const api = clientFor(input.projectId, input.client)
  const revisionDetected = isProjectEditSessionRevisionRequest(input.text)
  const responseSummaries: string[] = []
  const warnings: string[] = []
  const response = await api.messages.append<{ message: ProjectEditSessionMessageRecord }>({
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    role: 'user',
    kind: revisionDetected ? 'revision_request' : 'text',
    text: input.text,
    metadata: {
      rpMilestone: 'RP-EDITSESSION-07',
      revisionDetected,
      safety: PROJECT_EDIT_SESSION_API_CLIENT_SAFETY,
    },
  })
  responseSummaries.push(responseSummary(response, 'Append user message'))
  const message = dataRecord<{ message?: ProjectEditSessionMessageRecord }>(response)?.message
  if (!response.ok) warnings.push(response.error?.message ?? 'User message append failed safely.')

  let event: ProjectEditSessionEventRecord | undefined
  if (message) {
    const eventResponse = await api.events.append<{ event: ProjectEditSessionEventRecord }>({
      projectId: input.projectId,
      editSessionId: input.editSessionId,
      eventType: 'message_received',
      summary: `Mock Edit Chat user message received: ${input.text.slice(0, 80)}`,
      metadata: {
        messageId: message.id,
        revisionDetected,
      },
    })
    responseSummaries.push(responseSummary(eventResponse, 'Append message received event'))
    event = dataRecord<{ event?: ProjectEditSessionEventRecord }>(eventResponse)?.event
    if (!eventResponse.ok) warnings.push(eventResponse.error?.message ?? 'Message event append failed safely.')
  }

  return {
    response,
    message,
    revisionDetected,
    event,
    responseSummaries,
    warnings,
  }
}

export async function appendProjectEditSessionMockAssistantResponseViaApi(input: {
  projectId: string
  editSessionId: string
  userText: string
  userMessageId?: string
  revisionDetected: boolean
  client?: ProjectEditSessionApiClient
}): Promise<{
  response: ReeditProApiResponseEnvelope<{ message: ProjectEditSessionMessageRecord }>
  message?: ProjectEditSessionMessageRecord
  event?: ProjectEditSessionEventRecord
  responseSummaries: string[]
  warnings: string[]
}> {
  const api = clientFor(input.projectId, input.client)
  const text = input.revisionDetected
    ? 'Mock revision captured. I saved this as session state only, reset approval for safety, and did not start planning, preview, render, workers, providers, or credits.'
    : 'Mock message received. I saved this to the Edit Chat history only; full edit planning opens in a later milestone.'
  const responseSummaries: string[] = []
  const warnings: string[] = []
  const response = await api.messages.append<{ message: ProjectEditSessionMessageRecord }>({
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    role: 'assistant',
    kind: input.revisionDetected ? 'revision_learned' : 'system_note',
    text,
    metadata: {
      rpMilestone: 'RP-EDITSESSION-07',
      respondsToMessageId: input.userMessageId,
      noProviderCallMade: true,
      safety: PROJECT_EDIT_SESSION_API_CLIENT_SAFETY,
    },
  })
  responseSummaries.push(responseSummary(response, 'Append mock assistant response'))
  const message = dataRecord<{ message?: ProjectEditSessionMessageRecord }>(response)?.message
  if (!response.ok) warnings.push(response.error?.message ?? 'Assistant response append failed safely.')

  let event: ProjectEditSessionEventRecord | undefined
  if (message) {
    const eventResponse = await api.events.append<{ event: ProjectEditSessionEventRecord }>({
      projectId: input.projectId,
      editSessionId: input.editSessionId,
      eventType: 'mock_response_created',
      summary: 'Mock assistant response appended without model/provider calls.',
      metadata: {
        messageId: message.id,
        respondsToMessageId: input.userMessageId,
        revisionDetected: input.revisionDetected,
      },
    })
    responseSummaries.push(responseSummary(eventResponse, 'Append mock response event'))
    event = dataRecord<{ event?: ProjectEditSessionEventRecord }>(eventResponse)?.event
    if (!eventResponse.ok) warnings.push(eventResponse.error?.message ?? 'Mock response event append failed safely.')
  }

  return {
    response,
    message,
    event,
    responseSummaries,
    warnings,
  }
}

export async function createProjectEditSessionSnapshotFromMessageViaApi(input: {
  projectId: string
  editSessionId: string
  messageId?: string
  messageText: string
  client?: ProjectEditSessionApiClient
}): Promise<{
  snapshot?: ProjectEditSessionSnapshotRecord
  responseSummaries: string[]
  warnings: string[]
}> {
  const api = clientFor(input.projectId, input.client)
  const response = await api.snapshots.save<{ snapshot: ProjectEditSessionSnapshotRecord }>({
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    kind: 'revision_requested',
    messageId: input.messageId,
    summary: `Mock revision snapshot from message: ${input.messageText.slice(0, 96)}`,
    state: {
      messageText: input.messageText,
      noProgressStarted: true,
      noPreviewCreated: true,
      noRenderStarted: true,
      safety: PROJECT_EDIT_SESSION_API_CLIENT_SAFETY,
    },
  })
  return {
    snapshot: dataRecord<{ snapshot?: ProjectEditSessionSnapshotRecord }>(response)?.snapshot,
    responseSummaries: [responseSummary(response, 'Save revision snapshot')],
    warnings: response.ok ? [] : [response.error?.message ?? 'Revision snapshot save failed safely.'],
  }
}

export async function createProjectEditSessionRevisionFromMessageViaApi(input: {
  projectId: string
  editSessionId: string
  messageId?: string
  messageText: string
  snapshotId?: string
  client?: ProjectEditSessionApiClient
}): Promise<{
  revision?: ProjectEditSessionRevisionRecord
  responseSummaries: string[]
  warnings: string[]
}> {
  const api = clientFor(input.projectId, input.client)
  const response = await api.revisions.save<{ revision: ProjectEditSessionRevisionRecord }>({
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    requestedByMessageId: input.messageId,
    summary: `Mock revision requested: ${input.messageText.slice(0, 96)}`,
    userInstruction: input.messageText,
    resetsApproval: true,
    metadata: {
      rpMilestone: 'RP-EDITSESSION-07',
      snapshotId: input.snapshotId,
      safety: PROJECT_EDIT_SESSION_API_CLIENT_SAFETY,
    },
  })
  return {
    revision: dataRecord<{ revision?: ProjectEditSessionRevisionRecord }>(response)?.revision,
    responseSummaries: [responseSummary(response, 'Save revision record')],
    warnings: response.ok ? [] : [response.error?.message ?? 'Revision save failed safely.'],
  }
}

export async function createProjectEditSessionMemoryUpdateFromMessageViaApi(input: {
  projectId: string
  editSessionId: string
  messageId?: string
  revisionId?: string
  messageText: string
  client?: ProjectEditSessionApiClient
}): Promise<{
  memory?: ProjectEditSessionMemoryRecord
  responseSummaries: string[]
  warnings: string[]
}> {
  const api = clientFor(input.projectId, input.client)
  const response = await api.memory.upsert<{ memory: ProjectEditSessionMemoryRecord }>({
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    layer: 'revision_memory',
    summary: `Latest mock revision request: ${input.messageText.slice(0, 120)}`,
    facts: ['Revision captured from persistent Edit Chat UI.'],
    preferences: [input.messageText],
    warnings: [
      'Mock memory update only. No provider/model, render, worker, preview, credit, media, file-byte, or Supabase write effect occurred.',
    ],
    metadata: {
      rpMilestone: 'RP-EDITSESSION-07',
      updatedFromMessageId: input.messageId,
      updatedFromRevisionId: input.revisionId,
      safety: PROJECT_EDIT_SESSION_API_CLIENT_SAFETY,
    },
  })
  return {
    memory: dataRecord<{ memory?: ProjectEditSessionMemoryRecord }>(response)?.memory,
    responseSummaries: [responseSummary(response, 'Upsert revision memory')],
    warnings: response.ok ? [] : [response.error?.message ?? 'Revision memory update failed safely.'],
  }
}

export async function appendProjectEditSessionChatTurnViaApi(input: {
  projectId: string
  editSessionId: string
  text: string
  client?: ProjectEditSessionApiClient
}): Promise<ProjectEditSessionChatAppendResult> {
  const api = clientFor(input.projectId, input.client)
  const responseSummaries: string[] = []
  const warnings: string[] = []
  const events: ProjectEditSessionEventRecord[] = []
  const user = await appendProjectEditSessionUserMessageViaApi({ ...input, client: api })
  responseSummaries.push(...user.responseSummaries)
  warnings.push(...user.warnings)
  if (user.event) events.push(user.event)

  const assistant = await appendProjectEditSessionMockAssistantResponseViaApi({
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    userText: input.text,
    userMessageId: user.message?.id,
    revisionDetected: user.revisionDetected,
    client: api,
  })
  responseSummaries.push(...assistant.responseSummaries)
  warnings.push(...assistant.warnings)
  if (assistant.event) events.push(assistant.event)

  let snapshot: ProjectEditSessionSnapshotRecord | undefined
  let revision: ProjectEditSessionRevisionRecord | undefined
  let memory: ProjectEditSessionMemoryRecord | undefined
  let memoryUpdates: ProjectEditSessionMemoryRecord[] = []
  let memoryUpdateNotice: ProjectEditSessionMemoryUpdateNoticeModel | undefined

  if (user.revisionDetected) {
    const snapshotResult = await createProjectEditSessionSnapshotFromMessageViaApi({
      projectId: input.projectId,
      editSessionId: input.editSessionId,
      messageId: user.message?.id,
      messageText: input.text,
      client: api,
    })
    snapshot = snapshotResult.snapshot
    responseSummaries.push(...snapshotResult.responseSummaries)
    warnings.push(...snapshotResult.warnings)

    const revisionResult = await createProjectEditSessionRevisionFromMessageViaApi({
      projectId: input.projectId,
      editSessionId: input.editSessionId,
      messageId: user.message?.id,
      messageText: input.text,
      snapshotId: snapshot?.id,
      client: api,
    })
    revision = revisionResult.revision
    responseSummaries.push(...revisionResult.responseSummaries)
    warnings.push(...revisionResult.warnings)

    const memoryResult = await applyMockRevisionMemoryUpdateViaApi({
      projectId: input.projectId,
      editSessionId: input.editSessionId,
      messageId: user.message?.id,
      revisionId: revision?.id,
      text: input.text,
      client: api,
    })
    memoryUpdates = memoryResult.updatedLayers
    memory = memoryUpdates.find((item) => item.layer === 'revision_memory') ?? memoryUpdates[0]
    memoryUpdateNotice = memoryResult.notice
    responseSummaries.push(`Memory update: ${memoryResult.notice.body}`)
    warnings.push(...memoryResult.warnings)

    const updateResponse = await api.sessions.update({
      projectId: input.projectId,
      editSessionId: input.editSessionId,
      patch: {
        status: 'revision_requested',
        approvalStatus: 'reset_after_revision',
        latestPreviewUrl: undefined,
      },
    })
    responseSummaries.push(responseSummary(updateResponse, 'Update session revision status'))
    if (!updateResponse.ok) warnings.push(updateResponse.error?.message ?? 'Session status update failed safely.')

    const eventResponse = await api.events.append<{ event: ProjectEditSessionEventRecord }>({
      projectId: input.projectId,
      editSessionId: input.editSessionId,
      eventType: 'revision_requested',
      summary: 'Mock revision requested from persistent Edit Chat UI; approval reset for safety.',
      metadata: {
        messageId: user.message?.id,
        revisionId: revision?.id,
        snapshotId: snapshot?.id,
      },
    })
    responseSummaries.push(responseSummary(eventResponse, 'Append revision requested event'))
    const event = dataRecord<{ event?: ProjectEditSessionEventRecord }>(eventResponse)?.event
    if (event) events.push(event)
    if (!eventResponse.ok) warnings.push(eventResponse.error?.message ?? 'Revision event append failed safely.')
  } else if (user.message) {
    const memoryResult = await applyMockMemoryUpdateFromMessageViaApi({
      projectId: input.projectId,
      editSessionId: input.editSessionId,
      messageId: user.message.id,
      text: input.text,
      client: api,
    })
    memoryUpdates = memoryResult.updatedLayers
    memory = memoryUpdates[0]
    memoryUpdateNotice = memoryResult.notice
    responseSummaries.push(`Memory update: ${memoryResult.notice.body}`)
    warnings.push(...memoryResult.warnings)
  }

  return {
    ok: Boolean(user.message && assistant.message),
    userMessage: user.message,
    assistantMessage: assistant.message,
    revision,
    snapshot,
    memory,
    memoryUpdates,
    memoryUpdateNotice,
    events,
    responseSummaries,
    warnings,
    revisionDetected: user.revisionDetected,
    safety: PROJECT_EDIT_SESSION_API_CLIENT_SAFETY,
    mockOnly: true,
  }
}
