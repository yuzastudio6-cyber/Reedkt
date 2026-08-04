import { RotateCcw, Network } from 'lucide-react'
import { Badge } from '../../Badge'
import { Button } from '../../Button'
import type { EditMapSummary } from '../../../types'

function statusLabel(status: EditMapSummary['status']) {
  return status.replace(/_/g, ' ')
}

type EditMapToolbarProps = {
  summary?: EditMapSummary | null
  onCreateEditMap?: () => void
  onResetEditMap?: () => void
}

export function EditMapToolbar({ onCreateEditMap, onResetEditMap, summary }: EditMapToolbarProps) {
  return (
    <section className="inline-chat-card edit-map-toolbar">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Post-preview editor</span>
          <h3>Edit Map</h3>
        </div>
        {summary && <Badge accent={summary.status === 'has_local_changes' ? 'warning' : 'cyan'}>{statusLabel(summary.status)}</Badge>}
      </div>
      {summary && (
        <div className="edit-map-stat-grid">
          <span><strong>{summary.systemCount}</strong><small>Systems</small></span>
          <span><strong>{summary.groupCount}</strong><small>Groups</small></span>
          <span><strong>{summary.elementCount}</strong><small>Elements</small></span>
          <span><strong>{summary.operationCount}</strong><small>Local ops</small></span>
          <span><strong>{summary.hiddenGroupCount + summary.hiddenElementCount}</strong><small>Hidden</small></span>
          <span><strong>{summary.lockedGroupCount + summary.lockedElementCount}</strong><small>Locked</small></span>
        </div>
      )}
      <div className="inline-card-actions">
        <Button icon={Network} onClick={onCreateEditMap} variant="secondary">
          Create/Open Edit Map
        </Button>
        <Button disabled={!summary?.operationCount} icon={RotateCcw} onClick={onResetEditMap} variant="ghost">
          Reset Local Edits
        </Button>
      </div>
    </section>
  )
}
