import { Badge } from '../Badge'
import type {
  EditLevelToolCapabilityStatus,
  EditLevelToolRequiredness,
} from '../../types'

type EditLevelToolCapabilityBadgeProps = {
  status: EditLevelToolCapabilityStatus
  requiredness?: EditLevelToolRequiredness
}

export function EditLevelToolCapabilityBadge({
  requiredness,
  status,
}: EditLevelToolCapabilityBadgeProps) {
  const accent = status === 'available_mock' || status === 'available_beta'
    ? 'success'
    : status === 'not_required'
      ? 'muted'
      : 'warning'

  return (
    <span className="edit-level-tool-badge-set">
      <Badge accent={accent}>{formatLabel(status)}</Badge>
      {requiredness && <Badge accent="muted">{formatLabel(requiredness)}</Badge>}
    </span>
  )
}

function formatLabel(value: string) {
  return value.replaceAll('_', ' ')
}
