import type {
  ChatMessageRole,
  ReeditProChatAction,
  ReeditProChatCard,
  ReeditProChatCardType,
  ReeditProChatMessage,
  ReeditProChatMessageStatus,
  ReeditProChatMessageType,
} from '../../types'
import type { ID, JSONObject } from '../../types/shared'

type LiveMode = 'off' | 'polite' | 'assertive'

type ChatMessageBuilderOptions = {
  actions?: ReeditProChatAction[]
  actionIds?: ReeditProChatMessage['actionIds']
  ariaLive?: LiveMode
  cards?: ReeditProChatCard[]
  content?: string
  id?: ID
  label?: string
  metadata?: JSONObject
  order?: number
  status?: ReeditProChatMessageStatus
}

type ChatCardBuilderOptions = Omit<ReeditProChatCard, 'id' | 'type'>

let runtimeMessageCounter = 0

export function createRuntimeMessageId(prefix: string) {
  runtimeMessageCounter += 1
  return `${prefix}-${Date.now()}-${runtimeMessageCounter}`
}

export function createChatCard(
  id: ID,
  type: ReeditProChatCardType,
  options: ChatCardBuilderOptions = {},
): ReeditProChatCard {
  return {
    id,
    type,
    ...options,
  }
}

export function createChatMessage(
  role: ChatMessageRole,
  type: ReeditProChatMessageType,
  options: ChatMessageBuilderOptions = {},
): ReeditProChatMessage {
  return {
    id: options.id ?? createRuntimeMessageId(type),
    role,
    type,
    content: options.content,
    status: options.status ?? 'idle',
    cards: options.cards,
    actions: options.actions,
    actionIds: options.actionIds,
    createdAt: new Date().toISOString(),
    order: options.order,
    ariaLive: options.ariaLive,
    label: options.label,
    metadata: options.metadata,
  }
}

export function createUserTextMessage(content: string, options: ChatMessageBuilderOptions = {}) {
  return createChatMessage('user', 'user_message', {
    status: 'success',
    ariaLive: 'polite',
    ...options,
    content,
  })
}

export function createAttachmentEventMessage(content: string, options: ChatMessageBuilderOptions = {}) {
  return createChatMessage('user', 'attachment_event', {
    status: 'success',
    ...options,
    content,
  })
}

export function createAssistantTextMessage(content: string, options: ChatMessageBuilderOptions = {}) {
  return createChatMessage('assistant', 'assistant_message', {
    status: 'idle',
    ...options,
    content,
  })
}

export function createAssistantQuestionMessage(content: string, options: ChatMessageBuilderOptions = {}) {
  return createChatMessage('assistant', 'assistant_question', {
    status: 'pending',
    ...options,
    content,
  })
}

export function createPlanReviewMessage(content: string, options: ChatMessageBuilderOptions = {}) {
  return createChatMessage('assistant', 'assistant_plan_review', {
    status: 'pending',
    ...options,
    content,
  })
}

export function createCreditApprovalMessage(content: string, options: ChatMessageBuilderOptions = {}) {
  return createChatMessage('assistant', 'assistant_credit_approval', {
    status: 'pending',
    ...options,
    content,
  })
}

export function createProgressUpdateMessage(content: string, options: ChatMessageBuilderOptions = {}) {
  return createChatMessage('assistant', 'assistant_progress_update', {
    status: 'generating',
    ariaLive: 'polite',
    ...options,
    content,
  })
}

export function createPreviewReadyMessage(content: string, options: ChatMessageBuilderOptions = {}) {
  return createChatMessage('assistant', 'assistant_preview_ready', {
    status: 'preview_ready',
    ariaLive: 'polite',
    ...options,
    content,
  })
}

export function createRevisionResponseMessage(content: string, options: ChatMessageBuilderOptions = {}) {
  return createChatMessage('assistant', 'assistant_revision_response', {
    status: 'success',
    ariaLive: 'polite',
    ...options,
    content,
  })
}

export function createAssistantErrorMessage(content: string, options: ChatMessageBuilderOptions = {}) {
  return createChatMessage('assistant', 'assistant_error', {
    status: 'error',
    ariaLive: 'assertive',
    ...options,
    content,
  })
}

export function createSystemStatusMessage(content: string, options: ChatMessageBuilderOptions = {}) {
  return createChatMessage('system', 'system_status', {
    status: 'idle',
    ...options,
    content,
  })
}

export function createAssistantSystemStatusMessage(content: string, options: ChatMessageBuilderOptions = {}) {
  return createChatMessage('assistant', 'system_status', {
    status: 'idle',
    ...options,
    content,
  })
}

export function createReferenceEventMessage(content: string, options: ChatMessageBuilderOptions = {}) {
  return createChatMessage('user', 'reference_event', {
    status: 'success',
    ...options,
    content,
  })
}

export function createSFXAssistantMessage(content: string, options: ChatMessageBuilderOptions = {}) {
  return createAssistantTextMessage(content, {
    label: 'Sound effects',
    ...options,
  })
}

export function createSFXPlanMessage(content: string, options: ChatMessageBuilderOptions = {}) {
  return createPlanReviewMessage(content, {
    label: 'Sound effects',
    ...options,
  })
}

export function createSFXCreditApprovalMessage(content: string, options: ChatMessageBuilderOptions = {}) {
  return createCreditApprovalMessage(content, {
    label: 'Sound effects',
    ...options,
  })
}

export function createSFXProgressMessage(content: string, options: ChatMessageBuilderOptions = {}) {
  return createProgressUpdateMessage(content, {
    label: 'Sound effects',
    ...options,
  })
}

export function createSFXRevisionMessage(content: string, options: ChatMessageBuilderOptions = {}) {
  return createRevisionResponseMessage(content, {
    label: 'Sound effects',
    ...options,
  })
}

export function createMusicAssistantMessage(content: string, options: ChatMessageBuilderOptions = {}) {
  return createAssistantTextMessage(content, {
    label: 'Music',
    ...options,
  })
}

export function createMusicPlanMessage(content: string, options: ChatMessageBuilderOptions = {}) {
  return createPlanReviewMessage(content, {
    label: 'Music',
    ...options,
  })
}

export function createMusicCreditApprovalMessage(content: string, options: ChatMessageBuilderOptions = {}) {
  return createCreditApprovalMessage(content, {
    label: 'Music',
    ...options,
  })
}

export function createMusicProgressMessage(content: string, options: ChatMessageBuilderOptions = {}) {
  return createProgressUpdateMessage(content, {
    label: 'Music',
    ...options,
  })
}

export function createMusicRevisionMessage(content: string, options: ChatMessageBuilderOptions = {}) {
  return createRevisionResponseMessage(content, {
    label: 'Music',
    ...options,
  })
}
