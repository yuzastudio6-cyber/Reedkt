import { Badge } from '../Badge'
import type { Accent } from '../../data/mockData'
import type { ProjectEditSessionStatus } from '../../types/project-edit-session'

type ProjectEditSessionStatusBadgeProps = {
  label: string
  status?: ProjectEditSessionStatus
}

function statusAccent(status?: ProjectEditSessionStatus): Accent | 'muted' {
  if (status === 'approved' || status === 'preview_ready') return 'success'
  if (status === 'needs_review' || status === 'revision_requested') return 'warning'
  if (status === 'awaiting_approval') return 'cyan'
  if (status === 'setup_ready') return 'blue'
  return 'muted'
}

export function ProjectEditSessionStatusBadge({ label, status }: ProjectEditSessionStatusBadgeProps) {
  return <Badge accent={statusAccent(status)}>{label}</Badge>
}
