import { Badge } from '../../Badge'
import type { ProjectEditBriefQAStatus } from '../../../types/project-edit-brief'

type ProjectEditBriefQABadgeProps = {
  status?: ProjectEditBriefQAStatus
  label?: string
}

function accentFor(status: ProjectEditBriefQAStatus | undefined) {
  if (status === 'passed') return 'success' as const
  if (status === 'warning' || status === 'needs_asset' || status === 'needs_clarification') return 'warning' as const
  if (status === 'conflict' || status === 'blocked') return 'danger' as const
  return 'muted' as const
}

function labelFor(status: ProjectEditBriefQAStatus | undefined): string {
  if (!status) return 'QA not checked'
  return status.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function ProjectEditBriefQABadge({ label, status }: ProjectEditBriefQABadgeProps) {
  return <Badge accent={accentFor(status)}>{label ?? labelFor(status)}</Badge>
}
