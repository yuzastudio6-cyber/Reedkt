import { Badge } from '../Badge'
import type {
  EditLevelQAGateRequiredness,
  EditLevelQAGateStatus,
} from '../../types'

type EditLevelQAGateBadgeProps = {
  status: EditLevelQAGateStatus
  requiredness?: EditLevelQAGateRequiredness
}

export function EditLevelQAGateBadge({
  requiredness,
  status,
}: EditLevelQAGateBadgeProps) {
  const accent = status === 'available_mock' || status === 'available_beta'
    ? 'success'
    : status === 'not_required'
      ? 'muted'
      : 'warning'

  return (
    <span className="edit-level-qa-badge-set">
      <Badge accent={accent}>{formatLabel(status)}</Badge>
      {requiredness && <Badge accent="muted">{formatLabel(requiredness)}</Badge>}
    </span>
  )
}

function formatLabel(value: string) {
  if (value === 'available_mock') return 'local ready'
  if (value === 'available_beta') return 'beta ready'
  if (value === 'provider_required') return 'AI service approval required'
  if (value === 'worker_required') return 'private processing required'
  if (value === 'runtime_disabled') return 'approval gated'
  if (value === 'future_gated') return 'future gated'
  if (value === 'not_required') return 'not required'
  return value.replaceAll('_', ' ')
}
