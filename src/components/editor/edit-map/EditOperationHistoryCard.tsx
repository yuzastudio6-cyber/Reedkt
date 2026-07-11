import { RotateCcw } from 'lucide-react'
import { Badge } from '../../Badge'
import { Button } from '../../Button'
import type { EditMapLocalOperation } from '../../../types'

type EditOperationHistoryCardProps = {
  operations: EditMapLocalOperation[]
  onResetEditMap?: () => void
}

export function EditOperationHistoryCard({ onResetEditMap, operations }: EditOperationHistoryCardProps) {
  const recentOperations = operations.slice(-8).reverse()

  return (
    <section className="inline-chat-card edit-operation-history">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Operation history</span>
          <h3>Local non-destructive operation history</h3>
        </div>
        <Badge accent={operations.length > 0 ? 'cyan' : 'muted'}>{operations.length} ops</Badge>
      </div>
      {recentOperations.length === 0 ? (
        <p className="inline-helper">No local Edit Map changes yet.</p>
      ) : (
        <div className="edit-operation-list">
          {recentOperations.map((operation) => (
            <div className="edit-operation-row" key={operation.id}>
              <strong>{operation.type.replace(/_/g, ' ')}</strong>
              <small>
                {operation.scope?.replace(/_/g, ' ') ?? 'local'} / {operation.status}
              </small>
              {operation.explanation && <p>{operation.explanation}</p>}
            </div>
          ))}
        </div>
      )}
      <div className="inline-card-actions">
        <Button disabled={operations.length === 0} icon={RotateCcw} onClick={onResetEditMap} variant="secondary">
          Reset Edit Map Changes
        </Button>
      </div>
    </section>
  )
}
