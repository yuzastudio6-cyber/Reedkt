import { Badge } from '../../Badge'
import type {
  EditMapLocalOperation,
  RevisionOperationClassification,
} from '../../../types'

type RevisionOperationListProps = {
  operations: EditMapLocalOperation[]
  classifications?: RevisionOperationClassification[]
}

function label(value: string | undefined) {
  return value ? value.replace(/_/g, ' ') : 'not set'
}

export function RevisionOperationList({ classifications = [], operations }: RevisionOperationListProps) {
  const classificationByOperationId = new Map(classifications.map((classification) => [classification.editOperationId, classification]))

  return (
    <section className="inline-chat-card revision-operation-list">
      <div className="inline-card-heading">
        <div>
          <span className="section-eyebrow">Pending Edit Map operations</span>
          <h3>Operations available for revision</h3>
        </div>
        <Badge accent={operations.length ? 'warning' : 'success'}>{operations.length} pending</Badge>
      </div>
      {operations.length === 0 ? (
        <p className="inline-helper">No pending Edit Map operations.</p>
      ) : (
        <div className="revision-operation-stack">
          {operations.map((operation) => {
            const classification = classificationByOperationId.get(operation.id)
            return (
              <article className="revision-operation-row" key={operation.id}>
                <div>
                  <strong>{label(operation.type)}</strong>
                  <small>{label(operation.scope)} · {operation.targetElementId ?? operation.targetGroupId ?? operation.targetSystemId ?? 'no target'}</small>
                </div>
                {classification && (
                  <small>
                    {label(classification.impact)} · {label(classification.executionMode)} · {label(classification.costPolicy)}
                  </small>
                )}
                {operation.explanation && <p>{operation.explanation}</p>}
                {classification && <p>{classification.explanation}</p>}
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
