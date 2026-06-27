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
  return value.replaceAll('_', ' ')
}
