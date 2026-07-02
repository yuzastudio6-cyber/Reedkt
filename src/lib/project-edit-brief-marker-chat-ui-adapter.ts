import type {
  ProjectEditBriefMarkerConfirmationRecord,
  ProjectEditBriefMarkerDrawerModel,
  ProjectEditBriefMarkerIntentRecord,
  ProjectEditBriefMarkerMessageKind,
  ProjectEditBriefMarkerMessageRecord,
  ProjectEditBriefMarkerRecord,
} from '../types/project-edit-brief'
import type { QwenMarkerChatBridgeResult } from '../types/qwen-marker-chat-runtime'
import type {
  ProjectEditBriefMarkerChatApplyResult,
  ProjectEditBriefMarkerChatPanelModel,
  ProjectEditBriefMarkerChatRequest,
  ProjectEditBriefMarkerChatValidationResult,
} from '../types/project-edit-brief-marker-chat'
import {
  createDefaultMockProjectEditBriefApiClient,
  type ProjectEditBriefApiClient,
} from './project-edit-brief-api-client'
import {
  appendProjectEditBriefMarkerMessageViaApi,
  getProjectEditBriefMarkerDrawerViaApi,
  saveProjectEditBriefMarkerIntentViaApi,
  updateProjectEditBriefMarkerViaApi,
} from './project-edit-brief-api-client-adapter'
import {
  PROJECT_EDIT_BRIEF_MARKER_CHAT_SAFETY_FLAGS,
  createProjectEditBriefMarkerChatId,
  createProjectEditBriefMarkerChatExtractionSummary,
  extractProjectEditBriefMarkerIntentFromMessage,
} from './project-edit-brief-marker-chat-rules'

type MarkerChatBetaAppendData = {
  message?: ProjectEditBriefMarkerMessageRecord
  assistantMessage?: ProjectEditBriefMarkerMessageRecord
  intent?: ProjectEditBriefMarkerIntentRecord
  confirmation?: ProjectEditBriefMarkerConfirmationRecord
  marker?: ProjectEditBriefMarkerRecord
  runtimeSource?: 'qwen_live' | 'deterministic_fallback'
  fallbackUsed?: boolean
  fallbackReason?: string
  qwenRuntime?: Pick<QwenMarkerChatBridgeResult,
    | 'ok'
    | 'status'
    | 'runtimeStatus'
    | 'fallbackStatus'
    | 'providerCallMade'
    | 'modelCallMade'
    | 'qwenCallMade'
    | 'publicSummary'
    | 'warnings'
  > & {
    runtimeSource?: 'qwen_live' | 'deterministic_fallback'
  }
}

type MarkerChatRequestInput = {
  markerId: string
  messageText: string
}

function defaultClient(client?: ProjectEditBriefApiClient): ProjectEditBriefApiClient {
  return client ?? createDefaultMockProjectEditBriefApiClient()
}

function titleCase(value: string | undefined): string {
  if (!value) return 'Not set'
  return value.replace(/[-_]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function responseModeLabel(aiMode: ProjectEditBriefMarkerRecord['aiMode']): string {
  if (aiMode === 'off') return 'AI mode off: store marker note only'
  if (aiMode === 'confirm_only') return 'Confirm-only mock response'
  if (aiMode === 'ask_clarifying_questions') return 'Mock clarifying questions when needed'
  return 'Mock option suggestions'
}

export function validateProjectEditBriefMarkerChatRequest(
  request: ProjectEditBriefMarkerChatRequest,
): ProjectEditBriefMarkerChatValidationResult {
  const errors: string[] = []
  if (!request.projectId) errors.push('Project ID is required.')
  if (!request.editSessionId) errors.push('Edit Session ID is required.')
  if (!request.briefId) errors.push('Edit Brief ID is required.')
  if (!request.markerId) errors.push('Marker ID is required.')
  if (!request.messageText.trim()) errors.push('Marker Chat message is required.')
  return {
    ok: errors.length === 0,
    errors,
    warnings: [
      'Marker Chat validation is local and deterministic.',
    ],
    mockOnly: true,
    ...PROJECT_EDIT_BRIEF_MARKER_CHAT_SAFETY_FLAGS,
  }
}

export function createProjectEditBriefMarkerChatBoundarySummary(): string {
  return 'Marker Chat is mock/local by default and scoped to this marker. It uses local deterministic intent unless approved beta mode calls Qwen 3.7 through the backend server route, never from browser code. No DeepSeek, embeddings, vector DB, media processing, render, Supabase, workers, or credits run.'
}

export function createProjectEditBriefMarkerChatNoticeModel() {
  return {
    title: 'Marker Chat boundary',
    body: createProjectEditBriefMarkerChatBoundarySummary(),
    mockOnly: true as const,
    ...PROJECT_EDIT_BRIEF_MARKER_CHAT_SAFETY_FLAGS,
  }
}

export function createProjectEditBriefMarkerChatPanelModel(
  drawer: ProjectEditBriefMarkerDrawerModel,
): ProjectEditBriefMarkerChatPanelModel {
  return {
    markerId: drawer.marker.id,
    title: drawer.marker.title,
    aiMode: drawer.marker.aiMode,
    messages: [...drawer.messages].sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    intent: drawer.intent,
    confirmations: [...drawer.confirmations].sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    statusLabel: drawer.statusLabel,
    responseModeLabel: responseModeLabel(drawer.marker.aiMode),
    boundarySummary: createProjectEditBriefMarkerChatBoundarySummary(),
    canSendMessage: drawer.marker.status !== 'archived',
    warnings: drawer.warnings,
    mockOnly: true,
    ...PROJECT_EDIT_BRIEF_MARKER_CHAT_SAFETY_FLAGS,
  }
}

export async function loadProjectEditBriefMarkerChatPanelForUI(
  markerId: string,
  client?: ProjectEditBriefApiClient,
): Promise<ProjectEditBriefMarkerChatPanelModel | undefined> {
  const drawerResponse = await getProjectEditBriefMarkerDrawerViaApi(markerId, client)
  return drawerResponse.drawer ? createProjectEditBriefMarkerChatPanelModel(drawerResponse.drawer) : undefined
}

function messageKindForAssistant(responseKind: string): ProjectEditBriefMarkerMessageKind {
  if (responseKind === 'mock_clarifying_question') return 'clarification_question'
  if (responseKind === 'mock_confirmation') return 'confirmation'
  if (responseKind === 'mock_suggestions') return 'intent_update'
  return 'system_note'
}

async function saveIntentViaClient(
  marker: ProjectEditBriefMarkerRecord,
  intentDraft: Partial<ProjectEditBriefMarkerIntentRecord>,
  client?: ProjectEditBriefApiClient,
): Promise<ProjectEditBriefMarkerIntentRecord | undefined> {
  const response = await saveProjectEditBriefMarkerIntentViaApi({
    projectId: marker.projectId,
    editSessionId: marker.editSessionId,
    briefId: marker.briefId,
    markerId: marker.id,
    action: intentDraft.action,
    status: intentDraft.status,
    instruction: intentDraft.instruction,
    timeRangeLabel: intentDraft.timeRangeLabel,
    startTimeSeconds: intentDraft.startTimeSeconds,
    endTimeSeconds: intentDraft.endTimeSeconds,
    visualBehavior: intentDraft.visualBehavior,
    audioBehavior: intentDraft.audioBehavior,
    captionBehavior: intentDraft.captionBehavior,
    assetRequirement: intentDraft.assetRequirement,
    providedAssetIds: intentDraft.providedAssetIds,
    priority: intentDraft.priority,
    confidence: intentDraft.confidence,
    blockingNeeds: intentDraft.blockingNeeds,
    doNotCopyNotes: intentDraft.doNotCopyNotes,
    plannerHints: intentDraft.plannerHints,
    latestUserMessageId: intentDraft.latestUserMessageId,
    metadata: intentDraft.metadata,
  }, defaultClient(client))
  return response.intent
}

async function saveConfirmationViaClient(
  marker: ProjectEditBriefMarkerRecord,
  intent: ProjectEditBriefMarkerIntentRecord,
  summary: string,
  client?: ProjectEditBriefApiClient,
): Promise<ProjectEditBriefMarkerConfirmationRecord | undefined> {
  const response = await defaultClient(client).confirmations.save<{ confirmation: ProjectEditBriefMarkerConfirmationRecord }>({
    projectId: marker.projectId,
    editSessionId: marker.editSessionId,
    briefId: marker.briefId,
    markerId: marker.id,
    intentId: intent.id,
    summary,
    confirmedByUser: true,
    aiMode: marker.aiMode,
    metadata: {
      source: 'rp_editbrief_07_marker_chat',
      mockConfirmation: true,
    },
  })
  return response.data?.confirmation
}

async function mirrorLiveQwenMarkerChatResultIntoLocalState(input: {
  betaData: MarkerChatBetaAppendData
  client?: ProjectEditBriefApiClient
  marker: ProjectEditBriefMarkerRecord
}): Promise<{
  userMessage?: ProjectEditBriefMarkerMessageRecord
  assistantMessage?: ProjectEditBriefMarkerMessageRecord
  intent?: ProjectEditBriefMarkerIntentRecord
  confirmation?: ProjectEditBriefMarkerConfirmationRecord
  updatedMarker?: ProjectEditBriefMarkerRecord
}> {
  const client = defaultClient(input.client)
  const betaData = input.betaData
  const marker = input.marker
  const userMessage = betaData.message
    ? (await appendProjectEditBriefMarkerMessageViaApi({
        id: betaData.message.id,
        projectId: marker.projectId,
        editSessionId: marker.editSessionId,
        briefId: marker.briefId,
        markerId: marker.id,
        role: betaData.message.role,
        kind: betaData.message.kind,
        text: betaData.message.text,
        relatedIntentId: betaData.message.relatedIntentId,
        metadata: {
          ...(betaData.message.metadata ?? {}),
          mirroredFromBackendQwenBeta: true,
          scopedToMarkerOnly: true,
        },
      }, client)).message
    : undefined
  const intent = betaData.intent
    ? await saveIntentViaClient(marker, {
        ...betaData.intent,
        latestUserMessageId: userMessage?.id ?? betaData.intent.latestUserMessageId,
        metadata: {
          ...(betaData.intent.metadata ?? {}),
          mirroredFromBackendQwenBeta: true,
        },
      }, client)
    : undefined
  const assistantMessage = betaData.assistantMessage
    ? (await appendProjectEditBriefMarkerMessageViaApi({
        id: betaData.assistantMessage.id,
        projectId: marker.projectId,
        editSessionId: marker.editSessionId,
        briefId: marker.briefId,
        markerId: marker.id,
        role: betaData.assistantMessage.role,
        kind: betaData.assistantMessage.kind,
        text: betaData.assistantMessage.text,
        relatedIntentId: intent?.id ?? betaData.assistantMessage.relatedIntentId,
        metadata: {
          ...(betaData.assistantMessage.metadata ?? {}),
          mirroredFromBackendQwenBeta: true,
          scopedToMarkerOnly: true,
        },
      }, client)).message
    : undefined
  const confirmation = betaData.confirmation && intent
    ? await saveConfirmationViaClient(marker, intent, betaData.confirmation.summary, client)
    : undefined
  const updatedMarker = betaData.marker
    ? (await updateProjectEditBriefMarkerViaApi({
        markerId: marker.id,
        patch: {
          status: betaData.marker.status,
          intentId: intent?.id ?? betaData.marker.intentId ?? marker.intentId,
          qaStatus: betaData.marker.qaStatus,
          metadata: {
            ...(marker.metadata ?? {}),
            ...(betaData.marker.metadata ?? {}),
            mirroredFromBackendQwenBeta: true,
            noPlannerExecution: true,
          },
        },
      }, client)).marker
    : undefined

  return {
    userMessage: userMessage ?? betaData.message,
    assistantMessage: assistantMessage ?? betaData.assistantMessage,
    intent: intent ?? betaData.intent,
    confirmation: confirmation ?? betaData.confirmation,
    updatedMarker: updatedMarker ?? betaData.marker,
  }
}

export async function applyProjectEditBriefMarkerChatExtractionViaApi(
  marker: ProjectEditBriefMarkerRecord,
  userMessage: ProjectEditBriefMarkerMessageRecord,
  client?: ProjectEditBriefApiClient,
): Promise<ProjectEditBriefMarkerChatApplyResult> {
  const extraction = extractProjectEditBriefMarkerIntentFromMessage({
    marker,
    messageText: userMessage.text,
    userMessageId: userMessage.id,
  })
  const intent = extraction.intentDraft
    ? await saveIntentViaClient(marker, extraction.intentDraft, client)
    : undefined
  let assistantMessage: ProjectEditBriefMarkerMessageRecord | undefined
  if (extraction.responseText && extraction.responseKind !== 'none') {
    const assistantResponse = await appendProjectEditBriefMarkerMessageViaApi({
      projectId: marker.projectId,
      editSessionId: marker.editSessionId,
      briefId: marker.briefId,
      markerId: marker.id,
      role: 'assistant',
      kind: messageKindForAssistant(extraction.responseKind),
      text: extraction.responseText,
      relatedIntentId: intent?.id,
      metadata: {
        source: 'rp_editbrief_07_marker_chat',
        responseKind: extraction.responseKind,
        mockOnly: true,
      },
    }, client)
    assistantMessage = assistantResponse.message
  }

  let confirmation: ProjectEditBriefMarkerConfirmationRecord | undefined
  if (intent && extraction.responseKind === 'mock_confirmation' && extraction.responseText) {
    confirmation = await saveConfirmationViaClient(marker, intent, extraction.responseText, client)
  }

  const markerUpdate = await updateProjectEditBriefMarkerViaApi({
    markerId: marker.id,
    patch: {
      status: extraction.markerStatusSuggestion,
      intentId: intent?.id ?? marker.intentId,
      metadata: {
        ...(marker.metadata ?? {}),
        markerChatLastExtraction: createProjectEditBriefMarkerChatExtractionSummary(extraction),
        markerChatImplemented: true,
        noPlannerExecution: true,
      },
    },
  }, client)

  return {
    ok: Boolean(userMessage && intent),
    userMessage,
    assistantMessage,
    intent,
    confirmation,
    updatedMarker: markerUpdate.marker,
    extraction,
    warnings: [
      ...extraction.warnings,
      'Marker Chat remained scoped to the marker and did not write to main Edit Chat.',
    ],
    mockOnly: true,
    ...PROJECT_EDIT_BRIEF_MARKER_CHAT_SAFETY_FLAGS,
  }
}

export async function sendProjectEditBriefMarkerChatMessageViaApi(
  input: MarkerChatRequestInput,
  client?: ProjectEditBriefApiClient,
): Promise<ProjectEditBriefMarkerChatApplyResult | undefined> {
  const drawerResponse = await getProjectEditBriefMarkerDrawerViaApi(input.markerId, client)
  const drawer = drawerResponse.drawer
  if (!drawer) return undefined
  const request: ProjectEditBriefMarkerChatRequest = {
    projectId: drawer.marker.projectId,
    editSessionId: drawer.marker.editSessionId,
    briefId: drawer.marker.briefId,
    markerId: drawer.marker.id,
    messageText: input.messageText,
    aiMode: drawer.marker.aiMode,
    mockOnly: true,
  }
  const validation = validateProjectEditBriefMarkerChatRequest(request)
  if (!validation.ok) {
    return {
      ok: false,
      extraction: {
        id: createProjectEditBriefMarkerChatId('project-edit-brief-marker-chat-validation'),
        projectId: request.projectId,
        editSessionId: request.editSessionId,
        briefId: request.briefId,
        markerId: request.markerId,
        processingMode: 'message_only',
        extractionStatus: 'failed_validation',
        responseKind: 'mock_boundary_notice',
        responseText: validation.errors.join(' '),
        markerStatusSuggestion: 'draft',
        blockingNeeds: validation.errors,
        plannerHints: [],
        confidence: 'low',
        warnings: validation.warnings,
        mockOnly: true,
        ...PROJECT_EDIT_BRIEF_MARKER_CHAT_SAFETY_FLAGS,
      },
      warnings: validation.errors,
      mockOnly: true,
      ...PROJECT_EDIT_BRIEF_MARKER_CHAT_SAFETY_FLAGS,
    }
  }

  const userResponse = await appendProjectEditBriefMarkerMessageViaApi({
    projectId: request.projectId,
    editSessionId: request.editSessionId,
    briefId: request.briefId,
    markerId: request.markerId,
    runtimeMode: 'qwen_beta',
    role: 'user',
    kind: 'note',
    text: request.messageText.trim(),
    metadata: {
      source: 'rp_qwen_beta_01_marker_chat_request',
      scopedToMarkerOnly: true,
      backendQwenBetaRequested: true,
    },
  }, client)

  const betaData = userResponse.data as MarkerChatBetaAppendData | undefined
  if (betaData?.qwenRuntime && betaData.message) {
    const runtimeSource = betaData.runtimeSource ?? betaData.qwenRuntime.runtimeSource ?? (betaData.qwenRuntime.status === 'qwen_beta_completed' ? 'qwen_live' : 'deterministic_fallback')
    const mirrored = await mirrorLiveQwenMarkerChatResultIntoLocalState({
      betaData,
      client,
      marker: drawer.marker,
    })
    return {
      ok: betaData.qwenRuntime.ok,
      userMessage: mirrored.userMessage,
      assistantMessage: mirrored.assistantMessage,
      intent: mirrored.intent,
      confirmation: mirrored.confirmation,
      updatedMarker: mirrored.updatedMarker,
      runtimeSource,
      fallbackReason: betaData.fallbackReason,
      extraction: {
        id: createProjectEditBriefMarkerChatId('qwen-beta-marker-chat'),
        projectId: request.projectId,
        editSessionId: request.editSessionId,
        briefId: request.briefId,
        markerId: request.markerId,
        processingMode: betaData.qwenRuntime.status === 'qwen_beta_completed' ? 'extract_and_confirm' : 'extract_intent',
        extractionStatus: betaData.qwenRuntime.status === 'qwen_beta_completed' ? 'processed_confirmed' : 'processed_intent_draft',
        responseKind: betaData.qwenRuntime.status === 'qwen_beta_completed' ? 'mock_confirmation' : 'mock_boundary_notice',
        responseText: runtimeSource === 'qwen_live'
          ? 'Qwen 3.7 understood this marker.'
          : `Qwen was unavailable; ReEditPro used the local intent fallback${betaData.fallbackReason ? ` (${betaData.fallbackReason})` : ''}.`,
        markerStatusSuggestion: betaData.marker?.status ?? drawer.marker.status,
        blockingNeeds: [],
        plannerHints: [],
        confidence: betaData.qwenRuntime.status === 'qwen_beta_completed' ? 'medium' : 'low',
        warnings: betaData.qwenRuntime.warnings ?? [],
        mockOnly: true,
        ...PROJECT_EDIT_BRIEF_MARKER_CHAT_SAFETY_FLAGS,
      },
      warnings: [
        ...(betaData.qwenRuntime.warnings ?? []),
        runtimeSource === 'qwen_live'
          ? 'Qwen 3.7 understood this marker through the backend-only beta route.'
          : 'Qwen was unavailable; ReEditPro used the local intent fallback.',
        'Marker Chat beta runtime remained backend-only; browser code received structured metadata only.',
      ],
      mockOnly: true,
      ...PROJECT_EDIT_BRIEF_MARKER_CHAT_SAFETY_FLAGS,
    }
  }

  if (!userResponse.message) return undefined
  const fallbackResult = await applyProjectEditBriefMarkerChatExtractionViaApi(drawer.marker, userResponse.message, client)
  return {
    ...fallbackResult,
    runtimeSource: 'deterministic_fallback',
    fallbackReason: 'browser_mock_transport',
  }
}

export function createProjectEditBriefMarkerChatPanelSummary(model: ProjectEditBriefMarkerChatPanelModel): string {
  const intentText = model.intent ? titleCase(model.intent.action) : 'No intent yet'
  return `${model.messages.length} message(s), ${intentText}, ${model.confirmations.length} confirmation(s).`
}
