import { CheckCircle2, RotateCcw } from 'lucide-react'
import { Badge } from '../../Badge'
import { Button } from '../../Button'
import type { SourceLibraryStatus } from '../../../types'

type SourceLibraryToolbarProps = {
  status: SourceLibraryStatus
  operationCount: number
  onResetAll?: () => void
  onConfirmLibrary?: () => void
}

function formatStatus(value: string) {
  return value.replaceAll('_', ' ')
}

export function SourceLibraryToolbar({
  onConfirmLibrary,
  onResetAll,
  operationCount,
  status,
}: SourceLibraryToolbarProps) {
  const confirmed = status === 'confirmed'

  return (
    <section className="inline-chat-card source-library-toolbar">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Asset roles</span>
          <h3>{confirmed ? 'Source Library confirmed' : 'Review asset roles'}</h3>
        </div>
        <Badge accent={confirmed ? 'success' : 'warning'}>{formatStatus(status)}</Badge>
      </div>

      <div className="source-library-toolbar-row">
        <p className="inline-helper">
          {operationCount === 0 ? 'No local asset role changes' : `${operationCount} local asset role changes`}
        </p>
        <div className="source-library-toolbar-actions">
          <Button disabled={confirmed} icon={CheckCircle2} onClick={onConfirmLibrary} variant={confirmed ? 'secondary' : 'primary'}>
            Confirm Source Library
          </Button>
          <Button disabled={operationCount === 0} icon={RotateCcw} onClick={onResetAll} variant="secondary">
            Reset All
          </Button>
        </div>
      </div>
    </section>
  )
}
