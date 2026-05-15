import type {
  ChatMessageRecord,
  ChatSessionRecord,
  InlineChatCardRecord,
  InlineChatCardType,
  JSONObject,
  ProcessingStatus,
} from '../../types'
import type {
  CreateChatSessionRequest,
  InlineChatCardResponse,
  SendChatMessageRequest,
} from '../contracts/chat-editor-contracts'
import type { MockDatabase } from '../mock/mock-database'
import { createMockId, insertMockRecord, nowIso } from '../mock/mock-database'
import { ok, type ServiceResult } from '../service-result'

export function startChatEditorSession(
  db: MockDatabase,
  input: CreateChatSessionRequest,
): ServiceResult<ChatSessionRecord> {
  const chatSession: ChatSessionRecord = {
    id: createMockId('chat-session'),
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    userId: input.userId,
    status: 'open',
    title: input.title ?? 'ReeditPro chat editor',
    startedAt: nowIso(),
    lastMessageAt: nowIso(),
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: { mockOnly: true },
  }

  return ok(insertMockRecord(db, 'chatSessions', chatSession))
}

export function sendUserMessage(
  db: MockDatabase,
  input: Omit<SendChatMessageRequest, 'role'> & { role?: ChatMessageRecord['role'] },
): ServiceResult<ChatMessageRecord> {
  const message: ChatMessageRecord = {
    id: createMockId('chat-message'),
    chatSessionId: input.chatSessionId,
    projectId: input.projectId,
    role: input.role ?? 'user',
    content: input.content,
    inlineCardIds: [],
    attachmentIds: [],
    processingStatus: 'completed',
    visibleToUser: input.visibleToUser ?? true,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: { mockOnly: true },
  }

  return ok(insertMockRecord(db, 'chatMessages', message))
}

export function attachClipsToChat(
  db: MockDatabase,
  input: SendChatMessageRequest,
): ServiceResult<ChatMessageRecord> {
  return sendUserMessage(db, {
    ...input,
    role: 'user',
    content: input.content || 'Attached source clips in the order I filmed them.',
  })
}

export function createInlineSourceSequenceCard(
  db: MockDatabase,
  chatSessionId: string,
  chatMessageId: string,
  projectId: string,
  payload: JSONObject,
): ServiceResult<InlineChatCardRecord> {
  return createInlineCard(db, {
    chatSessionId,
    chatMessageId,
    projectId,
    cardType: 'source_sequence',
    title: 'Source Sequence Map',
    summary: 'Uploaded order is source context, not automatically final edit order.',
    payload,
    status: 'completed',
  })
}

export function createInlineAIQuestionCard(
  db: MockDatabase,
  chatSessionId: string,
  chatMessageId: string,
  projectId: string,
  questions: string[],
): ServiceResult<InlineChatCardRecord> {
  return createInlineCard(db, {
    chatSessionId,
    chatMessageId,
    projectId,
    cardType: 'ai_question',
    title: 'AI clarification',
    summary: 'Questions the planner would ask before expensive work.',
    payload: { questions },
    status: 'waiting_user_input',
  })
}

export function createInlineEditPlanCard(
  db: MockDatabase,
  chatSessionId: string,
  chatMessageId: string,
  projectId: string,
  payload: JSONObject,
): ServiceResult<InlineChatCardRecord> {
  return createInlineCard(db, {
    chatSessionId,
    chatMessageId,
    projectId,
    cardType: 'edit_plan',
    title: 'Approval-ready edit plan',
    summary: 'Generation remains blocked until plan and credits are approved.',
    payload,
    status: 'waiting_user_approval',
    approvalStatus: 'pending',
  })
}

export function createInlineCreditEstimateCard(
  db: MockDatabase,
  chatSessionId: string,
  chatMessageId: string,
  projectId: string,
  payload: JSONObject,
): ServiceResult<InlineChatCardRecord> {
  return createInlineCard(db, {
    chatSessionId,
    chatMessageId,
    projectId,
    cardType: 'credit_estimate',
    title: 'Credit estimate',
    summary: 'Credits must be approved and reserved before generation starts.',
    payload,
    status: 'waiting_user_approval',
    approvalStatus: 'pending',
  })
}

export function createPreviewReadyCard(
  db: MockDatabase,
  chatSessionId: string,
  chatMessageId: string,
  projectId: string,
  payload: JSONObject,
): ServiceResult<InlineChatCardRecord> {
  return createInlineCard(db, {
    chatSessionId,
    chatMessageId,
    projectId,
    cardType: 'preview_ready',
    title: 'Preview ready',
    summary: 'Mock preview placeholder is ready for chat-native review.',
    payload,
    status: 'completed',
    approvalStatus: 'pending',
  })
}

function createInlineCard(
  db: MockDatabase,
  input: {
    chatSessionId: string
    chatMessageId: string
    projectId: string
    cardType: InlineChatCardType
    title: string
    summary: string
    payload: JSONObject
    status: ProcessingStatus
    approvalStatus?: InlineChatCardRecord['approvalStatus']
  },
): ServiceResult<InlineChatCardRecord> {
  const card: InlineChatCardRecord = {
    id: createMockId('inline-card'),
    chatSessionId: input.chatSessionId,
    chatMessageId: input.chatMessageId,
    projectId: input.projectId,
    cardType: input.cardType,
    title: input.title,
    summary: input.summary,
    payload: input.payload,
    status: input.status,
    approvalStatus: input.approvalStatus,
    actionIds: [],
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: { mockOnly: true },
  }

  return ok(insertMockRecord(db, 'inlineChatCards', card))
}

export type ChatCardResult = InlineChatCardResponse
