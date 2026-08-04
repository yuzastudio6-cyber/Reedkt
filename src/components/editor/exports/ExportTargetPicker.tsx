import { Badge } from '../../Badge'
import type { ExportTarget } from '../../../types'

type ExportTargetPickerProps = {
  targets: ExportTarget[]
  onToggleTarget?: (targetId: string, enabled: boolean) => void
}

export function ExportTargetPicker({ onToggleTarget, targets }: ExportTargetPickerProps) {
  return (
    <section className="export-target-picker">
      {targets.map((target) => (
        <button
          className={`export-target-chip ${target.enabled ? 'export-target-chip--enabled' : ''}`}
          key={target.id}
          onClick={() => onToggleTarget?.(target.id, !target.enabled)}
          type="button"
        >
          <span>{target.label}</span>
          <Badge accent={target.enabled ? 'success' : 'muted'}>{target.enabled ? 'Enabled' : 'Off'}</Badge>
        </button>
      ))}
    </section>
  )
}
