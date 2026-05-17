import { useId, useState, type ReactNode } from 'react'
import { Badge } from '../Badge'
import type { ChatCardPriority, ChatCardStatus } from '../../types/reeditpro'

type InlinePlanCardShellProps = {
  title: string
  eyebrow?: string
  helper?: string
  priority?: ChatCardPriority
  status?: ChatCardStatus
  defaultExpanded?: boolean
  compactSummary?: ReactNode
  actions?: ReactNode
  children: ReactNode
  className?: string
}

const priorityLabels: Record<ChatCardPriority, string> = {
  advanced_plan_detail: 'Advanced',
  developer_detail: 'Developer',
  required_user_action: 'Action',
  safety_detail: 'Safety',
  user_summary: 'Summary',
}

const statusLabels: Record<ChatCardStatus, string> = {
  approved: 'Approved',
  blocking: 'Blocking',
  complete: 'Complete',
  confirmed: 'Confirmed',
  needs_input: 'Needs input',
  not_started: 'Not started',
  ready: 'Ready',
  warning: 'Warning',
}

function statusAccent(status?: ChatCardStatus) {
  if (status === 'blocking') {
    return 'danger'
  }

  if (status === 'warning' || status === 'needs_input') {
    return 'warning'
  }

  if (status === 'approved' || status === 'confirmed' || status === 'complete') {
    return 'success'
  }

  if (status === 'ready') {
    return 'cyan'
  }

  return 'muted'
}

function priorityAccent(priority?: ChatCardPriority) {
  if (priority === 'required_user_action') {
    return 'warning'
  }

  if (priority === 'developer_detail') {
    return 'violet'
  }

  if (priority === 'safety_detail') {
    return 'blue'
  }

  if (priority === 'advanced_plan_detail') {
    return 'cyan'
  }

  return 'muted'
}

export function InlinePlanCardShell({
  actions,
  children,
  className = '',
  compactSummary,
  defaultExpanded = true,
  eyebrow,
  helper,
  priority,
  status,
  title,
}: InlinePlanCardShellProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const contentId = useId()

  return (
    <section className={`inline-chat-card inline-plan-card-shell ${className}`}>
      <div className="inline-plan-card-header">
        <button
          aria-controls={contentId}
          aria-expanded={expanded}
          className="inline-plan-card-toggle"
          onClick={() => setExpanded((current) => !current)}
          type="button"
        >
          <span aria-hidden="true" className="inline-plan-card-caret">{expanded ? '-' : '+'}</span>
          <span>
            {eyebrow && <span className="section-eyebrow">{eyebrow}</span>}
            <strong>{title}</strong>
          </span>
        </button>

        <div className="inline-plan-card-badges">
          {status && <Badge accent={statusAccent(status)}>{statusLabels[status]}</Badge>}
          {priority && <Badge accent={priorityAccent(priority)}>{priorityLabels[priority]}</Badge>}
          {actions}
        </div>
      </div>

      {helper && <p className="inline-helper">{helper}</p>}
      {compactSummary && <div className="inline-plan-card-summary">{compactSummary}</div>}

      {expanded && (
        <div className="inline-plan-card-body" id={contentId}>
          {children}
        </div>
      )}
    </section>
  )
}
