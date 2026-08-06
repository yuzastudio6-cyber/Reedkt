import type { ReactNode } from 'react'
import type { ChatMessageRole, ReeditProChatMessageStatus, ReeditProChatMessageType } from '../../types'

export type ChatMessageGroupPosition = 'single' | 'first' | 'middle' | 'last'

type ChatMessageProps = {
  ariaLabel?: string
  ariaLive?: 'off' | 'polite' | 'assertive'
  children: ReactNode
  className?: string
  compactLabel?: boolean
  groupPosition?: ChatMessageGroupPosition
  id?: string
  label?: string
  role: ChatMessageRole | 'ai'
  status?: ReeditProChatMessageStatus
  type?: ReeditProChatMessageType
}

function normalizeRole(role: ChatMessageProps['role']): ChatMessageRole {
  return role === 'ai' ? 'assistant' : role
}

function defaultLabel(role: ChatMessageRole) {
  if (role === 'user') return 'You'
  if (role === 'system') return 'System'
  if (role === 'agent') return 'Editing agent'
  if (role === 'worker') return 'Worker'
  return 'ReeditPro AI'
}

export function ChatMessage({
  ariaLabel,
  ariaLive = 'off',
  children,
  className = '',
  compactLabel = false,
  groupPosition = 'single',
  id,
  label,
  role,
  status = 'idle',
  type = role === 'user' ? 'user_message' : 'assistant_message',
}: ChatMessageProps) {
  const normalizedRole = normalizeRole(role)
  const legacyRoleClass = role === 'ai' || normalizedRole === 'assistant' ? ' chat-native-message-ai' : ''

  return (
    <article
      aria-label={ariaLabel}
      aria-live={ariaLive}
      className={`chat-native-message chat-native-message-${normalizedRole}${legacyRoleClass} chat-message-${type} chat-message-status-${status} ${className}`.trim()}
      data-compact-label={compactLabel ? 'true' : 'false'}
      data-group-position={groupPosition}
      data-testid={type === 'assistant_error' ? 'approval-error-message' : undefined}
      data-message-status={status}
      data-message-type={type}
      data-role={normalizedRole}
      id={id}
    >
      <strong className={`chat-message-label ${compactLabel ? 'chat-message-label-compact' : ''}`.trim()}>{label ?? defaultLabel(normalizedRole)}</strong>
      <div>{children}</div>
    </article>
  )
}
