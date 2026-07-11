import { CheckCircle2, RotateCcw } from 'lucide-react'
import { Button } from '../../Button'
import type { EditBriefStatus } from '../../../types'

type EditBriefToolbarProps = {
  status: EditBriefStatus
  operationCount: number
  ready: boolean
  onResetBrief?: () => void
  onMarkReady?: () => void
}

function formatLabel(value: string) {
  return value.replaceAll('_', ' ')
}

function statusTone(status: EditBriefStatus) {
  if (status === 'ready' || status === 'used_in_plan') return 'success'
  if (status === 'superseded') return 'attention'
  return 'neutral'
}

export function EditBriefToolbar({
  onMarkReady,
  onResetBrief,
  operationCount,
  ready,
  status,
}: EditBriefToolbarProps) {
  const alreadyReady = status === 'ready'

  return (
    <section className="edit-brief-toolbar">
      <div className="edit-brief-toolbar-row">
        <div>
          <span className="section-eyebrow">Brief status</span>
          <h3>{alreadyReady ? 'Edit Brief ready' : 'Optional direction'}</h3>
          <p className="inline-helper">
            {operationCount === 0
              ? 'Skip this if the prompt already says enough. Use it when you want more structured control.'
              : `${operationCount} brief change${operationCount === 1 ? '' : 's'} in this edit.`}
          </p>
        </div>
        <span className={`edit-brief-status edit-brief-status-${ready ? 'success' : statusTone(status)}`}>
          <span aria-hidden="true" />
          {ready ? 'Ready to use' : formatLabel(status)}
        </span>
      </div>

      <div className="edit-brief-toolbar-actions">
        <Button
          data-testid="edit-brief-mark-ready"
          disabled={alreadyReady || !ready}
          icon={CheckCircle2}
          onClick={onMarkReady}
          size="sm"
          variant="primary"
        >
          Use Brief in Plan
        </Button>
        <Button disabled={operationCount === 0} icon={RotateCcw} onClick={onResetBrief} size="sm" variant="ghost">
          Reset Brief
        </Button>
      </div>
    </section>
  )
}
